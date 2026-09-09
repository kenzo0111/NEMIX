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
    receivings?: any[];
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
    receivings = [],
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

    // Build comprehensive item list from all database tables
    const itemOptions = useMemo(() => {
        const unique = new Map<string, string>();

        // 1. Database inventory items
        items.forEach((item: any) => {
            if (item.name) {
                const stockLabel = item.stock !== undefined ? ` — Stock: ${item.stock}` : '';
                unique.set(item.name, `${item.name} (${item.sku || 'No SKU'})${stockLabel}`);
            }
        });

        // 2. Database issuances
        issuances.forEach((iss: any) => {
            const name = typeof iss.item === 'string'
                ? iss.item
                : (iss.item?.name || iss.item_name || iss.itemName);
            if (name && !unique.has(name)) {
                unique.set(name, `${name} (${iss.sku || 'Issued Item'})`);
            }
        });

        // 3. Database receivings
        receivings.forEach((rec: any) => {
            const name = typeof rec.item === 'string'
                ? rec.item
                : (rec.item?.name || rec.item_name || rec.itemName);
            if (name && !unique.has(name)) {
                unique.set(name, `${name} (${rec.sku || 'Received Item'})`);
            }
        });

        // 4. Migrated historical records
        migratedRecords.forEach((m: any) => {
            const name = m.item_name || m.item || m.article;
            if (name && !unique.has(name)) {
                unique.set(name, `${name} (${m.stock_no || m.reference || 'Historical Record'})`);
            }
        });

        return Array.from(unique.entries()).map(([name, label]) => ({
            value: name,
            label,
        }));
    }, [items, issuances, receivings, migratedRecords]);

    // Default to first item from database if available
    useEffect(() => {
        if (!selectedItemName && itemOptions.length > 0) {
            setSelectedItemName(itemOptions[0].value);
        }
    }, [itemOptions, selectedItemName]);

    const buildGeneratedPayload = () => {
        let itemsData: any[] = [];

        if (formType === 'RSMI') {
            // 1. Filter issuances by selected month/year
            let matchedIssuances = issuances.filter((issue: any) => {
                const dateVal = issue.date || issue.date_issued || issue.created_at;
                if (!dateVal) return false;
                const d = new Date(dateVal);
                return (
                    d.getMonth() + 1 === Number(selectedMonth) &&
                    d.getFullYear() === Number(selectedYear)
                );
            });

            // 2. Check migrated RSMI matching month/year if no live issuances found
            if (matchedIssuances.length === 0) {
                matchedIssuances = migratedRecords.filter((m: any) => {
                    if (m.form_type !== 'RSMI' && m.type !== 'RSMI') return false;
                    const dateVal = m.date || m.created_at;
                    if (!dateVal) return false;
                    const d = new Date(dateVal);
                    return (
                        d.getMonth() + 1 === Number(selectedMonth) &&
                        d.getFullYear() === Number(selectedYear)
                    );
                });
            }

            // 3. If still none for the exact month, pull all available issuances or migrated RSMI records
            if (matchedIssuances.length === 0) {
                if (issuances.length > 0) {
                    matchedIssuances = issuances;
                } else {
                    const rsmiMigrated = migratedRecords.filter((m: any) => m.form_type === 'RSMI' || m.type === 'RSMI');
                    if (rsmiMigrated.length > 0) {
                        matchedIssuances = rsmiMigrated;
                    }
                }
            }

            // 4. Map into RSMI items from database
            if (matchedIssuances.length > 0) {
                itemsData = matchedIssuances.map((iss: any) => {
                    const itemName = typeof iss.item === 'string'
                        ? iss.item
                        : (iss.item?.name || iss.item_name || iss.itemName || 'Consumable Supply');
                    const sku = iss.sku || iss.item?.sku || iss.stock_no || iss.stockNo || '';
                    const unitCost = Number(iss.unit_cost || iss.unitCost || iss.item?.unit_cost || 0);
                    const qty = Number(iss.quantity || iss.quantity_issued || 1);
                    const amount = Number(iss.amount || (qty * unitCost) || 0);

                    return {
                        risNo: iss.ris_no || iss.reference || sku || reference,
                        responsibilityCenterCode: iss.department || iss.center_code || iss.responsibility_center_code || 'SPMO Central',
                        stockNo: sku,
                        item: itemName,
                        itemDescription: itemName,
                        unit: iss.unit || iss.item?.unit_of_issue || 'pc',
                        quantityIssued: qty,
                        unitCost: unitCost,
                        amount: amount,
                    };
                });
            } else if (items.length > 0) {
                // If no issuances exist yet, populate RSMI directly from active inventory items
                itemsData = items.map((it: any) => {
                    const unitCost = Number(it.unit_cost || it.unitCost || 0);
                    const qty = Number(it.stock > 0 ? it.stock : 1);
                    return {
                        risNo: it.sku || reference,
                        responsibilityCenterCode: 'SPMO Central',
                        stockNo: it.sku || '',
                        item: it.name,
                        itemDescription: it.name,
                        unit: it.unit_of_issue || it.unitOfIssue || 'pc',
                        quantityIssued: qty,
                        unitCost: unitCost,
                        amount: qty * unitCost,
                    };
                });
            }
        } else if (formType === 'RPCI') {
            let rpciSource = items;
            if (rpciSource.length === 0) {
                rpciSource = migratedRecords.filter((m: any) => m.form_type === 'RPCI' || m.type === 'RPCI');
            }
            if (rpciSource.length === 0) {
                rpciSource = migratedRecords;
            }

            itemsData = rpciSource.map((item: any) => {
                const article = item.name || item.item_name || item.item || item.article || 'Consumable Property';
                const description = item.description || item.name || item.item_name || item.item || '';
                const stockNo = item.sku || item.stock_no || item.reference || '';
                const unit = item.unit_of_issue || item.unitOfIssue || item.unit || 'pc';
                const unitCost = Number(item.unit_cost || item.unitCost || item.unit_value || 0);
                const stockQty = Number(item.stock ?? item.quantity ?? item.quantity_per_books ?? 0);

                return {
                    article,
                    description,
                    stockNo,
                    unit,
                    unitCost,
                    quantityPerBooks: stockQty,
                    physicalCount: Number(item.physical_count ?? stockQty),
                    shortageQty: item.shortage_qty || item.variance || '',
                    shortageValue: item.shortage_value || '',
                    remarks: item.status || item.remarks || 'Available',
                };
            });
        } else if (formType === 'STOCK_CARD') {
            const targetItem = items.find((i) => (i.name || '').toLowerCase() === (selectedItemName || '').toLowerCase())
                || items.find((i) => String(i.id) === String(selectedItemName))
                || items[0];

            const activeItemName = targetItem?.name || selectedItemName || '';

            // Match issuances from database
            const matchedIssuances = issuances.filter((i: any) => {
                const name = typeof i.item === 'string' ? i.item : (i.item?.name || i.item_name || i.itemName || '');
                return !activeItemName || name.toLowerCase() === activeItemName.toLowerCase();
            });

            // Match receivings from database
            const matchedReceivings = (receivings || []).filter((r: any) => {
                const name = typeof r.item === 'string' ? r.item : (r.item?.name || r.item_name || r.itemName || '');
                return !activeItemName || name.toLowerCase() === activeItemName.toLowerCase();
            });

            // Match migrated stock card records
            const matchedMigrated = migratedRecords.filter((m: any) => {
                if (m.form_type !== 'STOCK_CARD' && m.type !== 'STOCK_CARD') return false;
                const name = m.item_name || m.item || m.article || '';
                return !activeItemName || name.toLowerCase() === activeItemName.toLowerCase();
            });

            const combinedMovements: any[] = [];

            matchedReceivings.forEach((rec: any) => {
                combinedMovements.push({
                    date: rec.date || rec.date_received || reportDate,
                    reference: rec.sku || rec.reference || `REC-${rec.id}`,
                    receiptQty: Number(rec.quantity || 0),
                    issueQty: 0,
                    issueOffice: rec.supplier_name || 'Delivery / Supplier',
                    remarks: 'Stock In / Received',
                });
            });

            matchedIssuances.forEach((iss: any) => {
                combinedMovements.push({
                    date: iss.date || iss.date_issued || reportDate,
                    reference: iss.sku || iss.reference || `ISS-${iss.id}`,
                    receiptQty: 0,
                    issueQty: Number(iss.quantity || iss.quantity_issued || 0),
                    issueOffice: iss.recipient || iss.department || 'Office Requisition',
                    remarks: iss.purpose || 'Stock Out / Issued',
                });
            });

            matchedMigrated.forEach((m: any) => {
                combinedMovements.push({
                    date: m.date || reportDate,
                    reference: m.reference || m.stock_no || `MIG-${m.id}`,
                    receiptQty: Number(m.receipt_qty ?? (m.quantity && !m.quantity_issued ? m.quantity : 0)),
                    issueQty: Number(m.issue_qty ?? m.quantity_issued ?? 0),
                    issueOffice: m.department || m.recipient || m.source || 'Historical Movement',
                    remarks: m.remarks || 'Migrated Ledger Entry',
                });
            });

            if (combinedMovements.length > 0) {
                combinedMovements.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                let runningBalance = 0;
                itemsData = combinedMovements.map((mov) => {
                    runningBalance += (mov.receiptQty - mov.issueQty);
                    return {
                        ...mov,
                        balanceQty: runningBalance >= 0 ? runningBalance : (targetItem?.stock || 0),
                    };
                });
            } else if (targetItem) {
                itemsData = [
                    {
                        date: reportDate,
                        reference: targetItem.sku || reference,
                        receiptQty: Number(targetItem.stock || 0),
                        issueQty: 0,
                        issueOffice: 'SPMO Central Inventory',
                        balanceQty: Number(targetItem.stock || 0),
                        remarks: 'Beginning Inventory Balance',
                    },
                ];
            }
        } else {
            // MR (Memorandum Receipt - Appendix 63)
            const targetItem = items.find((i) => (i.name || '').toLowerCase() === (selectedItemName || '').toLowerCase())
                || items.find((i) => String(i.id) === String(selectedItemName));

            if (targetItem) {
                itemsData = [
                    {
                        quantity: 1,
                        unit: targetItem.unit_of_issue || targetItem.unitOfIssue || 'unit',
                        description: targetItem.description || targetItem.name,
                        propertyNo: targetItem.sku || reference,
                        dateAcquired: reportDate,
                        amount: Number(targetItem.unit_cost || targetItem.unitCost || targetItem.amount || 0),
                    },
                ];
            } else {
                const mrRecords = migratedRecords.filter((m: any) => m.form_type === 'MR' || m.type === 'MR');
                if (mrRecords.length > 0) {
                    itemsData = mrRecords.map((m: any) => ({
                        quantity: Number(m.quantity || m.quantity_issued || 1),
                        unit: m.unit || 'unit',
                        description: m.item_name || m.item || m.description || 'Property Item',
                        propertyNo: m.property_no || m.stock_no || m.reference || reference,
                        dateAcquired: m.date || reportDate,
                        amount: Number(m.amount || m.unit_cost || 0),
                    }));
                } else if (items.length > 0) {
                    itemsData = items.slice(0, 10).map((it: any) => ({
                        quantity: 1,
                        unit: it.unit_of_issue || it.unitOfIssue || 'unit',
                        description: it.description || it.name,
                        propertyNo: it.sku || reference,
                        dateAcquired: reportDate,
                        amount: Number(it.unit_cost || it.unitCost || 0),
                    }));
                }
            }
        }

        return {
            type: formType,
            reference,
            title: `${formType} - ${reference}`,
            status: 'generated',
            date: reportDate,
            itemName: selectedItemName || (itemsData[0]?.item || itemsData[0]?.article || itemsData[0]?.description || ''),
            recipient: accountableOfficer,
            department: 'SPMO Central',
            quantity: itemsData.reduce((acc, curr) => acc + Number(curr.quantity || curr.quantityIssued || curr.issueQty || curr.receiptQty || 1), 0),
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

        if (formType === 'STOCK_CARD' && !selectedItemName && itemOptions.length > 0) {
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
                supplierId: null,
                supplierName: '',
                endUser: accountableOfficer,
                generatedDate: todayStr,
                periodType: 'specific',
                date: reportDate,
                startDate: null,
                endDate: null,
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

                    {(formType === 'STOCK_CARD' || formType === 'MR') && (
                        <div className="p-4 rounded-lg bg-amber-50/50 border border-amber-100 space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                    Select Inventory / Property Item {formType === 'STOCK_CARD' && <span className="text-red-600">*</span>}
                                </label>
                                <Select
                                    styles={selectStyles}
                                    options={itemOptions}
                                    value={itemOptions.find((i) => i.value === selectedItemName) || null}
                                    onChange={(opt) => opt && setSelectedItemName(opt.value)}
                                    placeholder={formType === 'STOCK_CARD' ? 'Select inventory item from database...' : 'Select property item (or leave blank to compile all property)...'}
                                    isClearable={formType === 'MR'}
                                />
                                {errors.item && <p className="text-xs text-red-600 mt-1">{errors.item}</p>}
                                <p className="text-[11px] text-gray-500 font-medium mt-1">
                                    {formType === 'STOCK_CARD'
                                        ? 'Select the inventory supply item to compile continuous ledger cards from receipts and issuances.'
                                        : 'Select an inventory property/equipment item for individual Memorandum Receipt, or leave blank to compile institutional property records.'}
                                </p>
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
