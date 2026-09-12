import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import {
    AllItemsProps,
    AllItemsPageProps,
    InventoryItem,
    SelectOption,
    InventoryStatus as StatusType,
    NotificationState,
} from './types';
import InventoryToolbar from './components/InventoryToolbar';
import InventoryTable from './components/InventoryTable';
import InventoryDetailsModal from './components/InventoryDetailsModal';
import InventoryFormModal from './components/InventoryFormModal';
import DeleteItemModal from './components/DeleteItemModal';
import InventoryNotification from './components/InventoryNotification';

export default function AllItemsIndex({
    auth,
    items: initialItems = [],
    suppliers = [],
    pagination,
    filters,
    lowStockThreshold = 10,
}: AllItemsProps) {
    const { flash } = usePage<AllItemsPageProps>().props;
    const user = auth?.user;

    // Sidebar collapse state
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            return localStorage.getItem('nemix_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });

    const handleToggleCollapse = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem('nemix_sidebar_collapsed', String(next));
            } catch {}
            return next;
        });
    }, []);

    // Transient Notification
    const [notification, setNotification] = useState<NotificationState | null>(null);

    useEffect(() => {
        if (flash?.error) {
            setNotification({ type: 'error', message: flash.error });
        } else if (flash?.warning) {
            setNotification({ type: 'warning', message: flash.warning });
        } else if (flash?.success) {
            setNotification({ type: 'success', message: flash.success });
        } else if (flash?.status) {
            setNotification({ type: 'info', message: flash.status });
        }
    }, [flash]);

    useEffect(() => {
        if (!notification) return;
        const timer = setTimeout(() => {
            setNotification(null);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification]);

    // Active Modals & Selected Items
    const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
    const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<InventoryItem | null>(null);
    const [isDeleting, setIsDeleting] = useState<boolean>(false);

    // Filters State
    const [searchTerm, setSearchTerm] = useState<string>(filters?.search || '');
    const [filterSupplier, setFilterSupplier] = useState<SelectOption<number> | null>(() => {
        if (filters?.supplier) {
            const found = suppliers.find((s) => String(s.id) === String(filters.supplier));
            return found ? { value: found.id, label: found.name } : null;
        }
        return null;
    });
    const [filterStatus, setFilterStatus] = useState<SelectOption<StatusType> | null>(() => {
        if (filters?.status) {
            return { value: filters.status, label: filters.status };
        }
        return null;
    });

    // Client-side pagination fallback state if server pagination is not used
    const [clientPage, setClientPage] = useState<number>(1);
    const rowsPerPage = 10;

    // Determine if server pagination is driving this page
    const isServerDriven = Boolean(pagination && pagination.total !== undefined);

    // Server-side filter dispatcher
    const isFirstRender = useRef(true);
    const triggerServerQuery = useCallback(
        (page: number, search: string, supplierId?: number | null, statusVal?: string | null) => {
            router.get(
                route('inventory.index'),
                {
                    page,
                    search: search.trim() || undefined,
                    supplier: supplierId || undefined,
                    status: statusVal || undefined,
                },
                {
                    preserveState: true,
                    preserveScroll: true,
                    replace: true,
                }
            );
        },
        []
    );

    // Debounce search input for server queries if server driven
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }

        if (!isServerDriven) return;

        const timer = setTimeout(() => {
            triggerServerQuery(1, searchTerm, filterSupplier?.value, filterStatus?.value);
        }, 350);

        return () => clearTimeout(timer);
    }, [searchTerm, filterSupplier, filterStatus, isServerDriven, triggerServerQuery]);

    // Client-side filtering when working with loaded items
    const filteredClientItems = useMemo(() => {
        if (isServerDriven) {
            return initialItems;
        }

        return initialItems.filter((item) => {
            const matchesSearch =
                !searchTerm.trim() ||
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.sku && item.sku.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = filterStatus ? item.status === filterStatus.value : true;
            const matchesSupplier = filterSupplier ? String(item.supplier_id) === String(filterSupplier.value) : true;
            return matchesSearch && matchesStatus && matchesSupplier;
        });
    }, [initialItems, searchTerm, filterSupplier, filterStatus, isServerDriven]);

    const displayedItems = useMemo(() => {
        if (isServerDriven) {
            return initialItems;
        }
        const startIndex = (clientPage - 1) * rowsPerPage;
        return filteredClientItems.slice(startIndex, startIndex + rowsPerPage);
    }, [isServerDriven, initialItems, filteredClientItems, clientPage, rowsPerPage]);

    const totalPages = isServerDriven
        ? pagination?.last_page || 1
        : Math.max(1, Math.ceil(filteredClientItems.length / rowsPerPage));

    const currentPage = isServerDriven
        ? pagination?.current_page || 1
        : clientPage;

    const handlePageChange = (newPage: number) => {
        if (isServerDriven) {
            triggerServerQuery(newPage, searchTerm, filterSupplier?.value, filterStatus?.value);
        } else {
            setClientPage(newPage);
        }
    };

    const handleResetFilters = () => {
        setSearchTerm('');
        setFilterSupplier(null);
        setFilterStatus(null);
        if (isServerDriven) {
            triggerServerQuery(1, '', null, null);
        } else {
            setClientPage(1);
        }
    };

    // Inertia Form for Add / Edit
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm({
        name: '',
        supplier_id: '' as string | number,
        sku: '',
        stock: 0,
        unit_cost: '' as string | number,
        amount: '' as string | number,
        status: 'Available' as string,
        description: '',
        unit_of_issue: '',
    });

    const openCreateModal = () => {
        clearErrors();
        reset();
        setEditingItem(null);
        setData({
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
        setIsFormOpen(true);
    };

    const openEditModal = (item: InventoryItem) => {
        clearErrors();
        setEditingItem(item);
        setData({
            name: item.name,
            supplier_id: item.supplier_id || '',
            sku: item.sku || '',
            stock: item.stock,
            unit_cost: item.unit_cost !== null && item.unit_cost !== undefined ? String(item.unit_cost) : '',
            amount: item.amount !== null && item.amount !== undefined ? String(item.amount) : '',
            status: item.status,
            description: item.description || '',
            unit_of_issue: item.unit_of_issue || '',
        });
        setIsFormOpen(true);
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingItem) {
            put(route('inventory.update', editingItem.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                    setEditingItem(null);
                    setNotification({
                        type: 'success',
                        message: 'Inventory item updated successfully.',
                    });
                },
                onError: (err) => {
                    const firstError = Object.values(err)[0];
                    if (firstError) {
                        setNotification({
                            type: 'error',
                            message: String(firstError),
                        });
                    }
                },
            });
        } else {
            post(route('inventory.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    setIsFormOpen(false);
                    reset();
                    setNotification({
                        type: 'success',
                        message: 'Inventory item created successfully.',
                    });
                },
                onError: (err) => {
                    const firstError = Object.values(err)[0];
                    if (firstError) {
                        setNotification({
                            type: 'error',
                            message: String(firstError),
                        });
                    }
                },
            });
        }
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        router.delete(route('inventory.destroy', itemToDelete.id), {
            preserveScroll: true,
            onSuccess: () => {
                setIsDeleting(false);
                setItemToDelete(null);
                setNotification({
                    type: 'success',
                    message: 'Inventory item deleted successfully.',
                });
            },
            onError: () => {
                setIsDeleting(false);
                setNotification({
                    type: 'error',
                    message: 'Failed to delete the inventory item. Please try again.',
                });
            },
        });
    };

    const modules = getSidebarModules('Inventory', 'All Items');
    const isFiltered = Boolean(searchTerm.trim() || filterSupplier || filterStatus);

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-900">
            <Head title="Inventory Management - Supply Administration" />

            <Sidebar
                modules={modules}
                user={user}
                collapsed={collapsed}
                onToggleCollapse={handleToggleCollapse}
            />

            <main className={`flex-1 min-w-0 transition-all duration-300 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-72'}`}>
                {/* Unified Institutional Header */}
                <PageHeader
                    title="Inventory Management"
                    description="Master list of university consumable inventory items and property assets."
                    breadcrumbs={[{ name: 'Inventory' }, { name: 'All Items' }]}
                />

                <div className="p-4 sm:p-5 lg:p-6 xl:p-8 space-y-5 max-w-[1600px] mx-auto pb-16 min-w-0 w-full">
                    {/* Transient Notification Alert */}
                    <InventoryNotification
                        notification={notification}
                        onDismiss={() => setNotification(null)}
                    />

                    {/* Main Working Interface: Card & Table */}
                    <div className="bg-white rounded-lg shadow-xs border border-gray-200 overflow-hidden">
                        {/* Streamlined Toolbar */}
                        <InventoryToolbar
                            searchTerm={searchTerm}
                            onSearchChange={setSearchTerm}
                            filterSupplier={filterSupplier}
                            onSupplierChange={setFilterSupplier}
                            filterStatus={filterStatus}
                            onStatusChange={setFilterStatus}
                            suppliers={suppliers}
                            onResetFilters={handleResetFilters}
                            onOpenCreateModal={openCreateModal}
                        />

                        {/* Inventory Table */}
                        <InventoryTable
                            items={displayedItems}
                            pagination={pagination}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            onView={(item) => setViewItem(item)}
                            onEdit={(item) => openEditModal(item)}
                            onDelete={(item) => setItemToDelete(item)}
                            isFiltered={isFiltered}
                        />
                    </div>
                </div>
            </main>

            {/* View Record Details Modal */}
            <InventoryDetailsModal
                show={Boolean(viewItem)}
                item={viewItem}
                onClose={() => setViewItem(null)}
                onEdit={(item) => {
                    setViewItem(null);
                    openEditModal(item);
                }}
            />

            {/* Add / Edit Inventory Modal */}
            <InventoryFormModal
                show={isFormOpen}
                isEditing={Boolean(editingItem)}
                data={data}
                setData={setData}
                errors={errors}
                processing={processing}
                suppliers={suppliers}
                existingItems={initialItems}
                lowStockThreshold={lowStockThreshold}
                onClose={() => {
                    if (!processing) {
                        setIsFormOpen(false);
                        setEditingItem(null);
                        reset();
                    }
                }}
                onSubmit={handleFormSubmit}
                onViewExistingItem={(item) => {
                    setIsFormOpen(false);
                    setViewItem(item);
                }}
            />

            {/* Delete Confirmation Modal */}
            <DeleteItemModal
                show={Boolean(itemToDelete)}
                item={itemToDelete}
                isDeleting={isDeleting}
                onClose={() => {
                    if (!isDeleting) setItemToDelete(null);
                }}
                onConfirm={handleDeleteConfirm}
            />
        </div>
    );
}
