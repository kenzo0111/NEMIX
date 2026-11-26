import { formatScreenDate } from '@/utils/displayFormat';
import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import React, { Suspense, lazy, useRef, useEffect, useState } from 'react';
import { notify, notificationError } from '@/utils/notifications';
import Modal from '@/Components/Modal';
import { FileText, X, Printer, Loader2, Download } from 'lucide-react';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getReportTypeLabel } from '../constants';
import { ComplianceReport } from '../types';
import { normalizeReportPaperData } from '../utils/reportDataNormalizer';
import {
    triggerCompliancePrint,
    applyCompliancePrintStyle,
    getCompliancePrintConfig,
} from '../utils/printConfig';
import { generateCompliancePdf } from '../utils/compliancePdfEngine';

import { RsmiYearlyPreview } from './RsmiYearlyPreview';

const RSMIFormPaper = lazy(() =>
    import('../../../../../Official Forms/RSMI Report').then((m) => ({ default: m.RSMIFormPaper })),
);
const RPCIFormPaper = lazy(() =>
    import('../../../../../Official Forms/RPCI Report').then((m) => ({ default: m.ReportPhysicalCount })),
);
const StockCardFormPaper = lazy(() =>
    import('../../../../../Official Forms/Stock Card Report').then((m) => ({ default: m.StockCard })),
);
const MRFormPaper = lazy(() =>
    import('../../../../../Official Forms/MRForm').then((m) => ({ default: m.MRFormPaper })),
);

interface ReportPreviewDialogProps {
    show: boolean;
    onClose: () => void;
    report: ComplianceReport | null;
    items?: any[];
    issuances?: any[];
    receivings?: any[];
    migratedRecords?: any[];
    user?: any;
    publicSettings?: Record<string, any>;
}

