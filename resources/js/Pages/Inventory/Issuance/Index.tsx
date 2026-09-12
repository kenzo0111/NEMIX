import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { IssuancePageProps, IssuanceRecord, PaginatedData } from './types';
import { IssuanceToolbar } from './components/IssuanceToolbar';
import { IssuanceTable } from './components/IssuanceTable';
import { IssuanceFormModal } from './components/IssuanceFormModal';
import { IssuanceDetailsModal } from './components/IssuanceDetailsModal';
import { RisPreviewModal } from './components/RisPreviewModal';

export default function IssuanceIndex({
    auth,
    issuances,
    items,
    recipients = [],
    divisions = [],
    filters = {},
}: IssuancePageProps) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const pageProps = usePage().props as any;
    const systemSettings = (pageProps.systemSettings || {}) as Record<string, any>;
    const publicSettings = pageProps.system?.settings || {};

    // System Signatories & Institutions
    const defaultApprovedBy =
        (publicSettings['signatories_ris_oic_active']
            ? publicSettings['signatories_ris_oic_prefix'] || 'OIC, '
            : '') +
        (systemSettings?.approved_by_name ||
            publicSettings['approved_by_name'] ||
            publicSettings['signatories_ris_approved_by_name'] ||
            publicSettings['signatories.ris_approved_by_name'] ||
            'ARSENIO GEM A. GARCILLANOSA');
    const defaultApprovedByDesignation =
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
        systemSettings?.issued_by_name ||
        publicSettings['issued_by_name'] ||
        publicSettings['signatories_ris_issued_by_name'] ||
        publicSettings['signatories.ris_issued_by_name'] ||
        'Supply Custodian / Storekeeper';
    const defaultIssuedByDesignation =
        systemSettings?.issued_by_position ||
        publicSettings['issued_by_position'] ||
        publicSettings['signatories_ris_issued_by_designation'] ||
        publicSettings['signatories.ris_issued_by_designation'] ||
        'Administrative Aide VI / Storekeeper';

    // Normalize pagination vs raw array
    const isPaginated = !Array.isArray(issuances) && issuances !== null && typeof issuances === 'object' && 'data' in issuances;
    const rawList: IssuanceRecord[] = isPaginated ? (issuances as PaginatedData<IssuanceRecord>).data : (issuances as IssuanceRecord[]) || [];
    const paginationMeta = isPaginated ? (issuances as PaginatedData<IssuanceRecord>) : null;

    // Filters state (initialized from server filters)
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [recipientFilter, setRecipientFilter] = useState(filters.recipient || '');
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Modal states
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isRisPreviewModalOpen, setIsRisPreviewModalOpen] = useState(false);
    const [selectedIssuance, setSelectedIssuance] = useState<IssuanceRecord | null>(null);

    // Notification toast state
    const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

    // Dismiss notification automatically
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

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
        setIsRisPreviewModalOpen(true);
    };

    const handleCloseRisPreview = () => {
        setIsRisPreviewModalOpen(false);
        setSelectedIssuance(null);
    };

    const handleSuccessNotification = (message: string) => {
        setNotification({ type: 'success', message });
    };

    const modules = getSidebarModules('Inventory', 'Issuance');

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900 overflow-x-hidden">
            <Head title="Inventory - Stock Issuance" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={() => setCollapsed(!collapsed)}
            />

            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                <PageHeader
                    title="Inventory Management"
                    description="Stock distribution and issuance records"
                    breadcrumbs={[{ name: 'Inventory' }, { name: 'Issuance' }]}
                />

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 max-w-[1600px] mx-auto w-full overflow-x-hidden pb-16 min-w-0">
                    {/* Inline Notification Banner */}
                    {notification && (
                        <div
                            className={`mb-4 px-4 py-3 rounded-lg border text-xs font-semibold flex items-center justify-between transition-all ${
                                notification.type === 'success'
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                    : 'bg-rose-50 border-rose-200 text-rose-800'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                {notification.type === 'success' ? (
                                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                                <span>{notification.message}</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => setNotification(null)}
                                className="text-gray-400 hover:text-gray-600 cursor-pointer"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {/* Primary Issuance Ledger Card */}
                    <div className="bg-white rounded-xl shadow-2xs border border-gray-200/80 overflow-hidden">
                        <IssuanceToolbar
                            searchTerm={searchTerm}
                            onSearchChange={handleSearchChange}
                            recipientFilter={recipientFilter}
                            onRecipientFilterChange={handleRecipientFilterChange}
                            recipientOptions={recipientOptions}
                            onRecordIssuance={handleOpenRecordModal}
                        />

                        <IssuanceTable
                            issuances={rawList}
                            pagination={paginationMeta}
                            onPageChange={handlePageChange}
                            onViewDetails={handleViewDetails}
                            onViewRisForm={handleViewRisForm}
                        />
                    </div>
                </div>
            </main>

            {/* Modals */}
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

            <IssuanceDetailsModal
                show={isDetailsModalOpen}
                issuance={selectedIssuance}
                onClose={handleCloseDetails}
            />

            <RisPreviewModal
                show={isRisPreviewModalOpen}
                issuance={selectedIssuance}
                onClose={handleCloseRisPreview}
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
