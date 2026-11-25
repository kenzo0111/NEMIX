import { useMemo } from 'react';
import Select, { SingleValue } from 'react-select';
import StatusBadge from '@/Components/ui/status-badge';
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
                formatOptionLabel={(option: ItemOption, { context }) => {
                    const item = option.item;
                    const isTagged = Boolean(item.rfid_tag);

                    if (context === 'value') {
                        return (
                            <div className="flex items-center justify-between gap-2 min-w-0">
                                <span className="truncate font-medium text-slate-900 dark:text-slate-100 text-sm">
                                    {item.name}
                                    {item.sku ? (
                                        <span className="ml-1.5 text-slate-500 dark:text-slate-400 font-normal tabular-nums">
                                            ({item.sku})
                                        </span>
                                    ) : null}
                                </span>
                                <StatusBadge tone={isTagged ? 'success' : 'warning'} className="shrink-0">
                                    {isTagged ? 'Tagged' : 'Untagged'}
                                </StatusBadge>
                            </div>
                        );
                    }

                    return (
                        <div className="flex items-center justify-between py-1">
                            <div className="min-w-0 pr-3">
                                <div className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
                                    {item.name}
                                </div>
                                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 tabular-nums">
                                    <span>
                                        Prop: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{item.sku || 'N/A'}</strong>
                                    </span>
                                    {item.rfid_tag && (
                                        <>
                                            <span className="text-slate-300 dark:text-slate-400">•</span>
                                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-[110px]">
                                                Tag: {item.rfid_tag}
                                            </span>
                                        </>
                                    )}
                                    {item.supplier_name && (
                                        <>
                                            <span className="text-slate-300 dark:text-slate-400">•</span>
                                            <span className="truncate max-w-[130px] text-slate-500 dark:text-slate-400 font-sans">
                                                {item.supplier_name}
                                            </span>
                                        </>
                                    )}
                                </div>
                            </div>

                            <StatusBadge tone={isTagged ? 'success' : 'warning'} className="shrink-0">
                                {isTagged ? 'Tagged' : 'Untagged'}
                            </StatusBadge>
                        </div>
                    );
                }}
                styles={institutionalSelectStyles}
            />
        </div>
    );
}
