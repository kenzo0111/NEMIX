import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';

// --- HELPER COMPONENTS FOR THE "IMAGE-LIKE" UI ---

// 1. The Colorful Checkbox Badge
const FormCheckbox = ({ label, color, checked, onChange }: { label: string, color: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
    const colorClasses: any = {
        red:   'bg-red-50 text-red-700 border-red-200 checked:bg-red-600',
    };

    return (
        <label className={`
            flex items-center gap-2 px-2 py-1 rounded-md border cursor-pointer transition-all select-none
            ${checked ? 'shadow-sm ring-1 ring-offset-1 ring-red-400' : 'hover:bg-gray-50 border-transparent'}
            ${colorClasses[color]}
        `}>
            <input 
                type="checkbox" 
                checked={checked} 
                onChange={onChange}
                className={`
                    w-4 h-4 rounded border-gray-300 focus:ring-offset-0 focus:ring-2 
                    text-red-600 
                    focus:ring-red-500
                `} 
            />
            <span className="text-[10px] font-bold tracking-wider">{label}</span>
        </label>
    );
};

// 2. The Form Configuration Card
const FormConfigCard = ({ title, type, items, formState, onHeaderChange, onItemDetailChange, color, description }: any) => {
    const selectedItems = items.map((item: any, index: number) => ({ ...item, originalIndex: index })).filter((item: any) => item[type]);
    const count = selectedItems.length;

    if (count === 0) return null;

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6 animate-fadeIn">
            {/* Card Header */}
            <div className={`px-6 py-4 border-l-4 bg-gray-50 flex justify-between items-center border-red-500`}>
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg bg-red-100 text-red-700`}>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">{title}</h3>
                        <p className="text-xs text-gray-500">{description}</p>
                    </div>
                </div>
                <span className="px-3 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full">
                    {count} item{count > 1 ? 's' : ''} selected
                </span>
            </div>

            {/* Content Area */}
            <div className="p-6">
                {/* 1. Quick Tip */}
                <div className={`flex gap-3 p-4 rounded-lg mb-6 text-xs bg-red-50 text-red-800`}>
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <p><strong>Quick Tip:</strong> {title} is used for {description.toLowerCase()}. Fill in the common information below, and specify details for each item.</p>
                </div>

                {/* 2. Common Inputs (Header) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                    {/* Form Number */}
                    <div className="group md:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1">
                            {type === 'ics' && 'ICS No.'}
                            {type === 'ris' && 'RIS No.'}
                            {type === 'par' && 'PAR No.'}
                            {type === 'iar' && 'IAR No.'}
                        </label>
                        <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Auto-generated" 
                            value={formState.forms_header[type].no} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange(type, 'no', e.target.value)} />
                    </div>

                    {type === 'ics' && (
                        <>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Received By (Custodian)</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Name of personnel" 
                                    value={formState.forms_header.ics.custodian} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('ics', 'custodian', e.target.value)} />
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Issued By (Supply Officer)</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Name of officer"
                                    value={formState.forms_header.ics.issued_by} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('ics', 'issued_by', e.target.value)} />
                            </div>
                        </>
                    )}
                    {type === 'par' && (
                        <>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Received By</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Name of personnel" 
                                    value={formState.forms_header.par.received_by} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('par', 'received_by', e.target.value)} />
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Issued By</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Name of officer"
                                    value={formState.forms_header.par.issued_by} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('par', 'issued_by', e.target.value)} />
                            </div>
                        </>
                    )}
                    {type === 'ris' && (
                        <>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Approved By</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Name of approver" 
                                    value={formState.forms_header.ris.approved_by} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('ris', 'approved_by', e.target.value)} />
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Issued By</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Name of officer"
                                    value={formState.forms_header.ris.issued_by} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('ris', 'issued_by', e.target.value)} />
                            </div>
                            <div className="group md:col-span-2">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Purpose</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Purpose of requisition"
                                    value={formState.forms_header.ris.purpose} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('ris', 'purpose', e.target.value)} />
                            </div>
                        </>
                    )}
                    {type === 'iar' && (
                        <>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Inspection Officer</label>
                                <input type="text" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500" placeholder="Name of officer" 
                                    value={formState.forms_header.iar.inspection_officer} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('iar', 'inspection_officer', e.target.value)} />
                            </div>
                            <div className="group">
                                <label className="block text-xs font-bold text-gray-500 mb-1">Date Inspected</label>
                                <input type="date" className="w-full text-sm border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500"
                                    value={formState.forms_header.iar.date_inspected} onChange={(e: React.ChangeEvent<HTMLInputElement>) => onHeaderChange('iar', 'date_inspected', e.target.value)} />
                            </div>
                        </>
                    )}
                </div>

                {/* 3. Item Specific Inputs */}
                <div className="space-y-3">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Item Details</h4>
                    {selectedItems.map((item: any, i: number) => (
                        <div key={i} className="flex flex-col md:flex-row gap-4 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <div className="w-full md:w-1/3 pt-2">
                                <p className="text-sm font-bold text-gray-800">{item.description || 'No Description'}</p>
                                <p className="text-xs text-gray-500">Stock #: {item.stock_no || 'N/A'} • Qty: {item.quantity}</p>
                            </div>
                            
                            {/* Dynamic Inputs based on type */}
                            <div className="w-full md:w-2/3 grid grid-cols-2 gap-3">
                                {type === 'ics' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500">Property No.</label>
                                            <input type="text" className="w-full text-xs border-gray-200 rounded focus:border-red-500 focus:ring-red-500" placeholder="Prop #" 
                                                value={item.ics_details.property_no} 
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onItemDetailChange(item.originalIndex, 'ics_details', 'property_no', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500">Est. Useful Life</label>
                                            <input type="text" className="w-full text-xs border-gray-200 rounded focus:border-red-500 focus:ring-red-500" placeholder="e.g. 1 Year" 
                                                value={item.ics_details.estimated_life} 
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onItemDetailChange(item.originalIndex, 'ics_details', 'estimated_life', e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                                {type === 'par' && (
                                    <>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500">Property No.</label>
                                            <input type="text" className="w-full text-xs border-gray-200 rounded focus:border-red-500 focus:ring-red-500" placeholder="Prop #" 
                                                value={item.par_details.property_no} 
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onItemDetailChange(item.originalIndex, 'par_details', 'property_no', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-bold text-gray-500">Serial No.</label>
                                            <input type="text" className="w-full text-xs border-gray-200 rounded focus:border-red-500 focus:ring-red-500" placeholder="S/N" 
                                                value={item.par_details.serial_no} 
                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => onItemDetailChange(item.originalIndex, 'par_details', 'serial_no', e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                                {type === 'ris' && (
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500">Remarks</label>
                                        <input type="text" className="w-full text-xs border-gray-200 rounded focus:border-red-500 focus:ring-red-500" placeholder="Additional remarks" 
                                            value={item.ris_details.remarks} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onItemDetailChange(item.originalIndex, 'ris_details', 'remarks', e.target.value)}
                                        />
                                    </div>
                                )}
                                {type === 'iar' && (
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500">Batch No.</label>
                                        <input type="text" className="w-full text-xs border-gray-200 rounded focus:border-red-500 focus:ring-red-500" placeholder="Batch number" 
                                            value={item.iar_details.batch_no} 
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onItemDetailChange(item.originalIndex, 'iar_details', 'batch_no', e.target.value)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- REUSABLE UI COMPONENTS ---
const FormInput = ({ label, icon, error, ...props }: any) => {
    const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <div className="group w-full">
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                        {icon}
                    </div>
                )}
                <input 
                    {...props}
                    id={id}
                    title={label}
                    className={`w-full ${icon ? 'pl-10' : 'pl-4'} pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                    ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>}
        </div>
    );
};

