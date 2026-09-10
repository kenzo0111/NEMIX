import React from 'react';
import Select from 'react-select';
import { InventoryItem, IssuanceLine } from '../types';
import { getInstitutionalSelectStyles } from '@/styles/selectStyles';

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
        <div className="p-3.5 bg-gray-50/70 border border-gray-200 rounded-lg space-y-2">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                {/* Item Select */}
                <div className="flex-1 w-full">
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
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
                    {errorItem && <p className="mt-1 text-xs text-red-600 font-medium">{errorItem}</p>}
                </div>

                {/* Available Stock Indicator */}
                <div className="w-full sm:w-36 flex-shrink-0">
                    <label className="block text-[11px] font-semibold text-gray-500 mb-1">
                        Available Stock
                    </label>
                    <div className="h-10 px-3 flex items-center bg-white border border-gray-200 rounded-md text-xs font-mono font-bold text-gray-800">
                        {selectedItem ? (
                            <span className={selectedItem.stock <= 0 ? 'text-red-600' : 'text-emerald-700'}>
                                {selectedItem.stock} {selectedItem.unit_of_issue || 'pcs'}
                            </span>
                        ) : (
                            <span className="text-gray-400 font-sans font-normal">—</span>
                        )}
                    </div>
                </div>

                {/* Quantity to Issue */}
                <div className="w-full sm:w-28 flex-shrink-0">
                    <label className="block text-[11px] font-semibold text-gray-700 mb-1">
                        Quantity
                    </label>
                    <input
                        type="number"
                        min="1"
                        max={selectedItem ? selectedItem.stock : 1000000}
                        value={itemLine.quantity}
                        onChange={(e) => onChangeQuantity(index, e.target.value)}
                        placeholder="Qty"
                        className={`w-full h-10 px-3 bg-white border rounded-md text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs ${
                            errorQuantity ? 'border-red-400' : 'border-gray-300'
                        }`}
                    />
                    {errorQuantity && <p className="mt-1 text-xs text-red-600 font-medium">{errorQuantity}</p>}
                </div>

                {/* Remove Action Button */}
                {canRemove && (
                    <div className="flex-shrink-0 pt-1 sm:pt-0">
                        <button
                            type="button"
                            onClick={() => onRemove(index)}
                            className="h-10 px-2.5 text-gray-400 hover:text-red-700 hover:bg-red-50 rounded-md border border-transparent hover:border-red-200 transition-colors cursor-pointer flex items-center justify-center"
                            title="Remove line item"
                            aria-label="Remove item"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
