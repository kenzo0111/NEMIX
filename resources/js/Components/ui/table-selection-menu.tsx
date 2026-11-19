import React from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown, MousePointerClick } from 'lucide-react';

export interface SelectionMenuAction {
    label: string;
    onSelect: () => void;
    hidden?: boolean;
    disabled?: boolean;
    destructive?: boolean;
}

interface TableSelectionMenuProps {
    selectedLabel?: string | null;
    actions: SelectionMenuAction[];
    buttonLabel?: string;
}

export default function TableSelectionMenu({ selectedLabel, actions, buttonLabel = 'Manage selected' }: TableSelectionMenuProps) {
    const visibleActions = actions.filter((action) => !action.hidden);
    return (
        <div className="flex flex-col gap-3 border-b border-slate-200 bg-red-50/50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-slate-800 dark:bg-red-950/15">
            <p className="inline-flex min-w-0 items-center gap-2 text-sm text-slate-600 dark:text-slate-300" role="status" aria-live="polite">
                <MousePointerClick className="h-4 w-4 shrink-0 text-red-900 dark:text-red-400" aria-hidden="true" />
                {selectedLabel ? <span className="truncate">Selected: <strong className="text-slate-900 dark:text-slate-100">{selectedLabel}</strong></span> : <span>Select one row to continue.</span>}
            </p>
            <Menu as="div" className="relative shrink-0">
                <MenuButton disabled={!selectedLabel || visibleActions.length === 0} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-red-950 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-red-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-800 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none sm:w-auto dark:disabled:bg-slate-800 dark:disabled:text-slate-500">
                    {buttonLabel}<ChevronDown className="h-4 w-4" aria-hidden="true" />
                </MenuButton>
                <MenuItems transition anchor="bottom end" className="z-50 mt-1 w-52 origin-top-right rounded-lg border border-slate-200 bg-white p-1 shadow-xl transition duration-100 ease-out focus:outline-none data-[closed]:scale-95 data-[closed]:opacity-0 dark:border-slate-700 dark:bg-slate-900">
                    {visibleActions.map((action) => (
                        <MenuItem key={action.label} disabled={action.disabled}>
                            <button type="button" onClick={action.onSelect} className={`flex w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors data-[focus]:bg-red-50 data-[focus]:text-red-950 disabled:cursor-not-allowed disabled:opacity-40 dark:data-[focus]:bg-red-950/40 dark:data-[focus]:text-red-200 ${action.destructive ? 'text-red-700 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>{action.label}</button>
                        </MenuItem>
                    ))}
                </MenuItems>
            </Menu>
        </div>
    );
}
