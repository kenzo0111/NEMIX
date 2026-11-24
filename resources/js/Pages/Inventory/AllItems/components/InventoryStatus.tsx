import StatusBadge, { type StatusTone } from '@/Components/ui/status-badge';
import { InventoryStatus as StatusType } from '../types';
const tones: Record<StatusType, StatusTone> = { Available: 'success', 'Low Stock': 'warning', 'Critical Stock': 'danger', 'Out of Stock': 'danger' };
export default function InventoryStatus({ status }: { status: StatusType }) { return <StatusBadge tone={tones[status] || 'neutral'}>{status}</StatusBadge>; }
