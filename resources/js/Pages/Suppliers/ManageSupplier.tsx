import React, { useState, useEffect } from 'react';
import { Head, useForm } from '@inertiajs/react';
import PageHeader from '@/Components/PageHeader';
import Sidebar from '@/Components/Sidebar';
import { getSidebarModules } from '@/utils/sidebarConfig';
import {
    ManageSupplierPageProps,
    Supplier,
    SupplierFormData,
    StatusOption,
    SupplierStatus,
} from './types';
import { DEFAULT_CATEGORY } from './constants';
import { SupplierToolbar } from './Components/SupplierToolbar';
import { SupplierTable } from './Components/SupplierTable';
import { SupplierDetailsModal } from './Components/SupplierDetailsModal';
import { SupplierFormModal } from './Components/SupplierFormModal';

export default function ManageSupplier({ auth, suppliers = [] }: ManageSupplierPageProps) {
    const user = auth.user;
    const modules = getSidebarModules('Suppliers', 'Manage Supplier');

    // Layout & modal state
    const [collapsed, setCollapsed] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
    const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

    // Search and filter state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<StatusOption | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Inertia form hook
    const { data, setData, post, put, processing, errors, reset, clearErrors } = useForm<SupplierFormData>({
        name: '',
        tin: '',
        address: '',
        reg_number: '',
        category: DEFAULT_CATEGORY,
        status: 'active',
    });

    const hasActiveFilters = Boolean(searchTerm.trim() || statusFilter?.value);

    const handleResetFilters = () => {
        setSearchTerm('');
        setStatusFilter(null);
        setCurrentPage(1);
    };

    // Filter suppliers
    const filteredSuppliers = suppliers.filter((supplier) => {
        // Status filter
        if (statusFilter?.value && supplier.status !== statusFilter.value) {
            return false;
        }

        // Search filter
        const query = searchTerm.trim().toLowerCase();
        if (query) {
            const searchable = [
                supplier.name,
                supplier.tin,
                supplier.reg_number,
                supplier.address,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            if (!searchable.includes(query)) {
                return false;
            }
        }

        return true;
    });

    // Pagination calculations
    const totalCount = filteredSuppliers.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
    const paginatedSuppliers = filteredSuppliers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset pagination when search or filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    // Modal handlers
    const openCreateModal = () => {
        clearErrors();
        reset();
        setData({
            name: '',
            tin: '',
            address: '',
            reg_number: '',
            category: DEFAULT_CATEGORY,
            status: 'active',
        });
        setSelectedSupplier(null);
        setModalMode('create');
    };

    const openViewModal = (supplier: Supplier) => {
        setSelectedSupplier(supplier);
        setModalMode('view');
    };

    const openEditModal = (supplier: Supplier) => {
        clearErrors();
        setSelectedSupplier(supplier);
        setData({
            name: supplier.name,
            tin: supplier.tin,
            address: supplier.address,
            reg_number: supplier.reg_number,
            category: DEFAULT_CATEGORY,
            status: (supplier.status || 'active') as SupplierStatus,
        });
        setModalMode('edit');
    };

    const closeModal = () => {
        setModalMode(null);
        setSelectedSupplier(null);
        clearErrors();
        reset();
    };

    // Form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (modalMode === 'create') {
            post(route('suppliers.store'), {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        } else if (modalMode === 'edit' && selectedSupplier) {
            put(route('suppliers.update', selectedSupplier.id), {
                preserveScroll: true,
                onSuccess: () => {
                    closeModal();
                },
            });
        }
    };

    const handleFieldChange = <K extends keyof SupplierFormData>(
        field: K,
        value: SupplierFormData[K]
    ) => {
        setData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <>
            <Head title="Suppliers - Consumable Office Supplies" />

            <div className="min-h-screen bg-gray-100/80 flex font-sans text-gray-900 selection:bg-red-900 selection:text-white">
                <Sidebar
                    modules={modules}
                    user={user}
                    collapsed={collapsed}
                    onToggleCollapse={() => setCollapsed(!collapsed)}
                />

                <main className={`flex-1 transition-all duration-300 ease-in-out ${collapsed ? 'ml-20' : 'ml-72'}`}>
                    <PageHeader
                        title="Consumable Office Supplies Suppliers"
                        description="Maintain accredited suppliers of university office consumables."
                        breadcrumbs={[{ name: 'Suppliers' }, { name: 'Manage Supplier' }]}
                    />

                    <div className="p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto pb-16">
                        <div className="bg-white rounded-lg shadow-xs border border-gray-200/80 overflow-hidden">
                            {/* Section Header */}
                            <div className="px-6 lg:px-8 py-4 border-b border-gray-200/80 bg-gray-50/50">
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                    Supplier Registry
                                </h3>
                                <p className="text-xs text-gray-500 font-medium mt-0.5">
                                    Official directory of accredited university office consumables suppliers.
                                </p>
                            </div>

                            {/* Toolbar (Search, Status Filter, Reset, Register) */}
                            <SupplierToolbar
                                searchTerm={searchTerm}
                                onSearchChange={setSearchTerm}
                                statusFilter={statusFilter}
                                onStatusChange={setStatusFilter}
                                onResetFilters={handleResetFilters}
                                hasActiveFilters={hasActiveFilters}
                                onOpenCreateModal={openCreateModal}
                            />

                            {/* Supplier Registry Table with Pagination */}
                            <SupplierTable
                                suppliers={paginatedSuppliers}
                                totalCount={totalCount}
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={setCurrentPage}
                                onViewSupplier={openViewModal}
                                onEditSupplier={openEditModal}
                            />
                        </div>
                    </div>
                </main>

                {/* Read-Only Details Modal */}
                <SupplierDetailsModal
                    show={modalMode === 'view'}
                    supplier={selectedSupplier}
                    onClose={closeModal}
                    onEdit={openEditModal}
                />

                {/* Form Modal (Register / Update) */}
                <SupplierFormModal
                    show={modalMode === 'create' || modalMode === 'edit'}
                    mode={modalMode === 'edit' ? 'edit' : 'create'}
                    supplier={selectedSupplier}
                    isSubmitting={processing}
                    errors={errors}
                    formData={data}
                    onChangeField={handleFieldChange}
                    onSubmit={handleSubmit}
                    onClose={closeModal}
                />
            </div>
        </>
    );
}