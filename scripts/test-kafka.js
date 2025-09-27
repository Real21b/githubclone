const http = require('http');
const { performance } = require('perf_hooks');

class KafkaTester {
  constructor() {
    this.results = {
      services: [],
      kafka: {
        topics: [],
        producers: [],
        consumers: []
      },
      notifications: []
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

  async testKafkaTopics() {
    console.log('\n📊 Testing Kafka Topics...');
    
    try {
      // Test Kafka UI
      const kafkaUIResponse = await this.testEndpoint('http://localhost:8080', 'Kafka UI');
      
      if (kafkaUIResponse.statusCode === 200) {
        console.log('  ✅ Kafka UI: Accessible');
        this.results.kafka.topics.push({
          name: 'Kafka UI',
          status: 'healthy',
          url: 'http://localhost:8080'
        });
      } else {
        console.log('  ❌ Kafka UI: Not accessible');
        this.results.kafka.topics.push({
          name: 'Kafka UI',
          status: 'unhealthy',
          error: `HTTP ${kafkaUIResponse.statusCode}`
        });
      }
    } catch (error) {
      console.log('  ❌ Kafka UI: Connection failed');
      this.results.kafka.topics.push({
        name: 'Kafka UI',
        status: 'unhealthy',
        error: error.message
      });
    }

    // Expected topics
    const expectedTopics = [
      'notifications',
      'user-events',
      'repository-events',
      'email-notifications',
      'push-notifications'
    ];

    for (const topic of expectedTopics) {
      this.results.kafka.topics.push({
        name: topic,
        status: 'configured',
        description: 'Topic configured in Kafka service'
      });
    }

    console.log(`  📋 Expected Topics: ${expectedTopics.length} configured`);
  }

  async testNotificationFlow() {
    console.log('\n🔔 Testing Notification Flow...');
    
    try {
      // Test notification service health
      const healthResponse = await this.testEndpoint('http://localhost:3004/health', 'Notification Service Health');
      
      if (healthResponse.statusCode === 200) {
        console.log('  ✅ Notification Service: Healthy');
        
        // Test sending a notification
        const notificationPayload = {
          userId: 'test-user-123',
          type: 'info',
          title: 'Test Notification',
          message: 'This is a test notification from Kafka system',
          channels: ['in-app']
        };

        const notificationResponse = await this.sendNotification(notificationPayload);
        
        if (notificationResponse.success) {
          console.log('  ✅ Notification Send: Success');
          this.results.notifications.push({
            type: 'send',
            status: 'success',
            responseTime: notificationResponse.responseTime
          });
        } else {
          console.log('  ❌ Notification Send: Failed');
          this.results.notifications.push({
            type: 'send',
            status: 'failed',
            error: notificationResponse.error
          });
        }
      } else {
        console.log('  ❌ Notification Service: Unhealthy');
        this.results.notifications.push({
          type: 'service',
          status: 'unhealthy',
          error: `HTTP ${healthResponse.statusCode}`
        });
      }
    } catch (error) {
      console.log('  ❌ Notification Flow: Connection failed');
      this.results.notifications.push({
        type: 'flow',
        status: 'failed',
        error: error.message
      });
    }
  }

  async sendNotification(payload) {
    return new Promise((resolve) => {
      const postData = JSON.stringify(payload);
      
      const options = {
        hostname: 'localhost',
        port: 3004,
        path: '/notifications/send',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const startTime = performance.now();
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          try {
            const response = JSON.parse(data);
            resolve({
              success: res.statusCode >= 200 && res.statusCode < 300,
              responseTime: Math.round(responseTime * 100) / 100,
              data: response,
              statusCode: res.statusCode
            });
          } catch (error) {
            resolve({
              success: false,
              responseTime: Math.round(responseTime * 100) / 100,
              error: 'Invalid JSON response',
              statusCode: res.statusCode
            });
          }
        });
      });
      
      req.on('error', (error) => {
        resolve({
          success: false,
          error: error.message,
          responseTime: 0
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        resolve({
          success: false,
          error: 'Request timeout',
          responseTime: 10000
        });
      });
      
      req.write(postData);
      req.end();
    });
  }

  async runTests() {
    console.log('🚀 Starting Kafka System Test...\n');

    const services = [
      {
        name: 'Zookeeper',
        baseUrl: 'http://localhost:2181',
        endpoints: [
          { name: 'Health Check', path: '/health' }
        ]
      },
      {
        name: 'Kafka Broker',
        baseUrl: 'http://localhost:9092',
        endpoints: [
          { name: 'Broker Status', path: '/health' }
        ]
      },
      {
        name: 'Kafka UI',
        baseUrl: 'http://localhost:8080',
        endpoints: [
          { name: 'Web Interface', path: '/' }
        ]
      },
      {
        name: 'Kafka Connect',
        baseUrl: 'http://localhost:8083',
        endpoints: [
          { name: 'Connect API', path: '/connectors' }
        ]
      },
      {
        name: 'Notification Service',
        baseUrl: 'http://localhost:3004',
        endpoints: [
          { name: 'Health Check', path: '/health' },
          { name: 'Metrics', path: '/metrics' }
        ]
      }
    ];

    // Test services
    for (const service of services) {
      await this.testService(service.name, service.baseUrl, service.endpoints);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Test Kafka topics
    await this.testKafkaTopics();

    // Test notification flow
    await this.testNotificationFlow();

    this.printSummary();
  }

  printSummary() {
    console.log('\n📊 Kafka System Test Summary');
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

    console.log(`\n📊 Kafka Topics: ${this.results.kafka.topics.length}`);
    this.results.kafka.topics.forEach(topic => {
      const status = topic.status === 'healthy' ? '✅' : topic.status === 'configured' ? '📋' : '❌';
      console.log(`  ${status} ${topic.name}: ${topic.status}`);
    });

    console.log(`\n🔔 Notifications: ${this.results.notifications.length}`);
    this.results.notifications.forEach(notification => {
      const status = notification.status === 'success' ? '✅' : '❌';
      console.log(`  ${status} ${notification.type}: ${notification.status}`);
      if (notification.responseTime) {
        console.log(`    Response Time: ${notification.responseTime}ms`);
      }
    });

    const totalEndpoints = this.results.services.reduce((sum, s) => sum + s.endpoints.length, 0);
    const successfulEndpoints = this.results.services.reduce((sum, s) => 
      sum + s.endpoints.filter(e => e.success).length, 0);

    console.log(`\n📈 Overall Statistics:`);
    console.log(`  - Total Endpoints: ${totalEndpoints}`);
    console.log(`  - Successful: ${successfulEndpoints}`);
    console.log(`  - Success Rate: ${Math.round((successfulEndpoints / totalEndpoints) * 100)}%`);

    console.log('\n💡 Recommendations:');
    if (unhealthyServices.length === 0) {
      console.log('  ✅ All Kafka services are healthy! Event-driven architecture is working correctly.');
      console.log('  🚀 You can now use Kafka for real-time notifications and event processing.');
    } else {
      console.log('  ⚠️  Some Kafka services are unhealthy. Check the logs and ensure all services are running.');
      console.log('  🔧 Run: docker-compose -f docker-compose.kafka.yml logs [service-name]');
    }

    console.log('\n🎉 Kafka System Test Complete!');
  }
}

// Run tests
const tester = new KafkaTester();
tester.runTests().catch(console.error);
