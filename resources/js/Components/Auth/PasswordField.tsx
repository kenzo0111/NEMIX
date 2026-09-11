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
            <InputLabel htmlFor={id} value={label} className="text-stone-800 font-semibold text-sm mb-1.5" />
            <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4" aria-hidden="true" />
                </div>
                <TextInput
                    id={id}
                    type={showPassword ? 'text' : 'password'}
                    name={name || id}
                    value={value}
                    className="pl-10 pr-11 block w-full rounded-lg border-stone-300 shadow-2xs focus:border-red-900 focus:ring-2 focus:ring-red-900/20 transition-colors py-2.5 text-sm bg-stone-50/60 focus:bg-white disabled:bg-stone-100 disabled:text-stone-500"
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
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-red-900/30 rounded-r-lg transition-colors"
                >
                    {showPassword ? (
                        <EyeOff className="w-4 h-4 text-stone-600" aria-hidden="true" />
                    ) : (
                        <Eye className="w-4 h-4 text-stone-400" aria-hidden="true" />
                    )}
                </button>
            </div>
            <InputError message={error} className="mt-1.5 text-xs" />
        </div>
    );
}
