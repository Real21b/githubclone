const http = require('http');
const { performance } = require('perf_hooks');

class MicroservicesTester {
  constructor() {
    this.results = {
      services: [],
      endpoints: []
    };
  }

  async testService(serviceName, baseUrl, endpoints) {
    console.log(`\n🔍 Testing ${serviceName}...`);
    
    const serviceResult = {
      name: serviceName,
      baseUrl,
      status: 'unknown',
      endpoints: [],
      responseTime: 0,
      error: null
    };

    for (const endpoint of endpoints) {
      try {
        const startTime = performance.now();
        const result = await this.testEndpoint(`${baseUrl}${endpoint.path}`, endpoint.name);
        const endTime = performance.now();
        
        const endpointResult = {
          name: endpoint.name,
          path: endpoint.path,
          status: result.statusCode,
          responseTime: Math.round((endTime - startTime) * 100) / 100,
          success: result.statusCode >= 200 && result.statusCode < 300
        };

        serviceResult.endpoints.push(endpointResult);
        serviceResult.responseTime += endpointResult.responseTime;

        if (endpointResult.success) {
          console.log(`  ✅ ${endpoint.name}: ${endpointResult.responseTime}ms (${endpointResult.status})`);
        } else {
          console.log(`  ❌ ${endpoint.name}: ${endpointResult.responseTime}ms (${endpointResult.status})`);
        }

      } catch (error) {
        console.log(`  ❌ ${endpoint.name}: ${error.message}`);
        serviceResult.endpoints.push({
          name: endpoint.name,
          path: endpoint.path,
          status: 'error',
          responseTime: 0,
          success: false,
          error: error.message
        });
      }
    }

    // Calculate average response time
    const successfulEndpoints = serviceResult.endpoints.filter(e => e.success);
    serviceResult.responseTime = successfulEndpoints.length > 0 
      ? Math.round((serviceResult.responseTime / successfulEndpoints.length) * 100) / 100 
      : 0;

    // Determine overall service status
    const allSuccessful = serviceResult.endpoints.every(e => e.success);
    serviceResult.status = allSuccessful ? 'healthy' : 'unhealthy';

    this.results.services.push(serviceResult);
    return serviceResult;
  }

  async testEndpoint(url, name) {
    return new Promise((resolve, reject) => {
      const req = http.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            data: data,
            headers: res.headers
          });
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  async runTests() {
    console.log('🚀 Starting Microservices Architecture Test...\n');

    const services = [
      {
        name: 'API Gateway (Nginx)',
        baseUrl: 'http://localhost',
        endpoints: [
          { name: 'Health Check', path: '/health' },
          { name: 'Frontend', path: '/' }
        ]
      },
      {
        name: 'Auth Service',
        baseUrl: 'http://localhost:3001',
        endpoints: [
          { name: 'Health Check', path: '/health' },
          { name: 'Auth Endpoint', path: '/auth' }
        ]
      },
      {
        name: 'Core Service (GraphQL)',
        baseUrl: 'http://localhost:3002',
        endpoints: [
          { name: 'Health Check', path: '/health' },
          { name: 'GraphQL Endpoint', path: '/graphql' }
        ]
      },
      {
        name: 'File Service',
        baseUrl: 'http://localhost:3003',
        endpoints: [
          { name: 'Health Check', path: '/health' },
          { name: 'Files Endpoint', path: '/files' }
        ]
      },
      {
        name: 'Frontend',
        baseUrl: 'http://localhost:3000',
        endpoints: [
          { name: 'Home Page', path: '/' }
        ]
      }
    ];

    for (const service of services) {
      await this.testService(service.name, service.baseUrl, service.endpoints);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay between services
    }

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Microservices Test Summary');
    console.log('=============================');

    const healthyServices = this.results.services.filter(s => s.status === 'healthy');
    const unhealthyServices = this.results.services.filter(s => s.status === 'unhealthy');

    console.log(`\n✅ Healthy Services: ${healthyServices.length}`);
    healthyServices.forEach(service => {
      console.log(`  - ${service.name}: ${service.responseTime}ms avg`);
    });

    console.log(`\n❌ Unhealthy Services: ${unhealthyServices.length}`);
    unhealthyServices.forEach(service => {
      console.log(`  - ${service.name}`);
      service.endpoints.filter(e => !e.success).forEach(endpoint => {
        console.log(`    - ${endpoint.name}: ${endpoint.error || endpoint.status}`);
      });
    });

    const totalEndpoints = this.results.services.reduce((sum, s) => sum + s.endpoints.length, 0);
    const successfulEndpoints = this.results.services.reduce((sum, s) => 
      sum + s.endpoints.filter(e => e.success).length, 0);

    console.log(`\n📈 Overall Statistics:`);
    console.log(`  - Total Endpoints: ${totalEndpoints}`);
    console.log(`  - Successful: ${successfulEndpoints}`);
    console.log(`  - Success Rate: ${Math.round((successfulEndpoints / totalEndpoints) * 100)}%`);

    const avgResponseTime = this.results.services
      .filter(s => s.responseTime > 0)
      .reduce((sum, s) => sum + s.responseTime, 0) / 
      this.results.services.filter(s => s.responseTime > 0).length;

    console.log(`  - Average Response Time: ${Math.round(avgResponseTime * 100) / 100}ms`);

    console.log('\n💡 Recommendations:');
    if (unhealthyServices.length === 0) {
      console.log('  ✅ All services are healthy! Microservices architecture is working correctly.');
    } else {
      console.log('  ⚠️  Some services are unhealthy. Check the logs and ensure all services are running.');
      console.log('  🔧 Run: docker-compose -f docker-compose.microservices.yml logs [service-name]');
    }

    if (avgResponseTime > 500) {
      console.log('  ⚠️  Response times are high. Consider optimizing or scaling services.');
    } else {
      console.log('  ✅ Response times are within acceptable range.');
    }
  }
}

// Run tests
const tester = new MicroservicesTester();
tester.runTests().catch(console.error);
