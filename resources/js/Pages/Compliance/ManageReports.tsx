import React, { useState, useMemo } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/Common/PageHeader';
import Toast, { useToast } from '@/Components/Common/Toast';
import ConfirmDialog from '@/Components/Common/ConfirmDialog';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { ComplianceReportItem } from './Reports/types';
import ReportRegistry from './Reports/ReportRegistry';
import ReportGenerator from './Reports/ReportGenerator';
import ReportViewer from './Reports/ReportViewer';
import DataMigration from './Reports/DataMigration';

interface ManageReportsProps {
    auth: any;
    items?: any[];
    reports?: any[];
    issuances?: any[];
    suppliers?: any[];
    migratedRecords?: any[];
}

export default function ManageReports({
    auth,
    items = [],
    reports: serverReports = [],
    issuances = [],
    suppliers = [],
    migratedRecords = [],
}: ManageReportsProps) {
    const pageProps = usePage().props as any;
    const user = auth?.user || pageProps.auth?.user;
    const systemMode = pageProps.system?.mode || 'LIVE PRODUCTION';

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    const modules = getSidebarModules('Compliance', 'Manage Reports');
    const { toast, showToast, clearToast } = useToast();

    // Modals state
    const [showGenerator, setShowGenerator] = useState(false);
    const [showMigration, setShowMigration] = useState(false);
    const [viewingReport, setViewingReport] = useState<any | null>(null);

    // Archive Confirmation Dialog state
    const [reportToArchive, setReportToArchive] = useState<ComplianceReportItem | null>(null);
    const [isArchiving, setIsArchiving] = useState(false);

    // Merge server official reports and migrated historical records into a unified list
    const combinedReports: ComplianceReportItem[] = useMemo(() => {
        const standardList = (serverReports || []).map((r: any) => ({
            id: r.id,
            type: r.type,
            reference: r.reference || `REF-${r.id}`,
            title: r.title || `${r.type} - ${r.reference}`,
            itemName: r.itemName || r.item_name || r.payload?.item_name || '',
            supplierName: r.supplierName || r.supplier_name || '',
            quantity: r.quantity || r.payload?.quantity,
            recipient: r.endUser || r.recipient || r.payload?.endUser || '',
            department: r.department || r.payload?.department || 'SPMO Central',
            status: r.status || 'submitted',
            date: r.date || r.generatedDate || (r.created_at ? String(r.created_at).split('T')[0] : ''),
            payload: r.payload || {},
            source: 'official',
        }));

        const migratedList = (migratedRecords || []).map((m: any) => ({
            id: `migrated-${m.id}`,
            type: m.form_type,
            reference: m.reference || `${m.form_type}-HIST-${m.id}`,
            title: `${m.form_type} Historical Record`,
            itemName: m.item_name || m.item || m.payload?.item_name || 'Inventory Item',
            supplierName: m.source || 'Legacy Import',
            quantity: m.quantity || m.quantity_issued || m.payload?.quantity,
            recipient: m.recipient || m.received_by || m.payload?.recipient || '',
            department: m.department || m.center_code || m.location || 'SPMO Central',
            status: 'historical_migration',
            date: m.date || (m.created_at ? String(m.created_at).split('T')[0] : ''),
            payload: m.payload || m,
            source: 'historical',
        }));

        return [...standardList, ...migratedList];
    }, [serverReports, migratedRecords]);

    const handleConfirmArchive = () => {
        if (!reportToArchive) return;
        setIsArchiving(true);

        router.delete(route('compliance.reports.archive', reportToArchive.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsArchiving(false);
                setReportToArchive(null);
                showToast('Report has been moved to archive.', 'success');
            },
            onError: () => {
                setIsArchiving(false);
                showToast('Failed to archive report. Please try again.', 'error');
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white print:bg-white">
            <Head title="COA Compliance Reports & Official Forms" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Content Area */}
            <main
                className={`flex-1 transition-all duration-300 ease-in-out ${
                    collapsed ? 'ml-20' : 'ml-72'
                }`}
            >
                {/* Unified Sticky Header — Same as Dashboard */}
                <PageHeader
                    title="COA Compliance Reports"
                    subtitle="Official government inventory reporting (RSMI, RPCI, Stock Card, MR) & historical ledger archive"
                    breadcrumbs={[
                        { name: 'Compliance' },
                        { name: 'Manage Reports' },
                    ]}
                />

                {/* Page Body */}
                <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-6">
                    <ReportRegistry
                        reports={combinedReports}
                        onView={(rep) => setViewingReport(rep)}
                        onPrint={(rep) => {
                            setViewingReport(rep);
                            setTimeout(() => window.print(), 350);
                        }}
                        onExportPDF={(rep) => setViewingReport(rep)}
                        onArchive={(rep) => setReportToArchive(rep)}
                        onGenerateNew={() => setShowGenerator(true)}
                        onMigrate={() => setShowMigration(true)}
                    />
                </div>
            </main>

            {/* Dedicated Generator Modal */}
            <ReportGenerator
                show={showGenerator}
                reports={combinedReports}
                items={items}
                issuances={issuances}
                suppliers={suppliers}
                migratedRecords={migratedRecords}
                onClose={() => setShowGenerator(false)}
                onPreview={(previewData) => setViewingReport(previewData)}
                onSuccess={(msg) => showToast(msg, 'success')}
                onError={(msg) => showToast(msg, 'error')}
            />

            {/* Dedicated 6-Stage Migration Workflow */}
            <DataMigration
                show={showMigration}
                migratedRecords={migratedRecords}
                onClose={() => setShowMigration(false)}
                onSuccess={(msg) => showToast(msg, 'success')}
                onError={(msg) => showToast(msg, 'error')}
            />

            {/* Dedicated Official Document Viewer & Print Container */}
            <ReportViewer
                show={Boolean(viewingReport)}
                report={viewingReport}
                items={items}
                issuances={issuances}
                suppliers={suppliers}
                onClose={() => setViewingReport(null)}
            />

            {/* Confirm Archive Dialog */}
            <ConfirmDialog
                isOpen={Boolean(reportToArchive)}
                title="Archive Official Report"
                message={
                    <>
                        Are you sure you want to archive document reference{' '}
                        <strong className="font-mono text-gray-900 font-bold">
                            {reportToArchive?.reference}
                        </strong>
                        ? Archived documents are removed from active compliance submissions but retained in institutional audit trails.
                    </>
                }
                confirmLabel="Archive Document"
                variant="warning"
                isProcessing={isArchiving}
                onConfirm={handleConfirmArchive}
                onCancel={() => setReportToArchive(null)}
            />

            {/* Non-disruptive Toast Notifications */}
            <Toast toast={toast} onClose={clearToast} />
        </div>
    );
}