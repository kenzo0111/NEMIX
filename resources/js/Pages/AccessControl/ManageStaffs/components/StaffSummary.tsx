import React from 'react';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';
import StatCard from '@/Components/ui/stat-card';
import { StaffStats } from '../types';

interface StaffSummaryProps {
    stats: StaffStats;
}

export default function StaffSummary({ stats }: StaffSummaryProps) {
    return (
        <section aria-labelledby="staff-summary-heading" className="space-y-3">
            <h2 id="staff-summary-heading" className="text-xl sr-only">
                Staff Roster Metrics
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Total Staff"
                    value={stats.total.toLocaleString('en-PH')}
                    sublabel="Registered university personnel"
                    icon={<Users className="w-5 h-5" />}
                    tone="brand"
                />
                <StatCard
                    label="Active Accounts"
                    value={stats.active.toLocaleString('en-PH')}
                    sublabel="Active operational credentials"
                    icon={<UserCheck className="w-5 h-5" />}
                    tone="success"
                />
                <StatCard
                    label="Disabled Accounts"
                    value={stats.disabled.toLocaleString('en-PH')}
                    sublabel="Revoked or pending access"
                    icon={<UserX className="w-5 h-5" />}
                    tone="neutral"
                />
                <StatCard
                    label="Assigned Roles"
                    value={stats.rolesAssigned.toLocaleString('en-PH')}
                    sublabel="Distinct security roles"
                    icon={<Shield className="w-5 h-5" />}
                    tone="warning"
                />
            </div>
        </section>
    );
}

