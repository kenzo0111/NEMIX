import { useMemo } from 'react';
import Select, { SingleValue } from 'react-select';
import { RFIDInventoryItem } from '../types';
import { institutionalSelectStyles } from '../utils/selectStyles';

export interface ItemOption {
    value: number;
    label: string;
    item: RFIDInventoryItem;
}

interface ItemSelectorProps {
    items: RFIDInventoryItem[];
    selectedItem: RFIDInventoryItem | null;
    onSelectItem: (item: RFIDInventoryItem) => void;
}

export default function ItemSelector({
    items,
    selectedItem,
    onSelectItem,
}: ItemSelectorProps) {
    // Sort options: untagged items first, then alphabetical by item name
    const itemOptions: ItemOption[] = useMemo(() => {
        const sorted = [...items].sort((a, b) => {
            if (!a.rfid_tag && b.rfid_tag) return -1;
            if (a.rfid_tag && !b.rfid_tag) return 1;
            return a.name.localeCompare(b.name);
        });

        return sorted.map((item) => ({
            value: item.id,
            label: `${item.name} (${item.sku || 'No Property No'})`,
            item,
        }));
    }, [items]);

    const selectedOption: ItemOption | null = useMemo(() => {
        if (!selectedItem) return null;
        return {
            value: selectedItem.id,
            label: `${selectedItem.name} (${selectedItem.sku || 'No Property No'})`,
            item: selectedItem,
        };
    }, [selectedItem]);

    return (
        <div className="react-select-container">
            <Select<ItemOption>
                options={itemOptions}
                value={selectedOption}
                onChange={(option: SingleValue<ItemOption>) => {
                    if (option) {
                        onSelectItem(option.item);
                    }
                }}
                placeholder="Search by item name or property number..."
                isClearable={false}
                formatOptionLabel={(option: ItemOption) => {
                    const item = option.item;
                    const isTagged = Boolean(item.rfid_tag);

                    return (
                        <div className="flex items-center justify-between py-1">
                            <div className="min-w-0 pr-3">
                                <div className="font-medium text-gray-900 text-xs truncate">
                                    {item.name}
                                </div>
                                <div className="text-[11px] text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span className="font-mono">
                                        Property No: <strong className="text-gray-700 font-semibold">{item.sku || 'N/A'}</strong>
                                    </span>
                                    {item.supplier_name && (
                                        <>
                                            <span className="text-gray-300">•</span>
                                            <span className="truncate max-w-[140px] text-gray-400">
                                                {item.supplier_name}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Minimal dot status */}
                            <span
                                className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium ${
                                    isTagged
                                        ? 'text-emerald-700 bg-emerald-50 border border-emerald-100'
                                        : 'text-gray-600 bg-gray-50 border border-gray-200'
                                }`}
                            >
                                <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                        isTagged ? 'bg-emerald-600' : 'bg-gray-400'
                                    }`}
                                />
                                <span>{isTagged ? 'Tagged' : 'Untagged'}</span>
                            </span>
                        </div>
                    );
                }}
                styles={institutionalSelectStyles}
            />
        </div>
    );
}
