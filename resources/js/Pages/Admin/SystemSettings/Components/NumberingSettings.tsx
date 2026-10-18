import React from 'react';

interface NumberingSettingsProps {
    previews: Record<string, string>;
}

export default function NumberingSettings({ previews }: NumberingSettingsProps) {
    const sequences = [
        {
            key: 'RIS',
            format: 'YYYY-MM-####',
            name: 'Requisition & Issue Slip (RIS)',
            shortName: 'RIS',
            description: 'Individual supply issuance vouchers (Appendix 63)',
            resetRule: 'Monthly',
        },
        {
            key: 'RSMI',
            format: 'YYYY-MM-###',
            name: 'Report of Supplies & Materials Issued (RSMI)',
            shortName: 'RSMI',
            description: 'Monthly summary issuance ledgers (Appendix 64)',
            resetRule: 'Monthly',
        },
        {
            key: 'RPCI',
            format: 'YYYY-###',
            name: 'Report on the Physical Count of Inventories (RPCI)',
            shortName: 'RPCI',
            description: 'Annual physical inventory count verification',
            resetRule: 'Annual',
        },
        {
            key: 'STOCK_CARD',
            format: 'YYYY-#####',
            name: 'Stock Card Reference',
            shortName: 'Stock Card',
            description: 'Stock card document reference',
            resetRule: 'Continuous',
        },
        {
            key: 'MR',
            format: 'YYYY-####',
            name: 'Memorandum Receipt for Property (MOR / MR)',
            shortName: 'MOR / MR',
            description: 'Property accountability acknowledgment (Appendix 59-A)',
            resetRule: 'Annual',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 font-serif">
                    Document Sequences & Series
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Document numbers start with the year, without document-name prefixes. Existing numbers stay unchanged. Suggestions refresh when this page loads; final numbers are reserved on creation.
                </p>
            </div>

            {/* Sequence Table / Grid */}
            <div className="border border-slate-200/80 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-850 border-b border-slate-200/80 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                                <th className="px-5 py-3.5">Document Type</th>
                                <th className="px-5 py-3.5 w-48">Number Format</th>
                                <th className="px-5 py-3.5 w-32">Reset Rule</th>
                                <th className="px-5 py-3.5 w-52">Suggested Next Number</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {sequences.map((seq) => (
                                <tr key={seq.key} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50 transition-colors">
                                    <td className="px-5 py-4">
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">{seq.name}</div>
                                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{seq.description}</div>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="font-mono text-slate-700 dark:text-slate-300">{seq.format}</span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px] font-medium">
                                            {seq.resetRule}
                                        </span>
                                    </td>
                                    <td className="px-5 py-4">
                                        <span className="inline-block px-3 py-1 rounded-lg bg-red-50/70 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/40 font-mono font-bold text-red-950 dark:text-red-300 text-xs">
                                            {previews?.[seq.key] || '—'}
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
