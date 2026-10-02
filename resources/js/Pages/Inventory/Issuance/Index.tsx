import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
import { IssuancePageProps, IssuanceRecord, PaginatedData } from './types';
import { IssuanceToolbar } from './components/IssuanceToolbar';
import { IssuanceTable } from './components/IssuanceTable';
import { IssuanceFormModal } from './components/IssuanceFormModal';
import { IssuanceDetailsModal } from './components/IssuanceDetailsModal';
import { RisPreviewModal } from './components/RisPreviewModal';
import { SupplyRequestQueue, QueueRequest } from './components/SupplyRequestQueue';
import { ClipboardCheck, FileSpreadsheet, PackageCheck } from 'lucide-react';

export default function IssuanceIndex({
    auth,
    issuances,
    items,
    recipients = [],
    divisions = [],
    filters = {},
    supplyRequests = [],
    canCreateIssuance = false,
    defaultApprovedBy: propApprovedBy,
    defaultApprovedByDesignation: propApprovedByDesignation,
    defaultIssuedBy: propIssuedBy,
    defaultIssuedByDesignation: propIssuedByDesignation,
}: IssuancePageProps & {
    supplyRequests?: QueueRequest[];
    canCreateIssuance?: boolean;
    defaultApprovedBy?: string;
    defaultApprovedByDesignation?: string;
    defaultIssuedBy?: string;
    defaultIssuedByDesignation?: string;
}) {
    const user = auth.user;
    const [collapsed, handleToggleCollapse] = useSidebarCollapse();
    const pageProps = usePage().props as any;
    const systemSettings = (pageProps.systemSettings || {}) as Record<string, any>;
    const publicSettings = pageProps.system?.settings || {};

    // System Signatories & Institutions
    const defaultApprovedBy =
        propApprovedBy ||
        ((publicSettings['signatories_ris_oic_active']
            ? publicSettings['signatories_ris_oic_prefix'] || 'OIC, '
            : '') +
        (systemSettings?.approved_by_name ||
            publicSettings['approved_by_name'] ||
            publicSettings['signatories_ris_approved_by_name'] ||
            publicSettings['signatories.ris_approved_by_name'] ||
            'ARSENIO GEM A. GARCILLANOSA'));
    const defaultApprovedByDesignation =
        propApprovedByDesignation ||
        systemSettings?.approved_by_designation ||
        systemSettings?.approved_by_position ||
        publicSettings['approved_by_position'] ||
        publicSettings['signatories_ris_approved_by_designation'] ||
        publicSettings['signatories.ris_approved_by_designation'] ||
        'SUPPLY OFFICER III/ADMIN OFFICER V';
    const institutionName =
        systemSettings?.entity_name ||
        publicSettings['entity_name'] ||
        publicSettings['institution_name'] ||
        'University of Camarines Norte';
    const responsibilityCenterCode = publicSettings['institution_responsibility_center_code'] || '';
    const defaultIssuedBy =
        propIssuedBy ||
        systemSettings?.issued_by_name ||
        publicSettings['issued_by_name'] ||
        publicSettings['signatories_ris_issued_by_name'] ||
        publicSettings['signatories.ris_issued_by_name'] ||
        'Supply Custodian / Storekeeper';
    const defaultIssuedByDesignation =
        propIssuedByDesignation ||
        systemSettings?.issued_by_position ||
        systemSettings?.issued_by_designation ||
        publicSettings['issued_by_position'] ||
        publicSettings['signatories_ris_issued_by_designation'] ||
        publicSettings['signatories.ris_issued_by_designation'] ||
        'Administrative Aide VI / Storekeeper';

    // Normalize pagination vs raw array
    const isPaginated = !Array.isArray(issuances) && issuances !== null && typeof issuances === 'object' && 'data' in issuances;
    const rawList: IssuanceRecord[] = isPaginated ? (issuances as PaginatedData<IssuanceRecord>).data : (issuances as IssuanceRecord[]) || [];
    const paginationMeta = isPaginated ? (issuances as PaginatedData<IssuanceRecord>) : null;

    // View tab: 'approvals' | 'issuances'
    const [viewMode, setViewMode] = useState<'approvals' | 'issuances'>('approvals');

    // Filters state (initialized from server filters)
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [recipientFilter, setRecipientFilter] = useState(filters.recipient || '');
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRisPreviewModalOpen, setIsRisPreviewModalOpen] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState<IssuanceRecord | null>(null);
    const [previewRequestId, setPreviewRequestId] = useState<number | null>(null);

    // Notification toast state
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Dismiss notification automatically
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Pending count
    const pendingCount = useMemo(() => {
        return supplyRequests.filter((r) => r.status === 'Pending').length;
    }, [supplyRequests]);

    const approvedCount = useMemo(() => {
        return supplyRequests.filter((r) => r.status === 'Approved').length;
    }, [supplyRequests]);

    // Recipient options for dropdown
    const recipientOptions = useMemo(() => {
        if (recipients && recipients.length > 0) {
            return recipients.map((r) => ({ value: r, label: r }));
        }
        const unique = Array.from(new Set(rawList.map((i) => i.recipient).filter(Boolean)));
        return unique.map((r) => ({ value: r, label: r }));
    }, [recipients, rawList]);

    // Server-side filter query execution
    const executeServerFilter = (search: string, recipient: string, page: number = 1) => {
        router.get(
            route('inventory.issuance'),
            {
                search: search || undefined,
                recipient: recipient || undefined,
                page: page > 1 ? page : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        if (searchDebounceRef.current) {
            clearTimeout(searchDebounceRef.current);
        }
        searchDebounceRef.current = setTimeout(() => {
            executeServerFilter(value, recipientFilter, 1);
        }, 350);
    };

    const handleRecipientFilterChange = (value: string) => {
        setRecipientFilter(value);
        executeServerFilter(searchTerm, value, 1);
    };

    const handlePageChange = (newPage: number) => {
        executeServerFilter(searchTerm, recipientFilter, newPage);
    };

    // Modal openers
    const handleOpenRecordModal = () => setIsFormModalOpen(true);
    const handleCloseRecordModal = () => setIsFormModalOpen(false);

    const handleViewDetails = (issuance: IssuanceRecord) => {
        setSelectedIssuance(issuance);
        setIsDetailsModalOpen(true);
    };

    const handleCloseDetails = () => {
        setIsDetailsModalOpen(false);
        setSelectedIssuance(null);
    };

    const handleViewRisForm = (issuance: IssuanceRecord) => {
        setSelectedIssuance(issuance);
        setPreviewRequestId(null);
        setIsRisPreviewModalOpen(true);
    };

    const handlePreviewApprovedRequest = (request: QueueRequest) => {
        const recipientDesignation = request.recipient_designation || (request.issuance as any)?.recipient_designation || '';
        const lines = request.items
            .filter((line) => (line.approved_quantity ?? 0) > 0)
            .map((line) => {
                const issuanceItem = (request.issuance as any)?.items?.find((i: any) => i.item_id === line.item_id);
                const allocatedStockNos = issuanceItem?.allocations
                    ?.map((a: any) => a.inventory_batch?.supplier_stock_no || a.supplier_stock_no)
                    ?.filter(Boolean);
                const stockNoFromAllocations = allocatedStockNos && allocatedStockNos.length > 0
                    ? Array.from(new Set(allocatedStockNos)).join(', ')
                    : undefined;

                const stockNo = stockNoFromAllocations || line.item.stock_no || line.item.supplier_stock_no || '-';

                return {
                    id: line.id,
                    item_id: line.item_id,
                    item: line.item.name,
                    sku: line.item.sku,
                    quantity: line.approved_quantity || line.quantity,
                    unit: line.item.unit_of_issue || 'pcs',
                    stock_no: stockNo,
                    unit_cost: line.item.unit_cost || 0,
                    amount: (line.approved_quantity || line.quantity) * (line.item.unit_cost || 0),
                    allocations: issuanceItem?.allocations || [],
                };
            });

        setSelectedIssuance({
            id: request.id,
            ris_number: request.ris_number || '',
            recipient: request.recipient || request.requester.name,
            recipient_designation: recipientDesignation,
            department: request.department,
            purpose: request.purpose,
            fund_cluster: request.fund_cluster || '01',
            status: request.status === 'Issued' ? 'Issued' : 'Approved',
            requested_at: (request.date_requested || request.created_at)?.slice(0, 10),
            reviewed_at: request.reviewed_at?.slice(0, 10),
            date_issued: request.status === 'Issued' ? request.issuance?.date_issued || '' : '',
            approved_by: defaultApprovedBy,
            approved_by_designation: defaultApprovedByDesignation,
            issued_by: '',
            issued_by_name: request.status === 'Issued' ? request.issuance?.issued_by_name || defaultIssuedBy : defaultIssuedBy,
            issued_by_position: request.status === 'Issued' ? request.issuance?.issued_by_position || defaultIssuedByDesignation : defaultIssuedByDesignation,
            total_quantity: lines.reduce((sum, line) => sum + line.quantity, 0),
            total_amount: lines.reduce((sum, line) => sum + line.amount, 0),
            items: lines,
        });
        setPreviewRequestId(request.id);
        setIsRisPreviewModalOpen(true);
    };

    const handleCloseRisPreview = () => {
        setIsRisPreviewModalOpen(false);
        setSelectedIssuance(null);
        setPreviewRequestId(null);
    };

    const handleSuccessNotification = (message: string) => {
        setNotification({ type: 'success', message });
    };

    const modules = getSidebarModules('Inventory', 'Issuance');

    return (
        <div className="min-h-screen bg-[#F4F6F8] dark:bg-slate-950 flex font-sans text-gray-900 dark:text-slate-100 overflow-x-hidden selection:bg-red-900 selection:text-white">
            <Head title="Inventory - Stock Issuance & Approval Workspace" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                <PageHeader
                    title="Inventory Management"
                    description="Property Custodian approval workspace and official stock issuance records"
                    breadcrumbs={[{ name: 'Inventory' }, { name: 'Issuance & Approvals' }]}
                />

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden pb-16 min-w-0 space-y-6">
                    {/* Inline Notification Banner */}
                    {notification && (
                        <div
                            className={`px-4 py-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                                notification.type === 'success'
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="font-bold">{notification.message}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNotification(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 cursor-pointer"
                            >
                                ×
                            </button>
                        </div>
                    )}

                    {/* Custodian Workspace View Switcher Tabs */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 dark:border-slate-800 pb-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setViewMode('approvals')}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                    viewMode === 'approvals'
                                        ? 'bg-red-950 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <ClipboardCheck className="w-4 h-4 text-amber-300" />
                                <span>Requisition Approval Workspace</span>
                                {(pendingCount > 0 || approvedCount > 0) && (
                                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500 text-slate-950 font-black">
                                        {pendingCount + approvedCount}
                                    </span>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={() => setViewMode('issuances')}
                                className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                                    viewMode === 'issuances'
                                        ? 'bg-red-950 text-white shadow-xs'
                                        : 'bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <PackageCheck className="w-4 h-4 text-amber-300" />
                                <span>Issuance Registry & Slips</span>
                                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono bg-gray-200 dark:bg-slate-800 text-gray-700 dark:text-slate-300 font-bold">
                                    {rawList.length}
                                </span>
                            </button>
                        </div>

                        {canCreateIssuance && (
                            <button
                                type="button"
                                onClick={handleOpenRecordModal}
                                className="text-xs font-bold text-red-950 dark:text-red-400 hover:underline flex items-center gap-1.5 px-3 py-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer self-start sm:self-auto"
                            >
                                <FileSpreadsheet className="w-3.5 h-3.5" />
                                <span>+ Direct Stock Issuance Entry</span>
                            </button>
                        )}
                    </div>

                    {/* View 1: Property Custodian Approval Workspace */}
                    {viewMode === 'approvals' && (
                        <div className="space-y-6">
                            <SupplyRequestQueue
                                requests={supplyRequests}
                                onPreview={handlePreviewApprovedRequest}
                                defaultApprovedBy={defaultApprovedBy}
                            />
                        </div>
                    )}

                    {/* View 2: Official Issuance Registry & Slips Table */}
                    {viewMode === 'issuances' && (
                        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xs border border-gray-200/80 dark:border-slate-800 overflow-hidden">
                            <IssuanceToolbar
                                searchTerm={searchTerm}
                                onSearchChange={handleSearchChange}
                                recipientFilter={recipientFilter}
                                onRecipientFilterChange={handleRecipientFilterChange}
                                recipientOptions={recipientOptions}
                                onRecordIssuance={handleOpenRecordModal}
                                canCreateIssuance={canCreateIssuance}
                            />

                            <IssuanceTable
                                issuances={rawList}
                                pagination={paginationMeta}
                                onPageChange={handlePageChange}
                                onViewDetails={handleViewDetails}
                                onViewRisForm={handleViewRisForm}
                            />
                        </div>
                    )}
                </div>
            </main>

            {/* Direct Issuance Entry Modal */}
            {canCreateIssuance && (
                <IssuanceFormModal
                    show={isFormModalOpen}
                    onClose={handleCloseRecordModal}
                    items={items}
                    divisions={divisions}
                    defaultApprovedBy={defaultApprovedBy}
                    defaultApprovedByDesignation={defaultApprovedByDesignation}
                    defaultIssuedBy={defaultIssuedBy}
                    defaultIssuedByDesignation={defaultIssuedByDesignation}
                    onSuccessNotification={handleSuccessNotification}
                />
            )}

            {/* Issuance Voucher Details Modal */}
            <IssuanceDetailsModal
                show={isDetailsModalOpen}
                issuance={selectedIssuance}
                onClose={handleCloseDetails}
            />

            {/* RIS Preview & Print Modal */}
            <RisPreviewModal
                show={isRisPreviewModalOpen}
                issuance={selectedIssuance}
                onClose={handleCloseRisPreview}
                downloadUrl={previewRequestId ? route('inventory.requests.ris-pdf', previewRequestId) : undefined}
                institutionName={institutionName}
                responsibilityCenterCode={responsibilityCenterCode}
                defaultApprovedBy={defaultApprovedBy}
                defaultApprovedByDesignation={defaultApprovedByDesignation}
                defaultIssuedBy={defaultIssuedBy}
                defaultIssuedByDesignation={defaultIssuedByDesignation}
            />
        </div>
    );
}
