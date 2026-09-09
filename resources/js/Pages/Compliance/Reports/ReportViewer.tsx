import React, { Suspense, lazy, useRef, useState } from 'react';
import Modal from '@/Components/Modal';
import { Printer, FileDown, X, FileText } from 'lucide-react';
import { ComplianceReportItem, formatFundClusterDisplay } from './types';

const RSMIFormPaper = lazy(() =>
    import('../../../../Official Forms/RSMI Report').then((module) => ({
        default: module.RSMIFormPaper,
    }))
);

const RPCIFormPaper = lazy(() =>
    import('../../../../Official Forms/RPCI Report').then((module) => ({
        default: module.ReportPhysicalCount,
    }))
);

const StockCardFormPaper = lazy(() =>
    import('../../../../Official Forms/Stock Card Report').then((module) => ({
        default: module.StockCard,
    }))
);

const MRFormPaper = lazy(() =>
    import('../../../../Official Forms/MRForm').then((module) => ({
        default: module.MRFormPaper,
    }))
);

interface ReportViewerProps {
    show: boolean;
    report: any | null;
    items?: any[];
    issuances?: any[];
    suppliers?: any[];
    onClose: () => void;
}

export default function ReportViewer({
    show,
    report,
    items = [],
    issuances = [],
    suppliers = [],
    onClose,
}: ReportViewerProps) {
    const printContainerRef = useRef<HTMLDivElement>(null);
    const [isExportingPDF, setIsExportingPDF] = useState(false);

    if (!report) return null;

    const formType = String(report.type || report.form_type || 'RSMI').toUpperCase();
    const isLandscape = formType === 'RPCI';

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = async () => {
        if (!printContainerRef.current) return;
        setIsExportingPDF(true);

        try {
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const targetElement = printContainerRef.current;
            const canvas = await html2canvas(targetElement, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const pdfWidth = isLandscape ? 297 : 210;
            const pdfHeight = isLandscape ? 210 : 297;
            const margin = 8;
            const usableWidth = pdfWidth - margin * 2;
            const imgHeight = (canvas.height * usableWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', margin, margin, usableWidth, Math.min(imgHeight, pdfHeight - margin * 2));
            pdf.save(`${formType}_${report.reference || 'Report'}.pdf`);
        } catch (error) {
            console.error('PDF export error:', error);
        } finally {
            setIsExportingPDF(false);
        }
    };

    // Prepare data props for the respective official form paper
    const payload = report.payload || {};
    const reportDate = report.date || payload.date || new Date().toISOString().split('T')[0];

    const rawItems: any[] = report.itemsData || payload.items || payload.records || [];

    const issuedItems = rawItems.map((it: any) => ({
        risNo: it.risNo || it.ris_no || report.reference || payload.serialNo || '',
        responsibilityCenterCode: it.responsibilityCenterCode || it.responsibility_center_code || it.center_code || report.department || 'SPMO',
        stockNo: it.stockNo || it.stock_no || '',
        itemDescription: it.itemDescription || it.item || it.item_name || report.itemName || report.item_name || 'Consumable Item',
        unit: it.unit || 'pc',
        quantityIssued: it.quantityIssued ?? it.quantity ?? it.quantity_issued ?? 1,
        unitCost: it.unitCost ?? it.unit_cost ?? 0,
        amount: it.amount ?? (Number(it.quantityIssued ?? it.quantity ?? 1) * Number(it.unitCost ?? it.unit_cost ?? 0)),
    }));

    const rsmiData = {
        entityName: payload.entityName || payload.entity_name || 'University of Camarines Norte',
        fundCluster: formatFundClusterDisplay(payload.fundCluster || payload.fund_cluster),
        serialNo: report.reference || payload.serialNo || payload.ris_no || '',
        date: reportDate,
        issuedItems: issuedItems.length > 0 ? issuedItems : [
            {
                risNo: report.reference || payload.serialNo || '',
                responsibilityCenterCode: report.department || 'SPMO Central',
                stockNo: 'STK-001',
                itemDescription: report.itemName || report.item_name || 'Consumable Office Supplies',
                unit: 'pc',
                quantityIssued: report.quantity || 1,
                unitCost: report.unitCost || report.unit_cost || 0,
                amount: report.amount || 0,
            }
        ],
        recapitulationItems: (payload.recapitulationItems || []).map((r: any) => ({
            stockNo: r.stockNo || r.stock_no || '',
            quantity: r.quantity ?? 0,
            unitCost: r.unitCost ?? r.unit_cost ?? 0,
            totalCost: r.totalCost ?? r.total_cost ?? 0,
            uacsObjectCode: r.uacsObjectCode || r.uacs_object_code || '50203010-00',
        })),
        supplyCustodianName: payload.certifiedCorrectByName || payload.supplyCustodianName || payload.certified_by || 'ARSENIO GEM A. GARCILLANOSA',
        accountingStaffName: payload.postedByName || payload.accountingStaffName || 'ACCOUNTING STAFF',
        accountingDate: reportDate,
    };

    const rpciData = {
        entity_name: payload.entityName || payload.entity_name || 'University of Camarines Norte',
        fund_cluster: formatFundClusterDisplay(payload.fundCluster || payload.fund_cluster),
        as_at_date: reportDate,
        accountable_officer: payload.accountableOfficer || payload.accountable_officer || report.recipient || 'Arsenio Gem A. Garcillanosa',
        designation: payload.designation || payload.officerDesignation || 'Supply Custodian',
        station: payload.location || payload.station || report.department || 'SPMO Central',
        items: rawItems.length > 0 ? rawItems.map((it: any) => ({
            article: it.article || it.item_name || it.item || report.itemName || 'Consumable Article',
            description: it.description || it.item_name || it.item || report.itemName || '',
            stock_no: it.stock_no || it.stockNo || it.reference || report.reference || '',
            unit: it.unit || 'pc',
            unit_value: it.unit_cost ?? it.unitCost ?? it.unit_value ?? 0,
            balance_per_card: it.balance_per_card ?? it.quantity ?? it.quantity_per_books ?? 0,
            on_hand_count: it.on_hand_count ?? it.physical_count ?? it.quantity ?? 0,
            shortage_qty: it.shortage_qty ?? '',
            shortage_value: it.shortage_value ?? '',
            remarks: it.remarks || it.status || 'Available',
        })) : [
            {
                article: report.itemName || report.item_name || 'Consumable Article',
                description: report.itemName || report.item_name || '',
                stock_no: report.reference || '',
                unit: 'pc',
                unit_value: report.unitCost || report.unit_cost || 0,
                balance_per_card: report.quantity || 0,
                on_hand_count: report.quantity || 0,
                shortage_qty: '',
                shortage_value: '',
                remarks: report.status || 'Available',
            }
        ],
        committee_chair_name: payload.committee_chair_name || 'INSPECTION COMMITTEE CHAIR',
        head_of_agency_name: payload.head_of_agency_name || 'UNIVERSITY PRESIDENT',
        coa_representative_name: payload.coa_representative_name || 'COA RESIDENT AUDITOR',
    };

    const stockCardData = {
        entity_name: payload.entityName || payload.entity_name || 'University of Camarines Norte',
        fund_cluster: formatFundClusterDisplay(payload.fundCluster || payload.fund_cluster),
        item: report.itemName || report.item_name || payload.item || 'Consumable Supply',
        description: payload.description || '',
        stock_no: payload.stock_no || report.reference || '',
        re_order_point: String(payload.re_order_point || payload.reorder_point || '10'),
        unit_of_measurement: payload.unit || 'Pieces',
        entries: rawItems.length > 0 ? rawItems.map((entry: any) => ({
            date: entry.date || reportDate,
            reference: entry.reference || report.reference || '',
            receipt_qty: entry.receipt_qty ?? entry.receiptQty ?? 0,
            issue_qty: entry.issue_qty ?? entry.issueQty ?? entry.quantity ?? 0,
            issue_office: entry.issue_office ?? entry.issueOffice ?? entry.recipient ?? report.recipient ?? '',
            balance_qty: entry.balance_qty ?? entry.balanceQty ?? 0,
            days_to_consume: entry.days_to_consume ?? entry.remarks ?? '',
        })) : [
            {
                date: reportDate,
                reference: report.reference || '',
                receipt_qty: 0,
                issue_qty: report.quantity || 0,
                issue_office: report.recipient || report.department || '',
                balance_qty: report.quantity || 0,
                days_to_consume: '',
            }
        ],
    };

    const mrData = {
        entityName: payload.entityName || payload.entity_name || 'University of Camarines Norte',
        fundCluster: formatFundClusterDisplay(payload.fundCluster || payload.fund_cluster),
        mrNo: report.reference || payload.mrNo || payload.mr_no || '',
        date: reportDate,
        purpose: payload.purpose || 'Official Institutional Custodianship',
        receivedByName: report.recipient || payload.receivedByName || payload.receivedBy || 'End User',
        receivedByPosition: payload.designation || payload.receivedByPosition || 'Staff',
        receivedByOffice: report.department || payload.receivedByOffice || 'SPMO Central',
        issuedByName: payload.receivedFrom || payload.issuedByName || 'ARSENIO GEM A. GARCILLANOSA',
        issuedByPosition: payload.receivedFromDesignation || payload.issuedByPosition || 'SUPPLY OFFICER III',
        issuedByOffice: 'Supply & Property Management Office',
        items: rawItems.length > 0 ? rawItems.map((m: any) => ({
            quantity: m.quantity ?? 1,
            unit: m.unit || 'unit',
            description: m.description || m.item || m.item_name || report.itemName || 'Property Item',
            propertyNo: m.propertyNo || m.property_no || m.reference || report.reference || '',
            dateAcquired: m.dateAcquired || m.date || reportDate,
            unitValue: m.unitValue ?? m.unit_cost ?? 0,
            totalValue: m.totalValue ?? m.amount ?? 0,
        })) : [
            {
                quantity: report.quantity || 1,
                unit: 'unit',
                description: report.itemName || report.item_name || 'Property Item',
                propertyNo: report.reference || '',
                dateAcquired: reportDate,
                unitValue: report.unitCost || report.unit_cost || 0,
                totalValue: report.amount || 0,
            }
        ],
    };

    return (
        <Modal
            show={show}
            onClose={onClose}
            maxWidth={isLandscape ? '7xl' : '5xl'}
            closeable={true}
        >
            <div className="flex max-h-[92vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl print:max-h-none print:shadow-none print:block print:m-0 print:p-0">
                {/* Institutional header bar (hidden during print) */}
                <div className="h-2 w-full flex-shrink-0 bg-gradient-to-r from-red-950 via-red-900 to-red-950 print:hidden" />

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70 flex-shrink-0 print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-900 rounded border border-red-100">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                Official COA Document Preview
                            </h3>
                            <p className="text-xs text-gray-500 font-mono">
                                Ref: {report.reference || 'N/A'} • Form: {formType}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={handlePrint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                        >
                            <Printer className="w-4 h-4 text-gray-600" />
                            <span>Print</span>
                        </button>

                        <button
                            type="button"
                            onClick={handleExportPDF}
                            disabled={isExportingPDF}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-red-900 hover:bg-red-950 text-white text-xs font-bold uppercase tracking-wider transition-colors border border-red-900 cursor-pointer disabled:opacity-50"
                        >
                            <FileDown className="w-4 h-4 text-amber-300" />
                            <span>{isExportingPDF ? 'Exporting...' : 'Export PDF'}</span>
                        </button>

                        <button
                            type="button"
                            onClick={onClose}
                            className="text-gray-400 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors ml-1"
                            aria-label="Close"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Document Body */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-100/50 print:p-0 print:bg-white print:overflow-visible">
                    <div
                        ref={printContainerRef}
                        className={`mx-auto bg-white shadow-xs p-6 border border-gray-200 print:shadow-none print:border-none print:p-0 printable-form-area ${
                            isLandscape ? 'rpci-container' : 'rsmi-container'
                        }`}
                    >
                        <Suspense
                            fallback={
                                <div className="py-16 text-center text-xs text-gray-500 font-medium">
                                    Rendering official COA form layout...
                                </div>
                            }
                        >
                            {formType === 'RSMI' && <RSMIFormPaper data={rsmiData} />}
                            {formType === 'RPCI' && <RPCIFormPaper data={rpciData} />}
                            {formType === 'STOCK_CARD' && <StockCardFormPaper data={stockCardData} />}
                            {(formType === 'MR' || formType === 'MOR') && <MRFormPaper data={mrData} />}
                        </Suspense>
                    </div>
                </div>
            </div>
        </Modal>
    );
}
