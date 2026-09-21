import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';

interface AuthFooterProps {
    className?: string;
}

export default function AuthFooter({ className = '' }: AuthFooterProps) {
    const { branding } = usePage<PageProps>().props;
    const institutionName = branding?.institutionName || 'University of Camarines Norte';
    const currentYear = new Date().getFullYear();

    return (
        <footer className={`pt-6 border-t border-stone-200 dark:border-slate-800 text-center select-text ${className}`}>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-400 leading-relaxed font-sans">
                &copy; {currentYear} {institutionName} &bull; Supply and Property Management Office. Authorized access only.
            </p>
        </footer>
    );
}
