import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.tsx',
        './resources/js/Pages/Inventory/Coordinator/inventory.ts',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Figtree', ...defaultTheme.fontFamily.sans],
            },
            // Shared screen type scale: supporting text, body, sections, page titles.
            fontSize: {
                sm: ['0.875rem', { lineHeight: '1.5rem' }],
                base: ['1rem', { lineHeight: '1.625rem' }],
                lg: ['1.125rem', { lineHeight: '1.75rem' }],
                xl: ['1.25rem', { lineHeight: '1.875rem' }],
                '2xl': ['1.5rem', { lineHeight: '2rem' }],
                '3xl': ['1.875rem', { lineHeight: '2.375rem' }],
            },
            colors: {
                app: {
                    DEFAULT: 'var(--app-background)',
                    bg: 'var(--app-background)',
                },
                surface: {
                    DEFAULT: 'var(--surface)',
                    card: 'var(--surface-card)',
                    muted: 'var(--surface-muted)',
                },
                slate: {
                    700: 'rgb(var(--slate-700-rgb, 51 65 85) / <alpha-value>)',
                    800: 'rgb(var(--slate-800-rgb, 30 41 59) / <alpha-value>)',
                    850: 'rgb(var(--slate-850-rgb, 23 32 51) / <alpha-value>)',
                    900: 'rgb(var(--slate-900-rgb, 15 23 42) / <alpha-value>)',
                    950: 'rgb(var(--slate-950-rgb, 2 6 23) / <alpha-value>)',
                },
            },
        },
    },

    plugins: [forms],
};
