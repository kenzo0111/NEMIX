import React from 'react';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import { StaffStats } from '../types';

interface StaffSummaryProps {
    stats: StaffStats;
}

export default function StaffSummary({ stats }: StaffSummaryProps) {
    return (
        <section aria-labelledby="staff-summary-heading" className="space-y-3">
            <h2 id="staff-summary-heading" className="sr-only">
                Staff Roster Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Total Staff Accounts */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-red-900 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Total Staff
                        </span>
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-900 border border-red-100/80">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {stats.total.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Registered university personnel
                    </p>
                </div>

                {/* 2. Active Accounts */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-emerald-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Active Accounts
                        </span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <UserCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-emerald-800 tracking-tight tabular-nums">
                        {stats.active.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Active operational credentials
                    </p>
                </div>

                {/* 3. Disabled Accounts */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-slate-700 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Disabled Accounts
                        </span>
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                            <UserX className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {stats.disabled.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Revoked or pending access
                    </p>
                </div>

                {/* 4. Assigned Roles */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-amber-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Assigned Roles
                        </span>
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80">
                            <Shield className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {stats.rolesAssigned.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Distinct security roles
                    </p>
                </div>
            </div>
        </section>
    );
}

