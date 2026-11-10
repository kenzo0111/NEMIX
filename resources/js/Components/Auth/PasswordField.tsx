import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import AuthTextInput from './AuthTextInput';
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
                    <Lock className="w-4 h-4 text-stone-500 dark:text-slate-400" strokeWidth={2} aria-hidden="true" />
                </div>
                <AuthTextInput
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    name={name || id}
                    value={value}
                    className="pl-10 pr-12"
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
                        <EyeOff className="w-4 h-4 text-stone-600 dark:text-slate-300" strokeWidth={2} aria-hidden="true" />
                    ) : (
                        <Eye className="w-4 h-4 text-stone-500 dark:text-slate-400" strokeWidth={2} aria-hidden="true" />
                    )}
                </button>
            </div>
            <InputError message={error} className="mt-1.5 text-sm font-medium text-red-700 dark:text-red-400 font-sans" />
        </div>
    );
}
