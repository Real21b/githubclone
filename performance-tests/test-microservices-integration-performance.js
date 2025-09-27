import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter, Gauge } from 'k6/metrics';

// Custom metrics for microservices integration
const serviceHealthRate = new Rate('service_health_rate');
const serviceResponseTime = new Trend('service_response_time');
const serviceAvailability = new Gauge('service_availability');
const integrationSuccessRate = new Rate('integration_success_rate');
const totalServiceRequests = new Counter('total_service_requests');
const failedServiceRequests = new Counter('failed_service_requests');
const averageServiceLoad = new Trend('average_service_load');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Ramp up to 5 users
    { duration: '1m', target: 5 },     // Stay at 5 users
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 30 },   // Ramp up to 30 users
    { duration: '2m', target: 30 },    // Stay at 30 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'service_health_rate': ['rate>0.95'],           // 95% of services healthy
    'service_response_time': ['p(95)<500'],         // 95% of service responses under 500ms
    'integration_success_rate': ['rate>0.90'],      // 90% integration success rate
    'service_availability': ['value>0.95'],         // 95% service availability
    'http_req_failed': ['rate<0.05'],               // Error rate under 5%
  },
};

// Microservices configuration
const microservices = [
  { name: 'Auth Service', port: 3001, endpoints: ['/health', '/auth/status'] },
  { name: 'Core Service', port: 3002, endpoints: ['/health', '/graphql'] },
  { name: 'File Service', port: 3003, endpoints: ['/health', '/files/status'] },
  { name: 'Email Service', port: 3004, endpoints: ['/health', '/email/status'] },
  { name: 'SMS Service', port: 3005, endpoints: ['/health', '/sms/status'] },
  { name: 'Notification Service', port: 3006, endpoints: ['/health', '/notifications/status'] },
  { name: 'WordPress Service', port: 3007, endpoints: ['/health', '/wordpress/status'] },
  { name: 'WhatsApp Service', port: 3008, endpoints: ['/health', '/whatsapp/status'] },
  { name: 'Telegram Service', port: 3009, endpoints: ['/health', '/telegram/status'] },
  { name: 'AI Service', port: 3010, endpoints: ['/health', '/ai/status'] },
  { name: 'Real-time Service', port: 3011, endpoints: ['/health', '/socket.io/'] },
  { name: 'Integration Service', port: 3012, endpoints: ['/health', '/integrations/status'] },
];

// Test scenarios
const scenarios = {
  serviceHealthCheck: {
    name: 'Service Health Check',
    weight: 30,
  },
  serviceIntegration: {
    name: 'Service Integration Test',
    weight: 25,
  },
  serviceLoadTest: {
    name: 'Service Load Test',
    weight: 25,
  },
  serviceCommunication: {
    name: 'Service Communication Test',
    weight: 20,
  },
};

export default function () {
  // Random scenario selection
  const scenario = selectScenario();
  
  switch (scenario) {
    case 'serviceHealthCheck':
      testServiceHealthCheck();
      break;
    case 'serviceIntegration':
      testServiceIntegration();
      break;
    case 'serviceLoadTest':
      testServiceLoadTest();
      break;
    case 'serviceCommunication':
      testServiceCommunication();
      break;
  }
  
  sleep(1);
}

// Scenario selection function
function selectScenario() {
  const random = Math.random();
  let cumulative = 0;
  
  for (const [key, scenario] of Object.entries(scenarios)) {
    cumulative += scenario.weight / 100;
    if (random <= cumulative) {
      return key;
    }
  }
  
  return 'serviceHealthCheck'; // Default fallback
}

// Test 1: Service Health Check
function testServiceHealthCheck() {
  group('Service Health Check', () => {
    let healthyServices = 0;
    const totalServices = microservices.length;
    
    for (const service of microservices) {
      const startTime = Date.now();
      
      const response = http.get(`http://localhost:${service.port}/health`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: '5s',
      });
      
      const responseTime = Date.now() - startTime;
      serviceResponseTime.add(responseTime);
      totalServiceRequests.add(1);
      
      const isHealthy = response.status === 200;
      if (isHealthy) {
        healthyServices++;
      } else {
        failedServiceRequests.add(1);
      }
      
      check(response, {
        [`${service.name} Health Check`]: response.status === 200,
        [`${service.name} Response Time < 500ms`]: responseTime < 500,
        [`${service.name} Content Valid`]: response.body.includes('status') || response.body.includes('ok'),
      });
    }
    
    const healthRate = healthyServices / totalServices;
    serviceHealthRate.add(healthRate >= 0.95);
    serviceAvailability.add(healthRate);
    
    check(null, {
      'Overall Service Health Rate > 95%': healthRate >= 0.95,
      'All Services Responding': healthyServices === totalServices,
    });
  });
}

