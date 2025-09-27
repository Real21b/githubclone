// 🚀 Next.js Production Server Performance Test
// Tests Next.js production server with SSR/SSG and optimized performance

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for Next.js
const nextjsErrorRate = new Rate('nextjs_errors');
const nextjsResponseTime = new Trend('nextjs_response_time');
const nextjsRequestCount = new Counter('nextjs_requests');
const nextjsSSRTime = new Trend('nextjs_ssr_time');
const nextjsSSGTime = new Trend('nextjs_ssg_time');

export const options = {
  stages: [
    // Warm-up phase
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '2m', target: 200 },
    { duration: '2m', target: 300 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<300', 'p(99)<800'],
    http_req_failed: ['rate<0.1'],
    nextjs_errors: ['rate<0.1'],
    nextjs_response_time: ['p(95)<250'],
    nextjs_ssr_time: ['p(95)<200'],
    nextjs_ssg_time: ['p(95)<100'],
  },
};

const NEXTJS_BASE_URL = 'http://localhost:3000';

function testNextjsHomepage() {
  group('Next.js Homepage Test', () => {
    const response = http.get(`${NEXTJS_BASE_URL}/`);
    
    const success = check(response, {
      'Next.js homepage loads': (r) => r.status === 200,
      'Next.js homepage is fast': (r) => r.timings.duration < 300,
      'Next.js serves HTML': (r) => r.body.includes('<html'),
      'Next.js includes React': (r) => r.body.includes('react'),
      'Next.js has meta tags': (r) => r.body.includes('<meta'),
    });
    
    nextjsErrorRate.add(!success);
    nextjsResponseTime.add(response.timings.duration);
    nextjsRequestCount.add(1);
  });
}

function testNextjsSSR() {
  group('Next.js SSR Test', () => {
    const ssrPages = [
      '/',
      '/repositories',
      '/users',
      '/issues',
    ];
    
    ssrPages.forEach(page => {
      const response = http.get(`${NEXTJS_BASE_URL}${page}`);
      
      const success = check(response, {
        [`${page} SSR loads`]: (r) => r.status === 200,
        [`${page} SSR is fast`]: (r) => r.timings.duration < 200,
        [`${page} has content`]: (r) => r.body.length > 500,
      });
      
      nextjsErrorRate.add(!success);
      nextjsSSRTime.add(response.timings.duration);
      nextjsRequestCount.add(1);
    });
  });
}

function testNextjsSSG() {
  group('Next.js SSG Test', () => {
    const ssgPages = [
      '/about',
      '/contact',
      '/privacy',
      '/terms',
    ];
    
    ssgPages.forEach(page => {
      const response = http.get(`${NEXTJS_BASE_URL}${page}`);
      
      const success = check(response, {
        [`${page} SSG loads`]: (r) => r.status === 200,
        [`${page} SSG is fast`]: (r) => r.timings.duration < 100,
        [`${page} has content`]: (r) => r.body.length > 200,
      });
      
      nextjsErrorRate.add(!success);
      nextjsSSGTime.add(response.timings.duration);
      nextjsRequestCount.add(1);
    });
  });
}

function testNextjsAPI() {
  group('Next.js API Routes Test', () => {
    const apiRoutes = [
      '/api/health',
      '/api/repositories',
      '/api/users',
      '/api/auth/login',
    ];
    
    apiRoutes.forEach(route => {
      const response = http.get(`${NEXTJS_BASE_URL}${route}`);
      
      const success = check(response, {
        [`${route} API responds`]: (r) => r.status === 200 || r.status === 404,
        [`${route} API is fast`]: (r) => r.timings.duration < 300,
      });
      
      nextjsErrorRate.add(!success);
      nextjsResponseTime.add(response.timings.duration);
      nextjsRequestCount.add(1);
    });
  });
}

function testNextjsStaticAssets() {
  group('Next.js Static Assets Test', () => {
    const staticAssets = [
      '/_next/static/css/',
      '/_next/static/js/',
      '/favicon.ico',
      '/robots.txt',
      '/sitemap.xml',
    ];
    
    staticAssets.forEach(asset => {
      const response = http.get(`${NEXTJS_BASE_URL}${asset}`);
      
      const success = check(response, {
        [`${asset} loads`]: (r) => r.status === 200 || r.status === 404,
        [`${asset} is fast`]: (r) => r.timings.duration < 100,
      });
      
      nextjsErrorRate.add(!success);
      nextjsResponseTime.add(response.timings.duration);
      nextjsRequestCount.add(1);
    });
  });
}

function testNextjsGraphQL() {
  group('Next.js GraphQL Test', () => {
    const query = `
      query {
        getHealth {
          status
          timestamp
        }
      }
    `;
    
    const response = http.post(`${NEXTJS_BASE_URL}/graphql`, JSON.stringify({ query }), {
      headers: { 'Content-Type': 'application/json' },
    });
    
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
    
    nextjsErrorRate.add(!success);
    nextjsResponseTime.add(response.timings.duration);
    nextjsRequestCount.add(1);
  });
}

function testNextjsWebSocket() {
  group('Next.js WebSocket Test', () => {
    const response = http.get(`${NEXTJS_BASE_URL}/socket.io/`);
    
    const success = check(response, {
      'WebSocket endpoint accessible': (r) => r.status === 200 || r.status === 400,
      'WebSocket response is fast': (r) => r.timings.duration < 100,
    });
    
    nextjsErrorRate.add(!success);
    nextjsResponseTime.add(response.timings.duration);
    nextjsRequestCount.add(1);
  });
}

function testNextjsPerformance() {
  group('Next.js Performance Test', () => {
    // Test performance with multiple concurrent requests
    const requests = [];
    
    for (let i = 0; i < 10; i++) {
      requests.push(http.get(`${NEXTJS_BASE_URL}/`));
    }
    
    const success = check(null, {
      'Multiple requests handled': () => requests.length === 10,
      'All requests completed': () => requests.every(r => r.status === 200),
      'Average response time acceptable': () => {
        const avgTime = requests.reduce((sum, r) => sum + r.timings.duration, 0) / requests.length;
        return avgTime < 300;
      },
    });
    
    nextjsErrorRate.add(!success);
    requests.forEach(r => {
      nextjsResponseTime.add(r.timings.duration);
      nextjsRequestCount.add(1);
    });
  });
}

export default function() {
  console.log('⚡ Testing Next.js Production Server');
  
  testNextjsHomepage();
  testNextjsSSR();
  testNextjsSSG();
  testNextjsAPI();
  testNextjsStaticAssets();
  testNextjsGraphQL();
  testNextjsWebSocket();
  testNextjsPerformance();
  
  sleep(Math.random() * 2);
}

export function setup() {
  console.log('🚀 Starting Next.js Production Server Performance Test');
  console.log(`Target: ${NEXTJS_BASE_URL}`);
  console.log('=====================================');
}

export function teardown(data) {
  console.log('✅ Next.js Production Server Performance Test Completed');
  console.log('=====================================');
}
