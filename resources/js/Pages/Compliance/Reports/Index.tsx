import DashboardContent from '@/Layouts/DashboardContent';
import { notify } from '@/utils/notifications';
import React, { useMemo, useState } from 'react';
import { Head, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { ReportToolbar } from './Components/ReportToolbar';
import { ReportRegistry } from './Components/ReportRegistry';
import { GenerateReportDialog } from './Components/GenerateReportDialog';
import { ReportPreviewDialog } from './Components/ReportPreviewDialog';
import { MigrationDialog } from './Migration/MigrationDialog';
import { useReportGenerator } from './hooks/useReportGenerator';
import { useHistoricalMigration } from './hooks/useHistoricalMigration';
import { ComplianceReport, ManageReportsPageProps, ReportType } from './types';

export default function ReportsIndex({
    auth,
    items = [],
    reports = [],
    issuances = [],
    endUsers = [],
    receivings = [],
    suppliers = [],
    migratedRecords = [],
}: ManageReportsPageProps) {
    const { props } = usePage();
    const user = auth?.user || (props.auth as any)?.user;
    const publicSettings = (props as any)?.system?.settings || {};

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<ReportType | ''>('');

    // Modals
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showPreviewModal, setShowPreviewModal] = useState(false);
    const [showMigrationModal, setShowMigrationModal] = useState(false);
    const [selectedReportToView, setSelectedReportToView] = useState<ComplianceReport | null>(null);

    const modules = getSidebarModules('Compliance', 'Manage Reports');

    // Report Generator Hook
    const reportGenerator = useReportGenerator(reports, migratedRecords, () => {
        setShowGenerateModal(false);
    });

    // Historical Migration Hook
    const migration = useHistoricalMigration(migratedRecords, () => {
        setShowMigrationModal(false);
    });

    // Filter reports
    const filteredReports = useMemo(() => {
        return reports.filter((r) => {
            if (!r) return false;
            const search = searchTerm.trim().toLowerCase();
            const matchesSearch =
                !search ||
                String(r.title || '').toLowerCase().includes(search) ||
                String(r.reference || '').toLowerCase().includes(search) ||
                String(r.type || '').toLowerCase().includes(search) ||
                String(r.itemName || '').toLowerCase().includes(search) ||
                String(r.supplierName || '').toLowerCase().includes(search);

            const matchesType = !selectedType || String(r.type) === String(selectedType);
            return matchesSearch && matchesType;
        });
    }, [reports, searchTerm, selectedType]);

    const handleViewReport = (report: ComplianceReport) => {
        setSelectedReportToView(report);
        setShowPreviewModal(true);
    };

    const handleOpenGenerate = () => {
        reportGenerator.reset();
        setShowGenerateModal(true);
    };

    const handleOpenMigration = () => {
        migration.reset();
        setShowMigrationModal(true);
    };

    return (
        <>
            <Head title="COA Compliance Reports & Official Forms" />

            <div className="print:hidden compliance-print-hide">

            </div>

            <DashboardLayout modules={modules} user={user}>
                <div className="print:hidden compliance-print-hide">
                    <PageHeader
                        title="MANAGE REPORTS"
                        description="Generate and maintain official inventory and compliance documents."
                        breadcrumbs={[{ name: 'Compliance' }, { name: 'Manage Reports' }]}
                    />
                </div>

                <DashboardContent className="print:p-0 print:m-0 print:space-y-0 print:h-auto">
                    <div className="print:hidden space-y-6">
                        {/* Primary Official COA Documents Ledger Card */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
                            <ReportToolbar
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                selectedType={selectedType}
                                onTypeChange={setSelectedType}
                                onOpenGenerate={handleOpenGenerate}
                                onOpenMigration={handleOpenMigration}
                            />

                            <ReportRegistry
                                reports={filteredReports}
                                onViewReport={handleViewReport}
                                onOpenGenerate={handleOpenGenerate}
                            />
                        </div>
                    </div>
                </DashboardContent>

                {/* Generate Report Dialog (2-Step Workflow) */}
                <GenerateReportDialog
                    show={showGenerateModal}
                    onClose={() => setShowGenerateModal(false)}
                    formData={reportGenerator.formData}
                    updateField={reportGenerator.updateField}
                    currentStep={reportGenerator.currentStep}
                    setCurrentStep={reportGenerator.setCurrentStep}
                    previewDataset={reportGenerator.previewDataset}
                    isLoadingPreview={reportGenerator.isLoadingPreview}
                    isSubmitting={reportGenerator.isSubmitting}
                    onFetchPreview={reportGenerator.fetchPreviewDataset}
                    onSubmitReport={() => {
                        reportGenerator.submitReport((res) => {
                            if (res.success) {
                                setShowGenerateModal(false);
                            }
                            notify({ type: res.success ? 'success' : 'error', message: res.message });
                        });
                    }}
                    items={items}
                    suppliers={suppliers}
                    issuances={issuances}
                    endUsers={endUsers}
                    migratedRecords={migratedRecords}
                    user={user}
                    publicSettings={publicSettings}
                />

                {/* Read-Only Official Report Inspector / Preview Dialog */}
                <ReportPreviewDialog
                    show={showPreviewModal}
                    onClose={() => setShowPreviewModal(false)}
                    report={selectedReportToView}
                    items={items}
                    issuances={issuances}
                    receivings={receivings}
                    migratedRecords={migratedRecords}
                    user={user}
                    publicSettings={publicSettings}
                />

                {/* Historical Data Migration Workspace Dialog */}
                <MigrationDialog
                    show={showMigrationModal}
                    onClose={() => setShowMigrationModal(false)}
                    migration={migration}
                    onCompleteNotification={(res) => {
                        notify({ type: res.success ? 'success' : 'error', message: res.message });
                    }}
                />

            </DashboardLayout>
        </>
    );
}
