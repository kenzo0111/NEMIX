import AuthBrandHeader from '@/Components/Auth/AuthBrandHeader';
import AuthBrandPanel from '@/Components/Auth/AuthBrandPanel';
import AuthFooter from '@/Components/Auth/AuthFooter';
import { AUTH_SYSTEM_DESCRIPTION, AUTH_SYSTEM_NAME } from '@/Components/Auth/branding';
import ThemeToggle from '@/Components/ThemeToggle';
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
    headline = AUTH_SYSTEM_NAME,
    subheadline = AUTH_SYSTEM_DESCRIPTION,
    headerSlot,
}: FullAuthLayoutProps) {
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
                        <AuthBrandHeader
                            headline={headline}
                            subheadline={subheadline}
                            className="lg:hidden"
                        />

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
