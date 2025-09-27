import { Request } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { CacheService } from '../services/CacheService';

export interface Context {
  req: Request;
  databaseService: DatabaseService;
  cacheService: CacheService;
  user?: any;
}
