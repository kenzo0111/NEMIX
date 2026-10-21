import React from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getReportTypeShortLabel } from '../constants';
import { ComplianceReport } from '../types';
import useAuthorization from '@/Hooks/useAuthorization';

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
    return (
        <div className="overflow-hidden">
            {reports.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left border-collapse">
                        <thead className="bg-gray-50/80 dark:bg-slate-800/60 border-b border-gray-200 dark:border-slate-700">
                            <tr>
                                <th className="px-4 lg:px-6 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                    Reference No.
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                    Form Type
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                    Document Title
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                    Coverage Period
                                </th>
                                <th className="hidden md:table-cell px-4 lg:px-6 py-3.5 text-sm font-bold tracking-normal text-gray-700 dark:text-slate-300 normal-case tabular-nums">
                                    Date Generated
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-sm font-bold tracking-normal text-right text-gray-700 dark:text-slate-300 normal-case tabular-nums w-44">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-slate-900 divide-y divide-gray-100 dark:divide-slate-800">
                            {reports.map((report) => {
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
                                        className="hover:bg-red-50/20 dark:hover:bg-slate-800/50 transition-colors border-b border-gray-100 dark:border-slate-800 last:border-0 group"
                                    >
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-slate-100 tabular-nums tracking-normal">
                                            {report.reference}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-bold normal-case tracking-normal bg-red-50 dark:bg-red-950/50 text-red-900 dark:text-red-300 border border-red-200/80 dark:border-red-900/40 tabular-nums">
                                                {shortType}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 text-sm font-medium text-gray-900 dark:text-slate-100 max-w-xs truncate">
                                            <div className="font-semibold text-gray-900 dark:text-slate-100 leading-tight">
                                                {report.title}
                                            </div>
                                            {report.supplierName && (
                                                <div className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 leading-tight">
                                                    Supplier: {report.supplierName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-600 dark:text-slate-400 whitespace-nowrap font-medium">
                                            {coverageText}
                                        </td>
                                        <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-slate-400 tabular-nums">
                                            {formatDisplayDate(genDate, 'MM/DD/YYYY')}
                                        </td>
                                        {/* Actions: View & Official COA Form */}
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                                            <div className="inline-flex items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewReport(report)}
                                                    className="text-gray-700 dark:text-slate-300 hover:text-red-950 dark:hover:text-red-400 font-semibold text-sm transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100 dark:hover:bg-slate-800"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onViewReport(report)}
                                                    className="border border-red-900/30 dark:border-red-800/50 text-red-950 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/40 hover:border-red-900/50 dark:hover:border-red-800 font-semibold text-sm px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
                                                >
                                                    COA Form
                                                </button>
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
                    <div className="w-12 h-12 mx-auto bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">No Compliance Reports Found</h3>
                    <p className="leading-relaxed text-sm text-gray-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                        There are no documents matching your search or filter criteria. You can generate a new report or migrate historical records.
                    </p>
                    {can('compliance.reports.store') && can('compliance.reports.preview_dataset') && <button
                        type="button"
                        onClick={onOpenGenerate}
                        className="mt-4 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-colors text-sm inline-flex items-center justify-center gap-2 whitespace-nowrap normal-case tabular-nums tracking-normal cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Generate Report
                    </button>}
                </div>
            )}
        </div>
    );
};

