import React from 'react';
import { Info } from 'lucide-react';

interface Props {
    className?: string;
}

export default function PolicyNotice({ className = '' }: Props) {
    return (
        <div className={`p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs ${className}`}>
            <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                    <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                        Account Management Policy
                    </p>
                    <p className="text-slate-600 leading-relaxed">
                        Personnel accounts cannot be self-deleted or self-deactivated. In compliance with Commission on Audit (COA) guidelines and SPMO institutional accountability regulations, custodial account identities are permanently retained to preserve property transfer trails. Status adjustments or role revocations must be authorized by a designated System Administrator.
                    </p>
                </div>
            </div>
        </div>
    );
}
