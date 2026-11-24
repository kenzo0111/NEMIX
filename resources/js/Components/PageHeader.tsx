import type { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';
import SystemHeader from './SystemHeader';
interface PageHeaderProps {
    title: string; description?: string; breadcrumbs?: { name: string; href?: string }[];
    actions?: ReactNode; onToggleSidebar?: () => void;
    embedded?: boolean;
}
export default function PageHeader({ title, description, breadcrumbs = [], actions, onToggleSidebar, embedded = false }: PageHeaderProps) {
    return <>
        <section aria-label={`${title} overview`} className={embedded ? "w-full min-w-0 print:hidden" : "mx-auto w-full min-w-0 max-w-[1600px] px-4 pt-4 sm:px-7 sm:pt-7 lg:px-8 lg:pt-8 print:hidden"}>
            {breadcrumbs.length > 0 && <div className="mb-6"><Breadcrumbs items={breadcrumbs} currentPage={title} /></div>}
            <SystemHeader onToggleSidebar={onToggleSidebar} actions={actions}>
                <p className="mb-2 text-sm font-semibold text-red-900 dark:text-red-300">Supply &amp; Property Management Office</p>
                <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
                {description && <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
            </SystemHeader>
        </section>
    </>;
}
