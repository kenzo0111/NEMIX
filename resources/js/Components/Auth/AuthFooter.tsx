import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AuthFooterProps {
    className?: string;
    compact?: boolean;
}

export default function AuthFooter({ className = '', compact = false }: AuthFooterProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';
    const currentYear = new Date().getFullYear();

    if (compact) {
        return (
            <footer className={`text-center text-sm leading-relaxed text-slate-500 dark:text-slate-400 ${className}`}>
                &copy; {currentYear} {institutionName}. All rights reserved.
            </footer>
        );
    }

    return (
        <footer className={`text-center space-y-1 select-text ${className}`}>
            <p className="leading-relaxed text-sm font-semibold text-slate-500 dark:text-slate-400 font-sans tracking-normal normal-case">
                {officeName}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-400 leading-tight">
                &copy; {currentYear} {institutionName.toUpperCase()}. All rights reserved.
            </p>
            <p className="leading-relaxed text-sm text-slate-400/80 dark:text-slate-400">
                Authorized institutional use only.
            </p>
        </footer>
    );
}
