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
import { normalizeReportPaperData } from '../utils/reportDataNormalizer';

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

        const normalized = normalizeReportPaperData(previewDataset, user, publicSettings, formData);
        if (!normalized) return null;

        if (formData.type === 'RSMI' && normalized.rsmiData) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <RSMIFormPaper data={normalized.rsmiData} />
                </Suspense>
            );
        }

        if (formData.type === 'RPCI' && normalized.rpciData) {
            return (
                <div className="min-w-[1000px] overflow-x-auto">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <RPCIFormPaper data={normalized.rpciData} />
                    </Suspense>
                </div>
            );
        }

        if (formData.type === 'STOCK_CARD' && normalized.stockCardData) {
            return (
                <div className="min-w-[750px] overflow-x-auto">
                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                        <StockCardFormPaper data={normalized.stockCardData} />
                    </Suspense>
                </div>
            );
        }

        if ((formData.type === 'MR' || formData.type === 'MOR') && normalized.mrData) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                    <MRFormPaper data={normalized.mrData} />
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
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200">
                {/* Thin Maroon Accent Top Line */}
                <div className="h-1 bg-gradient-to-r from-red-900 via-red-800 to-amber-600 w-full shrink-0" />

                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200/80 bg-gradient-to-b from-gray-50/90 to-white shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100/80 flex items-center justify-center text-red-900 shadow-2xs shrink-0">
                            {currentStep === 'configure' ? (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                {currentStep === 'configure' ? 'Generate Official COA Report' : `${formData.type} Report Preview`}
                            </h3>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                {currentStep === 'configure'
                                    ? 'Step 1 of 2: Configure reporting criteria and required parameters'
                                    : `Step 2 of 2: Authoritative preview for Reference ${previewDataset?.reference || formData.reference || 'Pending'}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {/* 2-Step Interactive Badge */}
                        <div className="hidden sm:flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200/80">
                            <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    currentStep === 'configure'
                                        ? 'bg-white text-red-900 shadow-2xs font-bold'
                                        : 'text-gray-500'
                                }`}
                            >
                                1. Configure
                            </span>
                            <span
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                                    currentStep === 'preview'
                                        ? 'bg-white text-red-900 shadow-2xs font-bold'
                                        : 'text-gray-400'
                                }`}
                            >
                                2. Preview
                            </span>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                            aria-label="Close modal"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Content */}
                <div className="p-6 overflow-y-auto flex-1 bg-gray-50/40">
                    {currentStep === 'configure' ? (
                        <div className="space-y-4">
                            {/* Card 1: Report Specification & Document Metadata */}
                            <div className="bg-white rounded-xl border border-gray-200/80 p-4.5 shadow-2xs space-y-4">
                                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 font-mono flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                        1. Report Specification
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-400">COA Compliant Template</span>
                                </div>

                                {/* Report Type */}
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
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
                                        <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed bg-gray-50/80 p-2 rounded-md border border-gray-100">
                                            {REPORT_TYPE_OPTIONS.find((opt) => opt.value === formData.type)?.description}
                                        </p>
                                    )}
                                </div>

                                {/* Document Title & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Document Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => updateField('title', e.target.value)}
                                            placeholder="e.g. RSMI - Monthly Supplies Issuance"
                                            className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            Report Generation Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.generatedDate}
                                            onChange={(e) => updateField('generatedDate', e.target.value)}
                                            className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white font-mono focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Coverage Period Selection */}
                            <div className="bg-white rounded-xl border border-gray-200/80 p-4.5 space-y-3.5 shadow-2xs">
                                <div className="flex items-center justify-between pb-2.5 border-b border-gray-100">
                                    <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 font-mono flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                        2. Audit Coverage Period
                                    </span>
                                    <span className="text-[10px] font-medium text-gray-400">Date Filtering Mode</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Audit Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => updateField('date', e.target.value)}
                                                className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white font-mono focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                            />
                                        </div>
                                    )}

                                    {formData.periodType === 'monthly' && (
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                    Year
                                                </label>
                                                <input
                                                    type="number"
                                                    min="2000"
                                                    max="2100"
                                                    value={formData.selectedYear}
                                                    onChange={(e) => updateField('selectedYear', parseInt(e.target.value, 10))}
                                                    className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white font-mono focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.periodType === 'yearly' && (
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                Fiscal Year
                                            </label>
                                            <input
                                                type="number"
                                                min="2000"
                                                max="2100"
                                                value={formData.selectedYear}
                                                onChange={(e) => updateField('selectedYear', parseInt(e.target.value, 10))}
                                                className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white font-mono focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                            />
                                        </div>
                                    )}

                                    {formData.periodType === 'range' && (
                                        <div className="flex items-center gap-2 w-full">
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                    From
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={(e) => updateField('startDate', e.target.value)}
                                                    className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white font-mono focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                                    To
                                                </label>
                                                <input
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={(e) => updateField('endDate', e.target.value)}
                                                    className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white font-mono focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Form-Specific Parameters (Conditional) */}
                            {formData.type === 'STOCK_CARD' && (
                                <div className="bg-white rounded-xl border border-gray-200/80 p-4.5 space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 font-mono flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                            3. Ledger Item Specification
                                        </span>
                                        <span className="text-[10px] font-medium text-amber-700">Required for Stock Card</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
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
                                            placeholder="Search and select target item for stock ledger..."
                                            styles={customSelectStyles}
                                            isClearable
                                        />
                                        <p className="text-[11px] text-gray-500 mt-1.5">
                                            The Stock Card requires a specific item to compute chronological receipts, issuances, and running balances.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {formData.type === 'MR' && (
                                <div className="bg-white rounded-xl border border-gray-200/80 p-4.5 space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 font-mono flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                            3. Property Recipient Filter
                                        </span>
                                        <span className="text-[10px] font-medium text-gray-400">Optional</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            End User / Accountable Officer
                                        </label>
                                        <Select
                                            options={endUserOptions}
                                            value={formData.endUser ? { value: formData.endUser, label: formData.endUser } : null}
                                            onChange={(opt: any) => updateField('endUser', opt ? opt.value : '')}
                                            placeholder="All accountable officers (or select to filter)..."
                                            styles={customSelectStyles}
                                            isClearable
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.type === 'RPCI' && (
                                <div className="bg-white rounded-xl border border-gray-200/80 p-4.5 space-y-2 shadow-2xs">
                                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                                        <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 font-mono flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                            3. Supplier Filter
                                        </span>
                                        <span className="text-[10px] font-medium text-gray-400">Optional</span>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                            Supplier
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
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Summary metrics header banner */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white border border-gray-200/80 border-l-4 border-l-red-900 rounded-xl shadow-2xs text-xs">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-900 flex items-center justify-center shrink-0">
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono block">
                                            Authoritative Dataset Summary
                                        </span>
                                        <p className="font-semibold text-gray-900 mt-0.5">
                                            <span className="font-bold text-red-950">{previewDataset?.summary?.recordCount ?? 0}</span> records identified
                                            {previewDataset?.summary?.totalUnits !== undefined && (
                                                <> • <span className="font-bold text-gray-800">{previewDataset.summary.totalUnits}</span> total units</>
                                            )}
                                            {previewDataset?.summary?.totalAmount !== undefined && (
                                                <> • <span className="font-bold text-emerald-800 font-mono">₱{Number(previewDataset.summary.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 font-mono text-[11px]">
                                    <div className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                                        Ref: <strong className="text-gray-900">{previewDataset?.reference || formData.reference}</strong>
                                    </div>
                                    <div className="px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-md text-gray-600">
                                        Coverage: <strong className="text-gray-900">{previewDataset?.coverageLabel}</strong>
                                    </div>
                                </div>
                            </div>

                            {/* Official COA Paper Preview in realistic workspace canvas */}
                            <div
                                ref={reportPaperRef}
                                className="bg-slate-100/90 p-4 sm:p-7 rounded-xl border border-slate-200/80 overflow-x-auto shadow-inner flex justify-center print:p-0 print:border-none print:bg-white"
                            >
                                <div className="shadow-md rounded-sm border border-gray-200/60 bg-white">
                                    {renderOfficialPaper()}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200/80 shrink-0">
                    {currentStep === 'preview' ? (
                        <button
                            type="button"
                            onClick={() => setCurrentStep('configure')}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer"
                        >
                            <span>&larr;</span>
                            <span>Back to Configure</span>
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer"
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
                                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 disabled:opacity-50 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
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
                                        <span>Preview Official Report</span>
                                        <span>&rarr;</span>
                                    </>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={onSubmitReport}
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 disabled:opacity-50 transition-all shadow-xs active:scale-[0.99] cursor-pointer"
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
