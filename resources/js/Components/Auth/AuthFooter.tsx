import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AuthFooterProps {
    className?: string;
}

export default function AuthFooter({ className = '' }: AuthFooterProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply & Property Management Office (SPMO)';
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`text-center space-y-1 select-text ${className}`}>
            <p className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 font-sans tracking-wider uppercase">
                {officeName}
            </p>
            <p className="text-[11px] text-stone-400 dark:text-slate-500 leading-tight">
                &copy; {currentYear} {institutionName.toUpperCase()}. All rights reserved.
            </p>
            <p className="text-[10px] text-stone-400/80 dark:text-slate-600">
                Authorized institutional use only.
            </p>
        </footer>
    );
}
