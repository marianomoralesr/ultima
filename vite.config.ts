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
        // Preserve variable declarations to prevent initialization errors
        format: 'es',
        // DISABLE manual chunking completely - let Rollup handle it automatically
        // This prevents circular dependency and initialization issues
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
        // Preserve module structure to prevent variable hoisting issues
        preserveModules: false,
        // Ensure strict ordering - CRITICAL for preventing initialization errors
        hoistTransitiveImports: false,
      },
    },
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 2000,
    // CRITICAL: Keep minification disabled - ANY code transformation breaks variable initialization
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
    reportCompressedSize: false, // Disable to speed up build
    // Completely disable tree-shaking for problematic dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
      strictRequires: true,
    },
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
    exclude: [
      '@aws-sdk/client-s3',
      '@aws-sdk/client-cloudfront',
      '@aws-sdk/credential-provider-node',
      '@aws-sdk/signature-v4',
    ], // AWS SDK: load on demand, don't transform
    esbuildOptions: {
      // Preserve variable declarations for AWS SDK
      keepNames: true,
      // Don't transform AWS SDK imports
      // This prevents variable initialization errors
    },
  },
  // Enable caching
  cacheDir: 'node_modules/.vite',
  // Performance optimizations
  esbuild: {
    // Legal comments for licenses
    legalComments: 'none',
    // Target for syntax transformation
    target: 'es2020',
    // CRITICAL: Preserve variable names to prevent initialization errors
    keepNames: true,
    // Keep console.error for debugging production issues
    // drop: ['debugger'], // Only drop debugger statements
  },
});