// Health check endpoint for Vite frontend
export default function healthHandler(req: any, res: any) {
  res.status(200).json({
    status: 'healthy',
    service: 'frontend-vite',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
}
