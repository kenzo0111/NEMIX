import React from 'react';
import LoginAuditIndex from './Login/Index';
import { LoginAuditPageProps } from './Login/types';

export default function ManageLoginTrails(props: LoginAuditPageProps) {
    const summary = props.summary || {
        total: 0,
        successful: 0,
        failed: 0,
        unique_users: 0,
    };

    const filters = props.filters || {};
    const loginData = props.loginData || [];

    return (
        <LoginAuditIndex
            auth={props.auth}
            loginData={loginData}
            summary={summary}
            filters={filters}
            availableRoles={props.availableRoles || []}
            availableStatuses={props.availableStatuses || []}
        />
    );
}