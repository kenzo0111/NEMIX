import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
export default defineConfig({
    root: path.resolve('tmp/notification-preview'),
    resolve: { alias: { '@': path.resolve('resources/js') } },
    plugins: [react()],
    server: { fs: { allow: [path.resolve('.')] } },
});
