import { InputHTMLAttributes } from 'react';

export default function Checkbox({
    className = '',
    ...props
}: InputHTMLAttributes<HTMLInputElement>) {
    return (
        <input
            {...props}
            type="checkbox"
            className={
                'rounded border-gray-300 dark:border-slate-700 dark:bg-slate-900 text-indigo-600 shadow-sm focus:ring-indigo-500 dark:focus:ring-offset-slate-900 ' +
                className
            }
        />
    );
}
