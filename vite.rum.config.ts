import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { validateClientEnvironment } from './src/config/env.schema.ts';

export default defineConfig(({ mode }) => {
  validateClientEnvironment({
    ...loadEnv(mode, process.cwd(), 'VITE_'),
    ...Object.fromEntries(Object.entries(process.env).filter(([name]) => name.startsWith('VITE_'))),
  });
  return {
    envDir: fileURLToPath(new URL('.', import.meta.url)),
    publicDir: false,
    plugins: [react(), tailwindcss()],
    resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
    server: { host: '127.0.0.1', port: 4174, strictPort: true },
    build: {
      outDir: fileURLToPath(new URL('./dist-rum-pilot', import.meta.url)),
      emptyOutDir: true,
      rollupOptions: { input: fileURLToPath(new URL('./rum-pilot/index.html', import.meta.url)) },
    },
  };
});
