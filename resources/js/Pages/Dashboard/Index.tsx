import DashboardContent from '@/Layouts/DashboardContent';
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { DashboardPageProps } from './types';

import DashboardControls from '@/Components/DashboardControls';
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
import CoordinatorDashboardWorkspace from './Components/CoordinatorDashboardWorkspace';

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
    showRfidAlert = false,
    supplierSummary,
    complianceSummary,
    recentActivity = [],
    auditLogs = [],
    filters,
    inventoryScope,
    coordinatorName,
    requestSummary = {},
    recentRequests = [],
}: DashboardPageProps) {
    const isCoordinator = inventoryScope === 'coordinator';
    const modules = getSidebarModules();

    // Prefer modern props, fallback cleanly to legacy props
    const activeCriticalStock = criticalStock.length > 0 ? criticalStock : lowStockAlerts;
    const activeRecentActivity = recentActivity.length > 0 ? recentActivity : auditLogs;
    const activeMovement = movement.length > 0 ? movement : (chartData?.monthly || []);

    const criticalCount = summary?.critical_stock ?? stats?.criticalAlerts ?? activeCriticalStock.length;
    const untaggedRfid = rfidSummary?.untagged ?? 0;
    const pendingSuppliers = supplierSummary?.pending ?? 0;
    const isInventoryStaff = [auth.user.role, ...(auth.user.roles || [])]
        .filter((role): role is string => typeof role === 'string')
        .some((role) => ['inventory staff', 'spmo personnel'].includes(role.trim().toLowerCase()));

    return (
        <>
            <Head title="Dashboard" />



            <DashboardLayout modules={modules} user={auth.user}>
                {isCoordinator ? (
                    <CoordinatorDashboardWorkspace
                        auth={auth}
                        coordinatorName={coordinatorName}
                        summary={summary}
                        stats={stats}
                        movement={activeMovement}
                        movementSummary={movementSummary}
                        criticalStock={activeCriticalStock}
                        recentActivity={activeRecentActivity}
                        filters={filters}
                        requestSummary={requestSummary}
                        recentRequests={recentRequests}
                    />
                ) : (
                    <>
                        {/* Dashboard Main Canvas with Clear 4-Tier Hierarchy */}
                        <DashboardContent>
                            {isInventoryStaff ? <header className="flex flex-wrap items-end justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700">Inventory Staff</p>
                                    <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">Inventory overview</h1>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Monitor stock levels, receiving, issuance, and supply activity across the system.</p>
                                </div>
                                <DashboardControls className="w-auto" />
                            </header> : <DashboardControls />}
                            {/* Operational Alert Banner (e.g. Missing RFIDs / Supplier accreditation notices) */}
                            <OperationalAlertStrip
                                showRfidAlert={showRfidAlert}
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
                        </DashboardContent>
                    </>
                )}
            </DashboardLayout>
        </>
    );
}
