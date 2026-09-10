import { ReportType } from '../types';

export type MigrationFormType = ReportType;

export interface MigrationItem {
    reference: string;
    item_name: string;
    quantity: number;
    date?: string | null;
    unit?: string;
    unit_cost?: number;
    amount?: number;
    stock_no?: string;
    recipient?: string;
    department?: string;
    center_code?: string;
    responsibility_center_code?: string;
    entity_name?: string;
    fund_cluster?: string;
    designation?: string;
    remarks?: string;
    on_hand_count?: number;
    shortage_qty?: number | string;
    shortage_value?: number | string;
    receipt_qty?: number;
    balance_qty?: number;
    re_order_point?: string;
    errors?: string[];
    [key: string]: any;
}

export interface MigrationGroup {
    sheetName: string;
    metadata?: {
        entityName?: string;
        fundCluster?: string;
        topSerialNo?: string;
        topDate?: string;
        topRecipient?: string;
        topOffice?: string;
        [key: string]: any;
    };
    items: MigrationItem[];
    validCount?: number;
    invalidCount?: number;
    duplicateCount?: number;
}

export interface MigrationValidationSummary {
    totalDetected: number;
    validCount: number;
    invalidCount: number;
    duplicateCount: number;
}

export interface FieldMappingDefinition {
    field: string;
    dbField: string;
    type: string;
    sample: string | number;
}

export type MigrationState =
    | { status: 'idle' }
    | { status: 'extracting'; fileName: string; message: string }
    | { status: 'preview'; groups: MigrationGroup[]; validation: MigrationValidationSummary; rawText: string; fileName: string }
    | { status: 'submitting'; count: number }
    | { status: 'success'; importedCount: number; formType: MigrationFormType }
    | { status: 'error'; message: string };
