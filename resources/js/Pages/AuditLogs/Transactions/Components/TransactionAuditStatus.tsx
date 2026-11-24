import StatusBadge from '@/Components/ui/status-badge';
import React from 'react';
import { TransactionAuditStatus as StatusType, OperationResult, AuditResult } from '../types';

interface TransactionAuditStatusProps {
    status?: StatusType | string | null;
    result?: AuditResult | OperationResult;
}

export const TransactionAuditStatus = ({ status, result }: TransactionAuditStatusProps) => {
    const value = (result || (status === 'verified' ? 'success' : status === 'flagged' ? 'failed' : 'recorded')).toLowerCase();
    return <StatusBadge tone={value === 'success' ? 'success' : value === 'failed' ? 'danger' : value === 'warning' ? 'warning' : 'neutral'}>{value === 'success' ? 'Success' : value === 'failed' ? 'Failed' : value === 'warning' ? 'Warning' : 'Recorded'}</StatusBadge>;
};
