import React from 'react';
import { Check } from 'lucide-react';

interface Props {
    hasMinLength: boolean;
    passwordsMatch: boolean;
    className?: string;
}

export default function PasswordRequirements({
    hasMinLength,
    passwordsMatch,
    className = '',
}: Props) {
    return (
        <div className={`p-3.5 rounded-lg bg-slate-50/90 dark:bg-slate-850/80 border border-slate-200 dark:border-slate-800 text-xs ${className}`}>
            <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Password Requirements
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                            hasMinLength
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Check className="w-3 h-3" />
                    </span>
                    <span
                        className={
                            hasMinLength
                                ? 'text-slate-900 dark:text-slate-100 font-semibold'
                                : 'text-slate-500 dark:text-slate-400'
                        }
                    >
                        At least 8 characters minimum
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                            passwordsMatch
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                        }`}
                    >
                        <Check className="w-3 h-3" />
                    </span>
                    <span
                        className={
                            passwordsMatch
                                ? 'text-slate-900 dark:text-slate-100 font-semibold'
                                : 'text-slate-500 dark:text-slate-400'
                        }
                    >
                        Passwords match exactly
                    </span>
                </div>
            </div>
        </div>
    );
}
