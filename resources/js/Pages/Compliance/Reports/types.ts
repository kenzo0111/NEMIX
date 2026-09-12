import { PageProps, User } from '@/types';
import { SidebarUser } from '@/types/navigation';

export type ReportType =
    | 'RSMI'
    | 'RPCI'
    | 'STOCK_CARD'
    | 'MR'
    | 'MOR';

export type ReportPeriodType =
    | 'all'
    | 'specific'
    | 'range'
    | 'monthly'
    | 'yearly';

export interface ReportFormData {
    title: string;
    type: ReportType | '';
    reference: string;
    itemName: string;
    supplierId: string | number;
    supplierName: string;
    endUser: string;
    fundCluster?: string;
    fund_cluster?: string;
    generatedDate: string;
    periodType: ReportPeriodType;
    date: string;
    startDate: string;
    endDate: string;
    selectedMonth: number;
    selectedYear: number;
}

export interface ComplianceReport {
    id: number;
    title: string;
    type: ReportType;
    reference: string;
    itemName?: string | null;
    supplierId?: number | string | null;
    supplierName?: string | null;
    endUser?: string | null;
    fundCluster?: string | null;
    fund_cluster?: string | null;
    entity_name?: string | null;
    entityName?: string | null;
    periodType?: ReportPeriodType;
    date?: string | null;
    dateValue?: string | null;
    startDate?: string | null;
    endDate?: string | null;
    selectedMonth?: number | null;
    selectedYear?: number | null;
    generatedDate?: string | null;
    createdAt?: string | null;
    created_at?: string | null;
    coverageLabel?: string;
    payload?: Record<string, any>;
}

export interface ReportRecord {
    source: 'live' | 'migration' | 'migration_legacy';
    reference?: string;
    date?: string | null;
    item_name?: string;
    quantity?: number;
    unit?: string;
    unit_cost?: number;
    amount?: number;
    recipient?: string;
    department?: string;
    [key: string]: any;
}

export interface ReportDatasetSummary {
    recordCount: number;
    totalUnits?: number;
    totalQuantity?: number;
    totalAmount?: number;
    totalValue?: number;
    currentBalance?: number;
}

export interface ReportDatasetResponse {
    type: ReportType;
    reference: string;
    generatedDate: string;
    coverageLabel: string;
    title: string;
    entityName?: string;
    entity_name?: string;
    fundCluster?: string;
    fund_cluster?: string;
    summary: ReportDatasetSummary;
    rsmi?: {
        issuedItems: any[];
        recapitulationItems: any[];
        summary: ReportDatasetSummary;
        entityName?: string;
        fundCluster?: string;
    };
    rpci?: {
        items: any[];
        summary: ReportDatasetSummary;
        entity_name?: string;
        fund_cluster?: string;
    };
    stockCard?: {
        item: string;
        stock_no: string;
        description: string;
        unit_of_measurement: string;
        re_order_point: string;
        entries: any[];
        summary: ReportDatasetSummary;
        entity_name?: string;
        fund_cluster?: string;
    };
    mr?: {
        items: any[];
        receivedByName: string;
        receivedByPosition: string;
        receivedByOffice: string;
        grandTotal: number;
        summary: ReportDatasetSummary;
        entityName?: string;
        fundCluster?: string;
    };
    filters: Record<string, any>;
}

export type ManageReportsPageProps = PageProps<{
    items?: any[];
    reports?: ComplianceReport[];
    issuances?: any[];
    receivings?: any[];
    suppliers?: any[];
    migratedRecords?: any[];
}>;
