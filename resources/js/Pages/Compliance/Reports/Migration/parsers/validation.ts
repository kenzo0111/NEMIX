import { MigrationFormType, MigrationGroup, MigrationValidationSummary } from '../migrationTypes';
import { mapRowToItem } from './rowMapper';

export const parseFormSpecificRows = (
    raw: string,
    formType: MigrationFormType,
): Array<{ sheetName: string; metadata: any; items: any[] }> => {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.isGroups) {
            return parsed.groups.map((group: any) => {
                const lastRefObj = { current: '', centerCode: '' };
                const items: any[] = [];
                group.items.forEach((row: any, idx: number) => {
                    const mapped = mapRowToItem(row, idx, formType, group.metadata, lastRefObj);
                    if (mapped) items.push(mapped);
                });
                return { ...group, items };
            });
        }
        if (Array.isArray(parsed)) {
            const lastRefObj = { current: '', centerCode: '' };
            const items: any[] = [];
            parsed.forEach((row: any, idx: number) => {
                const mapped = mapRowToItem(row, idx, formType, null, lastRefObj);
                if (mapped) items.push(mapped);
            });
            return [{ sheetName: 'Default', metadata: {}, items }];
        }
        if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
            const lastRefObj = { current: '', centerCode: '' };
            const items: any[] = [];
            parsed.records.forEach((row: any, idx: number) => {
                const mapped = mapRowToItem(row, idx, formType, null, lastRefObj);
                if (mapped) items.push(mapped);
            });
            return [{ sheetName: 'Default', metadata: {}, items }];
        }
    } catch {
        // Not JSON
    }

    // Fallback for raw text lines (DOCX/PDF)
    const lines = trimmed
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 5);
    if (lines.length > 0) {
        const lastRefObj = { current: '', centerCode: '' };
        const items: any[] = [];
        lines.forEach((row: any, idx: number) => {
            const mapped = mapRowToItem(row, idx, formType, null, lastRefObj);
            if (mapped) items.push(mapped);
        });
        return [{ sheetName: 'Extracted Text', metadata: {}, items }];
    }

    return [];
};

export const validateMigrationGroups = (
    parsedGroups: Array<{ sheetName: string; metadata: any; items: any[] }>,
    formType: MigrationFormType,
    migratedRecords: any[] = [],
): { groups: MigrationGroup[]; validation: MigrationValidationSummary } => {
    const existingReferences = new Set(
        (migratedRecords || [])
            .filter((record: any) => String(record.form_type) === formType)
            .map((record: any) => String(record.reference || '').trim().toLowerCase()),
    );

    const existingCombinations = new Set(
        (migratedRecords || [])
            .filter((record: any) => String(record.form_type) === formType)
            .map((record: any) => {
                const item = String(record.item_name || '').trim().toLowerCase();
                const dt = String(record.date || '').trim();
                const qty = Number(record.quantity || 0);
                return `${item}||${dt}||${qty}`;
            }),
    );

    let totalValid = 0;
    let totalInvalid = 0;
    let totalDuplicate = 0;
    let totalDetected = 0;

    const previewGroups: MigrationGroup[] = parsedGroups.map((group) => {
        const groupItems = group.items.map((row: any) => {
            totalDetected++;
            const errors: string[] = [];

            if (!row.reference && !row.item_name) errors.push('Missing reference or item name');
            if (!row.item_name) errors.push('Missing item description');
            if (row.date) {
                const parsedDate = new Date(row.date);
                if (Number.isNaN(parsedDate.getTime())) errors.push('Invalid date format');
            }

            const refLower = String(row.reference || '').trim().toLowerCase();
            const comboKey = `${String(row.item_name || '').trim().toLowerCase()}||${String(row.date || '').trim()}||${Number(row.quantity || 0)}`;

            if (formType !== 'RSMI' && refLower && existingReferences.has(refLower)) {
                errors.push(`Duplicate ${formType} record: reference number exists`);
            } else if (row.item_name && existingCombinations.has(comboKey)) {
                errors.push(`Duplicate ${formType} record: matching item, date, and qty exist`);
            }

            return { ...row, errors };
        });

        const validCount = groupItems.filter((row) => (row.errors || []).length === 0).length;
        const invalidCount = groupItems.length - validCount;
        const duplicateCount = groupItems.filter((row) =>
            (row.errors || []).some((error: string) => error.includes('Duplicate')),
        ).length;

        totalValid += validCount;
        totalInvalid += invalidCount;
        totalDuplicate += duplicateCount;

        return {
            ...group,
            items: groupItems,
            validCount,
            invalidCount,
            duplicateCount,
        };
    });

    return {
        groups: previewGroups,
        validation: {
            totalDetected,
            validCount: totalValid,
            invalidCount: totalInvalid,
            duplicateCount: totalDuplicate,
        },
    };
};
