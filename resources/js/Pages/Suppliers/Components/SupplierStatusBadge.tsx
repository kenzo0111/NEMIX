import StatusBadge from '@/Components/ui/status-badge';
import { SupplierStatus } from '../types';
export const SupplierStatusBadge = ({ status }: { status: SupplierStatus | string }) => {
    const value = (status || '').toLowerCase();
    return <StatusBadge tone={value === 'active' ? 'success' : value === 'blacklisted' ? 'danger' : 'warning'}>{value === 'active' ? 'Active / Compliant' : value === 'blacklisted' ? 'Blacklisted' : 'Pending Renewal'}</StatusBadge>;
};
