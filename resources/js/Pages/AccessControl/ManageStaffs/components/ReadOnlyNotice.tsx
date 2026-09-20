import React from 'react';
import { Shield } from 'lucide-react';

export default function ReadOnlyNotice() {
    return (
        <div className="bg-slate-50/80 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-4 flex items-start gap-3 shadow-2xs">
            <div className="p-1.5 bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg shrink-0 mt-0.5 border border-slate-300/60 dark:border-slate-700">
                <Shield className="w-4 h-4" />
            </div>
            <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="font-semibold block text-slate-900 dark:text-slate-100 mb-0.5">
                    Directory View Mode (Standard Privileges):
                </strong>
                You have read-only access to the university staff roster. Registering new staff members, modifying account records, and updating access privileges are restricted strictly to System Administrators.
            </div>
        </div>
    );
}

