import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({ plugins: [react()], resolve: { alias: { '@': path.resolve('resources/js') } }, server: { host: '127.0.0.1', port: 5179, strictPort: true } });
