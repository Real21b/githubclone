const http = require('http');
const https = require('https');
const { performance } = require('perf_hooks');

class PerformanceTester {
  constructor() {
    this.results = {
      monolith: [],
      microservices: []
    };
  }

  async testEndpoint(url, label) {
    const startTime = performance.now();
    
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https') ? https : http;
      
      const req = client.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          resolve({
            label,
            statusCode: res.statusCode,
            responseTime: Math.round(responseTime * 100) / 100,
            dataSize: data.length,
            timestamp: new Date().toISOString()
          });
        });
      });
      
      req.on('error', (error) => {
        reject({
          label,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject({
          label,
          error: 'Request timeout',
          timestamp: new Date().toISOString()
        });
      });
    });
  }

  async runTests() {
    console.log('🚀 Starting Performance Tests...\n');

    const tests = [
      { url: 'http://localhost:3000/graphql', label: 'Monolith GraphQL' },
      { url: 'http://localhost:3001/health', label: 'Auth Service Health' },
      { url: 'http://localhost:3002/health', label: 'Core Service Health' },
      { url: 'http://localhost:3003/health', label: 'File Service Health' },
      { url: 'http://localhost/health', label: 'API Gateway Health' }
    ];

    for (const test of tests) {
      try {
        console.log(`Testing ${test.label}...`);
        const result = await this.testEndpoint(test.url, test.label);
        
        if (result.error) {
          console.log(`❌ ${test.label}: ${result.error}`);
        } else {
          console.log(`✅ ${test.label}: ${result.responseTime}ms (${result.statusCode})`);
        }
        
        this.results[test.label.includes('Monolith') ? 'monolith' : 'microservices'].push(result);
        
        // Wait between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.log(`❌ ${test.label}: ${error.message || error.error}`);
      }
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Performance Test Summary');
    console.log('============================');

    const monolithResults = this.results.monolith.filter(r => !r.error);
    const microservicesResults = this.results.microservices.filter(r => !r.error);

    if (monolithResults.length > 0) {
      const avgMonolith = monolithResults.reduce((sum, r) => sum + r.responseTime, 0) / monolithResults.length;
      console.log(`\n🏢 Monolith Average Response Time: ${Math.round(avgMonolith * 100) / 100}ms`);
    }

    if (microservicesResults.length > 0) {
      const avgMicroservices = microservicesResults.reduce((sum, r) => sum + r.responseTime, 0) / microservicesResults.length;
      console.log(`🔧 Microservices Average Response Time: ${Math.round(avgMicroservices * 100) / 100}ms`);
    }

    console.log('\n📈 Detailed Results:');
    [...monolithResults, ...microservicesResults].forEach(result => {
      console.log(`  ${result.label}: ${result.responseTime}ms (${result.statusCode})`);
    });

    console.log('\n💡 Recommendations:');
    if (monolithResults.length > 0 && microservicesResults.length > 0) {
      const monolithAvg = monolithResults.reduce((sum, r) => sum + r.responseTime, 0) / monolithResults.length;
      const microservicesAvg = microservicesResults.reduce((sum, r) => sum + r.responseTime, 0) / microservicesResults.length;
      
      if (microservicesAvg < monolithAvg) {
        console.log('  ✅ Microservices architecture shows better performance');
      } else {
        console.log('  ⚠️  Monolith shows better performance - consider optimization');
      }
    }
  }
}

// Run tests
const tester = new PerformanceTester();
tester.runTests().catch(console.error);
