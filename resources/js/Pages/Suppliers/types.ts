export type SupplierStatus = 'active' | 'pending' | 'blacklisted';

export type SupplierCategory = 'goods';

export interface Supplier {
    id: number;
    name: string;
    tin: string;
    address: string;
    reg_number: string;
    category: SupplierCategory | string;
    status: SupplierStatus;
    contract_supplies_value?: number | null;
    amount?: number | null;
    created_by?: number | null;
    created_at?: string;
    updated_at?: string;
}

export interface SupplierFormData {
    name: string;
    tin: string;
    address: string;
    reg_number: string;
    category: SupplierCategory;
    status: SupplierStatus;
}

export interface AuthUser {
    id: number;
    name: string;
    email: string;
}

export interface ManageSupplierPageProps {
    auth: {
        user: AuthUser;
    };
    suppliers: Supplier[];
}

export interface StatusOption {
    value: SupplierStatus | '';
    label: string;
}

export interface SupplierToolbarProps {
    searchTerm: string;
    onSearchChange: (value: string) => void;
    statusFilter: StatusOption | null;
    onStatusChange: (status: StatusOption | null) => void;
    onResetFilters: () => void;
    hasActiveFilters: boolean;
    onOpenCreateModal: () => void;
}

export interface SupplierTableProps {
    suppliers: Supplier[];
    totalCount: number;
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    onViewSupplier: (supplier: Supplier) => void;
    onEditSupplier: (supplier: Supplier) => void;
}

export interface SupplierRowProps {
    supplier: Supplier;
    onView: (supplier: Supplier) => void;
    onEdit: (supplier: Supplier) => void;
}

export interface SupplierDetailsModalProps {
    show: boolean;
    supplier: Supplier | null;
    onClose: () => void;
    onEdit: (supplier: Supplier) => void;
}

export interface SupplierFormModalProps {
    show: boolean;
    mode: 'create' | 'edit';
    supplier: Supplier | null;
    isSubmitting: boolean;
    errors: Partial<Record<keyof SupplierFormData, string>>;
    formData: SupplierFormData;
    onChangeField: <K extends keyof SupplierFormData>(field: K, value: SupplierFormData[K]) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
}
