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
            <div className="flex max-h-[90vh] flex-col overflow-hidden rounded-xl bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 tracking-tight">
                            Historical Data Migration Workspace
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Extract, map, validate, and import legacy COA audit spreadsheets and documents into official database records.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto flex-1 space-y-5">
                    {/* Setup Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
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
                            <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                                Legacy Source / Archive Batch Identifier
                            </label>
                            <input
                                type="text"
                                value={source}
                                onChange={(e) => setSource(e.target.value)}
                                placeholder="e.g. Legacy Excel 2024 Audit Archive"
                                className="w-full text-xs py-2 px-3 border border-gray-300 rounded-md focus:border-red-900 focus:ring-1 focus:ring-red-900"
                            />
                        </div>
                    </div>

                    {/* File Upload Box */}
                    <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50/60 p-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                                Upload Historical File (Excel, CSV, PDF, DOCX)
                            </label>
                            <span className="text-[10px] text-gray-400 font-mono">
                                Excel • CSV • PDF • DOCX
                            </span>
                        </div>

                        <input
                            type="file"
                            disabled={isExtracting}
                            accept=".xlsx,.xls,.csv,.pdf,.docx"
                            onChange={handleFileChange}
                            className="block w-full text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-red-900 file:px-3.5 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-red-950 disabled:opacity-50"
                        />

                        {isExtracting ? (
                            <div className="flex items-center gap-2 text-xs text-red-900 font-medium bg-red-50 p-2.5 rounded-md border border-red-200">
                                <svg className="w-4 h-4 animate-spin text-red-900 shrink-0" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                <span>{statusMessage || 'Processing historical document content...'}</span>
                            </div>
                        ) : fileName ? (
                            <p className="text-xs text-gray-500">
                                Current file: <span className="font-semibold text-gray-800">{fileName}</span>
                            </p>
                        ) : null}
                    </div>

                    {/* Extraction Summary Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white border border-gray-200 rounded-lg p-3">
                        <div className="bg-gray-50 rounded-md p-2.5 text-center">
                            <span className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider font-mono">
                                Detected
                            </span>
                            <span className="text-lg font-bold text-gray-900 font-mono">
                                {validation.totalDetected}
                            </span>
                        </div>
                        <div className="bg-emerald-50 rounded-md p-2.5 text-center text-emerald-800">
                            <span className="block text-[10px] font-bold uppercase tracking-wider font-mono">
                                Ready to Import
                            </span>
                            <span className="text-lg font-bold font-mono">
                                {validation.validCount}
                            </span>
                        </div>
                        <div className="bg-amber-50 rounded-md p-2.5 text-center text-amber-800">
                            <span className="block text-[10px] font-bold uppercase tracking-wider font-mono">
                                Duplicates
                            </span>
                            <span className="text-lg font-bold font-mono">
                                {validation.duplicateCount}
                            </span>
                        </div>
                        <div className="bg-red-50 rounded-md p-2.5 text-center text-red-800">
                            <span className="block text-[10px] font-bold uppercase tracking-wider font-mono">
                                Invalid / Missing
                            </span>
                            <span className="text-lg font-bold font-mono">
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
                <div className="flex items-center justify-between px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting || validation.validCount === 0}
                        className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-red-900 rounded-lg hover:bg-red-950 disabled:opacity-50 transition-colors shadow-xs"
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
