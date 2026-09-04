import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const apiPort = process.env.API_PORT ?? '3000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.WEB_PORT ?? 5273),
    strictPort: true,
    // Proxying keeps the SPA and the API same-site in development, which is
    // what lets the SameSite=Lax session cookie work at all (ADR-0002).
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: false,
      },
    },
  },
});
