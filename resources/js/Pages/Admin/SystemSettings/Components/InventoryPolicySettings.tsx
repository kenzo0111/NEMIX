import React, { useState } from 'react';
import { SystemSettings } from '../types';
import { Info, Plus, X, AlertTriangle } from 'lucide-react';

interface InventoryPolicySettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
}

export default function InventoryPolicySettings({
    settings,
    onChange,
    errors = {},
}: InventoryPolicySettingsProps) {
    const [newUnitInput, setNewUnitInput] = useState('');

    const lowStock = Number(settings['inventory.low_stock_threshold'] ?? 10);
    const criticalStock = Number(settings['inventory.critical_stock_threshold'] ?? 3);
    const hasThresholdError = criticalStock > lowStock;

    const handleAddUnit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newUnitInput.trim().toLowerCase();
        if (!trimmed) return;

        const currentUnits = settings['inventory.units_of_issue'] || [];
        if (!currentUnits.includes(trimmed)) {
            onChange('inventory.units_of_issue', [...currentUnits, trimmed]);
        }
        setNewUnitInput('');
    };

    const handleRemoveUnit = (unitToRemove: string) => {
        const currentUnits = settings['inventory.units_of_issue'] || [];
        onChange(
            'inventory.units_of_issue',
            currentUnits.filter((u) => u !== unitToRemove)
        );
    };

    return (
        <div className="space-y-8">
            {/* THRESHOLD HIERARCHY */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Stock Thresholds & Reorder Points
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Global safety thresholds dictating automated inventory reorder indicators and stock health status.
                    </p>
                </div>

                {/* Inline Cross-Validation Error Banner */}
                {hasThresholdError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">Invalid Threshold Configuration: </span>
                            Critical stock threshold ({criticalStock}) cannot exceed the low-stock threshold ({lowStock}).
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Low Stock Threshold */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>Global Low-Stock Threshold</span>
                            <span className="text-red-600 font-normal">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={settings['inventory.low_stock_threshold']}
                                onChange={(e) =>
                                    onChange(
                                        'inventory.low_stock_threshold',
                                        parseInt(e.target.value, 10) || 1
                                    )
                                }
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-white shadow-2xs hover:border-slate-300 ${
                                    hasThresholdError || errors['settings.inventory.low_stock_threshold']
                                        ? 'border-rose-400 focus:ring-rose-500'
                                        : 'border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800'
                                }`}
                            />
                            <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-medium">
                                Units
                            </span>
                        </div>
                        {errors['settings.inventory.low_stock_threshold'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.inventory.low_stock_threshold']}
                            </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400 shrink-0" />
                            Triggers Low Stock warning when available balance reaches or falls below this point.
                        </p>
                    </div>

                    {/* Critical Stock Threshold */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span>Critical Stock Threshold</span>
                            <span className="text-red-600 font-normal">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                min="0"
                                max="1000"
                                value={settings['inventory.critical_stock_threshold']}
                                onChange={(e) =>
                                    onChange(
                                        'inventory.critical_stock_threshold',
                                        parseInt(e.target.value, 10) || 0
                                    )
                                }
                                className={`w-full px-3.5 py-2.5 rounded-xl border text-sm font-semibold text-slate-900 bg-white shadow-2xs hover:border-slate-300 ${
                                    hasThresholdError || errors['settings.inventory.critical_stock_threshold']
                                        ? 'border-rose-400 focus:ring-rose-500'
                                        : 'border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800'
                                }`}
                            />
                            <span className="absolute right-3.5 top-2.5 text-xs text-amber-700 font-medium">
                                Units
                            </span>
                        </div>
                        {errors['settings.inventory.critical_stock_threshold'] && (
                            <p className="text-xs text-red-600 mt-1">
                                {errors['settings.inventory.critical_stock_threshold']}
                            </p>
                        )}
                        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Info className="w-3 h-3 text-slate-400 shrink-0" />
                            Indicates inventory requiring immediate replenishment attention.
                        </p>
                    </div>
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* INVENTORY ENFORCEMENT */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Inventory Enforcement Safeguards
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Backend transaction validation rules governing physical stock deductions.
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-3.5">
                    <input
                        type="checkbox"
                        id="strict_stock"
                        checked={settings['inventory.strict_stock_enforcement']}
                        onChange={(e) =>
                            onChange('inventory.strict_stock_enforcement', e.target.checked)
                        }
                        className="w-4 h-4 mt-0.5 rounded text-red-900 focus:ring-red-800 border-slate-300 cursor-pointer"
                    />
                    <div className="flex-1">
                        <label
                            htmlFor="strict_stock"
                            className="text-xs font-semibold text-slate-900 cursor-pointer"
                        >
                            Prevent issuance resulting in negative stock
                        </label>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                            Strictly disallows approvals or issuances when requested quantities exceed available on-hand physical balance.
                        </p>
                    </div>
                </div>
            </div>

            <hr className="border-slate-200/80" />

            {/* RECOGNIZED UNITS OF ISSUE */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-900 font-serif">
                        Recognized Units of Issue
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Standardized units of measure recognized across SPMO receiving vouchers and RIS issuance slips.
                    </p>
                </div>

                {/* Units tag list */}
                <div className="flex flex-wrap items-center gap-2">
                    {(settings['inventory.units_of_issue'] || []).map((unit) => (
                        <span
                            key={unit}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                        >
                            <span>{unit}</span>
                            <button
                                type="button"
                                onClick={() => handleRemoveUnit(unit)}
                                className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors cursor-pointer"
                                title={`Remove ${unit}`}
                                aria-label={`Remove unit ${unit}`}
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </span>
                    ))}
                </div>

                {/* Add new unit input */}
                <form onSubmit={handleAddUnit} className="flex items-center gap-2 max-w-sm pt-1">
                    <input
                        type="text"
                        value={newUnitInput}
                        onChange={(e) => setNewUnitInput(e.target.value)}
                        placeholder="Add new unit (e.g. carton)"
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:ring-1 focus:ring-red-900 focus:border-red-800 shadow-2xs"
                    />
                    <button
                        type="submit"
                        disabled={!newUnitInput.trim()}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-40 flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                    </button>
                </form>
            </div>
        </div>
    );
}
