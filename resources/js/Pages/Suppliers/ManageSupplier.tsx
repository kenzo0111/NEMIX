import SystemModeBadge from '@/Components/SystemModeBadge';
import { Head, useForm } from '@inertiajs/react';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Modal from '@/Components/Modal';
import { useState, useEffect, useMemo } from 'react';
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';

// --- REUSABLE UI COMPONENTS (Internal) ---

const SupplierModal = ({ show, onClose, title, children, footer, isSubmitting }: any) => {
    return (
        <Modal
            show={show}
            onClose={() => !isSubmitting && onClose()}
            maxWidth="4xl"
            closeable={!isSubmitting}
        >
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
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
                            <p className="text-xs text-gray-500 font-medium">Register a supplier for consumable office supplies</p>
                        </div>
                    </div>
                    <button
                        type="button"
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
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                        {footer}
                    </div>
                )}
            </div>
        </Modal>
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

export default function ManageSupplier({ auth, suppliers, items = [], issuances = [] }: { auth: any, suppliers: any[], items?: any[], issuances?: any[] }) {
    // State for filters
    const [selectedClassification, setSelectedClassification] = useState<{ value: string; label: string } | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<{ value: string; label: string } | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [collapsed, setCollapsed] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'view' | 'edit' | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form for creating/updating supplier
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        tin: '',
        address: '',
        reg_number: '',
        category: '',
        status: 'active',
        amount: '',
    });

    // Sidebar Modules
    const modules = getSidebarModules('Suppliers', 'Manage Supplier');
    const user = auth.user;

    const supplierItemValues = useMemo(() => {
        const totals: Record<string, number> = {};
        (items || []).forEach((item: any) => {
            if (item?.supplier_id == null) return;
            const supplierId = String(item.supplier_id);
            const amount = Number(item.amount ?? NaN);
            if (!Number.isNaN(amount) && amount !== 0) {
                totals[supplierId] = (totals[supplierId] || 0) + amount;
                return;
            }

            const stock = Number(item.stock || 0);
            const unitCost = Number(item.unit_cost || 0);
            totals[supplierId] = (totals[supplierId] || 0) + stock * unitCost;
        });
        return totals;
    }, [items]);

    const formatCurrency = (value: number) => `₱${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const getSupplierAmount = (supplier: any) => {
        const supplierId = String(supplier.id);
        return supplierItemValues[supplierId] || 0;
    };

    const capitalize = (s: string) => {
        if (!s) return '';
        return s.charAt(0).toUpperCase() + s.slice(1);
    };

    // Options for React Select
    const classificationOptions = [
        { value: '', label: 'All Classifications' },
        { value: 'goods', label: 'Consumable Office Supplies' },
    ];

    const statusOptions = [
        { value: '', label: 'All Statuses' },
        { value: 'active', label: 'Active/Compliant' },
        { value: 'pending', label: 'Pending Renewal' },
        { value: 'blacklisted', label: 'Blacklisted' },
    ];

    // Form options for modal
    const categoryFormOptions = [
        { value: 'goods', label: 'Consumable Office Supplies' },
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
            address: supplier.address,
            reg_number: supplier.reg_number,
            category: 'goods',
            status: supplier.status.toLowerCase(),
            amount: supplier.amount || '',
        });
    };

    const openEditModal = (supplier: any) => {
        setModalMode('edit');
        setSelectedSupplier(supplier);
        setData({
            name: supplier.name,
            tin: supplier.tin,
            address: supplier.address,
            reg_number: supplier.reg_number,
            category: 'goods',
            status: supplier.status.toLowerCase(),
            amount: supplier.amount || '',
        });
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedSupplier(null);
        reset();
    };

    const suppliersData = suppliers || [];

    const isConsumableCategory = (category: string) => {
        const normalizedCategory = (category || '').toLowerCase();
        return normalizedCategory.includes('consumable')
            || normalizedCategory.includes('office supplies')
            || normalizedCategory.includes('stationery')
            || normalizedCategory.includes('goods');
    };

    const normalizeStatus = (status: string) => {
        const normalizedStatus = (status || '').toLowerCase();
        if (normalizedStatus.includes('active')) return 'active';
        if (normalizedStatus.includes('pending')) return 'pending';
        if (normalizedStatus.includes('blacklist')) return 'blacklisted';
        return normalizedStatus;
    };

    const consumableSuppliers = suppliersData.filter((supplier) => isConsumableCategory(String(supplier.category || '')));

    const filteredSuppliers = consumableSuppliers.filter((supplier) => {
        const normalizedCategory = String(supplier.category || '').toLowerCase();
        const supplierStatus = normalizeStatus(String(supplier.status || ''));
        const query = searchTerm.trim().toLowerCase();
        const searchableText = [supplier.name, supplier.tin, supplier.reg_number, supplier.address, supplier.category]
            .join(' ')
            .toLowerCase();

        const matchesClassification = !selectedClassification?.value
            || (selectedClassification.value === 'goods' && isConsumableCategory(normalizedCategory));
        const matchesStatus = !selectedStatus?.value || supplierStatus === selectedStatus.value;
        const matchesSearch = !query || searchableText.includes(query);

        return matchesClassification && matchesStatus && matchesSearch;
    });

    const totalPages = Math.max(1, Math.ceil(filteredSuppliers.length / itemsPerPage));
    const paginatedSuppliers = filteredSuppliers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedClassification, selectedStatus, suppliersData]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            borderColor: state.isFocused ? '#7f1d1d' : '#d1d5db',
            borderWidth: '1px',
            padding: '1px 2px',
            minWidth: '150px',
            boxShadow: state.isFocused ? '0 0 0 1px #7f1d1d' : 'none',
            fontSize: '0.8125rem',
            fontWeight: '600',
            backgroundColor: '#ffffff',
            '&:hover': { borderColor: '#7f1d1d' },
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : '#ffffff',
            color: state.isSelected ? '#ffffff' : '#111827',
            padding: '7px 12px',
            fontSize: '0.8125rem',
            fontWeight: '600',
            cursor: 'pointer',
        }),
        singleValue: (provided: any) => ({ ...provided, color: '#111827' }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
        }),
        indicatorSeparator: () => ({ display: 'none' }),
    };

    return (
        <>
            <Head title="Suppliers - Consumable Office Supplies" />
            <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                />

                {/* --- MAIN CONTENT --- */}
                <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>

                    {/* Merged Sticky Institutional Header */}
                    <header className="sticky top-0 z-40 shadow-xs">
                        {/* Top Institutional Bar */}
                        <div className="bg-red-950 text-red-100 text-[11px] px-6 lg:px-8 py-1.5 flex items-center justify-between border-b border-red-900 font-medium tracking-wide">
                            <div className="flex items-center gap-3">
                                <span className="font-bold tracking-wider uppercase text-amber-300">Supply & Property Management Office (SPMO)</span>
                                <span className="hidden md:inline text-red-400">|</span>
                                <span className="hidden md:inline text-red-200/80">Supply and Inventory Management System (SIMS)</span>
                            </div>
                            <div className="flex items-center gap-4 text-[10px] font-mono text-red-300">
                                <SystemModeBadge />
                                <span>•</span>
                                <span>ACCESS LEVEL: AUTHORIZED PERSONNEL</span>
                            </div>
                        </div>

                        {/* Main Header Content */}
                        <div className="bg-white border-b border-gray-200 px-6 lg:px-8 py-4 flex items-center justify-between">
                            <div>
                                <div className="mb-1">
                                    <Breadcrumbs items={[{ name: 'Suppliers' }, { name: 'Manage Supplier' }]} />
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 font-serif tracking-tight">Consumable Office Supplies Suppliers</h2>
                                <p className="text-xs text-gray-500 font-medium">Manage suppliers who consistently deliver office consumables</p>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right hidden sm:block border-l border-gray-200 pl-6">
                                    <span className="block text-xs font-bold text-gray-800 uppercase tracking-wider font-mono">
                                        {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                    <span className="text-[10px] text-gray-500 uppercase tracking-widest font-semibold block mt-0.5">
                                        {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </header>

                    {/* Page Content */}
                    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
                            {/* Card Header & Actions */}
                            <div className="px-6 lg:px-8 py-5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">Consumable Office Supplies Registry</h3>
                                    <p className="text-xs text-gray-500 font-medium mt-0.5">Registry of reliable suppliers for recurring office consumables delivery.</p>
                                </div>
                                <button
                                    onClick={openCreateModal}
                                    className="bg-red-950 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-all text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider"
                                >
                                    <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Register Consumables Supplier
                                </button>
                            </div>

                            {/* Search and Filter Section */}
                            <div className="px-6 lg:px-8 py-4 bg-gray-50/30 border-b border-gray-200/80 flex flex-wrap items-center gap-3">
                                <div className="relative flex-grow sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search supplier, TIN, or Reg No..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs"
                                    />
                                </div>
                                <div className="w-full sm:w-56">
                                    <Select
                                        options={classificationOptions}
                                        value={selectedClassification}
                                        onChange={setSelectedClassification}
                                        placeholder="All Classifications"
                                        isClearable
                                        classNamePrefix="react-select"
                                        styles={customSelectStyles}
                                    />
                                </div>
                                <div className="w-full sm:w-48">
                                    <Select
                                        options={statusOptions}
                                        value={selectedStatus}
                                        onChange={setSelectedStatus}
                                        placeholder="All Statuses"
                                        isClearable
                                        classNamePrefix="react-select"
                                        styles={customSelectStyles}
                                    />
                                </div>
                            </div>

                            {/* Government Compliant Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Business Name</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Tax ID (TIN)</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Registration No.</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Address</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Supply Focus</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Amount</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Status</th>
                                            <th className="px-6 py-3.5 text-[11px] font-bold tracking-wider text-right text-gray-700 uppercase font-mono">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-100">
                                        {paginatedSuppliers.map((supplier) => (
                                            <tr key={supplier.id} className="hover:bg-red-50/30 transition-colors border-b border-gray-100 last:border-0">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {supplier.name}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                                                    {supplier.tin}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                                                    {supplier.reg_number}
                                                </td>
                                                <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                                                    {supplier.address}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-700 font-medium">
                                                    {capitalize(String(supplier.category || ''))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold font-mono">
                                                    {formatCurrency(getSupplierAmount(supplier))}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {(() => {
                                                        const supplierStatus = normalizeStatus(String(supplier.status || ''));
                                                        const statusClass = supplierStatus === 'active'
                                                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                                                            : supplierStatus === 'blacklisted'
                                                                ? 'bg-red-50 text-red-800 border border-red-200/80'
                                                                : 'bg-amber-50 text-amber-800 border border-amber-200/80';

                                                        return (
                                                            <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full ${statusClass}`}>
                                                                {capitalize(supplierStatus)}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium font-mono">
                                                    <button onClick={() => openViewModal(supplier)} className="text-red-900 hover:text-red-950 mr-4 font-bold uppercase tracking-wide">View</button>
                                                    <button onClick={() => openEditModal(supplier)} className="text-gray-600 hover:text-gray-900 font-semibold uppercase tracking-wide">Update</button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredSuppliers.length === 0 && (
                                            <tr>
                                                <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500 font-medium">
                                                    No consumable office supplies suppliers found for the selected filters.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 lg:px-8 py-4 border-t border-gray-200/80 bg-gray-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <span className="text-xs text-gray-500 font-medium">Showing <span className="font-bold text-gray-800">{paginatedSuppliers.length}</span> of <span className="font-bold text-gray-800">{filteredSuppliers.length}</span> filtered records</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-50 transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-xs text-gray-500 font-medium">Page {currentPage} of {totalPages}</span>
                                    <button
                                        type="button"
                                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-white disabled:opacity-50 transition-colors"
                                    >
                                        Next
                                    </button>
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
                            <div className="mt-5">
                                <FormInput
                                    label="Address"
                                    value={data.address}
                                    onChange={(e: any) => setData('address', e.target.value)}
                                    error={errors.address}
                                    placeholder="e.g., 123 Main St, Manila, Philippines"
                                    required
                                    disabled={modalMode === 'view'}
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
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
                            <div className="mt-5">
                                <FormInput
                                    label="Amount (₱)"
                                    type="number"
                                    step="0.01"
                                    value={data.amount}
                                    onChange={(e: any) => setData('amount', e.target.value)}
                                    error={errors.amount}
                                    placeholder="0.00"
                                    disabled={modalMode === 'view'}
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>}
                                />
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