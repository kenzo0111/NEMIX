import SystemModeBadge from './SystemModeBadge';
import ThemeToggle from './ThemeToggle';

export default function DashboardControls({ className = '' }: { className?: string }) {
    return <div className={`flex max-w-full flex-wrap items-center gap-2 ${className}`}>
        <SystemModeBadge />
        <ThemeToggle variant="compact" />
    </div>;
}
