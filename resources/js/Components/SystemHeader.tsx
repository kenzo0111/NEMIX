import { usePage } from '@inertiajs/react';
import { Menu } from 'lucide-react';
import type { ReactNode } from 'react';
import type { PageProps } from '@/types';
import { roleDesignation, SYSTEM_TITLE } from '@/utils/systemIdentity';
import { Button } from '@/Components/ui/button';
import DashboardControls from './DashboardControls';

export default function SystemHeader({ onToggleSidebar, actions, breadcrumbs, children }: { onToggleSidebar?: () => void; actions?: ReactNode; breadcrumbs?: ReactNode; children?: ReactNode }) {
    const { auth, system } = usePage<PageProps>().props;
    const mode = system?.mode || 'LIVE PRODUCTION';
    return <header className="relative z-30 w-full min-w-0 text-slate-900 dark:text-slate-100 print:hidden">
        {mode !== 'LIVE PRODUCTION' && <p role="status" className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">{mode === 'MAINTENANCE MODE' ? 'Maintenance mode: only System Administrators can make changes.' : mode === 'STAGING SANDBOX' ? 'Staging environment: using isolated test data.' : mode === 'TRAINING SIMULATION' ? 'Training mode: using sample data.' : mode}</p>}
        <div className={`flex min-w-0 items-center gap-2 ${breadcrumbs ? 'mb-3' : 'mb-2 md:hidden'}`}>
            <div className="-ml-2 shrink-0 md:hidden">
                <Button variant="ghost" size="icon" type="button" onClick={onToggleSidebar || (() => window.dispatchEvent(new CustomEvent('toggle-nemix-mobile-sidebar')))} aria-label="Toggle navigation menu"><Menu size={20} aria-hidden="true" /></Button>
            </div>
            {breadcrumbs && <div className="min-w-0 flex-1">{breadcrumbs}</div>}
        </div>
        <div className="flex min-w-0 flex-col justify-between gap-4 lg:flex-row lg:items-start">
            <div className="min-w-0 flex-1">
                {children ?? <><p className="text-sm font-semibold text-red-900 dark:text-red-300">SupplySync</p>
                <p className="mt-0.5 break-words font-sans text-lg font-semibold leading-snug sm:text-xl">{SYSTEM_TITLE}</p>
                <p data-role-designation className="mt-1 text-sm text-slate-600 dark:text-slate-400">{roleDesignation(auth)}</p></>}
            </div>
            <div className="flex max-w-full shrink-0 flex-col items-start gap-2.5 lg:items-end">
                <DashboardControls />
                {actions && <div className="flex max-w-full flex-wrap items-center gap-2 lg:justify-end">{actions}</div>}
            </div>
        </div>
    </header>;
}
