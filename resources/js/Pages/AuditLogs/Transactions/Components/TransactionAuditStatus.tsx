import React from 'react';
import { TransactionAuditStatus as StatusType, OperationResult, AuditResult } from '../types';

interface TransactionAuditStatusProps {
    status?: StatusType | string | null;
    result?: AuditResult | OperationResult;
}

export const TransactionAuditStatus: React.FC<TransactionAuditStatusProps> = ({
    status,
    result,
}) => {
    // Resolve semantic result representation
    const semanticResult = (result || (status === 'verified' ? 'success' : (status === 'flagged' ? 'failed' : 'recorded'))).toLowerCase();

    switch (semanticResult) {
        case 'success':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Success
                </span>
            );

        case 'failed':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                    Failed
                </span>
            );

        case 'warning':
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    Warning
                </span>
            );

        case 'recorded':
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Recorded
                </span>
            );
    }
};
