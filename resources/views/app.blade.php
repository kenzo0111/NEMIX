<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>
        <link rel="icon" type="image/png" href="{{ asset('images/cnscrefine.png') }}">
        <link rel="apple-touch-icon" href="{{ asset('images/cnscrefine.png') }}">

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Theme Initialization Script (Prevents Flash of Wrong Theme) -->
        <script>
            (function() {
                try {
                    var theme = localStorage.getItem('nemix_theme') || 'light';
                    var isDark = false;
                    if (theme === 'dark') {
                        isDark = true;
                    } else if (theme === 'system') {
                        isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    } else {
                        isDark = false;
                    }
                    if (isDark) {
                        document.documentElement.classList.add('dark');
                        document.documentElement.setAttribute('data-theme', 'dark');
                    } else {
                        document.documentElement.classList.remove('dark');
                        document.documentElement.setAttribute('data-theme', 'light');
                    }
                } catch (e) {}
            })();
        </script>

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/Pages/{$page['component']}.tsx"])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-[#F4F6F8] dark:bg-slate-950 text-slate-900 dark:text-slate-100 min-h-screen">
        @inertia
    </body>
</html>
