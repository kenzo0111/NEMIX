import React, { ChangeEvent } from 'react';
import Modal from '@/Components/Modal';
import Select from 'react-select';
import { customSelectStyles, REPORT_TYPE_OPTIONS } from '../constants';
import { getFieldMappingMatrix } from './parsers/fieldMapping';
import { useHistoricalMigration } from '../hooks/useHistoricalMigration';
import { MigrationFormType } from './migrationTypes';

interface MigrationDialogProps {
    show: boolean;
    onClose: () => void;
    migration: ReturnType<typeof useHistoricalMigration>;
    onCompleteNotification?: (res: { success: boolean; message: string }) => void;
}

export const MigrationDialog: React.FC<MigrationDialogProps> = ({
    show,
    onClose,
    migration,
    onCompleteNotification,
}) => {
    const {
        formType,
        setFormType,
        source,
        setSource,
        fileName,
        isExtracting,
        isSubmitting,
        statusMessage,
        groups,
        validation,
        processFile,
        submitMigration,
    } = migration;

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processFile(file);
        }
    };

    const handleConfirm = () => {
        submitMigration((res) => {
            if (res.success) {
                onClose();
            }
            onCompleteNotification?.(res);
        });
    };

    const previewRows = groups.flatMap((g) => g.items);
    const mappingMatrix = getFieldMappingMatrix(formType, previewRows);

    return (
        <Modal
            show={show}
            onClose={() => !isSubmitting && onClose()}
            maxWidth="6xl"
            closeable={!isSubmitting}
        >
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-2xl border border-gray-200">
                {/* Thin Amber-Maroon Accent Top Line */}
                <div className="h-1 bg-gradient-to-r from-amber-600 via-red-900 to-red-950 w-full shrink-0" />

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200/80 bg-gradient-to-b from-gray-50/90 to-white shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-amber-900 shadow-2xs shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight truncate">
                                    Historical Data Migration Workspace
                                </h3>
                                <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-900 font-mono font-bold text-[10px] rounded-md tracking-wider">
                                    Legacy Ingestion
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 font-medium mt-0.5 truncate">
                                Extract, map, validate, and import legacy COA audit spreadsheets and documents into official database records.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50/40">
                    {/* Setup Controls Card */}
                    <div className="bg-white rounded-xl border border-gray-200/80 p-4.5 shadow-2xs space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 font-mono flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                1. Ingestion Target & Source
                            </span>
                            <span className="text-[10px] text-gray-400 font-medium">Archive Batch Settings</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                                    Form Type <span className="text-red-700">*</span>
                                </label>
                                <Select
                                    options={REPORT_TYPE_OPTIONS}
                                    value={REPORT_TYPE_OPTIONS.find((opt) => opt.value === formType)}
                                    onChange={(opt: any) => setFormType(opt ? (opt.value as MigrationFormType) : 'RSMI')}
                                    styles={customSelectStyles}
                                    isSearchable={false}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Legacy Source / Archive Batch Identifier
                                </label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="e.g. Legacy Excel 2024 Audit Archive"
                                    className="w-full h-9 text-xs px-3 border border-gray-300 rounded-lg bg-white focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-2xs hover:border-gray-400 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Upload Box */}
                    <div className="bg-white rounded-xl border border-gray-200/80 p-4.5 shadow-2xs space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-red-950 font-mono flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                2. Document Upload & Extraction
                            </span>
                            <span className="text-[10px] text-gray-400 font-mono">
                                Excel (.xlsx, .xls) • CSV • PDF • Word (.docx)
                            </span>
                        </div>

                        <div className="rounded-xl border-2 border-dashed border-gray-300 hover:border-red-900/40 bg-gray-50/40 hover:bg-red-50/10 p-5 transition-all">
                            <input
                                type="file"
                                disabled={isExtracting}
                                accept=".xlsx,.xls,.csv,.pdf,.docx"
                                onChange={handleFileChange}
                                className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-red-900 file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white hover:file:bg-red-950 file:shadow-2xs file:cursor-pointer disabled:opacity-50"
                            />

                            {isExtracting ? (
                                <div className="mt-3 flex items-center gap-2.5 text-xs text-red-900 font-medium bg-red-50 p-3 rounded-lg border border-red-200/80 shadow-2xs">
                                    <svg className="w-4 h-4 animate-spin text-red-900 shrink-0" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    <span>{statusMessage || 'Processing and parsing historical document content...'}</span>
                                </div>
                            ) : fileName ? (
                                <div className="mt-3 flex items-center gap-2 text-xs text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200 inline-flex">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span>Loaded file: <strong className="text-gray-900">{fileName}</strong></span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Extraction Summary Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-gray-200/80 rounded-xl p-3 shadow-2xs">
                        <div className="bg-gray-50/80 border border-gray-200/60 rounded-lg p-2.5 text-center">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                                Total Detected
                            </span>
                            <span className="text-lg font-bold text-gray-900 font-mono">
                                {validation.totalDetected}
                            </span>
                        </div>
                        <div className="bg-emerald-50/80 border border-emerald-200/60 rounded-lg p-2.5 text-center text-emerald-800">
                            <span className="block text-[10px] font-bold uppercase tracking-wider font-mono">
                                Ready to Import
                            </span>
                            <span className="text-lg font-bold font-mono text-emerald-700">
                                {validation.validCount}
                            </span>
                        </div>
                        <div className="bg-amber-50/80 border border-amber-200/60 rounded-lg p-2.5 text-center text-amber-800">
                            <span className="block text-[10px] font-bold uppercase tracking-wider font-mono">
                                Duplicates
                            </span>
                            <span className="text-lg font-bold font-mono text-amber-700">
                                {validation.duplicateCount}
                            </span>
                        </div>
                        <div className="bg-red-50/80 border border-red-200/60 rounded-lg p-2.5 text-center text-red-800">
                            <span className="block text-[10px] font-bold uppercase tracking-wider font-mono">
                                Invalid / Missing
                            </span>
                            <span className="text-lg font-bold font-mono text-red-700">
                                {validation.invalidCount}
                            </span>
                        </div>
                    </div>

                    {/* Field Mapping Schema Matrix */}
                    {groups.length > 0 && (
                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3.5 space-y-2">
                            <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                                Field Mapping Schema ({formType})
                            </h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-600 font-semibold uppercase text-[10px] tracking-wider">
                                            <th className="py-1.5 px-3">COA Document Field</th>
                                            <th className="py-1.5 px-3">Mapped Database Field</th>
                                            <th className="py-1.5 px-3">Data Type</th>
                                            <th className="py-1.5 px-3">Sample Detected Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {mappingMatrix.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="py-2 px-3 font-semibold text-gray-900">{item.field}</td>
                                                <td className="py-2 px-3 font-mono text-red-900">{item.dbField}</td>
                                                <td className="py-2 px-3 text-gray-500">{item.type}</td>
                                                <td className="py-2 px-3 text-gray-700 font-medium">
                                                    {String(item.sample || '—')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Review Detected Records Table */}
                    {groups.length > 0 ? (
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold uppercase text-gray-700 tracking-wider">
                                Detected Records Review
                            </h4>
                            {groups.map((group, gIdx) => (
                                <div key={gIdx} className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-2xs">
                                    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between text-xs">
                                        <div className="font-semibold text-gray-800">
                                            Sheet: <span className="font-mono text-gray-900">{group.sheetName}</span>
                                            {group.metadata?.topSerialNo && (
                                                <span className="ml-3 text-gray-500">
                                                    Serial: <strong>{group.metadata.topSerialNo}</strong>
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-3 text-[11px] font-mono">
                                            <span className="text-emerald-700 font-bold">{group.validCount} valid</span>
                                            {group.invalidCount ? (
                                                <span className="text-red-700 font-bold">{group.invalidCount} invalid</span>
                                            ) : null}
                                            {group.duplicateCount ? (
                                                <span className="text-amber-700 font-bold">{group.duplicateCount} duplicates</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto max-h-60">
                                        <table className="w-full text-left text-xs border-collapse">
                                            <thead className="bg-gray-50 text-gray-600 font-semibold uppercase text-[10px] tracking-wider sticky top-0 border-b border-gray-200">
                                                <tr>
                                                    <th className="py-2 px-3">Reference</th>
                                                    <th className="py-2 px-3">Date</th>
                                                    <th className="py-2 px-3">Item Description</th>
                                                    <th className="py-2 px-3 text-right">Quantity</th>
                                                    <th className="py-2 px-3">Recipient / Office</th>
                                                    <th className="py-2 px-3">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {group.items.map((row, rIdx) => {
                                                    const hasError = row.errors && row.errors.length > 0;
                                                    return (
                                                        <tr
                                                            key={rIdx}
                                                            className={hasError ? 'bg-red-50/40' : 'hover:bg-gray-50/50'}
                                                        >
                                                            <td className="py-2 px-3 font-mono font-semibold text-gray-900">
                                                                {row.reference || '—'}
                                                            </td>
                                                            <td className="py-2 px-3 text-gray-600">
                                                                {row.date || '—'}
                                                            </td>
                                                            <td className="py-2 px-3 font-medium text-gray-800 max-w-xs truncate">
                                                                {row.item_name || '—'}
                                                            </td>
                                                            <td className="py-2 px-3 text-right font-mono font-bold text-gray-900">
                                                                {row.quantity ?? row.issue_qty ?? row.receipt_qty ?? 0}
                                                            </td>
                                                            <td className="py-2 px-3 text-gray-600">
                                                                {row.recipient || row.department || '—'}
                                                            </td>
                                                            <td className="py-2 px-3 whitespace-nowrap">
                                                                {hasError ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">
                                                                        {row.errors![0]}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                                                        Ready to Import
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center border border-dashed border-gray-200 rounded-lg text-xs text-gray-500">
                            Upload a legacy {formType} document file (Excel, CSV, PDF, DOCX) to inspect detected records and field mappings before importing to the database.
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-b from-white to-gray-50 border-t border-gray-200/80 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-2xs hover:border-gray-400 transition-all cursor-pointer w-full sm:w-auto text-center"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting || validation.validCount === 0}
                        className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 disabled:opacity-50 transition-all shadow-xs active:scale-[0.99] cursor-pointer w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>Importing Records...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                                <span>Import {validation.validCount} Valid Records</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

