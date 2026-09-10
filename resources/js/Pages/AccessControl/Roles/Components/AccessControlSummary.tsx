import React from 'react';
import { Shield, KeyRound, Layers, ShieldCheck } from 'lucide-react';

interface AccessControlSummaryProps {
    rolesCount: number;
    permissionsCount: number;
    modulesCount: number;
}

export default function AccessControlSummary({
    rolesCount,
    permissionsCount,
    modulesCount,
}: AccessControlSummaryProps) {
    return (
        <section aria-labelledby="summary-heading" className="space-y-3">
            <h2 id="summary-heading" className="sr-only">
                Access Control Summary Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Configured Roles */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-red-900 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Configured Roles
                        </span>
                        <div className="p-1.5 rounded-lg bg-red-50 text-red-900 border border-red-100/80">
                            <Shield className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {rolesCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Active institutional access roles
                    </p>
                </div>

                {/* 2. System Permissions */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-slate-700 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            System Permissions
                        </span>
                        <div className="p-1.5 rounded-lg bg-slate-50 text-slate-700 border border-slate-200">
                            <KeyRound className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {permissionsCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Granular capability definitions
                    </p>
                </div>

                {/* 3. Protected Modules */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-amber-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            System Modules
                        </span>
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-200/80">
                            <Layers className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 tracking-tight tabular-nums">
                        {modulesCount.toLocaleString()}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1 font-medium">
                        Protected functional subsystems
                    </p>
                </div>

                {/* 4. Access Model */}
                <div className="bg-white rounded-xl p-4 border border-gray-200/80 border-t-2 border-t-emerald-600 shadow-2xs hover:shadow-xs transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Access Model
                        </span>
                        <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <ShieldCheck className="w-4 h-4" />
                        </div>
                    </div>
                    <div className="text-base font-bold text-emerald-800 tracking-tight mt-1 truncate">
                        RBAC Enforced
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1.5 font-medium">
                        Strict role-based authorization
                    </p>
                </div>
            </div>
        </section>
    );
}

