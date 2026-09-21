import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import TextInput from '@/Components/TextInput';
import { Eye, EyeOff, Lock } from 'lucide-react';
import { ChangeEvent, useState } from 'react';

interface PasswordFieldProps {
    id: string;
    name?: string;
    label: string;
    value: string;
    onChange: (e: ChangeEvent<HTMLInputElement>) => void;
    error?: string;
    autoComplete?: string;
    placeholder?: string;
    required?: boolean;
    autoFocus?: boolean;
    disabled?: boolean;
    className?: string;
}

export default function PasswordField({
    id,
    name,
    label,
    value,
    onChange,
    error,
    autoComplete = 'current-password',
    placeholder = '••••••••••••',
    required = false,
    autoFocus = false,
    disabled = false,
    className = '',
}: PasswordFieldProps) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={className}>
            <InputLabel htmlFor={id} value={label} className="text-stone-900 dark:text-slate-200 font-semibold text-sm mb-1.5 font-sans" />
            <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-500 dark:text-slate-400">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <TextInput
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    name={name || id}
                    value={value}
                    className="pl-10 pr-12 block w-full min-h-[44px] rounded-lg border-stone-300 dark:border-slate-700 shadow-2xs focus:border-[#7B1113] dark:focus:border-red-500 focus:ring-2 focus:ring-[#7B1113]/25 dark:focus:ring-red-500/30 transition-colors py-2.5 text-sm sm:text-base bg-stone-50/70 dark:bg-slate-850 focus:bg-white dark:focus:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 disabled:bg-stone-100 dark:disabled:bg-slate-800 disabled:text-stone-500 dark:disabled:text-slate-500 font-sans"
                    autoComplete={autoComplete}
                    isFocused={autoFocus}
                    onChange={onChange}
                    required={required}
                    disabled={disabled}
                    placeholder={placeholder}
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    aria-pressed={showPassword}
                    title={showPassword ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
                    className="absolute inset-y-0 right-0 w-11 flex items-center justify-center text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#7B1113] dark:focus-visible:ring-red-400 rounded-r-lg transition-colors cursor-pointer"
                >
                    {showPassword ? (
                        <EyeOff className="w-4 h-4 text-stone-700 dark:text-slate-300" aria-hidden="true" />
                    ) : (
                        <Eye className="w-4 h-4 text-stone-500 dark:text-slate-400" aria-hidden="true" />
                    )}
                </button>
            </div>
            <InputError message={error} className="mt-1.5 text-xs sm:text-sm font-medium text-red-700 dark:text-red-400 font-sans" />
        </div>
    );
}
