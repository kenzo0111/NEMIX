import { Button } from '@/Components/ui/button';
import { usePage } from '@inertiajs/react';
import { PageProps } from '@/types';
import React from 'react';
import Select from 'react-select';
import { InventoryItem, IssuanceLine } from '../types';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';
import { Trash2 } from 'lucide-react';

interface IssuanceItemRowProps {
    index: number;
    itemLine: IssuanceLine;
    items: InventoryItem[];
    selectedItemIds: number[];
    canRemove: boolean;
    onChangeItem: (index: number, itemId: string) => void;
    onChangeQuantity: (index: number, quantity: string) => void;
    onRemove: (index: number) => void;
    errorItem?: string;
    errorQuantity?: string;
}

export const IssuanceItemRow: React.FC<IssuanceItemRowProps> = ({
    index,
    itemLine,
    items,
    selectedItemIds,
    canRemove,
    onChangeItem,
    onChangeQuantity,
    onRemove,
    errorItem,
    errorQuantity,
}) => {
    const strictStock = usePage<PageProps>().props.system?.settings?.['inventory.strict_stock_enforcement'] !== false;
    const currentItemId = Number(itemLine.item_id);
    const selectedItem = items.find((i) => i.id === currentItemId) || null;

    // Filter available options: exclude items selected in other rows
    const availableOptions = items
        .filter((item) => item.id === currentItemId || !selectedItemIds.includes(item.id))
        .map((item) => ({
            value: String(item.id),
            label: `${item.name} (${item.sku}) - Stock: ${item.stock} ${item.unit_of_issue || 'pcs'}`,
            item,
        }));

    const selectValue = selectedItem
        ? {
              value: String(selectedItem.id),
              label: `${selectedItem.name} (${selectedItem.sku}) - Stock: ${selectedItem.stock} ${selectedItem.unit_of_issue || 'pcs'}`,
              item: selectedItem,
          }
        : null;

    const selectStyles = getInstitutionalSelectStyles(Boolean(errorItem));

    return (
        <div className="p-3.5 bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                {/* Item Select */}
                <div className="flex-1 w-full">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Item #{index + 1}
                    </label>
                    <Select
                        value={selectValue}
                        onChange={(selected) => onChangeItem(index, selected?.value || '')}
                        options={availableOptions}
                        placeholder="Select inventory item..."
                        styles={selectStyles}
                        classNamePrefix="react-select"
                        isClearable
                    />
                    {errorItem && <p className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errorItem}</p>}
                </div>

                {/* Available Stock Indicator */}
                <div className="w-full sm:w-36 flex-shrink-0">
                    <label className="block text-sm font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Available Stock
                    </label>
                    <div className="h-10 px-3 flex items-center bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-md text-sm tabular-nums font-semibold text-slate-800 dark:text-slate-200">
                        {selectedItem ? (
                            <span className={selectedItem.stock <= 0 ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}>
                                {selectedItem.stock} {selectedItem.unit_of_issue || 'pcs'}
                            </span>
                        ) : (
                            <span className="text-slate-500 dark:text-slate-400 font-sans font-normal">—</span>
                        )}
                    </div>
                </div>

                {/* Quantity to Issue */}
                <div className="w-full sm:w-28 flex-shrink-0">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Quantity
                    </label>
                    <input aria-invalid={Boolean(errorQuantity)}
                        type="number"
                        min="1"
                        max={strictStock && selectedItem ? Math.max(0, selectedItem.stock) : 1000000}
                        value={itemLine.quantity}
                        onChange={(e) => onChangeQuantity(index, e.target.value)}
                        placeholder="Qty"
                        className={"ui-field " + (`w-full h-10 px-3 bg-white dark:bg-slate-950 border rounded-md text-sm tabular-nums font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-red-900 dark:focus:border-red-600 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 shadow-sm ${errorQuantity ? "border-red-400 dark:border-red-500" : "border-slate-300 dark:border-slate-700"}`)}
                    />
                    {errorQuantity && <p className="leading-relaxed mt-1 text-sm text-red-600 dark:text-red-400 font-medium">{errorQuantity}</p>}
                </div>

                {/* Remove Action Button */}
                {canRemove && (
                    <div className="flex-shrink-0 pt-1 sm:pt-0">
                        <Button variant="secondary" size="icon"
                            type="button"
                            onClick={() => onRemove(index)}
                            className="h-10 flex items-center justify-center"
                            title="Remove line item"
                            aria-label="Remove item"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};
