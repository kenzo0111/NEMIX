import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '@/Hooks/useTheme';

interface ThemeToggleProps {
    variant?: 'segmented' | 'compact' | 'sidebar';
    className?: string;
}

export default function ThemeToggle({
    variant = 'compact',
    className = '',
}: ThemeToggleProps) {
    const { theme, resolvedTheme, setTheme } = useTheme();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const options: { mode: ThemeMode; label: string; icon: typeof Sun }[] = [
        { mode: 'light', label: 'Light', icon: Sun },
        { mode: 'dark', label: 'Dark', icon: Moon },
        { mode: 'system', label: 'System', icon: Monitor },
    ];

    // ==========================================
    // VARIANT 1: SEGMENTED PILL (e.g. Header / Settings)
    // ==========================================
    if (variant === 'segmented') {
        return (
            <div
                role="radiogroup"
                aria-label="Theme mode selection"
                className={`inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-medium select-none shadow-2xs ${className}`}
            >
                {options.map(({ mode, label, icon: Icon }) => {
                    const isSelected = theme === mode;
                    return (
                        <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setTheme(mode)}
                            title={`Switch to ${label} theme`}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-900/30 dark:focus:ring-amber-400/30 ${
                                isSelected
                                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-amber-300 shadow-xs border border-slate-200/60 dark:border-slate-700 font-semibold'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5 shrink-0" />
                            <span>{label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // ==========================================
    // VARIANT 2: SIDEBAR FOOTER COMPACT
    // ==========================================
    if (variant === 'sidebar') {
        return (
            <div
                role="radiogroup"
                aria-label="Theme selection"
                className={`flex items-center justify-center gap-1 p-1 bg-red-950/80 border border-red-900/50 rounded-lg select-none ${className}`}
            >
                {options.map(({ mode, label, icon: Icon }) => {
                    const isSelected = theme === mode;
                    return (
                        <button
                            key={mode}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            onClick={() => setTheme(mode)}
                            title={`Theme: ${label}`}
                            className={`p-1.5 rounded transition-all cursor-pointer focus:outline-none ${
                                isSelected
                                    ? 'bg-red-900 text-amber-300 shadow-xs'
                                    : 'text-red-300/70 hover:text-white hover:bg-white/5'
                            }`}
                        >
                            <Icon className="w-3.5 h-3.5" />
                            <span className="sr-only">{label}</span>
                        </button>
                    );
                })}
            </div>
        );
    }

    // ==========================================
    // VARIANT 3: COMPACT DROPDOWN (Header standard)
    // ==========================================
    const CurrentIcon =
        theme === 'light' ? Sun : theme === 'dark' ? Moon : Monitor;

    return (
        <div ref={dropdownRef} className={`relative inline-block text-left ${className}`}>
            <button
                type="button"
                onClick={() => setDropdownOpen((prev) => !prev)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
                aria-label={`Theme: ${theme}. Click to change theme`}
                title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
                className="inline-flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-red-900/20 dark:focus:ring-amber-400/30 cursor-pointer"
            >
                <CurrentIcon className="w-4 h-4 text-slate-700 dark:text-amber-300" />
            </button>

            {dropdownOpen && (
                <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 mt-1.5 w-36 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 font-mono">
                        Theme
                    </div>
                    {options.map(({ mode, label, icon: Icon }) => {
                        const isSelected = theme === mode;
                        return (
                            <button
                                key={mode}
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                    setTheme(mode);
                                    setDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-1.5 text-xs font-medium text-left transition-colors cursor-pointer ${
                                    isSelected
                                        ? 'text-red-900 dark:text-amber-300 bg-red-50/70 dark:bg-amber-500/10 font-semibold'
                                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <Icon className="w-3.5 h-3.5 shrink-0" />
                                    <span>{label}</span>
                                </span>
                                {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-red-800 dark:text-amber-300 shrink-0" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
