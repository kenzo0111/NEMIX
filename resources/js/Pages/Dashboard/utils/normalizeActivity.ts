import { DashboardActivity } from '../types';
import { formatRisNumber } from '@/utils/risFormatter';

/**
 * Safely parse a JSON string into a structured object or return null.
 */
export function safeParseJson<T = Record<string, unknown>>(value: unknown): T | null {
    if (typeof value !== 'string') {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
        return null;
    }

    try {
        const parsed = JSON.parse(trimmed);
        if (parsed && typeof parsed === 'object') {
            return parsed as T;
        }
    } catch {
        return null;
    }

    return null;
}

/**
 * Format numeric quantities with Philippine standard thousand separators (e.g. 4065 -> 4,065).
 */
export function formatQuantity(num: number | string | undefined | null): string {
    if (num === null || num === undefined || num === '') return '0';
    const n = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(n)) return String(num);
    return new Intl.NumberFormat('en-PH').format(n);
}

/**
 * Normalize arbitrary module names into concise university dashboard categories.
 */
export function normalizeModuleName(module?: string | null): string {
    if (!module) return 'System';
    const lower = module.toLowerCase();

    if (lower.includes('rfid')) return 'RFID';
    if (lower.includes('invent') || lower.includes('item') || lower.includes('stock')) return 'Inventory';
    if (lower.includes('suppl')) return 'Suppliers';
    if (lower.includes('complian') || lower.includes('rpci') || lower.includes('rsmi') || lower.includes('report')) return 'Compliance';
    if (lower.includes('setting') || lower.includes('config') || lower.includes('admin')) return 'Administration';
    if (lower.includes('user') || lower.includes('role') || lower.includes('access')) return 'Access Control';

    return module;
}

/**
 * Defensive normalizer for any incoming activity item.
 * Ensures that even if legacy, unparsed, or malformed audit payloads arrive at the client,
 * raw JSON `{...}` is never rendered on the dashboard.
 */
