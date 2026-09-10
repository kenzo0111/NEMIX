import { FieldMappingDefinition, MigrationFormType } from '../migrationTypes';

export const getFieldMappingMatrix = (formType: MigrationFormType, previewRows: any[]): FieldMappingDefinition[] => {
    const sample = previewRows[0] || {};

    if (formType === 'RSMI') {
        return [
            { field: 'RIS No. (Reference)', type: 'String', sample: sample.reference || 'RIS-2024-001', dbField: 'reference' },
            { field: 'Stock No.', type: 'String', sample: sample.stock_no || 'STK-001', dbField: 'payload.stock_no' },
            { field: 'Item (Description)', type: 'String', sample: sample.item_name || 'A4 Bond Paper', dbField: 'item_name' },
            { field: 'Unit', type: 'String', sample: sample.unit || 'rim', dbField: 'payload.unit' },
            { field: 'Quantity Issued', type: 'Number', sample: sample.quantity ?? 10, dbField: 'quantity' },
            { field: 'Unit Cost & Amount', type: 'Number', sample: sample.unit_cost ? `₱${sample.unit_cost}` : '₱250.00', dbField: 'payload.unit_cost' },
        ];
    }

    if (formType === 'RPCI') {
        return [
            { field: 'Article & Description', type: 'String', sample: sample.item_name || 'Desktop Computer', dbField: 'item_name' },
            { field: 'Stock Number / Property No.', type: 'String', sample: sample.reference || 'PROP-2024-88', dbField: 'reference' },
            { field: 'Unit of Measure', type: 'String', sample: sample.unit || 'unit', dbField: 'payload.unit' },
            { field: 'Unit Value', type: 'Number', sample: sample.unit_cost ? `₱${sample.unit_cost}` : '₱25,000.00', dbField: 'payload.unit_cost' },
            { field: 'Balance Per Card / On Hand Per Count', type: 'Number', sample: sample.quantity ?? 5, dbField: 'quantity / payload.on_hand_count' },
            { field: 'Shortage/Overage Quantity & Value', type: 'Number', sample: sample.shortage_qty ? `${sample.shortage_qty}` : '0', dbField: 'payload.shortage_qty / shortage_value' },
            { field: 'Accountable Officer & Location', type: 'String', sample: sample.recipient || 'Supply Custodian', dbField: 'recipient / department' },
        ];
    }

    if (formType === 'MR' || formType === 'MOR') {
        return [
            { field: 'Property No. / Serial No. (MR No.)', type: 'String', sample: sample.reference || 'MR-2024-001', dbField: 'reference' },
            { field: 'Date Acquired', type: 'Date', sample: sample.date || '2024-01-15', dbField: 'date' },
            { field: 'Description / Item Name', type: 'String', sample: sample.item_name || 'Executive Desk', dbField: 'item_name' },
            { field: 'Qty. & Unit', type: 'Number / String', sample: `${sample.quantity ?? 1} ${sample.unit || 'unit'}`, dbField: 'quantity / payload.unit' },
            { field: 'Unit Value / Cost', type: 'Number', sample: sample.unit_cost ? `₱${sample.unit_cost}` : '₱8,500.00', dbField: 'payload.unit_cost' },
            { field: 'Received By / Office', type: 'String', sample: sample.recipient || sample.department || 'Administrative Office', dbField: 'recipient / department' },
        ];
    }

    // Default: STOCK_CARD
    return [
        { field: 'Item & Stock No.', type: 'String', sample: sample.item_name || 'Ballpen Black', dbField: 'item_name / payload.stock_no' },
        { field: 'Reference (Doc No.)', type: 'String', sample: sample.reference || 'PO-2024-09', dbField: 'reference' },
        { field: 'Transaction Date', type: 'Date', sample: sample.date || '2024-03-10', dbField: 'date' },
        { field: 'Receipt Qty. / Issue Qty.', type: 'Number', sample: sample.receipt_qty ? `+${sample.receipt_qty}` : `-${sample.quantity || 1}`, dbField: 'quantity / payload.receipt_qty' },
        { field: 'Issue Office (Recipient)', type: 'String', sample: sample.recipient || 'Admin Office', dbField: 'recipient' },
        { field: 'Balance Qty. & Days to Consume', type: 'Number', sample: sample.balance_qty ?? 45, dbField: 'payload.balance_qty' },
    ];
};
