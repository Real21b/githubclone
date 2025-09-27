const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');
const fs = require('fs');

class UltraPerformanceSuite {
  constructor() {
    this.results = {
      benchmarks: [],
      loadTests: [],
      stressTests: [],
      summary: {}
    };
    this.startTime = Date.now();
  }

  // 🚀 Benchmark individual endpoints
  async benchmarkEndpoint(url, name, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      iterations = 100,
      concurrency = 10
    } = options;

    console.log(`\n🎯 Benchmarking ${name} (${iterations} iterations, ${concurrency} concurrent)`);
    
    const results = [];
    const startTime = performance.now();

    // Create batches for concurrency
    const batches = Math.ceil(iterations / concurrency);
    
    for (let batch = 0; batch < batches; batch++) {
      const batchPromises = [];
      const batchSize = Math.min(concurrency, iterations - (batch * concurrency));
      
      for (let i = 0; i < batchSize; i++) {
        batchPromises.push(this.makeRequest(url, method, body, headers));
      }
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Small delay between batches
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    const benchmark = this.analyzeResults(name, results, totalTime);
    this.results.benchmarks.push(benchmark);

    return benchmark;
  }

  // 🔥 Load testing with increasing load
  async loadTest(url, name, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      duration = 60000, // 1 minute
      rampUpTime = 10000, // 10 seconds
      maxUsers = 100
    } = options;

    console.log(`\n🔥 Load Testing ${name} (${duration/1000}s duration, ${maxUsers} max users)`);
    
    const results = [];
    const startTime = performance.now();
    const endTime = startTime + duration;
    
    let currentUsers = 0;
    const userIncrement = maxUsers / (rampUpTime / 1000); // Users per second
    
    const activeRequests = new Set();
    
    while (performance.now() < endTime) {
      const elapsed = performance.now() - startTime;
      
      // Ramp up users
      if (elapsed < rampUpTime) {
        currentUsers = Math.min(maxUsers, elapsed / 1000 * userIncrement);
      }
      
      // Maintain current user load
      const targetRequests = Math.floor(currentUsers);
      const currentRequests = activeRequests.size;
      
      if (currentRequests < targetRequests) {
        // Add more requests
        for (let i = currentRequests; i < targetRequests; i++) {
          const requestPromise = this.makeRequest(url, method, body, headers);
          activeRequests.add(requestPromise);
          
          requestPromise.finally(() => {
            activeRequests.delete(requestPromise);
          });
        }
      }
      
      // Wait before next iteration
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Wait for remaining requests
    await Promise.allSettled(Array.from(activeRequests));
    
    const loadTestResult = {
      name,
      duration: duration / 1000,
      maxUsers,
      results: results.slice(0, 1000) // Limit results
    };
    
    this.results.loadTests.push(loadTestResult);
    return loadTestResult;
  }

  // 💥 Stress testing to find breaking point
  async stressTest(url, name, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      maxUsers = 500,
      increment = 25,
      stepDuration = 30000 // 30 seconds per step
    } = options;

    console.log(`\n💥 Stress Testing ${name} (up to ${maxUsers} users)`);
    
    const steps = [];
    let currentUsers = increment;
    
    while (currentUsers <= maxUsers) {
      console.log(`  Testing with ${currentUsers} concurrent users...`);
      
      const stepResults = [];
      const startTime = performance.now();
      const endTime = startTime + stepDuration;
      const activeRequests = new Set();
      
      while (performance.now() < endTime) {
        // Maintain current user load
        while (activeRequests.size < currentUsers) {
          const requestPromise = this.makeRequest(url, method, body, headers);
          activeRequests.add(requestPromise);
          
          requestPromise.finally(() => {
            activeRequests.delete(requestPromise);
          });
        }
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      // Wait for remaining requests
      const finalResults = await Promise.allSettled(Array.from(activeRequests));
      
      const step = {
        users: currentUsers,
        duration: stepDuration / 1000,
        results: finalResults.map(result => 
          result.status === 'fulfilled' ? result.value : { success: false, error: result.reason.message }
        )
      };
      
      steps.push(step);
      
      // Check if we should continue
      const errorRate = step.results.filter(r => !r.success).length / step.results.length;
      if (errorRate > 0.1) { // 10% error rate threshold
        console.log(`  ⚠️ High error rate (${(errorRate * 100).toFixed(1)}%) at ${currentUsers} users`);
        break;
      }
      
      currentUsers += increment;
    }
    
    const stressTestResult = {
      name,
      maxUsers: currentUsers - increment,
      steps,
      breakingPoint: currentUsers
    };
    
    this.results.stressTests.push(stressTestResult);
    return stressTestResult;
  }

