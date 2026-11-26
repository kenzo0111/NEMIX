import { formatScreenDate } from '@/utils/displayFormat';
import { Button } from '@/Components/ui/button';
import React, { useMemo } from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getReportTypeShortLabel } from '../constants';
import { ComplianceReport } from '../types';
import useAuthorization from '@/Hooks/useAuthorization';
import { useSortableData } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';

type ReportSortKey = 'reference' | 'type' | 'title' | 'coverage' | 'generated';

interface ReportRegistryProps {
    reports: ComplianceReport[];
    onViewReport: (report: ComplianceReport) => void;
    onOpenGenerate: () => void;
}

export const ReportRegistry: React.FC<ReportRegistryProps> = ({
    reports,
    onViewReport,
    onOpenGenerate,
}) => {
    const { can } = useAuthorization();
    const accessors = useMemo(() => ({
        reference: (report: ComplianceReport) => report.reference,
        type: (report: ComplianceReport) => getReportTypeShortLabel(report.type),
        title: (report: ComplianceReport) => report.title,
        coverage: (report: ComplianceReport) => report.coverageLabel || report.date,
        generated: (report: ComplianceReport) => new Date(report.created_at || report.createdAt || report.generatedDate || report.date || ''),
    }), []);
    const { sortedRows, sort, requestSort } = useSortableData<ComplianceReport, ReportSortKey>(reports, accessors, { key: 'generated', direction: 'desc' });

    return (
        <div className="w-full min-w-0 overflow-hidden">
            {reports.length > 0 ? (
                <div className="w-full min-w-0 overflow-x-auto">
                    <table className="ui-data-table w-full min-w-[53rem] text-left border-collapse">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700">
                            <tr>
                                <SortableTableHeader column="reference" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[8.125rem] align-middle">
                                    Reference No.
                                </SortableTableHeader>
                                <SortableTableHeader column="type" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[7rem] align-middle">
                                    Form Type
                                </SortableTableHeader>
                                <SortableTableHeader column="title" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[12.5rem] align-middle">
                                    Document Title
                                </SortableTableHeader>
                                <SortableTableHeader column="coverage" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="px-5 py-3.5 text-sm font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap min-w-[8.75rem] align-middle">
                                    Coverage Period
                                </SortableTableHeader>
                                <SortableTableHeader column="generated" activeColumn={sort.key} direction={sort.direction} onSort={requestSort} className="hidden px-5 py-3.5 text-sm font-semibold text-slate-700 md:table-cell dark:text-slate-300 whitespace-nowrap min-w-[8.125rem] align-middle">
                                    Date Generated
                                </SortableTableHeader>
                                <th scope="col" className="px-5 py-3.5 text-sm font-semibold tracking-normal text-right text-slate-700 dark:text-slate-300 normal-case tabular-nums whitespace-nowrap min-w-[10rem] align-middle">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
                            {sortedRows.map((report) => {
                                const shortType = getReportTypeShortLabel(report.type);
                                const coverageText =
                                    report.coverageLabel ||
                                    (report.date ? formatDisplayDate(report.date, 'MM/DD/YYYY') : 'All Records');
                                const genDate =
                                    report.generatedDate ||
                                    report.createdAt ||
                                    report.created_at ||
                                    report.date;

                                return (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-red-50/20 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-0 group"
                                    >
                                        <td className="px-5 py-3.5 whitespace-nowrap text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums tracking-normal align-middle">
                                            {report.reference}
                                        </td>
                                        <td className="px-5 py-3.5 whitespace-nowrap align-middle">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold normal-case tracking-normal bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-200/80 dark:border-red-900/40 tabular-nums">
                                                {shortType}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm font-medium text-slate-900 dark:text-slate-100 min-w-[12.5rem] max-w-sm break-words align-middle">
                                            <div className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                                                {report.title}
                                            </div>
                                            {report.supplierName && (
                                                <div className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                    Supplier: {report.supplierName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-slate-600 dark:text-slate-400 whitespace-nowrap font-medium align-middle">
                                            {coverageText}
                                        </td>
                                        <td className="hidden md:table-cell px-5 py-3.5 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400 tabular-nums align-middle">
                                            {formatScreenDate(genDate)}
                                        </td>
                                        {/* Actions: View & Official COA Form */}
                                        <td className="px-5 py-3.5 whitespace-nowrap min-w-[10rem] text-right align-middle">
                                            <div className="inline-flex items-center justify-end gap-2 shrink-0">
                                                <Button variant="secondary"
                                                    type="button"
                                                    onClick={() => onViewReport(report)}
                                                    className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center"
                                                >
                                                    View
                                                </Button>
                                                <Button variant="secondary"
                                                    type="button"
                                                    onClick={() => onViewReport(report)}
                                                    className="min-h-[2.25rem] h-[2.25rem] inline-flex items-center justify-center"
                                                >
                                                    COA Form
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="p-12 text-center">
                    <div className="w-12 h-12 mx-auto bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">No Compliance Reports Found</h3>
                    <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        There are no documents matching your search or filter criteria. You can generate a new report or migrate historical records.
                    </p>
                    {can('compliance.reports.store') && can('compliance.reports.preview_dataset') && (
                        <Button variant="primary"
                            type="button"
                            onClick={onOpenGenerate}
                            className="mt-4 inline-flex items-center justify-center gap-2 tabular-nums"
                        >
                            <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                            </svg>
                            Generate Report
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
};
