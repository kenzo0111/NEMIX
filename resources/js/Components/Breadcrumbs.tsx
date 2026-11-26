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
    className?: string;
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
    'Administration & Governance': [
        { routeName: 'system.settings.index', allowed: (caps) => Boolean(caps.dashboard) },
    ],
};

export default function Breadcrumbs({ items, currentPage, className = '' }: BreadcrumbsProps) {
    const { auth } = usePage<PageProps>().props;
    const currentRoute = route().current();
    const canOpenDashboard = auth.is_system_admin || Boolean(auth.capabilities?.dashboard);
    const dashboardHref = canOpenDashboard ? route('dashboard') : undefined;

    const normalizedCurrent = currentPage.trim().toLowerCase();
    const parentItems = items.filter((item, index) => {
        const normalizedName = item.name.trim().toLowerCase();
        // Avoid repeating the current page in parent items (it is always rendered as the final crumb)
        if (index === items.length - 1 && normalizedName === normalizedCurrent) return false;
        // Avoid duplicating the prepended Home icon when a manual Dashboard crumb is passed
        if (canOpenDashboard && index === 0 && (normalizedName === 'dashboard' || item.href === dashboardHref)) return false;
        return true;
    });

    const destinationFor = (item: BreadcrumbItem) => {
        if (item.href && item.href !== '#') return item.href;
        const destination = sectionDestinations[item.name]?.find(({ allowed }) =>
            auth.is_system_admin || Boolean(auth.capabilities && allowed(auth.capabilities))
        );
        return destination && destination.routeName !== currentRoute ? route(destination.routeName) : undefined;
    };

    if (parentItems.length === 0 && !canOpenDashboard) return null;

    return (
        <nav className={`max-w-full overflow-hidden text-sm font-medium text-slate-500 dark:text-slate-400 ${className}`.trim()} aria-label="Breadcrumb">
            <ol className="flex min-w-0 items-center gap-1 whitespace-nowrap">
                {canOpenDashboard && (
                    <li className="flex shrink-0 items-center">
                        <Link href={route('dashboard')} className="inline-flex items-center rounded p-0.5 text-slate-500 transition hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 dark:text-slate-400 dark:hover:text-slate-100" aria-label="Dashboard">
                            <HomeIcon className="h-4 w-4" aria-hidden="true" />
                        </Link>
                    </li>
                )}
                {parentItems.map((item, index) => {
                    const href = destinationFor(item);
                    return (
                        <li key={`${item.name}-${index}`} className="flex min-w-0 items-center">
                            {(canOpenDashboard || index > 0) && <ChevronRightIcon className="mx-1 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />}
                            {href ? (
                                <Link href={href} className="block min-w-0 max-w-40 truncate text-slate-600 transition hover:text-slate-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 sm:max-w-56 dark:text-slate-300 dark:hover:text-slate-100" title={item.name}>
                                    {item.name}
                                </Link>
                            ) : (
                                <span className="block min-w-0 max-w-40 truncate text-slate-500 sm:max-w-56 dark:text-slate-400" title={item.name}>{item.name}</span>
                            )}
                        </li>
                    );
                })}
                <li className="flex min-w-0 items-center" aria-current="page">
                    <ChevronRightIcon className="mx-1 h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" aria-hidden="true" />
                    <span className="block min-w-0 max-w-48 truncate font-semibold text-slate-800 sm:max-w-72 dark:text-slate-200" title={currentPage}>
                        {currentPage}
                    </span>
                </li>
            </ol>
        </nav>
    );
}
