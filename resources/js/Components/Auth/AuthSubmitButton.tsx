import { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface AuthSubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    processing?: boolean;
    loadingText?: string;
    children: ReactNode;
    className?: string;
}

export default function AuthSubmitButton({
    processing = false,
    loadingText = 'Processing...',
    children,
    className = '',
    disabled,
    type = 'submit',
    ...props
}: AuthSubmitButtonProps) {
    return (
        <button
            type={type}
            disabled={disabled || processing}
            aria-busy={processing}
            className={`w-full inline-flex items-center justify-center py-2.5 px-4 bg-red-900 hover:bg-red-950 focus:bg-red-950 active:bg-red-950 focus:outline-hidden focus:ring-2 focus:ring-red-900/30 focus:ring-offset-1 text-white text-sm font-semibold rounded-lg shadow-xs transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            {...props}
        >
            {processing ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin shrink-0" aria-hidden="true" />
                    <span>{loadingText}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
