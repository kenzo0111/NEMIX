import React from 'react';
import { TransactionAuditStatus as StatusType, OperationResult } from '../types';

interface TransactionAuditStatusProps {
    status: StatusType;
    result?: OperationResult;
}

export const TransactionAuditStatus: React.FC<TransactionAuditStatusProps> = ({
    status,
    result,
}) => {
    switch (status) {
        case 'verified':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Verified
                </span>
            );

        case 'flagged':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200">
                    Flagged
                    {result === 'failed' && (
                        <span className="ml-1 text-[10px] text-red-700 font-bold">
                            (Failed)
                        </span>
                    )}
                </span>
            );

        case 'logged':
        default:
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Logged
                </span>
            );
    }
};
