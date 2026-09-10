import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { DashboardPageProps } from './types';

import DashboardHeader from './Components/DashboardHeader';
import OperationalAlertStrip from './Components/OperationalAlertStrip';
import SystemSummary from './Components/SystemSummary';
import InventoryMovementOverview from './Components/InventoryMovementOverview';
import OperationalActivity from './Components/OperationalActivity';
import CriticalStockOverview from './Components/CriticalStockOverview';
import RfidOverview from './Components/RfidOverview';
import SupplierComplianceRow from './Components/SupplierComplianceRow';
import RecentSystemActivity from './Components/RecentSystemActivity';

export default function DashboardIndex({
    auth,
    summary,
    stats,
    movement = [],
    movementSummary,
    chartData,
    recentReceiving = [],
    recentIssuance = [],
    criticalStock = [],
    lowStockAlerts = [],
    rfidSummary,
    supplierSummary,
    complianceSummary,
    recentActivity = [],
    auditLogs = [],
    filters,
}: DashboardPageProps) {
    const [collapsed, setCollapsed] = useState(false);
    const modules = getSidebarModules();

    // Prefer modern props, fallback cleanly to legacy props
    const activeCriticalStock = criticalStock.length > 0 ? criticalStock : lowStockAlerts;
    const activeRecentActivity = recentActivity.length > 0 ? recentActivity : auditLogs;
    const activeMovement = movement.length > 0 ? movement : (chartData?.monthly || []);

    const criticalCount = summary?.critical_stock ?? stats?.criticalAlerts ?? activeCriticalStock.length;
    const unserviceableCount = summary?.unserviceable ?? stats?.unserviceable ?? 0;
    const untaggedRfid = rfidSummary?.untagged ?? 0;
    const pendingSuppliers = supplierSummary?.pending ?? 0;

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Supply & Inventory Management Dashboard" />

            <Sidebar
                modules={modules}
                user={auth.user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Unified Sticky Header */}
                <DashboardHeader />

                {/* Main Dashboard Overview Canvas */}
                <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                    {/* Operational Alert Strip (Condition-based) */}
                    <OperationalAlertStrip
                        criticalStockCount={criticalCount}
                        unserviceableCount={unserviceableCount}
                        untaggedRfidCount={untaggedRfid}
                        pendingSupplierCount={pendingSuppliers}
                    />

                    {/* System Summary Key Totals */}
                    <SystemSummary summary={summary} stats={stats} />

                    {/* Inventory Movement Overview (Monthly / Yearly Trends) */}
                    <InventoryMovementOverview
                        movement={activeMovement}
                        movementSummary={movementSummary}
                        currentFilter={filters?.chartFilter}
                    />

                    {/* Operational Activity (Recent Receiving & Recent Issuance) */}
                    <OperationalActivity
                        receiving={recentReceiving}
                        issuance={recentIssuance}
                    />

                    {/* Inventory Attention (Critical Stock & RFID Status) */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <CriticalStockOverview items={activeCriticalStock} />
                        <RfidOverview rfidSummary={rfidSummary} />
                    </div>

                    {/* Governance & Vendor Status (Suppliers & Compliance) */}
                    <SupplierComplianceRow
                        supplierSummary={supplierSummary}
                        complianceSummary={complianceSummary}
                    />

                    {/* Recent System Activity Feed */}
                    <RecentSystemActivity activities={activeRecentActivity} />
                </div>
            </main>
        </div>
    );
}