// --- REACT SELECT STYLES (Red Theme) ---
const customSelectStyles = {
    control: (provided: any, state: any) => ({
        ...provided,
        paddingLeft: '0.5rem',
        borderRadius: '0.75rem',
        borderColor: '#d1d5db',
        boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : provided.boxShadow,
        '&:hover': { borderColor: '#dc2626' },
        minHeight: '42px',
        fontSize: '0.875rem',
    }),
    option: (provided: any, state: any) => ({
        ...provided,
        backgroundColor: state.isSelected ? '#991b1b' : state.isFocused ? '#fef2f2' : null,
        color: state.isSelected ? 'white' : '#1f2937',
        cursor: 'pointer',
        fontSize: '0.875rem',
    }),
};

export default function ProcurementPanel({ auth, purchaseOrder, suppliers, nextPoNumber }: { auth: any, purchaseOrder?: any, suppliers: any[], nextPoNumber?: string }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const { flash } = usePage().props as any;

    const isEdit = !!purchaseOrder;

    const form = useForm({
        // Order Info
        po_number: '',
        date: '',
        mode: '',
        fund_cluster: '',
        job_order: false,
        contract_agreement: false,
        purchase_order: false,

        // Supplier & Delivery
        supplier: '',
        place_of_delivery: '',
        date_of_delivery: '',
        delivery_term: '',
        payment_term: '',
        delivery_status: 'Pending', // Default

        // Requestor
        end_user: '',
        department: '',
        designation: '',

        // Items
        items: [{ 
            stock_no: '', 
            unit: '', 
            description: '', 
            quantity: 0, 
            unit_cost: 0, 
            amount: 0,
            ris: false, 
            par: false, 
            ics: false, 
            iar: false,
            ris_number: '',
            ris_date: '',
            par_number: '',
            par_date: '',
            ics_number: '',
            ics_date: '',
            iar_number: '',
            iar_date: '',
            // Item Specific Details
            ics_details: { serial_no: '', property_no: '', estimated_life: '' },
            par_details: { property_no: '', serial_no: '' },
            ris_details: { remarks: '' },
            iar_details: { batch_no: '' }
        }],

        // Form-Wide Signatories/Headers
        forms_header: {
            ics: { custodian: '', issued_by: '', no: '' },
            par: { received_by: '', issued_by: '', no: '' },
            ris: { approved_by: '', issued_by: '', purpose: '', no: '' },
            iar: { inspection_officer: '', date_inspected: '', no: '' }
        },
        total: 0,
    });

    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    }, [flash]);

    useEffect(() => {
        if (isEdit && purchaseOrder) {
            form.setData({
                ...purchaseOrder,
                items: purchaseOrder.items || [{ stock_no: '', unit: '', description: '', quantity: 0, unit_cost: 0, amount: 0, ris: false, par: false, ics: false, iar: false, ris_number: '', ris_date: '', par_number: '', par_date: '', ics_number: '', ics_date: '', iar_number: '', iar_date: '', ics_details: { serial_no: '', property_no: '', estimated_life: '' }, par_details: { property_no: '', serial_no: '' }, ris_details: { remarks: '' }, iar_details: { batch_no: '' } }],
                forms_header: purchaseOrder.forms_header || {
                    ics: { custodian: '', issued_by: '', no: '' },
                    par: { received_by: '', issued_by: '', no: '' },
                    ris: { approved_by: '', issued_by: '', purpose: '', no: '' },
                    iar: { inspection_officer: '', date_inspected: '', no: '' }
                },
            });
        } else if (!isEdit && nextPoNumber) {
            form.setData('po_number', nextPoNumber);
        }
    }, [isEdit, purchaseOrder, nextPoNumber]);

    const procurementModeOptions = [
        { value: 'Public Bidding', label: 'Public Bidding' },
        { value: 'Small Value Procurement', label: 'Small Value Procurement' },
        { value: 'Direct Contracting', label: 'Direct Contracting' },
        { value: 'Shopping', label: 'Shopping' },
    ];

    const fundClusterOptions = [
        { value: '01', label: '01 - Regular Agency Fund' },
        { value: '05', label: '05 - Internally Generated Funds' },
        { value: '06', label: '06 - Business Related Funds' },
        { value: '07', label: '07 - Trust Receipts' }
    ];

    const supplierOptions = suppliers.map((supplier: any) => ({
        value: supplier.name,
        label: supplier.name,
    }));

    const deliveryStatusOptions = [
        { value: 'Pending', label: 'Pending' },
        { value: 'Partial', label: 'Partial Delivery' },
        { value: 'Complete', label: 'Complete Delivery' },
        { value: 'Cancelled', label: 'Cancelled' },
    ];

    // --- ITEM LOGIC ---
    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems: any = [...form.data.items];
        newItems[index][field] = value;

        // Auto-calc amount
        if (field === 'quantity' || field === 'unit_cost') {
            const qty = parseFloat(newItems[index].quantity) || 0;
            const cost = parseFloat(newItems[index].unit_cost) || 0;
            newItems[index].amount = qty * cost;
        }

        // Auto-calc Grand Total
        const newTotal = newItems.reduce((acc: number, item: any) => acc + (parseFloat(item.amount) || 0), 0);
        
        form.setData((prev) => ({
            ...prev,
            items: newItems,
            total: newTotal
        }));
    };

    const handleHeaderChange = (formType: string, field: string, value: string) => {
        const newHeaders: any = { ...form.data.forms_header };
        newHeaders[formType][field] = value;
        form.setData('forms_header', newHeaders);
    };

    const handleDetailChange = (index: number, docType: string, field: string, value: any) => {
        const newItems: any = [...form.data.items];
        if (!newItems[index][docType]) newItems[index][docType] = {};
        newItems[index][docType][field] = value;
        form.setData('items', newItems);
    };

    // Calculate Active Forms
    const activeForms = {
        ics: form.data.items.some((i: any) => i.ics),
        ris: form.data.items.some((i: any) => i.ris),
        par: form.data.items.some((i: any) => i.par),
        iar: form.data.items.some((i: any) => i.iar),
    };

    const totalActiveForms = Object.values(activeForms).filter(Boolean).length;

    // Auto-generate form numbers
    useEffect(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const prefix = `${year}-${month}-`;

        const newHeaders = { ...form.data.forms_header };

        if (activeForms.ics && !newHeaders.ics.no) {
            newHeaders.ics.no = `${prefix}0001`;
        }
        if (activeForms.par && !newHeaders.par.no) {
            newHeaders.par.no = `${prefix}0001`;
        }
        if (activeForms.ris && !newHeaders.ris.no) {
            newHeaders.ris.no = `${prefix}0001`;
        }
        if (activeForms.iar && !newHeaders.iar.no) {
            newHeaders.iar.no = `${prefix}0001`;
        }

        // Only update if there are changes
        if (JSON.stringify(newHeaders) !== JSON.stringify(form.data.forms_header)) {
            form.setData('forms_header', newHeaders);
        }
    }, [activeForms, form.data.forms_header]);

    const addItemRow = () => {
        form.setData('items', [
            ...form.data.items, 
            { stock_no: '', unit: '', description: '', quantity: 0, unit_cost: 0, amount: 0, ris: false, par: false, ics: false, iar: false, ris_number: '', ris_date: '', par_number: '', par_date: '', ics_number: '', ics_date: '', iar_number: '', iar_date: '', ics_details: { serial_no: '', property_no: '', estimated_life: '' }, par_details: { property_no: '', serial_no: '' }, ris_details: { remarks: '' }, iar_details: { batch_no: '' } }
        ]);
    };

    const removeItemRow = (index: number) => {
        if(form.data.items.length > 1) {
            const newItems = form.data.items.filter((_, i) => i !== index);
            const newTotal = newItems.reduce((acc: number, item: any) => acc + (parseFloat(item.amount) || 0), 0);
            form.setData((prev) => ({ ...prev, items: newItems, total: newTotal }));
        }
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && purchaseOrder) {
            form.put(`/acquisition/purchase-orders/${purchaseOrder.id}`);
        } else {
            form.post('/acquisition/purchase-orders');
        }
    };

    const modules = getSidebarModules('Acquisition', 'Procurement Panel');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title={isEdit ? "Edit Procurement Record" : "Create Procurement Record"} />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Fixed Top Header */}
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">
                            {isEdit ? "Edit Procurement Record" : "Procurement Compliance and Control"}
                        </h2>
                        <div className="flex items-center text-xs text-gray-500 font-medium mt-1 gap-2">
                            <Link href="/acquisition/inbound-deliveries" className="hover:text-red-700 transition-colors">Inbound Deliveries</Link>
                            <span>/</span>
                            <span className="text-red-800">Procurement Panel</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-gray-800">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                        </div>
                    </div>
                </div>

                {/* FULL PAGE CONTAINER - NO MAX-WIDTH */}
                <div className="p-4 md:p-6 w-full">
                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 mb-6 animate-fadeIn">
                            <div className="flex-shrink-0 text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            </div>
                            <p className="text-sm font-medium text-green-800 flex-1">{successMessage}</p>
                            <button type="button" onClick={() => setSuccessMessage('')} className="text-green-600 hover:text-green-800" aria-label="Close message"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>
                        </div>
                    )}

                    {/* FULL PAGE FORM CARD */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
                        <div className="h-1.5 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950"></div>

                        <form onSubmit={submit} className="p-6 md:p-8 space-y-8">
                            
                            {/* SECTION 1: ORDER INFO */}
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                    <div className="bg-red-100 p-2 rounded-lg text-red-800">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Order Information</h4>
                                </div>
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <FormInput 
                                        label="PO Number *"
                                        value={form.data.po_number}
                                        onChange={(e: any) => form.setData('po_number', e.target.value)}
                                        placeholder="e.g., 2023-10-0001"
                                        required
                                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>}
                                        readOnly
                                    />
                                    
                                    <div className="group w-full">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Date</label>
                                        <DatePicker
                                            selected={form.data.date ? new Date(form.data.date) : null}
                                            onChange={(date: Date | null) => form.setData('date', date ? date.toISOString().split('T')[0] : '')}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="Select date"
                                            className="w-full pl-4 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all border-gray-300 focus:border-red-500"
                                            wrapperClassName="w-full"
                                        />
                                    </div>

                                    <div className="group w-full">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Mode of Procurement</label>
                                        <Select
                                            options={procurementModeOptions}
                                            value={procurementModeOptions.find(option => option.value === form.data.mode)}
                                            onChange={(selectedOption: any) => form.setData('mode', selectedOption?.value || '')}
                                            placeholder="Select Mode"
                                            styles={customSelectStyles}
                                        />
                                    </div>

                                    {/* Order Type Checkboxes */}
                                    <div className="lg:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1">Order Type</label>
                                        <div className="flex flex-col gap-2 p-3 bg-white border border-gray-200 rounded-xl h-[42px] justify-center overflow-hidden">
                                            <div className="flex gap-4">
                                                <label className="flex items-center cursor-pointer text-xs">
                                                    <input type="checkbox" checked={form.data.job_order} onChange={(e) => form.setData('job_order', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                                    <span className="ml-1.5 font-medium">JO</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer text-xs">
                                                    <input type="checkbox" checked={form.data.contract_agreement} onChange={(e) => form.setData('contract_agreement', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                                    <span className="ml-1.5 font-medium">Contract</span>
                                                </label>
                                                <label className="flex items-center cursor-pointer text-xs">
                                                    <input type="checkbox" checked={form.data.purchase_order} onChange={(e) => form.setData('purchase_order', e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500" />
                                                    <span className="ml-1.5 font-medium">PO</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: DELIVERY & SUPPLIER */}
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                    <div className="bg-red-100 p-2 rounded-lg text-red-800">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Delivery & Financials</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                    <div className="group w-full">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Supplier Name *</label>
                                        <Select
                                            options={supplierOptions}
                                            value={supplierOptions.find(option => option.value === form.data.supplier)}
                                            onChange={(selectedOption: any) => form.setData('supplier', selectedOption?.value || '')}
                                            placeholder="Select Supplier"
                                            styles={customSelectStyles}
                                        />
                                    </div>
                                    
                                    <div className="group w-full">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Fund Cluster</label>
                                        <Select
                                            options={fundClusterOptions}
                                            value={fundClusterOptions.find(option => option.value === form.data.fund_cluster)}
                                            onChange={(selectedOption: any) => form.setData('fund_cluster', selectedOption?.value || '')}
                                            placeholder="Select Cluster"
                                            styles={customSelectStyles}
                                        />
                                    </div>

                                    <FormInput label="Place of Delivery" value={form.data.place_of_delivery} onChange={(e: any) => form.setData('place_of_delivery', e.target.value)} />
                                    
                                    <div className="group w-full">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Date of Delivery</label>
                                        <DatePicker
                                            selected={form.data.date_of_delivery ? new Date(form.data.date_of_delivery) : null}
                                            onChange={(date: Date | null) => form.setData('date_of_delivery', date ? date.toISOString().split('T')[0] : '')}
                                            dateFormat="yyyy-MM-dd"
                                            placeholderText="Select Date"
                                            className="w-full pl-4 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 border-gray-300 focus:border-red-500"
                                            wrapperClassName="w-full"
                                        />
                                    </div>

                                    <FormInput label="Delivery Term" value={form.data.delivery_term} onChange={(e: any) => form.setData('delivery_term', e.target.value)} placeholder="e.g. 15 Calendar Days" />
                                    <FormInput label="Payment Term" value={form.data.payment_term} onChange={(e: any) => form.setData('payment_term', e.target.value)} placeholder="e.g. Charge Account" />
                                    
                                    <div className="group w-full">
                                        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Delivery Status</label>
                                        <Select
                                            options={deliveryStatusOptions}
                                            value={deliveryStatusOptions.find(o => o.value === form.data.delivery_status)}
                                            onChange={(opt: any) => form.setData('delivery_status', opt?.value)}
                                            styles={customSelectStyles}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 3: REQUESTOR DETAILS */}
                            <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                                    <div className="bg-red-100 p-2 rounded-lg text-red-800">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    </div>
                                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Requestor Details</h4>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <FormInput label="End User / Requestor *" value={form.data.end_user} onChange={(e: any) => form.setData('end_user', e.target.value)} required />
                                    <FormInput label="Department / Office *" value={form.data.department} onChange={(e: any) => form.setData('department', e.target.value)} required />
                                    <FormInput label="Designation *" value={form.data.designation} onChange={(e: any) => form.setData('designation', e.target.value)} required />
                                </div>
                            </div>

                            {/* SECTION 4: ITEMS TABLE */}
                            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-100 p-2 rounded-lg text-red-800">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                                        </div>
                                        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Item Specifications</h4>
                                    </div>
                                    <button type="button" onClick={addItemRow} className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold hover:bg-red-200 transition-colors">
                                        + Add Item
                                    </button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Stock #</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-24">Unit</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase min-w-[200px]">Description</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-24">Qty</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Unit Cost</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-32">Amount</th>
                                                <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase w-48">Forms</th>
                                                <th className="px-2 py-3 w-10">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-100">
                                            {form.data.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-2 py-2 align-top"><input className="w-full border-gray-200 rounded-md text-xs focus:ring-red-500 focus:border-red-500" value={item.stock_no} onChange={(e) => handleItemChange(index, 'stock_no', e.target.value)} placeholder="N/A" /></td>
                                                    <td className="px-2 py-2 align-top"><input className="w-full border-gray-200 rounded-md text-xs focus:ring-red-500 focus:border-red-500" value={item.unit} onChange={(e) => handleItemChange(index, 'unit', e.target.value)} placeholder="pc" /></td>
                                                    <td className="px-2 py-2 align-top"><textarea className="w-full border-gray-200 rounded-md text-xs focus:ring-red-500 focus:border-red-500" rows={2} value={item.description} onChange={(e) => handleItemChange(index, 'description', e.target.value)} placeholder="Item details..." /></td>
                                                    <td className="px-2 py-2 align-top"><input type="number" className="w-full border-gray-200 rounded-md text-xs text-right focus:ring-red-500 focus:border-red-500" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} /></td>
                                                    <td className="px-2 py-2 align-top"><input type="number" className="w-full border-gray-200 rounded-md text-xs text-right focus:ring-red-500 focus:border-red-500" value={item.unit_cost} onChange={(e) => handleItemChange(index, 'unit_cost', e.target.value)} /></td>
                                                    <td className="px-4 py-3 text-sm font-bold text-right align-top text-gray-700">₱{(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                                    <td className="px-2 py-2 align-top">
                                                        <div className="grid grid-cols-2 gap-2">
                                                            <FormCheckbox label="ICS" color="red" checked={item.ics} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'ics', e.target.checked)} />
                                                            <FormCheckbox label="RIS" color="red" checked={item.ris} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'ris', e.target.checked)} />
                                                            <FormCheckbox label="PAR" color="red" checked={item.par} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'par', e.target.checked)} />
                                                            <FormCheckbox label="IAR" color="red" checked={item.iar} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleItemChange(index, 'iar', e.target.checked)} />
                                                        </div>
                                                    </td>
                                                    <td className="px-2 py-2 text-center align-top">
                                                        {form.data.items.length > 1 && (
                                                            <button type="button" onClick={() => removeItemRow(index)} className="text-red-500 hover:text-red-700 font-bold px-2">
                                                                &times;
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-red-50/50">
                                             <tr>
                                                 <td colSpan={5} className="text-right px-4 py-3 text-sm font-bold text-gray-600">Grand Total:</td>
                                                 <td className="px-4 py-3 text-right text-lg font-bold text-green-600">₱{form.data.total.toLocaleString()}</td>
                                                 <td colSpan={2}></td>
                                             </tr>
                                         </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* --- DYNAMIC FORM CONFIGURATION SECTION --- */}
                            <div className="animate-slideUp">
                                {/* Header Panel */}
                                <div className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                            <h3 className="text-lg font-bold text-red-900">Form Configuration</h3>
                                        </div>
                                        <p className="text-sm text-red-700">Fill in the details for each selected form below. These will be automatically generated.</p>
                                    </div>
                                    <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-red-100 text-sm font-bold text-red-800">
                                        {totalActiveForms} of 4 Forms Selected
                                    </div>
                                </div>

                                {/* Badge Selector (Visual Only or Navigation) */}
                                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                                    {activeForms.ics && <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-red-200 flex items-center gap-2"><span className="bg-white/20 p-0.5 rounded">✓</span> ICS</button>}
                                    {activeForms.ris && <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-red-200 flex items-center gap-2"><span className="bg-white/20 p-0.5 rounded">✓</span> RIS</button>}
                                    {activeForms.par && <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-red-200 flex items-center gap-2"><span className="bg-white/20 p-0.5 rounded">✓</span> PAR</button>}
                                    {activeForms.iar && <button type="button" className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-sm shadow-red-200 flex items-center gap-2"><span className="bg-white/20 p-0.5 rounded">✓</span> IAR</button>}
                                </div>

                                {/* DYNAMIC CARDS */}
                                <FormConfigCard 
                                    title="Inventory Custodian Slip (ICS)" 
                                    type="ics" 
                                    color="red"
                                    description="Semi-expendable property items"
                                    items={form.data.items} 
                                    formState={form.data}
                                    onHeaderChange={handleHeaderChange}
                                    onItemDetailChange={handleDetailChange}
                                />

                                <FormConfigCard 
                                    title="Property Acknowledgment Receipt (PAR)" 
                                    type="par" 
                                    color="red"
                                    description="High-value Property, Plant and Equipment (PPE)"
                                    items={form.data.items} 
                                    formState={form.data}
                                    onHeaderChange={handleHeaderChange}
                                    onItemDetailChange={handleDetailChange}
                                />

                                <FormConfigCard 
                                    title="Requisition and Issue Slip (RIS)" 
                                    type="ris" 
                                    color="red"
                                    description="Request for supplies and materials"
                                    items={form.data.items} 
                                    formState={form.data}
                                    onHeaderChange={handleHeaderChange}
                                    onItemDetailChange={handleDetailChange}
                                />

                                <FormConfigCard 
                                    title="Inspection and Acceptance Report (IAR)" 
                                    type="iar" 
                                    color="red"
                                    description="Quality inspection and acceptance"
                                    items={form.data.items} 
                                    formState={form.data}
                                    onHeaderChange={handleHeaderChange}
                                    onItemDetailChange={handleDetailChange}
                                />
                            </div>

                            {/* ACTION BUTTONS */}
                            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100">
                                <Link
                                    href="/acquisition/inbound-deliveries"
                                    className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all shadow-sm"
                                >
                                    Cancel & Return
                                </Link>
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-8 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 shadow-lg hover:shadow-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {form.processing ? (
                                        <>
                                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            Processing...
                                        </>
                                    ) : isEdit ? 'Update Record' : 'Create Record'}
                                </button>
                            </div>

                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}