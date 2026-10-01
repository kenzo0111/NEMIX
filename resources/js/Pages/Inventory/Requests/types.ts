import { DivisionGroup } from '../Issuance/types';

export type RequestItem = {
    id: number;
    name: string;
    sku: string;
    stock: number;
    unit_of_issue?: string;
    unit_cost?: number;
};

export type RequestLine = {
    id: number;
    item_id: number;
    quantity: number;
    approved_quantity: number | null;
    item: RequestItem;
};

export type SupplyRequest = {
    id: number;
    requested_by?: number;
    recipient?: string | null;
    recipient_designation?: string | null;
    fund_cluster?: string | null;
    date_requested?: string | null;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Issued';
    department: string;
    purpose: string;
    ris_number: string | null;
    review_remarks: string | null;
    created_at: string;
    reviewed_at?: string | null;
    items: RequestLine[];
    requester?: { id?: number; name: string; email?: string } | null;
    reviewer?: { id?: number; name: string } | null;
    issuance_id?: number | null;
    issuance?: {
        id?: number;
        ris_number?: string | null;
        issued_by_name?: string | null;
        issued_by_position?: string | null;
        date_issued?: string | null;
        fund_cluster?: string | null;
    } | null;
};

export type { DivisionGroup };
