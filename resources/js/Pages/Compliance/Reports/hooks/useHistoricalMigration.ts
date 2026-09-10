import { useState } from 'react';
import { router } from '@inertiajs/react';
import { MigrationFormType, MigrationGroup, MigrationValidationSummary } from '../Migration/migrationTypes';
import { loadDocumentParsers } from '../Migration/parsers/documentLoader';
import { parseWorkbookToGroups } from '../Migration/parsers/workbookParser';
import { extractTextFromPdf } from '../Migration/parsers/pdfParser';
import { extractTextFromDocx } from '../Migration/parsers/docxParser';
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
        setFileName(file.name);
        setIsExtracting(true);
        setStatusMessage('Initializing document parsers...');

        try {
            const { xlsx, mammoth, pdfjs, tesseract } = await loadDocumentParsers();

            let extractedRaw = '';

            if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || lowerName.endsWith('.csv')) {
                setStatusMessage('Extracting tabular spreadsheet data...');
                const arrayBuffer = await file.arrayBuffer();
                const workbook = xlsx.read(arrayBuffer, { type: 'array', cellDates: true });
                const parsedWorkbookGroups = parseWorkbookToGroups(workbook, formType, xlsx);
                extractedRaw = JSON.stringify({ isGroups: true, groups: parsedWorkbookGroups });
            } else if (lowerName.endsWith('.docx')) {
                extractedRaw = await extractTextFromDocx(file, mammoth, tesseract, setStatusMessage);
            } else if (lowerName.endsWith('.pdf')) {
                extractedRaw = await extractTextFromPdf(file, pdfjs, tesseract, setStatusMessage);
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
        } catch (err: any) {
            console.error('File extraction error:', err);
            setStatusMessage('Error parsing file.');
        } finally {
            setIsExtracting(false);
            setStatusMessage('');
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

    const submitMigration = (onComplete?: (result: { success: boolean; message: string }) => void) => {
        const payloadRecords: any[] = [];
        groups.forEach((group) => {
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
                    onComplete?.({
                        success: false,
                        message: 'Failed to complete migration batch. Please verify input data and try again.',
                    });
                },
            },
        );
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
