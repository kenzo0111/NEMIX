import React from 'react';
import { Shield, KeyRound, Layers, ShieldCheck } from 'lucide-react';
import StatCard from '@/Components/ui/stat-card';

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
            <h2 id="summary-heading" className="text-xl sr-only">
                Access Control Summary Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Configured Roles"
                    value={rolesCount.toLocaleString('en-PH')}
                    sublabel="Active institutional access roles"
                    icon={<Shield className="w-5 h-5" />}
                    tone="brand"
                />
                <StatCard
                    label="System Permissions"
                    value={permissionsCount.toLocaleString('en-PH')}
                    sublabel="Granular capability definitions"
                    icon={<KeyRound className="w-5 h-5" />}
                    tone="neutral"
                />
                <StatCard
                    label="System Modules"
                    value={modulesCount.toLocaleString('en-PH')}
                    sublabel="Protected functional subsystems"
                    icon={<Layers className="w-5 h-5" />}
                    tone="warning"
                />
                <StatCard
                    label="Access Model"
                    value="RBAC Enforced"
                    sublabel="Strict role-based authorization"
                    icon={<ShieldCheck className="w-5 h-5" />}
                    tone="success"
                />
            </div>
        </section>
    );
}

