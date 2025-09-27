import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const microservicesHealthRate = new Rate('microservices_health_rate');
const unifiedIndexLoadTime = new Trend('unified_index_load_time');
const serviceResponseTime = new Trend('service_response_time');
const totalRequests = new Counter('total_requests');
const failedRequests = new Counter('failed_requests');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 50 },   // Ramp up to 50 users
    { duration: '2m', target: 50 },    // Stay at 50 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'http_req_duration': ['p(95)<2000'],           // 95% of requests under 2s
    'http_req_failed': ['rate<0.05'],              // Error rate under 5%
    'unified_index_load_time': ['p(95)<1500'],     // Unified index load time under 1.5s
    'service_response_time': ['p(95)<500'],        // Service response time under 500ms
    'microservices_health_rate': ['rate>0.95'],    // 95% of services healthy
  },
};

// Service endpoints configuration
const services = [
  { name: 'Auth Service', port: 3001, endpoint: '/health' },
  { name: 'Core Service', port: 3002, endpoint: '/health' },
  { name: 'File Service', port: 3003, endpoint: '/health' },
  { name: 'Email Service', port: 3004, endpoint: '/health' },
  { name: 'SMS Service', port: 3005, endpoint: '/health' },
  { name: 'Notification Service', port: 3006, endpoint: '/health' },
  { name: 'WordPress Service', port: 3007, endpoint: '/health' },
  { name: 'WhatsApp Service', port: 3008, endpoint: '/health' },
  { name: 'Telegram Service', port: 3009, endpoint: '/health' },
  { name: 'AI Service', port: 3010, endpoint: '/health' },
  { name: 'Real-time Service', port: 3011, endpoint: '/health' },
  { name: 'Integration Service', port: 3012, endpoint: '/health' },
];

// Test scenarios
const scenarios = {
  unifiedIndex: {
    name: 'Unified Index Page Test',
    weight: 40,
  },
  microservicesHealth: {
    name: 'Microservices Health Check',
    weight: 30,
  },
  apiEndpoints: {
    name: 'API Endpoints Test',
    weight: 20,
  },
  websocketTest: {
    name: 'WebSocket Connection Test',
    weight: 10,
  },
};

export default function () {
  // Random scenario selection based on weights
  const scenario = selectScenario();
  
  switch (scenario) {
    case 'unifiedIndex':
      testUnifiedIndex();
      break;
    case 'microservicesHealth':
      testMicroservicesHealth();
      break;
    case 'apiEndpoints':
      testAPIEndpoints();
      break;
    case 'websocketTest':
      testWebSocketConnection();
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
  
  return 'unifiedIndex'; // Default fallback
}

// Test 1: Unified Index Page Performance
function testUnifiedIndex() {
  group('Unified Index Page Test', () => {
    const startTime = Date.now();
    
    const response = http.get('http://localhost:3000', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    });
    
    const loadTime = Date.now() - startTime;
    unifiedIndexLoadTime.add(loadTime);
    totalRequests.add(1);
    
    const checks = {
      'Unified Index Status 200': response.status === 200,
      'Unified Index Content Present': response.body.includes('GitHub Clone'),
      'Unified Index Load Time < 2s': loadTime < 2000,
      'Unified Index Content Size > 0': response.body.length > 0,
    };
    
    if (!checks['Unified Index Status 200']) {
      failedRequests.add(1);
    }
    
    check(response, checks);
  });
}

// Test 2: Microservices Health Check
function testMicroservicesHealth() {
  group('Microservices Health Check', () => {
    let healthyServices = 0;
    const totalServices = services.length;
    
    for (const service of services) {
      const startTime = Date.now();
      
      const response = http.get(`http://localhost:${service.port}${service.endpoint}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: '5s',
      });
      
      const responseTime = Date.now() - startTime;
      serviceResponseTime.add(responseTime);
      totalRequests.add(1);
      
      const isHealthy = response.status === 200;
      if (isHealthy) {
        healthyServices++;
      } else {
        failedRequests.add(1);
      }
      
      check(response, {
        [`${service.name} Status 200`]: response.status === 200,
        [`${service.name} Response Time < 500ms`]: responseTime < 500,
        [`${service.name} Content Valid`]: response.body.includes('status') || response.body.includes('ok'),
      });
    }
    
    const healthRate = healthyServices / totalServices;
    microservicesHealthRate.add(healthRate >= 0.95);
    
    check(null, {
      'Microservices Health Rate > 95%': healthRate >= 0.95,
      'All Services Responding': healthyServices === totalServices,
    });
  });
}

// Test 3: API Endpoints Test
function testAPIEndpoints() {
  group('API Endpoints Test', () => {
    const endpoints = [
      { path: '/graphql', name: 'GraphQL API' },
      { path: '/api/health', name: 'Health API' },
      { path: '/auth/health', name: 'Auth API' },
    ];
    
    for (const endpoint of endpoints) {
      const startTime = Date.now();
      
      const response = http.get(`http://localhost:3000${endpoint.path}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: '10s',
      });
      
      const responseTime = Date.now() - startTime;
      serviceResponseTime.add(responseTime);
      totalRequests.add(1);
      
      if (response.status !== 200) {
        failedRequests.add(1);
      }
      
      check(response, {
        [`${endpoint.name} Status 200`]: response.status === 200,
        [`${endpoint.name} Response Time < 1s`]: responseTime < 1000,
        [`${endpoint.name} Content Valid`]: response.body.length > 0,
      });
    }
  });
}

// Test 4: WebSocket Connection Test
function testWebSocketConnection() {
  group('WebSocket Connection Test', () => {
    const startTime = Date.now();
    
    const response = http.get('http://localhost:3000/socket.io/', {
      headers: {
        'Accept': '*/*',
        'Connection': 'Upgrade',
        'Upgrade': 'websocket',
      },
      timeout: '5s',
    });
    
    const responseTime = Date.now() - startTime;
    serviceResponseTime.add(responseTime);
    totalRequests.add(1);
    
    if (response.status !== 200 && response.status !== 400) {
      failedRequests.add(1);
    }
    
    check(response, {
      'WebSocket Endpoint Accessible': response.status === 200 || response.status === 400,
      'WebSocket Response Time < 500ms': responseTime < 500,
      'WebSocket Content Present': response.body.length > 0,
    });
  });
}

// Setup function
export function setup() {
  console.log('🚀 Starting Microservices Index Performance Test');
  console.log('📊 Test Configuration:');
  console.log(`  - Stages: ${options.stages.length} stages`);
  console.log(`  - Max Users: ${Math.max(...options.stages.map(s => s.target))}`);
  console.log(`  - Total Duration: ${options.stages.reduce((sum, stage) => sum + parseInt(stage.duration), 0)}s`);
  console.log(`  - Services: ${services.length} microservices`);
  console.log(`  - Scenarios: ${Object.keys(scenarios).length} test scenarios`);
  
  return {
    startTime: Date.now(),
    services: services.length,
    scenarios: Object.keys(scenarios).length,
  };
}

// Teardown function
export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = endTime - data.startTime;
  
  console.log('🎉 Microservices Index Performance Test Completed');
  console.log('📊 Test Summary:');
  console.log(`  - Total Duration: ${totalDuration}ms`);
  console.log(`  - Services Tested: ${data.services}`);
  console.log(`  - Scenarios Executed: ${data.scenarios}`);
  console.log('✅ Performance test completed successfully');
}
