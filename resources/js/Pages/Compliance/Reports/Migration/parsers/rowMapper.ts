import { getLocalDateString } from '@/utils/dateUtils';
import { MigrationFormType, MigrationItem } from '../migrationTypes';

export const getRowVal = (row: any, possibleKeys: string[]): string => {
    if (!row || typeof row !== 'object') return '';

    for (const key of possibleKeys) {
        if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== '') {
            return String(row[key]).trim();
        }
    }

    const cleanKey = (k: string) =>
        k.toLowerCase()
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

        if (matchedRowKey && row[matchedRowKey] !== undefined && row[matchedRowKey] !== null && String(row[matchedRowKey]).trim() !== '') {
            return String(row[matchedRowKey]).trim();
        }
    }

    return '';
};

export const formatDateToIso = (rawDate: any): string => {
    return getLocalDateString(rawDate);
};

export interface LastRefTracker {
    current: string;
    centerCode?: string;
}

export const mapRowToItem = (
    row: any,
    idx: number,
    formType: MigrationFormType,
    groupMetadata: any,
    lastRefObj: LastRefTracker,
): MigrationItem | null => {
    if (typeof row === 'string') {
        return {
            reference: `${formType}-HIST-${idx + 1}`,
            item_name: row,
            quantity: 1,
            date: getLocalDateString(),
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
        const amt = Number(getRowVal(row, ['Amount', 'Total Cost', 'Total Amount', 'Total Value', 'amount', 'totalCost', 'total_cost']) || (qty * cost));

        // Check if this is a section header or RIS slip header row
        const firstCell = String(Object.values(row)[0] || '').trim();
        const isSectionHeader = /^(center\s*code|resp|responsibility)/i.test(rawRef) || (/^(center\s*code|resp|responsibility)/i.test(firstCell) && !stockNo && qty === 0);
        const isRisHeaderRow = (rawRef || rccFromRow) && !rawItemName && !stockNo && qty === 0;

        if (isSectionHeader || isRisHeaderRow) {
            if (rawRef && !/^(center\s*code|resp|responsibility|entity|fund|date|page|sheet)/i.test(rawRef)) {
                lastRefObj.current = rawRef;
            }
            const detectedCode = (rccFromRow && !/center\s*code|resp/i.test(rccFromRow))
                ? rccFromRow
                : Object.values(row).find((v: any) => typeof v === 'string' && v.trim() && !/center\s*code|resp|appendix|report/i.test(v)) || '';
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

        const activeCenterCode = (rccFromRow && !/^(center\s*code|resp|responsibility)/i.test(rccFromRow))
            ? rccFromRow
            : (lastRefObj.centerCode || groupMetadata?.topOffice || '');

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
            const found = Object.values(row).find((v: any) =>
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
                !/^(center\s*code|spmo|acc|pc|pcs|box|ream|bot|unit|kg|pack|meter|pad)/i.test(v),
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
        const totalVal = Number(getRowVal(row, ['Total Value', 'Grand Total Value', 'Amount', 'totalValue', 'amount']) || (qty * cost));
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

    // Default: STOCK_CARD
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
