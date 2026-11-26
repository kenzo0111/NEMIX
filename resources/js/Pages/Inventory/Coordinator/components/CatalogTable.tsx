import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Clock, PackagePlus } from 'lucide-react';
import useAuthorization from '@/Hooks/useAuthorization';
import type { SortState } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import type { CatalogItem, CatalogSortKey } from '../catalog';
import { panel } from '../inventory';

declare function route(name: string, params?: any): string;

export default function CatalogTable({
    items,
    sort,
    onSort,
}: {
    items: CatalogItem[];
    sort: SortState<CatalogSortKey>;
    onSort: (key: CatalogSortKey) => void;
}) {
    const { can } = useAuthorization();

    return (
        <>
            <section data-tour="coordinator-catalog-items" aria-label="Central consumable items" className={panel + " overflow-hidden w-full min-w-0"}>
                <div className="hidden overflow-x-auto lg:block w-full min-w-0">
                    <table className="ui-data-table w-full text-left text-sm min-w-[53rem] border-collapse">
                        <thead className="bg-slate-50 text-sm normal-case tracking-normal text-slate-500 dark:bg-slate-950/50 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <SortableTableHeader column="sku" activeColumn={sort.key} direction={sort.direction} onSort={onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold">
                                    Stock No.
                                </SortableTableHeader>
                                <SortableTableHeader column="name" activeColumn={sort.key} direction={sort.direction} onSort={onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold min-w-[11.25rem]">
                                    Item
                                </SortableTableHeader>
                                <SortableTableHeader column="unit" activeColumn={sort.key} direction={sort.direction} onSort={onSort} className="whitespace-nowrap px-5 py-3.5 font-semibold">
                                    Unit
                                </SortableTableHeader>
                                <SortableTableHeader column="on_hand" activeColumn={sort.key} direction={sort.direction} onSort={onSort} align="right" className="whitespace-nowrap px-5 py-3.5 font-semibold">
                                    In Supply Office
                                </SortableTableHeader>
                                <SortableTableHeader column="available" activeColumn={sort.key} direction={sort.direction} onSort={onSort} align="right" className="whitespace-nowrap px-5 py-3.5 font-semibold">
                                    Available to request
                                </SortableTableHeader>
                                <th scope="col" className="whitespace-nowrap px-5 py-3.5 font-semibold text-right min-w-[10rem]">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {items.map((item) => {
                                const eligible = item.available_quantity > 0 && (item.quota_remaining ?? 0) > 0 && can('inventory.requests.store');
                                const isOutOfStock = item.on_hand <= 0 || item.available_quantity <= 0;

                                return (
                                    <tr key={item.id} className="transition hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                        <td className="whitespace-nowrap px-5 py-3.5 align-middle tabular-nums font-medium text-slate-600 dark:text-slate-300">
                                            {item.sku}
                                        </td>
                                        <td className="px-5 py-3.5 align-middle max-w-sm">
                                            <p className="font-semibold text-slate-900 dark:text-slate-100">{item.name}</p>
                                            {item.description && (
                                                <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">{item.description}</p>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 align-middle text-slate-600 dark:text-slate-300">
                                            {item.unit || 'units'}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 align-middle text-right tabular-nums text-slate-700 dark:text-slate-300">
                                            {item.on_hand.toLocaleString('en-PH')}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 align-middle text-right tabular-nums">
                                            <strong className="text-red-900 dark:text-red-300">{item.available_quantity.toLocaleString('en-PH')}</strong>
                                            {item.is_low_stock && (
                                                <span className="block text-sm font-semibold text-amber-700 dark:text-amber-400">
                                                    Low stock
                                                </span>
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-5 py-3.5 align-middle text-right min-w-[10rem]">
                                            <div className="inline-flex items-center justify-end gap-2 shrink-0">
                                                {eligible ? (
                                                    <Link data-variant="primary" data-size="default"
                                                        href={route('inventory.requests.index', { create: 1, item_id: item.id })}
                                                        className="ui-button inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5 rounded-lg bg-red-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-950 transition-colors shadow-sm whitespace-nowrap"
                                                    >
                                                        Request
                                                        <ArrowRight size={14} />
                                                    </Link>
                                                ) : isOutOfStock ? (
                                                    item.user_pre_order ? (
                                                        <Link data-variant="secondary" data-size="default"
                                                            href={route('inventory.requests.index', { create: 1, mode: 'pre_request', item_id: item.id })}
                                                            className="ui-button inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 transition-colors shadow-sm whitespace-nowrap"
                                                            title="Pre-request this item"
                                                        >
                                                            <Clock size={13} />
                                                            Pre-Requested ({item.user_pre_order.quantity})
                                                            <ArrowRight size={13} />
                                                        </Link>
                                                    ) : (
                                                        <Link data-variant="secondary" data-size="default"
                                                            href={route('inventory.requests.index', { create: 1, mode: 'pre_request', item_id: item.id })}
                                                            className="ui-button inline-flex min-h-[2.25rem] h-[2.25rem] items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 transition-colors shadow-sm whitespace-nowrap"
                                                        >
                                                            <PackagePlus size={14} className="text-amber-800 dark:text-amber-400" />
                                                            Pre-Request
                                                            <ArrowRight size={14} />
                                                        </Link>
                                                    )
                                                ) : (
                                                    <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                                                        {item.weekly_request_limit === null
                                                            ? 'Limit unconfigured'
                                                            : item.quota_remaining === 0
                                                            ? 'Quota used'
                                                            : 'Unavailable'}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="divide-y divide-slate-100 lg:hidden dark:divide-slate-800">
                    {items.map((item) => {
                        const eligible = item.available_quantity > 0 && (item.quota_remaining ?? 0) > 0 && can('inventory.requests.store');
                        const isOutOfStock = item.on_hand <= 0 || item.available_quantity <= 0;

                        return (
                            <article key={item.id} className="space-y-3 p-4 sm:p-5">
                                <h3 className="text-lg font-semibold">{item.name}</h3>
                                <p className="break-all text-sm tabular-nums text-slate-500 dark:text-slate-400">{item.sku}</p>
                                {item.description && <p className="text-sm text-slate-500 dark:text-slate-400">{item.description}</p>}
                                <dl className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <dt className="text-slate-500 dark:text-slate-400">In Supply Office</dt>
                                        <dd className="mt-1 font-semibold tabular-nums">{item.on_hand.toLocaleString('en-PH')} {item.unit}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-slate-500 dark:text-slate-400">Available to request</dt>
                                        <dd className="mt-1 font-semibold tabular-nums text-red-900 dark:text-red-300">
                                            {item.available_quantity.toLocaleString('en-PH')} {item.unit}
                                            {item.is_low_stock && (
                                                <span className="ml-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                                                    (Low stock)
                                                </span>
                                            )}
                                        </dd>
                                    </div>
                                </dl>
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                    {eligible ? (
                                        <Link data-variant="primary" data-size="default"
                                            href={route('inventory.requests.index', { create: 1, item_id: item.id })}
                                            className="ui-button inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-red-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-950 transition-colors shadow-sm"
                                        >
                                            Request This Item
                                            <ArrowRight size={14} />
                                        </Link>
                                    ) : isOutOfStock ? (
                                        item.user_pre_order ? (
                                            <Link data-variant="secondary" data-size="default"
                                                href={route('inventory.requests.index', { create: 1, mode: 'pre_request', item_id: item.id })}
                                                className="ui-button inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 transition-colors shadow-sm"
                                                title="Pre-request this item"
                                            >
                                                <Clock size={13} />
                                                Pre-Requested ({item.user_pre_order.quantity})
                                                <ArrowRight size={13} />
                                            </Link>
                                        ) : (
                                            <Link data-variant="secondary" data-size="default"
                                                href={route('inventory.requests.index', { create: 1, mode: 'pre_request', item_id: item.id })}
                                                className="ui-button inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-300 transition-colors shadow-sm"
                                            >
                                                <PackagePlus size={14} className="text-amber-800 dark:text-amber-400" />
                                                Pre-Request This Item
                                                <ArrowRight size={14} />
                                            </Link>
                                        )
                                    ) : (
                                        <span className="text-sm text-slate-500 dark:text-slate-400 italic block text-center">
                                            {item.weekly_request_limit === null
                                                ? 'Limit unconfigured'
                                                : item.quota_remaining === 0
                                                ? 'Quota used'
                                                : 'Unavailable'}
                                        </span>
                                    )}
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>
        </>
    );
}
