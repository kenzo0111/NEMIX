import React, { Suspense, lazy, useRef } from 'react';
import Modal from '@/Components/Modal';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getReportTypeLabel } from '../constants';
import { ComplianceReport } from '../types';

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
    publicSettings = {},
}) => {
    const reportContentRef = useRef<HTMLDivElement | null>(null);

    if (!report) return null;

    const isLandscape = report.type === 'RPCI';
    const reportTypeLabel = getReportTypeLabel(report.type);
    const coverageText =
        report.coverageLabel ||
        (report.date ? formatDisplayDate(report.date, 'MM/DD/YYYY') : 'All Records');
    const genDate =
        report.generatedDate ||
        report.createdAt ||
        report.created_at ||
        report.date;

    const handlePrint = () => {
        const dynamicPrintStyleId = 'dynamic-print-orientation-style';
        let style = document.getElementById(dynamicPrintStyleId) as HTMLStyleElement | null;
        if (!style) {
            style = document.createElement('style');
            style.id = dynamicPrintStyleId;
            style.setAttribute('media', 'print');
            document.head.appendChild(style);
        } else {
            document.head.appendChild(style);
        }

        style.textContent = `@page { size: ${isLandscape ? 'A4 landscape' : 'A4 portrait'}; margin: 8mm; }`;
        window.print();
    };

    const handleDownload = async () => {
        const reportElement = reportContentRef.current;
        if (!reportElement) return;

        const paperElement =
            (reportElement.querySelector('.sc-container, .rsmi-container, .rpci-container, .mr-container') as HTMLElement) ||
            reportElement;

        const safeName = [report.type, report.reference, report.title]
            .filter(Boolean)
            .join('_')
            .replace(/[^a-z0-9_-]+/gi, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');
        const fileName = `${safeName || 'compliance_report'}.pdf`;

        const [{ jsPDF }, html2canvasModule] = await Promise.all([
            import('jspdf'),
            import('html2canvas'),
        ]);
        const html2canvas = html2canvasModule.default;
        const doc = new jsPDF({
            orientation: isLandscape ? 'landscape' : 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = isLandscape ? 297 : 210;
        const pageHeight = isLandscape ? 210 : 297;
        const margin = 8;
        const targetWidth = pageWidth - margin * 2;
        const targetHeight = pageHeight - margin * 2;

        const canvas = await html2canvas(paperElement, {
            scale: 2,
            backgroundColor: '#ffffff',
            useCORS: true,
            logging: false,
            windowWidth: paperElement.scrollWidth,
            windowHeight: paperElement.scrollHeight,
        });

        const imageData = canvas.toDataURL('image/png');
        const imgAspectRatio = canvas.width / canvas.height;
        let finalWidth = targetWidth;
        let finalHeight = targetWidth / imgAspectRatio;

        if (finalHeight > targetHeight) {
            finalHeight = targetHeight;
            finalWidth = targetHeight * imgAspectRatio;
        }

        const posX = (pageWidth - finalWidth) / 2;
        const posY = (pageHeight - finalHeight) / 2;

        doc.addImage(imageData, 'PNG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');
        doc.save(fileName);
    };

    const renderOfficialPaper = () => {
        const payload = report.payload || {};

        if (report.type === 'RSMI') {
            // Build reconstructed RSMI or use stored payload
            const rawIssued = payload.issuedItems || [];
            const rawRecap = payload.recapitulationItems || [];

            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <RSMIFormPaper
                        data={{
                            entityName: payload.entityName || publicSettings['institution_name'] || 'University of Camarines Norte',
                            serialNo: report.reference,
                            fundCluster: payload.fundCluster || '01 - Regular Agency Fund',
                            date: formatDisplayDate(genDate, 'YYYY-MM-DD') || '',
                            issuedItems: rawIssued,
                            recapitulationItems: rawRecap,
                            supplyCustodianName: publicSettings['signatories_rsmi_certified_by_name'] || user?.name || 'Supply Custodian',
                            accountingStaffName: publicSettings['signatories_rsmi_posted_by_name'] || 'Accounting Staff',
                            accountingDate: formatDisplayDate(genDate, 'YYYY-MM-DD') || '',
                        }}
                    />
                </Suspense>
            );
        }

        if (report.type === 'RPCI') {
            const rawItems = payload.items || [];
            return (
                <div className="min-w-[1000px] overflow-x-auto">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <RPCIFormPaper
                            data={{
                                entity_name: payload.entity_name || publicSettings['institution_name'] || 'University of Camarines Norte',
                                as_at_date: formatDisplayDate(genDate, 'YYYY-MM-DD') || '',
                                fund_cluster: payload.fund_cluster || '01 - Regular Agency Fund',
                                inventory_type: report.title,
                                accountable_officer: publicSettings['signatories_rpci_accountable_officer_name'] || user?.name || 'Supply Custodian',
                                designation: publicSettings['signatories_rpci_accountable_officer_designation'] || 'Supply Officer III',
                                items: rawItems,
                            }}
                        />
                    </Suspense>
                </div>
            );
        }

        if (report.type === 'STOCK_CARD') {
            const rawEntries = payload.entries || [];
            return (
                <div className="min-w-[750px] overflow-x-auto">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <StockCardFormPaper
                            data={{
                                entity_name: payload.entity_name || publicSettings['institution_name'] || 'University of Camarines Norte',
                                fund_cluster: payload.fund_cluster || '01 - Regular Agency Fund',
                                item: report.itemName || payload.item || report.title,
                                stock_no: payload.stock_no || '-',
                                description: payload.description || report.title,
                                re_order_point: payload.re_order_point || '-',
                                unit_of_measurement: payload.unit_of_measurement || 'Pieces',
                                entries: rawEntries,
                            }}
                        />
                    </Suspense>
                </div>
            );
        }

        if (report.type === 'MR' || report.type === 'MOR') {
            const rawItems = payload.items || [];
            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <MRFormPaper
                        data={{
                            entityName: payload.entityName || publicSettings['institution_name'] || 'University of Camarines Norte',
                            fundCluster: payload.fundCluster || '01 - Regular Agency Fund',
                            mrNo: report.reference,
                            date: formatDisplayDate(genDate, 'YYYY-MM-DD') || '',
                            purpose: payload.purpose || 'Official Business',
                            items: rawItems,
                            receivedByName: report.endUser || payload.receivedByName || 'Accountable Officer',
                            receivedByPosition: payload.receivedByPosition || 'Recipient',
                            receivedByOffice: payload.receivedByOffice || 'Official Business',
                            receivedByDate: formatDisplayDate(genDate, 'YYYY-MM-DD') || '',
                            issuedByName: user?.name || 'ARSENIO GEM A. GARCILLANOSA',
                            issuedByPosition: 'SUPPLY OFFICER III / PROPERTY CUSTODIAN',
                            issuedByOffice: 'Supply & Property Division',
                            issuedByDate: formatDisplayDate(genDate, 'YYYY-MM-DD') || '',
                        }}
                    />
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
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200 print:max-h-none print:shadow-none print:border-none">
                {/* Thin Maroon Accent Top Line */}
                <div className="h-1 bg-gradient-to-r from-red-900 via-red-800 to-amber-600 w-full shrink-0 print:hidden" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/80 bg-gradient-to-b from-gray-50/90 to-white shrink-0 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100/80 flex items-center justify-center text-red-900 shadow-2xs shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                    Official COA Document Inspector
                                </h3>
                                <span className="px-2 py-0.5 bg-red-50 border border-red-200/80 text-red-900 font-mono font-bold text-[10px] rounded-md tracking-wider">
                                    {report.type}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Archived state compliance document recorded in university audit ledger.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors cursor-pointer"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/40 print:p-0 print:overflow-visible print:bg-white">
                    {/* Report Metadata Summary Card (Read-Only) */}
                    <div className="bg-white border border-gray-200/80 rounded-xl p-4 shadow-2xs print:hidden">
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
                        className="bg-slate-100/90 p-4 sm:p-7 rounded-xl border border-slate-200/80 overflow-x-auto shadow-inner flex justify-center print:p-0 print:border-none print:bg-white"
                    >
                        <div className="shadow-md rounded-sm border border-gray-200/60 bg-white">
                            {renderOfficialPaper()}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200/80 shrink-0 print:hidden">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer"
                    >
                        Close
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            <span>Print Form</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleDownload}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
                        >
                            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v10m0 0l4-4m-4 4l-4-4m-5 8v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                            </svg>
                            <span>Download PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

