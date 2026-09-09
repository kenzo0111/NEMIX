import { ComplianceReportType } from '../types';

let xlsxModule: typeof import('xlsx') | null = null;
let mammothModule: typeof import('mammoth') | null = null;
let pdfjsModule: typeof import('pdfjs-dist/legacy/build/pdf.mjs') | null = null;
let tesseractModule: typeof import('tesseract.js') | null = null;

export const loadDocumentParsers = async () => {
    if (!xlsxModule) {
        xlsxModule = await import('xlsx');
    }

    if (!mammothModule) {
        mammothModule = await import('mammoth');
    }

    if (!pdfjsModule) {
        const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
            import.meta.url
        ).toString();
        pdfjsModule = pdfjs;
    }

    if (!tesseractModule) {
        tesseractModule = await import('tesseract.js');
    }

    return {
        xlsx: xlsxModule,
        mammoth: mammothModule,
        pdfjs: pdfjsModule,
        tesseract: tesseractModule,
    };
};

export const parseWorkbookToGroups = (workbook: any, formType: string, xlsx: any) => {
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

export const getRowVal = (row: any, possibleKeys: string[]) => {
    if (!row || typeof row !== 'object') return '';

    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return String(row[key]).trim();
        }
    }

    const cleanKey = (k: string) =>
        k
            .toLowerCase()
            .replace(/\s*\(\s*\d+\s*\)\s*$/g, '')
            .replace(/[^a-z0-9]/g, '');

    const rowKeys = Object.keys(row);
    for (const key of possibleKeys) {
        const normKey = cleanKey(key);
        if (!normKey) continue;

        const matchedRowKey = rowKeys.find((rk) => {
            const normRk = cleanKey(rk);
            return normRk === normKey || normRk.replace(/\d+$/, '') === normKey.replace(/\d+$/, '');
        });

        if (
            matchedRowKey &&
            row[matchedRowKey] !== undefined &&
            row[matchedRowKey] !== null &&
            String(row[matchedRowKey]).trim() !== ''
        ) {
            return String(row[matchedRowKey]).trim();
        }
    }

    return '';
};

export const formatDateToIso = (rawDate: any) => {
    if (!rawDate) return '';
    const str = String(rawDate).trim();
    if (!str || str === '-' || str === 'N/A') return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const d = new Date(str);
    if (!Number.isNaN(d.getTime()) && d.getFullYear() >= 1970 && d.getFullYear() <= 2100) {
        return d.toISOString().split('T')[0];
    }
    return '';
};

