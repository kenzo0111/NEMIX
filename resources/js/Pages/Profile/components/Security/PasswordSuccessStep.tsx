import { Button } from '@/Components/ui/button';
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface Props {
    onDone: () => void;
}

export default function PasswordSuccessStep({ onDone }: Props) {
    return (
        <div className="max-w-md mx-auto text-center py-6 space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
                <h3 className="text-lg font-semibold font-sans text-slate-900 dark:text-slate-100">
                    Password Updated Successfully
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
                    Your institutional account credentials have been updated. A security confirmation notice has been transmitted to your registered email address.
                </p>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                Institutional audit event logged • Authenticated session active
            </div>

            <div className="pt-2">
                <Button variant="primary"
                    type="button"
                    onClick={onDone}
                    className="inline-flex items-center gap-2"
                >
                    <span>Return to Security Settings</span>
                </Button>
            </div>
        </div>
    );
}
