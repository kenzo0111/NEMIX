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
            {/* Institutional Maroon Overlay + Vignette on Campus Background */}
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-red-950/85 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Theme selection in the top right corner of the screen */}
            <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
                <ThemeToggle variant="compact" />
            </div>

            {/* Main Centered Institutional Card */}
            <main className="relative z-10 w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row border border-stone-200 dark:border-slate-800">
                {/* Desktop/Tablet Left Brand Panel */}
                <AuthBrandPanel
                    badgeText={badgeText}
                    headline={headline}
                    subheadline={subheadline}
                />

                {/* Right Form Panel: Primary visual focus */}
                <div className="relative w-full md:w-7/12 lg:w-[56%] p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-gradient-to-b from-stone-50/30 via-white to-stone-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 overflow-hidden">
                    {/* Subtle university watermark accent */}
                    <div
                        className="absolute -bottom-14 -right-14 w-60 h-60 pointer-events-none opacity-[0.035] dark:opacity-[0.025] select-none"
                        aria-hidden="true"
                    >
                        <img
                            src="/images/ucnlogo.png"
                            alt=""
                            className="w-full h-full object-contain grayscale"
                        />
                    </div>

                    <div className="relative z-10 w-full max-w-[470px] mx-auto flex-1 flex flex-col justify-between">
                        {/* Mobile Condensed Brand Header */}
                        <div className="md:hidden flex items-center gap-3 pb-4 mb-4 border-b border-stone-200 dark:border-slate-800">
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

                        {/* Vertically centered form group: Heading + Form + Actions */}
                        <div className="my-auto w-full py-2 sm:py-3">
                            {headerSlot}
                            {children}
                        </div>

                        {/* Secondary institutional footer anchored at the bottom */}
                        <AuthFooter className="pt-4 mt-6 border-t border-stone-200/70 dark:border-slate-800/80" />
                    </div>
                </div>
            </main>
        </div>
    );
}
