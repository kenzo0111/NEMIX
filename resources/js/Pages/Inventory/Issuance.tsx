import PageHeader from '@/Components/Common/PageHeader';
import Breadcrumbs from '@/Components/Breadcrumbs';
import Sidebar from '@/Components/Sidebar';
import Modal from '@/Components/Modal';
import TablePagination from '@/Components/Common/TablePagination';
import EmptyState from '@/Components/Common/EmptyState';
import StatusBadge from '@/Components/Common/StatusBadge';
import { Head, Link, usePage } from '@inertiajs/react';
import { useState, useMemo } from 'react';
import { getSidebarModules } from '@/utils/sidebarConfig';
import Select from 'react-select';
import { divisionOptions, findDivisionOption } from '@/constants/offices';
import RequisitionIssueSlip from '../../../Official Forms/RequisitionIssueSlip';
import { Plus, Eye, FileText, Search, Printer } from 'lucide-react';

export { divisionOptions, findDivisionOption };

export default function Issuance({ auth, issuances, items }: { auth: any, issuances: any[], items: any[] }) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);

    // --- MODAL STATE ---
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isViewFormModalOpen, setIsViewFormModalOpen] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState<any>(null);

    const pageProps = usePage().props as any;
    const publicSettings = pageProps.system?.settings || {};
    const defaultApprovedBy = (publicSettings['signatories_ris_oic_active'] ? (publicSettings['signatories_ris_oic_prefix'] || 'OIC, ') : '') + (publicSettings['signatories_ris_approved_by_name'] || 'ARSENIO GEM A. GARCILLANOSA');
    const defaultApprovedByDesignation = publicSettings['signatories_ris_approved_by_designation'] || 'SUPPLY OFFICER III/ADMIN OFFICER V';

    const getFormattedId = (issuance: any) => {
        if (!issuance) return '';
        const date = new Date(issuance.date || new Date());
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const num = String(issuance.display_id || issuance.original_id || issuance.id).padStart(4, '0');
        return `${year}-${month}-${num}`;
    };

    // --- FILTERS STATE ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRecipient, setFilterRecipient] = useState<any>(null);
    const [filterDepartment, setFilterDepartment] = useState<any>(null);

    // --- PAGINATION STATE ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fundClusterOptions = [
        { value: '01', label: '01 - Regular Agency Fund' },
        { value: '05', label: '05 - Internally Generated Funds' },
        { value: '06', label: '06 - Business Related Funds' },
        { value: '07', label: '07 - Trust Receipts' }
    ];

    const getFundClusterDisplay = (value: string | null | undefined) => {
        if (!value) return '';
        const matched = fundClusterOptions.find((option) => option.value === value);
        return matched ? matched.label : value;
    };

    // --- DERIVED DATA (DROPDOWN OPTIONS) ---
    const groupedIssuances = useMemo(() => {
        const groups: Record<string, any> = {};
        issuances.forEach(issuance => {
            const key = issuance.created_at || `${issuance.recipient}_${issuance.date}_${issuance.status}_${issuance.issued_by}`;
            if (!groups[key]) {
                groups[key] = {
                    ...issuance,
                    original_id: issuance.id,
                    item_names: [issuance.item],
                    total_quantity: Number(issuance.quantity),
                    total_amount: Number(issuance.quantity) * Number(issuance.unit_cost || 0),
                    all_ids: [issuance.id],
                    items_list: [{ item: issuance.item, quantity: issuance.quantity, id: issuance.id, stock_no: issuance.sku }]
                };
            } else {
                groups[key].item_names.push(issuance.item);
                groups[key].total_quantity += Number(issuance.quantity);
                groups[key].total_amount += Number(issuance.quantity) * Number(issuance.unit_cost || 0);
                if (issuance.id < groups[key].original_id) {
                    groups[key].original_id = issuance.id;
                }
                groups[key].all_ids.push(issuance.id);
                groups[key].items_list.push({ item: issuance.item, quantity: issuance.quantity, id: issuance.id, stock_no: issuance.sku });
            }
        });

        // Sort chronologically to preserve order, then assign sequential display IDs
        const sortedGroups = Object.values(groups).sort((a: any, b: any) => a.original_id - b.original_id);
        let currentDisplayId = 1;

        return sortedGroups.map((g: any) => {
            const res = {
                ...g,
                display_id: currentDisplayId,
                item: g.item_names.length > 1 ? `${g.item_names.length} items (${g.item_names.slice(0, 2).join(', ')}${g.item_names.length > 2 ? '...' : ''})` : g.item_names[0],
                quantity: g.total_quantity,
                amount: g.total_amount
            };
            currentDisplayId++;
            return res;
        });
    }, [issuances]);

    const recipientOptions = useMemo(() => {
        const uniqueRecipients = Array.from(new Set(groupedIssuances.map((i: any) => i.recipient)));
        return uniqueRecipients.map(r => ({ value: r, label: r }));
    }, [groupedIssuances]);

    // --- FILTERING LOGIC ---
    const filteredIssuances = useMemo(() => {
        return groupedIssuances.filter((issuance: any) => {
            const lowerTerm = searchTerm.toLowerCase();
            const matchesSearch =
                issuance.item_names.some((name: string) => name.toLowerCase().includes(lowerTerm)) ||
                issuance.recipient.toLowerCase().includes(lowerTerm) ||
                (issuance.department && issuance.department.toLowerCase().includes(lowerTerm));

            const matchesRecipient = filterRecipient ? issuance.recipient === filterRecipient.value : true;
            const matchesDepartment = filterDepartment ? issuance.department === filterDepartment.value : true;

            return matchesSearch && matchesRecipient && matchesDepartment;
        });
    }, [groupedIssuances, searchTerm, filterRecipient, filterDepartment]);

    const totalPages = Math.max(1, Math.ceil(filteredIssuances.length / itemsPerPage));
    const paginatedIssuances = filteredIssuances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        groupHeading: (provided: any) => ({
            ...provided,
            fontSize: '0.7rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            color: '#7f1d1d',
            backgroundColor: '#fef2f2',
            padding: '4px 10px',
            letterSpacing: '0.05em',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        }),
        menu: (provided: any) => ({
            ...provided,
            borderRadius: '0.375rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            border: '1px solid #e5e7eb',
            zIndex: 50,
        }),
        menuList: (provided: any) => ({
            ...provided,
            maxHeight: '260px',
        }),
        indicatorSeparator: () => ({ display: 'none' }),
    };

    const handleDetails = (issuance: any) => {
        setSelectedIssuance(issuance);
        setIsDetailsModalOpen(true);
    };

    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedIssuance(null);
    };

    const handleViewForm = (issuance: any) => {
        setSelectedIssuance(issuance);
        setIsViewFormModalOpen(true);
    };

    const closeViewFormModal = () => {
        setIsViewFormModalOpen(false);
        setSelectedIssuance(null);
    };

    const handlePrintForm = () => {
        document.body.classList.add('printing-issuance');
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-issuance');
        }, 500);
    };

    const modules = getSidebarModules('Inventory', 'Issuance');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 overflow-x-hidden">
            <Head title="Inventory - Issuance" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            {/* --- MAIN CONTENT --- */}
            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Unified Sticky Header — Same as Dashboard */}
                <PageHeader
                    title="Inventory Management"
                    subtitle="Stock distribution and issuance records (Requisition and Issue Slip - Appendix 63)"
                    breadcrumbs={[{ name: 'Inventory' }, { name: 'Issuance' }]}
                />

                <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden pb-16">
                    {/* Content Card */}
                    <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 overflow-hidden">
                        {/* Card Header & Actions */}
                        <div className="px-6 lg:px-8 py-5 border-b border-gray-200/80 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">Inventory Issuance Records</h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">Track items released to faculty and departments.</p>
                            </div>

                            {/* Filter Controls Container */}
                            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                                {/* Search Input */}
                                <div className="relative flex-grow sm:w-64">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                                        <Search className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="text"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search item or recipient..."
                                        className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-xs"
                                    />
                                </div>

                                {/* Recipient Filter */}
                                <div className="w-full sm:w-44">
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

                                {/* Office / College Filter */}
                                <div className="w-full sm:w-56">
                                    <Select
                                        value={filterDepartment}
                                        onChange={setFilterDepartment}
                                        options={divisionOptions}
                                        placeholder="Office / College"
                                        isClearable
                                        styles={customSelectStyles}
                                        classNamePrefix="react-select"
                                    />
                                </div>

                                {/* Dedicated Workflow Link Button */}
                                <Link
                                    href={route('inventory.issuance.create')}
                                    className="bg-red-950 hover:bg-red-900 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-all text-xs flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider"
                                >
                                    <Plus className="w-4 h-4 text-amber-300" />
                                    Record Issuance
                                </Link>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-hidden">
                            <table className="w-full table-fixed divide-y divide-gray-200">
                                <thead className="bg-gray-50/80 border-b border-gray-200">
                                    <tr>
                                        <th className="hidden lg:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Item ID</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Item Issued</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Quantity</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Amount</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Recipient / Dept.</th>
                                        <th className="hidden md:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Date Issued</th>
                                        <th className="hidden sm:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-left text-gray-700 uppercase font-mono">Status</th>
                                        <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-right text-gray-700 uppercase font-mono w-[240px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {paginatedIssuances.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-4 lg:px-8 py-12 text-center text-gray-500">
                                                <EmptyState
                                                    title="No issuance records found"
                                                    description={searchTerm || filterRecipient || filterDepartment ? "Try adjusting your search terms or filter criteria." : "No issuance transactions have been recorded yet."}
                                                    isSearch={Boolean(searchTerm || filterRecipient || filterDepartment)}
                                                    action={
                                                        !searchTerm && !filterRecipient && !filterDepartment ? (
                                                            <Link
                                                                href={route('inventory.issuance.create')}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-950 text-white rounded text-xs font-semibold hover:bg-red-900"
                                                            >
                                                                <Plus className="w-3.5 h-3.5 text-amber-300" />
                                                                Record First Issuance
                                                            </Link>
                                                        ) : undefined
                                                    }
                                                />
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedIssuances.map((issuance: any, index: number) => (
                                            <tr key={index} className="hover:bg-red-50/30 transition-colors border-b border-gray-100 last:border-0 group">
                                                <td className="hidden lg:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">
                                                    {getFormattedId(issuance)}
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 text-sm font-bold text-gray-900 break-words">{issuance.item}</td>
                                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold font-mono">
                                                    {issuance.quantity} <span className="text-gray-400 text-xs font-normal font-sans">pcs</span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-medium font-mono">
                                                    ₱{Number(issuance.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 text-sm text-gray-700">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="w-7 h-7 rounded-full bg-red-950/10 text-red-950 border border-red-950/20 flex items-center justify-center text-xs font-bold font-mono shrink-0">
                                                            {issuance.recipient.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <span className="break-words font-medium text-gray-900 block">{issuance.recipient}</span>
                                                            {issuance.department && (
                                                                <span className="text-[11px] text-gray-500 font-mono block truncate max-w-[200px]" title={issuance.department}>
                                                                    {issuance.department}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-500 font-mono">{issuance.date}</td>
                                                <td className="hidden sm:table-cell px-4 lg:px-6 py-4 whitespace-nowrap">
                                                    <StatusBadge
                                                        status={issuance.status}
                                                    />
                                                </td>
                                                <td className="px-4 lg:px-6 py-4 text-sm font-medium">
                                                    <div className="flex flex-wrap justify-end items-center gap-x-3 gap-y-1 text-right">
                                                        <button
                                                            onClick={() => handleViewForm(issuance)}
                                                            className="text-emerald-700 hover:text-emerald-900 transition-colors font-semibold text-xs uppercase tracking-wide flex items-center gap-1"
                                                        >
                                                            <FileText className="w-3.5 h-3.5" />
                                                            View Form
                                                        </button>
                                                        <button
                                                            onClick={() => handleDetails(issuance)}
                                                            className="text-blue-700 hover:text-blue-900 transition-colors font-semibold text-xs uppercase tracking-wide flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            Details
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Standardized Table Pagination */}
                        {filteredIssuances.length > 0 && (
                            <TablePagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                totalItems={filteredIssuances.length}
                                itemsPerPage={itemsPerPage}
                                itemLabel="issuance records"
                            />
                        )}
                    </div>
                </div>
            </main>

            {/* QUICK DETAILS MODAL */}
            <Modal show={isDetailsModalOpen && Boolean(selectedIssuance)} onClose={closeDetailsModal} maxWidth="2xl">
                {selectedIssuance && (
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-blue-100">
                        <div className="h-2 w-full bg-gradient-to-r from-blue-900 via-blue-800 to-blue-950"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-900">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Issuance Details</h3>
                                    <p className="text-xs text-gray-500 font-medium">Item ID: {getFormattedId(selectedIssuance)}</p>
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
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Items Issued</label>
                                    <div className="space-y-1">
                                        {selectedIssuance.items_list?.map((it: any, idx: number) => (
                                            <p key={idx} className="text-sm text-gray-900 font-medium">
                                                {it.quantity}x {it.item}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Total Quantity</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.quantity} pcs</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Recipient</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.recipient}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Department / Division</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.department || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date Issued</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.date}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                    <StatusBadge
                                        status={selectedIssuance.status}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Issued By</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.issued_by || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Approved By</label>
                                    <p className="text-sm text-gray-900 font-medium">{selectedIssuance.approved_by || defaultApprovedBy}</p>
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
                )}
            </Modal>

            {/* OFFICIAL REQUISITION AND ISSUE SLIP (RIS) MODAL */}
            <Modal show={isViewFormModalOpen && Boolean(selectedIssuance)} onClose={closeViewFormModal} maxWidth="4xl">
                {selectedIssuance && (
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full overflow-hidden border border-green-100 flex flex-col max-h-[90vh] print:max-w-full print:max-h-full print:rounded-none print:border-none print:shadow-none">
                        <div className="h-2 w-full bg-gradient-to-r from-green-900 via-green-800 to-green-950 flex-shrink-0 print:hidden"></div>
                        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50 flex-shrink-0 print:hidden">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-50 rounded-lg text-green-900">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 tracking-tight">Requisition and Issue Slip (Appendix 63)</h3>
                                    <p className="text-xs text-gray-500 font-medium">RIS No: {getFormattedId(selectedIssuance)}</p>
                                </div>
                            </div>
                            <button
                                onClick={closeViewFormModal}
                                className="text-gray-400 hover:text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors"
                                aria-label="Close"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto w-full bg-gray-100 flex justify-center print:p-0 print:bg-white print:overflow-hidden">
                            <div className="issuance-print-area border border-gray-300 rounded shadow-sm bg-white overflow-x-auto w-full max-w-[210mm] p-4 print:border-none print:rounded-none print:shadow-none print:bg-white print:p-0 print:max-w-full">
                                <RequisitionIssueSlip data={{
                                    entity_name: publicSettings['institution_name'] || "University of Camarines Norte",
                                    fund_cluster: getFundClusterDisplay(selectedIssuance.fund_cluster),
                                    division: selectedIssuance.department || "",
                                    responsibility_center_code: publicSettings['institution_responsibility_center_code'] || "",
                                    office: selectedIssuance.department || "",
                                    ris_no: getFormattedId(selectedIssuance),
                                    purpose: selectedIssuance.purpose || "",
                                    items: selectedIssuance.items_list?.map((it: any) => ({
                                        stock_no: it.stock_no || '',
                                        unit: "pcs",
                                        description: it.item,
                                        quantity: it.quantity,
                                        stock_available: true,
                                        issue_quantity: it.quantity,
                                        remarks: ""
                                    })) || [],
                                    requested_by_name: selectedIssuance.recipient,
                                    requested_by_designation: selectedIssuance.recipient_designation,
                                    requested_by_date: selectedIssuance.date,
                                    approved_by_name: selectedIssuance.approved_by || defaultApprovedBy,
                                    approved_by_designation: selectedIssuance.approved_by_designation || defaultApprovedByDesignation,
                                    approved_by_date: selectedIssuance.date,
                                    issued_by_name: selectedIssuance.issued_by || publicSettings['signatories_ris_issued_by_name'] || 'Supply Custodian / Storekeeper',
                                    issued_by_designation: selectedIssuance.issued_by_designation || publicSettings['signatories_ris_issued_by_designation'] || 'Administrative Aide VI',
                                    issued_by_date: selectedIssuance.date,
                                    received_by_name: selectedIssuance.recipient,
                                    received_by_designation: selectedIssuance.recipient_designation,
                                    received_by_date: selectedIssuance.date
                                }} />
                            </div>
                        </div>
                        <div className="px-8 py-5 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3 flex-shrink-0 print:hidden">
                            <button
                                onClick={handlePrintForm}
                                className="px-6 py-2 text-green-700 bg-green-50 hover:bg-green-100 font-bold rounded-lg transition-colors flex items-center gap-2 border border-green-200"
                            >
                                <Printer className="w-4 h-4" />
                                Print Form
                            </button>
                            <button
                                onClick={closeViewFormModal}
                                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-all duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}