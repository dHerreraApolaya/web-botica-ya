import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { validateClientEnvironment } from './src/config/env.schema.ts';

export default defineConfig(({ mode }) => {
  validateClientEnvironment({
    ...loadEnv(mode, process.cwd(), 'VITE_'),
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => name.startsWith('VITE_'))),
  });
  const apiTarget =
    mode === 'api-public' ? 'https://boticaya-catalog-service.vercel.app' : 'http://127.0.0.1:8081';
  return {
    plugins: [react(), tailwindcss()],
    server: { proxy: { '/api': { target: apiTarget, changeOrigin: true, secure: true } } },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
