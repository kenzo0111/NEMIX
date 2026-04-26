import ApplicationLogo from '@/Components/ApplicationLogo';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect, useMemo } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';

// --- REUSABLE UI COMPONENTS (Internal) ---
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
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl transform transition-all scale-100 overflow-hidden border border-red-100">
                <div className="h-2 w-full bg-gradient-to-r from-red-900 via-red-800 to-red-950"></div>
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 rounded-lg text-red-900">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 tracking-tight">{title}</h3>
                            <p className="text-xs text-gray-500 font-medium">Add details to master list</p>
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
                <div className="p-8">
                    {children}
                </div>
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                    {footer}
                </div>
            </div>
        </div>
    );
};

const FormInput = ({ label, icon, error, ...props }: any) => (
    <div className="group w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                {icon}
            </div>
            <input 
                {...props}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200
                ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>}
    </div>
);

const FormTextarea = ({ label, icon, error, ...props }: any) => (
    <div className="group w-full">
        <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{label}</label>
        <div className="relative">
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none text-gray-400 group-focus-within:text-red-600 transition-colors">
                {icon}
            </div>
            <textarea 
                {...props}
                className={`w-full pl-10 pr-4 py-2.5 bg-white border rounded-xl text-sm shadow-sm placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-red-500/20 transition-all duration-200 min-h-[100px]
                ${error ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-red-500'}`}
            />
        </div>
        {error && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{error}</p>}
    </div>
);

const buildSupplierAcronym = (supplierName: string) => {
    if (!supplierName) return '';
    const words = supplierName.trim().split(/\s+/).slice(0, 3);
    const letters = words.map((word) => word.charAt(0).toUpperCase());
    while (letters.length < 3) letters.push('X');
    return letters.join('');
};

const generateNextSku = (items: any[], supplierName: string, supplierId: any) => {
    const acronym = buildSupplierAcronym(supplierName);
    if (!acronym) return '';

    const now = new Date();
    const year = String(now.getFullYear()).slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, '0');

    const supplierItems = items.filter((item) => String(item.supplier_id) === String(supplierId));
    const itemIndex = String(supplierItems.length + 1).padStart(3, '0');
    const sequence = '0001';

    return `${acronym}-${year}-${month}-${itemIndex}-${sequence}`;
};

const computeStatusFromStock = (stock: string | number) => {
    const quantity = Number(stock ?? 0);
    if (quantity === 0) return 'Out of Stock';
    if (quantity <= 20) return 'Low Stock';
    return 'Available';
};

// --- MAIN PAGE ---

