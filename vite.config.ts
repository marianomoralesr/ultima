import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  base: '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/intelimotor-api': {
        target: 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/valuation-proxy',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/intelimotor-api/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // Add Supabase authorization header for Edge Function access
            proxyReq.setHeader('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpqZXBmZWhtdXlicGN0ZHppcG51Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDE5OTYwMywiZXhwIjoyMDU5Nzc1NjAzfQ.KwSFEXOrtgwgIjMVG-czB73VWQIVDahgDvTdyL5qSQo');

            // Forward Intelimotor credentials from frontend to Edge Function
            if (req.headers['x-api-key']) {
              proxyReq.setHeader('x-api-key', req.headers['x-api-key']);
            }
            if (req.headers['x-api-secret']) {
              proxyReq.setHeader('x-api-secret', req.headers['x-api-secret']);
            }
          });
        },
      },
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,

    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and related libraries
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }

            // UI library chunks
            if (id.includes('@radix-ui')) {
              return 'radix-ui';
            }

            // Charts and visualization
            if (id.includes('recharts') || id.includes('framer-motion')) {
              return 'visualization';
            }

            // PDF and canvas libraries
            if (id.includes('jspdf') || id.includes('html2canvas')) {
              return 'pdf-tools';
            }

            // Supabase and data libraries
            if (id.includes('@supabase') || id.includes('@tanstack/react-query')) {
              return 'data-vendor';
            }

            // AWS SDK
            if (id.includes('@aws-sdk')) {
              return 'aws-vendor';
            }

            // Other vendor code
            return 'vendor';
          }

          // Split large page components
          if (id.includes('/src/pages/')) {
            const pageName = id.split('/pages/')[1]?.split('.')[0];
            return `page-${pageName}`;
          }
        },

        // Optimize chunk naming for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

  },
});