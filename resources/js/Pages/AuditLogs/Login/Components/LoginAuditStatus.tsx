import React from 'react';
import { LoginAuditEvent } from '../types';

interface LoginAuditStatusProps {
    event: LoginAuditEvent | string;
}

export const LoginAuditStatus: React.FC<LoginAuditStatusProps> = ({ event }) => {
    switch (event) {
        case 'login_success':
        case 'Success':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Successful Login
                </span>
            );
        case 'login_failed':
        case 'Failed':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                    Failed Login
                </span>
            );
        case 'logout':
        case 'Logged Out':
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    Logged Out
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    {event}
                </span>
            );
    }
};
