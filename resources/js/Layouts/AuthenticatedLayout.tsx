import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import Modal from '@/Components/Modal';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import SystemModeBadge from '@/Components/SystemModeBadge';
import { Link, router, usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode, useState } from 'react';

export default function Authenticated({
    header,
    children,
}: PropsWithChildren<{ header?: ReactNode }>) {
    const pageProps = usePage().props as any;
    const user = pageProps.auth.user;
    const systemMode = pageProps.system?.mode || 'LIVE PRODUCTION';

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    const handleConfirmLogout = () => {
        setIsLoggingOut(true);
        router.post(route('logout'), {}, {
            onFinish: () => {
                setIsLoggingOut(false);
                setShowLogoutModal(false);
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-100">
            {/* System Operating Mode Global Warning Banner */}
            {systemMode !== 'LIVE PRODUCTION' && (
                <div className={`px-4 py-2 text-xs font-mono font-bold text-center flex items-center justify-center gap-2 shadow-xs border-b ${
                    systemMode === 'MAINTENANCE MODE'
                        ? 'bg-amber-900 text-amber-200 border-amber-800'
                        : systemMode === 'STAGING SANDBOX'
                        ? 'bg-sky-900 text-sky-200 border-sky-800'
                        : 'bg-purple-900 text-purple-200 border-purple-800'
                }`}>
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
                    </span>
                    <span>
                        {systemMode === 'MAINTENANCE MODE' && 'SYSTEM MAINTENANCE MODE ACTIVE — Write transactions are restricted to authorized administrators.'}
                        {systemMode === 'STAGING SANDBOX' && 'STAGING SANDBOX ENVIRONMENT — Operating with isolated test database records.'}
                        {systemMode === 'TRAINING SIMULATION' && 'TRAINING SIMULATION MODE — Operating with synthetic demo data.'}
                    </span>
                </div>
            )}

            <nav className="border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex">
                                <NavLink
                                    href={route('dashboard')}
                                    active={route().current('dashboard')}
                                >
                                    Dashboard
                                </NavLink>
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center sm:gap-4">
                            <SystemModeBadge />
                            <div className="relative ms-1">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <button
                                            type="button"
                                            onClick={() => setShowLogoutModal(true)}
                                            className="block w-full px-4 py-2 text-start text-sm leading-5 text-gray-700 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 transition duration-150 ease-in-out cursor-pointer"
                                        >
                                            Log Out
                                        </button>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                                aria-label="Toggle navigation menu"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink
                            href={route('dashboard')}
                            active={route().current('dashboard')}
                        >
                            Dashboard
                        </ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(true)}
                                className="flex w-full items-start ps-3 pe-4 py-2 border-l-4 border-transparent text-start text-base font-medium text-gray-600 hover:text-gray-800 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:text-gray-800 focus:bg-gray-50 focus:border-gray-300 transition duration-150 ease-in-out cursor-pointer"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>

            {/* CONFIRM LOGOUT MODAL */}
            <Modal
                show={showLogoutModal}
                onClose={() => !isLoggingOut && setShowLogoutModal(false)}
                maxWidth="sm"
                closeable={!isLoggingOut}
            >
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-red-100 text-left">
                    <div className="h-2 w-full bg-gradient-to-r from-red-800 via-red-900 to-amber-600"></div>
                    <div className="p-6">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-red-100/80 border border-red-200 flex items-center justify-center text-red-800 shrink-0 shadow-inner">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 font-serif tracking-tight">
                                    Confirm Logout Session
                                </h3>
                                <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                    Are you sure you want to end your current authenticated session in SPMO SIMS?
                                </p>
                            </div>
                        </div>

                        {user && (
                            <div className="my-4 p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600 border border-yellow-300/60 flex items-center justify-center text-red-950 font-extrabold text-sm shrink-0 shadow-sm">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-xs font-bold text-gray-900 truncate">{user?.name}</p>
                                    <p className="text-[11px] text-gray-500 font-mono truncate">{user?.email}</p>
                                </div>
                            </div>
                        )}

                        <p className="text-[11px] text-gray-500 mb-6 flex items-center gap-1.5 bg-amber-50/70 border border-amber-200/60 rounded-lg p-2.5">
                            <svg className="w-4 h-4 text-amber-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            <span>Your session activity and logout timestamp will be safely recorded in the Audit Ledger.</span>
                        </p>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                            <button
                                type="button"
                                onClick={() => setShowLogoutModal(false)}
                                disabled={isLoggingOut}
                                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 active:bg-gray-100 focus:outline-none transition-all disabled:opacity-50 cursor-pointer"
                            >
                                Stay Signed In
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmLogout}
                                disabled={isLoggingOut}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-700 hover:bg-red-800 active:bg-red-900 shadow-md shadow-red-900/20 focus:outline-none transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                            >
                                {isLoggingOut ? (
                                    <>
                                        <svg className="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                        </svg>
                                        <span>Logging Out...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                        </svg>
                                        <span>Yes, Log Out</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
