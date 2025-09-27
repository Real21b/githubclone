import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // React Fast Refresh
      fastRefresh: true,
      // Babel optimizations
      babel: {
        plugins: [
          // Remove console.log in production
          process.env.NODE_ENV === 'production' && [
            'transform-remove-console',
            { exclude: ['error', 'warn'] }
          ]
        ].filter(Boolean)
      }
    }),
    // PWA support
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'GitHub Clone',
        short_name: 'GitHub Clone',
        description: 'A modern GitHub clone built with Vite and React',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  
  // Development server configuration
  server: {
    port: 3001,
    host: true,
    open: true,
    cors: true,
    proxy: {
      // Proxy API requests to backend services
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/graphql': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false
      },
      '/auth': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/files': {
        target: 'http://localhost:3003',
        changeOrigin: true,
        secure: false
      },
      '/realtime': {
        target: 'http://localhost:3011',
        changeOrigin: true,
        secure: false,
        ws: true // WebSocket proxy
      },
      '/integrations': {
        target: 'http://localhost:3012',
        changeOrigin: true,
        secure: false
      }
    }
  },

  // Production build configuration
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: process.env.NODE_ENV === 'development',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          vendor: ['react', 'react-dom'],
          mui: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          apollo: ['@apollo/client', 'graphql'],
          utils: ['axios', 'date-fns', 'zustand'],
          socket: ['socket.io-client']
        },
        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]'
      }
    },
    // Optimize bundle size
    chunkSizeWarningLimit: 1000,
    // Enable tree shaking
    treeshake: true,
    // Production optimizations
    cssCodeSplit: true,
    reportCompressedSize: false,
    // Enable gzip compression
    assetsInlineLimit: 4096
  },

  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@pages': resolve(__dirname, './src/pages'),
      '@hooks': resolve(__dirname, './src/hooks'),
      '@utils': resolve(__dirname, './src/utils'),
      '@types': resolve(__dirname, './src/types'),
      '@graphql': resolve(__dirname, './src/graphql'),
      '@theme': resolve(__dirname, './src/theme')
    }
  },

  // CSS configuration
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@/theme/variables.scss";`
      }
    }
  },

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@mui/material',
      '@mui/icons-material',
      '@apollo/client',
      'graphql',
      'axios',
      'zustand'
    ],
    exclude: ['@vite/client', '@vite/env']
  },

  // Preview server (for production preview)
  preview: {
    port: 3001,
    host: true,
    cors: true
  }
})
