import StatusBadge from '@/Components/ui/status-badge';
export const IssuanceStatus = ({ status }: { status: string }) => <StatusBadge tone={status === 'Issued' ? 'success' : status === 'Pending' ? 'warning' : 'neutral'}>{status}</StatusBadge>;
