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

                {/* Dashboard Main Canvas with Clear 4-Tier Hierarchy */}
                <div className="p-4 sm:p-5 lg:p-6 max-w-[1600px] mx-auto pb-10 lg:pb-12 min-w-0 w-full space-y-4">
                    
                    {/* Operational Alert Banner (e.g. Missing RFIDs / Supplier accreditation notices) */}
                    <OperationalAlertStrip
                        untaggedRfidCount={untaggedRfid}
                        pendingSupplierCount={pendingSuppliers}
                        criticalStockCount={criticalCount}
                    />

                    {/* ========================================================================= */}
                    {/* TIER 1: IMMEDIATE OPERATIONAL STATUS (5 Unified Responsive Metrics)       */}
                    {/* ========================================================================= */}
                    <SystemSummary
                        summary={summary}
                        stats={stats}
                        criticalStockCount={criticalCount}
                    />

                    {/* ========================================================================= */}
                    {/* TIER 2: OPERATIONAL ACTIVITY & ATTENTION                                 */}
                    {/* ========================================================================= */}
                    <section aria-label="Operational Activity and Stock Attention" className="space-y-4">
                        {/* Dominant Visualization & Recent Operations */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                            {/* Dominant Chart: 7 of 12 cols on desktop, full width on smaller screens */}
                            <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
                                <InventoryMovementOverview
                                    movement={activeMovement}
                                    movementSummary={movementSummary}
                                    currentFilter={filters?.chartFilter}
                                />
                            </div>

                            {/* Recent Operations: Stacked 4-row compact cards */}
                            <div className="lg:col-span-5 xl:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                                <RecentReceiving receivings={recentReceiving} />
                                <RecentIssuance issuances={recentIssuance} />
                            </div>
                        </div>

                        {/* Actionable Critical Stock Table */}
                        <div>
                            <CriticalStockOverview items={activeCriticalStock} />
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* TIER 3: ADMINISTRATIVE STATUS (Matched Height 3-Column Row)              */}
                    {/* ========================================================================= */}
                    <section aria-label="Administrative Status">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                            <RfidOverview rfidSummary={rfidSummary} />
                            <SupplierStatusCard summary={supplierSummary} />
                            <ComplianceStatusCard summary={complianceSummary} />
                        </div>
                    </section>

                    {/* ========================================================================= */}
                    {/* TIER 4: AUDIT / SUPPORTING ACTIVITY (Compact Low-Profile Feed)           */}
                    {/* ========================================================================= */}
                    <section aria-label="Recent System Activity">
                        <RecentSystemActivity activities={activeRecentActivity} />
                    </section>

                </div>
            </main>
        </div>
    );
}
