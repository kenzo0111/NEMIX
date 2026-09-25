import { MigrationFormType } from '../migrationTypes';
import { parseTableMatrixToGroups } from './tableMatrixParser';

export const parseWorkbookToGroups = (
    workbook: any,
    formType: MigrationFormType,
): Array<{ sheetName: string; metadata: Record<string, string>; items: any[] }> => {
    const groups: any[] = [];
    const MAX_ROWS = 5000;
    const MAX_COLS = 100;

    const worksheets: any[] = workbook.worksheets || [];

    worksheets.forEach((worksheet: any) => {
        const sheetName = worksheet.name || 'Sheet';
        const matrix: string[][] = [];

        worksheet.eachRow({ includeEmpty: true }, (row: any, rowNumber: number) => {
            if (rowNumber > MAX_ROWS) return;
            const rowValues: string[] = [];

            row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
                if (colNumber > MAX_COLS) return;
                let val = cell.value;
                if (val !== null && typeof val === 'object') {
                    if ('result' in val) {
                        val = val.result ?? '';
                    } else if ('richText' in val && Array.isArray(val.richText)) {
                        val = val.richText.map((rt: any) => rt.text || '').join('');
                    } else if ('text' in val) {
                        val = val.text;
                    } else if (val instanceof Date) {
                        val = val.toISOString().split('T')[0];
                    } else {
                        val = String(val);
                    }
                }
                rowValues[colNumber - 1] = val !== null && val !== undefined ? String(val).trim() : '';
            });

            // Fill empty leading columns
            for (let c = 0; c < rowValues.length; c++) {
                if (rowValues[c] === undefined) {
                    rowValues[c] = '';
                }
            }

            matrix[rowNumber - 1] = rowValues;
        });

        // Fill empty rows before data
        for (let r = 0; r < matrix.length; r++) {
            if (!matrix[r]) {
                matrix[r] = [];
            }
        }

        if (!matrix || matrix.length === 0) return;

        const sheetGroups = parseTableMatrixToGroups(matrix, sheetName, formType);
        groups.push(...sheetGroups);
    });

    return groups;
};

