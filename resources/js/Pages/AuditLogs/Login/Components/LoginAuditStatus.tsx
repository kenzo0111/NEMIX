import React from 'react';
import { CheckCircle2, AlertOctagon, LogOut, HelpCircle } from 'lucide-react';
import { LoginAuditEvent } from '../types';

interface LoginAuditStatusProps {
    event: LoginAuditEvent | string;
}

export const LoginAuditStatus: React.FC<LoginAuditStatusProps> = ({ event }) => {
    switch (event) {
        case 'login_success':
        case 'Success':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Successful</span>
                </span>
            );
        case 'login_failed':
        case 'Failed':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 text-red-800 border border-red-200/80 shadow-2xs">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600 shrink-0" />
                    <span>Failed</span>
                </span>
            );
        case 'logout':
        case 'Logged Out':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs">
                    <LogOut className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>Logged Out</span>
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                    <HelpCircle className="w-3 h-3 text-gray-500 shrink-0" />
                    <span>{event}</span>
                </span>
            );
    }
};
