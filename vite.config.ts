import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/',
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/intelimotor-api': {
        target: 'https://jjepfehmuybpctdzipnu.supabase.co/functions/v1/intelimotor-api',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/intelimotor-api/, ''),
      },
    },
  },
  build: {
    sourcemap: true,
  },
});