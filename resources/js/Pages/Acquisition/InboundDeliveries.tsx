import { Head, Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react'; // Added useMemo
import Select from 'react-select';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import PurchaseOrder from '../../../Official Forms/PurchaseOrder';

// --- REUSABLE UI COMPONENTS (Internal) ---
// (Kept your existing Modal, Input, Select components exactly as they were)

const InventoryModal = ({ show, onClose, title, children, footer, isSubmitting }: any) => {
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
            <div 
                className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                onClick={!isSubmitting ? onClose : undefined}
            ></div>
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl transform transition-all scale-100 overflow-hidden border border-red-100 flex flex-col max-h-[90vh]">
                <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950 shrink-0"></div>
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">Create a new procurement record</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors disabled:opacity-50"
                        aria-label="Close"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                <div className="p-8 overflow-y-auto custom-scrollbar">
                    {children}
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 shrink-0">
                    {footer}
                </div>
            </div>
        </div>
    );
};

// --- MAIN COMPONENT ---

export default function InboundDeliveries({ auth, purchaseOrders }: { auth: any, purchaseOrders: any[] }) {
    const user = auth.user; 
    const [collapsed, setCollapsed] = useState(false);

    // --- Page Specific State ---
    const [successMessage, setSuccessMessage] = useState('');
    const [selectedPO, setSelectedPO] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);

    // --- FILTERS STATE (New) ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSupplier, setFilterSupplier] = useState<any>(null);
    const [filterMode, setFilterMode] = useState<any>(null);

    // --- Flash Messages ---
    const { flash } = usePage().props as any;

    useEffect(() => {
        if (flash?.success) {
            setSuccessMessage(flash.success);
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    }, [flash]);

    const procurementModeOptions = [
        { value: '', label: 'Select Procurement Mode' },
        { value: 'Public Bidding', label: 'Public Bidding' },
        { value: 'Small Value Procurement', label: 'Small Value Procurement' },
        { value: 'Direct Contracting', label: 'Direct Contracting' },
        { value: 'Shopping', label: 'Shopping' },
    ];

    // --- REACT SELECT STYLES (Red Theme) ---
    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            paddingLeft: '0.5rem',
            borderRadius: '0.5rem',
            borderColor: '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.2)' : provided.boxShadow, // red-600 ring
            '&:hover': { borderColor: '#dc2626' }, // red-600
            minHeight: '42px',
            fontSize: '0.875rem',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#991b1b' : state.isFocused ? '#fef2f2' : null, // red-800 selected, red-50 hover
            color: state.isSelected ? 'white' : '#1f2937',
            cursor: 'pointer',
            fontSize: '0.875rem',
        }),
        input: (provided: any) => ({ ...provided, color: '#1f2937' }),
        singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
    };

    const fundClusterOptions = [
        { value: '01', label: '01 - Regular Agency Fund' },
        { value: '05', label: '05 - Internally Generated Funds' },
        { value: '06', label: '06 - Business Related Funds' },
        { value: '07', label: '07 - Trust Receipts' }
    ];

    // --- FILTERING LOGIC (New) ---
    const dataSource = purchaseOrders;

    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set(dataSource.map(po => po.supplier));
        return Array.from(suppliers).map(s => ({ value: s, label: s }));
    }, [dataSource]);

    const filteredPOs = useMemo(() => {
        return dataSource.filter(po => {
            // 1. Search (PO Number or End User)
            const lowerTerm = searchTerm.toLowerCase();
            const matchesSearch = 
                po.po_number.toLowerCase().includes(lowerTerm) || 
                po.end_user.toLowerCase().includes(lowerTerm);

            // 2. Supplier Filter
            const matchesSupplier = filterSupplier ? po.supplier === filterSupplier.value : true;

            // 3. Mode Filter
            const matchesMode = filterMode ? po.mode === filterMode.value : true;

            return matchesSearch && matchesSupplier && matchesMode;
        });
    }, [dataSource, searchTerm, filterSupplier, filterMode]);

    const handleView = (po: any) => {
        setSelectedPO(po);
        setIsViewModalOpen(true);
    };

    const handleEdit = (po: any) => {
        router.visit(`/acquisition/procurement-panel/${po.id}`);
    };

    const modules = getSidebarModules('Acquisition', 'Inbound Deliveries');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="Inbound Deliveries" />

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
                        <h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Inbound Deliveries</h2>
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

                <div className="p-8 space-y-8 max-w-[1600px] mx-auto">

                    {/* Header & Create Button */}
                    <div className="flex justify-between items-center">
                        <p className="text-gray-500">Manage inbound deliveries and track purchase order receipts.</p>
                        <Link 
                            href="/acquisition/procurement-panel"
                            className="bg-red-900 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out flex items-center shadow-lg transform hover:-translate-y-0.5"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Procurement Panel
                        </Link>
                    </div>

                    {/* Success Message */}
                    {successMessage && (
                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-green-800">{successMessage}</p>
                            </div>
                            <button
                                onClick={() => setSuccessMessage('')}
                                className="flex-shrink-0 text-green-600 hover:text-green-800 transition-colors"
                                aria-label="Dismiss"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Stats / Summary Cards (Unchanged) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                         {[
                            { label: 'Total Orders', value: '24', sub: 'This Month', trend: '+4', trendUp: true, color: 'text-blue-600', bg: 'bg-blue-50', icon: modules[1].icon },
                            { label: 'Active Suppliers', value: '12', sub: 'Currently Engaged', trend: 'Stable', trendUp: true, color: 'text-purple-600', bg: 'bg-purple-50', icon: modules[2].icon },
                            { label: 'Total Spend', value: '₱45,200', sub: 'Year to Date', trend: '+12%', trendUp: false, color: 'text-gray-600', bg: 'bg-gray-50', icon: modules[0].icon },
                        ].map((stat, i) => (
                            <div key={i} className="group bg-white rounded-2xl p-6 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 transition-all duration-300">
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-3.5 rounded-xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform duration-300`}>
                                        {stat.icon}
                                    </div>
                                    <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${stat.trendUp ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {stat.trend}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
                                    <p className="text-sm font-semibold text-gray-600 mt-1">{stat.label}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{stat.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Main Content Card (Table) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        
                        {/* Table Header with Filters */}
                        <div className="px-8 py-6 border-b border-gray-100 flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-gray-50/30">
                            
                            {/* Search */}
                            <div className="relative flex-grow xl:max-w-xs w-full">
                                <input 
                                    type="text" 
                                    placeholder="Search PO Number or End User..." 
                                    className="w-full border-gray-300 rounded-lg shadow-sm focus:border-red-500 focus:ring-red-500 text-sm pl-10 py-2.5"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>

                            {/* Filter Controls */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                                {/* Supplier Filter */}
                                <div className="w-full sm:w-56">
                                    <Select
                                        value={filterSupplier}
                                        onChange={setFilterSupplier}
                                        options={uniqueSuppliers}
                                        placeholder="Filter by Supplier"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                {/* Mode Filter */}
                                <div className="w-full sm:w-56">
                                    <Select
                                        value={filterMode}
                                        onChange={setFilterMode}
                                        options={procurementModeOptions.filter(o => o.value !== '')}
                                        placeholder="Filter by Mode"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                <button className="text-sm font-semibold text-red-700 hover:text-red-900 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-100 flex items-center justify-center whitespace-nowrap">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Export
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">PO Number</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Supplier</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Date</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Mode</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Fund Cluster</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">End User</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Department</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-gray-500 uppercase">Total</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-right text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredPOs.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-8 py-12 text-center text-gray-500">
                                                <p>No purchase orders found matching your criteria.</p>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredPOs.map((po, index) => (
                                            <tr key={index} className="hover:bg-red-50/30 transition-colors group">
                                                <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-red-900 cursor-pointer hover:underline">{po.po_number}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900 font-medium">{po.supplier}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">{new Date(po.date).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 italic">{po.mode}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500">
                                                    <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2.5 py-1 rounded border border-gray-200">
                                                        {fundClusterOptions.find(option => option.value === po.fund_cluster)?.label || po.fund_cluster}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-700">{po.end_user}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-700">{po.department}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-900 font-bold">₱{parseFloat(po.total).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleView(po)} className="text-red-600 hover:text-red-900 mr-4 font-bold">View</button>
                                                    <button onClick={() => handleEdit(po)} className="text-gray-400 hover:text-gray-600">Edit</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Showing {filteredPOs.length} of {dataSource.length} records
                            </span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Previous</button>
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Next</button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            {/* --- VIEW MODAL (Unchanged) --- */}
            <InventoryModal 
                show={isViewModalOpen} 
                onClose={() => { setIsViewModalOpen(false); setSelectedPO(null); }}
                title="View Procurement Details"
                isSubmitting={false}
                footer={
                    <button
                        type="button"
                        onClick={() => { setIsViewModalOpen(false); setSelectedPO(null); }}
                        className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all"
                    >
                        Close
                    </button>
                }
            >
                {selectedPO && (
                    <div className="space-y-6">
                        <PurchaseOrder
                            po_number={selectedPO.po_number}
                            date_of_purchase={selectedPO.date}
                            mode_of_procurement={selectedPO.mode}
                            // Add other props as needed
                        />
                    </div>
                )}
            </InventoryModal>
        </div>
    );
}
