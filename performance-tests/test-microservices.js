// 🚀 Microservices Performance Test
// Tests all 12 microservices for performance and reliability

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for microservices
const microserviceErrorRate = new Rate('microservice_errors');
const microserviceResponseTime = new Trend('microservice_response_time');
const microserviceRequestCount = new Counter('microservice_requests');

export const options = {
  stages: [
    // Warm-up phase
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 150 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.1'],
    microservice_errors: ['rate<0.1'],
    microservice_response_time: ['p(95)<400'],
  },
};

const BASE_URL = 'http://localhost';

// Microservices configuration
const microservices = {
  auth: { port: 3001, name: 'Auth Service' },
  core: { port: 3002, name: 'Core Service' },
  file: { port: 3003, name: 'File Service' },
  email: { port: 3004, name: 'Email Service' },
  sms: { port: 3005, name: 'SMS Service' },
  notification: { port: 3006, name: 'Notification Service' },
  wordpress: { port: 3007, name: 'WordPress Service' },
  whatsapp: { port: 3008, name: 'WhatsApp Service' },
  telegram: { port: 3009, name: 'Telegram Service' },
  ai: { port: 3010, name: 'AI Service' },
  realtime: { port: 3011, name: 'Real-time Service' },
  integration: { port: 3012, name: 'Integration Service' },
};

function testMicroserviceHealth(serviceName, config) {
  group(`${config.name} Health Test`, () => {
    const response = http.get(`${BASE_URL}:${config.port}/health`);
    
    const success = check(response, {
      [`${serviceName} health check`]: (r) => r.status === 200,
      [`${serviceName} response time`]: (r) => r.timings.duration < 200,
      [`${serviceName} returns JSON`]: (r) => {
        try {
          JSON.parse(r.body);
          return true;
        } catch {
          return false;
        }
      },
    });
    
    microserviceErrorRate.add(!success);
    microserviceResponseTime.add(response.timings.duration);
    microserviceRequestCount.add(1);
  });
}

function testAuthService() {
  group('Auth Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.auth.port}`;
    
    // Test login endpoint
    const loginResponse = http.post(`${baseUrl}/login`, JSON.stringify({
      username: 'testuser',
      password: 'testpass'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(loginResponse, {
      'Auth login responds': (r) => r.status === 200 || r.status === 401,
      'Auth login is fast': (r) => r.timings.duration < 300,
    });
    
    // Test register endpoint
    const registerResponse = http.post(`${baseUrl}/register`, JSON.stringify({
      username: 'newuser',
      email: 'newuser@test.com',
      password: 'newpass'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(registerResponse, {
      'Auth register responds': (r) => r.status === 200 || r.status === 400,
      'Auth register is fast': (r) => r.timings.duration < 300,
    });
  });
}

function testCoreService() {
  group('Core Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.core.port}`;
    
    // Test GraphQL endpoint
    const graphqlResponse = http.post(`${baseUrl}/graphql`, JSON.stringify({
      query: `
        query {
          getHealth {
            status
            timestamp
          }
        }
      `
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(graphqlResponse, {
      'Core GraphQL responds': (r) => r.status === 200,
      'Core GraphQL is fast': (r) => r.timings.duration < 500,
    });
    
    // Test REST endpoints
    const restEndpoints = ['/users', '/repositories', '/issues'];
    restEndpoints.forEach(endpoint => {
      const response = http.get(`${baseUrl}${endpoint}`);
      check(response, {
        [`Core ${endpoint} responds`]: (r) => r.status === 200 || r.status === 401,
        [`Core ${endpoint} is fast`]: (r) => r.timings.duration < 300,
      });
    });
  });
}

function testFileService() {
  group('File Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.file.port}`;
    
    // Test file upload
    const uploadResponse = http.post(`${baseUrl}/upload`, JSON.stringify({
      filename: 'test.txt',
      content: 'test content'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(uploadResponse, {
      'File upload responds': (r) => r.status === 200 || r.status === 401,
      'File upload is fast': (r) => r.timings.duration < 1000,
    });
    
    // Test file download
    const downloadResponse = http.get(`${baseUrl}/download/test.txt`);
    check(downloadResponse, {
      'File download responds': (r) => r.status === 200 || r.status === 404,
      'File download is fast': (r) => r.timings.duration < 500,
    });
  });
}

function testEmailService() {
  group('Email Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.email.port}`;
    
    const emailResponse = http.post(`${baseUrl}/send`, JSON.stringify({
      to: 'test@example.com',
      subject: 'Test Email',
      body: 'Test email body'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(emailResponse, {
      'Email service responds': (r) => r.status === 200 || r.status === 400,
      'Email service is fast': (r) => r.timings.duration < 500,
    });
  });
}

function testSMSService() {
  group('SMS Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.sms.port}`;
    
    const smsResponse = http.post(`${baseUrl}/send`, JSON.stringify({
      to: '+1234567890',
      message: 'Test SMS'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(smsResponse, {
      'SMS service responds': (r) => r.status === 200 || r.status === 400,
      'SMS service is fast': (r) => r.timings.duration < 500,
    });
  });
}

function testNotificationService() {
  group('Notification Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.notification.port}`;
    
    const notificationResponse = http.post(`${baseUrl}/send`, JSON.stringify({
      userId: 'testuser',
      message: 'Test notification',
      type: 'info'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(notificationResponse, {
      'Notification service responds': (r) => r.status === 200 || r.status === 400,
      'Notification service is fast': (r) => r.timings.duration < 300,
    });
  });
}

function testAIService() {
  group('AI Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.ai.port}`;
    
    const aiResponse = http.post(`${baseUrl}/chat`, JSON.stringify({
      message: 'Hello, how are you?',
      model: 'gpt-3.5-turbo'
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
    check(aiResponse, {
      'AI service responds': (r) => r.status === 200 || r.status === 400,
      'AI service is fast': (r) => r.timings.duration < 2000,
    });
  });
}

function testRealtimeService() {
  group('Real-time Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.realtime.port}`;
    
    const socketResponse = http.get(`${baseUrl}/socket.io/`);
    check(socketResponse, {
      'Real-time service responds': (r) => r.status === 200 || r.status === 400,
      'Real-time service is fast': (r) => r.timings.duration < 100,
    });
  });
}

function testIntegrationService() {
  group('Integration Service Tests', () => {
    const baseUrl = `${BASE_URL}:${microservices.integration.port}`;
    
    const integrationResponse = http.get(`${baseUrl}/plugins`);
    check(integrationResponse, {
      'Integration service responds': (r) => r.status === 200 || r.status === 404,
      'Integration service is fast': (r) => r.timings.duration < 300,
    });
  });
}

export default function() {
  console.log('🔧 Testing Microservices Performance');
  
  // Test all microservices health
  Object.entries(microservices).forEach(([name, config]) => {
    testMicroserviceHealth(name, config);
  });
  
  // Test specific service functionality
  testAuthService();
  testCoreService();
  testFileService();
  testEmailService();
  testSMSService();
  testNotificationService();
  testAIService();
  testRealtimeService();
  testIntegrationService();
  
  sleep(Math.random() * 2);
}

export function setup() {
  console.log('🚀 Starting Microservices Performance Test');
  console.log('Testing all 12 microservices');
  console.log('=====================================');
}

export function teardown(data) {
  console.log('✅ Microservices Performance Test Completed');
  console.log('=====================================');
}
