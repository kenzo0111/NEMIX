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
        success: 'bg-emerald-50 border-emerald-600 text-emerald-900',
        error: 'bg-red-50 border-red-700 text-red-900',
        warning: 'bg-amber-50 border-amber-600 text-amber-900',
        info: 'bg-stone-50 border-stone-600 text-stone-800',
    };

    const iconMap = {
        success: <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />,
        error: <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />,
        warning: <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />,
        info: <Info className="w-5 h-5 text-stone-600 shrink-0 mt-0.5" aria-hidden="true" />,
    };

    return (
        <div
            role="alert"
            aria-live="polite"
            className={`border-l-4 p-4 rounded-r-lg text-xs leading-relaxed flex items-start gap-3 shadow-xs ${variantStyles[variant]} ${className}`}
        >
            {iconMap[variant]}
            <div className="flex-1 font-medium">{children}</div>
        </div>
    );
}
