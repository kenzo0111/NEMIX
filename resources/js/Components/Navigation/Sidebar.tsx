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

export default function Sidebar({
    modules: initialModules,
    user: propUser,
    collapsed = false,
    onToggleCollapse,
    className = '',
    activeModule,
    activeSubmodule,
}: SidebarProps) {
    const pageProps = usePage<PageProps>().props;
    const authUser = propUser || (pageProps.auth?.user as SidebarUserType | undefined);
    const capabilities = pageProps.auth?.capabilities;
    const isSystemAdmin = pageProps.auth?.is_system_admin ?? false;

    // Load modules if not explicitly passed
    const rawModules = useMemo(() => {
        return initialModules || getSidebarModules(activeModule, activeSubmodule);
    }, [initialModules, activeModule, activeSubmodule]);

    // Filter modules and submodules according to capabilities
    const filteredModules = useMemo(() => {
        return rawModules
            .map((mod) => {
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

    // Keep accordion synchronized if active route or active module changes
    useEffect(() => {
        if (activeModuleTitle && !collapsed) {
            setExpandedModule(activeModuleTitle);
        }
    }, [activeModuleTitle, collapsed]);

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
        if (collapsed) {
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

    // Category grouping in standard institutional order
    const orderedCategoryKeys = ['overview', 'logistics', 'governance'] as const;

    return (
        <>
            {/* Mobile Backdrop */}
            {mobileOpen && (
                <div
                    onClick={() => setMobileOpen(false)}
                    className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs transition-opacity md:hidden"
                    aria-label="Close navigation menu backdrop"
                />
            )}

            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 bg-red-950 border-r border-red-900/60
                    text-white shadow-xl transition-all duration-300 ease-in-out flex flex-col select-none overflow-x-hidden
                    ${collapsed ? 'md:w-20' : 'md:w-72'}
                    ${mobileOpen ? 'w-72 translate-x-0' : 'w-72 -translate-x-full md:translate-x-0'}
                    ${className}
                `}
            >
                {/* University Institutional Header */}
                <SidebarBrand
                    collapsed={collapsed}
                    onCloseMobile={() => setMobileOpen(false)}
                />

                {/* Main Navigation Body */}
                <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-3 space-y-3 relative z-10 scrollbar-hide no-scrollbar">
                    {orderedCategoryKeys.map((catKey) => {
                        const categoryModules = filteredModules.filter(
                            (m) => m.category === catKey
                        );

                        if (categoryModules.length === 0) {
                            return null;
                        }

                        const categoryTitle =
                            categoryModules[0]?.categoryTitle ||
                            SIDEBAR_CATEGORIES[catKey]?.title ||
                            catKey;

                        return (
                            <div key={catKey} className="space-y-1">
                                <SidebarSection
                                    title={categoryTitle}
                                    collapsed={collapsed}
                                />

                                {categoryModules.map((item) => (
                                    <SidebarItem
                                        key={item.key}
                                        item={item}
                                        isExpanded={expandedModule === item.title}
                                        onToggle={handleToggleSubmenu}
                                        collapsed={collapsed}
                                    />
                                ))}
                            </div>
                        );
                    })}
                </nav>

                {/* Institutional User Profile Footer & Collapse Controls */}
                <SidebarUser
                    user={authUser}
                    collapsed={collapsed}
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
