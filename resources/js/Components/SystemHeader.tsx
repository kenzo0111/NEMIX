import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PageProps } from '@/types';
import SystemModeBadge from './SystemModeBadge';
import ThemeToggle from './ThemeToggle';
import { roleDesignation, SYSTEM_TITLE } from '@/utils/systemIdentity';

export default function SystemHeader({ onToggleSidebar, actions }: { onToggleSidebar?: () => void; actions?: ReactNode }) {
    const { auth, system } = usePage<PageProps>().props;
    const mode = system?.mode || 'LIVE PRODUCTION';
    return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 print:hidden">
        {mode !== 'LIVE PRODUCTION' && <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">{mode === 'MAINTENANCE MODE' ? 'Maintenance mode: only System Administrators can make changes.' : mode === 'STAGING SANDBOX' ? 'Staging environment: using isolated test data.' : mode === 'TRAINING SIMULATION' ? 'Training mode: using sample data.' : mode}</p>}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-8">
            <div className="flex min-w-0 flex-1 items-start gap-2">
                <button type="button" onClick={onToggleSidebar || (() => window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar')))} aria-label="Toggle navigation menu" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"><Menu size={20} aria-hidden="true" /></button>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-red-950 dark:text-red-300">SupplySync</p>
                    <h1 className="mt-0.5 break-words font-sans text-xl font-semibold leading-snug tracking-tight sm:text-2xl">{SYSTEM_TITLE}</h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{roleDesignation(auth)} Dashboard</p>
                </div>
            </div>
            <div className="flex max-w-full flex-wrap items-center gap-3"><SystemModeBadge /><ThemeToggle variant="compact" />{actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}</div>
        </div>
    </header>;
}
