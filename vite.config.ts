import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  base: '/',
  plugins: [react(), tsconfigPaths()],
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