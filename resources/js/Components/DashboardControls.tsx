import SystemModeBadge from '@/Components/SystemModeBadge';
import ThemeToggle from '@/Components/ThemeToggle';
import MobileSidebarToggle from '@/Components/MobileSidebarToggle';

export default function DashboardControls({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-end print:hidden ${className}`}>
            <MobileSidebarToggle className="mr-auto mt-0" />
            <div className="flex max-w-full flex-wrap items-center gap-2 sm:gap-3">
                <SystemModeBadge />
                <ThemeToggle variant="compact" />
            </div>
        </div>
    );
}
