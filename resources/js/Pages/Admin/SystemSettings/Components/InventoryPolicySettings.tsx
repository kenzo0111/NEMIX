import { Button } from '@/Components/ui/button';
import Field from '@/Components/ui/field';
import React, { useState } from 'react';
import { useAuthorization } from '@/Hooks/useAuthorization';
import { SystemSettings } from '../types';
import { Plus, X, AlertTriangle } from 'lucide-react';

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
    const { can } = useAuthorization();
    const canUpdateSettings = can('system.settings.update');
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
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Stock Thresholds & Reorder Points
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Global safety thresholds dictating automated inventory reorder indicators and stock health status.
                    </p>
                </div>

                {/* Inline Cross-Validation Error Banner */}
                {hasThresholdError && (
                    <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-sm text-rose-900 dark:text-rose-300 flex items-start gap-2.5">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5 dark:text-rose-300" />
                        <div>
                            <span className="font-semibold">Invalid Threshold Configuration: </span>
                            Critical stock threshold ({criticalStock}) cannot exceed the low-stock threshold ({lowStock}).
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Field
                        id="inventory-low-stock-threshold"
                        label="Global Low-Stock Threshold"
                        required
                        error={errors['settings.inventory.low_stock_threshold']}
                        hint="Marks stock as low at this balance and triggers replenishment notifications when stock meets or drops below this point, without blocking end-user requests."
                    >
                        <div className="relative">
                            <input
                                aria-invalid={Boolean(hasThresholdError || errors['settings.inventory.low_stock_threshold'])}
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
                                className="ui-field w-full pr-16 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
                                Units
                            </span>
                        </div>
                    </Field>

                    <Field
                        id="inventory-critical-stock-threshold"
                        label="Critical Stock Threshold"
                        required
                        error={errors['settings.inventory.critical_stock_threshold']}
                        hint="Indicates inventory requiring immediate replenishment attention."
                    >
                        <div className="relative">
                            <input
                                aria-invalid={Boolean(hasThresholdError || errors['settings.inventory.critical_stock_threshold'])}
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
                                className="ui-field w-full pr-16 font-semibold [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm text-amber-700 dark:text-amber-400 font-medium">
                                Units
                            </span>
                        </div>
                    </Field>
                </div>
            </div>

            <hr className="border-slate-200/80 dark:border-slate-800" />

            {/* INVENTORY ENFORCEMENT */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Inventory Enforcement Safeguards
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Backend transaction validation rules governing physical stock deductions.
                    </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-200/80 dark:border-slate-800 flex items-start gap-3.5">
                    <input
                        type="checkbox"
                        id="strict_stock"
                        checked={settings['inventory.strict_stock_enforcement']}
                        onChange={(e) =>
                            onChange('inventory.strict_stock_enforcement', e.target.checked)
                        }
                        className="w-4 h-4 mt-0.5 rounded text-red-900 focus:ring-red-800 border-slate-300 dark:border-slate-600 dark:bg-slate-900 cursor-pointer dark:text-red-300"
                    />
                    <div className="flex-1">
                        <label
                            htmlFor="strict_stock"
                            className="text-sm font-semibold text-slate-900 dark:text-slate-100 cursor-pointer"
                        >
                            Prevent issuance resulting in negative stock
                        </label>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                            When enabled, blocks approvals and issuances that exceed unreserved stock. When disabled, permits shortages and records a negative stock balance.
                        </p>
                    </div>
                </div>
            </div>

            <hr className="border-slate-200/80 dark:border-slate-800" />

            {/* RECOGNIZED UNITS OF ISSUE */}
            <div className="space-y-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans">
                        Recognized Units of Issue
                    </h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Standardized units of measure recognized across SPMO receiving vouchers and RIS issuance slips.
                    </p>
                </div>

                {/* Units tag list */}
                <div className="flex flex-wrap items-center gap-2">
                    {(settings['inventory.units_of_issue'] || []).map((unit) => (
                        <span
                            key={unit}
                            className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-lg text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                        >
                            <span>{unit}</span>
                            {canUpdateSettings && <Button
                                variant="ghost"
                                type="button"
                                onClick={() => handleRemoveUnit(unit)}
                                className="min-h-6 h-6 w-6 min-w-0 p-0 rounded-md text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                                title={`Remove ${unit}`}
                                aria-label={`Remove unit ${unit}`}
                            >
                                <X className="w-3.5 h-3.5" />
                            </Button>}
                        </span>
                    ))}
                </div>

                {/* Add new unit input */}
                {canUpdateSettings && <form onSubmit={handleAddUnit} className="flex items-center gap-2 max-w-sm pt-1">
                    <input
                        type="text"
                        value={newUnitInput}
                        onChange={(e) => setNewUnitInput(e.target.value)}
                        placeholder="Add new unit (e.g. carton)"
                        className="ui-field flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-900 focus:ring-1 focus:ring-red-900 dark:focus:ring-red-600 focus:border-red-800 dark:focus:border-red-600 shadow-sm"
                    />
                    <Button variant="secondary"
                        type="submit"
                        disabled={!newUnitInput.trim()}
                        className="flex items-center gap-1"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                    </Button>
                </form>}
            </div>
        </div>
    );
}
