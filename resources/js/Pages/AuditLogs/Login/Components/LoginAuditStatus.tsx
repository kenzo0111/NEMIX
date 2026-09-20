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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>Successful</span>
                </span>
            );
        case 'login_failed':
        case 'Failed':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200/80 dark:border-red-800/50 shadow-2xs">
                    <AlertOctagon className="w-3.5 h-3.5 text-red-600 dark:text-red-400 shrink-0" />
                    <span>Failed</span>
                </span>
            );
        case 'logout':
        case 'Logged Out':
            return (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs">
                    <LogOut className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span>Logged Out</span>
                </span>
            );
        default:
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700">
                    <HelpCircle className="w-3 h-3 text-gray-500 dark:text-slate-400 shrink-0" />
                    <span>{event}</span>
                </span>
            );
    }
};
