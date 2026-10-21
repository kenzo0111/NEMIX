import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import ThemeToggle from '@/Components/ThemeToggle';

export default function CoordinatorPortalHeader() {
    const { branding } = usePage<any>().props;
    return <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-7 dark:border-slate-800 dark:bg-slate-900/95">
        <div className="flex min-w-0 items-center gap-3"><button type="button" aria-label="Open navigation" onClick={() => window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar'))} className="-ml-2 rounded-lg p-2.5 hover:bg-slate-100 md:hidden dark:hover:bg-slate-800"><Menu size={20} /></button><div className="min-w-0"><p className="truncate text-sm font-semibold">{branding?.institutionName ?? 'University of Camarines Norte'}</p><p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">Supply Coordinator Portal</p></div></div>
        <div className="flex shrink-0 items-center gap-4"><span className="hidden text-sm text-slate-500 xl:block dark:text-slate-400">{new Date().toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span><ThemeToggle variant="compact" /></div>
    </header>;
}
