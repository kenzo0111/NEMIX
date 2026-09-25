import { useState } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import { MigrationFormType, MigrationGroup, MigrationValidationSummary } from '../Migration/migrationTypes';
import { loadDocumentParsers } from '../Migration/parsers/documentLoader';
import { parseWorkbookToGroups } from '../Migration/parsers/workbookParser';
import { extractGroupsFromPdf } from '../Migration/parsers/pdfParser';
import { extractGroupsFromDocx } from '../Migration/parsers/docxParser';
import { extractGroupsFromDoc } from '../Migration/parsers/docParser';
import { parseFormSpecificRows, validateMigrationGroups } from '../Migration/parsers/validation';

export function useHistoricalMigration(migratedRecords: any[] = [], onSuccess?: () => void) {
    const [formType, setFormType] = useState<MigrationFormType>('RSMI');
    const [source, setSource] = useState('');
    const [fileName, setFileName] = useState('');
    const [rawText, setRawText] = useState('');
    const [statusMessage, setStatusMessage] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [groups, setGroups] = useState<MigrationGroup[]>([]);
    const [validation, setValidation] = useState<MigrationValidationSummary>({
        totalDetected: 0,
        validCount: 0,
        invalidCount: 0,
        duplicateCount: 0,
    });

    const reset = () => {
        setFormType('RSMI');
        setSource('');
        setFileName('');
        setRawText('');
        setStatusMessage('');
        setIsExtracting(false);
        setIsSubmitting(false);
        setGroups([]);
        setValidation({
            totalDetected: 0,
            validCount: 0,
            invalidCount: 0,
            duplicateCount: 0,
        });
    };

    const processFile = async (file: File) => {
        const lowerName = file.name.toLowerCase();
        const extension = lowerName.split('.').pop();
        if (!extension || !['xlsx', 'xls', 'csv', 'pdf', 'docx', 'doc'].includes(extension) || file.size > 10 * 1024 * 1024) {
            setStatusMessage('Choose an XLSX, XLS, CSV, PDF, DOCX, or DOC file no larger than 10 MB.');
            return;
        }
        setFileName(file.name);
        setIsExtracting(true);
        setStatusMessage('Initializing document parsers...');

        try {
            const { exceljs, mammoth, pdfjs, tesseract, cfb } = await loadDocumentParsers();

            let extractedRaw = '';

            if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
                setStatusMessage('Extracting tabular spreadsheet data...');
                const arrayBuffer = await file.arrayBuffer();
                const ExcelJSClass = exceljs.default || exceljs;
                const workbook = new ExcelJSClass.Workbook();

                if (lowerName.endsWith('.csv')) {
                    const text = await file.text();
                    const worksheet = workbook.addWorksheet('CSV');
                    const lines = text.split(/\r?\n/);
                    for (const line of lines) {
                        if (!line.trim()) continue;
                        const cells: string[] = [];
                        let inQuotes = false;
                        let token = '';
                        for (let i = 0; i < line.length; i++) {
                            const char = line[i];
                            if (char === '"') {
                                if (inQuotes && line[i + 1] === '"') {
                                    token += '"';
                                    i++;
                                } else {
                                    inQuotes = !inQuotes;
                                }
                            } else if (char === ',' && !inQuotes) {
                                cells.push(token.trim());
                                token = '';
                            } else {
                                token += char;
                            }
                        }
                        cells.push(token.trim());
                        worksheet.addRow(cells);
                    }
                } else {
                    await workbook.xlsx.load(arrayBuffer);
                }

                const parsedWorkbookGroups = parseWorkbookToGroups(workbook, formType);
                extractedRaw = JSON.stringify({ isGroups: true, groups: parsedWorkbookGroups });
            } else if (lowerName.endsWith('.docx')) {
                setStatusMessage('Extracting table rows from Word document (.docx)...');
                const docxGroups = await extractGroupsFromDocx(file, mammoth, tesseract, formType, setStatusMessage);
                extractedRaw = JSON.stringify({ isGroups: true, groups: docxGroups });
            } else if (lowerName.endsWith('.doc')) {
                setStatusMessage('Extracting table rows from Word document (.doc)...');
                const docGroups = await extractGroupsFromDoc(file, cfb, formType, setStatusMessage);
                extractedRaw = JSON.stringify({ isGroups: true, groups: docGroups });
            } else if (lowerName.endsWith('.pdf')) {
                setStatusMessage('Extracting table rows and layout from PDF document (.pdf)...');
                const pdfGroups = await extractGroupsFromPdf(file, pdfjs, tesseract, formType, setStatusMessage);
                extractedRaw = JSON.stringify({ isGroups: true, groups: pdfGroups });
            } else {
                extractedRaw = await file.text();
            }

            setRawText(extractedRaw);

            const parsed = parseFormSpecificRows(extractedRaw, formType);
            const { groups: validatedGroups, validation: validationSummary } = validateMigrationGroups(
                parsed,
                formType,
                migratedRecords,
            );

            setGroups(validatedGroups);
            setValidation(validationSummary);

            if (validationSummary.totalDetected === 0) {
                setStatusMessage('No records detected. Please check file format, headers, and selected form type.');
            }
        } catch (err: any) {
            console.error('File extraction error:', err);
            setStatusMessage('Error parsing file: ' + (err?.message || 'unknown error'));
        } finally {
            setIsExtracting(false);
        }
    };

    const revalidateForFormType = (newFormType: MigrationFormType) => {
        setFormType(newFormType);
        if (rawText) {
            const parsed = parseFormSpecificRows(rawText, newFormType);
            const { groups: validatedGroups, validation: validationSummary } = validateMigrationGroups(
                parsed,
                newFormType,
                migratedRecords,
            );
            setGroups(validatedGroups);
            setValidation(validationSummary);
        }
    };

    const submitMigration = async (
        onComplete?: (result: { success: boolean; message: string }) => void,
        targetGroups?: MigrationGroup[],
    ) => {
        const groupsToProcess = targetGroups || groups;
        const payloadRecords: any[] = [];
        groupsToProcess.forEach((group) => {
            group.items.forEach((row) => {
                if (!row.errors || row.errors.length === 0) {
                    payloadRecords.push({
                        reference: row.reference,
                        date: row.date,
                        item_name: row.item_name,
                        quantity: row.quantity,
                        quantity_issued: row.quantity,
                        recipient: row.recipient,
                        department: row.department,
                        designation: row.designation,
                        remarks: row.remarks,
                        unit_cost: row.unit_cost,
                        amount: row.amount,
                        unit: row.unit,
                        stock_no: row.stock_no,
                        receipt_qty: row.receipt_qty,
                        balance_qty: row.balance_qty,
                        re_order_point: row.re_order_point,
                        on_hand_count: row.on_hand_count,
                        shortage_qty: row.shortage_qty,
                        shortage_value: row.shortage_value,
                        fund_cluster: row.fund_cluster,
                        responsibility_center_code: row.responsibility_center_code || row.center_code || row.department,
                        center_code: row.center_code || row.responsibility_center_code || row.department,
                        entity_name: row.entity_name || group.metadata?.entityName || 'University of Camarines Norte',
                        source_sheet: group.sheetName,
                    });
                }
            });
        });

        if (payloadRecords.length === 0) {
            onComplete?.({
                success: false,
                message: 'No valid records to migrate. Please fix errors before confirming.',
            });
            return;
        }

        const endpoint =
            formType === 'RSMI' || formType === 'RPCI'
                ? route('compliance.migrations.store')
                : formType === 'STOCK_CARD'
                ? route('compliance.migrate.stock_card')
                : route('compliance.migrate.memorandum_receipt');

        setIsSubmitting(true);

        const CHUNK_SIZE = 500;
        if (payloadRecords.length <= CHUNK_SIZE) {
            router.post(
                endpoint,
                {
                    form_type: formType,
                    source: source || fileName || 'historical_migration',
                    records: payloadRecords,
                },
                {
                    preserveScroll: true,
                    onStart: () => setIsSubmitting(true),
                    onFinish: () => setIsSubmitting(false),
                    onSuccess: () => {
                        reset();
                        onSuccess?.();
                        onComplete?.({
                            success: true,
                            message: `Successfully migrated ${payloadRecords.length} historical ${formType} records.`,
                        });
                    },
                    onError: () => {
                        setIsSubmitting(false);
                        onComplete?.({
                            success: false,
                            message: 'Failed to complete migration batch. Please verify input data and try again.',
                        });
                    },
                },
            );
            return;
        }

        // Multi-batch chunked import for spreadsheets with > 500 records
        try {
            const totalBatches = Math.ceil(payloadRecords.length / CHUNK_SIZE);
            let totalSaved = 0;

            for (let i = 0; i < totalBatches; i++) {
                const chunk = payloadRecords.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
                setStatusMessage(`Importing batch ${i + 1} of ${totalBatches} (${chunk.length} records)...`);

                const response = await axios.post(
                    endpoint,
                    {
                        form_type: formType,
                        source: source || fileName || 'historical_migration',
                        records: chunk,
                    },
                    {
                        headers: {
                            Accept: 'application/json',
                        },
                    },
                );

                if (response.data && response.data.saved !== undefined) {
                    totalSaved += response.data.saved;
                } else {
                    totalSaved += chunk.length;
                }
            }

            reset();
            router.reload({
                only: ['migratedRecords'],
                onSuccess: () => {
                    onSuccess?.();
                    onComplete?.({
                        success: true,
                        message: `Successfully migrated ${totalSaved} historical ${formType} records in ${totalBatches} batches.`,
                    });
                },
            });
        } catch (err: any) {
            console.error('Batch migration error:', err);
            onComplete?.({
                success: false,
                message: err?.response?.data?.message || 'Failed to complete batch migration. Please verify input data.',
            });
        } finally {
            setIsSubmitting(false);
            setStatusMessage('');
        }
    };

    return {
        formType,
        setFormType: revalidateForFormType,
        source,
        setSource,
        fileName,
        rawText,
        isExtracting,
        isSubmitting,
        statusMessage,
        groups,
        validation,
        processFile,
        submitMigration,
        reset,
    };
}
