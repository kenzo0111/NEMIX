import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'nemix_theme';
export const THEME_CHANGE_EVENT = 'nemix-theme-change';

/**
 * Reads the persisted theme setting.
 * Default is 'light' for users without a saved preference unless explicitly set.
 */
export function getStoredTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'light';
    try {
        const stored = localStorage.getItem(THEME_STORAGE_KEY);
        if (stored === 'dark' || stored === 'system' || stored === 'light') {
            return stored;
        }
    } catch (e) {
        // Storage access may be blocked in strict sandboxes
    }
    return 'light';
}

/**
 * Resolves 'system' preference against OS prefers-color-scheme.
 */
export function resolveTheme(mode: ThemeMode): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    if (mode === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
}

/**
 * Applies the theme to the <html> document root and syncs data-theme.
 */
export function applyTheme(mode: ThemeMode): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    const resolved = resolveTheme(mode);
    const root = document.documentElement;
    if (resolved === 'dark') {
        root.classList.add('dark');
    } else {
        root.classList.remove('dark');
    }
    root.setAttribute('data-theme', resolved);
    return resolved;
}

/**
 * React hook providing reactive theme state and switcher.
 * Synchronizes across tabs and listens to OS media query changes in system mode.
 */
export function useTheme() {
    const [theme, setThemeState] = useState<ThemeMode>(() => getStoredTheme());
    const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() =>
        resolveTheme(getStoredTheme())
    );

    const setTheme = useCallback((newTheme: ThemeMode) => {
        try {
            localStorage.setItem(THEME_STORAGE_KEY, newTheme);
        } catch (e) {}

        const resolved = applyTheme(newTheme);
        setThemeState(newTheme);
        setResolvedTheme(resolved);

        window.dispatchEvent(
            new CustomEvent(THEME_CHANGE_EVENT, {
                detail: { theme: newTheme, resolvedTheme: resolved },
            })
        );
    }, []);

    useEffect(() => {
        // Apply on initial mount
        const initialMode = getStoredTheme();
        const initialResolved = applyTheme(initialMode);
        setThemeState(initialMode);
        setResolvedTheme(initialResolved);

        // System OS color scheme change listener
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleSystemChange = (e: MediaQueryListEvent) => {
            const currentMode = getStoredTheme();
            if (currentMode === 'system') {
                const resolved = e.matches ? 'dark' : 'light';
                const root = document.documentElement;
                if (resolved === 'dark') {
                    root.classList.add('dark');
                } else {
                    root.classList.remove('dark');
                }
                root.setAttribute('data-theme', resolved);
                setResolvedTheme(resolved);
            }
        };

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleSystemChange);
        } else {
            mediaQuery.addListener(handleSystemChange);
        }

        // Intra-tab custom event listener
        const handleCustomChange = (e: Event) => {
            const customEvent = e as CustomEvent<{ theme: ThemeMode; resolvedTheme: ResolvedTheme }>;
            if (customEvent.detail) {
                setThemeState(customEvent.detail.theme);
                setResolvedTheme(customEvent.detail.resolvedTheme);
            }
        };

        // Cross-tab storage change listener
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === THEME_STORAGE_KEY) {
                const updated = getStoredTheme();
                const resolved = applyTheme(updated);
                setThemeState(updated);
                setResolvedTheme(resolved);
            }
        };

        window.addEventListener(THEME_CHANGE_EVENT, handleCustomChange);
        window.addEventListener('storage', handleStorageChange);

        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', handleSystemChange);
            } else {
                mediaQuery.removeListener(handleSystemChange);
            }
            window.removeEventListener(THEME_CHANGE_EVENT, handleCustomChange);
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    return {
        theme,
        resolvedTheme,
        setTheme,
    };
}
