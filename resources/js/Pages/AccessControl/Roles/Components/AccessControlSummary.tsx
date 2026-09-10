import React from 'react';
import { Shield } from 'lucide-react';

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
        <section
            aria-labelledby="summary-heading"
            className="bg-white border border-gray-200/90 rounded-xl p-5 shadow-2xs"
        >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2
                        id="summary-heading"
                        className="text-[11px] font-bold text-gray-500 uppercase tracking-wider"
                    >
                        Access Control Summary
                    </h2>

                    <div className="mt-3 flex flex-wrap items-baseline gap-8">
                        <div>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                {rolesCount}
                            </span>
                            <span className="block text-xs font-medium text-gray-500 mt-0.5">
                                Configured Roles
                            </span>
                        </div>

                        <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                        <div>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                {permissionsCount}
                            </span>
                            <span className="block text-xs font-medium text-gray-500 mt-0.5">
                                Permissions
                            </span>
                        </div>

                        <div className="h-8 w-px bg-gray-200 hidden sm:block" />

                        <div>
                            <span className="text-2xl font-bold text-gray-900 tracking-tight">
                                {modulesCount}
                            </span>
                            <span className="block text-xs font-medium text-gray-500 mt-0.5">
                                Modules
                            </span>
                        </div>
                    </div>
                </div>

                <div className="sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 flex items-center gap-2 text-xs text-gray-600">
                    <Shield className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span>
                        Access Model:{' '}
                        <strong className="font-semibold text-gray-800">
                            Role-Based Access Control
                        </strong>
                    </span>
                </div>
            </div>
        </section>
    );
}
