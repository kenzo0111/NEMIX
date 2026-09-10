import React from 'react';
import TransactionAuditIndex from './Transactions/Index';
import { TransactionAuditPageProps } from './Transactions/types';

export default function ManageTransaction(props: TransactionAuditPageProps) {
    const summary = props.summary || {
        total: 0,
        verified: 0,
        flagged: 0,
        modules: 0,
    };

    const filters = props.filters || {};
    const logs = props.logs || [];

    return (
        <TransactionAuditIndex
            auth={props.auth}
            logs={logs}
            summary={summary}
            filters={filters}
            availableModules={props.availableModules || []}
            availableActions={props.availableActions || []}
        />
    );
}