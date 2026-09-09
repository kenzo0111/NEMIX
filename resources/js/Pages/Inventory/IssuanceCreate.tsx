import React, { useState, useMemo } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import Sidebar from '@/Components/Sidebar';
import PageHeader from '@/Components/Common/PageHeader';
import Toast, { useToast } from '@/Components/Common/Toast';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Plus,
    Trash2,
    AlertCircle,
    User,
    Building2,
    FileText,
    Package,
    Shield,
    Calendar,
} from 'lucide-react';

interface ItemOption {
    id: number;
    name: string;
    sku: string;
    stock: number;
    unit_cost?: number;
    unit_of_issue?: string;
}

interface IssuanceCreateProps {
    auth: any;
    items?: ItemOption[];
}

interface ItemRow {
    item_id: string;
    quantity: string;
}

const selectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        borderRadius: '0.5rem',
        borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
        fontSize: '0.875rem',
        padding: '1px',
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

export default function IssuanceCreate({ auth, items = [] }: IssuanceCreateProps) {
    const pageProps = usePage().props as any;
    const user = auth?.user || pageProps.auth?.user;
    const publicSettings = pageProps.system?.settings || {};

    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleCollapse = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    };

    const modules = getSidebarModules('Inventory', 'Issuance');
    const { toast, showToast, clearToast } = useToast();

    // 4-Step Form Wizard State
    const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

    // Step 1: Recipient and Office Information
    const [recipient, setRecipient] = useState('');
    const [department, setDepartment] = useState('');
    const [fundCluster, setFundCluster] = useState('01');
    const [recipientDesignation, setRecipientDesignation] = useState('');

    // Step 2: Issuance Details
    const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
    const [purpose, setPurpose] = useState('');

    // Approver Information (from System Settings)
    const approvedByName =
        (publicSettings['signatories_ris_oic_active']
            ? publicSettings['signatories_ris_oic_prefix'] || 'OIC, '
            : '') + (publicSettings['signatories_ris_approved_by_name'] || 'ARSENIO GEM A. GARCILLANOSA');
    const approvedByDesignation =
        publicSettings['signatories_ris_approved_by_designation'] || 'SUPPLY OFFICER III/ADMIN OFFICER V';

    // Step 3: Inventory Items
    const [itemRows, setItemRows] = useState<ItemRow[]>([{ item_id: '', quantity: '' }]);

    // Submission & Validation States
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

    const fundClusterOptions = [
        { value: '01', label: '01 - Regular Agency Fund' },
        { value: '05', label: '05 - Internally Generated Funds' },
        { value: '06', label: '06 - Business Related Funds' },
        { value: '07', label: '07 - Trust Receipts' },
    ];

    const divisionOptions = [
        { value: 'Admission Office', label: 'Admission Office' },
        { value: 'Alumni Affairs Office', label: 'Alumni Affairs Office' },
        { value: 'Auxiliary Services Division (ASD)', label: 'Auxiliary Services Division (ASD)' },
        { value: 'Center for Equity, Inclusivity and Diversity (CEID)', label: 'Center for Equity, Inclusivity and Diversity (CEID)' },
        { value: 'Culture and Performing Arts Unit (CPAU)', label: 'Culture and Performing Arts Unit (CPAU)' },
        { value: 'Extension Services Division (ESD)', label: 'Extension Services Division (ESD)' },
        { value: 'General Services Office (GSO)', label: 'General Services Office (GSO)' },
        { value: 'Guidance and Counseling Office', label: 'Guidance and Counseling Office' },
        { value: 'Information Technology Services Office (ITSO)', label: 'Information Technology Services Office (ITSO)' },
        { value: 'Library', label: 'Library' },
        { value: 'Medical and Dental Services', label: 'Medical and Dental Services' },
        { value: 'Office of Student Services and Development (OSSD)', label: 'Office of Student Services and Development (OSSD)' },
        { value: 'Office of the President (OP)', label: 'Office of the President (OP)' },
        { value: 'Office of the Vice President for Academic Affairs (OVPAA)', label: 'Office of the Vice President for Academic Affairs (OVPAA)' },
        { value: 'Office of the Vice President for Administration and Finance', label: 'Office of the Vice President for Administration and Finance' },
        { value: 'Planning and Development Office', label: 'Planning and Development Office' },
        { value: 'Public Information and Community Relations Office (PICRO)', label: 'Public Information and Community Relations Office (PICRO)' },
        { value: 'Supply & Property Management Office (SPMO)', label: 'Supply & Property Management Office (SPMO)' },
    ];

    const availableItemsMap = useMemo(() => {
        const map = new Map<number, ItemOption>();
        items.forEach((item) => map.set(item.id, item));
        return map;
    }, [items]);

    const itemSelectOptions = useMemo(() => {
        return items.map((item) => ({
            value: String(item.id),
            label: `${item.name} (${item.sku || 'No SKU'}) — Stock: ${item.stock} ${item.unit_of_issue || 'units'}`,
            stock: item.stock,
        }));
    }, [items]);

    // Validation per step
    const validateStep1 = () => {
        const errs: Record<string, string> = {};
        if (!recipient.trim()) errs.recipient = 'Recipient full name is required.';
        if (!department.trim()) errs.department = 'Please select or enter the requesting office/division.';
        if (!fundCluster) errs.fundCluster = 'Fund cluster is required.';
        setStepErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep2 = () => {
        const errs: Record<string, string> = {};
        if (!dateIssued) errs.dateIssued = 'Issuance date is required.';
        if (!purpose.trim()) errs.purpose = 'Purpose of issuance is required.';
        setStepErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const validateStep3 = () => {
        const errs: Record<string, string> = {};
        if (itemRows.length === 0) {
            errs.items = 'At least one item must be added to the issuance.';
        }

        const selectedIds = new Set<string>();

        itemRows.forEach((row, idx) => {
            if (!row.item_id) {
                errs[`row_${idx}_item`] = `Item #${idx + 1}: Please select an item.`;
            } else if (selectedIds.has(row.item_id)) {
                errs[`row_${idx}_item`] = `Item #${idx + 1}: Duplicate item selected. Combine quantities instead.`;
            } else {
                selectedIds.add(row.item_id);
            }

            const qty = Number(row.quantity);
            const targetItem = availableItemsMap.get(Number(row.item_id));

            if (!row.quantity || isNaN(qty) || qty <= 0) {
                errs[`row_${idx}_qty`] = `Item #${idx + 1}: Enter a valid positive quantity.`;
            } else if (targetItem && qty > targetItem.stock) {
                errs[`row_${idx}_qty`] = `Item #${idx + 1}: Requested (${qty}) exceeds available stock (${targetItem.stock}).`;
            }
        });

        setStepErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleNext = () => {
        if (currentStep === 1 && validateStep1()) {
            setCurrentStep(2);
        } else if (currentStep === 2 && validateStep2()) {
            setCurrentStep(3);
        } else if (currentStep === 3 && validateStep3()) {
            setCurrentStep(4);
        }
    };

    const handlePrev = () => {
        setStepErrors({});
        if (currentStep > 1) {
            setCurrentStep((prev) => (prev - 1) as any);
        }
    };

    const handleAddItemRow = () => {
        setItemRows((prev) => [...prev, { item_id: '', quantity: '' }]);
    };

    const handleRemoveItemRow = (index: number) => {
        if (itemRows.length <= 1) {
            setItemRows([{ item_id: '', quantity: '' }]);
            return;
        }
        setItemRows((prev) => prev.filter((_, i) => i !== index));
    };

    const handleRowChange = (index: number, field: 'item_id' | 'quantity', val: string) => {
        setItemRows((prev) => {
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: val };
            return copy;
        });
        if (stepErrors[`row_${index}_item`] || stepErrors[`row_${index}_qty`]) {
            setStepErrors((prev) => {
                const copy = { ...prev };
                delete copy[`row_${index}_item`];
                delete copy[`row_${index}_qty`];
                return copy;
            });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateStep1() || !validateStep2() || !validateStep3()) {
            return;
        }

        setIsSubmitting(true);

        const payload = {
            recipient: recipient.trim(),
            department: department.trim(),
            fund_cluster: fundCluster,
            recipient_designation: recipientDesignation.trim() || null,
            purpose: purpose.trim(),
            date_issued: dateIssued,
            approved_by: approvedByName,
            approved_by_designation: approvedByDesignation,
            issuances: itemRows.map((r) => ({
                item_id: Number(r.item_id),
                quantity: Number(r.quantity),
            })),
        };

        router.post(route('inventory.issuance.store'), payload, {
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
                showToast('Requisition and Issue Slip created successfully.', 'success');
            },
            onError: (errors: any) => {
                setIsSubmitting(false);
                setStepErrors(errors);
                showToast('Failed to record issuance. Please review errors.', 'error');
            },
        });
    };

    // Calculate totals for review
    const { totalQuantity, totalValuation } = useMemo(() => {
        let qty = 0;
        let val = 0;
        itemRows.forEach((row) => {
            const count = Number(row.quantity) || 0;
            const item = availableItemsMap.get(Number(row.item_id));
            qty += count;
            val += count * Number(item?.unit_cost || 0);
        });
        return { totalQuantity: qty, totalValuation: val };
    }, [itemRows, availableItemsMap]);

    return (
        <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
            <Head title="Record New Issuance (RIS) — UCN SPMO" />

            {/* Persistent Sidebar */}
            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            {/* Main Content Area */}
            <main
                className={`flex-1 transition-all duration-300 ease-in-out ${
                    collapsed ? 'ml-20' : 'ml-72'
                }`}
            >
                {/* Unified Sticky Header — Same as Dashboard */}
                <PageHeader
                    title="Record New Inventory Issuance"
                    subtitle="Step-by-step requisition slip compiler with real-time stock allocation and audit compliance"
                    systemTag="SPMO — Requisition & Issue Slip (RIS) Workflow"
                    breadcrumbs={[
                        { name: 'Inventory', href: route('inventory.index') },
                        { name: 'Issuance', href: route('inventory.issuance') },
                        { name: 'New Issuance Slip' },
                    ]}
                    actions={
                        <Link
                            href={route('inventory.issuance')}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4 text-gray-500" />
                            <span>Back to Issuance Registry</span>
                        </Link>
                    }
                />

                <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
                    {/* Stepper Progress Card */}
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
                        <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                            {[
                                { num: 1, title: 'Recipient Info', icon: User },
                                { num: 2, title: 'Issuance Details', icon: FileText },
                                { num: 3, title: 'Select Items', icon: Package },
                                { num: 4, title: 'Review & Confirm', icon: CheckCircle2 },
                            ].map((s) => {
                                const Icon = s.icon;
                                const isCurrent = currentStep === s.num;
                                const isPassed = currentStep > s.num;

                                return (
                                    <div
                                        key={s.num}
                                        className={`p-3 rounded-lg border transition-all ${
                                            isCurrent
                                                ? 'border-red-900 bg-red-50 text-red-950 font-bold'
                                                : isPassed
                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 font-bold'
                                                : 'border-gray-200 bg-gray-50/50 text-gray-400'
                                        }`}
                                    >
                                        <div className="flex items-center justify-center gap-1.5 mb-1">
                                            {isPassed ? (
                                                <Check className="w-4 h-4 text-emerald-700" />
                                            ) : (
                                                <Icon className={`w-4 h-4 ${isCurrent ? 'text-red-900' : 'text-gray-400'}`} />
                                            )}
                                            <span className="uppercase text-[11px] font-bold">
                                                Step {s.num}
                                            </span>
                                        </div>
                                        <div className="text-[11px] font-sans truncate">{s.title}</div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Step Form Container */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
                        <div className="h-1.5 w-full bg-red-950" />

                        <form onSubmit={handleSubmit} className="p-6 lg:p-8 space-y-6">
                            {/* STEP 1: RECIPIENT & OFFICE INFORMATION */}
                            {currentStep === 1 && (
                                <div className="space-y-5">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-base font-bold text-gray-900 font-serif">
                                            Step 1: Recipient and Requesting Office Information
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            Specify the authorized university personnel and accountability center
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                                Recipient Full Name <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={recipient}
                                                onChange={(e) => {
                                                    setRecipient(e.target.value);
                                                    if (stepErrors.recipient) {
                                                        setStepErrors((prev) => {
                                                            const c = { ...prev };
                                                            delete c.recipient;
                                                            return c;
                                                        });
                                                    }
                                                }}
                                                placeholder="e.g. Engr. Juan Dela Cruz"
                                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900"
                                            />
                                            {stepErrors.recipient && (
                                                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                    {stepErrors.recipient}
                                                </p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                                Requesting Office / Division <span className="text-red-600">*</span>
                                            </label>
                                            <Select
                                                styles={selectStyles}
                                                options={divisionOptions}
                                                value={divisionOptions.find((d) => d.value === department) || (department ? { value: department, label: department } : null)}
                                                onChange={(opt) => {
                                                    setDepartment(opt ? opt.value : '');
                                                    if (stepErrors.department) {
                                                        setStepErrors((prev) => {
                                                            const c = { ...prev };
                                                            delete c.department;
                                                            return c;
                                                        });
                                                    }
                                                }}
                                                placeholder="Search university offices..."
                                            />
                                            {stepErrors.department && (
                                                <p className="text-xs text-red-600 mt-1 font-medium flex items-center gap-1">
                                                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                    {stepErrors.department}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                                Fund Cluster <span className="text-red-600">*</span>
                                            </label>
                                            <Select
                                                styles={selectStyles}
                                                options={fundClusterOptions}
                                                value={fundClusterOptions.find((f) => f.value === fundCluster)}
                                                onChange={(opt) => opt && setFundCluster(opt.value)}
                                                isSearchable={false}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                                Recipient Official Position / Designation
                                            </label>
                                            <input
                                                type="text"
                                                value={recipientDesignation}
                                                onChange={(e) => setRecipientDesignation(e.target.value)}
                                                placeholder="e.g. Administrative Officer IV / Faculty"
                                                className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 2: ISSUANCE DETAILS */}
                            {currentStep === 2 && (
                                <div className="space-y-5">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-base font-bold text-gray-900 font-serif">
                                            Step 2: Issuance Purpose and Approver Authority
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            State the justification for supply disbursement and verify designated signatories
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                                Official Date Issued <span className="text-red-600">*</span>
                                            </label>
                                            <input
                                                type="date"
                                                value={dateIssued}
                                                onChange={(e) => setDateIssued(e.target.value)}
                                                className="w-full px-3.5 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900"
                                            />
                                            {stepErrors.dateIssued && (
                                                <p className="text-xs text-red-600 mt-1 font-medium">{stepErrors.dateIssued}</p>
                                            )}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                                Designated Approving Authority (Read-Only)
                                            </label>
                                            <div className="px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 font-mono flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold">{approvedByName}</div>
                                                    <div className="text-[11px] text-gray-500">{approvedByDesignation}</div>
                                                </div>
                                                <Shield className="w-4 h-4 text-amber-600 shrink-0" />
                                            </div>
                                            <p className="text-[10px] text-gray-500 mt-1">
                                                Configured centrally in Consumables System Settings.
                                            </p>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-1">
                                            Purpose / Requisition Justification <span className="text-red-600">*</span>
                                        </label>
                                        <textarea
                                            value={purpose}
                                            onChange={(e) => {
                                                setPurpose(e.target.value);
                                                if (stepErrors.purpose) {
                                                    setStepErrors((prev) => {
                                                        const c = { ...prev };
                                                        delete c.purpose;
                                                        return c;
                                                    });
                                                }
                                            }}
                                            rows={3}
                                            placeholder="Specify official institutional purpose for this consumable stock release (e.g. Office administration operations for 1st Semester FY 2026)..."
                                            className="w-full px-3.5 py-2 text-sm border border-gray-300 rounded-lg focus:ring-1 focus:ring-red-900 focus:border-red-900"
                                        />
                                        {stepErrors.purpose && (
                                            <p className="text-xs text-red-600 mt-1 font-medium">{stepErrors.purpose}</p>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* STEP 3: ADD & REVIEW INVENTORY ITEMS */}
                            {currentStep === 3 && (
                                <div className="space-y-5">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 font-serif">
                                                Step 3: Add Inventory Items
                                            </h3>
                                            <p className="text-xs text-gray-500 font-medium">
                                                Select consumable supplies from active stock and specify quantities to issue
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={handleAddItemRow}
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-900 rounded-md text-xs font-bold uppercase tracking-wider border border-red-200 transition-colors shadow-2xs cursor-pointer"
                                        >
                                            <Plus className="w-4 h-4 text-red-900" />
                                            <span>Add Another Item</span>
                                        </button>
                                    </div>

                                    {stepErrors.items && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 font-medium">
                                            {stepErrors.items}
                                        </div>
                                    )}

                                    <div className="space-y-3">
                                        {itemRows.map((row, index) => {
                                            const selectedItem = availableItemsMap.get(Number(row.item_id));
                                            const itemError = stepErrors[`row_${index}_item`];
                                            const qtyError = stepErrors[`row_${index}_qty`];

                                            return (
                                                <div
                                                    key={index}
                                                    className="p-4 bg-gray-50/70 border border-gray-200 rounded-xl space-y-3"
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-xs font-bold font-mono text-gray-700 uppercase">
                                                            Line Item #{index + 1}
                                                        </span>

                                                        {itemRows.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRemoveItemRow(index)}
                                                                className="text-gray-400 hover:text-red-700 p-1 rounded transition-colors"
                                                                title="Remove Item Row"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>

                                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 items-start">
                                                        <div className="lg:col-span-2">
                                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider font-mono mb-1">
                                                                Select Item <span className="text-red-600">*</span>
                                                            </label>
                                                            <Select
                                                                styles={selectStyles}
                                                                options={itemSelectOptions}
                                                                value={itemSelectOptions.find((o) => o.value === row.item_id) || null}
                                                                onChange={(opt) => handleRowChange(index, 'item_id', opt ? opt.value : '')}
                                                                placeholder="Search item name or SKU..."
                                                            />
                                                            {itemError && (
                                                                <p className="text-xs text-red-600 mt-1 font-medium">{itemError}</p>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider font-mono mb-1">
                                                                Quantity to Issue <span className="text-red-600">*</span>
                                                            </label>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                max={selectedItem?.stock || 999999}
                                                                value={row.quantity}
                                                                onChange={(e) => handleRowChange(index, 'quantity', e.target.value)}
                                                                placeholder="Qty"
                                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg font-mono focus:ring-1 focus:ring-red-900 focus:border-red-900"
                                                            />
                                                            {qtyError && (
                                                                <p className="text-xs text-red-600 mt-1 font-medium">{qtyError}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {selectedItem && (
                                                        <div className="pt-2 border-t border-gray-200/80 flex flex-wrap items-center justify-between text-xs font-mono text-gray-600">
                                                            <div>
                                                                Available Stock:{' '}
                                                                <span className="font-bold text-emerald-800">
                                                                    {selectedItem.stock} {selectedItem.unit_of_issue || 'units'}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                Unit Cost:{' '}
                                                                <span className="font-bold text-gray-800">
                                                                    ₱{Number(selectedItem.unit_cost || 0).toFixed(2)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                                Line Total:{' '}
                                                                <span className="font-bold text-red-900">
                                                                    ₱{(Number(row.quantity || 0) * Number(selectedItem.unit_cost || 0)).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Real-time Subtotal Summary */}
                                    <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
                                        <div>
                                            Total Dispatched Items:{' '}
                                            <span className="font-bold text-red-950 text-sm">{totalQuantity} units</span>
                                        </div>
                                        <div>
                                            Estimated Total Valuation:{' '}
                                            <span className="font-bold text-red-950 text-sm">
                                                ₱{totalValuation.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* STEP 4: REVIEW & CONFIRM */}
                            {currentStep === 4 && (
                                <div className="space-y-5">
                                    <div className="border-b border-gray-100 pb-3">
                                        <h3 className="text-base font-bold text-gray-900 font-serif">
                                            Step 4: Review and Confirm Requisition and Issue Slip
                                        </h3>
                                        <p className="text-xs text-gray-500 font-medium">
                                            Please verify all details carefully before committing stock allocation to database
                                        </p>
                                    </div>

                                    {/* Overview Header Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <span className="text-[10px] font-mono text-gray-500 uppercase block">Recipient</span>
                                            <span className="text-xs font-bold text-gray-900 block truncate">{recipient}</span>
                                            <span className="text-[10px] text-gray-500 block truncate">{recipientDesignation || 'End-User'}</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <span className="text-[10px] font-mono text-gray-500 uppercase block">Requesting Office</span>
                                            <span className="text-xs font-bold text-gray-900 block truncate">{department}</span>
                                            <span className="text-[10px] text-gray-500 block font-mono">Fund: {fundCluster}</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                            <span className="text-[10px] font-mono text-gray-500 uppercase block">Date Issued</span>
                                            <span className="text-xs font-bold text-gray-900 block font-mono">{dateIssued}</span>
                                        </div>
                                        <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                            <span className="text-[10px] font-mono text-red-700 uppercase block">Approved By</span>
                                            <span className="text-xs font-bold text-red-950 block truncate">{approvedByName}</span>
                                            <span className="text-[10px] text-red-800 block truncate">{approvedByDesignation}</span>
                                        </div>
                                    </div>

                                    {/* Purpose Callout */}
                                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase block">Purpose</span>
                                        <p className="text-xs text-gray-800 mt-0.5 leading-relaxed font-medium">{purpose}</p>
                                    </div>

                                    {/* Review Items Table */}
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                            <thead className="bg-gray-50 font-mono text-[11px] text-gray-700 uppercase">
                                                <tr>
                                                    <th className="px-4 py-2.5">Item & Property No / SKU</th>
                                                    <th className="px-4 py-2.5 text-center">Unit</th>
                                                    <th className="px-4 py-2.5 text-center">Quantity</th>
                                                    <th className="px-4 py-2.5 text-right">Unit Cost</th>
                                                    <th className="px-4 py-2.5 text-right">Line Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {itemRows.map((row, idx) => {
                                                    const item = availableItemsMap.get(Number(row.item_id));
                                                    const qty = Number(row.quantity) || 0;
                                                    const cost = Number(item?.unit_cost || 0);

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50">
                                                            <td className="px-4 py-2.5 font-medium text-gray-900">
                                                                <div>{item?.name || 'Item'}</div>
                                                                <div className="text-[11px] text-gray-500 font-mono">{item?.sku || 'No SKU'}</div>
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center text-gray-600">
                                                                {item?.unit_of_issue || 'pc'}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-center font-mono font-bold text-gray-900">
                                                                {qty}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono text-gray-700">
                                                                ₱{cost.toFixed(2)}
                                                            </td>
                                                            <td className="px-4 py-2.5 text-right font-mono font-bold text-red-950">
                                                                ₱{(qty * cost).toFixed(2)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                            <tfoot className="bg-gray-50 font-mono text-xs font-bold text-gray-900 border-t border-gray-200">
                                                <tr>
                                                    <td colSpan={2} className="px-4 py-2.5 text-right uppercase">
                                                        Total:
                                                    </td>
                                                    <td className="px-4 py-2.5 text-center text-red-900">
                                                        {totalQuantity}
                                                    </td>
                                                    <td colSpan={2} className="px-4 py-2.5 text-right text-red-900">
                                                        ₱{totalValuation.toLocaleString('en-PH', { minimumFractionDigits: 2 })}
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* Wizard Footer Navigation Controls */}
                            <div className="flex items-center justify-between pt-5 border-t border-gray-200">
                                {currentStep > 1 ? (
                                    <button
                                        type="button"
                                        onClick={handlePrev}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer"
                                    >
                                        <ArrowLeft className="w-4 h-4" />
                                        <span>Previous Step</span>
                                    </button>
                                ) : (
                                    <Link
                                        href={route('inventory.issuance')}
                                        className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 text-xs font-semibold"
                                    >
                                        Cancel
                                    </Link>
                                )}

                                {currentStep < 4 ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-red-900 hover:bg-red-950 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 cursor-pointer"
                                    >
                                        <span>Next Step</span>
                                        <ArrowRight className="w-4 h-4 text-amber-300" />
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-lg bg-red-900 hover:bg-red-950 text-white text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 disabled:opacity-50 cursor-pointer"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <svg
                                                    className="animate-spin -ml-0.5 mr-1.5 h-4 w-4 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                >
                                                    <circle
                                                        className="opacity-25"
                                                        cx="12"
                                                        cy="12"
                                                        r="10"
                                                        stroke="currentColor"
                                                        strokeWidth="4"
                                                    />
                                                    <path
                                                        className="opacity-75"
                                                        fill="currentColor"
                                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                                    />
                                                </svg>
                                                Recording RIS Slip...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4 text-amber-300" />
                                                <span>Confirm & Dispatch Issuance</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </main>

            {/* Non-disruptive Toast Notifications */}
            <Toast toast={toast} onClose={clearToast} />
        </div>
    );
}
