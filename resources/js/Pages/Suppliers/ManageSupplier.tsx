import { Head, useForm } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';

// --- REUSABLE UI COMPONENTS (Internal) ---

const SupplierModal = ({ show, onClose, title, children, footer, isSubmitting }: any) => {
    if (!show) return null;

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity"
                onClick={!isSubmitting ? onClose : undefined}
            ></div>

            {/* Modal Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl transform transition-all scale-100 overflow-hidden border border-red-100 flex flex-col max-h-[90vh]">

                {/* Decorative Top Bar */}
                <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950 shrink-0"></div>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">Register a new supplier in the database</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                {/* Body (Scrollable) */}
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                    {footer}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, icon, error, disabled, ...props }: any) => {
    const id = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
    return (
        <div className="group w-full">
            <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                    {icon}
                </div>
                <input
                    {...props}
                    id={id}
                    title={label}
                    disabled={disabled}
                    className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                    focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                    ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'} ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                />
            </div>
            {error && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>}
        </div>
    );
};

export default function ManageSupplier({ auth, suppliers }: { auth: any, suppliers: any[] }) {
    // State for filters
    const [selectedClassification, setSelectedClassification] = useState<{ value: string; label: string } | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<{ value: string; label: string } | null>(null);
    const [collapsed, setCollapsed] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

    // Form for creating/updating supplier
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        tin: '',
        reg_number: '',
        category: '',
        status: 'active',
    });

    // Sidebar Modules
    const modules = getSidebarModules('Suppliers', 'Manage Supplier');
    const user = auth.user;

    // Options for React Select
    const classificationOptions = [
        { value: '', label: 'All Classifications' },
        { value: 'goods', label: 'Goods & Services' },
        { value: 'infra', label: 'Infrastructure' },
        { value: 'consulting', label: 'Consulting Services' },
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'active', label: 'Active/Compliant' },
        { value: 'pending', label: 'Pending Renewal' },
        { value: 'blacklisted', label: 'Blacklisted' },
    ];

    // Form options for modal
    const categoryFormOptions = [
        { value: 'goods', label: 'Goods & Services' },
        { value: 'infra', label: 'Infrastructure' },
        { value: 'consulting', label: 'Consulting Services' },
    ];

    const statusFormOptions = [
        { value: 'active', label: 'Active/Compliant' },
        { value: 'pending', label: 'Pending Renewal' },
        { value: 'blacklisted', label: 'Blacklisted' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (modalMode === 'create') {
            post('/suppliers', {
                onSuccess: () => {
                    setModalMode(null);
                    reset();
                }
            });
        } else if (modalMode === 'edit') {
            put(`/suppliers/${selectedSupplier.id}`, {
                onSuccess: () => {
                    setModalMode(null);
                    reset();
                }
            });
        }
    };

    const openCreateModal = () => {
        setModalMode('create');
        setSelectedSupplier(null);
        reset();
    };

    const openViewModal = (supplier: any) => {
        setModalMode('view');
        setSelectedSupplier(supplier);
        setData({
            name: supplier.name,
            tin: supplier.tin,
            reg_number: supplier.reg_number,
            category: supplier.category.toLowerCase().includes('goods') ? 'goods' : supplier.category.toLowerCase().includes('infra') ? 'infra' : 'consulting',
            status: supplier.status.toLowerCase(),
        });
    };

    const openEditModal = (supplier: any) => {
        setModalMode('edit');
        setSelectedSupplier(supplier);
        setData({
            name: supplier.name,
            tin: supplier.tin,
            reg_number: supplier.reg_number,
            category: supplier.category.toLowerCase().includes('goods') ? 'goods' : supplier.category.toLowerCase().includes('infra') ? 'infra' : 'consulting',
            status: supplier.status.toLowerCase(),
        });
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedSupplier(null);
        reset();
    };

    // Mock data representing a Government Supplier Registry
    const suppliersData = suppliers.length > 0 ? suppliers : [
        {
            id: 1,
            name: 'ABC Office Supplies Trading',
            tin: '000-123-456-000',
            reg_number: '2023-112233 (PhilGEPS)',
            category: 'Goods (Office Supplies)',
            status: 'Active',
        },
        {
            id: 2,
            name: 'MegaBuild Construction Corp.',
            tin: '000-987-654-001',
            reg_number: '2022-998877 (PCAB)',
            category: 'Infrastructure',
            status: 'Pending Renewal',
        },
        {
            id: 3,
            name: 'Tech Solutions Inc.',
            tin: '000-456-789-000',
            reg_number: '2024-000001 (PhilGEPS)',
            category: 'Consulting Services',
            status: 'Blacklisted',
        },
    ];

    return (
        <>
            <Head title="Suppliers - Manage Supplier" />
            <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                />

                {/* --- MAIN CONTENT --- */}
                <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-72'}`}>
                
                {/* Fixed Top Header */}
                <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
                    <div>
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Suppliers Database</h2>
                        <p className="text-sm text-gray-600 mt-1">Manage and monitor supplier registrations</p>
                    </div>
                </div>

                {/* Page Content */}
                <div className="p-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6 text-gray-900">
                                
                                {/* Header Section: Title & Add Button */}
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-800">Suppliers Database</h1>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Registry of eligible suppliers for procurement and property management.
                                        </p>
                                    </div>
                                    <button
                                        onClick={openCreateModal}
                                        className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium transition shadow-sm"
                                    >
                                        + Register New Supplier
                                    </button>
                                </div>

                            {/* Search and Filter Section */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Search</label>
                                    <input 
                                        type="text" 
                                        placeholder="Name, TIN, or PhilGEPS No..." 
                                        className="w-full border-gray-300 rounded-md shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Classification</label>
                                    <Select
                                        options={classificationOptions}
                                        value={selectedClassification}
                                        onChange={setSelectedClassification}
                                        placeholder="All Classifications"
                                        isClearable
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                borderColor: '#d1d5db',
                                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                                '&:hover': {
                                                    borderColor: '#dc2626',
                                                },
                                                '&:focus-within': {
                                                    borderColor: '#dc2626',
                                                    boxShadow: '0 0 0 1px #dc2626',
                                                },
                                            }),
                                            placeholder: (provided) => ({
                                                ...provided,
                                                color: '#6b7280',
                                                fontSize: '0.875rem',
                                            }),
                                            singleValue: (provided) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                                backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
                                                color: state.isSelected ? 'white' : '#374151',
                                            }),
                                        }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Compliance Status</label>
                                    <Select
                                        options={statusOptions}
                                        value={selectedStatus}
                                        onChange={setSelectedStatus}
                                        placeholder="All Statuses"
                                        isClearable
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                borderColor: '#d1d5db',
                                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                                '&:hover': {
                                                    borderColor: '#dc2626',
                                                },
                                                '&:focus-within': {
                                                    borderColor: '#dc2626',
                                                    boxShadow: '0 0 0 1px #dc2626',
                                                },
                                            }),
                                            placeholder: (provided) => ({
                                                ...provided,
                                                color: '#6b7280',
                                                fontSize: '0.875rem',
                                            }),
                                            singleValue: (provided) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                                backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
                                                color: state.isSelected ? 'white' : '#374151',
                                            }),
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Government Compliant Table */}
                            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                Business Name
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                Tax ID (TIN)
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                Registration No.
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                Classification
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                Status
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {suppliersData.map((supplier) => (
                                            <tr key={supplier.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {supplier.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                    {supplier.tin}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {supplier.reg_number}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {supplier.category}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                                                        ${supplier.status === 'Active' ? 'bg-green-100 text-green-800' : 
                                                          supplier.status === 'Blacklisted' ? 'bg-red-100 text-red-800' : 
                                                          'bg-yellow-100 text-yellow-800'}`}>
                                                        {supplier.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => openViewModal(supplier)} className="text-red-600 hover:text-red-900 mr-4 font-semibold">View</button>
                                                    <button onClick={() => openEditModal(supplier)} className="text-gray-500 hover:text-gray-700">Update</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
                                <div className="text-sm text-gray-500">
                                    Showing <span className="font-medium">1</span> to <span className="font-medium">3</span> of <span className="font-medium">12</span> results
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">Previous</button>
                                    <button className="px-3 py-1 border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50">Next</button>
                                </div>
                            </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Modal */}
            <SupplierModal
                show={modalMode !== null}
                onClose={closeModal}
                title={
                    modalMode === 'create' ? "Register New Supplier" :
                    modalMode === 'view' ? "View Supplier" :
                    "Update Supplier"
                }
                isSubmitting={processing}
                footer={
                    modalMode === 'view' ? (
                        <button
                            type="button"
                            onClick={closeModal}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all"
                        >
                            Close
                        </button>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={processing}
                                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 shadow-lg hover:shadow-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {modalMode === 'create' ? 'Creating...' : 'Updating...'}
                                    </>
                                ) : modalMode === 'create' ? 'Create Supplier' : 'Update Supplier'}
                            </button>
                        </>
                    )
                }
            >
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Section 1: Business Information */}
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Business Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput
                                label="Business Name"
                                value={data.name}
                                onChange={(e: any) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="e.g., ABC Office Supplies Trading"
                                required
                                disabled={modalMode === 'view'}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                                </svg>}
                            />
                            <FormInput
                                label="Tax ID (TIN)"
                                value={data.tin}
                                onChange={(e: any) => setData('tin', e.target.value)}
                                error={errors.tin}
                                placeholder="e.g., 000-123-456-000"
                                required
                                disabled={modalMode === 'view'}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>}
                            />
                        </div>
                    </div>

                    {/* Section 2: Registration Details */}
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Registration Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormInput
                                label="Registration Number"
                                value={data.reg_number}
                                onChange={(e: any) => setData('reg_number', e.target.value)}
                                error={errors.reg_number}
                                placeholder="e.g., 2023-112233 (PhilGEPS)"
                                required
                                disabled={modalMode === 'view'}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                                </svg>}
                            />
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Classification</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                                        </svg>
                                    </div>
                                    <Select
                                        options={categoryFormOptions}
                                        value={categoryFormOptions.find(option => option.value === data.category)}
                                        onChange={(selected) => setData('category', selected?.value || '')}
                                        placeholder="Select Classification"
                                        isClearable
                                        isDisabled={modalMode === 'view'}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                borderColor: errors.category ? '#dc2626' : '#d1d5db',
                                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                                borderRadius: '0.75rem',
                                                '&:hover': {
                                                    borderColor: '#dc2626',
                                                },
                                                '&:focus-within': {
                                                    borderColor: '#dc2626',
                                                    boxShadow: '0 0 0 3px rgb(220 38 38 / 0.1)',
                                                },
                                            }),
                                            placeholder: (provided) => ({
                                                ...provided,
                                                color: '#6b7280',
                                                fontSize: '0.875rem',
                                            }),
                                            singleValue: (provided) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                                backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
                                                color: state.isSelected ? 'white' : '#374151',
                                            }),
                                        }}
                                    />
                                </div>
                                {errors.category && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.category}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Compliance Status */}
                    <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Compliance Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Status</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                        </svg>
                                    </div>
                                    <Select
                                        options={statusFormOptions}
                                        value={statusFormOptions.find(option => option.value === data.status)}
                                        onChange={(selected) => setData('status', selected?.value || 'active')}
                                        placeholder="Select Status"
                                        isDisabled={modalMode === 'view'}
                                        className="react-select-container"
                                        classNamePrefix="react-select"
                                        styles={{
                                            control: (provided) => ({
                                                ...provided,
                                                borderColor: errors.status ? '#dc2626' : '#d1d5db',
                                                boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                                borderRadius: '0.75rem',
                                                '&:hover': {
                                                    borderColor: '#dc2626',
                                                },
                                                '&:focus-within': {
                                                    borderColor: '#dc2626',
                                                    boxShadow: '0 0 0 3px rgb(220 38 38 / 0.1)',
                                                },
                                            }),
                                            placeholder: (provided) => ({
                                                ...provided,
                                                color: '#6b7280',
                                                fontSize: '0.875rem',
                                            }),
                                            singleValue: (provided) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                            }),
                                            option: (provided, state) => ({
                                                ...provided,
                                                fontSize: '0.875rem',
                                                backgroundColor: state.isSelected ? '#dc2626' : state.isFocused ? '#fef2f2' : 'white',
                                                color: state.isSelected ? 'white' : '#374151',
                                            }),
                                        }}
                                    />
                                </div>
                                {errors.status && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.status}</p>}
                            </div>
                        </div>
                    </div>
                </form>
            </SupplierModal>
        </div>
        </>
    );
}