import { MigrationFormType } from '../migrationTypes';

export interface ExtractedGroup {
    sheetName: string;
    metadata: Record<string, string>;
    items: Record<string, any>[];
}

export const getTargetKeywordsForForm = (formType: MigrationFormType): string[] => {
    if (formType === 'RSMI') {
        return [
            'ris', 'item', 'stock', 'quantity', 'qty', 'issued',
            'unit cost', 'amount', 'responsibility', 'center code',
            'unit', 'description', 'article',
        ];
    }
    if (formType === 'RPCI') {
        return [
            'article', 'description', 'stock', 'property', 'unit',
            'unit value', 'balance', 'hand', 'shortage', 'remarks',
            'card', 'count', 'on hand',
        ];
    }
    if (formType === 'MR' || formType === 'MOR') {
        return [
            'qty', 'quantity', 'unit', 'description', 'item',
            'property', 'serial', 'mr no', 'acquired', 'value',
            'cost', 'office', 'recipient', 'remarks', 'designation',
        ];
    }
    return [
        'date', 'reference', 'receipt', 'issue', 'balance',
        'consume', 'office', 'stock', 'item', 'description',
        'quantity', 'qty',
    ];
};

export const extractMetadataFromMatrixOrLines = (
    rows: Array<string[] | string>,
    scanLimit: number = 60,
): Record<string, string> => {
    const meta: Record<string, string> = {};

    const checkText = (text: string) => {
        if (!text) return;

        const extract = (pattern: RegExp) => {
            const m = text.match(pattern);
            if (m && m[1]) {
                const val = m[1].replace(/^[:\-\s]+/, '').trim();
                if (val && !/^(page|sheet|division|code|date|entity|fund)/i.test(val)) {
                    return val;
                }
            }
            return '';
        };

        if (!meta['entityName']) {
            const ent = extract(/entity\s*name\s*[:\-]?\s*(.*?)(?=\s+(?:serial|fund|date|sheet|appendix)\b|$)/i);
            if (ent) meta['entityName'] = ent;
        }

        if (!meta['fundCluster']) {
            const fund = extract(/fund\s*cluster\s*[:\-]?\s*(.*?)(?=\s+(?:serial|entity|date|sheet|appendix)\b|$)/i);
            if (fund) meta['fundCluster'] = fund;
        }

        if (!meta['topSerialNo']) {
            const serial = extract(/(?:serial|mr|doc|property)\s*no\.?\s*[:\-]?\s*([A-Za-z0-9\-_/]+)/i);
            if (serial && !/^(center|code|resp|date|page|sheet|division|stock|ris|item|unit|quantity)/i.test(serial)) {
                meta['topSerialNo'] = serial;
            }
        }

        if (!meta['topDate']) {
            const dt = extract(/(?:as\s*at\s*date|date\s*issued|date\s*:)\s*([A-Za-z0-9\s,\-_/–—]+)/i);
            if (dt && !/^(entity|fund|serial|center|code)/i.test(dt)) {
                meta['topDate'] = dt;
            }
        }

        if (!meta['topRecipient']) {
            const recip = extract(/(?:accountable\s*officer|property\s*custodian|received\s*by)\s*[:\-]?\s*([^\n\r;|]+)/i);
            if (recip) meta['topRecipient'] = recip;
        }

        if (!meta['topOffice']) {
            const off = extract(/(?:office|department)\s*[:\-]?\s*([^\n\r;|]+)/i);
            if (off) meta['topOffice'] = off;
        }
    };

    const limit = Math.min(rows.length, scanLimit);
    for (let i = 0; i < limit; i++) {
        const row = rows[i];
        if (Array.isArray(row)) {
            checkText(row.join(' '));
        } else if (typeof row === 'string') {
            checkText(row);
        }
    }

    return meta;
};

