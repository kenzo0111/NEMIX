import React from 'react';
import { StaffStats } from '../types';

interface StaffSummaryProps {
    stats: StaffStats;
}

export default function StaffSummary({ stats }: StaffSummaryProps) {
    return (
        <div className="bg-white border border-gray-200 rounded-lg px-5 py-3 shadow-xs">
            <div className="flex flex-wrap items-center text-xs text-gray-600 gap-y-2 divide-gray-200 sm:divide-x">
                <div className="pr-4 py-0.5 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-gray-900 font-sans tracking-tight">
                        {stats.total}
                    </span>
                    <span className="font-medium text-gray-600">
                        {stats.total === 1 ? 'Staff Account' : 'Staff Accounts'}
                    </span>
                </div>

                <div className="px-4 py-0.5 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-emerald-800 font-sans tracking-tight">
                        {stats.active}
                    </span>
                    <span className="font-medium text-gray-600">Active</span>
                </div>

                <div className="px-4 py-0.5 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-gray-700 font-sans tracking-tight">
                        {stats.disabled}
                    </span>
                    <span className="font-medium text-gray-600">Disabled</span>
                </div>

                <div className="pl-4 py-0.5 flex items-baseline gap-1.5">
                    <span className="text-base font-bold text-gray-900 font-sans tracking-tight">
                        {stats.rolesAssigned}
                    </span>
                    <span className="font-medium text-gray-600">
                        {stats.rolesAssigned === 1 ? 'Assigned Role' : 'Assigned Roles'}
                    </span>
                </div>
            </div>
        </div>
    );
}
