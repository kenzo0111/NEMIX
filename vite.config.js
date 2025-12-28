import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import collectModuleAssetsPaths from './vite-module-loader.js';

export default defineConfig(async () => {
    const paths = await collectModuleAssetsPaths(['resources/js/app.tsx'], 'Modules');

    return {
        plugins: [
            laravel({
                input: paths,
                refresh: true,
            }),
            react(),
        ],
    };
});
