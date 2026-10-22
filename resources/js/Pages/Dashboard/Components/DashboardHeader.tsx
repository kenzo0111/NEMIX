import SystemHeader from '@/Components/SystemHeader';
// Compatibility prop only; identity is always derived from the current session.
export default function DashboardHeader({ onToggleSidebar }: { onToggleSidebar?: () => void; coordinator?: boolean }) {
    return <SystemHeader onToggleSidebar={onToggleSidebar} />;
}
