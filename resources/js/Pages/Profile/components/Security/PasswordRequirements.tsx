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
        <div className={`p-3.5 rounded-lg bg-slate-50/90 border border-slate-200 text-xs ${className}`}>
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Password Requirements
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-2">
                    <span
                        className={`w-4 h-4 rounded flex items-center justify-center text-[10px] font-bold transition-colors ${
                            hasMinLength
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                        <Check className="w-3 h-3" />
                    </span>
                    <span
                        className={
                            hasMinLength
                                ? 'text-slate-900 font-semibold'
                                : 'text-slate-500'
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
                                : 'bg-slate-200 text-slate-500'
                        }`}
                    >
                        <Check className="w-3 h-3" />
                    </span>
                    <span
                        className={
                            passwordsMatch
                                ? 'text-slate-900 font-semibold'
                                : 'text-slate-500'
                        }
                    >
                        Passwords match exactly
                    </span>
                </div>
            </div>
        </div>
    );
}
