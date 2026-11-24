import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PageProps } from '@/types';
import { roleDesignation, SYSTEM_TITLE } from '@/utils/systemIdentity';
import DashboardControls from './DashboardControls';

export default function SystemHeader({ onToggleSidebar, actions, children }: { onToggleSidebar?: () => void; actions?: ReactNode; children?: ReactNode }) {
    const { auth, system } = usePage<PageProps>().props;
    const mode = system?.mode || 'LIVE PRODUCTION';
    return <header className="relative z-30 w-full min-w-0 text-slate-900 dark:text-slate-100 print:hidden">
        {mode !== 'LIVE PRODUCTION' && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">{mode === 'MAINTENANCE MODE' ? 'Maintenance mode: only System Administrators can make changes.' : mode === 'STAGING SANDBOX' ? 'Staging environment: using isolated test data.' : mode === 'TRAINING SIMULATION' ? 'Training mode: using sample data.' : mode}</p>}
        <div className="flex min-w-0 flex-col justify-between gap-4 xl:flex-row xl:items-start">
            <div className="flex min-w-0 flex-1 items-start gap-3">
                <button type="button" onClick={onToggleSidebar || (() => window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar')))} aria-label="Toggle navigation menu" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 md:hidden dark:text-slate-300 dark:hover:bg-slate-800"><Menu size={20} aria-hidden="true" /></button>
                <div className="min-w-0">
                    {children ?? <><p className="text-sm font-semibold text-red-900 dark:text-red-300">SupplySync</p>
                    <p className="mt-0.5 break-words font-sans text-lg font-semibold leading-snug sm:text-xl">{SYSTEM_TITLE}</p>
                    <p data-role-designation className="mt-1 text-sm text-slate-600 dark:text-slate-400">{roleDesignation(auth)}</p></>}
                </div>
            </div>
            <div className="flex max-w-full flex-col items-start gap-3 xl:items-end">
                <DashboardControls />
                {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
            </div>
        </div>
    </header>;
}
