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
            <SystemHeader
                onToggleSidebar={onToggleSidebar}
                actions={actions}
                breadcrumbs={breadcrumbs.length > 0 ? <Breadcrumbs items={breadcrumbs} currentPage={title} /> : undefined}
            >
                <p className="mb-1.5 text-sm font-semibold text-red-900 dark:text-red-300">Supply &amp; Property Management Office</p>
                <h1 className="break-words text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl dark:text-slate-50">{title}</h1>
                {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
            </SystemHeader>
        </section>
    </>;
}
