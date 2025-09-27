// 🚀 GitHub Clone - Comprehensive Performance Test Suite
// Tests both Vite (Development) and Next.js (Production) servers

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    // Warm-up phase
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '2m', target: 500 },
    { duration: '1m', target: 0 }, // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    errors: ['rate<0.1'],
  },
};

// Test scenarios
const scenarios = {
  // Development server (Vite)
  development: {
    baseUrl: 'http://localhost:3000',
    name: 'Vite Development Server',
    endpoints: [
      { path: '/', name: 'Homepage' },
      { path: '/api/health', name: 'Health Check' },
      { path: '/graphql', name: 'GraphQL API' },
      { path: '/auth/login', name: 'Auth Login' },
      { path: '/socket.io/', name: 'WebSocket' },
    ]
  },
  
  // Production server (Next.js)
  production: {
    baseUrl: 'http://localhost:3000',
    name: 'Next.js Production Server',
    endpoints: [
      { path: '/', name: 'Homepage' },
      path: '/api/health', name: 'Health Check' },
      { path: '/graphql', name: 'GraphQL API' },
      { path: '/auth/login', name: 'Auth Login' },
      { path: '/socket.io/', name: 'WebSocket' },
    ]
  }
};

// Test data
const testUsers = [
  { username: 'testuser1', password: 'password123' },
  { username: 'testuser2', password: 'password123' },
  { username: 'testuser3', password: 'password123' },
];

const testRepositories = [
  { name: 'awesome-project', description: 'An awesome project' },
  { name: 'react-components', description: 'Reusable React components' },
  { name: 'api-gateway', description: 'Microservices API Gateway' },
];

// Helper functions
function getRandomUser() {
  return testUsers[Math.floor(Math.random() * testUsers.length)];
}

function getRandomRepository() {
  return testRepositories[Math.floor(Math.random() * testRepositories.length)];
}

function makeRequest(method, url, payload = null, headers = {}) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'k6-performance-test',
      ...headers,
    },
  };

  let response;
  if (method === 'GET') {
    response = http.get(url, params);
  } else if (method === 'POST') {
    response = http.post(url, JSON.stringify(payload), params);
  } else if (method === 'PUT') {
    response = http.put(url, JSON.stringify(payload), params);
  } else if (method === 'DELETE') {
    response = http.del(url, null, params);
  }

  requestCount.add(1);
  responseTime.add(response.timings.duration);
  
  return response;
}

// Test functions
function testHomepage(baseUrl) {
  group('Homepage Test', () => {
    const response = makeRequest('GET', `${baseUrl}/`);
    
    const success = check(response, {
      'Homepage loads successfully': (r) => r.status === 200,
      'Homepage loads fast': (r) => r.timings.duration < 1000,
      'Homepage has content': (r) => r.body.length > 1000,
    });
    
    errorRate.add(!success);
    sleep(0.1);
  });
}

function testHealthCheck(baseUrl) {
  group('Health Check Test', () => {
    const response = makeRequest('GET', `${baseUrl}/health`);
    
    const success = check(response, {
      'Health check responds': (r) => r.status === 200,
      'Health check is fast': (r) => r.timings.duration < 100,
      'Health check returns JSON': (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!success);
    sleep(0.05);
  });
}

function testGraphQLAPI(baseUrl) {
  group('GraphQL API Test', () => {
    const query = `
      query {
        getHealth {
          status
          timestamp
        }
      }
    `;
    
    const response = makeRequest('POST', `${baseUrl}/graphql`, { query });
    
    const success = check(response, {
      'GraphQL responds': (r) => r.status === 200,
      'GraphQL is fast': (r) => r.timings.duration < 500,
      'GraphQL returns data': (r) => {
        try {
          const data = JSON.parse(r.body);
          return data.data && data.data.getHealth;
        } catch {
          return false;
        }
      },
    });
    
    errorRate.add(!success);
    sleep(0.2);
  });
}

function testAuthentication(baseUrl) {
  group('Authentication Test', () => {
    const user = getRandomUser();
    
    // Test login
    const loginResponse = makeRequest('POST', `${baseUrl}/auth/login`, {
      username: user.username,
      password: user.password,
    });
    
    const loginSuccess = check(loginResponse, {
      'Login responds': (r) => r.status === 200 || r.status === 401,
      'Login is fast': (r) => r.timings.duration < 300,
    });
    
    errorRate.add(!loginSuccess);
    sleep(0.1);
  });
}

function testWebSocket(baseUrl) {
  group('WebSocket Test', () => {
    const response = makeRequest('GET', `${baseUrl}/socket.io/`);
    
    const success = check(response, {
      'WebSocket endpoint responds': (r) => r.status === 200 || r.status === 400,
      'WebSocket is fast': (r) => r.timings.duration < 200,
    });
    
    errorRate.add(!success);
    sleep(0.1);
  });
}

function testFileUpload(baseUrl) {
  group('File Upload Test', () => {
    const fileData = 'test file content';
    const response = makeRequest('POST', `${baseUrl}/files/upload`, {
      file: fileData,
      filename: 'test.txt',
    });
    
    const success = check(response, {
      'File upload responds': (r) => r.status === 200 || r.status === 401,
      'File upload is fast': (r) => r.timings.duration < 1000,
    });
    
    errorRate.add(!success);
    sleep(0.3);
  });
}

function testRepositoryOperations(baseUrl) {
  group('Repository Operations Test', () => {
    const repo = getRandomRepository();
    
    // Test repository creation
    const createResponse = makeRequest('POST', `${baseUrl}/graphql`, {
      query: `
        mutation {
          createRepository(input: {
            name: "${repo.name}"
            description: "${repo.description}"
          }) {
            id
            name
            description
          }
        }
      `
    });
    
    const success = check(createResponse, {
      'Repository creation responds': (r) => r.status === 200,
      'Repository creation is fast': (r) => r.timings.duration < 500,
    });
    
    errorRate.add(!success);
    sleep(0.2);
  });
}

// Main test function
export default function() {
  const scenario = __ENV.TEST_SCENARIO || 'development';
  const config = scenarios[scenario];
  
  if (!config) {
    throw new Error(`Unknown test scenario: ${scenario}`);
  }
  
  console.log(`Testing ${config.name} at ${config.baseUrl}`);
  
  // Run all tests
  testHomepage(config.baseUrl);
  testHealthCheck(config.baseUrl);
  testGraphQLAPI(config.baseUrl);
  testAuthentication(config.baseUrl);
  testWebSocket(config.baseUrl);
  testFileUpload(config.baseUrl);
  testRepositoryOperations(config.baseUrl);
  
  // Random sleep between iterations
  sleep(Math.random() * 2);
}

// Setup function
export function setup() {
  console.log('🚀 Starting Performance Test Suite');
  console.log(`Test Scenario: ${__ENV.TEST_SCENARIO || 'development'}`);
  console.log('=====================================');
}

// Teardown function
export function teardown(data) {
  console.log('✅ Performance Test Suite Completed');
  console.log('=====================================');
}
