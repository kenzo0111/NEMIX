import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { AUTH_SYSTEM_DESCRIPTION, AUTH_SYSTEM_NAME } from './branding';

interface AuthBrandHeaderProps {
    headline?: string;
    subheadline?: string;
    className?: string;
    alignment?: 'left' | 'center';
    showSystemBranding?: boolean;
}

export default function AuthBrandHeader({
    headline = AUTH_SYSTEM_NAME,
    subheadline = AUTH_SYSTEM_DESCRIPTION,
    className = '',
    alignment = 'left',
    showSystemBranding = true,
}: AuthBrandHeaderProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    return (
        <div className={`pb-6 mb-6 border-b border-slate-200 dark:border-slate-800 ${alignment === 'center' ? "text-center" : ""} ${className}`}>
            <div className={`flex items-center gap-3 ${alignment === 'center' ? "flex-col" : ""}`}>
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm shrink-0 flex items-center justify-center">
                    <ApplicationLogo alt={`${institutionName} Seal`} className="h-10 w-10 object-contain" />
                </div>
                <div className={`min-w-0 ${alignment === 'center' ? "w-full text-center" : "flex-1 text-left"}`}>
                    <p className="text-sm sm:text-sm font-medium normal-case tracking-normal text-red-900 dark:text-amber-300 mb-1">
                        REPUBLIC OF THE PHILIPPINES
                    </p>
                    <p className="text-base sm:text-lg font-sans font-semibold normal-case text-slate-900 dark:text-slate-100 leading-snug break-words">
                        {institutionName}
                    </p>
                    <p className="text-sm leading-snug text-slate-600 dark:text-slate-300 break-words">
                        {officeName}
                    </p>
                </div>
            </div>
            {showSystemBranding && (
                <>
                    <p className="text-xl font-semibold tracking-tight text-red-900 dark:text-red-400 leading-snug mt-4">
                        {headline}
                    </p>
                    <p className="mt-2 text-sm font-medium text-slate-600 dark:text-slate-300 leading-relaxed">
                        Consumable Supply Management
                    </p>
                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1.5">
                        {subheadline}
                    </p>
                </>
            )}
        </div>
    );
}
