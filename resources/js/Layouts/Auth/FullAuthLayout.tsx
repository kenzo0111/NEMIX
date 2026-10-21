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
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    return (
        <div className="min-h-screen flex flex-col items-center justify-center pt-20 pb-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative login-bg">
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
            <main className="relative z-10 w-full max-w-xl lg:max-w-[1200px] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row border border-stone-200/40 dark:border-slate-800">
                {/* Desktop/Tablet Left Brand Panel */}
                <AuthBrandPanel
                    badgeText={badgeText}
                    headline={headline}
                    subheadline={subheadline}
                />

                {/* Right Form Panel: Primary visual focus */}
                <div className="relative w-full lg:w-[49%] p-6 sm:p-10 lg:p-10 xl:p-12 flex flex-col bg-white dark:bg-slate-900">

                    <div className="relative z-10 w-full max-w-[470px] mx-auto flex-1 flex flex-col justify-between">
                        {/* Mobile Condensed Brand Header */}
                        <div className="lg:hidden pb-6 mb-6 border-b border-stone-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-stone-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center">
                                    <ApplicationLogo alt={`${institutionName} Seal`} className="h-10 w-10 object-contain" />
                                </div>
                                <div className="min-w-0 text-center">
                                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[#7B1113] dark:text-amber-300 mb-1">
                                        REPUBLIC OF THE PHILIPPINES
                                    </p>
                                    <h1 className="text-base sm:text-lg font-sans font-bold uppercase text-stone-900 dark:text-slate-100 leading-snug break-words">
                                        {institutionName}
                                    </h1>
                                    <p className="text-xs leading-snug text-stone-600 dark:text-slate-300">{officeName}</p>
                                </div>
                            </div>
                            <h2 className="text-xl font-bold tracking-tight text-[#7B1113] dark:text-red-400 leading-snug mt-4">
                                {headline || 'SupplySync'}
                            </h2>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.15em] text-stone-600 dark:text-slate-300 leading-relaxed">
                                Consumables Supply Management System
                            </p>
                            <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed mt-1.5">
                                {subheadline || 'Consumable Supplies and Requisition Management System'}
                            </p>
                        </div>

                        {/* Vertically centered form group: Heading + Form + Actions */}
                        <div className="my-auto w-full">
                            {headerSlot}
                            {children}
                        </div>

                        {/* Secondary institutional footer anchored at the bottom */}
                        <AuthFooter compact className="pt-5 mt-6" />
                    </div>
                </div>
            </main>
        </div>
    );
}
