import { Head, Link } from '@inertiajs/react';

export default function Welcome({ canLogin, canRegister, laravelVersion, phpVersion }: { canLogin: boolean, canRegister: boolean, laravelVersion: string, phpVersion: string }) {
    return (
        <>
            <Head title="Welcome" />
            <div className="bg-gray-50 text-black/50 dark:bg-black dark:text-white/50">
                <div className="relative flex min-h-screen flex-col items-center justify-center selection:bg-[#FF2D20] selection:text-white">
                    <div className="relative w-full max-w-2xl px-6 lg:max-w-7xl">
                        <header className="grid grid-cols-2 items-center gap-2 py-10 lg:grid-cols-3">
                            <div className="flex lg:justify-center lg:col-start-2">
                                <svg className="h-12 w-auto text-white lg:text-black lg:h-16 lg:w-auto" viewBox="0 0 62 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="m61.854 14.625c0 .248-.124.473-.326.604l-11.054 6.386L49.147.285c-.093-.248-.217-.364-.341-.364-.124 0-.248.116-.341.364L32.618 21.615 21.564 15.23c-.202-.131-.326-.356-.326-.604 0-.248.124-.473.326-.604L32.382.646c.093-.131.217-.22.341-.22.124 0 .248.089.341.22l11.054 13.375c.202.131.326.356.326.604ZM32.382 64.67c-.124 0-.248-.089-.341-.22L21.327 51.075c-.202-.131-.326-.356-.326-.604 0-.248.124-.473.326-.604l11.054-6.386L49.147 49.867c.093.248.217.364.341.364.124 0 .248-.116.341-.364L61.854 43.081c.202-.131.326-.356.326-.604 0-.248-.124-.473-.326-.604L50.829 35.488 39.775 42.873c-.093.131-.217.22-.341.22-.124 0-.248-.089-.341-.22L28.099 35.488.341 51.451C.139 51.582.015 51.807.015 52.055c0 .248.124.473.326.604l27.442 15.84c.093.131.217.22.341.22.124 0 .248-.089.341-.22l27.442-15.84c.202-.131.326-.356.326-.604 0-.248-.124-.473-.326-.604L32.618 49.867.341 31.027C.139 30.896.015 30.671.015 30.423c0-.248.124-.473.326-.604L32.382 13.375c.093-.131.217-.22.341-.22.124 0 .248.089.341.22L61.854 29.819c.202.131.326.356.326.604 0 .248-.124.473-.326.604L32.618 46.663.341 30.423Z" fill="#FF2D20"/>
                                </svg>
                            </div>
                            <nav className="-mx-3 flex flex-1 justify-end">
                                {canLogin ? (
                                    <Link
                                        href={route('login')}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                    >
                                        Log in
                                    </Link>
                                ) : null}
                                {canRegister ? (
                                    <Link
                                        href={route('register')}
                                        className="rounded-md px-3 py-2 text-black ring-1 ring-transparent transition hover:text-black/70 focus:outline-none focus-visible:ring-[#FF2D20] dark:text-white dark:hover:text-white/80 dark:focus-visible:ring-white"
                                    >
                                        Register
                                    </Link>
                                ) : null}
                            </nav>
                        </header>
                        <main className="mt-6">
                            <div className="grid gap-6 lg:gap-8">
                                <div>
                                    <h1 className="text-4xl font-medium text-black dark:text-white">
                                        Welcome to your Jetstream application!
                                    </h1>
                                    <p className="mt-6 text-lg text-black/70 dark:text-white/70">
                                        Laravel Jetstream provides a beautiful, robust starting point for your next Laravel application. Laravel is designed
                                        to help you build modern, full-stack web applications.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <a
                                        href="https://laravel.com/docs"
                                        className="inline-flex items-center px-4 py-2 bg-gray-800 dark:bg-gray-200 border border-transparent rounded-md font-semibold text-xs text-white dark:text-gray-800 uppercase tracking-widest hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white active:bg-gray-900 dark:active:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                    >
                                        Documentation
                                    </a>
                                    <a
                                        href="https://laracasts.com"
                                        className="inline-flex items-center px-4 py-2 bg-gray-300 dark:bg-gray-700 border border-transparent rounded-md font-semibold text-xs text-gray-700 dark:text-gray-300 uppercase tracking-widest hover:bg-gray-400 dark:hover:bg-gray-600 focus:bg-gray-400 dark:focus:bg-gray-600 active:bg-gray-500 dark:active:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                                    >
                                        Laracasts
                                    </a>
                                </div>
                            </div>
                        </main>
                        <footer className="py-16 text-center text-sm text-black dark:text-white/70">
                            Laravel v{laravelVersion} (PHP v{phpVersion})
                        </footer>
                    </div>
                </div>
            </div>
        </>
    );
}