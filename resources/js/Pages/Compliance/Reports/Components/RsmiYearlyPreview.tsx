import { Button } from '@/Components/ui/button';
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
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
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
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 shadow-sm print:hidden compliance-print-hide space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                                Yearly RSMI report package — {yearlyData.year}
                            </h4>
                            <span className="px-2 py-0.5 bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-900/50 rounded text-sm tabular-nums font-semibold">
                                Appendix 64 Package
                            </span>
                        </div>
                        <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {totalActiveMonths} Active Monthly Periods • {totalFormsCount} Official Forms Generated
                        </p>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 font-medium text-sm">Filter View:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-sm">
                            {selectedMonthFilter === 'ALL'
                                ? 'All 12 Months'
                                : `${MONTH_NAMES[selectedMonthFilter - 1]} ${yearlyData.year}`}
                        </span>
                    </div>
                </div>

                {/* Month Selector Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar scroll-smooth">
                    <Button aria-pressed={selectedMonthFilter === 'ALL'} variant="tab"
                        type="button"
                        onClick={() => setSelectedMonthFilter('ALL')}
                        className=""
                    >
                        All Months ({totalFormsCount})
                    </Button>

                    {yearlyData.months.map((m) => {
                        const isSelected = selectedMonthFilter === m.month;
                        const shortName = m.month_name.substring(0, 3);
                        const formCount = m.forms?.length || 0;

                        return (
                            <Button aria-pressed={isSelected} variant="tab"
                                key={`month-tab-${m.month}`}
                                type="button"
                                onClick={() => setSelectedMonthFilter(m.month)}
                                className="inline-flex items-center gap-1.5"
                            >
                                <span>{shortName}</span>
                                {m.has_records ? (
                                    <span
                                        className={`px-1.5 py-0.5 rounded-full text-sm font-semibold ${isSelected
    ? "bg-red-800 text-white" : "bg-red-50 dark:bg-red-950/40 text-red-900 dark:text-red-300 border border-red-200 dark:border-red-900/50"}`}
                                    >
                                        {formCount}
                                    </span>
                                ) : (
                                    <span className="text-sm text-slate-500 dark:text-slate-400">0</span>
                                )}
                            </Button>
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
                                className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-center text-sm text-slate-500 dark:text-slate-400 font-medium print:hidden compliance-print-hide my-3"
                            >
                                <span className="font-semibold text-slate-600 dark:text-slate-200">{m.month_name} {yearlyData.year}</span> — No RSMI issuance records recorded for this monthly reporting period.
                            </div>
                        );
                    }

                    return (
                        <div key={`month-group-${m.month}`} className="space-y-6 print:space-y-0">
                            {/* Screen-Only Month Section Banner */}
                            <div className="flex items-center justify-between px-3 py-1.5 bg-red-950/5 dark:bg-red-950/30 border-l-4 border-l-red-900 dark:border-l-red-500 rounded-r-lg print:hidden compliance-print-hide">
                                <div className="flex items-center gap-2">
                                    <span className="font-sans font-semibold text-sm text-red-950 dark:text-red-200 normal-case tracking-normal">
                                        {m.month_name} {yearlyData.year}
                                    </span>
                                    <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                        ({m.period_label})
                                    </span>
                                </div>
                                <span className="text-sm tabular-nums text-red-900 dark:text-red-300 font-semibold">
                                    {m.forms.length} Official RSMI {m.forms.length === 1 ? 'Form' : 'Forms'}
                                </span>
                            </div>

                            {/* Render each form page inside month */}
                            {m.forms.map((form, formIdx) => (
                                <div
                                    key={`form-${m.month}-${formIdx}-${form.serialNo}`}
                                    className="rsmi-yearly-page-break print:break-before-page print:page-break-before-always mb-8 print:mb-0"
                                >
                                    <Suspense fallback={<div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">Loading form template...</div>}>
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
