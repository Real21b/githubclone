// 🚀 Unified Index Component
// Single page that works with both Vite and Next.js servers
// Microservices integration with dynamic server detection

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Switch,
  FormControlLabel,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  GitHub,
  Code,
  Storage,
  Cloud,
  Security,
  Speed,
  CheckCircle,
  Error,
  Warning,
  Info,
  Refresh,
  Settings,
  Dashboard,
  Api,
  Webhook,
  SmartToy,
  Chat,
  Email,
  Sms,
  Extension,
  FlashOn,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

// Service status interface
interface ServiceStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  responseTime?: number;
  lastCheck?: string;
  endpoint?: string;
}

// Server type detection
type ServerType = 'vite' | 'nextjs' | 'unknown';

const UnifiedIndex: React.FC = () => {
  const [serverType, setServerType] = useState<ServerType>('unknown');
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Detect server type
  useEffect(() => {
    const detectServerType = () => {
      // Check if we're running in Vite development mode
      if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
        setServerType('vite');
      } else if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
        // Check for Next.js specific features
        if (document.querySelector('script[src*="next"]')) {
          setServerType('nextjs');
        } else {
          setServerType('vite');
        }
      } else {
        setServerType('nextjs');
      }
    };

    detectServerType();
  }, []);

  // Service endpoints configuration
  const serviceEndpoints = useMemo(() => [
    { name: 'Auth Service', port: 3001, icon: <Security /> },
    { name: 'Core Service', port: 3002, icon: <Code /> },
    { name: 'File Service', port: 3003, icon: <Storage /> },
    { name: 'Email Service', port: 3004, icon: <Email /> },
    { name: 'SMS Service', port: 3005, icon: <Sms /> },
    { name: 'Notification Service', port: 3006, icon: <Webhook /> },
    { name: 'WordPress Service', port: 3007, icon: <Api /> },
    { name: 'WhatsApp Service', port: 3008, icon: <Chat /> },
    { name: 'Telegram Service', port: 3009, icon: <Chat /> },
    { name: 'AI Service', port: 3010, icon: <SmartToy /> },
    { name: 'Real-time Service', port: 3011, icon: <FlashOn /> },
    { name: 'Integration Service', port: 3012, icon: <Extension /> },
  ], []);

  // Check service health
  const checkServiceHealth = useCallback(async (service: typeof serviceEndpoints[0]): Promise<ServiceStatus> => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`http://localhost:${service.port}/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        return {
          name: service.name,
          status: 'healthy',
          responseTime,
          lastCheck: new Date().toISOString(),
          endpoint: `http://localhost:${service.port}`,
        };
      } else {
        return {
          name: service.name,
          status: 'warning',
          responseTime,
          lastCheck: new Date().toISOString(),
          endpoint: `http://localhost:${service.port}`,
        };
      }
    } catch (error) {
      return {
        name: service.name,
        status: 'error',
        responseTime: Date.now() - startTime,
        lastCheck: new Date().toISOString(),
        endpoint: `http://localhost:${service.port}`,
      };
    }
  }, []);

  // Check all services
  const checkAllServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const serviceChecks = await Promise.allSettled(
        serviceEndpoints.map(service => checkServiceHealth(service))
      );
      
      const results = serviceChecks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            name: serviceEndpoints[index].name,
            status: 'error' as const,
            lastCheck: new Date().toISOString(),
            endpoint: `http://localhost:${serviceEndpoints[index].port}`,
          };
        }
      });
      
      setServices(results);
      setLastUpdate(new Date());
      
      // Show toast notification
      const healthyCount = results.filter(s => s.status === 'healthy').length;
      const totalCount = results.length;
      
      if (healthyCount === totalCount) {
        toast.success(`All ${totalCount} services are healthy!`);
      } else if (healthyCount > totalCount / 2) {
        toast(`${healthyCount}/${totalCount} services are healthy`, { icon: '⚠️' });
      } else {
        toast.error(`Only ${healthyCount}/${totalCount} services are healthy`);
      }
    } catch (error) {
      toast.error('Failed to check services');
    } finally {
      setIsLoading(false);
    }
  }, [serviceEndpoints, checkServiceHealth]);

  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(checkAllServices, 30000); // Check every 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh, checkAllServices]);

  // Initial service check
  useEffect(() => {
    checkAllServices();
  }, [checkAllServices]);

  // Get status color
  const getStatusColor = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'error';
      default: return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy': return <CheckCircle />;
      case 'warning': return <Warning />;
      case 'error': return <Error />;
      default: return <Info />;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h2" component="h1" gutterBottom>
            🚀 GitHub Clone
          </Typography>
          <Typography variant="h5" color="text.secondary" gutterBottom>
            Modern Development Platform
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2 }}>
            <Chip
              icon={<Code />}
              label={`Server: ${serverType.toUpperCase()}`}
              color={serverType === 'vite' ? 'primary' : 'secondary'}
              variant="outlined"
            />
            <Chip
              icon={<Cloud />}
              label="Microservices Architecture"
              color="info"
              variant="outlined"
            />
            <Chip
              icon={<Speed />}
              label="Real-time Integration"
              color="success"
              variant="outlined"
            />
          </Box>
        </Box>
      </motion.div>

      {/* Server Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            🖥️ Server Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Server Type:</strong> {serverType === 'vite' ? 'Vite Development Server' : 'Next.js Production Server'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Environment:</strong> {serverType === 'vite' ? 'Development' : 'Production'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Port:</strong> 3000
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Last Update:</strong> {lastUpdate.toLocaleTimeString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Auto Refresh:</strong> {autoRefresh ? 'Enabled' : 'Disabled'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Total Services:</strong> {serviceEndpoints.length}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Paper sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              🔧 Controls
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={autoRefresh}
                    onChange={(e) => setAutoRefresh(e.target.checked)}
                  />
                }
                label="Auto Refresh"
              />
              <Button
                variant="outlined"
                startIcon={<Refresh />}
                onClick={checkAllServices}
                disabled={isLoading}
              >
                {isLoading ? <CircularProgress size={20} /> : 'Refresh'}
              </Button>
            </Box>
          </Box>
        </Paper>
      </motion.div>

      {/* Services Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Typography variant="h6" gutterBottom>
          🔍 Microservices Status
        </Typography>
        <Grid container spacing={2}>
          {services.map((service, index) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={service.name}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    border: `2px solid ${
                      service.status === 'healthy' ? '#4caf50' :
                      service.status === 'warning' ? '#ff9800' : '#f44336'
                    }`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {serviceEndpoints.find(s => s.name === service.name)?.icon}
                      <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                        {service.name}
                      </Typography>
                      <Tooltip title={service.status}>
                        <IconButton size="small">
                          {getStatusIcon(service.status)}
                        </IconButton>
                      </Tooltip>
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={service.status.toUpperCase()}
                        color={getStatusColor(service.status) as any}
                        size="small"
                        sx={{ mb: 1 }}
                      />
                    </Box>
                    
                    {service.responseTime && (
                      <Typography variant="body2" color="text.secondary">
                        Response Time: {service.responseTime}ms
                      </Typography>
                    )}
                    
                    {service.endpoint && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Endpoint: {service.endpoint}
                      </Typography>
                    )}
                    
                    {service.lastCheck && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Last Check: {new Date(service.lastCheck).toLocaleTimeString()}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            ⚡ Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="contained"
                fullWidth
                startIcon={<Dashboard />}
                href="/dashboard"
              >
                Dashboard
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Api />}
                href="/api-docs"
              >
                API Documentation
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<Settings />}
                href="/settings"
              >
                Settings
              </Button>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<GitHub />}
                href="https://github.com"
                target="_blank"
              >
                GitHub
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>

      {/* System Information */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Paper sx={{ p: 3, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            📊 System Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Frontend:</strong> {serverType === 'vite' ? 'Vite + React' : 'Next.js + React'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Backend:</strong> 12 Microservices
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Database:</strong> PostgreSQL 15
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Cache:</strong> Redis 7
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <strong>Message Queue:</strong> Kafka + Zookeeper
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>API Gateway:</strong> Nginx
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Monitoring:</strong> Prometheus + Grafana
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Containerization:</strong> Docker + Docker Compose
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      </motion.div>
    </Container>
  );
};

export default UnifiedIndex;