export default function AllItems({ auth, items, categories, suppliers = [] }: { auth: any, items: any[], categories: any[], suppliers?: any[] }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

    // --- DELETE / SUCCESS MODAL STATE ---
    const [itemToDelete, setItemToDelete] = useState<any>(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // --- SUBMIT / SUCCESS / ERROR MODAL STATE ---
    const [showFormSuccessModal, setShowFormSuccessModal] = useState(false);
    const [showFormErrorModal, setShowFormErrorModal] = useState(false);
    const [formSuccessMessage, setFormSuccessMessage] = useState('');

    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<any>(null);
    const [filterSupplier, setFilterSupplier] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const rowsPerPage = 10;

    // --- FILTERING LOGIC ---
    const filteredItems = useMemo(() => {
        return items.filter(item => {
            const matchesSearch = 
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = filterStatus ? item.status === filterStatus.value : true;
            const matchesSupplier = filterSupplier ? String(item.supplier_id) === String(filterSupplier.value) : true;
            return matchesSearch && matchesStatus && matchesSupplier;
        });
    }, [items, searchTerm, filterStatus, filterSupplier]);

    const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
    const paginatedItems = useMemo(() => {
        const startIndex = (currentPage - 1) * rowsPerPage;
        return filteredItems.slice(startIndex, startIndex + rowsPerPage);
    }, [filteredItems, currentPage]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterStatus, filterSupplier, items]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    const customSelectStyles = {
        control: (provided: any, state: any) => ({
            ...provided,
            paddingLeft: '0.5rem',
            borderRadius: '0.5rem',
            borderColor: '#d1d5db',
            boxShadow: state.isFocused ? '0 0 0 2px rgba(220, 38, 38, 0.1)' : provided.boxShadow,
            '&:hover': { borderColor: '#ef4444' },
            minHeight: '42px',
            fontSize: '0.875rem',
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
    };

    const unitOfIssueOptions = [
        { value: 'pc', label: 'piece' },
        { value: 'box', label: 'box' },
        { value: 'pack', label: 'pack' },
        { value: 'ream', label: 'ream' },
        { value: 'sheet', label: 'sheet' },
        { value: 'roll', label: 'roll' },
        { value: 'set', label: 'set' },
        { value: 'carton', label: 'carton' },
        { value: 'bottle', label: 'bottle' },
        { value: 'tube', label: 'tube' },
        { value: 'unit', label: 'unit' },
        { value: 'bundle', label: 'bundle' },
        { value: 'crate', label: 'crate' },
        { value: 'packets', label: 'packets' },
    ];

    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        supplier_id: '',
        sku: '',
        stock: 0,
        unit_cost: '',
        amount: '',
        status: 'Available',
        description: '',
        unit_of_issue: '',
    });

    useEffect(() => {
        if (!isEditing && data.supplier_id && suppliers && suppliers.length > 0) {
            const selectedSupplier = suppliers.find((s: any) => String(s.id) === String(data.supplier_id));
            if (selectedSupplier && selectedSupplier.name) {
                setData('sku', generateNextSku(items, selectedSupplier.name, selectedSupplier.id));
            }
        }
    }, [data.supplier_id, isEditing, items, suppliers]);

    useEffect(() => {
        setData('status', computeStatusFromStock(data.stock));
    }, [data.stock]);

    const submit = (e: any) => {
        e.preventDefault();
        if (isEditing) {
            put(route('inventory.update', selectedItem.id), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setIsEditing(false);
                    setSelectedItem(null);
                    setFormSuccessMessage('The inventory item was successfully updated.');
                    setShowFormSuccessModal(true);
                },
                onError: () => {
                    setShowFormErrorModal(true);
                }
            });
        } else {
            post(route('inventory.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    setFormSuccessMessage('The new inventory item was successfully created.');
                    setShowFormSuccessModal(true);
                },
                onError: () => {
                    setShowFormErrorModal(true);
                }
            });
        }
    };

    const modules = getSidebarModules('Inventory', 'All Items');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="CNSC Supply Management Inventory" />

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
                                    <Breadcrumbs items={[{name:'Inventory'},{name:'All Items'}]} />
                                </div>
