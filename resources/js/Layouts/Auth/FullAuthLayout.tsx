import ApplicationLogo from '@/Components/ApplicationLogo';
import AuthBrandPanel from '@/Components/Auth/AuthBrandPanel';
import AuthFooter from '@/Components/Auth/AuthFooter';
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
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden login-bg">
            {/* Single Maroon Overlay + Subtle Vignette */}
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-red-950/85 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Main Institutional Container */}
            <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-stone-200/80 my-2 sm:my-4">
                {/* Desktop Left Brand Panel */}
                <AuthBrandPanel
                    badgeText={badgeText}
                    headline={headline}
                    subheadline={subheadline}
                />

                {/* Right Form Container / Mobile Form First */}
                <div className="w-full lg:w-7/12 p-5 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        {/* Mobile Condensed Brand Header */}
                        <div className="lg:hidden flex items-center gap-3 pb-3.5 mb-5 border-b border-stone-200/80">
                            <div className="bg-white p-1.5 rounded-lg border border-stone-200/80 shadow-2xs shrink-0 flex items-center justify-center">
                                <ApplicationLogo alt={`${institutionName} Seal`} className="h-9 w-9 object-contain" />
                            </div>
                            <div className="min-w-0">
                                <h1 className="font-serif text-sm font-bold text-stone-900 leading-tight truncate">
                                    {institutionName}
                                </h1>
                                <p className="text-[11px] text-red-900 font-medium truncate">
                                    Smart Supply &amp; Inventory Management System
                                </p>
                            </div>
                        </div>

                        {headerSlot}
                        {children}
                        <AuthFooter className="mt-8" />
                    </div>
                </div>
            </div>
        </div>
    );
}
