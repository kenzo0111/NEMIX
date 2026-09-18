import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY = 'nemix_sidebar_collapsed';
const EVENT_NAME = 'nemix-sidebar-collapse-sync';

/**
 * Single consistent hook for managing sidebar collapse state across NEMIX.
 * Hydrates from localStorage, persists mutations, and synchronizes state.
 */
export function useSidebarCollapse(): [boolean, () => void] {
    const [collapsed, setCollapsed] = useState<boolean>(() => {
        try {
            if (typeof window !== 'undefined' && window.localStorage) {
                return window.localStorage.getItem(STORAGE_KEY) === 'true';
            }
        } catch {
            // Ignore storage errors in restricted contexts
        }
        return false;
    });

    const toggleCollapse = useCallback(() => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(STORAGE_KEY, String(next));
                    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: next }));
                }
            } catch {
                // Ignore storage errors
            }
            return next;
        });
    }, []);

    // Listen for sync events from other components/handlers
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const handleSync = (event: Event) => {
            const customEvent = event as CustomEvent<boolean>;
            if (typeof customEvent.detail === 'boolean') {
                setCollapsed(customEvent.detail);
            }
        };

        const handleStorage = (e: StorageEvent) => {
            if (e.key === STORAGE_KEY && e.newValue !== null) {
                setCollapsed(e.newValue === 'true');
            }
        };

        window.addEventListener(EVENT_NAME, handleSync);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener(EVENT_NAME, handleSync);
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return [collapsed, toggleCollapse];
}

export default useSidebarCollapse;
