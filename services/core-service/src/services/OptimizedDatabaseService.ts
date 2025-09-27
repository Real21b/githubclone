import { Pool, PoolClient } from 'pg';
import { logger } from '../utils/logger';

interface QueryOptions {
  timeout?: number;
  retries?: number;
  useCache?: boolean;
}

interface QueryMetrics {
  totalQueries: number;
  successfulQueries: number;
  failedQueries: number;
  averageExecutionTime: number;
  slowQueries: number;
}

export class OptimizedDatabaseService {
  private pool: Pool;
  private metrics: QueryMetrics = {
    totalQueries: 0,
    successfulQueries: 0,
    failedQueries: 0,
    averageExecutionTime: 0,
    slowQueries: 0
  };

  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // 🚀 Performance optimizations
      max: 50,                    // Increased connection pool
      min: 10,                    // Minimum connections
      acquireTimeoutMillis: 30000,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
      // Advanced pooling options
      allowExitOnIdle: false,
      application_name: 'githubclone-core',
      // Connection settings
      statement_timeout: 30000,
      query_timeout: 30000,
      connectionTimeoutMillis: 10000,
      // SSL settings for production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    this.pool.on('error', (err) => {
      logger.error('Database pool error:', err);
    });

    this.pool.on('connect', (client) => {
      logger.debug('New database client connected');
    });

    this.pool.on('acquire', (client) => {
      logger.debug('Database client acquired');
    });

    this.pool.on('remove', (client) => {
      logger.debug('Database client removed');
    });
  }

  async connect(): Promise<void> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      
      // Initialize performance optimizations
      await this.optimizeDatabase();
      
      logger.info('Optimized database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error);
      throw error;
    }
  }

  // 🚀 Optimized query execution with retries and metrics
  async query<T = any>(text: string, params?: any[], options: QueryOptions = {}): Promise<T[]> {
    const startTime = Date.now();
    const maxRetries = options.retries || 3;
    const timeout = options.timeout || 30000;
    
    this.metrics.totalQueries++;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      let client: PoolClient | null = null;
      
      try {
        client = await this.pool.connect();
        
        // Set query timeout
        await client.query(`SET statement_timeout = ${timeout}`);
        
        const result = await client.query(text, params);
        const executionTime = Date.now() - startTime;
        
        // Update metrics
        this.metrics.successfulQueries++;
        this.updateAverageExecutionTime(executionTime);
        
        if (executionTime > 1000) { // Slow query threshold
          this.metrics.slowQueries++;
          logger.warn(`Slow query detected: ${executionTime}ms`, { 
            query: text.substring(0, 100),
            params: params?.length || 0
          });
        }
        
        logger.debug(`Query executed successfully: ${executionTime}ms`, { 
          query: text.substring(0, 50),
          rows: result.rowCount 
        });
        
        return result.rows;
        
      } catch (error) {
        logger.error(`Query attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          this.metrics.failedQueries++;
          throw error;
        }
        
        // Exponential backoff for retries
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 100));
        
      } finally {
        if (client) {
          client.release();
        }
      }
    }
    
    throw new Error('Max retries exceeded');
  }

  // 🎯 Optimized batch operations
  async batchQuery<T = any>(queries: Array<{text: string, params?: any[]}>): Promise<T[][]> {
    const client = await this.pool.connect();
    const results: T[][] = [];
    
    try {
      await client.query('BEGIN');
      
      for (const query of queries) {
        const result = await client.query(query.text, query.params);
        results.push(result.rows);
      }
      
      await client.query('COMMIT');
      return results;
      
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Batch query failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // 📊 Optimized pagination
  async paginatedQuery<T = any>(
    text: string, 
    params: any[], 
    page: number = 1, 
    limit: number = 20
  ): Promise<{data: T[], total: number, page: number, limit: number}> {
    const offset = (page - 1) * limit;
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM (${text}) as count_query`;
    const countResult = await this.query<{total: string}>(countQuery, params);
    const total = parseInt(countResult[0]?.total || '0');
    
    // Get paginated data
    const paginatedQuery = `${text} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const data = await this.query<T>(paginatedQuery, [...params, limit, offset]);
    
    return {
      data,
      total,
      page,
      limit
    };
  }

  // 🔍 Optimized search with full-text search
  async search<T = any>(
    table: string,
    searchTerm: string,
    columns: string[],
    options: {
      limit?: number;
      offset?: number;
      orderBy?: string;
      orderDirection?: 'ASC' | 'DESC';
    } = {}
  ): Promise<T[]> {
    const { limit = 20, offset = 0, orderBy = 'created_at', orderDirection = 'DESC' } = options;
    
    // Build full-text search query
    const searchColumns = columns.map(col => `to_tsvector('english', ${col})`).join(' || ');
    const searchQuery = `to_tsquery('english', $1)`;
    
    const query = `
      SELECT *, ts_rank(${searchColumns}, ${searchQuery}) as rank
      FROM ${table}
      WHERE ${searchColumns} @@ ${searchQuery}
      ORDER BY rank DESC, ${orderBy} ${orderDirection}
      LIMIT $2 OFFSET $3
    `;
    
    return this.query<T>(query, [searchTerm, limit, offset]);
  }

  // 🚀 Connection pooling optimization
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  // 📈 Database performance optimization
  private async optimizeDatabase(): Promise<void> {
    try {
      // Enable query optimization
      await this.query('SET random_page_cost = 1.1');
      await this.query('SET effective_cache_size = 256MB');
      await this.query('SET work_mem = 4MB');
      await this.query('SET maintenance_work_mem = 32MB');
      
      // Enable parallel queries
      await this.query('SET max_parallel_workers_per_gather = 2');
      await this.query('SET max_parallel_workers = 4');
      
      // Optimize for SSD
      await this.query('SET effective_io_concurrency = 200');
      
      logger.info('Database optimizations applied successfully');
    } catch (error) {
      logger.warn('Could not apply database optimizations:', error);
    }
  }

  // 📊 Performance monitoring
  getMetrics(): QueryMetrics {
    return { ...this.metrics };
  }

  async getDatabaseStats(): Promise<any> {
    try {
      const stats = await this.query(`
        SELECT 
          schemaname,
          tablename,
          attname,
          n_distinct,
          correlation
        FROM pg_stats 
        WHERE schemaname = 'public'
        ORDER BY tablename, attname
      `);
      
      const connectionStats = await this.query(`
        SELECT 
          state,
          COUNT(*) as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state
      `);
      
      return {
        stats,
        connectionStats,
        poolStats: {
          totalCount: this.pool.totalCount,
          idleCount: this.pool.idleCount,
          waitingCount: this.pool.waitingCount
        },
        metrics: this.getMetrics()
      };
    } catch (error) {
      logger.error('Error getting database stats:', error);
      return null;
    }
  }

  // 🔧 Index optimization
  async analyzeTable(tableName: string): Promise<void> {
    try {
      await this.query(`ANALYZE ${tableName}`);
      logger.info(`Table ${tableName} analyzed successfully`);
    } catch (error) {
      logger.error(`Error analyzing table ${tableName}:`, error);
    }
  }

  // 🚀 Create optimized indexes
  async createOptimizedIndexes(): Promise<void> {
    const indexes = [
      // User indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_username ON users(username)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at)',
      
      // Repository indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_owner_id ON repositories(owner_id)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_name ON repositories(name)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_created_at ON repositories(created_at)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_stars ON repositories(stars_count)',
      
      // Full-text search indexes
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_search ON users USING gin(to_tsvector(\'english\', username || \' \' || COALESCE(bio, \'\')))',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_search ON repositories USING gin(to_tsvector(\'english\', name || \' \' || COALESCE(description, \'\')))',
      
      // Composite indexes for common queries
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_owner_created ON repositories(owner_id, created_at DESC)',
      'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_repositories_public_stars ON repositories(is_private, stars_count DESC) WHERE is_private = false'
    ];

    for (const indexQuery of indexes) {
      try {
        await this.query(indexQuery);
        logger.info(`Index created successfully: ${indexQuery.substring(0, 50)}...`);
      } catch (error) {
        logger.warn(`Could not create index: ${error.message}`);
      }
    }
  }

  private updateAverageExecutionTime(executionTime: number): void {
    const total = this.metrics.successfulQueries;
    this.metrics.averageExecutionTime = 
      ((this.metrics.averageExecutionTime * (total - 1)) + executionTime) / total;
  }

  async close(): Promise<void> {
    await this.pool.end();
    logger.info('Optimized database connection closed');
  }
}
