import ApplicationLogo from '@/Components/ApplicationLogo';
import Sidebar from '@/Components/Sidebar';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';

export default function Receiving({ auth, receivings, items, suppliers }: { auth: any, receivings: any[], items: any[], suppliers: any[] }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);

    // --- MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedReceiving, setSelectedReceiving] = useState<any>(null);

    // --- FORM STATE ---
    const { data, setData, post, processing, errors, reset } = useForm({
        item_id: '',
        supplier_id: '',
        quantity: '',
        date_received: new Date().toISOString().split('T')[0], // Today's date
    });

    // --- EDIT FORM STATE ---
    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm({
        item_id: '',
        supplier_id: '',
        quantity: '',
        date_received: '',
    });

    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSupplier, setFilterSupplier] = useState<any>(null);

    // --- DERIVED DATA ---
    const supplierOptions = useMemo(() => {
        const uniqueSuppliers = Array.from(new Set(receivings.map(r => r.supplier)));
        return uniqueSuppliers.map(supplier => ({ value: supplier, label: supplier }));
    }, [receivings]);

    const itemOptions = useMemo(() => {
        return items.map(item => ({ value: item.id, label: `${item.name} (${item.sku})` }));
    }, [items]);

    const supplierFormOptions = useMemo(() => {
        return suppliers.map(supplier => ({ value: supplier.id, label: supplier.name }));
    }, [suppliers]);

    // --- HANDLERS ---
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        reset();
    };

    const openDetailsModal = (receiving: any) => {
        setSelectedReceiving(receiving);
        setEditData({
            item_id: receiving.item_id || '',
            supplier_id: receiving.supplier_id || '',
            quantity: receiving.quantity || '',
            date_received: receiving.date_received || '',
        });
        setIsDetailsModalOpen(true);
        setIsEditMode(false);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedReceiving(null);
        setIsEditMode(false);
        resetEdit();
    };

    const handleVoid = (receivingId: number) => {
        if (confirm('Are you sure you want to void this receiving record? This action cannot be undone.')) {
            router.delete(route('inventory.receiving.destroy', receivingId), {
                onSuccess: () => {
                    // Refresh the page or update state
                    window.location.reload();
                },
            });
        }
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('inventory.receiving.update', selectedReceiving.id), {
            onSuccess: () => {
                closeDetailsModal();
                window.location.reload();
            },
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('inventory.receiving.store'), {
            onSuccess: () => closeModal(),
        });
    };

    // --- FILTERING LOGIC ---
    const filteredReceivings = useMemo(() => {
        return receivings.filter(item => {
            // 1. Search Filter (Item Name OR SKU)
            const lowerTerm = searchTerm.toLowerCase();
            const matchesSearch = 
                item.item.toLowerCase().includes(lowerTerm) || 
                (item.sku && item.sku.toLowerCase().includes(lowerTerm)); // Added SKU search logic
            
            // 2. Supplier Filter
            const matchesSupplier = filterSupplier ? item.supplier === filterSupplier.value : true;

            return matchesSearch && matchesSupplier;
        });
    }, [receivings, searchTerm, filterSupplier]);

    // --- CUSTOM STYLES FOR REACT SELECT (GREEN THEME) ---
    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            paddingLeft: '0.5rem',
            borderRadius: '0.5rem',
            borderColor: '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(22, 163, 74, 0.2)' : provided.boxShadow,
            '&:hover': { borderColor: '#16a34a' },
            minHeight: '42px',
            fontSize: '0.875rem',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#15803d' : state.isFocused ? '#dcfce7' : null,
            color: state.isSelected ? 'white' : '#1f2937',
            cursor: 'pointer',
            fontSize: '0.875rem',
        }),
        input: (provided: any) => ({ ...provided, color: '#1f2937' }),
        singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
    };

    const modules = getSidebarModules('Inventory', 'Receiving');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="Inventory - Receiving" />

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
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Inventory Management</h2>
                        <p className="text-sm text-gray-500">Incoming stock and supplier deliveries.</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <span className="block text-sm font-bold text-gray-800">
                                {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-500 uppercase tracking-wide font-medium">
                                {new Date().toLocaleDateString('en-US', { weekday: 'long' })}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="p-8 max-w-[1600px] mx-auto">
                    
                    {/* Content Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        
                        {/* Card Header & Actions */}
                        <div className="px-8 py-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/30">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Inventory Receiving</h3>
                                <p className="text-xs text-gray-500 mt-1">Handle incoming inventory, verify counts, and update stock.</p>
                            </div>
                            
                            {/* Filters Container */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                                {/* Search Input */}
                                <div className="relative flex-grow sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search item or SKU..." 
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 shadow-sm"
                                    />
                                </div>

                                {/* Supplier Filter */}
                                <div className="w-full sm:w-56">
                                    <Select
                                        value={filterSupplier}
                                        onChange={setFilterSupplier}
                                        options={supplierOptions}
                                        placeholder="Filter by Supplier"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                <button 
                                    onClick={openModal}
                                    className="bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Record New Receiving
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-green-900 uppercase">Item Received</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-green-900 uppercase">Quantity</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-green-900 uppercase">Supplier</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-green-900 uppercase">Date Received</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-right text-green-900 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredReceivings.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-8 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"></path></svg>
                                                    <p>No receiving records found.</p>
                                                    {(searchTerm || filterSupplier) && (
                                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredReceivings.map((receiving, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                                {/* UPDATED COLUMN WITH SKU */}
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <div className="text-sm font-bold text-gray-900">{receiving.item}</div>
                                                    <div className="text-xs text-gray-500">SKU: {receiving.sku || 'N/A'}</div>
                                                </td>
                                                
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    <span className="text-green-600 mr-1">+</span>{receiving.quantity} <span className="text-gray-400 text-xs font-normal">pcs</span>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
                                                            {receiving.supplier.charAt(0)}
                                                        </div>
                                                        {receiving.supplier}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 font-mono">{receiving.date}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                    <button 
                                                        onClick={() => openDetailsModal(receiving)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                                                    >
                                                        Details
                                                    </button>
                                                    <button 
                                                        onClick={() => handleVoid(receiving.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                    >
                                                        Void
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <span className="text-xs text-gray-500">Showing {filteredReceivings.length} of {receivings.length} records</span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Previous</button>
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Next</button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* --- MODAL --- */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={!processing ? closeModal : undefined}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all scale-100 overflow-hidden border border-red-100">
                        <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 rounded-lg text-red-900">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Record New Receiving</h3>
                                    <p className="text-xs text-gray-500 font-medium">Add incoming inventory details</p>
                                </div>
                            </div>
                            <button 
                                onClick={closeModal}
                                disabled={processing}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Item</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                    </div>
                                    <div className="pl-10">
                                        <Select
                                            value={itemOptions.find(option => option.value === data.item_id)}
                                            onChange={(selected) => setData('item_id', selected?.value || '')}
                                            options={itemOptions}
                                            placeholder="Select an item"
                                            styles={{
                                                ...customSelectStyles,
                                                control: (provided: any, state: any) => ({
                                                    ...provided,
                                                    paddingLeft: '0.5rem',
                                                    borderRadius: '0.75rem',
                                                    borderColor: state.isFocused ? '#dc2626' : '#d1d5db',
                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : provided.boxShadow,
                                                    '&:hover': { borderColor: '#dc2626' },
                                                    minHeight: '42px',
                                                    fontSize: '0.875rem',
                                                    backgroundColor: 'white',
                                                }),
                                                option: (provided: any, state: any) => ({
                                                    ...provided,
                                                    backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : null,
                                                    color: state.isSelected ? 'white' : '#1f2937',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                }),
                                                input: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                            }}
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                </div>
                                {errors.item_id && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.item_id}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Supplier</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                    </div>
                                    <div className="pl-10">
                                        <Select
                                            value={supplierFormOptions.find(option => option.value === data.supplier_id)}
                                            onChange={(selected) => setData('supplier_id', selected?.value || '')}
                                            options={supplierFormOptions}
                                            placeholder="Select a supplier"
                                            styles={{
                                                ...customSelectStyles,
                                                control: (provided: any, state: any) => ({
                                                    ...provided,
                                                    paddingLeft: '0.5rem',
                                                    borderRadius: '0.75rem',
                                                    borderColor: state.isFocused ? '#dc2626' : '#d1d5db',
                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : provided.boxShadow,
                                                    '&:hover': { borderColor: '#dc2626' },
                                                    minHeight: '42px',
                                                    fontSize: '0.875rem',
                                                    backgroundColor: 'white',
                                                }),
                                                option: (provided: any, state: any) => ({
                                                    ...provided,
                                                    backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : null,
                                                    color: state.isSelected ? 'white' : '#1f2937',
                                                    cursor: 'pointer',
                                                    fontSize: '0.875rem',
                                                }),
                                                input: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                            }}
                                            classNamePrefix="react-select"
                                        />
                                    </div>
                                </div>
                                {errors.supplier_id && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.supplier_id}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Quantity</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h16"></path></svg>
                                    </div>
                                    <input
                                        type="number"
                                        value={data.quantity}
                                        onChange={(e) => setData('quantity', e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                                        ${errors.quantity ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
                                        min="1"
                                        placeholder="Enter quantity"
                                    />
                                </div>
                                {errors.quantity && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.quantity}</p>}
                            </div>
                            <div className="group w-full">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Date Received</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                    </div>
                                    <input
                                        type="date"
                                        value={data.date_received}
                                        onChange={(e) => setData('date_received', e.target.value)}
                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                        focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                                        ${errors.date_received ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
                                    />
                                </div>
                                {errors.date_received && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.date_received}</p>}
                            </div>
                            <div className="pt-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 -m-8 px-8 py-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Save
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- DETAILS MODAL --- */}
            {isDetailsModalOpen && selectedReceiving && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={closeDetailsModal}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg transform transition-all scale-100 overflow-hidden border border-red-100">
                        <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-red-50 rounded-lg text-red-900">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">
                                        {isEditMode ? 'Edit Receiving Record' : 'Receiving Details'}
                                    </h3>
                                    <p className="text-xs text-gray-500 font-medium">Record #{selectedReceiving.id}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!isEditMode && (
                                    <button 
                                        onClick={() => setIsEditMode(true)}
                                        className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                    >
                                        Edit
                                    </button>
                                )}
                                <button 
                                    onClick={closeDetailsModal}
                                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                    aria-label="Close"
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-8">
                            {isEditMode ? (
                                <form onSubmit={handleUpdate} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="group w-full">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Item</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                                    </div>
                                                    <div className="pl-10">
                                                        <Select
                                                            value={itemOptions.find(option => option.value === editData.item_id)}
                                                            onChange={(selected) => setEditData('item_id', selected?.value || '')}
                                                            options={itemOptions}
                                                            placeholder="Select an item"
                                                            styles={{
                                                                ...customSelectStyles,
                                                                control: (provided: any, state: any) => ({
                                                                    ...provided,
                                                                    paddingLeft: '0.5rem',
                                                                    borderRadius: '0.75rem',
                                                                    borderColor: state.isFocused ? '#dc2626' : '#d1d5db',
                                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : provided.boxShadow,
                                                                    '&:hover': { borderColor: '#dc2626' },
                                                                    minHeight: '42px',
                                                                    fontSize: '0.875rem',
                                                                    backgroundColor: 'white',
                                                                }),
                                                                option: (provided: any, state: any) => ({
                                                                    ...provided,
                                                                    backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : null,
                                                                    color: state.isSelected ? 'white' : '#1f2937',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                }),
                                                                input: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                                singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                            }}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                </div>
                                                {editErrors.item_id && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{editErrors.item_id}</p>}
                                            </div>
                                            
                                            <div className="group w-full">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Supplier</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                                    </div>
                                                    <div className="pl-10">
                                                        <Select
                                                            value={supplierFormOptions.find(option => option.value === editData.supplier_id)}
                                                            onChange={(selected) => setEditData('supplier_id', selected?.value || '')}
                                                            options={supplierFormOptions}
                                                            placeholder="Select a supplier"
                                                            styles={{
                                                                ...customSelectStyles,
                                                                control: (provided: any, state: any) => ({
                                                                    ...provided,
                                                                    paddingLeft: '0.5rem',
                                                                    borderRadius: '0.75rem',
                                                                    borderColor: state.isFocused ? '#dc2626' : '#d1d5db',
                                                                    boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : provided.boxShadow,
                                                                    '&:hover': { borderColor: '#dc2626' },
                                                                    minHeight: '42px',
                                                                    fontSize: '0.875rem',
                                                                    backgroundColor: 'white',
                                                                }),
                                                                option: (provided: any, state: any) => ({
                                                                    ...provided,
                                                                    backgroundColor: state.isSelected ? '#7f1d1d' : state.isFocused ? '#fef2f2' : null,
                                                                    color: state.isSelected ? 'white' : '#1f2937',
                                                                    cursor: 'pointer',
                                                                    fontSize: '0.875rem',
                                                                }),
                                                                input: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                                singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                            }}
                                                            classNamePrefix="react-select"
                                                        />
                                                    </div>
                                                </div>
                                                {editErrors.supplier_id && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{editErrors.supplier_id}</p>}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div className="group w-full">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Quantity</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h16"></path></svg>
                                                    </div>
                                                    <input
                                                        type="number"
                                                        value={editData.quantity}
                                                        onChange={(e) => setEditData('quantity', e.target.value)}
                                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                                        focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                                                        ${editErrors.quantity ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
                                                        min="1"
                                                        placeholder="Enter quantity"
                                                    />
                                                </div>
                                                {editErrors.quantity && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{editErrors.quantity}</p>}
                                            </div>
                                            
                                            <div className="group w-full">
                                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Date Received</label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    </div>
                                                    <input
                                                        type="date"
                                                        value={editData.date_received}
                                                        onChange={(e) => setEditData('date_received', e.target.value)}
                                                        className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                                        focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                                                        ${editErrors.date_received ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
                                                    />
                                                </div>
                                                {editErrors.date_received && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{editErrors.date_received}</p>}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setIsEditMode(false)}
                                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                                        >
                                            Cancel Edit
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={editProcessing}
                                            className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                                        >
                                            {editProcessing ? (
                                                <>
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                    Update Record
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Item</label>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{selectedReceiving.item}</p>
                                                        <p className="text-xs text-gray-500">SKU: {selectedReceiving.sku}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Supplier</label>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                                    </div>
                                                    <p className="font-semibold text-gray-900">{selectedReceiving.supplier}</p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h16"></path></svg>
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{selectedReceiving.quantity} pcs</p>
                                                        <p className="text-xs text-green-600 font-medium">+{selectedReceiving.quantity} added to inventory</p>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Date Received</label>
                                                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                    <div className="p-2 bg-white rounded-lg border border-gray-200">
                                                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                                    </div>
                                                    <p className="font-semibold text-gray-900">{selectedReceiving.date}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <div className="text-xs text-gray-500">
                                                Created: {new Date().toLocaleDateString()} • ID: #{selectedReceiving.id}
                                            </div>
                                            <div className="flex gap-3">
                                                <button 
                                                    onClick={closeDetailsModal}
                                                    className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200"
                                                >
                                                    Close
                                                </button>
                                                <button 
                                                    onClick={() => setIsEditMode(true)}
                                                    className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                                                >
                                                    Update Record
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}