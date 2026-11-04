import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { validateClientEnvironment } from './src/config/env.schema.ts';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  validateClientEnvironment({
    ...loadEnv(mode, process.cwd(), 'VITE_'),
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => name.startsWith('VITE_'))),
  });
  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/v1': { target: 'http://127.0.0.1:3001', changeOrigin: true },
      },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  };
});
