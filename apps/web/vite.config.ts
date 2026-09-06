import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@hermes/crypto': path.resolve(__dirname, '../../packages/crypto/src'),
      '@hermes/core': path.resolve(__dirname, '../../packages/core/src'),
      '@hermes/protocol': path.resolve(__dirname, '../../packages/protocol/src'),
      '@hermes/storage': path.resolve(__dirname, '../../packages/storage/src'),
      '@hermes/sync': path.resolve(__dirname, '../../packages/sync/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});
