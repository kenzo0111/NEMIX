import { Menu } from 'lucide-react';

export default function MobileSidebarToggle({ className = '', onToggleSidebar }: { className?: string; onToggleSidebar?: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggleSidebar || (() => window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar')))}
            aria-label="Open navigation menu"
            className={`mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 md:hidden dark:text-slate-300 dark:hover:bg-slate-800 ${className}`}
        >
            <Menu size={19} aria-hidden="true" />
        </button>
    );
}
