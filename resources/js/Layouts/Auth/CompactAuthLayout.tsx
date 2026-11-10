import AuthFooter from '@/Components/Auth/AuthFooter';
import ThemeToggle from '@/Components/ThemeToggle';
import { PropsWithChildren, ReactNode } from 'react';

interface CompactAuthLayoutProps extends PropsWithChildren {
    headerSlot?: ReactNode;
    maxWidth?: 'sm' | 'md' | 'lg';
}

export default function CompactAuthLayout({
    children,
    headerSlot,
    maxWidth = 'lg',
}: CompactAuthLayoutProps) {
    const maxWidthMap = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
    };

    return (
        <div className="min-h-screen flex items-center justify-center pt-20 pb-8 sm:py-12 px-4 sm:px-6 lg:px-8 relative login-bg">
            {/* Theme Toggle Button in top right */}
            <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
                <ThemeToggle variant="compact" />
            </div>

            {/* Single Maroon Overlay + Subtle Vignette */}
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-red-950/85 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Centered Institutional Card */}
            <main className={`relative z-10 w-full ${maxWidthMap[maxWidth]} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-stone-200/40 dark:border-slate-800 p-6 sm:p-10`}>
                {headerSlot}
                {children}
                <AuthFooter compact className="pt-5 mt-6" />
            </main>
        </div>
    );
}
