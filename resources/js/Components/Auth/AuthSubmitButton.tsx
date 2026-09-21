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
            className={`w-full min-h-[44px] inline-flex items-center justify-center py-2.5 px-6 bg-[#7B1113] hover:bg-[#600e0f] active:bg-[#4d0b0c] dark:bg-red-800 dark:hover:bg-red-700 dark:active:bg-red-900 active:scale-[0.99] text-white text-sm sm:text-base font-semibold rounded-lg shadow-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#7B1113] dark:focus-visible:ring-red-400 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900 disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer ${className}`}
            {...props}
        >
            {processing ? (
                <>
                    <Loader2 className="w-4 h-4 mr-2.5 animate-spin shrink-0" aria-hidden="true" />
                    <span>{loadingText}</span>
                </>
            ) : (
                children
            )}
        </button>
    );
}
