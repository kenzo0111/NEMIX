import { DialogHeader, DialogBody, DialogFooter } from '@/Components/ui/dialog-frame';
import { Button } from '@/Components/ui/button';
import React, { ChangeEvent, useEffect, useState } from 'react';
import Modal from '@/Components/Modal';
import { Upload, X, Loader2, FileText } from 'lucide-react';
import Select from 'react-select';
import { customSelectStyles, REPORT_TYPE_OPTIONS } from '../constants';
import { getFieldMappingMatrix } from './parsers/fieldMapping';
import { useHistoricalMigration } from '../hooks/useHistoricalMigration';
import { MigrationFormType, MigrationItem } from './migrationTypes';
import { sortRows, type SortState, type SortAccessors } from '@/Hooks/useSortableData';
import SortableTableHeader from '@/Components/ui/sortable-table-header';
import useAuthorization from '@/Hooks/useAuthorization';

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
    const { can } = useAuthorization();
    const allowedFormTypes = REPORT_TYPE_OPTIONS.filter(({ value }) => can(
        value === 'RSMI' || value === 'RPCI' ? 'compliance.migrations.store'
            : value === 'STOCK_CARD' ? 'compliance.migrate.stock_card'
            : 'compliance.migrate.memorandum_receipt'
    ));
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

    const [selectedSheetTab, setSelectedSheetTab] = useState<string>('ALL');
    const [recordSort, setRecordSort] = useState<SortState>({ key: 'date', direction: 'asc' });
    const sortRecords = (key: string) => setRecordSort(current => ({ key, direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc' }));
    const recordAccessors: SortAccessors<MigrationItem, string> = {
        reference: row => row.reference, date: row => row.date ? new Date(row.date) : null,
        item: row => row.item_name, quantity: row => row.quantity ?? row.issue_qty ?? row.receipt_qty,
        recipient: row => row.recipient || row.department, status: row => row.errors?.[0] || 'Ready to Import',
    };

    useEffect(() => {
        if (show && allowedFormTypes.length > 0 && !allowedFormTypes.some(({ value }) => value === formType)) {
            setFormType(allowedFormTypes[0].value as MigrationFormType);
        }
    }, [show, formType, allowedFormTypes, setFormType]);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedSheetTab('ALL');
            processFile(file);
        }
    };

    const uniqueSheets = Array.from(new Set(groups.map((g) => g.sheetName)));
    const displayedGroups = selectedSheetTab === 'ALL'
        ? groups
        : groups.filter((g) => g.sheetName === selectedSheetTab);

    const displayedValidCount = displayedGroups.reduce((acc, g) => acc + (g.validCount || 0), 0);

    const handleConfirm = () => {
        submitMigration(
            (res) => {
                if (res.success) {
                    onClose();
                }
                onCompleteNotification?.(res);
            },
            selectedSheetTab === 'ALL' ? undefined : displayedGroups,
        );
    };

    const previewRows = groups.flatMap((g) => g.items);
    const mappingMatrix = getFieldMappingMatrix(formType, previewRows);

    return (
        <Modal
            show={show}
            onClose={() => !isSubmitting && onClose()}
            maxWidth="6xl"
            closeable={!isSubmitting}
            ariaLabel="Historical Data Migration Workspace"
        >
            {/* Thin Amber-Maroon Accent Top Line */}
            <div className="h-1.5 bg-gradient-to-r from-amber-600 via-red-900 to-red-950 w-full shrink-0" />

            {/* Header */}
            <DialogHeader className="flex items-center justify-between px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200/80 dark:border-slate-800 bg-gradient-to-b from-slate-50/90 to-white dark:from-slate-900 dark:to-slate-900 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/50 flex items-center justify-center text-amber-900 dark:text-amber-300 shadow-sm shrink-0">
                            <Upload className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="break-words text-lg font-semibold text-slate-900 dark:text-slate-100 font-sans tracking-tight">
                                    Historical Data Migration Workspace
                                </h3>
                                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-300 tabular-nums font-semibold text-sm rounded-md tracking-normal">
                                    Legacy Ingestion
                                </span>
                            </div>
                            <p className="leading-relaxed text-sm text-slate-500 dark:text-slate-400 font-medium mt-1 break-words">
                                Extract table rows, map fields, review validation, and import legacy COA records from spreadsheets and supported documents.
                            </p>
                        </div>
                    </div>

                    <Button variant="ghost" size="icon"
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="shrink-0 ml-2"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </Button>
                </DialogHeader>

                {/* Content */}
                <DialogBody className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/40 dark:bg-slate-950/60">
                    {/* Setup Controls Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3.5">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-semibold normal-case tracking-normal text-red-950 dark:text-red-300 tabular-nums flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                1. Ingestion Target & Source
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Archive Batch Settings</span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                                    Form Type <span className="text-red-700 dark:text-red-300">*</span>
                                </label>
                                <Select
                                    options={allowedFormTypes}
                                    value={allowedFormTypes.find((opt) => opt.value === formType)}
                                    onChange={(opt: any) => {
                                        const nextType = opt?.value ?? allowedFormTypes[0]?.value;
                                        if (nextType) setFormType(nextType as MigrationFormType);
                                    }}
                                    styles={customSelectStyles}
                                    isSearchable={false}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                                    Legacy Source / Archive Batch Identifier
                                </label>
                                <input
                                    type="text"
                                    value={source}
                                    onChange={(e) => setSource(e.target.value)}
                                    placeholder="e.g. Legacy Excel 2024 Audit Archive"
                                    className="ui-field w-full h-9 text-sm px-3 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:border-red-900 focus:ring-1 focus:ring-red-900 shadow-sm hover:border-slate-400 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    {/* File Upload Box */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 p-4 shadow-sm space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                            <span className="text-sm font-semibold normal-case tracking-normal text-red-950 dark:text-red-300 tabular-nums flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-900"></span>
                                2. Document Upload & Extraction
                            </span>
                            <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                                Excel (.xlsx, .xls) • CSV • PDF (.pdf) • Word (.docx, .doc)
                            </span>
                        </div>

                        <div className="rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-900/40 dark:hover:border-red-800 bg-slate-50/40 dark:bg-slate-800/40 hover:bg-red-50/10 p-5 transition-all">
                            <input
                                type="file"
                                disabled={isExtracting}
                                accept=".xlsx,.xls,.csv,.pdf,.docx,.doc"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-slate-600 dark:text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-red-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-red-950 file:shadow-sm file:cursor-pointer disabled:opacity-50"
                            />

                            {isExtracting ? (
                                <div className="mt-3 flex items-center gap-2.5 text-sm text-red-900 dark:text-red-300 font-medium bg-red-50 dark:bg-red-950/40 p-3 rounded-lg border border-red-200/80 dark:border-red-800/50 shadow-sm">
                                    <Loader2 className="w-4 h-4 animate-spin text-red-900 dark:text-red-400 shrink-0" />
                                    <span>{statusMessage || 'Processing and parsing historical document content...'}</span>
                                </div>
                            ) : fileName ? (
                                <div className="mt-3 flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 inline-flex">
                                    <FileText className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                                    <span>Loaded file: <strong className="text-slate-900 dark:text-slate-100">{fileName}</strong></span>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Extraction Summary Badges */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 shadow-sm">
                        <div className="bg-slate-50/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700 rounded-lg p-2.5 text-center">
                            <span className="block text-sm font-semibold text-slate-500 dark:text-slate-400 normal-case tracking-normal tabular-nums">
                                Total Detected
                            </span>
                            <span className="text-lg font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                {validation.totalDetected}
                            </span>
                        </div>
                        <div className="bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 rounded-lg p-2.5 text-center text-emerald-800 dark:text-emerald-300">
                            <span className="block text-sm font-semibold normal-case tracking-normal tabular-nums">
                                Ready to Import
                            </span>
                            <span className="text-lg font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                                {validation.validCount}
                            </span>
                        </div>
                        <div className="bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 rounded-lg p-2.5 text-center text-amber-800 dark:text-amber-300">
                            <span className="block text-sm font-semibold normal-case tracking-normal tabular-nums">
                                Duplicates
                            </span>
                            <span className="text-lg font-semibold tabular-nums text-amber-700 dark:text-amber-400">
                                {validation.duplicateCount}
                            </span>
                        </div>
                        <div className="bg-red-50/80 dark:bg-red-950/40 border border-red-200/60 dark:border-red-800/50 rounded-lg p-2.5 text-center text-red-800 dark:text-red-300">
                            <span className="block text-sm font-semibold normal-case tracking-normal tabular-nums">
                                Invalid / Missing
                            </span>
                            <span className="text-lg font-semibold tabular-nums text-red-700 dark:text-red-400">
                                {validation.invalidCount}
                            </span>
                        </div>
                    </div>

                    {/* Field Mapping Schema Matrix */}
                    {groups.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 space-y-2">
                            <h4 className="text-base font-semibold normal-case text-slate-700 dark:text-slate-300 tracking-normal">
                                Field Mapping Schema ({formType})
                            </h4>
                            <div className="w-full min-w-0 overflow-x-auto">
                                <table className="ui-data-table w-full text-left text-sm border-collapse min-w-[32rem]">
                                    <thead>
                                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold normal-case text-sm tracking-normal">
                                            <th className="py-3 px-3 align-middle whitespace-nowrap">COA Document Field</th>
                                            <th className="py-3 px-3 align-middle whitespace-nowrap">Mapped Database Field</th>
                                            <th className="py-3 px-3 align-middle whitespace-nowrap">Data Type</th>
                                            <th className="py-3 px-3 align-middle whitespace-nowrap">Sample Detected Value</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                                        {mappingMatrix.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50">
                                                <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 align-middle">{item.field}</td>
                                                <td className="py-3 px-3 tabular-nums text-red-900 dark:text-red-300 align-middle">{item.dbField}</td>
                                                <td className="py-3 px-3 text-slate-500 dark:text-slate-400 align-middle">{item.type}</td>
                                                <td className="py-3 px-3 text-slate-700 dark:text-slate-300 font-medium align-middle">
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
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 dark:border-slate-800 pb-2.5">
                                <h4 className="text-base font-semibold normal-case text-slate-700 dark:text-slate-300 tracking-normal flex items-center gap-2">
                                    <span>Detected Records Review</span>
                                    <span className="text-sm font-normal text-slate-500 dark:text-slate-400 tabular-nums">
                                        ({selectedSheetTab === 'ALL' ? validation.totalDetected : displayedGroups.reduce((a, g) => a + g.items.length, 0)} records in {displayedGroups.length} batches)
                                    </span>
                                </h4>

                                {uniqueSheets.length > 1 && (
                                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                                        <Button variant="tab" size="sm"
                                            type="button"
                                            onClick={() => setSelectedSheetTab('ALL')}
                                            aria-pressed={selectedSheetTab === 'ALL'}
                                            className="tabular-nums shrink-0"
                                        >
                                            All Sheets ({groups.length})
                                        </Button>
                                        {uniqueSheets.map((sName) => {
                                            const sCount = groups.filter((g) => g.sheetName === sName).reduce((a, g) => a + g.items.length, 0);
                                            return (
                                                <Button variant="tab" size="sm"
                                                    key={sName}
                                                    type="button"
                                                    onClick={() => setSelectedSheetTab(sName)}
                                                    aria-pressed={selectedSheetTab === sName}
                                                    className="tabular-nums shrink-0"
                                                >
                                                    {sName} ({sCount})
                                                </Button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {displayedGroups.map((group, gIdx) => (
                                <div key={gIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-sm flex-wrap gap-2">
                                        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 flex-wrap">
                                            <span>Sheet: <strong className="tabular-nums text-slate-900 dark:text-slate-100">{group.sheetName}</strong></span>
                                            {group.metadata?.topSerialNo && (
                                                <span className="text-slate-600 dark:text-slate-300 tabular-nums text-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200/80 dark:border-slate-700">
                                                    Serial: <strong className="text-slate-900 dark:text-slate-100">{group.metadata.topSerialNo}</strong>
                                                </span>
                                            )}
                                            {group.metadata?.topDate && (
                                                <span className="text-slate-500 dark:text-slate-400 text-sm">
                                                    • {group.metadata.topDate}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-3 text-sm tabular-nums">
                                            <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{group.validCount} valid</span>
                                            {group.invalidCount ? (
                                                <span className="text-red-700 dark:text-red-400 font-semibold">{group.invalidCount} invalid</span>
                                            ) : null}
                                            {group.duplicateCount ? (
                                                <span className="text-amber-700 dark:text-amber-400 font-semibold">{group.duplicateCount} duplicates</span>
                                            ) : null}
                                        </div>
                                    </div>

                                    <div className="w-full min-w-0 overflow-x-auto max-h-60">
                                        <table className="ui-data-table w-full text-left text-sm border-collapse min-w-[44rem]">
                                            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold normal-case text-sm tracking-normal sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700">
                                                <tr>
                                                    <SortableTableHeader column="reference" activeColumn={recordSort.key} direction={recordSort.direction} onSort={sortRecords} className="py-3 px-3 min-w-[7.5rem] align-middle">Reference</SortableTableHeader>
                                                    <SortableTableHeader column="date" activeColumn={recordSort.key} direction={recordSort.direction} onSort={sortRecords} className="py-3 px-3 min-w-[6.5rem] align-middle">Date</SortableTableHeader>
                                                    <SortableTableHeader column="item" activeColumn={recordSort.key} direction={recordSort.direction} onSort={sortRecords} className="py-3 px-3 min-w-[10rem] align-middle">Item Description</SortableTableHeader>
                                                    <SortableTableHeader column="quantity" activeColumn={recordSort.key} direction={recordSort.direction} onSort={sortRecords} align="right" className="py-3 px-3 min-w-[6rem] align-middle">Quantity</SortableTableHeader>
                                                    <SortableTableHeader column="recipient" activeColumn={recordSort.key} direction={recordSort.direction} onSort={sortRecords} className="py-3 px-3 min-w-[9rem] align-middle">Recipient / Office</SortableTableHeader>
                                                    <SortableTableHeader column="status" activeColumn={recordSort.key} direction={recordSort.direction} onSort={sortRecords} className="py-3 px-3 min-w-[7.5rem] align-middle">Status</SortableTableHeader>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {sortRows(group.items, recordAccessors, recordSort).map((row, rIdx) => {
                                                    const hasError = row.errors && row.errors.length > 0;
                                                    return (
                                                        <tr
                                                            key={rIdx}
                                                            className={hasError ? "bg-red-50/40 dark:bg-red-950/20" : "hover:bg-slate-50/50 dark:hover:bg-slate-800/50"}
                                                        >
                                                            <td className="py-3 px-3 tabular-nums font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                                                {row.reference || '—'}
                                                            </td>
                                                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 align-middle">
                                                                {row.date || '—'}
                                                            </td>
                                                            <td className="py-3 px-3 font-medium text-slate-800 dark:text-slate-200 max-w-xs truncate align-middle">
                                                                {row.item_name || '—'}
                                                            </td>
                                                            <td className="py-3 px-3 text-right tabular-nums font-semibold text-slate-900 dark:text-slate-100 align-middle">
                                                                {row.quantity ?? row.issue_qty ?? row.receipt_qty ?? 0}
                                                            </td>
                                                            <td className="py-3 px-3 text-slate-600 dark:text-slate-400 align-middle">
                                                                {row.recipient || row.department || '—'}
                                                            </td>
                                                            <td className="py-3 px-3 whitespace-nowrap align-middle">
                                                                {hasError ? (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300">
                                                                        {row.errors![0]}
                                                                    </span>
                                                                ) : (
                                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-sm font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
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
                        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-sm text-slate-500 dark:text-slate-400">
                            Upload a legacy {formType} spreadsheet (Excel, CSV) or document (PDF, Word .docx, .doc) to extract table rows, review detected records and field mappings, and validate them before importing.
                        </div>
                    )}
                </DialogBody>

                {/* Footer */}
                <DialogFooter className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 px-4 sm:px-6 py-3 sm:py-3.5 bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-900 border-t border-slate-200/80 dark:border-slate-800 shrink-0">
                    <Button variant="secondary"
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="w-full sm:w-auto text-center"
                    >
                        Cancel
                    </Button>

                    <Button variant="primary"
                        type="button"
                        onClick={handleConfirm}
                        disabled={isSubmitting || (selectedSheetTab === 'ALL' ? validation.validCount === 0 : displayedValidCount === 0)}
                        className="inline-flex items-center justify-center gap-1.5 w-full sm:w-auto"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                                <span>{statusMessage || 'Importing Records...'}</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-3.5 h-3.5 shrink-0" />
                                <span>
                                    {selectedSheetTab === 'ALL'
                                        ? `Import All ${validation.validCount} Valid Records`
                                        : `Import ${selectedSheetTab} (${displayedValidCount} Valid Records)`}
                                </span>
                            </>
                        )}
                    </Button>
                </DialogFooter>
        </Modal>
    );
};