  // 🌐 Make HTTP request
  async makeRequest(url, method = 'GET', body = null, headers = {}) {
    return new Promise((resolve) => {
      const startTime = performance.now();
      const urlObj = new URL(url);
      const isHttps = urlObj.protocol === 'https:';
      const httpModule = isHttps ? https : http;
      
      const options = {
        hostname: urlObj.hostname,
        port: urlObj.port || (isHttps ? 443 : 80),
        path: urlObj.pathname + urlObj.search,
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'UltraPerformanceSuite/1.0',
          ...headers
        },
        timeout: 10000
      };

      const req = httpModule.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            success: true,
            statusCode: res.statusCode,
            responseTime: Math.round(responseTime * 100) / 100,
            responseSize: data.length,
            headers: res.headers
          });
        });
      });
      
      req.on('error', (error) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        resolve({
          success: false,
          error: error.message,
          responseTime: Math.round(responseTime * 100) / 100,
          responseSize: 0
        });
      });
      
      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          responseTime: 10000,
          responseSize: 0
        });
      });
      
      if (body) {
        req.write(typeof body === 'string' ? body : JSON.stringify(body));
      }
      
      req.end();
    });
  }

  // 📊 Analyze benchmark results
  analyzeResults(name, results, totalTime) {
    const successfulResults = results.filter(r => r.success);
    const failedResults = results.filter(r => !r.success);
    
    if (successfulResults.length === 0) {
      return {
        name,
        status: 'FAILED',
        totalRequests: results.length,
        successfulRequests: 0,
        failedRequests: failedResults.length,
        successRate: 0,
        throughput: 0,
        averageResponseTime: 0,
        errorRate: 100
      };
    }
    
    const responseTimes = successfulResults.map(r => r.responseTime);
    const statusCodes = successfulResults.map(r => r.statusCode);
    
    responseTimes.sort((a, b) => a - b);
    
    const averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const p50ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.5)];
    const p95ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.95)];
    const p99ResponseTime = responseTimes[Math.floor(responseTimes.length * 0.99)];
    
    const throughput = results.length / (totalTime / 1000);
    const successRate = (successfulResults.length / results.length) * 100;
    
    return {
      name,
      status: successRate >= 95 ? 'EXCELLENT' : successRate >= 80 ? 'GOOD' : 'POOR',
      totalRequests: results.length,
      successfulRequests: successfulResults.length,
      failedRequests: failedResults.length,
      successRate: Math.round(successRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      averageResponseTime: Math.round(averageResponseTime * 100) / 100,
      p50ResponseTime: Math.round(p50ResponseTime * 100) / 100,
      p95ResponseTime: Math.round(p95ResponseTime * 100) / 100,
      p99ResponseTime: Math.round(p99ResponseTime * 100) / 100,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      errorRate: Math.round((failedResults.length / results.length) * 100 * 100) / 100,
      statusCodeDistribution: this.getStatusCodeDistribution(statusCodes)
    };
  }

  // 📈 Get status code distribution
  getStatusCodeDistribution(statusCodes) {
    const distribution = {};
    for (const code of statusCodes) {
      const category = Math.floor(code / 100) * 100;
      const key = `${category}-${category + 99}`;
      distribution[key] = (distribution[key] || 0) + 1;
    }
    return distribution;
  }

  // 🎯 Run complete performance suite
  async runSuite() {
    console.log('🚀 Starting Ultra Performance Suite...\n');
    
    const tests = [
      {
        url: 'http://localhost/health',
        name: 'Health Check',
        method: 'GET',
        iterations: 1000,
        concurrency: 50
      },
      {
        url: 'http://localhost/graphql',
        name: 'GraphQL API',
        method: 'POST',
        body: { query: '{ getHealth { status timestamp } }' },
        iterations: 500,
        concurrency: 25
      },
      {
        url: 'http://localhost:3001/health',
        name: 'Auth Service',
        method: 'GET',
        iterations: 800,
        concurrency: 40
      },
      {
        url: 'http://localhost:3002/health',
        name: 'Core Service',
        method: 'GET',
        iterations: 800,
        concurrency: 40
      },
      {
        url: 'http://localhost:3003/health',
        name: 'File Service',
        method: 'GET',
        iterations: 800,
        concurrency: 40
      }
    ];

    // Run benchmarks
    for (const test of tests) {
      await this.benchmarkEndpoint(test.url, test.name, test);
    }

    // Run load tests
    await this.loadTest('http://localhost/health', 'Health Check Load Test', {
      duration: 30000,
      maxUsers: 50
    });

    await this.loadTest('http://localhost/graphql', 'GraphQL Load Test', {
      method: 'POST',
      body: { query: '{ getHealth { status } }' },
      duration: 60000,
      maxUsers: 100
    });

    // Run stress tests
    await this.stressTest('http://localhost/health', 'Health Check Stress Test', {
      maxUsers: 200,
      increment: 25
    });

    this.generateReport();
  }

  // 📊 Generate comprehensive report
  generateReport() {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n🏆 ULTRA PERFORMANCE SUITE REPORT');
    console.log('=====================================');
    console.log(`⏱️  Total Test Duration: ${Math.round(totalTime / 1000)}s\n`);

    // Benchmark Results
    console.log('📊 BENCHMARK RESULTS:');
    console.log('---------------------');
    this.results.benchmarks.forEach(benchmark => {
      const statusEmoji = benchmark.status === 'EXCELLENT' ? '🟢' : 
                         benchmark.status === 'GOOD' ? '🟡' : '🔴';
      
      console.log(`${statusEmoji} ${benchmark.name}:`);
      console.log(`   Success Rate: ${benchmark.successRate}%`);
      console.log(`   Throughput: ${benchmark.throughput} req/s`);
      console.log(`   Avg Response Time: ${benchmark.averageResponseTime}ms`);
      console.log(`   P95 Response Time: ${benchmark.p95ResponseTime}ms`);
      console.log(`   P99 Response Time: ${benchmark.p99ResponseTime}ms`);
      console.log('');
    });

    // Load Test Results
    if (this.results.loadTests.length > 0) {
      console.log('🔥 LOAD TEST RESULTS:');
      console.log('---------------------');
      this.results.loadTests.forEach(loadTest => {
        console.log(`📈 ${loadTest.name}:`);
        console.log(`   Duration: ${loadTest.duration}s`);
        console.log(`   Max Users: ${loadTest.maxUsers}`);
        console.log('');
      });
    }

    // Stress Test Results
    if (this.results.stressTests.length > 0) {
      console.log('💥 STRESS TEST RESULTS:');
      console.log('------------------------');
      this.results.stressTests.forEach(stressTest => {
        console.log(`⚡ ${stressTest.name}:`);
        console.log(`   Max Users: ${stressTest.maxUsers}`);
        console.log(`   Breaking Point: ${stressTest.breakingPoint}`);
        console.log('');
      });
    }

    // Overall Performance Grade
    const avgSuccessRate = this.results.benchmarks.reduce((sum, b) => sum + b.successRate, 0) / this.results.benchmarks.length;
    const avgThroughput = this.results.benchmarks.reduce((sum, b) => sum + b.throughput, 0) / this.results.benchmarks.length;
    const avgResponseTime = this.results.benchmarks.reduce((sum, b) => sum + b.averageResponseTime, 0) / this.results.benchmarks.length;

    let performanceGrade = 'F';
    if (avgSuccessRate >= 99 && avgThroughput >= 2000 && avgResponseTime <= 50) {
      performanceGrade = 'A+';
    } else if (avgSuccessRate >= 95 && avgThroughput >= 1000 && avgResponseTime <= 100) {
      performanceGrade = 'A';
    } else if (avgSuccessRate >= 90 && avgThroughput >= 500 && avgResponseTime <= 200) {
      performanceGrade = 'B';
    } else if (avgSuccessRate >= 80 && avgThroughput >= 200 && avgResponseTime <= 500) {
      performanceGrade = 'C';
    }

    console.log('🎯 OVERALL PERFORMANCE GRADE: ' + performanceGrade);
    console.log(`📊 Average Success Rate: ${Math.round(avgSuccessRate * 100) / 100}%`);
    console.log(`⚡ Average Throughput: ${Math.round(avgThroughput * 100) / 100} req/s`);
    console.log(`⏱️  Average Response Time: ${Math.round(avgResponseTime * 100) / 100}ms`);

    // Save detailed report
    const reportData = {
      timestamp: new Date().toISOString(),
      duration: totalTime,
      performanceGrade,
      summary: {
        avgSuccessRate,
        avgThroughput,
        avgResponseTime
      },
      benchmarks: this.results.benchmarks,
      loadTests: this.results.loadTests,
      stressTests: this.results.stressTests
    };

    fs.writeFileSync('performance-report.json', JSON.stringify(reportData, null, 2));
    console.log('\n📄 Detailed report saved to: performance-report.json');
    
    console.log('\n🎉 Ultra Performance Suite Complete!');
  }
}

// Run the suite
const suite = new UltraPerformanceSuite();
suite.runSuite().catch(console.error);
