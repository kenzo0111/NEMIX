import type { ReactNode } from 'react';
import Breadcrumbs from './Breadcrumbs';
import SystemHeader from './SystemHeader';
interface PageHeaderProps {
    title: string; description?: string; breadcrumbs?: { name: string; href?: string }[];
    actions?: ReactNode; onToggleSidebar?: () => void;
}
export default function PageHeader({ title, description, breadcrumbs = [], actions, onToggleSidebar }: PageHeaderProps) {
    return <SystemHeader actions={actions} onToggleSidebar={onToggleSidebar}>
        {breadcrumbs.length > 0 && <Breadcrumbs items={breadcrumbs} currentPage={title} />}
        <h2 className="break-words text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 max-w-prose text-sm leading-relaxed text-slate-600 dark:text-slate-400">{description}</p>}
    </SystemHeader>;
}
