import TextInput from '@/Components/TextInput';
import { InputHTMLAttributes } from 'react';

type AuthTextInputProps = InputHTMLAttributes<HTMLInputElement> & {
    isFocused?: boolean;
};

export default function AuthTextInput({ className = '', ...props }: AuthTextInputProps) {
    return (
        <TextInput
            {...props}
            className={`block w-full min-h-[52px] rounded-lg border-slate-300 dark:border-slate-700 shadow-sm focus:border-red-900 dark:focus:border-red-300 focus:ring-2 focus:ring-red-900/25 dark:focus:ring-red-300/30 transition-colors py-3 text-sm sm:text-base bg-slate-50/70 dark:bg-slate-850 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 read-only:bg-slate-100 dark:read-only:bg-slate-800 read-only:text-slate-600 dark:read-only:text-slate-400 read-only:cursor-not-allowed read-only:focus:bg-slate-100 dark:read-only:focus:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:text-slate-500 dark:disabled:text-slate-500 disabled:cursor-not-allowed font-sans ${className}`}
        />
    );
}
