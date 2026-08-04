import { defineConfig } from 'vite';

export default defineConfig({
  // Treat the current directory as the project root (where index.html lives)
  root: '.',

  server: {
    port: 5173,
    // Proxy all /api/* requests to the backend
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },

  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
