import type { PropsWithChildren } from 'react';
import Sidebar from '@/Components/Sidebar';
import type { SidebarProps } from '@/types/navigation';
import { useSidebarCollapse } from '@/Hooks/useSidebarCollapse';
export default function DashboardLayout({ modules, user, children }: PropsWithChildren<Pick<SidebarProps, 'modules' | 'user'>>) {
    const [collapsed, toggle] = useSidebarCollapse();
    return <div className="dashboard-shell flex min-h-screen w-full min-w-0 bg-[#F5F6F8] font-sans text-slate-900 dark:bg-slate-950 dark:text-slate-100 print:block print:bg-white">
        <a href="#workspace-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:p-3 focus:text-red-900">Skip to content</a>
        <Sidebar modules={modules} user={user} collapsed={collapsed} onToggleCollapse={toggle} />
        <main id="workspace-content" tabIndex={-1} className={"dashboard-main audit-main-content min-w-0 flex-1 transition-[margin] duration-300 motion-reduce:transition-none print:ml-0 print:w-full print:max-w-none print:p-0 " + (collapsed ? 'md:ml-20' : 'md:ml-72')}>{children}</main>
    </div>;
}