<h2 className="text-2xl font-bold text-red-950 font-serif tracking-tight">Inventory Management</h2>
                        <p className="text-sm text-gray-500">Master list of all consumable items.</p>
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
                        <div className="px-8 py-6 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gray-50/30">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">All Items</h3>
                                <p className="text-xs text-gray-500 mt-1">Manage stock levels, edit details, or remove items.</p>
                            </div>
                            
                            {/* Filter Controls Container */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                                <div className="relative flex-grow sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search name or SKU..." 
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:border-red-500 focus:ring-1 focus:ring-red-500 shadow-sm"
                                    />
                                </div>

                                <div className="w-full sm:w-40">
                                    <Select
                                        value={filterSupplier}
                                        onChange={setFilterSupplier}
                                        options={(suppliers || []).map(s => ({ value: s.id, label: s.name }))}
                                        placeholder="Supplier"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                <div className="w-full sm:w-40">
                                    <Select
                                        value={filterStatus}
                                        onChange={setFilterStatus}
                                        options={[
                                            { value: 'Available', label: 'Available' },
                                            { value: 'Low Stock', label: 'Low Stock' },
                                            { value: 'Out of Stock', label: 'Out of Stock' }
                                        ]}
                                        placeholder="Status"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                <button 
                                    onClick={() => {
                                        setIsEditing(false);
                                        setSelectedItem(null);
                                        reset();
                                        setData('sku', ''); // Will be updated on supplier select
                                        setShowModal(true);
                                    }}
                                    className="bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 text-white font-bold py-2 px-4 rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                    Add Item
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="w-full overflow-hidden">
                            <table className="w-full table-auto divide-y divide-gray-200">
                                <thead className="bg-red-50/50">
                                    <tr>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Item Name</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Supplier</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Unit of Issue</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Description</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Stock Level</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Unit Cost</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Amount</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-left text-red-900 uppercase">Status</th>
                                        <th className="px-4 py-3 text-[10px] font-bold tracking-wider text-right text-red-900 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {filteredItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-8 py-12 text-center text-gray-500">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path></svg>
                                                    <p>No items found.</p>
                                                    {(searchTerm || filterStatus || filterSupplier) && (
                                                        <p className="text-xs text-gray-400 mt-1">Try adjusting your filters.</p>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedItems.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-4 py-4 align-top max-w-[12rem] break-words">
                                                    <div className="text-sm font-bold text-gray-900">{item.name}</div>
                                                    <div className="text-xs text-gray-500">SKU: {item.sku || 'N/A'}</div>
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-600 break-words">
                                                    {item.supplier ? item.supplier.name : 'No Supplier'}
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-600">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-800">
                                                        {item.unit_of_issue || '-'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-600 max-w-[12rem] break-words">
                                                    <div title={item.description}>
                                                        {item.description || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-600 font-medium">
                                                    {Number(item.stock || 0).toLocaleString('en-US')} <span className="text-gray-400 text-xs font-normal">units</span>
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-600 font-medium">
                                                    ₱{Number(item.unit_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-4 align-top text-sm text-gray-600 font-medium">
                                                    ₱{Number(item.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 py-4 align-top">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                        item.status === 'Available' ? 'bg-green-100 text-green-800' : 
                                                        item.status === 'Low Stock' ? 'bg-orange-100 text-orange-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                                            item.status === 'Available' ? 'bg-green-500' : 
                                                            item.status === 'Low Stock' ? 'bg-orange-500' : 'bg-red-500'
                                                        }`}></span>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 align-top text-right text-sm font-medium">
                                                    <button 
                                                        onClick={() => {
                                                            setIsEditing(true);
                                                            setSelectedItem(item);
                                                            setData({
                                                                name: item.name,
                                                                supplier_id: item.supplier_id || '',
                                                                sku: item.sku || '',
                                                                stock: item.stock,
                                                                unit_cost: item.unit_cost || '',
                                                                amount: item.amount || '',
                                                                status: item.status,
                                                                description: item.description || '',
                                                                unit_of_issue: item.unit_of_issue || '',
                                                            });
                                                            setShowModal(true);
                                                        }}
                                                        className="text-blue-600 hover:text-blue-900 mr-4 transition-colors font-semibold text-xs uppercase tracking-wide"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setItemToDelete(item);
                                                            setShowDeleteModal(true);
                                                        }}
                                                        className="text-red-600 hover:text-red-900 transition-colors font-semibold text-xs uppercase tracking-wide"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination */}
                        <div className="px-8 py-4 border-t border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row items-center sm:justify-between gap-3">
                            <span className="text-xs text-gray-500">
                                Showing {paginatedItems.length} of {filteredItems.length} filtered records
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 border border-gray-300 rounded text-xs text-gray-600 hover:bg-white disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <span className="text-xs text-gray-500">Page {currentPage} of {totalPages}</span>
                                <button
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

            {/* MODAL & FORM (Unchanged) */}
            <InventoryModal 
                show={showModal} 
                onClose={() => {
                    setShowModal(false);
                    if (isEditing) {
                        setIsEditing(false);
                        setSelectedItem(null);
                        reset();
                    }
                }}
                title={isEditing ? "Edit Inventory Item" : "New Inventory Item"}
                isSubmitting={processing}
                footer={
                    <>
                        <button
                            type="button"
                            onClick={() => {
                                setShowModal(false);
                                if (isEditing) {
                                    setIsEditing(false);
                                    setSelectedItem(null);
                                    reset();
                                }
                            }}
                            className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-gray-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submit}
                            disabled={processing}
                            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-red-900 to-red-800 hover:from-red-800 hover:to-red-700 shadow-lg hover:shadow-red-900/30 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-900 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {processing ? 'Saving...' : isEditing ? 'Update Item' : 'Create Item'}
                        </button>
                    </>
                }
            >
                <form className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="group w-full">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Supplier</label>
                            <Select
                                value={suppliers?.find((s: any) => String(s.id) === String(data.supplier_id)) ? { value: data.supplier_id, label: suppliers.find((s: any) => String(s.id) === String(data.supplier_id)).name } : null}
                                onChange={(selectedOption: any) => setData('supplier_id', selectedOption ? selectedOption.value : '')}
                                options={(suppliers || []).map((s: any) => ({ value: s.id, label: s.name }))}
                                placeholder="Select a Supplier..."
                                styles={customSelectStyles}
                                isDisabled={isEditing}
                            />
                            {errors.supplier_id && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.supplier_id}</p>}
                        </div>
                        <div className="group w-full">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Status</label>
                            <input
                                value={data.status}
                                disabled
                                className="w-full pl-4 pr-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-sm shadow-sm text-gray-700"
                            />
                            <p className="mt-1 text-xs text-gray-500 ml-1">Status is computed automatically from the stock level.</p>
                            {errors.status && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.status}</p>}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <FormInput 
                                label="Item Name"
                                value={data.name}
                                onChange={(e: any) => setData('name', e.target.value)}
                                error={errors.name}
                                placeholder="e.g. Bond Paper A4"
                                required
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path></svg>}
                            />
                        </div>
                        <div>
                            <FormInput 
                                label="SKU / Code"
                                value={data.sku}
                                onChange={(e: any) => setData('sku', e.target.value)}
                                error={errors.sku}
                                placeholder="Auto-generated"
                                disabled={!isEditing}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v1m6 11h2m-6 0h-2v4h-4v-4H8m13-4V7a1 1 0 00-1-1H4a1 1 0 00-1 1v3M4 7h16"></path></svg>}
                            />
                            {!isEditing && (
                                <p className="mt-1 text-xs text-gray-500 ml-1">This SKU is generated automatically.</p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                        <div className="group w-full">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">Unit of Issue</label>
                            <Select
                                value={unitOfIssueOptions.find(option => option.value === data.unit_of_issue) || null}
                                onChange={(selectedOption: any) => setData('unit_of_issue', selectedOption ? selectedOption.value : '')}
                                options={unitOfIssueOptions}
                                placeholder="Select unit of issue"
                                styles={customSelectStyles}
                                isClearable
                                classNamePrefix="react-select"
                            />
                            {errors.unit_of_issue && <p className="mt-1 text-xs text-red-600 ml-1 font-medium">{errors.unit_of_issue}</p>}
                        </div>
                        <div>
                            <FormInput 
                                label="Initial Stock"
                                type="number"
                                value={data.stock}
                                onChange={(e: any) => {
                                    const newStock = parseInt(e.target.value) || 0;
                                    const cost = parseFloat(String(data.unit_cost)) || 0;
                                    setData((prev) => ({
                                        ...prev,
                                        stock: newStock,
                                        amount: (newStock * cost).toFixed(2),
                                        status: computeStatusFromStock(newStock),
                                    }));
                                }}
                                error={errors.stock}
                                min="0"
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path></svg>}
                            />
                        </div>
                        <div>
                            <FormInput 
                                label="Unit Cost"
                                type="number"
                                step="0.01"
                                value={data.unit_cost}
                                onChange={(e: any) => {
                                    const newCost = parseFloat(e.target.value) || 0;
                                    const stock = Number(data.stock) || 0;
                                    setData((prev) => ({
                                        ...prev,
                                        unit_cost: e.target.value,
                                        amount: (stock * newCost).toFixed(2),
                                        status: computeStatusFromStock(stock),
                                    }));
                                }}
                                error={errors.unit_cost}
                                min="0"
                                placeholder="0.00"
                                icon={<span className="text-gray-400 font-medium">₱</span>}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-5">
                        <div>
                            <FormTextarea 
                                label="Description"
                                value={data.description}
                                onChange={(e: any) => setData('description', e.target.value)}
                                error={errors.description}
                                placeholder="Add specifications, color, size, etc."
                                rows={4}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>}
                            />
                        </div>
                        <div>
                            <FormInput 
                                label="Amount"
                                type="number"
                                step="0.01"
                                value={data.amount}
                                onChange={(e: any) => setData('amount', e.target.value)}
                                error={errors.amount}
                                min="0"
                                placeholder="0.00"
                                disabled
                                className="bg-gray-100 w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm shadow-sm focus:outline-none"
                                icon={<span className="text-gray-400 font-medium">₱</span>}
                            />
                        </div>
                    </div>
                </form>
            </InventoryModal>

            {/* DELETE CONFIRMATION MODAL */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => !isDeleting && setShowDeleteModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100 overflow-hidden border border-red-100">
                        <div className="h-2 w-full bg-gradient-to-r from-red-600 to-red-800"></div>
                        <div className="p-6 text-center">
                            <svg className="mx-auto mb-4 text-red-500 w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                            <h3 className="mb-5 text-lg font-bold text-gray-900">Are you sure you want to delete <br/><span className="text-red-600">"{itemToDelete?.name}"</span>?</h3>
                            <p className="text-sm text-gray-500 mb-6">This action cannot be undone.</p>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setShowDeleteModal(false)}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none transition-all disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        if (itemToDelete) {
                                            setIsDeleting(true);
                                            router.delete(route('inventory.destroy', itemToDelete.id), {
                                                onSuccess: () => {
                                                    setIsDeleting(false);
                                                    setShowDeleteModal(false);
                                                    setShowSuccessModal(true);
                                                    setItemToDelete(null);
                                                },
                                                onError: () => {
                                                    setIsDeleting(false);
                                                }
                                            });
                                        }
                                    }}
                                    disabled={isDeleting}
                                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 shadow-md focus:outline-none transition-all disabled:opacity-50"
                                >
                                    {isDeleting ? 'Deleting...' : 'Yes, Delete'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS MODAL */}
            {showSuccessModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setShowSuccessModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100 overflow-hidden border border-green-100 text-center animate-fade-in-up">
                        <div className="h-2 w-full bg-gradient-to-r from-green-500 to-green-600"></div>
                        <div className="p-8">
                            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                                <svg className="h-8 w-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Item Deleted!</h3>
                            <p className="text-sm text-gray-500 mb-8">The inventory item has been successfully removed from your master list.</p>
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="w-full px-5 py-3 rounded-xl text-sm font-bold text-white bg-green-600 hover:bg-green-700 shadow-md focus:outline-none transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* FORM SUCCESS MODAL */}
            {showFormSuccessModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setShowFormSuccessModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100 overflow-hidden border border-green-100 text-center animate-fade-in-up">
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
                </div>
            )}

            {/* FORM ERROR MODAL */}
            {showFormErrorModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 transition-all duration-300">
                    <div 
                        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" 
                        onClick={() => setShowFormErrorModal(false)}
                    ></div>
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm transform transition-all scale-100 overflow-hidden border border-red-100 text-center animate-fade-in-up">
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
                </div>
            )}
        </div>
    );
}