import ApplicationLogo from '@/Components/ApplicationLogo';
import Sidebar from '@/Components/Sidebar';
import { Head, Link, router } from '@inertiajs/react';
import { useState, useMemo } from 'react'; // Added useMemo
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';

type IssuanceItem = {
    item_id: string;
    quantity: string;
};

export default function Issuance({ auth, issuances, items }: { auth: any, issuances: any[], items: any[] }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);

    // --- MODAL STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState<any>(null);

    // --- FORM STATE ---
    const [recipient, setRecipient] = useState('');
    const [dateIssued, setDateIssued] = useState(new Date().toISOString().split('T')[0]);
    const [department, setDepartment] = useState('');
    const [fundCluster, setFundCluster] = useState<any>(null);
    const [recipientDesignation, setRecipientDesignation] = useState('');
    const [purpose, setPurpose] = useState('');
    const [approvedBy, setApprovedBy] = useState('');
    const [approvedByDesignation, setApprovedByDesignation] = useState('');
    const [issuanceItems, setIssuanceItems] = useState<IssuanceItem[]>([{ item_id: '', quantity: '' }]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState<any>({});

    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRecipient, setFilterRecipient] = useState<any>(null);
    const [filterStatus, setFilterStatus] = useState<any>(null);

    // --- DERIVED DATA (DROPDOWN OPTIONS) ---
    const itemOptions = items.map(item => ({ value: item.id, label: `${item.name} (${item.sku})` }));

    const fundClusterOptions = [
        { value: '01', label: '01 - Regular Agency Fund' },
        { value: '05', label: '05 - Internally Generated Funds' },
        { value: '06', label: '06 - Business Related Funds' },
        { value: '07', label: '07 - Trust Receipts' }
    ];

    const recipientOptions = useMemo(() => {
        const uniqueRecipients = Array.from(new Set(issuances.map(i => i.recipient)));
        return uniqueRecipients.map(r => ({ value: r, label: r }));
    }, [issuances]);

    // --- FILTERING LOGIC ---
    const filteredIssuances = useMemo(() => {
        return issuances.filter(issuance => {
            // 1. Search Filter (Item Name OR Recipient)
            const lowerTerm = searchTerm.toLowerCase();
            const matchesSearch = 
                issuance.item.toLowerCase().includes(lowerTerm) || 
                issuance.recipient.toLowerCase().includes(lowerTerm);
            
            // 2. Recipient Filter
            const matchesRecipient = filterRecipient ? issuance.recipient === filterRecipient.value : true;

            // 3. Status Filter
            const matchesStatus = filterStatus ? issuance.status === filterStatus.value : true;

            return matchesSearch && matchesRecipient && matchesStatus;
        });
    }, [issuances, searchTerm, filterRecipient, filterStatus]);

    // --- CUSTOM STYLES FOR REACT SELECT (ORANGE THEME) ---
    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            paddingLeft: '0.5rem',
            borderRadius: '0.5rem',
            borderColor: '#d1d5db', // gray-300
            boxShadow: state.isFocused ? '0 0 0 2px rgba(234, 88, 12, 0.2)' : provided.boxShadow, // orange-600 ring
            '&:hover': { borderColor: '#ea580c' }, // orange-600
            minHeight: '42px',
            fontSize: '0.875rem',
        }),
        option: (provided: any, state: any) => ({
            ...provided,
            backgroundColor: state.isSelected ? '#c2410c' : state.isFocused ? '#ffedd5' : null, // orange-700 selected, orange-100 hover
            color: state.isSelected ? 'white' : '#1f2937',
            cursor: 'pointer',
            fontSize: '0.875rem',
        }),
        input: (provided: any) => ({ ...provided, color: '#1f2937' }),
        singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
    };

    // --- HANDLERS (Unchanged) ---
    const openModal = () => setIsModalOpen(true);
    const closeModal = () => {
        setIsModalOpen(false);
        setRecipient('');
        setDateIssued(new Date().toISOString().split('T')[0]);
        setDepartment('');
        setFundCluster(null);
        setRecipientDesignation('');
        setPurpose('');
        setApprovedBy('');
        setApprovedByDesignation('');
        setIssuanceItems([{ item_id: '', quantity: '' }]);
        setErrors({});
    };

    const addItem = () => {
        setIssuanceItems([...issuanceItems, { item_id: '', quantity: '' }]);
    };

    const removeItem = (index: number) => {
        if (issuanceItems.length > 1) {
            setIssuanceItems(issuanceItems.filter((_, i) => i !== index));
        }
    };

    const updateItem = (index: number, field: keyof IssuanceItem, value: string) => {
        const newItems = [...issuanceItems];
        newItems[index][field] = value;
        setIssuanceItems(newItems);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        const data = {
            recipient,
            date_issued: dateIssued,
            department,
            fund_cluster: fundCluster?.value || '',
            recipient_designation: recipientDesignation,
            purpose,
            approved_by: approvedBy,
            approved_by_designation: approvedByDesignation,
            issuances: issuanceItems.filter(item => item.item_id && item.quantity),
        };

        router.post(route('inventory.issuance.store'), data, {
            onSuccess: () => {
                closeModal();
                setProcessing(false);
            },
            onError: (err) => {
                setErrors(err);
                setProcessing(false);
            },
        });
    };

    const handleVoid = (issuanceId: number) => {
        if (confirm('Are you sure you want to archive this issuance record?')) {
            router.put(route('inventory.issuance.update', issuanceId), { status: 'Cancelled' }, {
                onSuccess: () => {
                    // Optionally refresh the page or update state
                },
            });
        }
    };

    const handleDetails = (issuance: any) => {
        setSelectedIssuance(issuance);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedIssuance(null);
    };

    // Sidebar Modules
    const modules = getSidebarModules('Inventory', 'Issuance');
    
    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="Inventory - Issuance" />

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
                        <p className="text-sm text-gray-500">Stock distribution and issuance records.</p>
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
                                <h3 className="text-lg font-bold text-gray-900">Inventory Issuance</h3>
                                <p className="text-xs text-gray-500 mt-1">Track items released to faculty and departments.</p>
                            </div>
                            
                            {/* Filter Controls Container */}
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
                                        placeholder="Search item or recipient..." 
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500 shadow-sm"
                                    />
                                </div>

                                {/* Recipient Filter */}
                                <div className="w-full sm:w-48">
                                    <Select
                                        value={filterRecipient}
                                        onChange={setFilterRecipient}
                                        options={recipientOptions}
                                        placeholder="Recipient"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                {/* Status Filter */}
                                <div className="w-full sm:w-40">
                                    <Select
                                        value={filterStatus}
                                        onChange={setFilterStatus}
                                        options={[
                                            { value: 'Issued', label: 'Issued' },
                                            { value: 'Pending', label: 'Pending' },
                                            { value: 'Returned', label: 'Returned' },
                                            { value: 'Cancelled', label: 'Cancelled' }
                                        ]}
                                        placeholder="Status"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                {/* Action Button */}
                                <button 
                                    onClick={openModal}
                                    className="bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Record Issuance
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-red-50/50">
                                    <tr>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-red-900 uppercase">Item ID</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-red-900 uppercase">Item Issued</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-red-900 uppercase">Quantity</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-red-900 uppercase">Recipient / Dept.</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-red-900 uppercase">Date Issued</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-left text-red-900 uppercase">Status</th>
                                        <th className="px-8 py-4 text-xs font-bold tracking-wider text-right text-red-900 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredIssuances.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-8 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                                    <p>No issuance records found.</p>
                                                    {(searchTerm || filterRecipient || filterStatus) && (
                                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredIssuances.map((issuance, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">
                                                    {(() => {
                                                        const date = new Date(issuance.date);
                                                        const year = date.getFullYear();
                                                        const month = String(date.getMonth() + 1).padStart(2, '0');
                                                        const num = String(issuance.id).padStart(4, '0');
                                                        return `${year}-${month}-${num}`;
                                                    })()}
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm font-bold text-gray-900">{issuance.item}</td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                                                    {issuance.quantity} <span className="text-gray-400 text-xs font-normal">pcs</span>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-700">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs text-gray-500 font-bold">
                                                            {issuance.recipient.charAt(0)}
                                                        </div>
                                                        {issuance.recipient}
                                                    </div>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500 font-mono">{issuance.date}</td>
                                                <td className="px-8 py-5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        issuance.status === 'Issued' ? 'bg-green-100 text-green-800' : 
                                                        issuance.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {issuance.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium">
                                                    <button 
                                                        onClick={() => handleDetails(issuance)}
                                                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors"
                                                    >
                                                        Details
                                                    </button>
                                                    <button 
                                                        onClick={() => handleVoid(issuance.id)}
                                                        className="text-red-600 hover:text-red-900 transition-colors"
                                                    >
                                                        Archive
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination (Placeholder) */}
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex items-center justify-between">
                            <span className="text-xs text-gray-500">
                                Showing {filteredIssuances.length} of {issuances.length} records
                            </span>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Previous</button>
                                <button className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50" disabled>Next</button>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* ... MODALS (Keeping your existing Modals exactly as they were) ... */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={!processing ? closeModal : undefined}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 overflow-hidden border border-orange-100">
                        <div className="h-2 w-full bg-gradient-to-r from-orange-900 via-orange-800 to-orange-950"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 rounded-lg text-orange-900">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Record New Issuance</h3>
                                    <p className="text-xs text-gray-500 font-medium">Issue multiple items in one transaction</p>
                                </div>
                            </div>
                            <button 
                                onClick={closeModal}
                                disabled={processing}
                                className="text-gray-400 hover:text-orange-600 hover:bg-orange-50 p-2 rounded-full transition-colors disabled:opacity-50"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Recipient</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={recipient}
                                            onChange={(e) => setRecipient(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.recipient ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                            placeholder="Enter recipient name"
                                        />
                                    </div>
                                    {errors.recipient && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.recipient}</p>}
                                </div>
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Date Issued</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                        </div>
                                        <input
                                            type="date"
                                            value={dateIssued}
                                            onChange={(e) => setDateIssued(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.date_issued ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                        />
                                    </div>
                                    {errors.date_issued && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.date_issued}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Department</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.department ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                            placeholder="Enter department"
                                        />
                                    </div>
                                    {errors.department && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.department}</p>}
                                </div>
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Fund Cluster</label>
                                    <Select
                                        value={fundCluster}
                                        onChange={setFundCluster}
                                        options={fundClusterOptions}
                                        placeholder="Select fund cluster"
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                    {errors.fund_cluster && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.fund_cluster}</p>}
                                </div>
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Recipient Designation</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={recipientDesignation}
                                            onChange={(e) => setRecipientDesignation(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.recipient_designation ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                            placeholder="Enter recipient designation"
                                        />
                                    </div>
                                    {errors.recipient_designation && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.recipient_designation}</p>}
                                </div>
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Purpose</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={purpose}
                                            onChange={(e) => setPurpose(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.purpose ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                            placeholder="Enter purpose"
                                        />
                                    </div>
                                    {errors.purpose && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.purpose}</p>}
                                </div>
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Approved By</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={approvedBy}
                                            onChange={(e) => setApprovedBy(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.approved_by ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                            placeholder="Enter approver name"
                                        />
                                    </div>
                                    {errors.approved_by && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.approved_by}</p>}
                                </div>
                                <div className="group w-full">
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Approved By Designation</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                        </div>
                                        <input
                                            type="text"
                                            value={approvedByDesignation}
                                            onChange={(e) => setApprovedByDesignation(e.target.value)}
                                            className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                                            focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                            ${errors.approved_by_designation ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                            placeholder="Enter approver designation"
                                        />
                                    </div>
                                    {errors.approved_by_designation && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.approved_by_designation}</p>}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-gray-700">Items to Issue</label>
                                    <button
                                        type="button"
                                        onClick={addItem}
                                        className="text-orange-600 hover:text-orange-700 text-sm font-medium flex items-center gap-1"
                                    >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                        Add Item
                                    </button>
                                </div>
                                {issuanceItems.map((item, index) => (
                                    <div key={index} className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Item</label>
                                            <Select
                                                value={itemOptions.find(option => option.value === item.item_id)}
                                                onChange={(selected) => updateItem(index, 'item_id', selected?.value || '')}
                                                options={itemOptions}
                                                placeholder="Select item"
                                                styles={{
                                                    control: (provided: any, state: any) => ({
                                                        ...provided,
                                                        borderRadius: '0.5rem',
                                                        borderColor: state.isFocused ? '#ea580c' : '#d1d5db',
                                                        boxShadow: state.isFocused ? '0 0 0 2px rgba(234, 88, 12, 0.2)' : provided.boxShadow,
                                                        '&:hover': { borderColor: '#ea580c' },
                                                        minHeight: '38px',
                                                        fontSize: '0.875rem',
                                                    }),
                                                    option: (provided: any, state: any) => ({
                                                        ...provided,
                                                        backgroundColor: state.isSelected ? '#9a3412' : state.isFocused ? '#fed7aa' : null,
                                                        color: state.isSelected ? 'white' : '#1f2937',
                                                        cursor: 'pointer',
                                                        fontSize: '0.875rem',
                                                    }),
                                                    input: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                    singleValue: (provided: any) => ({ ...provided, color: '#1f2937' }),
                                                }}
                                                classNamePrefix="react-select"
                                            />
                                            {errors[`issuances.${index}.item_id`] && <p className="mt-1 text-xs text-red-600 font-medium">{errors[`issuances.${index}.item_id`]}</p>}
                                        </div>
                                        <div className="w-24">
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Qty</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                                                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm shadow-sm placeholder-gray-400
                                                focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200
                                                ${errors[`issuances.${index}.quantity`] ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-orange-500'}`}
                                                min="1"
                                                placeholder="Qty"
                                            />
                                            {errors[`issuances.${index}.quantity`] && <p className="mt-1 text-xs text-red-600 font-medium">{errors[`issuances.${index}.quantity`]}</p>}
                                        </div>
                                        {issuanceItems.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeItem(index)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                                title="Remove item"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {errors.issuances && <p className="mt-1 text-xs text-red-600 font-medium">{errors.issuances}</p>}
                            </div>

                            <div className="pt-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 -m-8 px-8 py-5">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={processing}
                                    className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-xl font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all duration-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="px-6 py-2.5 bg-gradient-to-r from-orange-700 to-orange-600 hover:from-orange-600 hover:to-orange-500 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {processing ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Issuing...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                            Issue Items
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isDetailsModalOpen && selectedIssuance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={closeDetailsModal}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 overflow-hidden border border-blue-100">
                        <div className="h-2 w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-900">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Issuance Details</h3>
                                    <p className="text-xs text-gray-500 font-medium">Record ID: #{selectedIssuance.id}</p>
                                </div>
                            </div>
                            <button 
                                onClick={closeDetailsModal}
                                className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Item Issued</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.item}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Quantity</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.quantity} pcs</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.recipient}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Issued</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.date}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                        selectedIssuance.status === 'Issued' ? 'bg-green-100 text-green-800' : 
                                        selectedIssuance.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {selectedIssuance.status}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issued By</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.issued_by || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                            <button
                                onClick={closeDetailsModal}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}