export const parseTableMatrixToGroups = (
    matrix: string[][],
    sheetName: string,
    formType: MigrationFormType,
    initialMetadata?: Record<string, string>,
): ExtractedGroup[] => {
    const groups: ExtractedGroup[] = [];
    if (!matrix || matrix.length === 0) return groups;

    const targetKeywords = getTargetKeywordsForForm(formType);

    let r = 0;
    while (r < matrix.length) {
        let headerRowIdx = -1;
        let maxMatches = 0;
        const currentMetadata: Record<string, string> = { ...(initialMetadata || {}) };

        const scanLimit = Math.min(r + 60, matrix.length);
        for (let sr = r; sr < scanLimit; sr++) {
            const row = matrix[sr];
            if (!Array.isArray(row)) continue;

            const rowStr = row.map((c) => String(c || '').toLowerCase().trim()).join(' ');

            // Skip non-table header rows
            if (
                rowStr.includes('to be filled up by') ||
                rowStr.includes('recapitulation') ||
                rowStr.includes('recap') ||
                rowStr.includes('appendix 6') ||
                rowStr.includes('report of supplies and materials') ||
                rowStr.includes('report on the physical count') ||
                rowStr.includes('report of physical count') ||
                rowStr.includes('stock card') ||
                rowStr.includes('memorandum receipt')
            ) {
                continue;
            }

            // Extract metadata from non-column-header cells in this header region
            const isLikelyHeaderRow = targetKeywords.filter((kw) => rowStr.includes(kw)).length >= 2;
            if (!isLikelyHeaderRow) {
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

                    const isHeaderWord = (s: string) =>
                        /^(center\s*code|resp|responsibility|entity|fund|date|page|sheet|division|stock|ris|item|unit|qty|quantity|amount|cost)/i.test(s);

                    const entityVal = extractLabelVal(/entity\s*name/i);
                    if (entityVal) currentMetadata['entityName'] = entityVal;

                    const fundVal = extractLabelVal(/fund\s*cluster/i);
                    if (fundVal) currentMetadata['fundCluster'] = fundVal;

                    const serialVal = extractLabelVal(/(?:serial|mr|doc|property)\s*no\.?/i);
                    if (serialVal && !isHeaderWord(serialVal)) {
                        currentMetadata['topSerialNo'] = serialVal;
                    }

                    const dateVal = extractLabelVal(/(?:as\s*at\s*date|date\s*issued|date\s*:)/i);
                    if (dateVal && !isHeaderWord(dateVal)) currentMetadata['topDate'] = dateVal;

                    const recipVal = extractLabelVal(/(?:accountable\s*officer|property\s*custodian|received\s*by)/i);
                    if (recipVal) currentMetadata['topRecipient'] = recipVal;

                    const officeVal = extractLabelVal(/(?:office|department)\s*[:\-]/i);
                    if (officeVal) currentMetadata['topOffice'] = officeVal;
                }
            }

            // Count unique matching keywords in this row
            const matchedKwSet = new Set<string>();
            row.forEach((cell) => {
                const cellStr = String(cell || '').toLowerCase().trim();
                if (!cellStr) return;
                targetKeywords.forEach((kw) => {
                    if (cellStr.includes(kw)) {
                        matchedKwSet.add(kw);
                    }
                });
            });

            const matches = matchedKwSet.size;
            if (matches >= 3 && matches > maxMatches) {
                maxMatches = matches;
                headerRowIdx = sr;
                if (matches >= 4) {
                    break;
                }
            }
        }

        // If no header row with >= 3 keywords found, check if a row with >= 2 keywords exists
        if (headerRowIdx === -1) {
            for (let sr = r; sr < scanLimit; sr++) {
                const row = matrix[sr];
                if (!Array.isArray(row)) continue;
                const matchedKwSet = new Set<string>();
                row.forEach((cell) => {
                    const cellStr = String(cell || '').toLowerCase().trim();
                    if (!cellStr) return;
                    targetKeywords.forEach((kw) => {
                        if (cellStr.includes(kw)) {
                            matchedKwSet.add(kw);
                        }
                    });
                });
                if (matchedKwSet.size >= 2) {
                    headerRowIdx = sr;
                    break;
                }
            }
        }

        if (headerRowIdx === -1) break;

        const rawHeaders = matrix[headerRowIdx] || [];
        const nextRow = matrix[headerRowIdx + 1] || [];
        let actualDataStart = headerRowIdx + 1;

        let hasMergedSubheaders = false;
        const headers: string[] = [];
        rawHeaders.forEach((hCell, cIdx) => {
            let hName = String(hCell || '').replace(/\r?\n/g, ' ').trim();
            const subName = String(nextRow[cIdx] || '').replace(/\r?\n/g, ' ').trim();
            if (subName && !/^\s*\(\s*\d+\s*\)\s*$/.test(subName)) {
                if (/quantity|value|cost|office|amount|desc|article|unit|code|issued/i.test(subName)) {
                    hName = hName ? `${hName} ${subName}` : subName;
                    hasMergedSubheaders = true;
                }
            }
            headers[cIdx] = hName;
        });

        if (hasMergedSubheaders || nextRow.some((cell) => /^\s*\(\s*\d+\s*\)\s*$/.test(String(cell || '').trim()))) {
            actualDataStart = headerRowIdx + 2;
        }

        if (
            actualDataStart < matrix.length &&
            matrix[actualDataStart].some((cell) => /^\s*\(\s*\d+\s*\)\s*$/.test(String(cell || '').trim()))
        ) {
            actualDataStart++;
        }

        r = actualDataStart;
        const resultRows: any[] = [];

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
                fullRowStr.includes('i hereby certif') ||
                fullRowStr.includes('correctness of the above')
            ) {
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
                const cellVal = row[cIdx] !== undefined ? String(row[cIdx]).trim() : '';
                if (hName) rowObj[hName] = cellVal;
                else rowObj[`__col_${cIdx}`] = cellVal;
                if (cellVal) hasContent = true;
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

        // Advance to next report/page in the worksheet if present
        let foundNewForm = false;
        while (r < matrix.length) {
            const nextCandidate = matrix[r];
            if (Array.isArray(nextCandidate)) {
                const str = nextCandidate.map((c) => String(c || '').toLowerCase().trim()).join(' ');
                if (
                    str.includes('report of supplies and materials issued') ||
                    str.includes('report on the physical count') ||
                    str.includes('report of physical count') ||
                    str.includes('stock card') ||
                    str.includes('memorandum receipt') ||
                    str.includes('appendix 64') ||
                    str.includes('appendix 66') ||
                    str.includes('appendix 63') ||
                    str.includes('entity name')
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

    return groups;
};
