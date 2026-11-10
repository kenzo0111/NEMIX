import ApplicationLogo from '@/Components/ApplicationLogo';
import { PageProps } from '@/types';
import { usePage } from '@inertiajs/react';
import { AUTH_SYSTEM_DESCRIPTION, AUTH_SYSTEM_NAME } from './branding';

interface AuthBrandHeaderProps {
    headline?: string;
    subheadline?: string;
    className?: string;
}

export default function AuthBrandHeader({
    headline = AUTH_SYSTEM_NAME,
    subheadline = AUTH_SYSTEM_DESCRIPTION,
    className = '',
}: AuthBrandHeaderProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';

    return (
        <div className={`pb-6 mb-6 border-b border-stone-200 dark:border-slate-800 ${className}`}>
            <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-stone-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center">
                    <ApplicationLogo alt={`${institutionName} Seal`} className="h-10 w-10 object-contain" />
                </div>
                <div className="min-w-0 flex-1 text-left">
                    <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wide text-[#7B1113] dark:text-amber-300 mb-1">
                        REPUBLIC OF THE PHILIPPINES
                    </p>
                    <h1 className="text-base sm:text-lg font-sans font-bold uppercase text-stone-900 dark:text-slate-100 leading-snug break-words">
                        {institutionName}
                    </h1>
                    <p className="text-xs leading-snug text-stone-600 dark:text-slate-300 break-words">
                        {officeName}
                    </p>
                </div>
            </div>
            <h2 className="text-xl font-bold tracking-tight text-[#7B1113] dark:text-red-400 leading-snug mt-4">
                {headline}
            </h2>
            <p className="mt-2 text-sm font-medium text-stone-600 dark:text-slate-300 leading-relaxed">
                Consumable Supply Management
            </p>
            <p className="text-sm text-stone-600 dark:text-slate-300 leading-relaxed mt-1.5">
                {subheadline}
            </p>
        </div>
    );
}
