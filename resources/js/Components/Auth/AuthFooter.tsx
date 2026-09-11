import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AuthFooterProps {
    className?: string;
}

export default function AuthFooter({ className = '' }: AuthFooterProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const officeName = branding?.officeName || 'Supply and Property Management Office';
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`pt-5 border-t border-stone-200/80 text-center space-y-1 select-text ${className}`}>
            <p className="text-[11px] font-semibold text-stone-600 font-serif tracking-wider uppercase">
                {officeName}
            </p>
            <p className="text-[11px] text-stone-500 leading-tight">
                &copy; {currentYear} {institutionName}. All rights reserved.
            </p>
            <p className="text-[10px] text-stone-400">
                Authorized institutional use only.
            </p>
        </footer>
    );
}
