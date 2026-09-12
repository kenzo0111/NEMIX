import React from 'react';
import { formatDisplayDate } from '@/utils/dateUtils';
import { getReportTypeShortLabel } from '../constants';
import { ComplianceReport } from '../types';

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
    return (
        <div className="overflow-hidden">
            {reports.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[750px] text-left border-collapse">
                        <thead className="bg-gray-50/80 border-b border-gray-200">
                            <tr>
                                <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                    Reference No.
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                    Form Type
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                    Document Title
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                    Coverage Period
                                </th>
                                <th className="hidden md:table-cell px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-gray-700 uppercase font-mono">
                                    Date Generated
                                </th>
                                <th className="px-4 lg:px-6 py-3.5 text-[11px] font-bold tracking-wider text-right text-gray-700 uppercase font-mono w-44">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
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
                                        className="hover:bg-red-50/20 transition-colors border-b border-gray-100 last:border-0 group"
                                    >
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-xs font-bold text-gray-900 font-mono tracking-wide">
                                            {report.reference}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200/80 font-mono">
                                                {shortType}
                                            </span>
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 text-xs font-medium text-gray-900 max-w-xs truncate">
                                            <div className="font-semibold text-gray-900 leading-tight">
                                                {report.title}
                                            </div>
                                            {report.supplierName && (
                                                <div className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                                                    Supplier: {report.supplierName}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-4 lg:px-6 py-4 text-xs text-gray-600 whitespace-nowrap font-medium">
                                            {coverageText}
                                        </td>
                                        <td className="hidden md:table-cell px-4 lg:px-6 py-4 whitespace-nowrap text-xs text-gray-600 font-mono">
                                            {formatDisplayDate(genDate, 'MM/DD/YYYY')}
                                        </td>
                                        {/* Actions: View & Official COA Form (Institutional maroon & neutral outline, identical to Issuance) */}
                                        <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right">
                                            <div className="inline-flex items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={() => onViewReport(report)}
                                                    className="text-gray-700 hover:text-red-950 font-semibold text-xs transition-colors cursor-pointer py-1 px-1.5 rounded hover:bg-gray-100"
                                                >
                                                    View
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => onViewReport(report)}
                                                    className="border border-red-900/30 text-red-950 hover:bg-red-50 hover:border-red-900/50 font-semibold text-xs px-2.5 py-1 rounded transition-colors cursor-pointer shadow-2xs"
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
                    <div className="w-12 h-12 mx-auto bg-gray-100 text-gray-400 rounded-full flex items-center justify-center mb-3">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-800">No Compliance Reports Found</h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                        There are no documents matching your search or filter criteria. You can generate a new report or migrate historical records.
                    </p>
                    <button
                        type="button"
                        onClick={onOpenGenerate}
                        className="mt-4 bg-red-950 hover:bg-red-900 active:bg-red-950 text-white font-bold py-2 px-4 rounded-md shadow-xs transition-colors text-xs inline-flex items-center justify-center gap-2 whitespace-nowrap uppercase font-mono tracking-wider cursor-pointer"
                    >
                        <svg className="w-4 h-4 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                        Generate Report
                    </button>
                </div>
            )}
        </div>
    );
};

