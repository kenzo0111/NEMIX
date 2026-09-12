import React, { Suspense, lazy, useRef, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
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
                type: report.type,
                reference: report.reference,
                title: report.title,
            });
        } catch (error) {
            console.error('Failed to generate compliance PDF:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    const renderOfficialPaper = () => {
        if (!report) return null;

        const normalized = normalizeReportPaperData(report, user, publicSettings);
        if (!normalized) {
            return (
                <div className="p-12 text-center text-xs text-gray-500">
                    Preview not available for this document type.
                </div>
            );
        }

        if (report.type === 'RSMI' && normalized.rsmiData) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <RSMIFormPaper data={normalized.rsmiData} />
                </Suspense>
            );
        }

        if (report.type === 'RPCI' && normalized.rpciData) {
            return (
                <div className="min-w-[1000px] print:min-w-0 overflow-x-auto print:overflow-visible">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <RPCIFormPaper data={normalized.rpciData} />
                    </Suspense>
                </div>
            );
        }

        if (report.type === 'STOCK_CARD' && normalized.stockCardData) {
            return (
                <div className="min-w-[750px] print:min-w-0 overflow-x-auto print:overflow-visible">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <StockCardFormPaper data={normalized.stockCardData} />
                    </Suspense>
                </div>
            );
        }

        if ((report.type === 'MR' || report.type === 'MOR') && normalized.mrData) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <MRFormPaper data={normalized.mrData} />
                </Suspense>
            );
        }

        return (
            <div className="p-12 text-center text-xs text-gray-500">
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
        >
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 print:max-h-none print:shadow-none print:border-none compliance-print-dialog-panel">
                {/* Thin Maroon Accent Top Line */}
                <div className="h-1 bg-gradient-to-r from-red-900 via-red-800 to-amber-600 w-full shrink-0 print:hidden compliance-print-hide" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200/80 bg-gradient-to-b from-gray-50/90 to-white shrink-0 print:hidden compliance-print-hide">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100/80 flex items-center justify-center text-red-900 shadow-2xs shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                    Official COA Document Inspector
                                </h3>
                                <span className="px-2 py-0.5 bg-red-50 border border-red-200/80 text-red-900 font-mono font-bold text-[10px] rounded-md tracking-wider">
                                    {report.type}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                                Archived state compliance document recorded in university audit ledger.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/40 print:p-0 print:overflow-visible print:bg-white print:block print:space-y-0">
                    {/* Report Metadata Summary Card (Read-Only) */}
                    <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs print:hidden compliance-print-hide">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div className="space-y-0.5">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                    Reference
                                </span>
                                <span className="font-mono font-bold text-gray-900 text-xs">
                                    {report.reference}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                    Form Type
                                </span>
                                <span className="font-semibold text-gray-900 block truncate">
                                    {reportTypeLabel}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                    Coverage Period
                                </span>
                                <span className="font-semibold text-gray-900 block truncate">
                                    {coverageText}
                                </span>
                            </div>
                            <div className="space-y-0.5">
                                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                    Date Recorded
                                </span>
                                <span className="font-semibold text-gray-900 font-mono">
                                    {formatDisplayDate(genDate, 'MM/DD/YYYY')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Paper Preview Canvas */}
                    <div
                        ref={reportContentRef}
                        className="bg-slate-100/90 p-4 sm:p-7 rounded-xl border border-slate-200/80 overflow-x-auto shadow-inner flex justify-center print:p-0 print:border-none print:bg-white print:block print:w-full print:shadow-none print:m-0 print:overflow-visible"
                    >
                        <div className="shadow-md rounded-sm border border-gray-200/60 bg-white print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:w-full print:block print:overflow-visible">
                            <div className="compliance-print-area">
                                {renderOfficialPaper()}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200/80 shrink-0 print:hidden compliance-print-hide">
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer text-center"
                    >
                        Close
                    </button>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Print Form</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 disabled:opacity-60 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                        >
                            {isDownloading ? (
                                <>
                                    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>Generating PDF...</span>
                                </>
                            ) : (
                                <>
                                    <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v10m0 0l4-4m-4 4l-4-4m-5 8v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                                    </svg>
                                    <span>Download PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

