import AuthFooter from '@/Components/Auth/AuthFooter';
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
        <div className="min-h-screen flex items-center justify-center p-3 sm:p-6 lg:p-8 relative overflow-hidden login-bg">
            {/* Single Maroon Overlay + Subtle Vignette */}
            <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
                <div className="absolute inset-0 bg-red-950/85 mix-blend-multiply" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />
            </div>

            {/* Centered Institutional Card */}
            <div className={`relative z-10 w-full ${maxWidthMap[maxWidth]} bg-white rounded-2xl shadow-xl border border-stone-200/80 p-5 sm:p-8 my-2 sm:my-4`}>
                {headerSlot}
                <div className="mt-4">
                    {children}
                </div>
                <AuthFooter className="mt-8" />
            </div>
        </div>
    );
}
