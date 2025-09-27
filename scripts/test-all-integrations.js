#!/usr/bin/env node

/**
 * 🌐📧📱📱 All Integration Services Test Script
 * Tests WordPress, Email, SMS, WhatsApp, and Telegram services
 */

const axios = require('axios');

const SERVICES = {
  wordpress: {
    name: 'WordPress Service',
    url: 'http://localhost:3007',
    healthPath: '/health',
    metricsPath: '/metrics'
  },
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
  },
  whatsapp: {
    name: 'WhatsApp Service',
    url: 'http://localhost:3008',
    healthPath: '/health',
    metricsPath: '/metrics'
  },
  telegram: {
    name: 'Telegram Service',
    url: 'http://localhost:3009',
    healthPath: '/health',
    metricsPath: '/metrics'
  }
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

async function makeRequest(url, options = {}) {
  try {
    const response = await axios({
      url,
      timeout: 15000,
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
    
    // Service-specific status
    if (service.name === 'WordPress Service') {
      console.log(`   WordPress Status: ${result.data.wordpress?.status || 'Unknown'}`);
    } else if (service.name === 'Email Service') {
      console.log(`   SMTP Status: ${result.data.smtp?.status || 'Unknown'}`);
    } else if (service.name === 'SMS Service') {
      console.log(`   SMS Status: ${result.data.sms?.status || 'Unknown'}`);
    } else if (service.name === 'WhatsApp Service') {
      console.log(`   WhatsApp Status: ${result.data.whatsapp?.status || 'Unknown'}`);
      console.log(`   QR Generated: ${result.data.whatsapp?.qrCodeGenerated || false}`);
    } else if (service.name === 'Telegram Service') {
      console.log(`   Telegram Status: ${result.data.telegram?.status || 'Unknown'}`);
      console.log(`   Bot Connected: ${result.data.telegram?.connected || false}`);
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
    
    if (service.name === 'WordPress Service') {
      console.log(`   Total Posts: ${result.data.totalPosts || 0}`);
      console.log(`   Total Media: ${result.data.totalMedia || 0}`);
      console.log(`   Total Categories: ${result.data.totalCategories || 0}`);
      console.log(`   Avg Processing Time: ${result.data.averageProcessingTime || 0}ms`);
    } else if (service.name === 'Email Service') {
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
    } else if (service.name === 'WhatsApp Service') {
      console.log(`   Total Sent: ${result.data.totalSent || 0}`);
      console.log(`   Total Delivered: ${result.data.totalDelivered || 0}`);
      console.log(`   Total Read: ${result.data.totalRead || 0}`);
      console.log(`   Total Failed: ${result.data.totalFailed || 0}`);
      console.log(`   Connection Status: ${result.data.connectionStatus || 'Unknown'}`);
    } else if (service.name === 'Telegram Service') {
      console.log(`   Total Sent: ${result.data.totalSent || 0}`);
      console.log(`   Total Delivered: ${result.data.totalDelivered || 0}`);
      console.log(`   Total Failed: ${result.data.totalFailed || 0}`);
      console.log(`   Connection Status: ${result.data.connectionStatus || 'Unknown'}`);
    }
  } else {
    console.log(`${COLORS.red}❌ ${service.name} metrics check failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testWordPressAPI() {
  console.log(`${COLORS.cyan}🌐 Testing WordPress API...${COLORS.reset}`);
  
  const testPost = {
    title: 'Test Post from GitHub Clone',
    content: '<h1>Test Content</h1><p>This is a test post created from the GitHub Clone system.</p>',
    excerpt: 'Test post excerpt',
    status: 'draft'
  };
  
  const result = await makeRequest(`${SERVICES.wordpress.url}/wordpress/posts`, {
    method: 'POST',
    data: testPost,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (result.success) {
    console.log(`${COLORS.green}✅ WordPress API test successful${COLORS.reset}`);
    console.log(`   Post ID: ${result.data.data.id}`);
    console.log(`   Title: ${result.data.data.title}`);
  } else {
    console.log(`${COLORS.red}❌ WordPress API test failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testEmailAPI() {
  console.log(`${COLORS.magenta}📧 Testing Email API...${COLORS.reset}`);
  
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
  console.log(`${COLORS.yellow}📱 Testing SMS API...${COLORS.reset}`);
  
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

async function testWhatsAppAPI() {
  console.log(`${COLORS.green}📱 Testing WhatsApp API...${COLORS.reset}`);
  
  const testWhatsApp = {
    to: '+1234567890',
    message: 'Test WhatsApp message from GitHub Clone',
    type: 'text',
    priority: 'normal'
  };
  
  const result = await makeRequest(`${SERVICES.whatsapp.url}/whatsapp/send-message`, {
    method: 'POST',
    data: testWhatsApp,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (result.success) {
    console.log(`${COLORS.green}✅ WhatsApp API test successful${COLORS.reset}`);
    console.log(`   Message ID: ${result.data.data.id}`);
    console.log(`   Status: ${result.data.data.status}`);
  } else {
    console.log(`${COLORS.red}❌ WhatsApp API test failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testTelegramAPI() {
  console.log(`${COLORS.blue}📱 Testing Telegram API...${COLORS.reset}`);
  
  const testTelegram = {
    chatId: '123456789',
    message: 'Test Telegram message from GitHub Clone',
    type: 'text',
    parseMode: 'HTML',
    priority: 'normal'
  };
  
  const result = await makeRequest(`${SERVICES.telegram.url}/telegram/send-message`, {
    method: 'POST',
    data: testTelegram,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (result.success) {
    console.log(`${COLORS.green}✅ Telegram API test successful${COLORS.reset}`);
    console.log(`   Message ID: ${result.data.data.id}`);
    console.log(`   Status: ${result.data.data.status}`);
  } else {
    console.log(`${COLORS.red}❌ Telegram API test failed${COLORS.reset}`);
    console.log(`   Error: ${result.error}`);
  }
  
  return result.success;
}

async function testTemplateAPIs() {
  console.log(`${COLORS.cyan}📝 Testing Template APIs...${COLORS.reset}`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test Email Template
  totalTests++;
  const emailTemplate = {
    to: 'test@example.com',
    template: 'welcome',
    templateData: {
      username: 'TestUser',
      loginUrl: 'http://localhost:3001/login'
    },
    subject: 'Welcome to GitHub Clone!'
  };
  
  const emailResult = await makeRequest(`${SERVICES.email.url}/emails/send-template`, {
    method: 'POST',
    data: emailTemplate,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (emailResult.success) {
    console.log(`${COLORS.green}✅ Email Template API test successful${COLORS.reset}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ Email Template API test failed${COLORS.reset}`);
    console.log(`   Error: ${emailResult.error}`);
  }
  
  // Test SMS Template
  totalTests++;
  const smsTemplate = {
    to: '+1234567890',
    template: 'verification',
    templateData: {
      code: '123456',
      minutes: '10'
    },
    provider: 'twilio'
  };
  
  const smsResult = await makeRequest(`${SERVICES.sms.url}/sms/send-template`, {
    method: 'POST',
    data: smsTemplate,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (smsResult.success) {
    console.log(`${COLORS.green}✅ SMS Template API test successful${COLORS.reset}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ SMS Template API test failed${COLORS.reset}`);
    console.log(`   Error: ${smsResult.error}`);
  }
  
  // Test Telegram Template
  totalTests++;
  const telegramTemplate = {
    chatId: '123456789',
    template: 'Welcome {{username}}! Your verification code is {{code}}.',
    templateData: {
      username: 'TestUser',
      code: '123456'
    }
  };
  
  const telegramResult = await makeRequest(`${SERVICES.telegram.url}/telegram/send-template`, {
    method: 'POST',
    data: telegramTemplate,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (telegramResult.success) {
    console.log(`${COLORS.green}✅ Telegram Template API test successful${COLORS.reset}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ Telegram Template API test failed${COLORS.reset}`);
    console.log(`   Error: ${telegramResult.error}`);
  }
  
  console.log(`\n📝 Template Tests: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

async function testBulkAPIs() {
  console.log(`${COLORS.magenta}📦 Testing Bulk APIs...${COLORS.reset}`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test SMS Bulk
  totalTests++;
  const smsBulk = {
    recipients: ['+1234567890', '+0987654321'],
    message: 'Bulk SMS test from GitHub Clone',
    provider: 'twilio',
    priority: 'normal'
  };
  
  const smsResult = await makeRequest(`${SERVICES.sms.url}/sms/send-bulk`, {
    method: 'POST',
    data: smsBulk,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (smsResult.success) {
    console.log(`${COLORS.green}✅ SMS Bulk API test successful${COLORS.reset}`);
    console.log(`   Total: ${smsResult.data.data.total}`);
    console.log(`   Successful: ${smsResult.data.data.successful}`);
    console.log(`   Failed: ${smsResult.data.data.failed}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ SMS Bulk API test failed${COLORS.reset}`);
    console.log(`   Error: ${smsResult.error}`);
  }
  
  // Test Telegram Bulk
  totalTests++;
  const telegramBulk = {
    chatIds: ['123456789', '987654321'],
    message: 'Bulk Telegram test from GitHub Clone',
    type: 'text',
    parseMode: 'HTML',
    priority: 'normal'
  };
  
  const telegramResult = await makeRequest(`${SERVICES.telegram.url}/telegram/send-bulk`, {
    method: 'POST',
    data: telegramBulk,
    headers: { 'Content-Type': 'application/json' }
  });
  
  if (telegramResult.success) {
    console.log(`${COLORS.green}✅ Telegram Bulk API test successful${COLORS.reset}`);
    console.log(`   Total: ${telegramResult.data.data.total}`);
    console.log(`   Successful: ${telegramResult.data.data.successful}`);
    console.log(`   Failed: ${telegramResult.data.data.failed}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ Telegram Bulk API test failed${COLORS.reset}`);
    console.log(`   Error: ${telegramResult.error}`);
  }
  
  console.log(`\n📦 Bulk Tests: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

async function testWordPressFeatures() {
  console.log(`${COLORS.cyan}🌐 Testing WordPress Features...${COLORS.reset}`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test Categories
  totalTests++;
  const categoryResult = await makeRequest(`${SERVICES.wordpress.url}/wordpress/categories`);
  if (categoryResult.success) {
    console.log(`${COLORS.green}✅ WordPress Categories API test successful${COLORS.reset}`);
    console.log(`   Categories: ${categoryResult.data.data.length}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ WordPress Categories API test failed${COLORS.reset}`);
  }
  
  // Test Tags
  totalTests++;
  const tagsResult = await makeRequest(`${SERVICES.wordpress.url}/wordpress/tags`);
  if (tagsResult.success) {
    console.log(`${COLORS.green}✅ WordPress Tags API test successful${COLORS.reset}`);
    console.log(`   Tags: ${tagsResult.data.data.length}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ WordPress Tags API test failed${COLORS.reset}`);
  }
  
  // Test Users
  totalTests++;
  const usersResult = await makeRequest(`${SERVICES.wordpress.url}/wordpress/users`);
  if (usersResult.success) {
    console.log(`${COLORS.green}✅ WordPress Users API test successful${COLORS.reset}`);
    console.log(`   Users: ${usersResult.data.data.users.length}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ WordPress Users API test failed${COLORS.reset}`);
  }
  
  console.log(`\n🌐 WordPress Features: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

async function testWhatsAppFeatures() {
  console.log(`${COLORS.green}📱 Testing WhatsApp Features...${COLORS.reset}`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test QR Code
  totalTests++;
  const qrResult = await makeRequest(`${SERVICES.whatsapp.url}/whatsapp/qr`);
  if (qrResult.success) {
    console.log(`${COLORS.green}✅ WhatsApp QR Code API test successful${COLORS.reset}`);
    console.log(`   QR Code Available: ${!!qrResult.data.qrCode}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ WhatsApp QR Code API test failed${COLORS.reset}`);
  }
  
  // Test Status
  totalTests++;
  const statusResult = await makeRequest(`${SERVICES.whatsapp.url}/whatsapp/status`);
  if (statusResult.success) {
    console.log(`${COLORS.green}✅ WhatsApp Status API test successful${COLORS.reset}`);
    console.log(`   Connected: ${statusResult.data.connected}`);
    console.log(`   Status: ${statusResult.data.status}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ WhatsApp Status API test failed${COLORS.reset}`);
  }
  
  console.log(`\n📱 WhatsApp Features: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

async function testTelegramFeatures() {
  console.log(`${COLORS.blue}📱 Testing Telegram Features...${COLORS.reset}`);
  
  let passedTests = 0;
  let totalTests = 0;
  
  // Test Bot Info
  totalTests++;
  const botInfoResult = await makeRequest(`${SERVICES.telegram.url}/telegram/bot-info`);
  if (botInfoResult.success) {
    console.log(`${COLORS.green}✅ Telegram Bot Info API test successful${COLORS.reset}`);
    console.log(`   Bot Username: ${botInfoResult.data.username}`);
    console.log(`   Bot Name: ${botInfoResult.data.first_name}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ Telegram Bot Info API test failed${COLORS.reset}`);
  }
  
  // Test Webhook Info
  totalTests++;
  const webhookResult = await makeRequest(`${SERVICES.telegram.url}/telegram/webhook-info`);
  if (webhookResult.success) {
    console.log(`${COLORS.green}✅ Telegram Webhook Info API test successful${COLORS.reset}`);
    console.log(`   Webhook URL: ${webhookResult.data.url || 'Not set'}`);
    passedTests++;
  } else {
    console.log(`${COLORS.red}❌ Telegram Webhook Info API test failed${COLORS.reset}`);
  }
  
  console.log(`\n📱 Telegram Features: ${passedTests}/${totalTests} passed`);
  return passedTests === totalTests;
}

async function runAllTests() {
  console.log(`${COLORS.bold}${COLORS.cyan}🚀 Starting All Integration Services Test Suite${COLORS.reset}\n`);
  
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
  if (await testWordPressAPI()) {
    passedTests++;
  }
  console.log('');
  
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
  if (await testWhatsAppAPI()) {
    passedTests++;
  }
  console.log('');
  
  totalTests++;
  if (await testTelegramAPI()) {
    passedTests++;
  }
  console.log('');
  
  // Template tests
  totalTests++;
  if (await testTemplateAPIs()) {
    passedTests++;
  }
  console.log('');
  
  // Bulk tests
  totalTests++;
  if (await testBulkAPIs()) {
    passedTests++;
  }
  console.log('');
  
  // Feature tests
  totalTests++;
  if (await testWordPressFeatures()) {
    passedTests++;
  }
  console.log('');
  
  totalTests++;
  if (await testWhatsAppFeatures()) {
    passedTests++;
  }
  console.log('');
  
  totalTests++;
  if (await testTelegramFeatures()) {
    passedTests++;
  }
  console.log('');
  
  // Results
  console.log(`${COLORS.bold}📊 Final Test Results:${COLORS.reset}`);
  console.log(`${COLORS.green}✅ Passed: ${passedTests}/${totalTests}${COLORS.reset}`);
  console.log(`${COLORS.red}❌ Failed: ${totalTests - passedTests}/${totalTests}${COLORS.reset}`);
  
  const successRate = Math.round((passedTests / totalTests) * 100);
  console.log(`${COLORS.cyan}📈 Success Rate: ${successRate}%${COLORS.reset}`);
  
  if (passedTests === totalTests) {
    console.log(`\n${COLORS.green}${COLORS.bold}🎉 All tests passed! All integration services are working correctly.${COLORS.reset}`);
  } else if (successRate >= 80) {
    console.log(`\n${COLORS.yellow}${COLORS.bold}⚠️  Most tests passed (${successRate}%). Some services may need configuration.${COLORS.reset}`);
  } else {
    console.log(`\n${COLORS.red}${COLORS.bold}❌ Many tests failed (${successRate}% success rate). Please check service configurations.${COLORS.reset}`);
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
