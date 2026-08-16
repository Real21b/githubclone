'use client';

// 🚀 Unified Index Component
// Single page that works with both Vite and Next.js servers
// Microservices integration with dynamic server detection

import {
  Api,
  Chat,
  CheckCircle,
  Cloud,
  Code,
  Dashboard,
  Email,
  Error as ErrorIcon,
  Extension,
  FlashOn,
  GitHub,
  Info,
  Refresh,
  Security,
  Settings,
  SmartToy,
  Sms,
  Speed,
  Storage,
  Warning,
  Webhook,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import type React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
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
type ServerType = 'nextjs';

const UnifiedIndex: React.FC = () => {
  // ADR-001 ile Vite kaldirildi; calisan tek sunucu Next.js.
  const serverType: ServerType = 'nextjs';
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Service endpoints configuration
  const serviceEndpoints = useMemo(
    () => [
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
    ],
    [],
  );

  // Check service health
  const checkServiceHealth = useCallback(
    async (service: (typeof serviceEndpoints)[0]): Promise<ServiceStatus> => {
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
      } catch {
        return {
          name: service.name,
          status: 'error',
          responseTime: Date.now() - startTime,
          lastCheck: new Date().toISOString(),
          endpoint: `http://localhost:${service.port}`,
        };
      }
    },
    [],
  );

  // Check all services
  const checkAllServices = useCallback(async () => {
    setIsLoading(true);
    try {
      const serviceChecks = await Promise.allSettled(
        serviceEndpoints.map((service) => checkServiceHealth(service)),
      );

      const results = serviceChecks.map((result, index) => {
        if (result.status === 'fulfilled') {
          return result.value;
        }
        // `serviceChecks` uzunlukça `serviceEndpoints` ile birebir eşleşir, ancak
        // bunu tip sistemine kanıtlayamayız; eksik girdi savunmacı olarak ele alınır.
        const endpoint = serviceEndpoints[index];
        return {
          name: endpoint?.name ?? `bilinmeyen-servis-${index}`,
          status: 'error' as const,
          lastCheck: new Date().toISOString(),
          endpoint: endpoint ? `http://localhost:${endpoint.port}` : '',
        };
      });

      setServices(results);
      setLastUpdate(new Date());

      // Show toast notification
      const healthyCount = results.filter((s) => s.status === 'healthy').length;
      const totalCount = results.length;

      if (healthyCount === totalCount) {
        toast.success(`All ${totalCount} services are healthy!`);
      } else if (healthyCount > totalCount / 2) {
        toast(`${healthyCount}/${totalCount} services are healthy`, { icon: '⚠️' });
      } else {
        toast.error(`Only ${healthyCount}/${totalCount} services are healthy`);
      }
    } catch {
      toast.error('Failed to check services');
    } finally {
      setIsLoading(false);
    }
  }, [serviceEndpoints, checkServiceHealth]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return undefined;
    const interval = setInterval(checkAllServices, 30_000); // 30 saniyede bir
    return () => clearInterval(interval);
  }, [autoRefresh, checkAllServices]);

  // Initial service check
  useEffect(() => {
    checkAllServices();
  }, [checkAllServices]);

  // Get status color
  const getStatusColor = (
    status: ServiceStatus['status'],
  ): 'success' | 'warning' | 'error' | 'default' => {
    switch (status) {
      case 'healthy':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  // Get status icon
  const getStatusIcon = (status: ServiceStatus['status']) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle />;
      case 'warning':
        return <Warning />;
      case 'error':
        return <ErrorIcon />;
      default:
        return <Info />;
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
              color="secondary"
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Server Type:</strong> Next.js
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Environment:</strong> {process.env.NODE_ENV}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                <strong>Port:</strong> 3000
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Typography variant="h6">🔧 Controls</Typography>
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
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={service.name}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card
                  sx={{
                    height: '100%',
                    border: `2px solid ${
                      service.status === 'healthy'
                        ? '#4caf50'
                        : service.status === 'warning'
                          ? '#ff9800'
                          : '#f44336'
                    }`,
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      transition: 'transform 0.2s ease-in-out',
                    },
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      {serviceEndpoints.find((s) => s.name === service.name)?.icon}
                      <Typography variant="h6" sx={{ ml: 1, flexGrow: 1 }}>
                        {service.name}
                      </Typography>
                      <Tooltip title={service.status}>
                        <IconButton size="small">{getStatusIcon(service.status)}</IconButton>
                      </Tooltip>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Chip
                        label={service.status.toUpperCase()}
                        color={getStatusColor(service.status)}
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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button variant="contained" fullWidth startIcon={<Dashboard />} href="/dashboard">
                Dashboard
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button variant="outlined" fullWidth startIcon={<Api />} href="/api-docs">
                API Documentation
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button variant="outlined" fullWidth startIcon={<Settings />} href="/settings">
                Settings
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Frontend:</strong> Next.js 16 + React 19
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
            <Grid size={{ xs: 12, md: 6 }}>
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
