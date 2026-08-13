import ApplicationLogo from '@/Components/ApplicationLogo';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import Modal from '@/Components/Modal';
import { Head, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
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

    const [showFormSuccessModal, setShowFormSuccessModal] = useState(false);
    const [showFormErrorModal, setShowFormErrorModal] = useState(false);
    const [formSuccessMessage, setFormSuccessMessage] = useState('');

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
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // --- RFID SCAN MODAL STATE ---
    const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);
    const [rfidScanInput, setRfidScanInput] = useState('');
    const [scannedItemMatch, setScannedItemMatch] = useState<any>(null);
    const [rfidErrorMsg, setRfidErrorMsg] = useState('');

    const handleRfidScanLookup = (scannedCode: string) => {
        const cleanTag = scannedCode.trim().toUpperCase();
        if (!cleanTag) return;

        setRfidScanInput(cleanTag);
        const match = items.find(i => i.rfid_tag && i.rfid_tag.trim().toUpperCase() === cleanTag);

        if (match) {
            setScannedItemMatch(match);
            setRfidErrorMsg('');
        } else {
            setScannedItemMatch(null);
            setRfidErrorMsg(`No item associated with RFID tag '${cleanTag}'. Please assign this tag in the RFID Tagging page first.`);
        }
    };

    const handleConfirmRfidReceive = () => {
        if (!scannedItemMatch) return;

        // Find supplier ID associated with item
        const matchingSupplierId = scannedItemMatch.supplier_id || (suppliers.length > 0 ? suppliers[0].id : '');

        setData({
            item_id: scannedItemMatch.id,
            supplier_id: matchingSupplierId,
            quantity: '1',
            date_received: new Date().toISOString().split('T')[0],
        });

        setIsRfidModalOpen(false);
        setRfidScanInput('');
        setScannedItemMatch(null);
        setRfidErrorMsg('');
        setIsModalOpen(true);
    };

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

    const handleUpdateAction = (receiving: any) => {
        setSelectedReceiving(receiving);
        setEditData({
            item_id: receiving.item_id || '',
            supplier_id: receiving.supplier_id || '',
            quantity: receiving.quantity || '',
            date_received: receiving.date_received || '',
        });
        setIsDetailsModalOpen(true);
        setIsEditMode(true);
    };

    const handleUpdate = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('inventory.receiving.update', selectedReceiving.id), {
            onSuccess: () => {
                closeDetailsModal();
                setFormSuccessMessage('The receiving record was successfully updated.');
                setShowFormSuccessModal(true);
            },
            onError: () => {
                setShowFormErrorModal(true);
            }
        });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('inventory.receiving.store'), {
            onSuccess: () => {
                closeModal();
                setFormSuccessMessage('The new receiving record was successfully created.');
                setShowFormSuccessModal(true);
            },
            onError: () => {
                setShowFormErrorModal(true);
            }
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

    const totalPages = Math.max(1, Math.ceil(filteredReceivings.length / rowsPerPage));
    const paginatedReceivings = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredReceivings.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredReceivings, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterSupplier, receivings]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

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
                        
                                <div className="mb-2">
                                    <Breadcrumbs items={[{name:'Inventory'},{name:'Receiving'}]} />
                                </div>
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
                                    onClick={() => {
                                        setRfidScanInput('');
                                        setScannedItemMatch(null);
                                        setRfidErrorMsg('');
                                        setIsRfidModalOpen(true);
                                    }}
                                    className="bg-gradient-to-r from-[#800000] to-[#600000] hover:from-[#600000] hover:to-[#400000] text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4 text-[#FFD700]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"></path></svg>
                                    Scan RFID to Receive
                                </button>

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
                                        paginatedReceivings.map((receiving, index) => (
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
                                                        View
                                                    </button>
                                                    <button 
                                                        onClick={() => handleUpdateAction(receiving)}
                                                        className="text-green-600 hover:text-green-900 transition-colors"
                                                    >
                                                        Update
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <span className="text-xs text-gray-500">Showing {paginatedReceivings.length} of {filteredReceivings.length} filtered records</span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* --- MODAL --- */}
            <Modal show={isModalOpen} onClose={() => !processing && closeModal()} maxWidth="md" closeable={!processing}>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-red-100">
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
                                className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
            </Modal>

            {/* --- DETAILS MODAL --- */}
            <Modal show={isDetailsModalOpen && Boolean(selectedReceiving)} onClose={closeDetailsModal} maxWidth="lg">
                {selectedReceiving && (
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-red-100">
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

                                    <div className="pt-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between -m-8 px-8 py-5 mt-8">
                                        <button
                                            type="button"
                                            onClick={() => setIsEditMode(false)}
                                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                                        >
                                            ← Back to Details
                                        </button>
                                        <div className="flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={closeDetailsModal}
                                                disabled={editProcessing}
                                                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 disabled:opacity-50"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={editProcessing}
                                                className="px-6 py-2.5 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
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
                                    </div>
                                </form>
                            ) : (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Item Details</p>
                                                <p className="font-semibold text-gray-900">{selectedReceiving.item}</p>
                                                <p className="text-xs text-gray-500">SKU: {selectedReceiving.sku}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Supplier</p>
                                                <p className="font-semibold text-gray-900">{selectedReceiving.supplier}</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Quantity</p>
                                                <p className="font-semibold text-gray-900">{selectedReceiving.quantity} pcs</p>
                                                <p className="text-xs text-green-600 font-medium">+{selectedReceiving.quantity} added to inventory</p>
                                            </div>
                                        </div>

                                        <div className="p-4 bg-gray-50/70 rounded-xl border border-gray-100 space-y-3">
                                            <div>
                                                <p className="text-xs text-gray-500 font-medium">Date Received</p>
                                                <p className="font-semibold text-gray-900">{selectedReceiving.date}</p>
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
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </Modal>

            {/* FORM SUCCESS MODAL */}
            <Modal show={showFormSuccessModal} onClose={() => setShowFormSuccessModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-green-100 text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-green-500 to-green-600"></div>
                    <div className="p-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                            <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Success!</h3>
                        <p className="text-sm text-gray-500 mb-8">{formSuccessMessage}</p>
                        <button
                            onClick={() => setShowFormSuccessModal(false)}
                            className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md focus:outline-none transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* FORM ERROR MODAL */}
            <Modal show={showFormErrorModal} onClose={() => setShowFormErrorModal(false)} maxWidth="sm">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-red-100 text-center">
                    <div className="h-2 w-full bg-gradient-to-r from-red-500 to-red-600"></div>
                    <div className="p-8">
                        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
                            <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Operation Failed</h3>
                        <p className="text-sm text-gray-500 mb-8">Please check the form for completeness or errors and try again.</p>
                        <button
                            onClick={() => setShowFormErrorModal(false)}
                            className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md focus:outline-none transition-all"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </Modal>

            {/* RFID RECEIVING SCANNER MODAL */}
            <Modal show={isRfidModalOpen} onClose={() => setIsRfidModalOpen(false)} maxWidth="md">
                <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-red-100">
                    <div className="h-2 w-full bg-gradient-to-r from-[#800000] via-red-800 to-[#800000]"></div>
                    <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-50 rounded-xl text-[#800000]">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 tracking-tight">Scan RFID to Identify Item</h3>
                                <p className="text-xs text-gray-500 font-medium">Automatic item lookup & receiving pre-fill</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsRfidModalOpen(false)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-full transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="block text-xs font-bold uppercase text-gray-500 tracking-wider">
                                Scan RFID Tag or Enter ID
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={rfidScanInput}
                                    onChange={(e) => handleRfidScanLookup(e.target.value)}
                                    placeholder="Scan or type RFID tag (e.g. RFID-8A72F91C)..."
                                    className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#800000]/20 focus:border-[#800000]"
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* MATCH FOUND CARD */}
                        {scannedItemMatch && (
                            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 animate-in fade-in zoom-in-95">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                                        Item Identified Successfully ✓
                                    </span>
                                    <span className="text-xs font-mono font-bold text-[#800000]">{scannedItemMatch.rfid_tag}</span>
                                </div>
                                <h4 className="text-base font-bold text-gray-900">{scannedItemMatch.name}</h4>
                                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                    <div>
                                        <span className="text-gray-400">Property No / SKU:</span>
                                        <p className="font-semibold text-gray-800 font-mono">{scannedItemMatch.sku || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-400">Supplier:</span>
                                        <p className="font-semibold text-gray-800">{scannedItemMatch.supplier_name || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ERROR BANNER */}
                        {rfidErrorMsg && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-900 space-y-2">
                                <div className="flex items-center gap-2 font-bold text-red-700">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                                    <span>Tag Not Found</span>
                                </div>
                                <p>{rfidErrorMsg}</p>
                                <button
                                    type="button"
                                    onClick={() => router.visit(route('rfid-scanner.index'))}
                                    className="px-3 py-1.5 bg-[#800000] text-white font-bold rounded-lg text-xs hover:bg-[#600000] transition-colors"
                                >
                                    Go to RFID Tagging Console →
                                </button>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsRfidModalOpen(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmRfidReceive}
                                disabled={!scannedItemMatch}
                                className={`px-5 py-2 text-xs font-bold text-white rounded-xl transition-all ${
                                    scannedItemMatch
                                    ? 'bg-[#800000] hover:bg-[#600000] shadow-md shadow-[#800000]/20'
                                    : 'bg-gray-300 cursor-not-allowed'
                                }`}
                            >
                                Proceed to Receiving →
                            </button>
                        </div>
                    </div>
                </div>
            </Modal>
        </div>
    );
}