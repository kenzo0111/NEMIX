import React from 'react';

interface IssuanceStatusProps {
    status: 'Pending' | 'Issued' | 'Cancelled' | string;
}

export const IssuanceStatus: React.FC<IssuanceStatusProps> = ({ status }) => {
    let badgeClasses = 'bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 border-gray-200 dark:border-slate-700';
    let dotClasses = 'bg-gray-400 dark:bg-slate-500';

    if (status === 'Issued') {
        badgeClasses = 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60';
        dotClasses = 'bg-emerald-500';
    } else if (status === 'Pending') {
        badgeClasses = 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60';
        dotClasses = 'bg-amber-500';
    } else if (status === 'Cancelled') {
        badgeClasses = 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60';
        dotClasses = 'bg-rose-500';
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses}`}
        >
            <span className={`w-1.5 h-1.5 rounded-full ${dotClasses}`} />
            {status}
        </span>
    );
};
