import React, { useState, useRef } from 'react';
import Modal from '@/Components/Modal';
import { router } from '@inertiajs/react';
import {
    UploadCloud,
    FileSpreadsheet,
    FileText,
    CheckCircle2,
    AlertTriangle,
    X,
    ArrowRight,
    ArrowLeft,
    Check,
    RefreshCw,
    Layers,
    FileCheck,
    Database,
} from 'lucide-react';
import { ComplianceReportType } from './types';
import {
    loadDocumentParsers,
    parseWorkbookToGroups,
    parseFormSpecificRows,
} from './services/migrationParser';

interface DataMigrationProps {
    show: boolean;
    migratedRecords?: any[];
    onClose: () => void;
    onSuccess?: (msg: string) => void;
    onError?: (msg: string) => void;
}

type Stage = 'FORM_TYPE' | 'UPLOAD' | 'FIELD_MAPPING' | 'REVIEW' | 'CONFIRM' | 'RESULT';

export default function DataMigration({
    show,
    migratedRecords = [],
    onClose,
    onSuccess,
    onError,
}: DataMigrationProps) {
    const [currentStage, setCurrentStage] = useState<Stage>('FORM_TYPE');
    const [formType, setFormType] = useState<ComplianceReportType>('RSMI');
    const [sourceName, setSourceName] = useState('');
    const [fileName, setFileName] = useState('');
    const [ocrStatus, setOcrStatus] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [extractedRaw, setExtractedRaw] = useState('');
    const [parsedGroups, setParsedGroups] = useState<any[]>([]);
    const [validationStats, setValidationStats] = useState({ validCount: 0, invalidCount: 0, duplicateCount: 0 });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [migrationResult, setMigrationResult] = useState<{ count: number; formType: string } | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const stages: Array<{ id: Stage; label: string; step: number }> = [
        { id: 'FORM_TYPE', label: '1. Form Type', step: 1 },
        { id: 'UPLOAD', label: '2. Upload File', step: 2 },
        { id: 'FIELD_MAPPING', label: '3. Field Mapping', step: 3 },
        { id: 'REVIEW', label: '4. Review Records', step: 4 },
        { id: 'CONFIRM', label: '5. Confirm Posting', step: 5 },
        { id: 'RESULT', label: '6. Result', step: 6 },
    ];

    const currentStepNumber = stages.find((s) => s.id === currentStage)?.step || 1;

    const resetWorkflow = () => {
        setCurrentStage('FORM_TYPE');
        setFormType('RSMI');
        setSourceName('');
        setFileName('');
        setOcrStatus('');
        setIsExtracting(false);
        setExtractedRaw('');
        setParsedGroups([]);
        setValidationStats({ validCount: 0, invalidCount: 0, duplicateCount: 0 });
        setMigrationResult(null);
    };

    const handleClose = () => {
        if (isSubmitting) return;
        resetWorkflow();
        onClose();
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setSourceName(file.name.replace(/\.[^/.]+$/, ''));
        setIsExtracting(true);
        setOcrStatus('Initializing document parsers...');

        try {
            const { xlsx, mammoth, pdfjs, tesseract } = await loadDocumentParsers();
            const lowerName = file.name.toLowerCase();

            let rawResult = '';

            if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
                setOcrStatus('Parsing Excel spreadsheet sheets...');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = xlsx.read(arrayBuffer, { type: 'array', cellDates: true });
                const groups = parseWorkbookToGroups(workbook, formType, xlsx);
                rawResult = JSON.stringify({ isGroups: true, groups });
            } else if (lowerName.endsWith('.docx')) {
                setOcrStatus('Reading DOCX structure...');
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.extractRawText({ arrayBuffer });
                rawResult = result.value || '';
            } else if (lowerName.endsWith('.pdf')) {
                setOcrStatus('Extracting PDF text layers...');
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
                let text = '';
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const content = await page.getTextContent();
                    text += content.items.map((item: any) => ('str' in item ? item.str : '')).join(' ') + '\n';
                }
                rawResult = text;
            } else {
                // Raw text / fallback
                rawResult = await file.text();
            }

            setExtractedRaw(rawResult);

            // Parse rows based on form type and evaluate duplicates
            const groups = parseFormSpecificRows(rawResult, formType);
            const existingRefs = new Set(
                migratedRecords
                    .filter((r) => String(r.form_type) === formType)
                    .map((r) => String(r.reference || '').trim().toLowerCase())
            );

            let totalValid = 0;
            let totalInvalid = 0;
            let totalDuplicate = 0;

            const evaluatedGroups = groups.map((group: any) => {
                const items = group.items.map((item: any) => {
                    const errors: string[] = [];
                    if (!item.reference && !item.item_name) errors.push('Missing reference or item description');
                    if (item.reference && existingRefs.has(String(item.reference).toLowerCase())) {
                        errors.push(`Duplicate: reference ${item.reference} already exists in database`);
                    }
                    return { ...item, errors, isIncluded: true };
                });

                const valid = items.filter((i: any) => i.errors.length === 0).length;
                const dup = items.filter((i: any) => i.errors.some((e: string) => e.includes('Duplicate'))).length;
                const invalid = items.length - valid;

                totalValid += valid;
                totalDuplicate += dup;
                totalInvalid += invalid;

                return { ...group, items, valid, dup, invalid };
            });

            setParsedGroups(evaluatedGroups);
            setValidationStats({
                validCount: totalValid,
                invalidCount: totalInvalid,
                duplicateCount: totalDuplicate,
            });

            setIsExtracting(false);
            setCurrentStage('FIELD_MAPPING');
        } catch (err: any) {
            console.error('File parsing error:', err);
            setOcrStatus(`Extraction failed: ${err.message || 'Unknown error'}`);
            setIsExtracting(false);
        }
    };

    const handleConfirmPosting = () => {
        setIsSubmitting(true);

        const recordsToPost: any[] = [];
        parsedGroups.forEach((group: any) => {
            group.items.forEach((item: any) => {
                if (item.isIncluded !== false) {
                    recordsToPost.push(item);
                }
            });
        });

        if (recordsToPost.length === 0) {
            alert('No records selected for migration.');
            setIsSubmitting(false);
            return;
        }

        // Determine destination endpoint
        let endpoint = route('compliance.migrations.store');
        if (formType === 'STOCK_CARD') {
            endpoint = route('compliance.migrate.stock_card');
        } else if (formType === 'MR' || formType === 'MOR') {
            endpoint = route('compliance.migrate.memorandum_receipt');
        }

        router.post(
            endpoint,
            {
                form_type: formType,
                source: sourceName || fileName || 'historical_migration',
                records: recordsToPost,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setIsSubmitting(false);
                    setMigrationResult({ count: recordsToPost.length, formType });
                    setCurrentStage('RESULT');
                    if (onSuccess) onSuccess(`Successfully posted ${recordsToPost.length} ${formType} records.`);
                },
                onError: (err) => {
                    setIsSubmitting(false);
                    if (onError) onError('Migration posting failed. Please review error messages.');
                },
            }
        );
    };

    const toggleItemExclusion = (groupIndex: number, itemIndex: number) => {
        setParsedGroups((prev) => {
            const next = [...prev];
            const group = { ...next[groupIndex] };
            const items = [...group.items];
            items[itemIndex] = {
                ...items[itemIndex],
                isIncluded: !items[itemIndex].isIncluded,
            };
            group.items = items;
            next[groupIndex] = group;
            return next;
        });
    };

    return (
        <Modal show={show} onClose={handleClose} maxWidth="5xl" closeable={!isSubmitting}>
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-2xl">
                {/* Institutional header accent */}
                <div className="h-2 w-full bg-red-950" />

                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-50 text-red-900 rounded border border-red-100">
                            <UploadCloud className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900 font-serif tracking-tight">
                                Historical Data Migration Workflow
                            </h3>
                            <p className="text-xs text-gray-500 font-medium">
                                Step-by-step import pipeline for legacy government inventory records
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={isSubmitting}
                        className="text-gray-400 hover:text-red-700 p-1.5 rounded-full hover:bg-red-50 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Stepper Bar */}
                <div className="bg-gray-100/70 border-b border-gray-200 px-6 py-2.5 overflow-x-auto">
                    <div className="flex items-center gap-2 text-xs font-mono min-w-max">
                        {stages.map((stage, idx) => {
                            const isCurrent = stage.id === currentStage;
                            const isPassed = stage.step < currentStepNumber;

                            return (
                                <React.Fragment key={stage.id}>
                                    <div
                                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-bold uppercase tracking-wider ${
                                            isCurrent
                                                ? 'bg-red-900 text-amber-300'
                                                : isPassed
                                                ? 'bg-emerald-100 text-emerald-800'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {isPassed && <Check className="w-3.5 h-3.5" />}
                                        <span>{stage.label}</span>
                                    </div>
                                    {idx < stages.length - 1 && (
                                        <span className="text-gray-300">/</span>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </div>

                {/* Stage Content */}
                <div className="p-6">
                    {/* STAGE 1: FORM TYPE */}
                    {currentStage === 'FORM_TYPE' && (
                        <div className="space-y-4 max-w-xl mx-auto py-4">
                            <div className="text-center mb-6">
                                <h4 className="text-base font-bold text-gray-900 font-serif">
                                    Select Target Government Form
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    Choose the official COA document standard matching the legacy data format
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    {
                                        type: 'RSMI',
                                        title: 'RSMI (Appendix 64)',
                                        desc: 'Report of Supplies and Materials Issued',
                                    },
                                    {
                                        type: 'RPCI',
                                        title: 'RPCI (Appendix 66)',
                                        desc: 'Physical Count of Inventories & Shortages',
                                    },
                                    {
                                        type: 'STOCK_CARD',
                                        title: 'Stock Card (Appendix 58)',
                                        desc: 'Receipts, issuances, and balance ledger',
                                    },
                                    {
                                        type: 'MR',
                                        title: 'MR (Appendix 63)',
                                        desc: 'Memorandum Receipt for Consumables & PPE',
                                    },
                                ].map((opt) => (
                                    <button
                                        key={opt.type}
                                        type="button"
                                        onClick={() => setFormType(opt.type as ComplianceReportType)}
                                        className={`p-4 rounded-lg border text-left transition-all cursor-pointer ${
                                            formType === opt.type
                                                ? 'border-red-900 bg-red-50/50 ring-1 ring-red-900'
                                                : 'border-gray-200 bg-white hover:border-gray-300'
                                        }`}
                                    >
                                        <div className="font-bold text-xs font-mono uppercase text-gray-900">
                                            {opt.title}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                            {opt.desc}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStage('UPLOAD')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 cursor-pointer"
                                >
                                    <span>Proceed to Upload</span>
                                    <ArrowRight className="w-4 h-4 text-amber-300" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 2: UPLOAD FILE */}
                    {currentStage === 'UPLOAD' && (
                        <div className="space-y-4 max-w-xl mx-auto py-4">
                            <div className="text-center mb-6">
                                <h4 className="text-base font-bold text-gray-900 font-serif">
                                    Upload Legacy File ({formType})
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    Supports Microsoft Excel (.xlsx, .xls), CSV, Word (.docx), PDF, or image OCR
                                </p>
                            </div>

                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-gray-300 hover:border-red-800 rounded-xl p-8 text-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-red-50/20"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls,.csv,.docx,.pdf,image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />

                                <div className="flex justify-center mb-3">
                                    <div className="p-3 bg-red-50 text-red-900 rounded-full border border-red-100">
                                        <FileSpreadsheet className="w-8 h-8" />
                                    </div>
                                </div>

                                <p className="text-sm font-bold text-gray-800">
                                    Click or drag file to start parsing
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    XLSX, XLS, CSV, DOCX, PDF, PNG, JPG
                                </p>
                            </div>

                            {isExtracting && (
                                <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 text-center space-y-2">
                                    <div className="flex items-center justify-center gap-2 text-xs font-mono font-bold text-amber-800">
                                        <RefreshCw className="w-4 h-4 animate-spin text-amber-700" />
                                        <span>{ocrStatus || 'Parsing document structure...'}</span>
                                    </div>
                                    <p className="text-[11px] text-amber-700 font-medium">
                                        Browser OCR engine is reading table columns and normalizing headers.
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStage('FORM_TYPE')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 3: FIELD MAPPING */}
                    {currentStage === 'FIELD_MAPPING' && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 font-serif">
                                        Field Mapping & Column Extraction
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium">
                                        File: <span className="font-mono text-gray-800 font-bold">{fileName}</span> • Form: <span className="font-mono text-red-900 font-bold">{formType}</span>
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded font-mono text-xs font-bold">
                                        {parsedGroups.reduce((acc, g) => acc + g.items.length, 0)} Rows Extracted
                                    </span>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                                <h5 className="text-xs font-bold text-gray-700 uppercase tracking-wider font-mono mb-2">
                                    Mapped Attributes Schema
                                </h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                    <div className="p-3 bg-white rounded border border-gray-200">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase block">Reference Code</span>
                                        <span className="font-bold text-gray-800 font-mono">RIS / Serial / Stock No.</span>
                                    </div>
                                    <div className="p-3 bg-white rounded border border-gray-200">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase block">Item Description</span>
                                        <span className="font-bold text-gray-800">Item Name / Article</span>
                                    </div>
                                    <div className="p-3 bg-white rounded border border-gray-200">
                                        <span className="text-[10px] font-mono text-gray-500 uppercase block">Quantity & Movement</span>
                                        <span className="font-bold text-gray-800 font-mono">Qty Issued / Receipts / Bal</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStage('UPLOAD')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Re-upload</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentStage('REVIEW')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 cursor-pointer"
                                >
                                    <span>Review Parsed Records</span>
                                    <ArrowRight className="w-4 h-4 text-amber-300" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 4: REVIEW RECORDS */}
                    {currentStage === 'REVIEW' && (
                        <div className="space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200">
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 font-serif">
                                        Review Extracted Records
                                    </h4>
                                    <p className="text-xs text-gray-500 font-medium">
                                        Inspect rows, view validation warnings, or exclude specific items before database posting
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 font-mono text-xs">
                                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                                        {validationStats.validCount} Valid
                                    </span>
                                    {validationStats.duplicateCount > 0 && (
                                        <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                                            {validationStats.duplicateCount} Duplicates
                                        </span>
                                    )}
                                    {validationStats.invalidCount > 0 && (
                                        <span className="px-2 py-0.5 rounded bg-red-50 text-red-800 border border-red-200 font-bold">
                                            {validationStats.invalidCount} Errors
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Multi-sheet preview container */}
                            <div className="max-h-80 overflow-y-auto border border-gray-200 rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200 text-left text-xs">
                                    <thead className="bg-gray-50 font-mono text-[11px] text-gray-700 uppercase">
                                        <tr>
                                            <th className="px-4 py-2.5">Include</th>
                                            <th className="px-4 py-2.5">Ref No.</th>
                                            <th className="px-4 py-2.5">Item Description</th>
                                            <th className="px-4 py-2.5">Quantity</th>
                                            <th className="px-4 py-2.5">Recipient / Dept</th>
                                            <th className="px-4 py-2.5">Status / Errors</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {parsedGroups.flatMap((group, gIdx) =>
                                            group.items.map((row: any, rIdx: number) => {
                                                const hasErrors = row.errors && row.errors.length > 0;
                                                return (
                                                    <tr
                                                        key={`${gIdx}-${rIdx}`}
                                                        className={!row.isIncluded ? 'opacity-40 bg-gray-50' : 'hover:bg-gray-50'}
                                                    >
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            <input
                                                                type="checkbox"
                                                                checked={row.isIncluded !== false}
                                                                onChange={() => toggleItemExclusion(gIdx, rIdx)}
                                                                className="rounded border-gray-300 text-red-900 focus:ring-red-900"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-2 font-mono font-bold text-gray-800 whitespace-nowrap">
                                                            {row.reference || '—'}
                                                        </td>
                                                        <td className="px-4 py-2 font-medium text-gray-900 max-w-xs truncate">
                                                            {row.item_name || '—'}
                                                        </td>
                                                        <td className="px-4 py-2 font-mono text-gray-700 whitespace-nowrap">
                                                            {row.quantity ?? 1} {row.unit || ''}
                                                        </td>
                                                        <td className="px-4 py-2 text-gray-600 max-w-xs truncate">
                                                            {row.recipient || row.department || '—'}
                                                        </td>
                                                        <td className="px-4 py-2 whitespace-nowrap">
                                                            {hasErrors ? (
                                                                <span
                                                                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-red-50 text-red-800 border border-red-200"
                                                                    title={row.errors.join(', ')}
                                                                >
                                                                    {row.errors[0]}
                                                                </span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                                                                    Valid
                                                                </span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pt-4 flex justify-between border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStage('FIELD_MAPPING')}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setCurrentStage('CONFIRM')}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-900 hover:bg-red-950 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 cursor-pointer"
                                >
                                    <span>Proceed to Confirmation</span>
                                    <ArrowRight className="w-4 h-4 text-amber-300" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 5: CONFIRMATION */}
                    {currentStage === 'CONFIRM' && (
                        <div className="space-y-4 max-w-xl mx-auto py-4">
                            <div className="text-center mb-6">
                                <h4 className="text-base font-bold text-gray-900 font-serif">
                                    Confirm Migration to Database
                                </h4>
                                <p className="text-xs text-gray-500 mt-1">
                                    You are about to post these historical records to the official database ledger
                                </p>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-3">
                                <div className="flex justify-between text-xs py-1 border-b border-gray-200">
                                    <span className="text-gray-500 font-mono uppercase">Target Document Standard:</span>
                                    <span className="font-bold text-gray-900 font-mono">{formType}</span>
                                </div>
                                <div className="flex justify-between text-xs py-1 border-b border-gray-200">
                                    <span className="text-gray-500 font-mono uppercase">Source File:</span>
                                    <span className="font-bold text-gray-900 font-mono truncate max-w-xs">{fileName}</span>
                                </div>
                                <div className="flex justify-between text-xs py-1 border-b border-gray-200">
                                    <span className="text-gray-500 font-mono uppercase">Records to Commit:</span>
                                    <span className="font-bold text-emerald-800 font-mono">
                                        {parsedGroups.reduce((acc, g) => acc + g.items.filter((i: any) => i.isIncluded !== false).length, 0)} records
                                    </span>
                                </div>
                                <div className="flex justify-between text-xs py-1">
                                    <span className="text-gray-500 font-mono uppercase">Posting Authority:</span>
                                    <span className="font-bold text-gray-800">Authenticated Supply Officer</span>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-between">
                                <button
                                    type="button"
                                    onClick={() => setCurrentStage('REVIEW')}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold text-gray-700 hover:bg-gray-50"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    <span>Back</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={handleConfirmPosting}
                                    disabled={isSubmitting}
                                    className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-red-900 hover:bg-red-950 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-colors shadow-xs border border-red-900 disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
                                            <span>Posting to Ledger...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Database className="w-4 h-4 text-amber-300" />
                                            <span>Confirm & Post to Database</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* STAGE 6: RESULT */}
                    {currentStage === 'RESULT' && migrationResult && (
                        <div className="space-y-4 max-w-md mx-auto py-8 text-center">
                            <div className="flex justify-center mb-3">
                                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                            </div>

                            <h4 className="text-base font-bold text-gray-900 font-serif">
                                Historical Migration Completed
                            </h4>
                            <p className="text-xs text-gray-600 leading-relaxed font-medium">
                                Successfully posted{' '}
                                <strong className="text-gray-900 font-bold">{migrationResult.count} records</strong> into the{' '}
                                <span className="font-mono font-bold text-red-900">{migrationResult.formType}</span> historical registry.
                            </p>

                            <div className="pt-6">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-6 py-2 bg-red-900 hover:bg-red-950 text-white text-xs font-bold uppercase tracking-wider rounded shadow-xs cursor-pointer"
                                >
                                    Return to Reports Archive
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}
