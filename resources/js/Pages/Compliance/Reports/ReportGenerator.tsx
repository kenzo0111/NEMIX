import React, { useState, useEffect, useMemo } from 'react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import { router, usePage } from '@inertiajs/react';
import { FileText, Eye, Check, X, Calendar, Layers, User, Award, Shield } from 'lucide-react';
import { ComplianceReportType, generateReportReference, formatFundClusterDisplay } from './types';

interface ReportGeneratorProps {
    show: boolean;
    reports?: any[];
    items?: any[];
    issuances?: any[];
    suppliers?: any[];
    migratedRecords?: any[];
    onClose: () => void;
    onPreview: (previewData: any) => void;
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
}

const selectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        padding: '2px',
        fontSize: '0.875rem',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        '&:hover': { borderColor: '#7f1d1d' },
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
        color: state.isSelected ? '#ffffff' : '#111827',
        cursor: 'pointer',
        fontSize: '0.875rem',
    }),
    menu: (provided: any) => ({ ...provided, zIndex: 60 }),
};

export default function ReportGenerator({
    show,
    reports = [],
    items = [],
    issuances = [],
    suppliers = [],
    migratedRecords = [],
    onClose,
    onPreview,
    onSuccess,
    onError,
}: ReportGeneratorProps) {
    const pageProps = usePage().props as any;
    const publicSettings = pageProps.system?.settings || {};

    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const [formType, setFormType] = useState<ComplianceReportType>('RSMI');
    const [reference, setReference] = useState('');
    const [entityName, setEntityName] = useState(
        publicSettings['institution_name'] || 'University of Camarines Norte'
    );
    const [fundCluster, setFundCluster] = useState('01 - Regular Agency Fund');
    const [reportDate, setReportDate] = useState(todayStr);
    const [selectedMonth, setSelectedMonth] = useState(currentMonth);
    const [selectedYear, setSelectedYear] = useState(currentYear);
    const [selectedItemName, setSelectedItemName] = useState('');
    const [accountableOfficer, setAccountableOfficer] = useState(
        publicSettings['signatories_ris_approved_by_name'] || 'ARSENIO GEM A. GARCILLANOSA'
    );
    const [officerDesignation, setOfficerDesignation] = useState(
        publicSettings['signatories_ris_approved_by_designation'] || 'SUPPLY OFFICER III'
    );
    const [certifiedBy, setCertifiedBy] = useState(
        publicSettings['signatories_ris_approved_by_name'] || 'ARSENIO GEM A. GARCILLANOSA'
    );
    const [certifiedByDesignation, setCertifiedByDesignation] = useState(
        publicSettings['signatories_ris_approved_by_designation'] || 'SUPPLY OFFICER III'
    );

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Auto-populate reference on show or formType change
    useEffect(() => {
        if (show) {
            const nextRef = generateReportReference(todayStr, reports, migratedRecords);
            setReference(nextRef);
        }
    }, [show, formType, reports, migratedRecords]);

    const formTypeOptions = [
        { value: 'RSMI', label: 'RSMI — Report of Supplies and Materials Issued (Appendix 64)' },
        { value: 'RPCI', label: 'RPCI — Physical Count of Inventories (Appendix 66)' },
        { value: 'STOCK_CARD', label: 'Stock Card — Continuous Ledger (Appendix 58)' },
        { value: 'MR', label: 'MR — Memorandum Receipt for Property (Appendix 63)' },
    ];

    const monthOptions = [
        { value: 1, label: 'January' },
        { value: 2, label: 'February' },
        { value: 3, label: 'March' },
        { value: 4, label: 'April' },
        { value: 5, label: 'May' },
        { value: 6, label: 'June' },
        { value: 7, label: 'July' },
        { value: 8, label: 'August' },
        { value: 9, label: 'September' },
        { value: 10, label: 'October' },
        { value: 11, label: 'November' },
        { value: 12, label: 'December' },
    ];

    const itemOptions = useMemo(() => {
        const unique = new Map<string, string>();
        items.forEach((item: any) => {
            if (item.name) unique.set(item.name, `${item.name} (${item.sku || 'No SKU'})`);
        });
        return Array.from(unique.entries()).map(([name, label]) => ({
            value: name,
            label,
        }));
    }, [items]);

    const buildGeneratedPayload = () => {
        let itemsData: any[] = [];

        if (formType === 'RSMI') {
            // Filter issuances by selected month/year
            const monthIssuances = issuances.filter((issue: any) => {
                if (!issue.date) return false;
                const d = new Date(issue.date);
                return d.getMonth() + 1 === Number(selectedMonth) && d.getFullYear() === Number(selectedYear);
            });

            itemsData = monthIssuances.map((iss: any) => ({
                risNo: iss.sku || reference,
                responsibilityCenterCode: iss.department || 'SPMO',
                stockNo: iss.sku || '',
                item: iss.item || 'Consumable Supply',
                unit: 'pc',
                quantityIssued: iss.quantity || 1,
                unitCost: iss.unit_cost || 0,
                amount: iss.amount || 0,
            }));

            if (itemsData.length === 0) {
                // Add fallback item row if month has no issuances
                itemsData = [
                    {
                        risNo: reference,
                        responsibilityCenterCode: 'SPMO',
                        stockNo: 'STK-001',
                        item: 'Consumable Office Supplies',
                        unit: 'pc',
                        quantityIssued: 1,
                        unitCost: 0,
                        amount: 0,
                    },
                ];
            }
        } else if (formType === 'RPCI') {
            itemsData = items.map((item: any) => ({
                article: item.name,
                description: item.description || item.name,
                stockNo: item.sku || '',
                unit: item.unit_of_issue || 'pc',
                unitCost: item.unit_cost || 0,
                quantityPerBooks: item.stock || 0,
                physicalCount: item.stock || 0,
                shortageQty: '',
                shortageValue: '',
                remarks: item.status || 'Available',
            }));
        } else if (formType === 'STOCK_CARD') {
            const targetItem = items.find((i) => i.name === selectedItemName) || items[0];
            const itemIssuances = issuances.filter((i) => i.item === selectedItemName);

            itemsData = itemIssuances.map((iss: any) => ({
                date: iss.date || reportDate,
                reference: iss.sku || reference,
                receiptQty: 0,
                issueQty: iss.quantity || 0,
                issueOffice: iss.recipient || iss.department || '',
                balanceQty: targetItem?.stock || 0,
                remarks: iss.purpose || '',
            }));
        } else {
            // MR
            itemsData = [
                {
                    quantity: 1,
                    unit: 'unit',
                    description: selectedItemName || 'Consumable / Property Item',
                    propertyNo: reference,
                    dateAcquired: reportDate,
                    amount: 0,
                },
            ];
        }

        return {
            type: formType,
            reference,
            title: `${formType} - ${reference}`,
            status: 'approved',
            date: reportDate,
            itemName: selectedItemName || (itemsData[0]?.item || itemsData[0]?.article || ''),
            recipient: accountableOfficer,
            department: 'SPMO Central',
            itemsData,
            payload: {
                entityName,
                fundCluster: formatFundClusterDisplay(fundCluster),
                serialNo: reference,
                date: reportDate,
                selectedMonth,
                selectedYear,
                accountableOfficer,
                designation: officerDesignation,
                certifiedCorrectByName: certifiedBy,
                certifiedCorrectByDesignation: certifiedByDesignation,
                postedByName: 'ACCOUNTING STAFF',
                postedByDesignation: 'POSTING CLERK',
                items: itemsData,
            },
        };
    };

    const handlePreviewClick = () => {
        const payload = buildGeneratedPayload();
        onPreview(payload);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setErrors({});

        if (!reference.trim()) {
            setErrors({ reference: 'Reference number is required.' });
            return;
        }

        if (formType === 'STOCK_CARD' && !selectedItemName) {
            setErrors({ item: 'Please select an inventory item for the Stock Card.' });
            return;
        }

        setIsSubmitting(true);
        const payload = buildGeneratedPayload();

        router.post(
            route('compliance.reports.store'),
            {
                type: payload.type,
                reference: payload.reference,
                title: payload.title,
                status: payload.status,
                itemName: payload.itemName,
                supplierId: '',
                supplierName: '',
                endUser: accountableOfficer,
                generatedDate: todayStr,
                periodType: 'specific',
                date: reportDate,
                startDate: '',
                endDate: '',
                selectedMonth,
                selectedYear,
                payload: payload.payload,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    onClose();
                    if (onSuccess) onSuccess('Compliance report generated and saved successfully.');
                },
                onError: (err) => {
                    setIsSubmitting(false);
                    setErrors(err);
                    if (onError) onError('Failed to generate report. Please check required fields.');
                },
            }
        );
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="3xl" closeable={!isSubmitting}>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-2xl">
                {/* Institutional header accent */}
                <div className="h-2 w-full bg-red-950" />

                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50/70">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-900 rounded border border-red-100">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                Generate Official COA Compliance Report
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Configure parameters to compile official government inventory documents
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* 1. Form Type Selection */}
                    <div>
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1.5">
                            Select Official COA Form Template <span className="text-red-600">*</span>
                        </label>
                        <Select
                            styles={selectStyles}
                            options={formTypeOptions}
                            value={formTypeOptions.find((o) => o.value === formType)}
                            onChange={(opt) => opt && setFormType(opt.value as ComplianceReportType)}
                            isSearchable={false}
                        />
                    </div>

                    {/* 2. Reference & Dates Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                Reference / Serial No. <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="text"
                                value={reference}
                                onChange={(e) => setReference(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-red-900 focus:border-red-900"
                                placeholder="YYYY-MM-0001"
                            />
                            {errors.reference && (
                                <p className="text-xs text-red-600 mt-1">{errors.reference}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                Official Document Date <span className="text-red-600">*</span>
                            </label>
                            <input
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-red-900 focus:border-red-900"
                            />
                        </div>
                    </div>

                    {/* Form-specific inputs */}
                    {formType === 'RSMI' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-lg bg-red-50/50 border border-red-100">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                    Target Month
                                </label>
                                <Select
                                    styles={selectStyles}
                                    options={monthOptions}
                                    value={monthOptions.find((m) => m.value === selectedMonth)}
                                    onChange={(opt) => opt && setSelectedMonth(opt.value)}
                                    isSearchable={false}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                    Target Year
                                </label>
                                <input
                                    type="number"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                    className="w-full px-3 py-2 text-xs font-mono border border-gray-300 rounded-md focus:ring-1 focus:ring-red-900 focus:border-red-900"
                                />
                            </div>
                        </div>
                    )}

                    {formType === 'STOCK_CARD' && (
                        <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                    Select Inventory Item <span className="text-red-600">*</span>
                                </label>
                                <Select
                                    styles={selectStyles}
                                    options={itemOptions}
                                    value={itemOptions.find((i) => i.value === selectedItemName)}
                                    onChange={(opt) => opt && setSelectedItemName(opt.value)}
                                    placeholder="Select consumable item..."
                                />
                                {errors.item && <p className="text-xs text-red-600 mt-1">{errors.item}</p>}
                            </div>
                        </div>
                    )}

                    {/* Signatories Details */}
                    <div className="border-t border-gray-200 pt-4 space-y-3">
                        <h4 className="text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                            Official Signatories (COA Mandated)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                                    Accountable / Certifying Officer
                                </label>
                                <input
                                    type="text"
                                    value={accountableOfficer}
                                    onChange={(e) => setAccountableOfficer(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-600 mb-1">
                                    Official Designation
                                </label>
                                <input
                                    type="text"
                                    value={officerDesignation}
                                    onChange={(e) => setOfficerDesignation(e.target.value)}
                                    className="w-full px-3 py-1.5 text-xs font-medium border border-gray-300 rounded-md"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handlePreviewClick}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-bold uppercase tracking-wider transition-colors shadow-xs cursor-pointer"
                        >
                            <Eye className="w-4 h-4 text-gray-600" />
                            <span>Preview Document</span>
                        </button>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-3.5 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-red-900 hover:bg-red-950 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 disabled:opacity-50 cursor-pointer"
                            >
                                <Check className="w-4 h-4 text-amber-300" />
                                <span>{isSubmitting ? 'Generating...' : 'Save & Record Report'}</span>
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </Modal>
    );
}
