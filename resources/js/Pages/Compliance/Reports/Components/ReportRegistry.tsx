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
        <div className="bg-white border border-gray-200/80 rounded-xl overflow-hidden shadow-xs">
            <div className="px-6 py-4 border-b border-gray-200/80 bg-gray-50/50 flex items-center justify-between">
                <div>
                    <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
                        Official COA Documents
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Historical registry of generated compliance certificates and inventory audit forms.
                    </p>
                </div>
                <span className="text-xs font-medium text-gray-500 font-mono">
                    {reports.length} {reports.length === 1 ? 'document' : 'documents'} recorded
                </span>
            </div>

            {reports.length > 0 ? (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-600 font-semibold uppercase tracking-wider text-[11px]">
                                <th className="py-3 px-6">Reference</th>
                                <th className="py-3 px-6">Type</th>
                                <th className="py-3 px-6">Document Title</th>
                                <th className="py-3 px-6">Coverage</th>
                                <th className="py-3 px-6">Generated</th>
                                <th className="py-3 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700">
                            {reports.map((report) => {
                                const shortType = getReportTypeShortLabel(report.type);
                                const coverageText =
                                    report.coverageLabel ||
                                    (report.date ? formatDisplayDate(report.date, 'MM/DD/YYYY') : '—');
                                const genDate =
                                    report.generatedDate ||
                                    report.createdAt ||
                                    report.created_at ||
                                    report.date;

                                return (
                                    <tr
                                        key={report.id}
                                        className="hover:bg-gray-50/70 transition-colors group"
                                    >
                                        <td className="py-3.5 px-6 font-mono font-bold text-gray-900 whitespace-nowrap">
                                            {report.reference}
                                        </td>
                                        <td className="py-3.5 px-6 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-red-50 text-red-900 border border-red-200 font-mono">
                                                {shortType}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-6 font-medium text-gray-900 max-w-xs truncate">
                                            {report.title}
                                            {report.supplierName && (
                                                <span className="block text-[11px] text-gray-400 font-normal">
                                                    Supplier: {report.supplierName}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-6 text-gray-600 whitespace-nowrap">
                                            {coverageText}
                                        </td>
                                        <td className="py-3.5 px-6 text-gray-600 whitespace-nowrap">
                                            {formatDisplayDate(genDate, 'MM/DD/YYYY')}
                                        </td>
                                        <td className="py-3.5 px-6 text-right whitespace-nowrap">
                                            <button
                                                type="button"
                                                onClick={() => onViewReport(report)}
                                                className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-red-900 hover:text-red-950 bg-red-50/80 hover:bg-red-100 rounded-md border border-red-200/60 transition-colors"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                <span>View</span>
                                            </button>
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
                        className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-red-900 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition-colors"
                    >
                        <span>Generate a report now</span>
                        <span aria-hidden="true">&rarr;</span>
                    </button>
                </div>
            )}
        </div>
    );
};
