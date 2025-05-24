import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true
  },
  server: {
    host: true,
    hmr: {
      host: 'localhost'
    },
    cors: true,
    allowedHosts: 'all'
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  }
}); 