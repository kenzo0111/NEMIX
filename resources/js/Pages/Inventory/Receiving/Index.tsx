import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import { getLocalDateString } from '@/utils/dateUtils';
import {
    ReceivingPageProps,
    ReceivingRecord,
    InventoryItem,
    PaginatedData,
    ReceivingFormData,
} from './types';
import { ReceivingToolbar } from './components/ReceivingToolbar';
import { ReceivingTable } from './components/ReceivingTable';
import { ReceivingFormModal } from './components/ReceivingFormModal';
import { ReceivingDetailsModal } from './components/ReceivingDetailsModal';
import { RfidReceivingModal } from './components/RfidReceivingModal';
import { ReceivingStatusNotice } from './components/ReceivingStatusNotice';
import { useRfidScanner } from './hooks/useRfidScanner';

export default function ReceivingIndex({
    auth,
    receivings,
    items = [],
    suppliers = [],
    filters = {},
}: ReceivingPageProps) {
    const user = auth.user;
    const [collapsed, setCollapsed] = useState(false);
    const pageProps = usePage().props as any;

    // Flash notifications
    const [notification, setNotification] = useState<{
        type: 'success' | 'error';
        message: string;
    } | null>(null);

    // Watch for flash messages from backend
    useEffect(() => {
        if (pageProps.flash?.success) {
            setNotification({ type: 'success', message: pageProps.flash.success });
        } else if (pageProps.flash?.error) {
            setNotification({ type: 'error', message: pageProps.flash.error });
        }
    }, [pageProps.flash]);

    // Auto-dismiss notification after 5 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    // Data normalization (supports PaginatedData from Laravel or raw array)
    const isPaginated =
        !Array.isArray(receivings) &&
        receivings !== null &&
        typeof receivings === 'object' &&
        'data' in receivings;

    const rawList: ReceivingRecord[] = isPaginated
        ? (receivings as PaginatedData<ReceivingRecord>).data
        : (receivings as ReceivingRecord[]) || [];

    const paginationMeta = isPaginated
        ? (receivings as PaginatedData<ReceivingRecord>)
        : null;

    // Filters state
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [supplierFilter, setSupplierFilter] = useState<number | string>(filters.supplier || '');
    const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Server-side filter query execution
    const executeServerFilter = (search: string, supplier: number | string, page: number = 1) => {
        router.get(
            route('inventory.receiving'),
            {
                search: search || undefined,
                supplier: supplier || undefined,
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
            executeServerFilter(value, supplierFilter, 1);
        }, 350);
    };

    const handleSupplierFilterChange = (value: number | string) => {
        setSupplierFilter(value);
        executeServerFilter(searchTerm, value, 1);
    };

    const handlePageChange = (newPage: number) => {
        executeServerFilter(searchTerm, supplierFilter, newPage);
    };

    // Client-side fallback if backend returns raw array
    const displayedReceivings = useMemo(() => {
        if (isPaginated) {
            return rawList;
        }
        return rawList.filter((item) => {
            const lowerSearch = searchTerm.toLowerCase();
            const matchesSearch =
                !searchTerm ||
                item.item.toLowerCase().includes(lowerSearch) ||
                (item.sku && item.sku.toLowerCase().includes(lowerSearch)) ||
                item.supplier.toLowerCase().includes(lowerSearch);

            const matchesSupplier =
                !supplierFilter ||
                item.supplier_id === Number(supplierFilter) ||
                item.supplier === supplierFilter;

            return matchesSearch && matchesSupplier;
        });
    }, [isPaginated, rawList, searchTerm, supplierFilter]);

    // --- MODAL & TRANSACTION FORM STATES ---
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [activeRecordId, setActiveRecordId] = useState<number | null>(null);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedReceiving, setSelectedReceiving] = useState<ReceivingRecord | null>(null);

    const [isRfidModalOpen, setIsRfidModalOpen] = useState(false);

    // Form Hook
    const {
        data: formData,
        setData: setFormData,
        post,
        put,
        processing,
        errors,
        reset: resetForm,
        clearErrors,
    } = useForm<ReceivingFormData>({
        item_id: '',
        supplier_id: '',
        supplier_stock_no: '',
        quantity: '',
        unit_cost: '',
        date_received: getLocalDateString(),
    });

    // RFID Scanner Hook
    const {
        scanInput,
        setScanInput,
        matchedItem,
        isSearching: isRfidSearching,
        errorMessage: rfidError,
        lookupTag,
        resetScanner,
    } = useRfidScanner({
        items,
        enabled: isRfidModalOpen,
    });

    // --- ACTION HANDLERS ---
    const handleOpenCreateModal = () => {
        setFormMode('create');
        setActiveRecordId(null);
        clearErrors();
        resetForm();
        setFormData({
            item_id: '',
            supplier_id: '',
            supplier_stock_no: '',
            quantity: '',
            unit_cost: '',
            date_received: getLocalDateString(),
        });
        setIsFormModalOpen(true);
    };

    const handleOpenDetailsModal = (receiving: ReceivingRecord) => {
        setSelectedReceiving(receiving);
        setIsDetailsModalOpen(true);
    };

    const handleOpenEditModal = (receiving: ReceivingRecord) => {
        setFormMode('edit');
        setActiveRecordId(receiving.id);
        clearErrors();
        setFormData({
            item_id: receiving.item_id || '',
            supplier_id: receiving.supplier_id || '',
            supplier_stock_no: receiving.supplier_stock_no || '',
            quantity: receiving.quantity || '',
            unit_cost: receiving.unit_cost !== null && receiving.unit_cost !== undefined ? receiving.unit_cost : '',
            date_received: receiving.date || receiving.date_received || getLocalDateString(),
        });
        setIsDetailsModalOpen(false);
        setIsFormModalOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (formMode === 'create') {
            post(route('inventory.receiving.store'), {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    resetForm();
                    setNotification({
                        type: 'success',
                        message: 'Receiving record created successfully.',
                    });
                },
            });
        } else if (formMode === 'edit' && activeRecordId) {
            put(route('inventory.receiving.update', activeRecordId), {
                onSuccess: () => {
                    setIsFormModalOpen(false);
                    resetForm();
                    setNotification({
                        type: 'success',
                        message: 'Receiving record updated successfully.',
                    });
                },
            });
        }
    };

    // RFID Confirm Receive: Prefill and transfer to receiving form
    const handleConfirmRfidReceive = (item: InventoryItem) => {
        setIsRfidModalOpen(false);
        resetScanner();

        // Safe supplier assignment: Only bind if item has an associated supplier in the database
        const matchingSupplierId = item.supplier_id || '';

        setFormMode('create');
        setActiveRecordId(null);
        clearErrors();
        setFormData({
            item_id: item.id,
            supplier_id: matchingSupplierId,
            quantity: 1,
            unit_cost: '',
            date_received: getLocalDateString(),
        });
        setIsFormModalOpen(true);
    };

    const handleOpenRfidModal = () => {
        resetScanner();
        setIsRfidModalOpen(true);
    };

    const isFiltered = Boolean(searchTerm || supplierFilter);
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

            {/* Main Content Area */}
            <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                {/* Institutional Header */}
                <PageHeader
                    title="Inventory Management"
                    description="Incoming stock and supplier deliveries"
                    breadcrumbs={[{ name: 'Inventory' }, { name: 'Receiving' }]}
                />

                <div className="p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto pb-16">
                    {/* Flash Notification Banner */}
                    <ReceivingStatusNotice
                        notification={notification}
                        onDismiss={() => setNotification(null)}
                    />

                    {/* Receiving Ledger Card */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
                        {/* Receiving Toolbar */}
                        <ReceivingToolbar
                            searchTerm={searchTerm}
                            onSearchChange={handleSearchChange}
                            supplierFilter={supplierFilter}
                            onSupplierFilterChange={handleSupplierFilterChange}
                            suppliers={suppliers}
                            onScanRfid={handleOpenRfidModal}
                            onRecordReceiving={handleOpenCreateModal}
                        />

                        {/* Receiving Ledger Table */}
                        <ReceivingTable
                            receivings={displayedReceivings}
                            paginationMeta={paginationMeta}
                            onPageChange={handlePageChange}
                            onView={handleOpenDetailsModal}
                            onUpdate={handleOpenEditModal}
                            isFiltered={isFiltered}
                        />
                    </div>
                </div>
            </main>

            {/* Create / Edit Receiving Modal */}
            <ReceivingFormModal
                show={isFormModalOpen}
                onClose={() => setIsFormModalOpen(false)}
                mode={formMode}
                recordId={activeRecordId}
                data={formData}
                setData={(key, val) => setFormData(key as any, val)}
                errors={errors}
                processing={processing}
                items={items}
                suppliers={suppliers}
                onSubmit={handleFormSubmit}
            />

            {/* View Details Modal */}
            <ReceivingDetailsModal
                show={isDetailsModalOpen}
                onClose={() => setIsDetailsModalOpen(false)}
                receiving={selectedReceiving}
                onEdit={handleOpenEditModal}
            />

            {/* RFID Scanner Modal */}
            <RfidReceivingModal
                show={isRfidModalOpen}
                onClose={() => {
                    setIsRfidModalOpen(false);
                    resetScanner();
                }}
                scanInput={scanInput}
                onScanInputChange={setScanInput}
                onScanLookup={lookupTag}
                matchedItem={matchedItem}
                isSearching={isRfidSearching}
                errorMessage={rfidError}
                onConfirmReceive={handleConfirmRfidReceive}
            />
        </div>
    );
}
