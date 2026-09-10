import { MigrationFormType } from '../migrationTypes';

export const parseWorkbookToGroups = (
    workbook: any,
    formType: MigrationFormType,
    xlsx: any,
): Array<{ sheetName: string; metadata: Record<string, string>; items: any[] }> => {
    const groups: any[] = [];
    const isMatchKeyword = (cellVal: any, keywords: string[]) => {
        const str = String(cellVal || '').toLowerCase().trim();
        return keywords.some((kw) => str.includes(kw));
    };

    let targetKeywords: string[] = [];
    if (formType === 'RSMI') {
        targetKeywords = ['ris', 'item', 'stock', 'quantity', 'qty', 'issued', 'unit cost', 'amount', 'responsibility', 'center code'];
    } else if (formType === 'RPCI') {
        targetKeywords = ['article', 'description', 'stock', 'property', 'unit', 'unit value', 'balance', 'hand', 'shortage', 'remarks'];
    } else if (formType === 'MR' || formType === 'MOR') {
        targetKeywords = ['qty', 'quantity', 'unit', 'description', 'item', 'property', 'serial', 'mr no', 'acquired', 'value', 'cost'];
    } else {
        targetKeywords = ['date', 'reference', 'receipt', 'issue', 'balance', 'consume', 'office'];
    }

    workbook.SheetNames.forEach((sheetName: string) => {
        const worksheet = workbook.Sheets[sheetName];
        const matrix: any[][] = xlsx.utils.sheet_to_json(worksheet, { header: 1, raw: false, defval: '' });
        if (!matrix || matrix.length === 0) return;

        let r = 0;
        while (r < matrix.length) {
            let headerRowIdx = -1;
            let maxMatches = 0;
            const currentMetadata: Record<string, string> = {};

            const scanLimit = Math.min(r + 50, matrix.length);
            let foundHeader = false;
            for (let sr = r; sr < scanLimit; sr++) {
                const row = matrix[sr];
                if (!Array.isArray(row)) continue;

                const rowStr = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');
                if (rowStr.includes('to be filled up by') || rowStr.includes('recapitulation')) {
                    continue;
                }

                for (let c = 0; c < row.length; c++) {
                    const cellStr = String(row[c] || '').trim();
                    if (!cellStr) continue;

                    const extractLabelVal = (pattern: RegExp) => {
                        if (pattern.test(cellStr)) {
                            const clean = cellStr.replace(pattern, '').replace(/^[:\-\s]+/, '').trim();
                            if (clean) return clean;
                            for (let nc = c + 1; nc < Math.min(c + 5, row.length); nc++) {
                                const nextCell = String(row[nc] || '').trim();
                                if (nextCell && !/entity|fund|serial|date|officer|custodian|division/i.test(nextCell)) {
                                    return nextCell;
                                }
                            }
                        }
                        return '';
                    };

                    const entityVal = extractLabelVal(/entity\s*name/i);
                    if (entityVal) currentMetadata['entityName'] = entityVal;

                    const fundVal = extractLabelVal(/fund\s*cluster/i);
                    if (fundVal) currentMetadata['fundCluster'] = fundVal;

                    const serialVal = extractLabelVal(/(?:serial|mr|ris|doc|property)\s*no\.?/i);
                    if (serialVal && !/^(center\s*code|resp|responsibility|entity|fund|date|page|sheet|division)/i.test(serialVal)) {
                        currentMetadata['topSerialNo'] = serialVal;
                    }

                    const dateVal = extractLabelVal(/(?:as\s*at\s*date|date\s*issued|date\s*:)/i);
                    if (dateVal) currentMetadata['topDate'] = dateVal;

                    const recipVal = extractLabelVal(/(?:accountable\s*officer|property\s*custodian|received\s*by)/i);
                    if (recipVal) currentMetadata['topRecipient'] = recipVal;

                    const officeVal = extractLabelVal(/(?:office|department)\s*[:\-]/i);
                    if (officeVal) currentMetadata['topOffice'] = officeVal;
                }

                let matches = 0;
                row.forEach((cell) => {
                    if (isMatchKeyword(cell, targetKeywords)) matches++;
                });

                if (matches >= 2 && matches > maxMatches) {
                    maxMatches = matches;
                    headerRowIdx = sr;
                    if (matches >= 4) foundHeader = true;
                }
                if (foundHeader && headerRowIdx !== -1) break;
            }

            if (headerRowIdx === -1) break;

            r = headerRowIdx;
            const rawHeaders = matrix[headerRowIdx] || [];
            const nextRow = matrix[headerRowIdx + 1] || [];
            let actualDataStart = headerRowIdx + 1;

            const headers: string[] = [];
            rawHeaders.forEach((hCell, cIdx) => {
                let hName = String(hCell || '').replace(/\r?\n/g, ' ').trim();
                const subName = String(nextRow[cIdx] || '').replace(/\r?\n/g, ' ').trim();
                if (subName && !/^\s*\(\s*\d+\s*\)\s*$/.test(subName)) {
                    if (/quantity|value|cost|office|amount|desc|article|unit/i.test(subName)) {
                        hName = hName ? `${hName} ${subName}` : subName;
                    }
                }
                headers[cIdx] = hName;
            });

            if (nextRow.some((cell) => /^\s*\(\s*\d+\s*\)\s*$/.test(String(cell || '').trim()))) {
                actualDataStart = headerRowIdx + 2;
            }

            r = actualDataStart;
            const resultRows: any[] = [];
            let hitRecapOrFooter = false;

            while (r < matrix.length) {
                const row = matrix[r];
                if (!Array.isArray(row)) {
                    r++;
                    continue;
                }

                const fullRowStr = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');

                if (
                    fullRowStr.includes('recapitulation') ||
                    fullRowStr.includes('recap') ||
                    fullRowStr.includes('to be filled up by the accounting') ||
                    fullRowStr.includes('certified correct') ||
                    fullRowStr.includes('posted by') ||
                    fullRowStr.includes('approved by') ||
                    fullRowStr.includes('i hereby certify')
                ) {
                    hitRecapOrFooter = true;
                    r++;
                    break;
                }

                if (
                    fullRowStr.includes('report of supplies') ||
                    fullRowStr.includes('report of physical count') ||
                    fullRowStr.includes('stock card') ||
                    fullRowStr.includes('appendix 64') ||
                    fullRowStr.includes('appendix 66')
                ) {
                    break;
                }

                if (row.every((cell) => String(cell || '').trim() === '')) {
                    r++;
                    continue;
                }

                const firstCellStr = String(row[0] || '').toLowerCase().trim();
                if (firstCellStr.includes('total') || firstCellStr === 'grand total') {
                    r++;
                    continue;
                }

                const rowObj: Record<string, any> = {};
                let hasContent = false;

                headers.forEach((hName, cIdx) => {
                    const cellVal = row[cIdx] !== undefined ? row[cIdx] : '';
                    if (hName) rowObj[hName] = cellVal;
                    else rowObj[`__col_${cIdx}`] = cellVal;
                    if (String(cellVal).trim()) hasContent = true;
                });

                if (hasContent) resultRows.push(rowObj);
                r++;
            }

            if (resultRows.length > 0) {
                groups.push({
                    sheetName,
                    metadata: { ...currentMetadata },
                    items: resultRows,
                });
            }

            if (hitRecapOrFooter) {
                let foundNewForm = false;
                while (r < matrix.length) {
                    const nextRow = matrix[r];
                    if (Array.isArray(nextRow)) {
                        const str = nextRow.map((c) => String(c || '').toLowerCase().trim()).join(' ');
                        if (
                            str.includes('report of supplies and materials issued') ||
                            str.includes('report on the physical count') ||
                            str.includes('stock card') ||
                            str.includes('memorandum receipt') ||
                            str.includes('appendix 64') ||
                            str.includes('appendix 66') ||
                            str.includes('appendix 63')
                        ) {
                            foundNewForm = true;
                            break;
                        }
                    }
                    r++;
                }
                if (!foundNewForm) {
                    break;
                }
            }
        }
    });

    return groups;
};
