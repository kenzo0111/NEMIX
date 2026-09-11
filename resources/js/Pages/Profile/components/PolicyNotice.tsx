import React from 'react';
import { ShieldAlert, FileCheck } from 'lucide-react';

interface Props {
    className?: string;
}

export default function PolicyNotice({ className = '' }: Props) {
    return (
        <div className={`bg-white rounded-xl border border-slate-200/90 border-l-4 border-l-red-900 shadow-2xs p-5 ${className}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3.5">
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-900 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-xs font-bold font-serif text-slate-900 uppercase tracking-wider">
                                Institutional Account Accountability Policy
                            </h3>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold border border-slate-200">
                                COA Circular 2020-006
                            </span>
                        </div>
                        <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                            Personnel custodial profiles cannot be self-deleted or deactivated. Under national accounting guidelines and SPMO regulations, custodial account identities are permanently preserved in the institutional ledger to ensure untampered property assignment trails. Role changes or status revisions require System Administrator clearance.
                        </p>
                    </div>
                </div>

                <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-600 shrink-0 self-start">
                    <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="font-semibold text-slate-800">Ledger Immutability Enforced</span>
                </div>
            </div>
        </div>
    );
}
