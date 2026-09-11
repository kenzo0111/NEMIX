import React from 'react';
import { SystemSettings } from '../types';
import { Info, Radio } from 'lucide-react';

interface RfidSettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
}

export default function RfidSettings({
    settings,
    onChange,
    errors = {},
}: RfidSettingsProps) {
    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                    RFID Scanner Configuration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                    Operational parameters for the stockroom UHF RFID antenna and scanning terminals.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Active Operating Mode */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Operational Mode</span>
                        <span className="text-red-600 font-normal">*</span>
                    </label>
                    <select
                        value={settings['rfid.active_mode']}
                        onChange={(e) =>
                            onChange('rfid.active_mode', e.target.value as any)
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-medium text-slate-900 bg-white shadow-2xs hover:border-slate-300"
                    >
                        <option value="bin_association">
                            Bin / Shelf Tag Association (Supported)
                        </option>
                        <option value="issuance_verification" disabled>
                            Consumable Issuance Verification (Planned)
                        </option>
                        <option value="rpci_stocktake" disabled>
                            RPCI Physical Inventory Stocktaking (Planned)
                        </option>
                    </select>
                    {errors['settings.rfid.active_mode'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.rfid.active_mode']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Pairs RFID transponder tags with physical inventory catalog items.
                    </p>
                </div>

                {/* Scan Delay Debounce */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                        <span>Scan Delay (Debounce)</span>
                        <span className="text-red-600 font-normal">*</span>
                    </label>
                    <div className="relative">
                        <input
                            type="number"
                            min="300"
                            max="10000"
                            step="100"
                            value={settings['rfid.scan_debounce_ms']}
                            onChange={(e) =>
                                onChange(
                                    'rfid.scan_debounce_ms',
                                    parseInt(e.target.value, 10) || 1200
                                )
                            }
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-red-900/10 focus:border-red-800 text-sm font-semibold text-slate-900 bg-white shadow-2xs hover:border-slate-300"
                        />
                        <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-medium">
                            ms
                        </span>
                    </div>
                    {errors['settings.rfid.scan_debounce_ms'] && (
                        <p className="text-xs text-red-600 mt-1">{errors['settings.rfid.scan_debounce_ms']}</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        Cooldown delay (300–10,000 ms) preventing duplicate scans when a tag lingers in the antenna beam.
                    </p>
                </div>
            </div>

            {/* Status note */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <Radio className="w-4 h-4 text-red-900 shrink-0" />
                <span className="text-xs text-slate-600">
                    Active hardware transport integrates with WebUSB/Serial and keyboard wedge transponder readers.
                </span>
            </div>
        </div>
    );
}
