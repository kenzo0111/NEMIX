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
    period_type?: ReportPeriodType;
    date?: string | null;
    dateValue?: string | null;
    startDate?: string | null;
    start_date?: string | null;
    endDate?: string | null;
    end_date?: string | null;
    selectedMonth?: number | null;
    selected_month?: number | null;
    selectedYear?: number | null;
    selected_year?: number | null;
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

export interface RsmiFormDataset {
    serialNo: string;
    serial_no?: string;
    periodLabel: string;
    period_label?: string;
    date: string;
    entityName: string;
    fundCluster: string;
    issuedItems: any[];
    recapitulationItems: any[];
    supplyCustodianName: string;
    accountingStaffName: string;
    accountingDate: string;
}

export interface RsmiMonthReport {
    month: number;
    month_name: string;
    period_label: string;
    period_start: string;
    period_end: string;
    has_records: boolean;
    record_count: number;
    total_units: number;
    total_amount: number;
    forms: RsmiFormDataset[];
}

export interface RsmiYearReport {
    year: number;
    total_forms: number;
    active_months: number;
    months: RsmiMonthReport[];
}

export interface ReportDatasetSummary {
    recordCount: number;
    totalUnits?: number;
    totalQuantity?: number;
    totalAmount?: number;
    totalValue?: number;
    currentBalance?: number;
    totalForms?: number;
    activeMonths?: number;
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
    signatories?: any;
    yearly?: RsmiYearReport;
    period_format?: string;
    rsmi?: {
        issuedItems: any[];
        recapitulationItems: any[];
        summary: ReportDatasetSummary;
        entityName?: string;
        fundCluster?: string;
        forms?: RsmiFormDataset[];
        yearly?: RsmiYearReport;
        supplyCustodianName?: string;
        supplyCustodianDesignation?: string;
        accountingStaffName?: string;
        accountingStaffDesignation?: string;
        [key: string]: any;
    };
    rpci?: {
        items: any[];
        summary: ReportDatasetSummary;
        entity_name?: string;
        fund_cluster?: string;
        signatories?: any;
        accountable_officer?: string;
        accountable_officer_name?: string;
        accountable_officer_designation?: string;
        designation?: string;
        certified_by_name?: string;
        certified_by_position?: string;
        verified_by_name?: string;
        verified_by_position?: string;
        committee_chair?: string;
        [key: string]: any;
    };
    stockCard?: {
        item: string;
        stock_no: string;
        supplier_stock_no?: string | null;
        item_no?: string | null;
        description: string;
        unit_of_measurement: string;
        re_order_point: string;
        entries: any[];
        summary: ReportDatasetSummary;
        entity_name?: string;
        fund_cluster?: string;
        custodian?: string;
        custodian_name?: string;
        [key: string]: any;
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
        issuedByName?: string;
        issuedByPosition?: string;
        issuedByOffice?: string;
        appendixNumber?: string;
        [key: string]: any;
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
