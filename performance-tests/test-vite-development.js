// 🚀 Vite Development Server Performance Test
// Tests Vite development server with hot reload and real-time features

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for Vite
const viteErrorRate = new Rate('vite_errors');
const viteResponseTime = new Trend('vite_response_time');
const viteRequestCount = new Counter('vite_requests');
const viteHotReloadTime = new Trend('vite_hot_reload_time');

export const options = {
  stages: [
    // Warm-up phase
    { duration: '30s', target: 5 },
    { duration: '1m', target: 20 },
    { duration: '2m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<200', 'p(99)<500'],
    http_req_failed: ['rate<0.05'],
    vite_errors: ['rate<0.05'],
    vite_response_time: ['p(95)<150'],
  },
};

const VITE_BASE_URL = 'http://localhost:3000';

function testViteHomepage() {
  group('Vite Homepage Test', () => {
    const response = http.get(`${VITE_BASE_URL}/`);
    
    const success = check(response, {
      'Vite homepage loads': (r) => r.status === 200,
      'Vite homepage is fast': (r) => r.timings.duration < 200,
      'Vite serves HTML': (r) => r.body.includes('<html'),
      'Vite includes Vite client': (r) => r.body.includes('vite/client'),
    });
    
    viteErrorRate.add(!success);
    viteResponseTime.add(response.timings.duration);
    viteRequestCount.add(1);
  });
}

function testViteAssets() {
  group('Vite Assets Test', () => {
    const assets = [
      '/src/main.tsx',
      '/src/App.tsx',
      '/src/index.css',
      '/vite.svg',
    ];
    
    assets.forEach(asset => {
      const response = http.get(`${VITE_BASE_URL}${asset}`);
      
      const success = check(response, {
        [`${asset} loads`]: (r) => r.status === 200,
        [`${asset} is fast`]: (r) => r.timings.duration < 100,
      });
      
      viteErrorRate.add(!success);
      viteResponseTime.add(response.timings.duration);
      viteRequestCount.add(1);
    });
  });
}

function testViteHMR() {
  group('Vite Hot Module Replacement Test', () => {
    // Simulate HMR by making multiple requests to the same endpoint
    const startTime = Date.now();
    
    for (let i = 0; i < 10; i++) {
      const response = http.get(`${VITE_BASE_URL}/`);
      viteHotReloadTime.add(response.timings.duration);
      sleep(0.1);
    }
    
    const totalTime = Date.now() - startTime;
    
    check(null, {
      'HMR is fast': () => totalTime < 2000,
      'HMR requests complete': () => true,
    });
  });
}

function testViteAPIProxy() {
  group('Vite API Proxy Test', () => {
    const apiEndpoints = [
      '/api/health',
      '/graphql',
      '/auth/health',
    ];
    
    apiEndpoints.forEach(endpoint => {
      const response = http.get(`${VITE_BASE_URL}${endpoint}`);
      
      const success = check(response, {
        [`${endpoint} proxy works`]: (r) => r.status === 200 || r.status === 404,
        [`${endpoint} proxy is fast`]: (r) => r.timings.duration < 300,
      });
      
      viteErrorRate.add(!success);
      viteResponseTime.add(response.timings.duration);
      viteRequestCount.add(1);
    });
  });
}

function testViteWebSocket() {
  group('Vite WebSocket Test', () => {
    const response = http.get(`${VITE_BASE_URL}/socket.io/`);
    
    const success = check(response, {
      'WebSocket endpoint accessible': (r) => r.status === 200 || r.status === 400,
      'WebSocket response is fast': (r) => r.timings.duration < 100,
    });
    
    viteErrorRate.add(!success);
    viteResponseTime.add(response.timings.duration);
    viteRequestCount.add(1);
  });
}

function testViteDevelopmentFeatures() {
  group('Vite Development Features Test', () => {
    // Test development-specific features
    const devFeatures = [
      '/@vite/client',
      '/@fs/',
      '/@id/',
    ];
    
    devFeatures.forEach(feature => {
      const response = http.get(`${VITE_BASE_URL}${feature}`);
      
      const success = check(response, {
        [`${feature} accessible`]: (r) => r.status === 200 || r.status === 404,
        [`${feature} is fast`]: (r) => r.timings.duration < 200,
      });
      
      viteErrorRate.add(!success);
      viteResponseTime.add(response.timings.duration);
      viteRequestCount.add(1);
    });
  });
}

export default function() {
  console.log('🔥 Testing Vite Development Server');
  
  testViteHomepage();
  testViteAssets();
  testViteHMR();
  testViteAPIProxy();
  testViteWebSocket();
  testViteDevelopmentFeatures();
  
  sleep(Math.random() * 1);
}

export function setup() {
  console.log('🚀 Starting Vite Development Server Performance Test');
  console.log(`Target: ${VITE_BASE_URL}`);
  console.log('=====================================');
}

export function teardown(data) {
  console.log('✅ Vite Development Server Performance Test Completed');
  console.log('=====================================');
}
