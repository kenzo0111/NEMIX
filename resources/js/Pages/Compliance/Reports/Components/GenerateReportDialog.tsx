import React, { Suspense, lazy, useRef } from 'react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import {
    customSelectStyles,
    MONTH_OPTIONS,
    PERIOD_OPTIONS,
    REPORT_TYPE_OPTIONS,
} from '../constants';
import { ReportDatasetResponse, ReportFormData } from '../types';

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

interface GenerateReportDialogProps {
    show: boolean;
    onClose: () => void;
    formData: ReportFormData;
    updateField: (field: keyof ReportFormData, value: any) => void;
    currentStep: 'configure' | 'preview';
    setCurrentStep: (step: 'configure' | 'preview') => void;
    previewDataset: ReportDatasetResponse | null;
    isLoadingPreview: boolean;
    isSubmitting: boolean;
    onFetchPreview: () => Promise<boolean>;
    onSubmitReport: () => void;
    items?: any[];
    suppliers?: any[];
    issuances?: any[];
    migratedRecords?: any[];
    user?: any;
    publicSettings?: Record<string, any>;
}

export const GenerateReportDialog: React.FC<GenerateReportDialogProps> = ({
    show,
    onClose,
    formData,
    updateField,
    currentStep,
    setCurrentStep,
    previewDataset,
    isLoadingPreview,
    isSubmitting,
    onFetchPreview,
    onSubmitReport,
    items = [],
    suppliers = [],
    issuances = [],
    migratedRecords = [],
    user,
    publicSettings = {},
}) => {
    const reportPaperRef = useRef<HTMLDivElement | null>(null);

    // Dynamic item options for Stock Card
    const stockCardItemOptions = React.useMemo(() => {
        const map = new Map<string, { value: string; label: string }>();
        items.forEach((item: any) => {
            if (item?.name) {
                map.set(item.name.toLowerCase().trim(), {
                    value: item.name,
                    label: `${item.name}${item.sku ? ` (${item.sku})` : ''}`,
                });
            }
        });
        (migratedRecords || []).forEach((m: any) => {
            const name = m.item_name || m.item || m.payload?.item_name || m.payload?.item;
            if (name && !map.has(String(name).toLowerCase().trim())) {
                const stockNo = m.stock_no || m.payload?.stock_no || m.reference;
                map.set(String(name).toLowerCase().trim(), {
                    value: name,
                    label: `${name}${stockNo ? ` (${stockNo})` : ''} [Historical]`,
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
    }, [items, migratedRecords]);

    // End user options for MR
    const endUserOptions = React.useMemo(() => {
        const set = new Set<string>();
        issuances.forEach((i: any) => {
            if (i.recipient) set.add(i.recipient);
        });
        (migratedRecords || []).forEach((m: any) => {
            const name = m.recipient || m.received_by || m.payload?.recipient || m.payload?.received_by;
            if (name) set.add(name);
        });
        return Array.from(set).sort().map((name) => ({ value: name, label: name }));
    }, [issuances, migratedRecords]);

    const isLandscape = formData.type === 'RPCI';

    const renderOfficialPaper = () => {
        if (!previewDataset) return null;

        if (formData.type === 'RSMI' && previewDataset.rsmi) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <RSMIFormPaper
                        data={{
                            entityName: previewDataset.rsmi.entityName || publicSettings['institution_name'] || 'University of Camarines Norte',
                            serialNo: previewDataset.reference || formData.reference,
                            fundCluster: previewDataset.rsmi.fundCluster || '01 - Regular Agency Fund',
                            date: previewDataset.generatedDate,
                            issuedItems: previewDataset.rsmi.issuedItems || [],
                            recapitulationItems: previewDataset.rsmi.recapitulationItems || [],
                            supplyCustodianName: publicSettings['signatories_rsmi_certified_by_name'] || user?.name || 'Supply Custodian',
                            accountingStaffName: publicSettings['signatories_rsmi_posted_by_name'] || 'Accounting Staff',
                            accountingDate: previewDataset.generatedDate,
                        }}
                    />
                </Suspense>
            );
        }

        if (formData.type === 'RPCI' && previewDataset.rpci) {
            return (
                <div className="min-w-[1000px] overflow-x-auto">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <RPCIFormPaper
                            data={{
                                entity_name: previewDataset.rpci.entity_name || publicSettings['institution_name'] || 'University of Camarines Norte',
                                as_at_date: previewDataset.generatedDate,
                                fund_cluster: previewDataset.rpci.fund_cluster || '01 - Regular Agency Fund',
                                inventory_type: formData.title || 'Report on Physical Count of Inventories',
                                accountable_officer: publicSettings['signatories_rpci_accountable_officer_name'] || user?.name || 'Supply Custodian',
                                designation: publicSettings['signatories_rpci_accountable_officer_designation'] || 'Supply Officer III',
                                items: previewDataset.rpci.items || [],
                            }}
                        />
                    </Suspense>
                </div>
            );
        }

        if (formData.type === 'STOCK_CARD' && previewDataset.stockCard) {
            return (
                <div className="min-w-[750px] overflow-x-auto">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <StockCardFormPaper
                            data={{
                                entity_name: previewDataset.stockCard.entity_name || publicSettings['institution_name'] || 'University of Camarines Norte',
                                fund_cluster: previewDataset.stockCard.fund_cluster || '01 - Regular Agency Fund',
                                item: previewDataset.stockCard.item,
                                stock_no: previewDataset.stockCard.stock_no,
                                description: previewDataset.stockCard.description,
                                re_order_point: previewDataset.stockCard.re_order_point,
                                unit_of_measurement: previewDataset.stockCard.unit_of_measurement,
                                entries: previewDataset.stockCard.entries || [],
                            }}
                        />
                    </Suspense>
                </div>
            );
        }

        if ((formData.type === 'MR' || formData.type === 'MOR') && previewDataset.mr) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <MRFormPaper
                        data={{
                            entityName: previewDataset.mr.entityName || publicSettings['institution_name'] || 'University of Camarines Norte',
                            fundCluster: previewDataset.mr.fundCluster || '01 - Regular Agency Fund',
                            mrNo: previewDataset.reference || formData.reference,
                            date: previewDataset.generatedDate,
                            purpose: previewDataset.mr.receivedByOffice || 'Official Business',
                            items: previewDataset.mr.items || [],
                            receivedByName: previewDataset.mr.receivedByName || 'Accountable Officer',
                            receivedByPosition: previewDataset.mr.receivedByPosition || 'Recipient',
                            receivedByOffice: previewDataset.mr.receivedByOffice || 'Official Business',
                            receivedByDate: previewDataset.generatedDate,
                            issuedByName: user?.name || 'ARSENIO GEM A. GARCILLANOSA',
                            issuedByPosition: 'SUPPLY OFFICER III / PROPERTY CUSTODIAN',
                            issuedByOffice: 'Supply & Property Division',
                            issuedByDate: previewDataset.generatedDate,
                        }}
                    />
                </Suspense>
            );
        }

        return null;
    };

    return (
        <Modal
            show={show}
            onClose={() => !isSubmitting && onClose()}
            maxWidth={isLandscape && currentStep === 'preview' ? '7xl' : '4xl'}
            closeable={!isSubmitting}
        >
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">
                            {currentStep === 'configure' ? 'Generate Official COA Report' : `${formData.type} Report Preview`}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {currentStep === 'configure'
                                ? 'Step 1 of 2: Configure reporting criteria and required parameters'
                                : `Step 2 of 2: Authoritative preview for Reference ${previewDataset?.reference || formData.reference || 'Pending'}`}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-200 text-gray-700 font-mono">
                            {currentStep === 'configure' ? 'Step 1: Configure' : 'Step 2: Preview'}
                        </span>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    {currentStep === 'configure' ? (
                        <div className="space-y-5">
                            {/* Report Type */}
                            <div>
                                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                                    Report Type <span className="text-red-700">*</span>
                                </label>
                                <Select
                                    options={REPORT_TYPE_OPTIONS}
                                    value={REPORT_TYPE_OPTIONS.find((opt) => opt.value === formData.type)}
                                    onChange={(opt: any) => updateField('type', opt ? opt.value : 'RSMI')}
                                    styles={customSelectStyles}
                                    isSearchable={false}
                                />
                                {formData.type && (
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        {REPORT_TYPE_OPTIONS.find((opt) => opt.value === formData.type)?.description}
                                    </p>
                                )}
                            </div>

                            {/* Document Title & Reference Preview */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Document Title
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => updateField('title', e.target.value)}
                                        placeholder="e.g. RSMI - Monthly Supplies Issuance"
                                        className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md focus:border-red-900 focus:ring-1 focus:ring-red-900"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Report Generation Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.generatedDate}
                                        onChange={(e) => updateField('generatedDate', e.target.value)}
                                        className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md focus:border-red-900 focus:ring-1 focus:ring-red-900"
                                    />
                                </div>
                            </div>

                            {/* Coverage Period Selection */}
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                                    Coverage Period
                                </label>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                                            Period Format
                                        </label>
                                        <Select
                                            options={PERIOD_OPTIONS}
                                            value={PERIOD_OPTIONS.find((opt) => opt.value === formData.periodType)}
                                            onChange={(opt: any) => updateField('periodType', opt ? opt.value : 'all')}
                                            styles={customSelectStyles}
                                            isSearchable={false}
                                        />
                                    </div>

                                    {formData.periodType === 'specific' && (
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                                                Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => updateField('date', e.target.value)}
                                                className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900"
                                            />
                                        </div>
                                    )}

                                    {formData.periodType === 'monthly' && (
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                                                    Month
                                                </label>
                                                <Select
                                                    options={MONTH_OPTIONS}
                                                    value={MONTH_OPTIONS.find((opt) => opt.value === formData.selectedMonth)}
                                                    onChange={(opt: any) => updateField('selectedMonth', opt ? opt.value : 1)}
                                                    styles={customSelectStyles}
                                                    isSearchable={false}
                                                />
                                            </div>
                                            <div className="w-28">
                                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                                                    Year
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2000"
                                                    max="2100"
                                                    value={formData.selectedYear}
                                                    onChange={(e) => updateField('selectedYear', parseInt(e.target.value, 10))}
                                                    className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.periodType === 'yearly' && (
                                        <div>
                                            <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                                                Fiscal Year
                                            </label>
                                            <input
                                                type="number"
                                                min="2000"
                                                max="2100"
                                                value={formData.selectedYear}
                                                onChange={(e) => updateField('selectedYear', parseInt(e.target.value, 10))}
                                                className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900"
                                            />
                                        </div>
                                    )}

                                    {formData.periodType === 'range' && (
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                                                    From
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={(e) => updateField('startDate', e.target.value)}
                                                    className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-[10px] font-semibold text-gray-500 uppercase mb-1">
                                                    To
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={(e) => updateField('endDate', e.target.value)}
                                                    className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form-Specific Parameters */}
                            {formData.type === 'STOCK_CARD' && (
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Target Item <span className="text-red-700">*</span>
                                    </label>
                                    <Select
                                        options={stockCardItemOptions}
                                        value={
                                            formData.itemName
                                                ? stockCardItemOptions.find((opt) => opt.value === formData.itemName) || {
                                                      value: formData.itemName,
                                                      label: formData.itemName,
                                                  }
                                                : null
                                        }
                                        onChange={(opt: any) => updateField('itemName', opt ? opt.value : '')}
                                        placeholder="Select target item for stock ledger..."
                                        styles={customSelectStyles}
                                        isClearable
                                    />
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        The Stock Card requires a specific item to compute chronological receipts, issuances, and running balances.
                                    </p>
                                </div>
                            )}

                            {formData.type === 'MR' && (
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        End User / Recipient (Optional)
                                    </label>
                                    <Select
                                        options={endUserOptions}
                                        value={formData.endUser ? { value: formData.endUser, label: formData.endUser } : null}
                                        onChange={(opt: any) => updateField('endUser', opt ? opt.value : '')}
                                        placeholder="Search or select accountable officer..."
                                        styles={customSelectStyles}
                                        isClearable
                                    />
                                </div>
                            )}

                            {formData.type === 'RPCI' && (
                                <div>
                                    <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                        Supplier Filter (Optional)
                                    </label>
                                    <Select
                                        options={suppliers.map((s) => ({
                                            value: s.id,
                                            label: s.name || s.company_name,
                                        }))}
                                        value={
                                            formData.supplierId
                                                ? {
                                                      value: formData.supplierId,
                                                      label: formData.supplierName || 'Selected Supplier',
                                                  }
                                                : null
                                        }
                                        onChange={(opt: any) => {
                                            updateField('supplierId', opt ? opt.value : '');
                                            updateField('supplierName', opt ? opt.label : '');
                                        }}
                                        placeholder="All suppliers (or select to filter)..."
                                        styles={customSelectStyles}
                                        isClearable
                                    />
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary metrics header */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                                <div className="space-y-0.5">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">
                                        Authoritative Dataset Summary
                                    </span>
                                    <p className="font-semibold text-gray-800">
                                        {previewDataset?.summary?.recordCount ?? 0} records identified
                                        {previewDataset?.summary?.totalUnits !== undefined &&
                                            ` • ${previewDataset.summary.totalUnits} total units`}
                                        {previewDataset?.summary?.totalAmount !== undefined &&
                                            ` • ₱${Number(previewDataset.summary.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                                    </p>
                                </div>

                                <div className="flex items-center gap-3 font-mono text-[11px]">
                                    <span className="text-gray-500">
                                        Ref: <strong>{previewDataset?.reference || formData.reference}</strong>
                                    </span>
                                    <span className="text-gray-500">
                                        Coverage: <strong>{previewDataset?.coverageLabel}</strong>
                                    </span>
                                </div>
                            </div>

                            {/* Official COA Paper Preview */}
                            <div
                                ref={reportPaperRef}
                                className="bg-gray-100 p-6 rounded-lg border border-gray-200 overflow-x-auto print:p-0 print:border-none print:bg-white"
                            >
                                {renderOfficialPaper()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                    {currentStep === 'preview' ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep('configure')}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            &larr; Back to Configure
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            Cancel
                        </button>
                    )}

                    <div className="flex items-center gap-2">
                        {currentStep === 'configure' ? (
                            <button
                                type="button"
                                onClick={onFetchPreview}
                                disabled={
                                    isLoadingPreview ||
                                    !formData.type ||
                                    (formData.type === 'STOCK_CARD' && !formData.itemName)
                                }
                                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 disabled:opacity-50 transition-colors shadow-xs"
                            >
                                {isLoadingPreview ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Loading Authoritative Preview...</span>
                                    </>
                                ) : (
                                    <>
                                        <span>Preview Report</span>
                                        <span>&rarr;</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onSubmitReport}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 disabled:opacity-50 transition-colors shadow-xs"
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                        </svg>
                                        <span>Recording in Registry...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                        </svg>
                                        <span>Save & Record Document</span>
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};
