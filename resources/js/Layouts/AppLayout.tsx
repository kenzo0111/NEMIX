import DashboardContent from '@/Layouts/DashboardContent';
import type { PropsWithChildren, ReactNode } from 'react';
import { Head, usePage } from '@inertiajs/react';
import DashboardLayout from './DashboardLayout';
import { getSidebarModules } from '@/utils/sidebarConfig';
import type { PageProps } from '@/types';
import SystemHeader from '@/Components/SystemHeader';
interface AppLayoutProps extends PropsWithChildren {
    title?: string; activeModule?: string; activeSubmodule?: string;
    header?: ReactNode; actions?: ReactNode; breadcrumbs?: ReactNode;
}
export default function AppLayout({ title, activeModule, activeSubmodule, header, actions, breadcrumbs, children }: AppLayoutProps) {
    const { auth } = usePage<PageProps>().props;
    return <DashboardLayout modules={getSidebarModules(activeModule, activeSubmodule)} user={auth.user}>
        {title && <Head title={title} />}
        <DashboardContent>
            {breadcrumbs}
            <SystemHeader actions={actions}>{header || (title ? <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1> : undefined)}</SystemHeader>
            {children}
        </DashboardContent>
    </DashboardLayout>;
}
