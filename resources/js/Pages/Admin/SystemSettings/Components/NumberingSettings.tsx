import React from 'react';
import { SystemSettings } from '../types';

interface NumberingSettingsProps {
    settings: SystemSettings;
    onChange: <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => void;
    errors?: Record<string, string>;
}

export default function NumberingSettings({
    settings,
    onChange,
    errors = {},
}: NumberingSettingsProps) {
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');

    const risPrefix = settings['numbering.ris_prefix'] || 'RIS-';
    const rsmiPrefix = settings['numbering.rsmi_prefix'] || 'RSMI-';
    const rpciPrefix = settings['numbering.rpci_prefix'] || 'RPCI-';
    const stockPrefix = settings['numbering.stock_card_prefix'] || 'STOCK-';

    const sequences = [
        {
            key: 'numbering.ris_prefix' as const,
            name: 'Requisition & Issue Slip (RIS)',
            shortName: 'RIS',
            description: 'Individual supply issuance vouchers (Appendix 63)',
            resetRule: 'Annual',
            preview: `${risPrefix}${currentYear}-${currentMonth}-0042`,
        },
        {
            key: 'numbering.rsmi_prefix' as const,
            name: 'Report of Supplies & Materials Issued (RSMI)',
            shortName: 'RSMI',
            description: 'Monthly summary issuance ledgers (Appendix 64)',
            resetRule: 'Monthly',
            preview: `${rsmiPrefix}${currentYear}-${currentMonth}-003`,
        },
        {
            key: 'numbering.rpci_prefix' as const,
            name: 'Report on the Physical Count of Inventories (RPCI)',
            shortName: 'RPCI',
            description: 'Annual physical inventory count verification',
            resetRule: 'Annual',
            preview: `${rpciPrefix}${currentYear}-001`,
        },
        {
            key: 'numbering.stock_card_prefix' as const,
            name: 'Stock Card Reference Prefix',
            shortName: 'Stock Card',
            description: 'Bin-level physical stock card identifier',
            resetRule: 'Continuous',
            preview: `${stockPrefix}00542`,
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-slate-900 font-serif">
                    Document Sequences & Series
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                    Configure prefixes used for official inventory documents. Final sequence values are generated and reserved by the system upon creation.
                </p>
            </div>

            {/* Sequence Table / Grid */}
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                                <th className="px-5 py-3.5">Document Type</th>
                                <th className="px-5 py-3.5 w-48">Prefix</th>
                                <th className="px-5 py-3.5 w-32">Reset Rule</th>
                                <th className="px-5 py-3.5 w-52">Format Preview</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sequences.map((seq) => (
                                <tr key={seq.key} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-slate-900">{seq.name}</div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">{seq.description}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <input
                                            type="text"
                                            value={settings[seq.key]}
                                            onChange={(e) => onChange(seq.key, e.target.value)}
                                            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-semibold text-xs text-slate-900 bg-white focus:ring-1 focus:ring-red-900 focus:border-red-800 shadow-2xs"
                                        />
                                        {errors[`settings.${seq.key}`] && (
                                            <p className="text-xs text-red-600 mt-1">{errors[`settings.${seq.key}`]}</p>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100 text-slate-600 font-mono text-[11px] font-medium">
                                            {seq.resetRule}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block px-3 py-1 rounded-lg bg-red-50/70 border border-red-200/80 font-mono font-bold text-red-950 text-xs">
                                            {seq.preview}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
