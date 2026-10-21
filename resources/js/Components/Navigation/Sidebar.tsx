import React, { useState, useEffect, useMemo } from 'react';
import { router, usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import {
    SidebarModule,
    SidebarProps,
    SidebarUser as SidebarUserType,
} from '@/types/navigation';
import { getSidebarModules, SIDEBAR_CATEGORIES } from '@/utils/sidebarConfig';
import SidebarBrand from './SidebarBrand';
import SidebarSection from './SidebarSection';
import SidebarItem from './SidebarItem';
import SidebarUser from './SidebarUser';
import SignOutDialog from './SignOutDialog';
import SupplyRequestAlerts from './SupplyRequestAlerts';
import useAuthorization from '@/Hooks/useAuthorization';
import { ArrowLeftRight } from 'lucide-react';

export default function Sidebar({
    modules: initialModules,
    user: propUser,
    collapsed = false,
    onToggleCollapse,
    className = '',
    activeModule,
    activeSubmodule,
}: SidebarProps) {
    const { props: pageProps, url: pageUrl } = usePage<PageProps>();
    const authUser = propUser || (pageProps.auth?.user as SidebarUserType | undefined);
    const capabilities = pageProps.auth?.capabilities;
    const isCoordinator = Boolean(capabilities?.coordinatorInventory);
    const isSystemAdmin = pageProps.auth?.is_system_admin ?? false;
    const { canAny } = useAuthorization();

    // Load modules if not explicitly passed
    const rawModules = useMemo(() => {
        return initialModules || getSidebarModules(activeModule, activeSubmodule);
    }, [initialModules, activeModule, activeSubmodule]);

    // Filter modules and submodules according to capabilities
    const filteredModules = useMemo(() => {
        return rawModules
            .map((mod) => {
                if (mod.coordinatorOnly && !capabilities?.coordinatorInventory) return null;
                // If module has submodules, filter them
                if (mod.submodules && mod.submodules.length > 0) {
                    const accessibleSubmodules = mod.submodules.filter((sub) => {
                        if (isSystemAdmin || !capabilities) return true;
                        if (sub.requiredCapability) {
                            return sub.requiredCapability(capabilities);
                        }
                        return true;
                    });

                    // If no submodules remain accessible, the module itself is hidden
                    if (accessibleSubmodules.length === 0) {
                        return null;
                    }

                    return {
                        ...mod,
                        submodules: accessibleSubmodules,
                    };
                }

                // Top-level module check
                if (isSystemAdmin || !capabilities) return mod;
                if (mod.requiredCapability && !mod.requiredCapability(capabilities)) {
                    return null;
                }

                return mod;
            })
            .filter((mod): mod is SidebarModule => mod !== null);
    }, [rawModules, capabilities, isSystemAdmin]);

    const navigationGroups = useMemo(() => {
        if (!isCoordinator) {
            return (['overview', 'logistics', 'governance'] as const).map(key => {
                const items = filteredModules.filter(item => item.category === key);
                return { key, title: items[0]?.categoryTitle || SIDEBAR_CATEGORIES[key].title, items };
            });
        }

        const unitInventory = filteredModules.find(item => item.key === 'delivery-unit-inventory');
        const params = new URLSearchParams(pageUrl.split('?')[1] || '');
        const viewingHistory = params.get('tab') === 'history' || params.has('page');
        const inventoryItems: SidebarModule[] = unitInventory ? [
            { ...unitInventory, active: Boolean(unitInventory.active && !viewingHistory) },
            {
                ...unitInventory,
                key: 'unit-stock-movements',
                title: 'Stock Movements',
                icon: ArrowLeftRight,
                href: route('coordinator.inventory.index', { tab: 'history' }),
                active: Boolean(unitInventory.active && viewingHistory),
            },
        ] : [];
        const assignedKeys = new Set(['dashboard', 'delivery-unit-inventory', 'central-supply-catalog', 'my-requests']);
        return [
            { key: 'overview', title: 'Overview', items: filteredModules.filter(item => item.key === 'dashboard') },
            { key: 'inventory', title: 'Inventory Management', items: inventoryItems },
            {
                key: 'requests', title: 'Catalog & Requests',
                items: ['central-supply-catalog', 'my-requests'].flatMap(key =>
                    filteredModules.filter(item => item.key === key).map(item => ({ ...item, title: key === 'central-supply-catalog' ? 'Supply Catalog' : 'My Requests' }))
                ),
            },
            { key: 'administration', title: 'Administration', items: filteredModules.filter(item => !assignedKeys.has(item.key)) },
        ];
    }, [filteredModules, isCoordinator, pageUrl]);

    // Active module detection for accordion
    const activeModuleTitle = useMemo(() => {
        return filteredModules.find(
            (m) => m.active || (m.submodules && m.submodules.some((s) => s.active))
        )?.title;
    }, [filteredModules]);

    const [expandedModule, setExpandedModule] = useState<string | null>(
        activeModuleTitle || null
    );
    const [mobileOpen, setMobileOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    // Responsive screen width detection to decouple mobile drawer from desktop collapse state
    const [isDesktop, setIsDesktop] = useState(() => {
        if (typeof window !== 'undefined') {
            return window.innerWidth >= 768;
        }
        return true;
    });

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const mediaQuery = window.matchMedia('(min-width: 768px)');
        const updateMatch = (e: MediaQueryListEvent | MediaQueryList) => {
            setIsDesktop(e.matches);
            if (e.matches) {
                setMobileOpen(false);
            }
        };
        updateMatch(mediaQuery);
        mediaQuery.addEventListener('change', updateMatch);
        return () => mediaQuery.removeEventListener('change', updateMatch);
    }, []);

    // The mobile drawer (w-72) always shows full labels, submenus, and normal footer regardless of desktop collapse
    const effectiveCollapsed = isDesktop && !mobileOpen ? collapsed : false;

    // Keep accordion synchronized if active route or active module changes
    useEffect(() => {
        if (activeModuleTitle && !effectiveCollapsed) {
            setExpandedModule(activeModuleTitle);
        }
    }, [activeModuleTitle, effectiveCollapsed]);

    // Listen for mobile sidebar events and close upon Inertia navigation
    useEffect(() => {
        const handleToggleMobile = () => setMobileOpen((prev) => !prev);
        const handleCloseMobile = () => setMobileOpen(false);

        window.addEventListener('toggle-nemix-mobile-sidebar', handleToggleMobile);
        window.addEventListener('close-nemix-mobile-sidebar', handleCloseMobile);

        const removeInertiaListener = router.on('navigate', () => {
            setMobileOpen(false);
        });

        return () => {
            window.removeEventListener('toggle-nemix-mobile-sidebar', handleToggleMobile);
            window.removeEventListener('close-nemix-mobile-sidebar', handleCloseMobile);
            removeInertiaListener();
        };
    }, []);

    const handleToggleSubmenu = (title: string) => {
        if (effectiveCollapsed) {
            if (onToggleCollapse) onToggleCollapse();
            setExpandedModule(title);
        } else {
            setExpandedModule((prev) => (prev === title ? null : title));
        }
    };

    const handleConfirmLogout = () => {
        setIsLoggingOut(true);
        router.post(
            route('logout'),
            {},
            {
                onFinish: () => {
                    setIsLoggingOut(false);
                    setShowLogoutModal(false);
                },
            }
        );
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity md:hidden print:hidden"
                    aria-label="Close navigation menu backdrop"
                />
            )}

            <aside
                aria-label={isCoordinator ? 'Supply coordinator navigation' : 'Main navigation'}
                className={`
                    fixed inset-y-0 left-0 z-50 bg-red-950 border-r border-red-900/60
                    text-white shadow-xl transition-all duration-300 ease-in-out flex flex-col select-none overflow-x-hidden print:hidden
                    bg-[radial-gradient(ellipse_at_bottom_left,_#7f1d1d55,_transparent_65%)]
                    ${collapsed ? 'md:w-20' : 'md:w-72'}
                    ${mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:translate-x-0'}
                    ${className}
                `}
            >
                <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute inset-x-0 bottom-0 h-[60%]">
                        <img
                            src="/images/cnsc-campus-bg.jpg"
                            alt=""
                            className="h-full w-full object-cover object-[60%_center] opacity-40 mix-blend-luminosity"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-red-950 via-red-950/[0.65] to-red-950/40" />
                    </div>
                    <div className="absolute -left-12 bottom-[22%] h-12 w-[140%] -rotate-[25deg] border-y border-red-300/10 bg-red-900/[0.15]" />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-950/20 to-red-950/[0.45]" />
                </div>
                {/* University Institutional Header */}
                <SidebarBrand
                    collapsed={effectiveCollapsed}
                    onCloseMobile={() => setMobileOpen(false)}
                />

                {/* Main Navigation Body */}
                <nav aria-label="Workspace pages" className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 relative z-10 scrollbar-hide no-scrollbar space-y-5">
                    {((canAny(['inventory.requests.approve', 'inventory.requests.reject', 'inventory.requests.release', 'inventory.requests.verify-document']) && capabilities?.inventory?.issuance) || (capabilities as any)?.requiresSupportingDocument) && (
                        <SupplyRequestAlerts collapsed={effectiveCollapsed} onExpand={onToggleCollapse} />
                    )}
                    {navigationGroups.map((group) => {
                        if (group.items.length === 0) {
                            return null;
                        }

                        return (
                            <div key={group.key} className="space-y-1">
                                <SidebarSection
                                    title={group.title}
                                    collapsed={effectiveCollapsed}
                                />

                                {group.items.map((item) => (
                                    <SidebarItem
                                        key={item.key}
                                        item={item}
                                        isExpanded={expandedModule === item.title}
                                        onToggle={handleToggleSubmenu}
                                        collapsed={effectiveCollapsed}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* Institutional User Profile Footer & Collapse Controls */}
                <SidebarUser
                    coordinator={isCoordinator}
                    user={authUser}
                    collapsed={effectiveCollapsed}
                    onToggleCollapse={onToggleCollapse}
                    onOpenLogoutModal={() => setShowLogoutModal(true)}
                />
            </aside>

            {/* Logout Confirmation Dialog */}
            <SignOutDialog
                show={showLogoutModal}
                isLoggingOut={isLoggingOut}
                onClose={() => !isLoggingOut && setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
            />
        </>
    );
}
