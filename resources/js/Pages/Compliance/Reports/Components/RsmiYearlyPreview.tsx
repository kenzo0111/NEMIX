import React, { useState, Suspense, lazy } from 'react';
import { RsmiYearReport } from '../types';

const RSMIFormPaper = lazy(() =>
    import('../../../../../Official Forms/RSMI Report').then((m) => ({ default: m.RSMIFormPaper })),
);

interface RsmiYearlyPreviewProps {
    yearlyData: RsmiYearReport;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const RsmiYearlyPreview: React.FC<RsmiYearlyPreviewProps> = ({ yearlyData }) => {
    const [selectedMonthFilter, setSelectedMonthFilter] = useState<number | 'ALL'>('ALL');

    if (!yearlyData || !Array.isArray(yearlyData.months)) {
        return (
            <div className="p-8 text-center text-xs text-gray-500">
                No yearly RSMI package data available.
            </div>
        );
    }

    const filteredMonths = yearlyData.months.filter((m) => {
        if (selectedMonthFilter === 'ALL') return true;
        return m.month === selectedMonthFilter;
    });

    const totalActiveMonths = yearlyData.months.filter((m) => m.has_records).length;
    const totalFormsCount = yearlyData.total_forms || 0;

    return (
        <div className="w-full space-y-6">
            {/* Screen-Only Header & Navigation Bar */}
            <div className="bg-white rounded-xl border border-gray-200/90 p-4 shadow-2xs print:hidden compliance-print-hide space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-gray-900 font-serif tracking-tight">
                                YEARLY RSMI REPORT PACKAGE — {yearlyData.year}
                            </h4>
                            <span className="px-2 py-0.5 bg-red-50 text-red-900 border border-red-200 rounded text-[10px] font-mono font-bold">
                                Appendix 64 Package
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {totalActiveMonths} Active Monthly Periods • {totalFormsCount} Official Forms Generated
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-gray-400 font-medium text-[11px]">Filter View:</span>
                        <span className="font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded text-[11px]">
                            {selectedMonthFilter === 'ALL'
                                ? 'All 12 Months'
                                : `${MONTH_NAMES[selectedMonthFilter - 1]} ${yearlyData.year}`}
                        </span>
                    </div>
                </div>

                {/* Month Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
                    <button
                        type="button"
                        onClick={() => setSelectedMonthFilter('ALL')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedMonthFilter === 'ALL'
                                ? 'bg-red-900 text-white shadow-2xs font-bold'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All Months ({totalFormsCount})
                    </button>

                    {yearlyData.months.map((m) => {
                        const isSelected = selectedMonthFilter === m.month;
                        const shortName = m.month_name.substring(0, 3);
                        const formCount = m.forms?.length || 0;

                        return (
                            <button
                                key={`month-tab-${m.month}`}
                                type="button"
                                onClick={() => setSelectedMonthFilter(m.month)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                                    isSelected
                                        ? 'bg-red-900 text-white shadow-2xs font-bold'
                                        : m.has_records
                                        ? 'bg-white border border-gray-300 text-gray-800 hover:bg-gray-50'
                                        : 'bg-gray-100/70 border border-transparent text-gray-400 hover:bg-gray-100'
                                }`}
                            >
                                <span>{shortName}</span>
                                {m.has_records ? (
                                    <span
                                        className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                            isSelected
                                                ? 'bg-red-800 text-white'
                                                : 'bg-red-50 text-red-900 border border-red-200'
                                        }`}
                                    >
                                        {formCount}
                                    </span>
                                ) : (
                                    <span className="text-[10px] text-gray-400">0</span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Monthly Forms Rendering Loop */}
            <div className="space-y-8 print:space-y-0">
                {filteredMonths.map((m) => {
                    if (!m.has_records) {
                        return (
                            <div
                                key={`empty-month-${m.month}`}
                                className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400 font-medium print:hidden compliance-print-hide my-3"
                            >
                                <span className="font-semibold text-gray-600">{m.month_name} {yearlyData.year}</span> — No RSMI issuance records recorded for this monthly reporting period.
                            </div>
                        );
                    }

                    return (
                        <div key={`month-group-${m.month}`} className="space-y-6 print:space-y-0">
                            {/* Screen-Only Month Section Banner */}
                            <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/5 border-l-4 border-l-red-900 rounded-r-lg print:hidden compliance-print-hide">
                                <div className="flex items-center gap-2">
                                    <span className="font-serif font-bold text-xs text-red-950 uppercase tracking-wider">
                                        {m.month_name} {yearlyData.year}
                                    </span>
                                    <span className="text-[11px] text-gray-500 font-medium">
                                        ({m.period_label})
                                    </span>
                                </div>
                                <span className="text-[11px] font-mono text-red-900 font-bold">
                                    {m.forms.length} Official RSMI {m.forms.length === 1 ? 'Form' : 'Forms'}
                                </span>
                            </div>

                            {/* Render each form page inside month */}
                            {m.forms.map((form, formIdx) => (
                                <div
                                    key={`form-${m.month}-${formIdx}-${form.serialNo}`}
                                    className="rsmi-yearly-page-break print:break-before-page print:page-break-before-always mb-8 print:mb-0"
                                >
                                    <Suspense fallback={<div className="p-8 text-center text-xs text-gray-500">Loading form template...</div>}>
                                        <RSMIFormPaper data={form} />
                                    </Suspense>
                                </div>
                            ))}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RsmiYearlyPreview;
