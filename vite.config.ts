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
    // Enable production source maps for debugging (can be disabled if not needed)
    sourcemap: false,
    // Optimize chunking strategy
    rollupOptions: {
      output: {
        // Manual chunking for better code splitting
        manualChunks: (id) => {
          // Split vendor chunks for better caching
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Supabase and auth related
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // UI components and animations
            if (id.includes('@radix-ui') || id.includes('framer-motion') || id.includes('react-spring')) {
              return 'ui-vendor';
            }
            // Data visualization
            if (id.includes('recharts') || id.includes('html2canvas') || id.includes('jspdf')) {
              return 'visualization-vendor';
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('zod')) {
              return 'form-vendor';
            }
            // AWS SDK
            if (id.includes('@aws-sdk')) {
              return 'aws-vendor';
            }
            // Tanstack
            if (id.includes('@tanstack')) {
              return 'tanstack-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // All other vendor dependencies
            return 'vendor';
          }
          // Keep shared components in a separate chunk
          if (id.includes('src/components/') && !id.includes('src/components/Admin')) {
            return 'shared-components';
          }
          // Admin components in separate chunk
          if (id.includes('src/components/Admin')) {
            return 'admin-components';
          }
        },
        // Configure asset file names for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.');
          let ext = info?.[info.length - 1];
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name ?? '')) {
            ext = 'img';
          } else if (ext === 'css') {
            return 'assets/css/[name]-[hash][extname]';
          }
          return `assets/${ext}/[name]-[hash][extname]`;
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Increase chunk size warning limit to 750kB (we'll handle large libs separately)
    chunkSizeWarningLimit: 750,
    // Disable minification to avoid variable hoisting issues
    minify: false,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
    // Target modern browsers for smaller bundles
    target: 'es2020',
    // Enable module preload polyfill
    modulePreload: {
      polyfill: true,
    },
    // Report compressed size
    reportCompressedSize: true,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      '@tanstack/react-query',
      'framer-motion',
    ],
    exclude: ['@aws-sdk/client-s3'], // Large dependency, load on demand
  },
  // Enable caching
  cacheDir: 'node_modules/.vite',
  // Performance optimizations
  esbuild: {
    // Legal comments for licenses
    legalComments: 'none',
    // Target for syntax transformation
    target: 'es2020',
    // Keep console.error for debugging production issues
    // drop: ['debugger'], // Only drop debugger statements
  },
});