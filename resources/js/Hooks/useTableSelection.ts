import { useEffect, useState } from 'react';
import type React from 'react';

type RowKey = string | number;

/** Keep one selection, and discard it when filtering or paging removes the row. */
export function useTableSelection<T>(rows: readonly T[], key: (row: T) => RowKey, initialKey: RowKey | null = null) {
    const [selectedKey, setSelectedKey] = useState<RowKey | null>(initialKey);
    const selectedRow = rows.find(row => key(row) === selectedKey) ?? null;
    useEffect(() => {
        if (selectedKey !== null && !selectedRow) setSelectedKey(null);
    }, [selectedKey, selectedRow]);
    return { selectedKey, selectedRow, selectRow: (row: T) => setSelectedKey(key(row)), clearSelection: () => setSelectedKey(null) };
}

function keyboardSelect<E extends HTMLElement>(event: React.KeyboardEvent<E>, onSelect: () => void) {
    // Nested links and form controls retain their own keyboard behavior.
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelect();
    } else if (['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) {
        const rows = Array.from(event.currentTarget.parentElement?.querySelectorAll<E>('[data-selectable-row]') ?? []);
        const index = rows.indexOf(event.currentTarget);
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1
            : Math.max(0, Math.min(rows.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1)));
        if (rows[next]) {
            event.preventDefault();
            rows[next].focus();
            rows[next].click();
        }
    }
}

export function rowSelectionProps(selected: boolean, onSelect: () => void) {
    return {
        tabIndex: 0,
        'aria-selected': selected,
        'data-selectable-row': true,
        'data-state': selected ? 'selected' : undefined,
        onClick: (event: React.MouseEvent<HTMLTableRowElement>) => {
            if ((event.target as HTMLElement).closest('a, button, input, select, textarea')) return;
            onSelect();
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLTableRowElement>) => keyboardSelect(event, onSelect),
    };
}

export function cardSelectionProps(selected: boolean, onSelect: () => void) {
    return {
        role: 'button',
        tabIndex: 0,
        'aria-pressed': selected,
        'data-selectable-row': true,
        'data-state': selected ? 'selected' : undefined,
        onClick: onSelect,
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => keyboardSelect(event, onSelect),
    };
}
