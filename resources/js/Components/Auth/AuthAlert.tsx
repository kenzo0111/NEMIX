import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { ReactNode } from 'react';

interface AuthAlertProps {
    variant?: 'success' | 'error' | 'info' | 'warning';
    children: ReactNode;
    className?: string;
}

export default function AuthAlert({
    variant = 'info',
    children,
    className = '',
}: AuthAlertProps) {
    if (!children) return null;

    const variantStyles = {
        success: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 text-emerald-900 dark:text-emerald-200',
        error: 'bg-red-50 dark:bg-red-950/40 border-red-700 dark:border-red-500 text-red-900 dark:text-red-200',
        warning: 'bg-amber-50 dark:bg-amber-950/40 border-amber-600 dark:border-amber-500 text-amber-900 dark:text-amber-200',
        info: 'bg-stone-50 dark:bg-slate-800/90 border-stone-500 dark:border-slate-600 text-stone-800 dark:text-slate-200',
    };

    const iconMap = {
        success: <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />,
        error: <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 shrink-0 mt-0.5" aria-hidden="true" />,
        warning: <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden="true" />,
        info: <Info className="w-4 h-4 text-stone-600 dark:text-slate-400 shrink-0 mt-0.5" aria-hidden="true" />,
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`border-l-4 p-3.5 rounded-r-lg text-xs leading-relaxed flex items-start gap-2.5 shadow-2xs ${variantStyles[variant]} ${className}`}
        >
            {iconMap[variant]}
            <div className="flex-1 font-medium">{children}</div>
        </div>
    );
}
