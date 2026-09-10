import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
    onDone: () => void;
}

export default function PasswordSuccessStep({ onDone }: Props) {
    return (
        <div className="max-w-md mx-auto text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
                <h3 className="text-base font-bold font-serif text-slate-900">
                    Password Updated Successfully
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
                    Your institutional account credentials have been updated. A security confirmation notice has been transmitted to your registered email address.
                </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono">
                Institutional audit event logged • Authenticated session active
            </div>

            <div className="pt-2">
                <button
                    type="button"
                    onClick={onDone}
                    className="px-5 py-2 bg-red-900 hover:bg-red-950 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors border border-red-900 cursor-pointer inline-flex items-center gap-1.5"
                >
                    <span>Return to Security Settings</span>
                </button>
            </div>
        </div>
    );
}