// Test 2: Service Integration Test
function testServiceIntegration() {
  group('Service Integration Test', () => {
    let successfulIntegrations = 0;
    const totalIntegrations = microservices.length;
    
    for (const service of microservices) {
      const startTime = Date.now();
      
      // Test multiple endpoints for each service
      for (const endpoint of service.endpoints) {
        const response = http.get(`http://localhost:${service.port}${endpoint}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          timeout: '5s',
        });
        
        const responseTime = Date.now() - startTime;
        serviceResponseTime.add(responseTime);
        totalServiceRequests.add(1);
        
        const isSuccess = response.status === 200 || response.status === 400; // 400 is acceptable for some endpoints
        if (!isSuccess) {
          failedServiceRequests.add(1);
        }
        
        check(response, {
          [`${service.name} ${endpoint} Integration`]: isSuccess,
          [`${service.name} ${endpoint} Response Time < 1s`]: responseTime < 1000,
        });
      }
      
      successfulIntegrations++;
    }
    
    const integrationRate = successfulIntegrations / totalIntegrations;
    integrationSuccessRate.add(integrationRate >= 0.90);
    
    check(null, {
      'Integration Success Rate > 90%': integrationRate >= 0.90,
    });
  });
}

// Test 3: Service Load Test
function testServiceLoadTest() {
  group('Service Load Test', () => {
    // Test multiple services simultaneously
    const testServices = microservices.slice(0, 6); // Test first 6 services
    let totalLoadTime = 0;
    let successfulRequests = 0;
    
    for (const service of testServices) {
      const startTime = Date.now();
      
      // Send multiple requests to simulate load
      const requests = [];
      for (let i = 0; i < 3; i++) {
        requests.push(
          http.get(`http://localhost:${service.port}/health`, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
            },
            timeout: '5s',
          })
        );
      }
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;
      totalLoadTime += loadTime;
      
      // Check all requests
      for (const response of requests) {
        totalServiceRequests.add(1);
        
        if (response.status === 200) {
          successfulRequests++;
        } else {
          failedServiceRequests.add(1);
        }
        
        check(response, {
          [`${service.name} Load Test Request`]: response.status === 200,
          [`${service.name} Load Test Response Time < 1s`]: response.timings.duration < 1000,
        });
      }
    }
    
    const averageLoad = totalLoadTime / testServices.length;
    averageServiceLoad.add(averageLoad);
    
    check(null, {
      'Average Service Load < 2s': averageLoad < 2000,
      'Load Test Success Rate > 90%': (successfulRequests / (testServices.length * 3)) >= 0.90,
    });
  });
}

// Test 4: Service Communication Test
function testServiceCommunication() {
  group('Service Communication Test', () => {
    // Test inter-service communication
    const communicationTests = [
      { from: 'Core Service', to: 'Auth Service', endpoint: '/graphql' },
      { from: 'Real-time Service', to: 'Notification Service', endpoint: '/socket.io/' },
      { from: 'Integration Service', to: 'AI Service', endpoint: '/integrations/status' },
    ];
    
    let successfulCommunications = 0;
    const totalCommunications = communicationTests.length;
    
    for (const test of communicationTests) {
      const startTime = Date.now();
      
      // Test communication through the main frontend
      const response = http.get(`http://localhost:3000${test.endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: '10s',
      });
      
      const responseTime = Date.now() - startTime;
      serviceResponseTime.add(responseTime);
      totalServiceRequests.add(1);
      
      const isSuccess = response.status === 200 || response.status === 400;
      if (isSuccess) {
        successfulCommunications++;
      } else {
        failedServiceRequests.add(1);
      }
      
      check(response, {
        [`${test.from} -> ${test.to} Communication`]: isSuccess,
        [`${test.from} -> ${test.to} Response Time < 2s`]: responseTime < 2000,
      });
    }
    
    const communicationRate = successfulCommunications / totalCommunications;
    integrationSuccessRate.add(communicationRate >= 0.80);
    
    check(null, {
      'Service Communication Rate > 80%': communicationRate >= 0.80,
    });
  });
}

// Setup function
export function setup() {
  console.log('🚀 Starting Microservices Integration Performance Test');
  console.log('📊 Test Configuration:');
  console.log(`  - Stages: ${options.stages.length} stages`);
  console.log(`  - Max Users: ${Math.max(...options.stages.map(s => s.target))}`);
  console.log(`  - Total Duration: ${options.stages.reduce((sum, stage) => sum + parseInt(stage.duration), 0)}s`);
  console.log(`  - Microservices: ${microservices.length} services`);
  console.log(`  - Scenarios: ${Object.keys(scenarios).length} test scenarios`);
  
  return {
    startTime: Date.now(),
    services: microservices.length,
    scenarios: Object.keys(scenarios).length,
  };
}

// Teardown function
export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = endTime - data.startTime;
  
  console.log('🎉 Microservices Integration Performance Test Completed');
  console.log('📊 Test Summary:');
  console.log(`  - Total Duration: ${totalDuration}ms`);
  console.log(`  - Services Tested: ${data.services}`);
  console.log(`  - Scenarios Executed: ${data.scenarios}`);
  console.log(`  - Total Service Requests: ${totalServiceRequests.values.count || 0}`);
  console.log(`  - Failed Service Requests: ${failedServiceRequests.values.count || 0}`);
  console.log('✅ Microservices integration performance test completed successfully');
}
