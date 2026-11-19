import { useMemo, useState } from 'react';

export type SortDirection = 'asc' | 'desc';
export type SortValue = string | number | boolean | Date | null | undefined;

export interface SortState<K extends string = string> {
    key: K;
    direction: SortDirection;
}

export type SortAccessors<T, K extends string> = Record<K, (row: T) => SortValue>;

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

function isEmpty(value: SortValue): boolean {
    return value === null || value === undefined || value === ''
        || (typeof value === 'number' && !Number.isFinite(value))
        || (value instanceof Date && !Number.isFinite(value.getTime()));
}

/** Missing values stay last in both directions. Access dates as Date objects. */
export function compareSortValues(left: SortValue, right: SortValue, direction: SortDirection = 'asc'): number {
    const leftEmpty = isEmpty(left);
    const rightEmpty = isEmpty(right);

    if (leftEmpty && rightEmpty) return 0;
    if (leftEmpty) return 1;
    if (rightEmpty) return -1;

    let comparison: number;
    if (left instanceof Date || right instanceof Date) {
        const leftTime = new Date(left as string | number | Date).getTime();
        const rightTime = new Date(right as string | number | Date).getTime();
        if (!Number.isFinite(leftTime)) return Number.isFinite(rightTime) ? 1 : 0;
        if (!Number.isFinite(rightTime)) return -1;
        comparison = leftTime - rightTime;
    } else if ((typeof left === 'number' || typeof left === 'string')
        && (typeof right === 'number' || typeof right === 'string')
        && String(left).trim() !== '' && String(right).trim() !== ''
        && Number.isFinite(Number(left)) && Number.isFinite(Number(right))) {
        comparison = Number(left) - Number(right);
    } else if (typeof left === 'boolean' && typeof right === 'boolean') {
        comparison = Number(left) - Number(right);
    } else {
        comparison = collator.compare(String(left), String(right));
    }
    return direction === 'asc' ? comparison : -comparison;
}

export function sortRows<T, K extends string>(rows: readonly T[], accessors: SortAccessors<T, K>, sort: SortState<K>): T[] {
    const accessor = accessors[sort.key];
    if (!accessor) return [...rows];
    return rows.map((row, index) => ({ row, index }))
        .sort((left, right) => compareSortValues(accessor(left.row), accessor(right.row), sort.direction) || left.index - right.index)
        .map(({ row }) => row);
}

export function useSortableData<T, K extends string>(
    rows: T[],
    accessors: SortAccessors<T, K>,
    initialSort: SortState<NoInfer<K>>
) {
    const [sort, setSort] = useState<SortState<K>>(initialSort);

    const sortedRows = useMemo(() => sortRows(rows, accessors, sort), [rows, accessors, sort]);

    const requestSort = (key: K) => {
        setSort((current) => ({
            key,
            direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
        }));
    };

    return { sortedRows, sort, requestSort, setSort };
}
