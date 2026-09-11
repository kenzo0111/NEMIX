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
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden login-bg">
            {/* Clean Single Maroon Overlay + Subtle Vignette */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-red-950/85 mix-blend-multiply" />
                <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-black/30 to-black/70" />
            </div>

            {/* Centered Institutional Card */}
            <div className={`relative z-10 w-full ${maxWidthMap[maxWidth]} bg-white rounded-2xl shadow-xl border border-stone-200/80 p-6 sm:p-10 my-4`}>
                {headerSlot}
                <div className="mt-4">
                    {children}
                </div>
                <AuthFooter className="mt-8" />
            </div>
        </div>
    );
}
