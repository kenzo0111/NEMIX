import { Link, usePage } from '@inertiajs/react';
import { ChevronRightIcon, HomeIcon } from 'lucide-react';
import { PageProps } from '@/types';
import { AuthCapabilities } from '@/types/navigation';

export interface BreadcrumbItem {
    name: string;
    href?: string;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    currentPage: string;
}

type Destination = { routeName: string; allowed: (capabilities: AuthCapabilities) => boolean };

const sectionDestinations: Record<string, Destination[]> = {
    Overview: [{ routeName: 'dashboard', allowed: (caps) => caps.dashboard }],
    Inventory: [{ routeName: 'inventory.index', allowed: (caps) => caps.inventory.view }],
    Suppliers: [{ routeName: 'suppliers.index', allowed: (caps) => caps.suppliers.view }],
    Compliance: [
        { routeName: 'compliance.reports', allowed: (caps) => caps.compliance.reports },
        { routeName: 'compliance.analytics', allowed: (caps) => caps.compliance.analytics },
    ],
    'Audit Logs': [
        { routeName: 'audit-logs.login-trails', allowed: (caps) => caps.audit.login },
        { routeName: 'audit-logs.transaction-trails', allowed: (caps) => caps.audit.transactions },
    ],
    'Access Control': [
        { routeName: 'access-control.role-permission', allowed: (caps) => caps.accessControl.roles },
        { routeName: 'access-control.staffs', allowed: (caps) => caps.accessControl.staff },
    ],
};

export default function Breadcrumbs({ items, currentPage }: BreadcrumbsProps) {
    const { auth } = usePage<PageProps>().props;
    const currentRoute = route().current();
    const canOpenDashboard = auth.is_system_admin || Boolean(auth.capabilities?.dashboard);
    const visibleItems = items.filter((item, index) =>
        index !== items.length - 1 || item.name.trim().toLowerCase() !== currentPage.trim().toLowerCase()
    );

    const destinationFor = (item: BreadcrumbItem) => {
        if (item.href && item.href !== '#') return item.href;
        const destination = sectionDestinations[item.name]?.find(({ allowed }) =>
            auth.is_system_admin || Boolean(auth.capabilities && allowed(auth.capabilities))
        );
        return destination && destination.routeName !== currentRoute ? route(destination.routeName) : undefined;
    };

    if (visibleItems.length === 0) return null;

    return (
        <nav className="max-w-full overflow-hidden text-xs sm:text-sm font-medium text-gray-500 dark:text-slate-400" aria-label="Breadcrumb">
            <ol className="flex min-w-0 items-center gap-1 whitespace-nowrap">
                {canOpenDashboard && (
                    <li className="flex shrink-0 items-center">
                        <Link href={route('dashboard')} className="text-gray-400 dark:text-slate-500 hover:text-gray-700 dark:hover:text-slate-200 transition" aria-label="Dashboard">
                            <HomeIcon className="w-4 h-4" aria-hidden="true" />
                        </Link>
                    </li>
                )}
                {visibleItems.map((item, index) => {
                    const href = destinationFor(item);
                    return (
                        <li key={`${item.name}-${index}`} className="flex min-w-0 items-center">
                            {(canOpenDashboard || index > 0) && <ChevronRightIcon className="w-4 h-4 shrink-0 text-gray-400 dark:text-slate-500 mx-1" aria-hidden="true" />}
                            {href ? (
                                <Link href={href} className="block min-w-0 max-w-40 sm:max-w-56 truncate text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-slate-100 hover:underline transition" title={item.name}>
                                    {item.name}
                                </Link>
                            ) : (
                                <span className="block min-w-0 max-w-40 sm:max-w-56 truncate text-gray-500 dark:text-slate-400" title={item.name}>{item.name}</span>
                            )}
                        </li>
                    );
                })}
                <li className="sr-only" aria-current="page">{currentPage}</li>
            </ol>
        </nav>
    );
}