export const mapRowToItem = (
    row: any,
    idx: number,
    formType: string,
    groupMetadata: any,
    lastRefObj: { current: string; centerCode?: string }
) => {
    if (typeof row === 'string') {
        return {
            reference: `${formType}-HIST-${idx + 1}`,
            item_name: row,
            quantity: 1,
            date: new Date().toISOString().split('T')[0],
            remarks: 'Parsed raw text row',
        };
    }

    if (formType === 'RSMI') {
        let rawRef = getRowVal(row, ['RIS No.', 'RIS No', 'RIS', 'Serial No.', 'Serial No', 'Reference', 'reference', 'risNo', 'ris_no', 'Doc No.', 'Doc No']);
        const rccFromRow = getRowVal(row, ['Responsibility Center Code', 'Responsibility Center', 'Resp. Center Code', 'Resp Center Code', 'Center Code', 'RCC', 'responsibilityCenterCode', 'responsibility_center_code', 'center_code']);
        const stockNo = getRowVal(row, ['Stock No.', 'Stock No', 'Stock Number', 'SKU', 'stockNo', 'stock_no', 'Stock']);
        const rawItemName = getRowVal(row, ['Item', 'Item Description', 'Description', 'Article', 'Item / Description', 'item_name', 'itemDescription', 'Item Name']);
        const unit = getRowVal(row, ['Unit', 'Unit of Issue', 'Unit of Measurement', 'unit']) || 'pc';
        const qty = Number(getRowVal(row, ['Quantity Issued', 'Qty Issued', 'Qty. Issued', 'Quantity', 'Qty', 'Qty.', 'quantity', 'quantityIssued', 'quantity_issued', 'issue_qty', 'Issued']) || 0);
        const cost = Number(getRowVal(row, ['Unit Cost', 'Unit Value', 'Cost', 'unitCost', 'unit_cost', 'unit_value']) || 0);
        const amt = Number(getRowVal(row, ['Amount', 'Total Cost', 'Total Amount', 'Total Value', 'amount', 'totalCost', 'total_cost']) || qty * cost);

        const firstCell = String(Object.values(row)[0] || '').trim();
        const isSectionHeader = /^(center\s*code|resp|responsibility)/i.test(rawRef) || (/^(center\s*code|resp|responsibility)/i.test(firstCell) && !stockNo && qty === 0);
        const isRisHeaderRow = (rawRef || rccFromRow) && !rawItemName && !stockNo && qty === 0;

        if (isSectionHeader || isRisHeaderRow) {
            if (rawRef && !/^(center\s*code|resp|responsibility|entity|fund|date|page|sheet)/i.test(rawRef)) {
                lastRefObj.current = rawRef;
            }
            const detectedCode =
                rccFromRow && !/center\s*code|resp/i.test(rccFromRow)
                    ? rccFromRow
                    : Object.values(row).find(
                          (v: any) => typeof v === 'string' && v.trim() && !/center\s*code|resp|appendix|report/i.test(v)
                      ) || '';
            if (detectedCode) {
                lastRefObj.centerCode = String(detectedCode).trim();
            }
            return null;
        }

        if (/^(center\s*code|resp|responsibility|entity|fund|date|page|sheet)/i.test(rawRef)) {
            rawRef = '';
        }

        if (rccFromRow && !/^(center\s*code|resp|responsibility)/i.test(rccFromRow)) {
            lastRefObj.centerCode = rccFromRow;
        }

        const activeCenterCode =
            rccFromRow && !/^(center\s*code|resp|responsibility)/i.test(rccFromRow)
                ? rccFromRow
                : lastRefObj.centerCode || groupMetadata?.topOffice || '';

        if (rawRef) {
            lastRefObj.current = rawRef;
        }
        let ref = rawRef || lastRefObj.current;
        if (!ref && groupMetadata?.topSerialNo && !/^(center\s*code|resp)/i.test(groupMetadata.topSerialNo)) {
            ref = groupMetadata.topSerialNo;
        }

        let dt = getRowVal(row, ['Date', 'Date Issued', 'Transaction Date', 'date', 'date_issued', 'topDate']);
        if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
        const recipient = getRowVal(row, ['Recipient', 'Requested By', 'Issued To', 'recipient', 'topRecipient']) || groupMetadata?.topRecipient || activeCenterCode;
        const fundCluster = getRowVal(row, ['Fund Cluster', 'fund_cluster', 'General Fund']) || groupMetadata?.fundCluster;
        const entityName = groupMetadata?.entityName || 'University of Camarines Norte';
        const remarks = getRowVal(row, ['Remarks', 'remarks']);

        let resolvedItem: string = rawItemName;
        if (!resolvedItem && (stockNo || qty > 0)) {
            const found = Object.values(row).find(
                (v: any) =>
                    typeof v === 'string' &&
                    v.trim().length > 1 &&
                    v.trim() !== activeCenterCode &&
                    v.trim() !== rccFromRow &&
                    v.trim() !== rawRef &&
                    v.trim() !== ref &&
                    !v.includes('RIS') &&
                    !v.includes('Appendix') &&
                    !v.includes('REPORT') &&
                    !v.includes('University') &&
                    !v.includes('Camarines') &&
                    !/^(center\s*code|spmo|acc|pc|pcs|box|ream|bot|unit|kg|pack|meter|pad)/i.test(v)
            );
            resolvedItem = found ? String(found) : '';
        }

        if (!String(resolvedItem).trim() && !stockNo && qty === 0) {
            return null;
        }

        return {
            reference: ref || `RSMI-HIST-${idx + 1}`,
            date: formatDateToIso(dt),
            item_name: String(resolvedItem).trim(),
            quantity: qty,
            unit_cost: cost,
            amount: amt,
            unit: unit,
            stock_no: stockNo,
            recipient: recipient,
            department: activeCenterCode,
            fund_cluster: fundCluster,
            responsibility_center_code: activeCenterCode,
            center_code: activeCenterCode,
            entity_name: entityName,
            remarks: remarks,
        };
    }

    if (formType === 'RPCI') {
        let ref = getRowVal(row, ['Stock Number', 'Stock No.', 'Stock No', 'Property No.', 'Property No', 'Serial No.', 'Serial No', 'reference', 'property_no', 'stock_no']);
        if (!ref && groupMetadata?.topSerialNo) ref = groupMetadata.topSerialNo;
        if (!ref && lastRefObj.current) ref = lastRefObj.current;
        if (ref) lastRefObj.current = ref;
        const article = getRowVal(row, ['Article', 'article']);
        const description = getRowVal(row, ['Description', 'Item Description', 'item_name', 'description']);
        const itemName = description || article || getRowVal(row, ['Item', 'Item Name']);
        const stockNo = ref;
        const unit = getRowVal(row, ['Unit of Measure', 'Unit of Measurement', 'Unit', 'unit']) || 'pc';
        const cost = Number(getRowVal(row, ['Unit Value', 'Unit Cost', 'unit_value', 'unit_cost']) || 0);
        const qty = Number(getRowVal(row, ['Balance Per Card', 'Balance per Card', 'Property Card Qty', 'Quantity', 'quantity', 'balance_per_card']) || 0);
        const onHand = Number(getRowVal(row, ['On Hand Per Count', 'On Hand Count', 'Physical Count', 'on_hand_count']) || qty);
        const shortageQty = getRowVal(row, ['Shortage/Overage Quantity', 'Shortage Qty', 'shortage_qty']);
        const shortageVal = getRowVal(row, ['Shortage/Overage Value', 'Shortage Value', 'shortage_value']);
        const recipient = getRowVal(row, ['Accountable Officer', 'Recipient', 'accountable_officer', 'recipient', 'topRecipient']) || groupMetadata?.topRecipient;
        const dept = getRowVal(row, ['Location', 'Department', 'Office', 'department']) || groupMetadata?.topOffice;
        let dt = getRowVal(row, ['As at Date', 'As at', 'Date', 'as_at_date', 'date', 'topDate']);
        if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
        const remarks = getRowVal(row, ['Remarks', 'State of Property', 'remarks']);

        const fallbackItem = itemName || Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 1 && !v.includes('Appendix') && !v.includes('REPORT')) || '';
        return {
            reference: stockNo || (fallbackItem ? `RPCI-HIST-${idx + 1}` : ''),
            date: formatDateToIso(dt),
            item_name: String(fallbackItem).trim(),
            quantity: qty,
            unit_cost: cost,
            unit: unit,
            stock_no: stockNo,
            on_hand_count: onHand,
            shortage_qty: shortageQty,
            shortage_value: shortageVal,
            recipient: recipient,
            department: dept,
            remarks: remarks,
        };
    }

    if (formType === 'MR' || formType === 'MOR') {
        let ref = getRowVal(row, ['Property No. / Serial No.', 'Property No.', 'Property No', 'Serial No.', 'Serial No', 'MR No.', 'MR No', 'reference', 'propertyNo', 'property_no', 'serialNo', 'mrNo', 'topSerialNo']);
        if (!ref && groupMetadata?.topSerialNo) ref = groupMetadata.topSerialNo;
        if (!ref && lastRefObj.current) ref = lastRefObj.current;
        if (ref) lastRefObj.current = ref;
        const qty = Number(getRowVal(row, ['Qty.', 'Qty', 'Quantity', 'quantity']) || 1);
        const unit = getRowVal(row, ['Unit', 'unit']) || 'pc';
        const itemName = getRowVal(row, ['Description / Item Name', 'Description', 'Item Name', 'Item', 'Item Description', 'item_name', 'description']);
        let dt = getRowVal(row, ['Date Acquired', 'Date', 'dateAcquired', 'date_acquired', 'date', 'topDate']);
        if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
        const cost = Number(getRowVal(row, ['Unit Value / Cost', 'Unit Value', 'Unit Cost', 'unitValue', 'unit_cost']) || 0);
        const totalVal = Number(getRowVal(row, ['Total Value', 'Grand Total Value', 'Amount', 'totalValue', 'amount']) || qty * cost);
        const recipient = getRowVal(row, ['Received By', 'Received by', 'End-User', 'End User', 'Recipient', 'receivedByName', 'recipient', 'topRecipient']) || groupMetadata?.topRecipient;
        const dept = getRowVal(row, ['Office', 'Department', 'receivedByOffice', 'department']) || groupMetadata?.topOffice;
        const designation = getRowVal(row, ['Position', 'receivedByPosition', 'designation']);
        const remarks = getRowVal(row, ['Purpose', 'Remarks', 'remarks']);

        const fallbackItem = itemName || Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 1 && !v.includes('MEMORANDUM') && !v.includes('Appendix')) || '';
        return {
            reference: ref || (fallbackItem ? `${formType}-HIST-${idx + 1}` : ''),
            date: formatDateToIso(dt),
            item_name: String(fallbackItem).trim(),
            quantity: qty,
            unit_cost: cost,
            amount: totalVal,
            unit: unit,
            recipient: recipient,
            department: dept,
            designation: designation,
            remarks: remarks,
        };
    }

    // Default: Stock Card
    let ref = getRowVal(row, ['Reference', 'RIS No.', 'RIS No', 'PO No.', 'PO No', 'IAR No.', 'IAR No', 'reference', 'topSerialNo']);
    if (!ref && groupMetadata?.topSerialNo) ref = groupMetadata.topSerialNo;
    if (!ref && lastRefObj.current) ref = lastRefObj.current;
    if (ref) lastRefObj.current = ref;
    const itemName = getRowVal(row, ['Item', 'Description', 'Item Description', 'item_name', 'item']);
    const stockNo = getRowVal(row, ['Stock No.', 'Stock No', 'SKU', 'stock_no', 'stockNo']);
    const unit = getRowVal(row, ['Unit of Measurement', 'Unit of Measure', 'Unit', 'unit']) || 'Pieces';
    const reorderPoint = getRowVal(row, ['Re-order Point', 'Reorder Point', 're_order_point']) || '-';
    let dt = getRowVal(row, ['Date', 'Transaction Date', 'date', 'topDate']);
    if (!dt && groupMetadata?.topDate) dt = groupMetadata.topDate;
    const receiptQty = Number(getRowVal(row, ['Receipt Qty.', 'Receipt Qty', 'Receipts', 'receipt_qty']) || 0);
    const issueQty = Number(getRowVal(row, ['Issue Qty.', 'Issue Qty', 'Issuance', 'Quantity', 'quantity', 'issue_qty']) || 0);
    const balanceQty = Number(getRowVal(row, ['Balance Qty.', 'Balance Qty', 'Balance', 'balance_qty']) || 0);
    const recipient = getRowVal(row, ['Issue Office', 'Office', 'Recipient', 'Department', 'recipient', 'issue_office', 'topRecipient']) || groupMetadata?.topOffice;
    const remarks = getRowVal(row, ['No. of Days to Consume', 'Days to Consume', 'Remarks', 'remarks']);

    const fallbackItem = itemName || Object.values(row).find((v: any) => typeof v === 'string' && v.trim().length > 1 && !v.includes('STOCK CARD') && !v.includes('Appendix')) || '';
    return {
        reference: ref || (fallbackItem ? `SC-HIST-${idx + 1}` : ''),
        date: formatDateToIso(dt),
        item_name: String(fallbackItem).trim(),
        quantity: issueQty,
        stock_no: stockNo,
        unit: unit,
        receipt_qty: receiptQty,
        balance_qty: balanceQty,
        re_order_point: reorderPoint,
        recipient: recipient,
        remarks: remarks,
    };
};

export const parseFormSpecificRows = (raw: string, formType: 'RSMI' | 'RPCI' | 'STOCK_CARD' | 'MR' | 'MOR') => {
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
        } else if (Array.isArray(parsed)) {
            const lastRefObj = { current: '', centerCode: '' };
            const items: any[] = [];
            parsed.forEach((row: any, idx: number) => {
                const mapped = mapRowToItem(row, idx, formType, null, lastRefObj);
                if (mapped) items.push(mapped);
            });
            return [{ sheetName: 'Default', metadata: {}, items }];
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.records)) {
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

    const lines = trimmed.split('\n').map((l) => l.trim()).filter((l) => l.length > 5);
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