export const ReportPreviewDialog: React.FC<ReportPreviewDialogProps> = ({
    show,
    onClose,
    report,
    items = [],
    issuances = [],
    receivings = [],
    migratedRecords = [],
    user,
    publicSettings,
}) => {
    const reportContentRef = useRef<HTMLDivElement>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const isLandscape = report?.type === 'RPCI';
    const reportTypeLabel = getReportTypeLabel(report?.type);
    const genDate =
        report?.generatedDate ||
        report?.createdAt ||
        report?.created_at ||
        report?.date;
    const coverageText =
        report?.coverageLabel ||
        (report?.date ? formatDisplayDate(report.date, 'MM/DD/YYYY') : 'Not Specified');

    useEffect(() => {
        if (!show || !report) return;

        const config = getCompliancePrintConfig(report.type);
        applyCompliancePrintStyle(config);

        const handleBeforePrint = () => {
            document.body.classList.add('printing-compliance');
        };

        const handleAfterPrint = () => {
            document.body.classList.remove('printing-compliance');
        };

        window.addEventListener('beforeprint', handleBeforePrint);
        window.addEventListener('afterprint', handleAfterPrint);

        return () => {
            window.removeEventListener('beforeprint', handleBeforePrint);
            window.removeEventListener('afterprint', handleAfterPrint);
            document.body.classList.remove('printing-compliance');
        };
    }, [show, report]);

    if (!report) return null;

    const handlePrint = () => {
        triggerCompliancePrint(report.type);
    };

    const handleDownload = async () => {
        const reportElement = reportContentRef.current;
        if (!reportElement || isDownloading) return;

        const paperElement =
            (reportElement.querySelector(
                '.sc-container, .rsmi-container, .rpci-container, .mr-container, .ris-container, .ics-container, .iar-container, .par-container, .po-container',
            ) as HTMLElement) || reportElement;

        try {
            setIsDownloading(true);
            await generateCompliancePdf(paperElement, {
                id: report.id,
                type: report.type,
                reference: report.reference,
                title: report.title,
                periodType: report.periodType || report.period_type,
                selectedMonth: report.selectedMonth || report.selected_month,
                selectedYear: report.selectedYear || report.selected_year,
                date: report.date,
                dateValue: report.dateValue,
                startDate: report.startDate || report.start_date,
                endDate: report.endDate || report.end_date,
                payload: report.payload,
            });
            notify({ type: 'success', message: 'Report PDF generated. Check your browser downloads.' });
        } catch (error) {
            notify({
                type: 'error',
                message: notificationError(error, error instanceof Error
                    ? error.message
                    : 'Unable to generate the report PDF. Try again; if the problem continues, use Print Form to save a PDF.'),
            });
        } finally {
            setIsDownloading(false);
        }
    };

    const renderOfficialPaper = () => {
        if (!report) return null;

        const normalized = normalizeReportPaperData(report, user, publicSettings);
        if (!normalized) {
            return (
                <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-300">
                    Preview not available for this document type.
                </div>
            );
        }

        if (report.type === 'RSMI') {
            if (normalized.isYearlyPackage && normalized.yearlyRsmiData) {
                return <RsmiYearlyPreview yearlyData={normalized.yearlyRsmiData} />;
            }

            if (normalized.rsmiData?.forms && normalized.rsmiData.forms.length > 0) {
                return (
                    <div className="space-y-8 print:space-y-0">
                        {normalized.rsmiData.forms.map((form: any, idx: number) => (
                            <div
                                key={`rsmi-page-${idx}`}
                                className="rsmi-yearly-page-break print:break-before-page print:page-break-before-always mb-8 print:mb-0"
                            >
                                <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
                                    <RSMIFormPaper data={form} />
                                </Suspense>
                            </div>
                        ))}
                    </div>
                );
            }

            if (normalized.rsmiData) {
                return (
                    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
                        <RSMIFormPaper data={normalized.rsmiData} />
                    </Suspense>
                );
            }
        }

        if (report.type === 'RPCI' && normalized.rpciData) {
            return (
                <div className="min-w-[1000px] print:min-w-0 overflow-x-auto print:overflow-visible">
                    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
                        <RPCIFormPaper data={normalized.rpciData} />
                    </Suspense>
                </div>
            );
        }

        if (report.type === 'STOCK_CARD' && normalized.stockCardData) {
            return (
                <div className="min-w-[750px] print:min-w-0 overflow-x-auto print:overflow-visible">
                    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
                        <StockCardFormPaper data={normalized.stockCardData} />
                    </Suspense>
                </div>
            );
        }

        if ((report.type === 'MR' || report.type === 'MOR') && normalized.mrData) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
                    <MRFormPaper data={normalized.mrData} />
                </Suspense>
            );
        }

        return (
            <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-300">
                Preview not available for this document type.
            </div>
        );
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth={isLandscape ? '7xl' : '5xl'}
            closeable={true}
            ariaLabel="Official COA Document Inspector"
        >
            {/* Thin Maroon Accent Top Line */}
            <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-amber-600 w-full shrink-0 print:hidden compliance-print-hide" />

            {/* Header */}
            <DialogHeader className="shrink-0 print:hidden compliance-print-hide">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100/80 dark:border-red-800/50 flex items-center justify-center text-red-900 dark:text-red-300 shadow-sm shrink-0">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                                    Official COA Document Inspector
                                </h3>
                                <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/50 border border-red-200/80 dark:border-red-900/40 text-red-900 dark:text-red-300 tabular-nums font-semibold text-sm rounded-md tracking-normal">
                                    {report.type}
                                </span>
                            </div>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 break-words">
                                Archived state compliance document recorded in university audit ledger.
                            </p>
                        </div>
                    </div>

                    <Button variant="ghost" size="icon"
                        type="button"
                        onClick={onClose}
                        className="shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                {/* Body */}
                <DialogBody className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/40 dark:bg-slate-950/60 print:p-0 print:overflow-visible print:bg-white print:block print:space-y-0">
                    {/* Report Metadata Summary Card (Read-Only) */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm print:hidden compliance-print-hide">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                            <div className="space-y-0.5">
                                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Reference
                                </span>
                                <span className="tabular-nums font-semibold text-slate-900 dark:text-slate-100 text-sm">
                                    {report.reference}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Form Type
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                                    {reportTypeLabel}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Coverage Period
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 block truncate">
                                    {coverageText}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                    Date Recorded
                                </span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                    {formatScreenDate(genDate)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Paper Preview Canvas */}
                    <div
                        ref={reportContentRef}
                        className="bg-slate-100/90 dark:bg-slate-950 p-4 sm:p-7 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto shadow-inner flex justify-center print:p-0 print:border-none print:bg-white print:block print:w-full print:shadow-none print:m-0 print:overflow-visible"
                    >
                        <div className="shadow-md rounded-sm border border-slate-200/60 bg-white text-slate-900 print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:w-full print:block print:overflow-visible dark:text-slate-300 dark:bg-slate-900">
                            <div className="compliance-print-area">
                                {renderOfficialPaper()}
                            </div>
                        </div>
                    </div>
                </DialogBody>

                {/* Footer */}
                <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0 print:hidden compliance-print-hide">
                    <Button variant="secondary"
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto text-center"
                    >
                        Close
                    </Button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <Button variant="secondary"
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center justify-center gap-1.5"
                        >
                            <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                            <span>Print Form</span>
                        </Button>

                        <Button variant="primary"
                            type="button"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="inline-flex items-center justify-center gap-1.5"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                    <span>Generating PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Download className="w-3.5 h-3.5 text-white shrink-0" />
                                    <span>Download PDF</span>
                                </>
                            )}
                        </Button>
                    </div>
                </DialogFooter>
        </Modal>
    );
};

