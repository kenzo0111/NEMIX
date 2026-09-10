export interface RFIDInventoryItem {
    id: number;
    name: string;
    sku: string | null;
    description: string | null;
    unit_of_issue: string | null;
    stock: number;
    status: string;
    rfid_tag: string | null;
    supplier_id: number | null;
    supplier_name: string | null;
    updated_at?: string;
}

export interface RFIDScan {
    tag: string;
    timestamp: number;
}

export type RFIDConnectionState = 'connecting' | 'connected' | 'degraded' | 'offline';

export type RFIDWorkflowState =
    | { type: 'idle' }
    | { type: 'ready'; item: RFIDInventoryItem }
    | { type: 'detected'; item: RFIDInventoryItem; tag: string }
    | { type: 'assigning'; item: RFIDInventoryItem; tag: string }
    | { type: 'success'; item: RFIDInventoryItem; tag: string; nextItem?: RFIDInventoryItem | null }
    | { type: 'conflict'; item: RFIDInventoryItem; tag: string; conflictItem: RFIDInventoryItem }
    | { type: 'unassigned'; item: RFIDInventoryItem; previousTag: string }
    | { type: 'error'; item?: RFIDInventoryItem | null; tag?: string; message: string };

export interface RFIDScannerTransport {
    connect(): void;
    disconnect(): void;
    onScan(callback: (scan: RFIDScan) => void): () => void;
    onStatusChange(callback: (status: RFIDConnectionState) => void): () => void;
}

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}
