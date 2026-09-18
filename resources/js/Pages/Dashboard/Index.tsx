import React from 'react';
import { Head } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import FlashToast from '@/Components/FlashToast';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { DashboardPageProps } from './types';

import DashboardHeader from './Components/DashboardHeader';
import OperationalAlertStrip from './Components/OperationalAlertStrip';
import SystemSummary from './Components/SystemSummary';
import InventoryMovementOverview from './Components/InventoryMovementOverview';
import RecentReceiving from './Components/RecentReceiving';
import RecentIssuance from './Components/RecentIssuance';
import CriticalStockOverview from './Components/CriticalStockOverview';
import RfidOverview from './Components/RfidOverview';
import SupplierStatusCard from './Components/SupplierStatusCard';
import ComplianceStatusCard from './Components/ComplianceStatusCard';
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
    const [collapsed, handleToggleCollapse] = useSidebarCollapse();
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
        <div className="min-h-screen bg-[#F4F6F8] flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Supply & Inventory Management Dashboard" />

            {/* Global Flash Toast Notifications */}
            <FlashToast />

            <Sidebar
                modules={modules}
                user={auth.user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                {/* Unified Sticky Header */}
                <DashboardHeader />

                {/* Bento Grid Canvas */}
                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto pb-16 min-w-0 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6 auto-rows-min">
                    
                    {/* Dynamic Alert Row (Automatically fits into grid cells) */}
                    <OperationalAlertStrip
                        criticalStockCount={criticalCount}
                        unserviceableCount={unserviceableCount}
                        untaggedRfidCount={untaggedRfid}
                        pendingSupplierCount={pendingSuppliers}
                    />

                    {/* KPI Cards (4 cards) */}
                    <SystemSummary summary={summary} stats={stats} />

                    {/* Main Visual: Inventory Movement Chart (Spans 2 columns, 2 rows) */}
                    <InventoryMovementOverview
                        movement={activeMovement}
                        movementSummary={movementSummary}
                        currentFilter={filters?.chartFilter}
                    />

                    {/* Smaller contextual cards arranged around the chart */}
                    <RecentReceiving receivings={recentReceiving} />
                    
                    <RecentIssuance issuances={recentIssuance} />
                    
                    <CriticalStockOverview items={activeCriticalStock} />
                    
                    <RfidOverview rfidSummary={rfidSummary} />

                    <SupplierStatusCard summary={supplierSummary} />

                    <ComplianceStatusCard summary={complianceSummary} />

                    {/* Recent System Activity Feed (Spans full width at bottom) */}
                    <RecentSystemActivity activities={activeRecentActivity} />

                </div>
            </main>
        </div>
    );
}
