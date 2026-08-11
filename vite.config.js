import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import collectModuleAssetsPaths from './vite-module-loader.js';

export default defineConfig(async () => {
    const paths = await collectModuleAssetsPaths(['resources/js/app.tsx'], 'Modules');

    const getPackageChunkName = (id) => {
        const match = id.match(/node_modules\/(?:\.pnpm\/[^/]+\/node_modules\/)?(@[^/]+\/[^/]+|[^/]+)/);

        if (!match) {
            return 'vendor';
        }

        return `vendor-${match[1].replace(/^@/, '').replace('/', '-')}`;
    };

    return {
        build: {
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (!id.includes('node_modules')) {
                            return undefined;
                        }

                        if (id.includes('pdfjs-dist')) {
                            return 'pdfjs';
                        }

                        if (id.includes('jspdf-autotable')) {
                            return 'jspdf-autotable';
                        }

                        if (id.includes('jspdf')) {
                            return 'jspdf';
                        }

                        if (id.includes('html2canvas')) {
                            return 'html2canvas';
                        }

                        if (id.includes('mammoth')) {
                            return 'document-parsers';
                        }

                        if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
                            return 'charts';
                        }

                        if (id.includes('react-select')) {
                            return 'select';
                        }

                        if (id.includes('@headlessui') || id.includes('lucide-react')) {
                            return 'ui';
                        }

                        return getPackageChunkName(id);
                    },
                },
            },
        },
        plugins: [
            laravel({
                input: paths,
                refresh: true,
            }),
            react(),
        ],
    };
});
