import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PageProps } from '@/types';
import { roleDesignation, SYSTEM_TITLE } from '@/utils/systemIdentity';
import ThemeToggle from './ThemeToggle';
import SystemModeBadge from './SystemModeBadge';

export default function SystemHeader({ onToggleSidebar, actions }: { onToggleSidebar?: () => void; actions?: ReactNode }) {
    const { auth, system } = usePage<PageProps>().props;
    const mode = system?.mode || 'LIVE PRODUCTION';
    return <header className="sticky top-0 z-30 border-b border-slate-200 bg-white text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 print:hidden">
        {mode !== 'LIVE PRODUCTION' && <p role="status" className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">{mode === 'MAINTENANCE MODE' ? 'Maintenance mode: only System Administrators can make changes.' : mode === 'STAGING SANDBOX' ? 'Staging environment: using isolated test data.' : mode === 'TRAINING SIMULATION' ? 'Training mode: using sample data.' : mode}</p>}
        <div className="mx-auto flex w-full max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-7 lg:px-8">
            <div className="flex min-w-0 flex-1 items-start gap-2">
                <button type="button" onClick={onToggleSidebar || (() => window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar')))} aria-label="Toggle navigation menu" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"><Menu size={20} aria-hidden="true" /></button>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-900 dark:text-red-300">SupplySync</p>
                    <p className="mt-0.5 break-words font-sans text-lg font-semibold leading-snug sm:text-xl">{SYSTEM_TITLE}</p>
                    <p data-role-designation className="mt-1 text-sm text-slate-600 dark:text-slate-400">{roleDesignation(auth)}</p>
                </div>
            </div>
            <div className="flex max-w-full flex-wrap items-center gap-2"><SystemModeBadge /><ThemeToggle variant="compact" />{actions}</div>
        </div>
    </header>;
}
