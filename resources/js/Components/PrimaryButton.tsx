import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    disabled,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={
                `inline-flex items-center rounded-md border border-transparent bg-gray-800 dark:bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-white dark:text-slate-900 transition duration-150 ease-in-out hover:bg-gray-700 dark:hover:bg-white focus:bg-gray-700 dark:focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 active:bg-gray-900 dark:active:bg-slate-200 ${
                    disabled && 'opacity-25'
                } ` + className
            }
            disabled={disabled}
        >
            {children}
        </button>
    );
}