export function normalizeActivity(raw: unknown): DashboardActivity {
    if (!raw || typeof raw !== 'object') {
        return {
            id: 'trx-fallback',
            title: 'System Activity',
            summary: 'System activity recorded',
            module: 'System',
            occurred_at: '',
            time: 'Recently',
        };
    }

    const item = raw as Record<string, any>;

    // 1. Resolve raw details and metadata
    let metadata: Record<string, any> = {};
    if (item.metadata && typeof item.metadata === 'object' && !Array.isArray(item.metadata)) {
        metadata = { ...item.metadata };
    } else if (typeof item.metadata === 'string') {
        const parsed = safeParseJson<Record<string, any>>(item.metadata);
        if (parsed) metadata = { ...parsed };
    }

    // Check if details was stored as a serialized JSON string
    const rawDetails = typeof item.details === 'string' ? item.details.trim() : '';
    const detailsJson = safeParseJson<Record<string, any>>(rawDetails);
    if (detailsJson) {
        metadata = { ...detailsJson, ...metadata };
    }

    // 2. Resolve Event Key
    let eventKey = item.event_key || '';
    const rawAction = String(item.action || item.title || '').trim();
    const actionLower = rawAction.toLowerCase();

    if (!eventKey) {
        if (metadata.ris_number || actionLower.includes('issuance')) {
            eventKey = 'inventory.issuance.created';
        } else if (metadata.receiving_id || metadata.quantity_received || actionLower.includes('receiving') || actionLower.includes('stock in')) {
            eventKey = 'inventory.receiving.created';
        } else if (metadata.rfid_tag || actionLower.includes('rfid')) {
            eventKey = 'rfid.tag.assigned';
        } else if (actionLower.includes('setting') || actionLower.includes('config')) {
            eventKey = 'system.settings.updated';
        } else if (actionLower.includes('memorandum') || actionLower.includes('receipt')) {
            eventKey = 'compliance.mr.generated';
        } else if (actionLower.includes('rpci')) {
            eventKey = 'compliance.rpci.generated';
        } else if (actionLower.includes('rsmi')) {
            eventKey = 'compliance.rsmi.generated';
        } else if (actionLower.includes('stock card')) {
            eventKey = 'compliance.stock_card.generated';
        } else if (actionLower.includes('supplier')) {
            eventKey = actionLower.includes('create') || actionLower.includes('register') ? 'supplier.created' : 'supplier.updated';
        } else if (actionLower.includes('item')) {
            eventKey = actionLower.includes('create') || actionLower.includes('add') ? 'inventory.item.created' : 'inventory.item.updated';
        }
    }

    // 3. Resolve Title
    let title = item.title || item.action || 'System Activity';
    if (title.startsWith('{') || title.startsWith('[')) {
        title = 'System Activity Recorded';
    }

    // 4. Resolve Reference (Strip internal IDs like TRX- or internal primary keys)
    let reference: string | null = item.reference || item.resource_ref || null;
    if (typeof reference === 'string' && (reference.startsWith('TRX-') || reference.startsWith('ID-') || reference.startsWith('CONFIG-BATCH-') || reference.startsWith('AUTH-'))) {
        reference = null;
    }

    // 5. Build Human-readable Natural Sentence Summary & Context
    let summary: string | null = null;
    const context: Record<string, unknown> = { ...(item.context || {}) };

    if (eventKey === 'inventory.issuance.created' || actionLower.includes('issuance')) {
        title = 'Created Stock Issuance';
        if (metadata.ris_number) {
            reference = formatRisNumber(String(metadata.ris_number));
        }

        const itemsCount = metadata.items_count ? parseInt(String(metadata.items_count), 10) : 1;
        const totalQty = metadata.total_quantity !== undefined ? parseInt(String(metadata.total_quantity), 10) : null;
        const recipient = metadata.recipient ? String(metadata.recipient).trim() : null;
        const department = metadata.department ? String(metadata.department).trim() : null;

        if (department) context.department = department;
        if (recipient) context.recipient = recipient;

        const itemUnitText = itemsCount === 1 ? '1 item' : `${itemsCount} items`;
        const qtyText = totalQty !== null && !isNaN(totalQty) ? ` (${formatQuantity(totalQty)} units)` : '';

        if (recipient && department) {
            summary = `Issued ${itemUnitText}${qtyText} to ${recipient}, ${department}.`;
        } else if (recipient) {
            summary = `Issued ${itemUnitText}${qtyText} to ${recipient}.`;
        } else if (department) {
            summary = `Issued ${itemUnitText}${qtyText} to ${department}.`;
        } else {
            summary = `Issued ${itemUnitText}${qtyText}.`;
        }
    } else if (eventKey === 'inventory.receiving.created' || actionLower.includes('receiving')) {
        title = 'Recorded Inventory Receiving';

        const itemName = metadata.item_name ? String(metadata.item_name) : null;
        const supplierName = metadata.supplier_name ? String(metadata.supplier_name) : null;
        const stockNo = metadata.supplier_stock_no ? String(metadata.supplier_stock_no) : null;
        const qty = metadata.quantity ?? metadata.quantity_received;
        const unit = metadata.unit || 'units';

        if (stockNo) {
            reference = `Stock No. ${stockNo}`;
        } else if (itemName) {
            reference = itemName;
        }

        if (supplierName) context.supplier = supplierName;
        if (itemName) context.entity = itemName;
        if (stockNo) context.stock_no = stockNo;

        if (qty && supplierName) {
            summary = `Received ${formatQuantity(qty)} ${unit} from ${supplierName}.`;
        } else if (qty) {
            summary = `Received ${formatQuantity(qty)} ${unit} into inventory.`;
        } else if (supplierName) {
            summary = `Received from ${supplierName}.`;
        } else {
            summary = 'Inventory receiving recorded.';
        }
    } else if (eventKey === 'inventory.item.created' || (actionLower.includes('item') && actionLower.includes('add'))) {
        title = 'Registered Item Master';
        const itemName = metadata.name || metadata.item_name || item.resource_ref;
        if (itemName) reference = String(itemName);

        const unit = metadata.unit_of_issue || metadata.unit;
        const stock = metadata.stock !== undefined ? parseInt(String(metadata.stock), 10) : null;

        if (unit && stock !== null && !isNaN(stock)) {
            summary = `Initial stock: ${formatQuantity(stock)} ${String(unit).toLowerCase()}${stock > 1 ? 's' : ''}.`;
        } else if (unit) {
            summary = `Catalog item registered with unit: ${unit}.`;
        } else if (stock !== null && !isNaN(stock)) {
            summary = `Initial stock: ${formatQuantity(stock)} units.`;
        } else {
            summary = 'Item registered in inventory master catalog.';
        }
    } else if (eventKey === 'compliance.mr.generated' || actionLower.includes('memorandum')) {
        title = 'Generated Memorandum Receipt';
        if (metadata.report_number) reference = String(metadata.report_number);
        const recipient = metadata.recipient || (rawDetails.match(/Memorandum Receipt\s*[-–:]\s*([^'"]+)/i)?.[1]?.trim());
        summary = recipient ? `Prepared for ${recipient}.` : 'Memorandum Receipt compliance documentation generated.';
    } else if (eventKey === 'compliance.rpci.generated' || actionLower.includes('rpci')) {
        title = 'Generated RPCI Report';
        if (metadata.report_number) reference = String(metadata.report_number);
        summary = metadata.as_of ? `Physical Count of Inventories as of ${metadata.as_of}.` : 'Physical count of inventories report generated.';
    } else if (eventKey === 'compliance.rsmi.generated' || actionLower.includes('rsmi')) {
        title = 'Generated RSMI Report';
        if (metadata.report_number) reference = String(metadata.report_number);
        const month = metadata.month || (rawDetails.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i)?.[0]);
        summary = month ? `${month} reporting period.` : 'Monthly report of supplies and materials issued.';
    } else if (eventKey === 'system.settings.updated' || actionLower.includes('setting')) {
        title = 'Updated System Settings';
        reference = null;
        summary = 'Inventory stock thresholds and configuration updated.';
    } else if (eventKey.startsWith('supplier.') || actionLower.includes('supplier')) {
        const isCreated = actionLower.includes('create') || actionLower.includes('new') || actionLower.includes('register');
        title = isCreated ? 'Registered New Supplier' : 'Updated Supplier';
        const suppName = metadata.name || metadata.supplier_name || item.resource_ref;
        if (suppName) reference = String(suppName);
        summary = isCreated ? 'New supplier profile registered in directory.' : 'Supplier profile information updated.';
    } else if (eventKey === 'rfid.tag.assigned' || actionLower.includes('rfid')) {
        title = 'Assigned RFID Tag';
        const itemName = metadata.item_name || (metadata.item && metadata.item.name);
        if (itemName) reference = String(itemName);
        summary = 'RFID tag assigned successfully.';
    }

    // Fallback if summary was not derived
    if (!summary) {
        if (item.summary && !item.summary.startsWith('{') && !item.summary.startsWith('[')) {
            summary = item.summary;
        } else if (rawDetails && !rawDetails.startsWith('{') && !rawDetails.startsWith('[')) {
            summary = rawDetails.endsWith('.') ? rawDetails : `${rawDetails}.`;
        } else {
            summary = 'System operational activity recorded.';
        }
    }

    // Defensive final pass: if summary still contains raw JSON characters, replace with clean text
    if (summary && (summary.startsWith('{') || summary.startsWith('['))) {
        summary = 'System operational activity recorded.';
    }

    // 6. Resolve Actor (strip any "by " prefix)
    let actorName = item.actor?.name || item.user || 'System Administrator';
    if (actorName.toLowerCase().startsWith('by ')) {
        actorName = actorName.substring(3).trim();
    }
    const actorRole = item.actor?.role || item.role || 'Authorized Staff';

    // 7. Resolve Timestamps
    let time = item.time;
    let timestamp = item.timestamp || item.occurred_at || '';

    if (!time && item.occurred_at) {
        try {
            const date = new Date(item.occurred_at);
            const now = new Date();
            const timePart = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
            const isToday = date.toDateString() === now.toDateString();
            const isThisYear = date.getFullYear() === now.getFullYear();

            if (isToday) {
                time = timePart;
            } else if (isThisYear) {
                const monthDay = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
                time = `${monthDay} • ${timePart}`;
            } else {
                const fullDate = date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
                time = `${fullDate} • ${timePart}`;
            }
        } catch {
            time = 'Recently';
        }
    }

    // 8. Resolve Module
    const module = normalizeModuleName(item.module);

    return {
        id: item.id || Math.random().toString(36).substring(2, 9),
        event_key: eventKey,
        title,
        summary,
        reference,
        module,
        occurred_at: item.occurred_at || '',
        time: time || 'Recently',
        timestamp,
        actor: {
            id: item.actor?.id,
            name: actorName,
            role: actorRole,
        },
        group_id: item.group_id || item.audit_group_id || metadata.correlation_id || null,
        context,
        user: actorName,
        role: actorRole,
        action: title,
        details: summary,
        status: item.status || 'Success',
        badge: item.badge,
    };
}
