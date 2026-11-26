import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import React, { Suspense, lazy, useRef, useEffect } from 'react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import { FileText, Eye, X, ClipboardCheck, Loader2, Printer, Check, ArrowRight } from 'lucide-react';
import {
    customSelectStyles,
    MONTH_OPTIONS,
    PERIOD_OPTIONS,
    REPORT_TYPE_OPTIONS,
} from '../constants';
import { ReportDatasetResponse, ReportFormData } from '../types';
import { normalizeReportPaperData } from '../utils/reportDataNormalizer';
import {
    triggerCompliancePrint,
    applyCompliancePrintStyle,
    getCompliancePrintConfig,
} from '../utils/printConfig';

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
    endUsers?: string[];
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
    endUsers = [],
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
        endUsers.forEach((name) => {
            if (name) set.add(name);
        });
        issuances.forEach((i: any) => {
            if (i.recipient) set.add(i.recipient);
        });
        (migratedRecords || []).forEach((m: any) => {
            const name = m.recipient || m.received_by || m.payload?.recipient || m.payload?.received_by;
            if (name) set.add(name);
        });
        return Array.from(set).sort().map((name) => ({ value: name, label: name }));
    }, [endUsers, issuances, migratedRecords]);

    const isLandscape = formData.type === 'RPCI';

    useEffect(() => {
        if (!show || currentStep !== 'preview') return;

        const config = getCompliancePrintConfig(formData.type);

        const handleBeforePrint = () => {
            applyCompliancePrintStyle(config);
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
    }, [show, currentStep, formData.type]);

    const handlePrintPreview = () => {
        triggerCompliancePrint(formData.type);
    };

    const renderOfficialPaper = () => {
        if (!previewDataset) return null;

        const normalized = normalizeReportPaperData(previewDataset, user, publicSettings, formData);
        if (!normalized) return null;

        if (formData.type === 'RSMI') {
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

        if (formData.type === 'RPCI' && normalized.rpciData) {
            return (
                <div className="min-w-[1000px] print:min-w-0 overflow-x-auto print:overflow-visible">
                    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
                        <RPCIFormPaper data={normalized.rpciData} />
                    </Suspense>
                </div>
            );
        }

        if (formData.type === 'STOCK_CARD' && normalized.stockCardData) {
            return (
                <div className="min-w-[750px] print:min-w-0 overflow-x-auto print:overflow-visible">
                    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
                        <StockCardFormPaper data={normalized.stockCardData} />
                    </Suspense>
                </div>
            );
        }

        if ((formData.type === 'MR' || formData.type === 'MOR') && normalized.mrData) {
            return (
                <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-300">Loading form template...</div>}>
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
            ariaLabel="Generate Official Report"
        >
            {/* Thin Maroon Accent Top Line */}
            <div className="h-1.5 bg-gradient-to-r from-red-950 via-red-900 to-amber-600 w-full shrink-0 print:hidden compliance-print-hide" />

            {/* Modal Header */}
            <DialogHeader className="shrink-0 print:hidden compliance-print-hide">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100/80 dark:border-red-800/50 flex items-center justify-center text-red-900 dark:text-red-300 shadow-sm shrink-0">
                            {currentStep === 'configure' ? (
                                <FileText className="w-5 h-5" />
                            ) : (
                                <Eye className="w-5 h-5" />
                            )}
                        </div>
                        <div className="min-w-0">
                            <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                                {currentStep === 'configure' ? 'Generate Official COA Report' : `${formData.type} Report Preview`}
                            </h3>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 break-words">
                                {currentStep === 'configure'
                                    ? 'Step 1 of 2: Configure reporting criteria and required parameters'
                                    : `Step 2 of 2: Authoritative preview for Reference ${previewDataset?.reference || formData.reference || 'Pending'}`}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-2">
                        {/* 2-Step Interactive Badge */}
                        <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200/80 dark:border-slate-700">
                            <span
                                className={`px-2.5 py-1 rounded-md text-sm font-semibold transition-all ${currentStep === 'configure'
    ? "bg-white dark:bg-slate-900 text-red-900 dark:text-red-300 shadow-sm font-semibold" : "text-slate-500 dark:text-slate-400"}`}
                            >
                                1. Configure
                            </span>
                            <span
                                className={`px-2.5 py-1 rounded-md text-sm font-semibold transition-all ${currentStep === 'preview'
    ? "bg-white dark:bg-slate-900 text-red-900 dark:text-red-300 shadow-sm font-semibold" : "text-slate-500 dark:text-slate-400"}`}
                            >
                                2. Preview
                            </span>
                        </div>

                        <Button variant="ghost" size="icon"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className=""
                            aria-label="Close modal"
                        >
                            <X className="w-5 h-5" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Modal Content */}
                <DialogBody className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50/40 dark:bg-slate-950/60">
                    {currentStep === 'configure' ? (
                        <div className="space-y-4">
                            {/* Card 1: Report Specification & Document Metadata */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-4">
                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-semibold normal-case tracking-normal text-red-950 dark:text-red-300 tabular-nums flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                        1. Report Specification
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">COA Compliant Template</span>
                                </div>

                                {/* Report Type */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                        Report Type <span className="text-red-700 dark:text-red-300">*</span>
                                    </label>
                                    <Select
                                        options={REPORT_TYPE_OPTIONS}
                                        value={REPORT_TYPE_OPTIONS.find((opt) => opt.value === formData.type)}
                                        onChange={(opt: any) => updateField('type', opt ? opt.value : 'RSMI')}
                                        styles={customSelectStyles}
                                        isSearchable={false}
                                    />
                                    {formData.type && (
                                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed bg-slate-50/80 dark:bg-slate-800/80 p-2 rounded-md border border-slate-100 dark:border-slate-700">
                                            {REPORT_TYPE_OPTIONS.find((opt) => opt.value === formData.type)?.description}
                                        </p>
                                    )}
                                </div>

                                {/* Document Title & Date */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Document Title
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => updateField('title', e.target.value)}
                                            placeholder="e.g. RSMI - Monthly Supplies Issuance"
                                            className="ui-field w-full h-9 text-sm px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm hover:border-slate-400 transition-colors"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                            Report Generation Date
                                        </label>
                                        <input
                                            type="date"
                                            value={formData.generatedDate}
                                            onChange={(e) => updateField('generatedDate', e.target.value)}
                                            className="ui-field w-full h-9 text-sm px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm hover:border-slate-400 transition-colors"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Coverage Period Selection */}
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-3.5 shadow-sm">
                                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
                                    <span className="text-sm font-semibold normal-case tracking-normal text-red-950 dark:text-red-300 tabular-nums flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                        2. Audit Coverage Period
                                    </span>
                                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Date Filtering Mode</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                                            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                Audit Date
                                            </label>
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => updateField('date', e.target.value)}
                                                className="ui-field w-full h-9 text-sm px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm hover:border-slate-400 transition-colors"
                                            />
                                        </div>
                                    )}

                                    {formData.periodType === 'monthly' && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                                            <div className="flex-1 min-w-0">
                                                <label htmlFor="report-month-select" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    Month
                                                </label>
                                                <Select
                                                    inputId="report-month-select"
                                                    options={MONTH_OPTIONS}
                                                    value={MONTH_OPTIONS.find((opt) => opt.value === formData.selectedMonth)}
                                                    onChange={(opt: any) => updateField('selectedMonth', opt ? opt.value : 1)}
                                                    styles={customSelectStyles}
                                                    isSearchable={false}
                                                />
                                            </div>
                                            <div className="w-full sm:w-28">
                                                <label htmlFor="report-monthly-year" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    Year
                                                </label>
                                                <input
                                                    id="report-monthly-year"
                                                    type="number"
                                                    min="2000"
                                                    max="2100"
                                                    value={formData.selectedYear}
                                                    onChange={(e) => updateField('selectedYear', parseInt(e.target.value, 10))}
                                                    className="ui-field w-full tabular-nums"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {formData.periodType === 'yearly' && (
                                        <div>
                                            <label htmlFor="report-fiscal-year" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                Fiscal Year
                                            </label>
                                            <input
                                                id="report-fiscal-year"
                                                type="number"
                                                min="2000"
                                                max="2100"
                                                value={formData.selectedYear}
                                                onChange={(e) => updateField('selectedYear', parseInt(e.target.value, 10))}
                                                className="ui-field w-full tabular-nums"
                                            />
                                        </div>
                                    )}

                                    {formData.periodType === 'range' && (
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
                                            <div className="flex-1 min-w-0">
                                                <label htmlFor="report-start-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    From
                                                </label>
                                                <input
                                                    id="report-start-date"
                                                    type="date"
                                                    value={formData.startDate}
                                                    onChange={(e) => updateField('startDate', e.target.value)}
                                                    className="ui-field w-full tabular-nums"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <label htmlFor="report-end-date" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                                    To
                                                </label>
                                                <input
                                                    id="report-end-date"
                                                    type="date"
                                                    value={formData.endDate}
                                                    onChange={(e) => updateField('endDate', e.target.value)}
                                                    className="ui-field w-full h-9 text-sm px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 tabular-nums focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm hover:border-slate-400 transition-colors"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Card 3: Form-Specific Parameters (Conditional) */}
                            {formData.type === 'STOCK_CARD' && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 shadow-sm">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-sm font-semibold normal-case tracking-normal text-red-950 dark:text-red-300 tabular-nums flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                            3. Ledger Item Specification
                                        </span>
                                        <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Required for Stock Card</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            Target Item <span className="text-red-700 dark:text-red-300">*</span>
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
                                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1.5">
                                            The Stock Card requires a specific item to compute chronological receipts, issuances, and running balances.
                                        </p>
                                    </div>
                                </div>
                            )}

                            {formData.type === 'MR' && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 shadow-sm">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-sm font-semibold normal-case tracking-normal text-red-950 dark:text-red-300 tabular-nums flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                            3. Property Recipient Filter
                                        </span>
                                        <span className="text-sm font-medium text-red-700 dark:text-red-300">Required for MR</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                            End User / Accountable Officer
                                        </label>
                                        <Select
                                            options={endUserOptions}
                                            value={formData.endUser ? { value: formData.endUser, label: formData.endUser } : null}
                                            onChange={(opt: any) => updateField('endUser', opt ? opt.value : '')}
                                            placeholder="Select the accountable officer..."
                                            styles={customSelectStyles}
                                            isClearable
                                        />
                                    </div>
                                </div>
                            )}

                            {formData.type === 'RPCI' && (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 space-y-2 shadow-sm">
                                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-sm font-semibold normal-case tracking-normal text-red-950 dark:text-red-300 tabular-nums flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                            3. Supplier Filter
                                        </span>
                                        <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Optional</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                        <div className="space-y-4 print:space-y-0">
                            {/* Summary metrics header banner */}
                            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 border-l-4 border-l-red-900 rounded-xl shadow-sm text-sm print:hidden compliance-print-hide">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 flex items-center justify-center shrink-0">
                                        <ClipboardCheck className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal tabular-nums block">
                                            Authoritative Dataset Summary
                                        </span>
                                        <p className="font-semibold text-slate-900 dark:text-slate-100 mt-0.5">
                                            <span className="font-semibold text-red-950 dark:text-red-300">{previewDataset?.summary?.recordCount ?? 0}</span> records identified
                                            {previewDataset?.summary?.totalUnits !== undefined && (
                                                <> • <span className="font-semibold text-slate-800 dark:text-slate-200">{previewDataset.summary.totalUnits}</span> total units</>
                                            )}
                                            {previewDataset?.summary?.totalAmount !== undefined && (
                                                <> • <span className="font-semibold text-emerald-800 dark:text-emerald-400 tabular-nums">₱{Number(previewDataset.summary.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span></>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 tabular-nums text-sm">
                                    <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                                        Ref: <strong className="text-slate-900 dark:text-slate-100">{previewDataset?.reference || formData.reference}</strong>
                                    </div>
                                    <div className="px-2.5 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-600 dark:text-slate-300">
                                        Coverage: <strong className="text-slate-900 dark:text-slate-100">{previewDataset?.coverageLabel}</strong>
                                    </div>
                                </div>
                            </div>

                            {formData.type === 'MR' && !previewDataset?.mr?.items?.length && (
                                <p className="leading-relaxed rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 print:hidden dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                                    No issued items were found for this officer and coverage period. Check the selected officer and dates before recording the MR.
                                </p>
                            )}

                            {/* Official COA Paper Preview in realistic workspace canvas */}
                            <div
                                ref={reportPaperRef}
                                className="bg-slate-100/90 dark:bg-slate-950 p-4 sm:p-7 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto shadow-inner flex justify-center print:p-0 print:border-none print:bg-white print:block print:w-full print:shadow-none print:m-0 print:overflow-visible"
                            >
                                <div className="shadow-md rounded-sm border border-slate-200/60 bg-white text-slate-900 print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:w-full print:block print:overflow-visible dark:text-slate-300 dark:bg-slate-900">
                                    <div className="compliance-print-area">
                                        {renderOfficialPaper()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </DialogBody>

                {/* Modal Footer */}
                <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0 print:hidden compliance-print-hide">
                    {currentStep === 'preview' ? (
                        <Button variant="secondary"
                            type="button"
                            onClick={() => setCurrentStep('configure')}
                            disabled={isSubmitting}
                            className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                        >
                            <span>&larr;</span>
                            <span>Back to Configure</span>
                        </Button>
                    ) : (
                        <Button variant="secondary"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="w-full sm:w-auto text-center"
                        >
                            Cancel
                        </Button>
                    )}

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {currentStep === 'configure' ? (
                            <Button variant="primary"
                                type="button"
                                onClick={onFetchPreview}
                                disabled={
                                    isLoadingPreview ||
                                    !formData.type ||
                                    (formData.type === 'STOCK_CARD' && !formData.itemName) ||
                                    (formData.type === 'MR' && !formData.endUser)
                                }
                                loading={isLoadingPreview}
                                className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                            >
                                <span>{isLoadingPreview ? 'Loading Authoritative Preview...' : 'Preview Official Report'}</span>
                                {!isLoadingPreview && <ArrowRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                            </Button>
                        ) : (
                            <>
                                <Button variant="secondary"
                                    type="button"
                                    onClick={handlePrintPreview}
                                    disabled={isSubmitting || (formData.type === 'MR' && !previewDataset?.mr?.items?.length)}
                                    className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                                >
                                    <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300 shrink-0" />
                                    <span>Print Preview</span>
                                </Button>

                                <Button variant="primary"
                                    type="button"
                                    onClick={onSubmitReport}
                                    disabled={formData.type === 'MR' && !previewDataset?.mr?.items?.length}
                                    loading={isSubmitting}
                                    className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                                >
                                    {!isSubmitting && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                                    <span>{isSubmitting ? 'Recording in Registry...' : 'Save & Record Document'}</span>
                                </Button>
                            </>
                        )}
                    </div>
                </DialogFooter>
        </Modal>
    );
};
