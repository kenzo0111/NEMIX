export type ComplianceReportType = 'RSMI' | 'RPCI' | 'STOCK_CARD' | 'MR' | 'MOR';

export interface ComplianceReportItem {
    id: number | string;
    type: ComplianceReportType | string;
    reference: string;
    title?: string;
    itemName?: string;
    item_name?: string;
    supplierName?: string;
    supplier_name?: string;
    quantity?: number | string;
    quantity_issued?: number | string;
    balance?: number | string;
    recipient?: string;
    department?: string;
    unit_cost?: number | string;
    unitCost?: number | string;
    amount?: number | string;
    total_value?: number | string;
    status: string;
    date: string;
    created_at?: string;
    payload?: Record<string, any>;
    source?: string;
}

export interface MigratedRecord {
    id: number | string;
    form_type: string;
    source: string;
    reference: string;
    item_name?: string;
    item?: string;
    quantity?: number;
    quantity_issued?: number;
    recipient?: string;
    department?: string;
    responsibility_center_code?: string;
    center_code?: string;
    entity_name?: string;
    stock_no?: string;
    unit?: string;
    unit_cost?: number;
    amount?: number;
    fund_cluster?: string;
    designation?: string;
    remarks?: string;
    date?: string;
    status: string;
    payload?: Record<string, any>;
}

export interface ReportFilterState {
    searchTerm: string;
    selectedType: { value: string; label: string } | null;
    selectedReference: { value: string; label: string } | null;
    selectedStatus: { value: string; label: string } | null;
    selectedDate: string;
}

export interface ReportFormData {
    id?: number | null;
    type: ComplianceReportType;
    reference: string;
    entityName: string;
    fundCluster: string;
    serialNo: string;
    date: string;
    selectedMonth: string;
    selectedYear: string;
    selectedQuarter: string;
    periodEnd: string;
    selectedItem: any;
    selectedSupplier: any;
    accountableOfficer: string;
    accountableOfficerDesignation: string;
    certifiedBy: string;
    certifiedByDesignation: string;
    postedBy: string;
    postedByDesignation: string;
    receivedFrom: string;
    receivedFromDesignation: string;
    status: 'draft' | 'submitted' | 'approved' | 'archived';
    itemsData?: any[];
    [key: string]: any;
}

// Auto-generate Serial / Ref No. in YYYY-MM-DD-SEQUEL format
export const generateReportReference = (
    targetDate?: string,
    allReports: any[] = [],
    allMigrations: any[] = []
): string => {
    let dateStr = targetDate;
    if (!dateStr) {
        dateStr = new Date().toISOString().split('T')[0];
    } else {
        dateStr = String(dateStr).split('T')[0].trim();
    }

    const dateMatch = dateStr.match(/^\d{4}-\d{2}-\d{2}$/);
    const datePrefix = dateMatch ? dateStr : new Date().toISOString().split('T')[0];

    const existingRefs: string[] = [
        ...allReports.map((r: any) => r.reference || r.serial_no || r.doc_no || ''),
        ...allMigrations.map((m: any) => m.reference || m.serial_no || m.doc_no || ''),
    ].filter(Boolean);

    let maxSeq = 0;
    const prefixRegex = new RegExp(`^${datePrefix}-(\\d+)$`);

    existingRefs.forEach((ref) => {
        const trimmed = String(ref).trim();
        const match = trimmed.match(prefixRegex);
        if (match) {
            const seq = parseInt(match[1], 10);
            if (!isNaN(seq) && seq > maxSeq) {
                maxSeq = seq;
            }
        }
    });

    const nextSeq = maxSeq + 1;
    const sequel = String(nextSeq).padStart(4, '0');
    return `${datePrefix}-${sequel}`;
};

export const formatFundClusterDisplay = (val?: string | null): string => {
    if (!val || val === 'General Fund' || val === 'Regular Agency Fund' || val === '01') {
        return '01 - Regular Agency Fund';
    }
    return val;
};
