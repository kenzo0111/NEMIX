import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={"rounded border-slate-300 dark:border-slate-700 dark:bg-slate-900 text-red-900 dark:text-red-500 shadow-sm focus:ring-red-900 dark:focus:ring-red-400 dark:focus:ring-offset-slate-900 " +
    className}
        />
    );
}
