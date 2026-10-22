import DashboardContent from '@/Layouts/DashboardContent';
import { notify } from '@/utils/notifications';
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import DashboardLayout from '@/Layouts/DashboardLayout';
import { getSidebarModules } from '@/utils/sidebarConfig';
import {
    AllItemsProps,
    InventoryItem,
    SelectOption,
    InventoryStatus as StatusType,
} from './types';
import InventoryToolbar from './components/InventoryToolbar';
import InventoryTable from './components/InventoryTable';
import InventoryDetailsModal from './components/InventoryDetailsModal';
import InventoryFormModal from './components/InventoryFormModal';
import DeleteItemModal from './components/DeleteItemModal';

export default function AllItemsIndex({
    auth,
    items: initialItems = [],
    suppliers = [],
    pagination,
    filters,
    lowStockThreshold = 10,
    criticalStockThreshold = 3,
    unitsOfIssue = [],
}: AllItemsProps) {
    const user = auth?.user;

    // Unified persistent sidebar collapse state

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

    const totalFiltered = isServerDriven
        ? (pagination?.total ?? initialItems.length)
        : filteredClientItems.length;

    const totalPages = isServerDriven
        ? pagination?.last_page || 1
        : Math.max(1, Math.ceil(totalFiltered / rowsPerPage));

    // Priority 2: Reset client page to 1 whenever any filter or search term changes
    useEffect(() => {
        if (!isServerDriven) {
            setClientPage(1);
        }
    }, [searchTerm, filterSupplier, filterStatus, isServerDriven]);

    // Priority 1: Clamp client page if totalPages shrinks below current page
    useEffect(() => {
        if (!isServerDriven && clientPage > totalPages) {
            setClientPage(totalPages);
        }
    }, [clientPage, totalPages, isServerDriven]);

    const displayedItems = useMemo(() => {
        if (isServerDriven) {
            return initialItems;
        }
        const startIndex = (clientPage - 1) * rowsPerPage;
        return filteredClientItems.slice(startIndex, startIndex + rowsPerPage);
    }, [isServerDriven, initialItems, filteredClientItems, clientPage, rowsPerPage]);

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
        supplier_stock_no: '',
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
            supplier_stock_no: '',
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
            supplier_stock_no: (item.receiving_batches && item.receiving_batches[0]?.supplier_stock_no) || '',
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
                    notify({
                        type: 'success',
                        message: 'Inventory item updated successfully.',
                    });
                },
                onError: (err) => {
                    const firstError = Object.values(err)[0];
                    if (firstError) {
                        notify({
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
                    notify({
                        type: 'success',
                        message: 'Inventory item created successfully.',
                    });
                },
                onError: (err) => {
                    const firstError = Object.values(err)[0];
                    if (firstError) {
                        notify({
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
                notify({
                    type: 'success',
                    message: 'Inventory item deleted successfully.',
                });
            },
            onError: () => {
                setIsDeleting(false);
                notify({
                    type: 'error',
                    message: 'Failed to delete the inventory item. Please try again.',
                });
            },
        });
    };

    const modules = getSidebarModules('Inventory', 'All Items');
    const isFiltered = Boolean(searchTerm.trim() || filterSupplier || filterStatus);

    return (
        <>
            <Head title="Inventory Management - Supply Administration" />



            <DashboardLayout modules={modules} user={user}>
                {/* Unified Institutional Header */}
                <PageHeader
                    title="Inventory Management"
                    description="Track consumable supplies and property assets."
                    breadcrumbs={[{ name: 'Inventory' }, { name: 'All Items' }]}
                />

                <DashboardContent>

                    {/* Main Working Interface: Card & Table */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xs border border-gray-200 dark:border-slate-800 overflow-hidden">
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
                            totalItems={totalFiltered}
                            pagination={pagination}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            onView={(item) => setViewItem(item)}
                            onEdit={(item) => openEditModal(item)}
                            onDelete={(item) => setItemToDelete(item)}
                            isFiltered={isFiltered}
                            onResetFilters={handleResetFilters}
                        />
                    </div>
                </DashboardContent>
            </DashboardLayout>

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
                criticalStockThreshold={criticalStockThreshold}
                unitsOfIssue={unitsOfIssue}
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
        </>
    );
}
