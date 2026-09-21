import ApplicationLogo from '@/Components/ApplicationLogo';
import AuthBrandPanel from '@/Components/Auth/AuthBrandPanel';
import AuthFooter from '@/Components/Auth/AuthFooter';
import ThemeToggle from '@/Components/ThemeToggle';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { PropsWithChildren, ReactNode } from 'react';

interface FullAuthLayoutProps extends PropsWithChildren {
    badgeText?: string;
    headline?: string;
    subheadline?: string;
    headerSlot?: ReactNode;
}

export default function FullAuthLayout({
    children,
    badgeText,
    headline,
    subheadline,
    headerSlot,
}: FullAuthLayoutProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center py-6 sm:py-10 px-4 sm:px-6 lg:px-8 relative login-bg">
            {/* Subtle dark backdrop overlay */}
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-stone-950/75 dark:bg-black/80 backdrop-blur-[1.5px]" />
            </div>

            {/* Utility Bar: Theme Toggle positioned above the upper-right area of the card */}
            <header className="relative z-10 w-full max-w-5xl flex items-center justify-end mb-2.5 px-1">
                <div className="flex items-center gap-2 bg-stone-900/40 dark:bg-slate-900/60 backdrop-blur-xs py-1 px-2.5 rounded-lg border border-white/10">
                    <span className="text-xs font-medium text-stone-200 hidden sm:inline select-none">Theme</span>
                    <ThemeToggle variant="compact" />
                </div>
            </header>

            {/* Main Centered Institutional Card */}
            <main className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200 dark:border-slate-800">
                {/* Desktop/Tablet Left Brand Panel */}
                <AuthBrandPanel
                    badgeText={badgeText}
                    headline={headline}
                    subheadline={subheadline}
                />

                {/* Right Form Panel: Primary visual focus */}
                <div className="w-full md:w-7/12 lg:w-[60%] p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile Condensed Brand Header */}
                        <div className="md:hidden flex items-center gap-3 pb-4 mb-5 border-b border-stone-200 dark:border-slate-800">
                            <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-stone-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center">
                                <ApplicationLogo alt={`${institutionName} Seal`} className="h-10 w-10 object-contain" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-serif text-base font-bold text-stone-900 dark:text-slate-100 leading-tight truncate">
                                    {institutionName}
                                </h1>
                                <p className="text-xs text-[#7B1113] dark:text-red-400 font-semibold truncate mt-0.5">
                                    Smart Supply &amp; Inventory Management System
                                </p>
                            </div>
                        </div>

                        {headerSlot}
                        {children}
                        <AuthFooter className="mt-8" />
                    </div>
                </div>
            </main>
        </div>
    );
}
