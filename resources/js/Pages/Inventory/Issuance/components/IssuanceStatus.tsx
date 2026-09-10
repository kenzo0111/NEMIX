import React from 'react';

interface IssuanceStatusProps {
    status: 'Pending' | 'Issued' | 'Cancelled' | string;
}

export const IssuanceStatus: React.FC<IssuanceStatusProps> = ({ status }) => {
    let badgeClasses = 'bg-gray-100 text-gray-700 border-gray-200';
    let dotClasses = 'bg-gray-400';

    if (status === 'Issued') {
        badgeClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
        dotClasses = 'bg-emerald-500';
    } else if (status === 'Pending') {
        badgeClasses = 'bg-amber-50 text-amber-800 border-amber-200/80';
        dotClasses = 'bg-amber-500';
    } else if (status === 'Cancelled') {
        badgeClasses = 'bg-rose-50 text-rose-800 border-rose-200/80';
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
