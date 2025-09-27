# 📧📱 Email & SMS Services Deployment Guide

## 🚀 Overview

This guide covers the deployment and configuration of the Kafka-based Email and SMS services for the GitHub Clone microservices architecture.

## 📋 Services Included

### 1. **Email Service** (Port 3005)
- **Purpose**: Send transactional emails, notifications, and alerts
- **Features**: 
  - SMTP integration (Gmail, SendGrid, etc.)
  - Handlebars templates
  - Kafka event consumption
  - Delivery tracking
  - HTML & text email support

### 2. **SMS Service** (Port 3006)
- **Purpose**: Send SMS notifications, verification codes, and alerts
- **Features**:
  - Multiple providers (Twilio, AWS SNS, Vonage)
  - Template support
  - Kafka event consumption
  - Delivery reports
  - Cost tracking

## 🔧 Prerequisites

### Required Environment Variables

Create a `.env` file in the project root:

```bash
# SMTP Configuration (Email Service)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@githubclone.com

# Twilio Configuration (SMS Service)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Webhook URLs
SMS_WEBHOOK_URL=http://localhost:3006

# Frontend URL
FRONTEND_URL=http://localhost:3001
```

### Gmail SMTP Setup

1. Enable 2-factor authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Use this password in `SMTP_PASS`

### Twilio Setup

1. Sign up for Twilio account
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number for SMS sending
4. Configure webhook URL for delivery reports

## 🚀 Deployment

### 1. **Start Kafka Infrastructure**

```bash
# Start Kafka services
docker-compose -f docker-compose.kafka.yml up -d

# Wait for services to be ready
docker-compose -f docker-compose.kafka.yml logs -f kafka
```

### 2. **Build and Start Email & SMS Services**

```bash
# Build services
docker-compose -f docker-compose.kafka.yml build email-service sms-service

# Start services
docker-compose -f docker-compose.kafka.yml up -d email-service sms-service

# Check service health
docker-compose -f docker-compose.kafka.yml logs -f email-service sms-service
```

### 3. **Verify Services**

```bash
# Test services
node scripts/test-email-sms.js

# Check individual service health
curl http://localhost:3005/health  # Email Service
curl http://localhost:3006/health  # SMS Service
```

## 📊 Service Endpoints

### Email Service (Port 3005)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/metrics` | GET | Service metrics |
| `/emails/send` | POST | Send email |
| `/emails/send-template` | POST | Send templated email |
| `/emails/status/:id` | GET | Get email status |
| `/emails/history/:userId` | GET | Get email history |

### SMS Service (Port 3006)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Service health check |
| `/metrics` | GET | Service metrics |
| `/sms/send` | POST | Send SMS |
| `/sms/send-bulk` | POST | Send bulk SMS |
| `/sms/send-template` | POST | Send templated SMS |
| `/sms/status/:id` | GET | Get SMS status |
| `/sms/history/:userId` | GET | Get SMS history |
| `/sms/webhook/twilio` | POST | Twilio delivery reports |

## 📧 Email Templates

Templates are located in `services/email-service/src/templates/`:

- **welcome.hbs**: Welcome email for new users
- **notification.hbs**: General notifications
- **alert.hbs**: Security alerts

### Template Usage

```javascript
// Send templated email
const emailData = {
  to: 'user@example.com',
  template: 'welcome',
  templateData: {
    username: 'John Doe',
    loginUrl: 'http://localhost:3001/login'
  },
  subject: 'Welcome to GitHub Clone!'
};
```

## 📱 SMS Templates

Templates are located in `services/sms-service/src/templates/`:

- **verification.txt**: Verification codes
- **twoFactor.txt**: 2FA codes
- **passwordReset.txt**: Password reset codes

### Template Usage

```javascript
// Send templated SMS
const smsData = {
  to: '+1234567890',
  template: 'verification',
  templateData: {
    code: '123456',
    minutes: '10'
  },
  provider: 'twilio'
};
```

## 🔄 Kafka Integration

### Topics Created

- `email-notifications`: Email notifications from other services
- `email-events`: Email service events
- `sms-notifications`: SMS notifications from other services
- `sms-events`: SMS service events
- `sms-delivery-reports`: SMS delivery reports

### Publishing Events

```javascript
// From any microservice
await kafkaService.publishMessage('email-notifications', {
  notificationId: 'uuid',
  userId: 'user123',
  type: 'welcome',
  title: 'Welcome!',
  message: 'Welcome to our platform'
});

await kafkaService.publishMessage('sms-notifications', {
  notificationId: 'uuid',
  userId: 'user123',
  type: 'verification',
  message: 'Your verification code is: 123456'
});
```

## 📊 Monitoring

### Health Checks

```bash
# Email Service Health
curl http://localhost:3005/health

# SMS Service Health
curl http://localhost:3006/health
```

### Metrics

```bash
# Email Service Metrics
curl http://localhost:3005/metrics

# SMS Service Metrics
curl http://localhost:3006/metrics
```

### Kafka UI

Access Kafka UI at `http://localhost:8080` to monitor:
- Topic messages
- Consumer groups
- Service connections

## 🛠️ Troubleshooting

### Common Issues

1. **SMTP Authentication Failed**
   - Check Gmail App Password
   - Verify 2FA is enabled
   - Check firewall settings

2. **Twilio SMS Failed**
   - Verify Account SID and Auth Token
   - Check phone number format (+1234567890)
   - Ensure sufficient account balance

3. **Kafka Connection Issues**
   - Check if Kafka is running
   - Verify network connectivity
   - Check topic creation

### Logs

```bash
# View service logs
docker-compose -f docker-compose.kafka.yml logs -f email-service
docker-compose -f docker-compose.kafka.yml logs -f sms-service

# View Kafka logs
docker-compose -f docker-compose.kafka.yml logs -f kafka
```

## 🔒 Security Considerations

1. **Environment Variables**
   - Never commit `.env` files
   - Use Docker secrets in production
   - Rotate API keys regularly

2. **Rate Limiting**
   - SMS service has stricter limits (10/15min)
   - Email service allows 100/15min
   - Implement additional throttling as needed

3. **Template Security**
   - Validate template data
   - Sanitize user inputs
   - Use CSP headers for emails

## 📈 Performance Optimization

### Email Service
- Connection pooling (max 5 connections)
- Template caching
- Async processing
- Compression enabled

### SMS Service
- Provider failover
- Cost tracking
- Bulk sending support
- Delivery report processing

## 🚀 Production Deployment

### Docker Compose Production

```bash
# Use production environment
docker-compose -f docker-compose.kafka.yml -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.kafka.yml up -d --scale email-service=2 --scale sms-service=2
```

### Resource Limits

- **Email Service**: 192MB RAM, 0.3 CPU
- **SMS Service**: 192MB RAM, 0.3 CPU
- **Kafka**: 512MB RAM, 0.8 CPU

### Health Monitoring

```bash
# Monitor service health
while true; do
  echo "Email Service: $(curl -s http://localhost:3005/health | jq -r '.status')"
  echo "SMS Service: $(curl -s http://localhost:3006/health | jq -r '.status')"
  sleep 30
done
```

## 📞 Support

For issues or questions:
1. Check service logs
2. Verify environment configuration
3. Test with the provided test scripts
4. Monitor Kafka UI for message flow

---

**🎉 Your Email & SMS services are now ready for production use!**
