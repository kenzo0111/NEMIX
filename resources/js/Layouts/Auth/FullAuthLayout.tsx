import AuthBrandPanel from '@/Components/Auth/AuthBrandPanel';
import AuthFooter from '@/Components/Auth/AuthFooter';
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
    return (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden login-bg">
            {/* Clean Single Maroon Overlay + Subtle Vignette */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-red-950/85 mix-blend-multiply" />
                <div className="absolute inset-0 bg-radial-[ellipse_at_center] from-transparent via-black/30 to-black/70" />
            </div>

            {/* Main Two-Column Institutional Card */}
            <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row border border-stone-200/80 my-4">
                {/* Left Brand Panel */}
                <AuthBrandPanel
                    badgeText={badgeText}
                    headline={headline}
                    subheadline={subheadline}
                />

                {/* Right Form Container */}
                <div className="lg:w-7/12 p-6 sm:p-10 lg:p-12 flex flex-col justify-center bg-white">
                    <div className="max-w-md mx-auto w-full">
                        {headerSlot}
                        {children}
                        <AuthFooter className="mt-8" />
                    </div>
                </div>
            </div>
        </div>
    );
}
