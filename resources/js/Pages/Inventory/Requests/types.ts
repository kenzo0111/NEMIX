export type RequestItem = {
    id: number;
    name: string;
    sku: string;
    stock: number;
    unit_of_issue?: string;
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
    status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled' | 'Issued';
    department: string;
    purpose: string;
    ris_number: string | null;
    review_remarks: string | null;
    created_at: string;
    reviewed_at?: string | null;
    items: RequestLine[];
    reviewer?: { name: string } | null;
    issuance_id?: number | null;
};
