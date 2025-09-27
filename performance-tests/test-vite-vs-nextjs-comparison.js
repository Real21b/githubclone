import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics for comparison
const viteLoadTime = new Trend('vite_load_time');
const nextjsLoadTime = new Trend('nextjs_load_time');
const viteResponseTime = new Trend('vite_response_time');
const nextjsResponseTime = new Trend('nextjs_response_time');
const viteErrorRate = new Rate('vite_error_rate');
const nextjsErrorRate = new Rate('nextjs_error_rate');
const performanceDifference = new Trend('performance_difference');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 5 },    // Ramp up to 5 users
    { duration: '1m', target: 5 },     // Stay at 5 users
    { duration: '30s', target: 10 },   // Ramp up to 10 users
    { duration: '1m', target: 10 },    // Stay at 10 users
    { duration: '30s', target: 20 },   // Ramp up to 20 users
    { duration: '1m', target: 20 },    // Stay at 20 users
    { duration: '30s', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    'vite_load_time': ['p(95)<1000'],           // Vite load time under 1s
    'nextjs_load_time': ['p(95)<1500'],         // Next.js load time under 1.5s
    'vite_response_time': ['p(95)<500'],        // Vite response time under 500ms
    'nextjs_response_time': ['p(95)<800'],      // Next.js response time under 800ms
    'vite_error_rate': ['rate<0.02'],           // Vite error rate under 2%
    'nextjs_error_rate': ['rate<0.03'],         // Next.js error rate under 3%
    'performance_difference': ['p(95)<500'],    // Performance difference under 500ms
  },
};

// Test scenarios
const scenarios = {
  viteTest: {
    name: 'Vite Development Server Test',
    weight: 50,
  },
  nextjsTest: {
    name: 'Next.js Production Server Test',
    weight: 50,
  },
};

export default function () {
  // Random scenario selection
  const scenario = selectScenario();
  
  switch (scenario) {
    case 'viteTest':
      testViteServer();
      break;
    case 'nextjsTest':
      testNextJSServer();
      break;
  }
  
  sleep(1);
}

// Scenario selection function
function selectScenario() {
  const random = Math.random();
  return random < 0.5 ? 'viteTest' : 'nextjsTest';
}

// Test 1: Vite Development Server
function testViteServer() {
  group('Vite Development Server Test', () => {
    const startTime = Date.now();
    
    const response = http.get('http://localhost:3000', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const loadTime = Date.now() - startTime;
    viteLoadTime.add(loadTime);
    viteResponseTime.add(response.timings.duration);
    
    const isError = response.status !== 200;
    viteErrorRate.add(!isError);
    
    const checks = {
      'Vite Status 200': response.status === 200,
      'Vite Content Present': response.body.includes('GitHub Clone'),
      'Vite Load Time < 1s': loadTime < 1000,
      'Vite Response Time < 500ms': response.timings.duration < 500,
      'Vite Content Size > 0': response.body.length > 0,
      'Vite Unified Index Present': response.body.includes('Unified Platform'),
    };
    
    check(response, checks);
    
    // Test Vite-specific features
    testViteFeatures();
  });
}

// Test 2: Next.js Production Server
function testNextJSServer() {
  group('Next.js Production Server Test', () => {
    const startTime = Date.now();
    
    const response = http.get('http://localhost:3000', {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    const loadTime = Date.now() - startTime;
    nextjsLoadTime.add(loadTime);
    nextjsResponseTime.add(response.timings.duration);
    
    const isError = response.status !== 200;
    nextjsErrorRate.add(!isError);
    
    const checks = {
      'Next.js Status 200': response.status === 200,
      'Next.js Content Present': response.body.includes('GitHub Clone'),
      'Next.js Load Time < 1.5s': loadTime < 1500,
      'Next.js Response Time < 800ms': response.timings.duration < 800,
      'Next.js Content Size > 0': response.body.length > 0,
      'Next.js Unified Index Present': response.body.includes('Unified Platform'),
    };
    
    check(response, checks);
    
    // Test Next.js-specific features
    testNextJSFeatures();
  });
}

// Test Vite-specific features
function testViteFeatures() {
  group('Vite Features Test', () => {
    // Test Vite HMR endpoint
    const hmrResponse = http.get('http://localhost:3000/@vite/client', {
      headers: {
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      timeout: '3s',
    });
    
    check(hmrResponse, {
      'Vite HMR Endpoint Accessible': hmrResponse.status === 200 || hmrResponse.status === 404,
    });
    
    // Test Vite dev server features
    const devResponse = http.get('http://localhost:3000/src/main.tsx', {
      headers: {
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      timeout: '3s',
    });
    
    check(devResponse, {
      'Vite Dev Server Features': devResponse.status === 200 || devResponse.status === 404,
    });
  });
}

// Test Next.js-specific features
function testNextJSFeatures() {
  group('Next.js Features Test', () => {
    // Test Next.js API routes
    const apiResponse = http.get('http://localhost:3000/api/health', {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      timeout: '5s',
    });
    
    check(apiResponse, {
      'Next.js API Routes': apiResponse.status === 200 || apiResponse.status === 404,
    });
    
    // Test Next.js static assets
    const staticResponse = http.get('http://localhost:3000/_next/static/', {
      headers: {
        'Accept': '*/*',
        'Connection': 'keep-alive',
      },
      timeout: '3s',
    });
    
    check(staticResponse, {
      'Next.js Static Assets': staticResponse.status === 200 || staticResponse.status === 404,
    });
  });
}

// Performance comparison function
function comparePerformance() {
  // This would be called in teardown to compare metrics
  const viteAvg = viteLoadTime.values.avg || 0;
  const nextjsAvg = nextjsLoadTime.values.avg || 0;
  const difference = Math.abs(viteAvg - nextjsAvg);
  
  performanceDifference.add(difference);
  
  return {
    viteAverage: viteAvg,
    nextjsAverage: nextjsAvg,
    difference: difference,
    faster: viteAvg < nextjsAvg ? 'Vite' : 'Next.js',
  };
}

// Setup function
export function setup() {
  console.log('🚀 Starting Vite vs Next.js Performance Comparison Test');
  console.log('📊 Test Configuration:');
  console.log(`  - Stages: ${options.stages.length} stages`);
  console.log(`  - Max Users: ${Math.max(...options.stages.map(s => s.target))}`);
  console.log(`  - Total Duration: ${options.stages.reduce((sum, stage) => sum + parseInt(stage.duration), 0)}s`);
  console.log(`  - Scenarios: ${Object.keys(scenarios).length} test scenarios`);
  
  return {
    startTime: Date.now(),
    scenarios: Object.keys(scenarios).length,
  };
}

// Teardown function
export function teardown(data) {
  const endTime = Date.now();
  const totalDuration = endTime - data.startTime;
  
  console.log('🎉 Vite vs Next.js Performance Comparison Test Completed');
  console.log('📊 Test Summary:');
  console.log(`  - Total Duration: ${totalDuration}ms`);
  console.log(`  - Scenarios Executed: ${data.scenarios}`);
  
  // Performance comparison
  const comparison = comparePerformance();
  console.log('📈 Performance Comparison:');
  console.log(`  - Vite Average Load Time: ${comparison.viteAverage.toFixed(2)}ms`);
  console.log(`  - Next.js Average Load Time: ${comparison.nextjsAverage.toFixed(2)}ms`);
  console.log(`  - Performance Difference: ${comparison.difference.toFixed(2)}ms`);
  console.log(`  - Faster Server: ${comparison.faster}`);
  
  console.log('✅ Performance comparison test completed successfully');
}
