import type { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';
import SystemHeader from './SystemHeader';
interface PageHeaderProps {
    title: string; description?: string; breadcrumbs?: { name: string; href?: string }[];
    actions?: ReactNode; onToggleSidebar?: () => void;
}
export default function PageHeader({ title, description, breadcrumbs = [], actions, onToggleSidebar }: PageHeaderProps) {
    return <>
        <SystemHeader onToggleSidebar={onToggleSidebar} />
        <section aria-label={`${title} overview`} className="mx-auto w-full min-w-0 max-w-[1600px] px-4 pt-4 sm:px-7 sm:pt-7 lg:px-8 lg:pt-8 print:hidden">
            {breadcrumbs.length > 0 && <div className="mb-6"><Breadcrumbs items={breadcrumbs} currentPage={title} /></div>}
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                <div className="min-w-0">
                    <p className="mb-2 text-sm font-semibold text-red-900 dark:text-red-300">Supply &amp; Property Management Office</p>
                    <h2 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
                    {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
                </div>
                {actions && <div className="flex max-w-full flex-wrap items-center gap-2 lg:shrink-0">{actions}</div>}
            </div>
        </section>
    </>;
}
