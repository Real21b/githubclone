#!/usr/bin/env node

/**
 * 📧📱 Email & SMS Services Test Script
 * Tests the Kafka-based Email and SMS services
 */

const axios = require('axios');

const SERVICES = {
  email: {
    name: 'Email Service',
    url: 'http://localhost:3005',
    healthPath: '/health',
    metricsPath: '/metrics'
  },
  sms: {
    name: 'SMS Service', 
    url: 'http://localhost:3006',
    healthPath: '/health',
    metricsPath: '/metrics'
  }
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function makeRequest(url, options = {}) {
  try {
    const response = await axios({
      url,
      timeout: 10000,
      ...options
    });
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      status: error.response?.status || 0
    };
  }
}

async function testServiceHealth(service) {
  console.log(`${COLORS.blue}🔍 Testing ${service.name} Health...${COLORS.reset}`);
  
  const result = await makeRequest(`${service.url}${service.healthPath}`);
  
  if (result.success) {
    console.log(`${COLORS.green}✅ ${service.name} is healthy${COLORS.reset}`);
    console.log(`   Status: ${result.data.status}`);
    console.log(`   Service: ${result.data.service}`);
    console.log(`   Uptime: ${Math.round(result.data.uptime)}s`);
    console.log(`   Memory: ${Math.round(result.data.memory.used / 1024 / 1024)}MB`);
    
    if (service.name === 'Email Service') {
      console.log(`   SMTP Status: ${result.data.smtp?.status || 'Unknown'}`);
    } else if (service.name === 'SMS Service') {
      console.log(`   SMS Status: ${result.data.sms?.status || 'Unknown'}`);
    }
  } else {
    console.log(`${COLORS.red}❌ ${service.name} health check failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
    console.log(`   Status: ${result.status}`);
  }
  
  return result.success;
}

async function testServiceMetrics(service) {
  console.log(`${COLORS.blue}📊 Testing ${service.name} Metrics...${COLORS.reset}`);
  
  const result = await makeRequest(`${service.url}${service.metricsPath}`);
  
  if (result.success) {
    console.log(`${COLORS.green}✅ ${service.name} metrics accessible${COLORS.reset}`);
    
    if (service.name === 'Email Service') {
      console.log(`   Total Sent: ${result.data.totalSent || 0}`);
      console.log(`   Total Delivered: ${result.data.totalDelivered || 0}`);
      console.log(`   Total Failed: ${result.data.totalFailed || 0}`);
      console.log(`   Avg Processing Time: ${result.data.averageProcessingTime || 0}ms`);
    } else if (service.name === 'SMS Service') {
      console.log(`   Total Sent: ${result.data.totalSent || 0}`);
      console.log(`   Total Delivered: ${result.data.totalDelivered || 0}`);
      console.log(`   Total Failed: ${result.data.totalFailed || 0}`);
      console.log(`   Total Cost: $${result.data.totalCost || 0}`);
      console.log(`   Avg Processing Time: ${result.data.averageProcessingTime || 0}ms`);
    }
  } else {
    console.log(`${COLORS.red}❌ ${service.name} metrics check failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testEmailAPI() {
  console.log(`${COLORS.blue}📧 Testing Email API...${COLORS.reset}`);
  
  const testEmail = {
    to: 'test@example.com',
    subject: 'Test Email from GitHub Clone',
    html: '<h1>Test Email</h1><p>This is a test email from the GitHub Clone system.</p>',
    text: 'Test Email - This is a test email from the GitHub Clone system.',
    priority: 'normal'
  };
  
  const result = await makeRequest(`${SERVICES.email.url}/emails/send`, {
    method: 'POST',
    data: testEmail,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (result.success) {
    console.log(`${COLORS.green}✅ Email API test successful${COLORS.reset}`);
    console.log(`   Email ID: ${result.data.data.id}`);
    console.log(`   Status: ${result.data.data.status}`);
  } else {
    console.log(`${COLORS.red}❌ Email API test failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testSMSAPI() {
  console.log(`${COLORS.blue}📱 Testing SMS API...${COLORS.reset}`);
  
  const testSMS = {
    to: '+1234567890',
    message: 'Test SMS from GitHub Clone',
    provider: 'twilio',
    priority: 'normal'
  };
  
  const result = await makeRequest(`${SERVICES.sms.url}/sms/send`, {
    method: 'POST',
    data: testSMS,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (result.success) {
    console.log(`${COLORS.green}✅ SMS API test successful${COLORS.reset}`);
    console.log(`   SMS ID: ${result.data.data.id}`);
    console.log(`   Status: ${result.data.data.status}`);
    console.log(`   Cost: $${result.data.data.cost}`);
  } else {
    console.log(`${COLORS.red}❌ SMS API test failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testTemplateEmail() {
  console.log(`${COLORS.blue}📧 Testing Template Email API...${COLORS.reset}`);
  
  const templateEmail = {
    to: 'test@example.com',
    template: 'welcome',
    templateData: {
      username: 'TestUser',
      loginUrl: 'http://localhost:3001/login'
    },
    subject: 'Welcome to GitHub Clone!'
  };
  
  const result = await makeRequest(`${SERVICES.email.url}/emails/send-template`, {
    method: 'POST',
    data: templateEmail,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (result.success) {
    console.log(`${COLORS.green}✅ Template Email API test successful${COLORS.reset}`);
    console.log(`   Email ID: ${result.data.data.id}`);
    console.log(`   Status: ${result.data.data.status}`);
  } else {
    console.log(`${COLORS.red}❌ Template Email API test failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testTemplateSMS() {
  console.log(`${COLORS.blue}📱 Testing Template SMS API...${COLORS.reset}`);
  
  const templateSMS = {
    to: '+1234567890',
    template: 'verification',
    templateData: {
      code: '123456',
      minutes: '10'
    },
    provider: 'twilio'
  };
  
  const result = await makeRequest(`${SERVICES.sms.url}/sms/send-template`, {
    method: 'POST',
    data: templateSMS,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (result.success) {
    console.log(`${COLORS.green}✅ Template SMS API test successful${COLORS.reset}`);
    console.log(`   SMS ID: ${result.data.data.id}`);
    console.log(`   Status: ${result.data.data.status}`);
  } else {
    console.log(`${COLORS.red}❌ Template SMS API test failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function runAllTests() {
  console.log(`${COLORS.bold}${COLORS.blue}🚀 Starting Email & SMS Services Test Suite${COLORS.reset}\n`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Health checks
  for (const service of Object.values(SERVICES)) {
    totalTests++;
    if (await testServiceHealth(service)) {
      passedTests++;
    }
    console.log('');
  }
  
  // Metrics checks
  for (const service of Object.values(SERVICES)) {
    totalTests++;
    if (await testServiceMetrics(service)) {
      passedTests++;
    }
    console.log('');
  }
  
  // API tests
  totalTests++;
  if (await testEmailAPI()) {
    passedTests++;
  }
  console.log('');
  
  totalTests++;
  if (await testSMSAPI()) {
    passedTests++;
  }
  console.log('');
  
  totalTests++;
  if (await testTemplateEmail()) {
    passedTests++;
  }
  console.log('');
  
  totalTests++;
  if (await testTemplateSMS()) {
    passedTests++;
  }
  console.log('');
  
  // Results
  console.log(`${COLORS.bold}📊 Test Results:${COLORS.reset}`);
  console.log(`${COLORS.green}✅ Passed: ${passedTests}/${totalTests}${COLORS.reset}`);
  console.log(`${COLORS.red}❌ Failed: ${totalTests - passedTests}/${totalTests}${COLORS.reset}`);
  
  if (passedTests === totalTests) {
    console.log(`\n${COLORS.green}${COLORS.bold}🎉 All tests passed! Email & SMS services are working correctly.${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.red}${COLORS.bold}⚠️  Some tests failed. Please check the service logs.${COLORS.reset}`);
  }
  
  return passedTests === totalTests;
}

// Run tests
if (require.main === module) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error(`${COLORS.red}❌ Test suite failed:${COLORS.reset}`, error);
      process.exit(1);
    });
}

module.exports = { runAllTests, testServiceHealth, testServiceMetrics };
