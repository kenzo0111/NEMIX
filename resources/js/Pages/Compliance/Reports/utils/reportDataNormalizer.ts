import { formatDisplayDate } from '@/utils/dateUtils';
import { formatFundClusterDisplay } from '../constants';
import { ComplianceReport, ReportDatasetResponse, ReportFormData, ReportType } from '../types';
import { getResponsibilityCenterCode } from './responsibilityCenterFormatter';

export interface NormalizedReportData {
    type: ReportType;
    reference: string;
    generatedDate: string;
    title: string;
    rsmiData?: {
        entityName: string;
        fundCluster: string;
        serialNo: string;
        date: string;
        issuedItems: any[];
        recapitulationItems: any[];
        supplyCustodianName: string;
        accountingStaffName: string;
        accountingDate: string;
    };
    rpciData?: {
        entity_name: string;
        as_at_date: string;
        fund_cluster: string;
        inventory_type: string;
        accountable_officer: string;
        designation: string;
        items: any[];
        signatories?: {
            certified_by?: { name?: string; position?: string };
            approved_by?: { name?: string; position?: string };
            verified_by?: { name?: string; position?: string };
        };
        certified_by_name?: string;
        certified_by_position?: string;
        approved_by_name?: string;
        approved_by_position?: string;
        verified_by_name?: string;
        verified_by_position?: string;
        committee_chair_name?: string;
        head_of_agency_name?: string;
        coa_representative_name?: string;
    };
    stockCardData?: {
        entity_name: string;
        fund_cluster: string;
        item: string;
        stock_no: string;
        supplier_stock_no?: string | null;
        item_no?: string | null;
        description: string;
        re_order_point: string;
        unit_of_measurement: string;
        entries: any[];
    };
    mrData?: {
        entityName: string;
        fundCluster: string;
        mrNo: string;
        date: string;
        purpose: string;
        items: any[];
        receivedByName: string;
        receivedByPosition: string;
        receivedByOffice: string;
        receivedByDate: string;
        issuedByName: string;
        issuedByPosition: string;
        issuedByOffice: string;
        issuedByDate: string;
        grandTotal?: number | string;
        appendixNumber?: string;
    };
}

/**
 * Universal extractor that accepts either a live previewDataset or a saved ComplianceReport,
 * normalizing all data fields so that Preview and View Saved Report render 100% identically.
 */
export function normalizeReportPaperData(
    source: ReportDatasetResponse | ComplianceReport | null | undefined,
    user?: any,
    publicSettings: Record<string, any> = {},
    fallbackFormData?: Partial<ReportFormData>,
): NormalizedReportData | null {
    if (!source) return null;

    // Detect if source is a ComplianceReport (saved record) or ReportDatasetResponse (preview)
    const isSavedReport = 'payload' in source;
    const report = isSavedReport ? (source as ComplianceReport) : null;
    const dataset = !isSavedReport ? (source as ReportDatasetResponse) : null;

    const payload = report?.payload || {};
    const snapshot = payload?.snapshot || payload?.dataset || payload;

    const type = (report?.type || dataset?.type || fallbackFormData?.type || 'RSMI') as ReportType;

    const reference =
        report?.reference ||
        dataset?.reference ||
        payload?.reference ||
        snapshot?.reference ||
        fallbackFormData?.reference ||
        '';

    const rawDate =
        report?.generatedDate ||
        report?.createdAt ||
        report?.created_at ||
        report?.date ||
        dataset?.generatedDate ||
        payload?.generatedDate ||
        fallbackFormData?.generatedDate ||
        new Date().toISOString().split('T')[0];

    const formattedDate = formatDisplayDate(rawDate, 'YYYY-MM-DD') || String(rawDate).slice(0, 10);

    const title =
        report?.title ||
        dataset?.title ||
        payload?.title ||
        fallbackFormData?.title ||
        `${type} Report`;

    // Check if this is a saved report with a preserved historical entity name snapshot
    const savedEntityName =
        payload?.entity_name ||
        payload?.entityName ||
        snapshot?.entity_name ||
        snapshot?.entityName ||
        snapshot?.rsmi?.entityName ||
        snapshot?.rpci?.entity_name ||
        snapshot?.stockCard?.entity_name ||
        snapshot?.mr?.entityName;

    // Active centralized System Settings value
    const currentSystemEntityName =
        publicSettings['entity_name'] ||
        publicSettings['institution_name'] ||
        publicSettings['institution.name'];

    // If viewing an existing saved historical report, preserve its snapshot.
    // If previewing or newly generating a report, ALWAYS use the latest active System Setting.
    const resolvedEntityName = isSavedReport
        ? (savedEntityName || currentSystemEntityName || 'University of Camarines Norte')
        : (currentSystemEntityName || dataset?.entityName || dataset?.entity_name || 'University of Camarines Norte');

    const savedFundCluster =
        payload?.fundCluster ||
        payload?.fund_cluster ||
        snapshot?.fundCluster ||
        snapshot?.fund_cluster;

    const currentSystemFundCluster =
        publicSettings['default_fund_cluster'] ||
        publicSettings['institution_default_fund_cluster'] ||
        '01 - Regular Agency Fund';

    const defaultFundCluster = formatFundClusterDisplay(
        isSavedReport
            ? (savedFundCluster || fallbackFormData?.fundCluster || currentSystemFundCluster)
            : (fallbackFormData?.fundCluster || currentSystemFundCluster),
    );

    // 1. RSMI Normalization
    if (type === 'RSMI') {
        const rsmiSource =
            dataset?.rsmi ||
            snapshot?.rsmi ||
            payload?.rsmi ||
            (payload?.issuedItems ? payload : null) ||
            (snapshot?.issuedItems ? snapshot : null) ||
            {};

        const rawIssuedItems =
            rsmiSource.issuedItems ||
            payload.issuedItems ||
            snapshot.issuedItems ||
            [];

        const issuedItems = (Array.isArray(rawIssuedItems) ? rawIssuedItems : []).map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const code = getResponsibilityCenterCode(item);
            const fullName =
                item.responsibility_center?.name ||
                item.responsibilityCenter?.name ||
                (typeof item.responsibility_center === 'string' ? item.responsibility_center : '') ||
                (typeof item.responsibilityCenter === 'string' ? item.responsibilityCenter : '') ||
                item.department ||
                item.office ||
                item.division ||
                item.responsibilityCenterCode ||
                item.responsibility_center_code ||
                '';

            const officialStockNo = item.supplier_stock_no || item.stock_no || item.stockNo || '-';

            return {
                ...item,
                stockNo: officialStockNo,
                stock_no: officialStockNo,
                supplier_stock_no: item.supplier_stock_no || (officialStockNo !== '-' ? officialStockNo : null),
                item_no: item.item_no || item.sku || null,
                responsibilityCenterCode: code,
                responsibility_center: {
                    name: fullName || code,
                    code: code,
                    acronym: code,
                },
            };
        });

        const rawRecap =
            rsmiSource.recapitulationItems ||
            rsmiSource.recapitulation ||
            payload.recapitulationItems ||
            payload.recapitulation ||
            snapshot.recapitulationItems ||
            snapshot.recapitulation ||
            [];

        const recapitulationItems = (Array.isArray(rawRecap) ? rawRecap : []).map((r: any) => {
            if (!r || typeof r !== 'object') return r;
            const officialStockNo = r.supplier_stock_no || r.stock_no || r.stockNo || '-';
            return {
                ...r,
                stockNo: officialStockNo,
                stock_no: officialStockNo,
                supplier_stock_no: r.supplier_stock_no || (officialStockNo !== '-' ? officialStockNo : null),
            };
        });

        const entityName = isSavedReport
            ? (savedEntityName || rsmiSource.entityName || rsmiSource.entity_name || resolvedEntityName)
            : resolvedEntityName;

        const fundCluster = formatFundClusterDisplay(
            rsmiSource.fundCluster ||
            rsmiSource.fund_cluster ||
            payload.fundCluster ||
            fallbackFormData?.fundCluster ||
            defaultFundCluster,
        );

        const supplyCustodianName =
            publicSettings['signatories_rsmi_certified_by_name'] ||
            payload.supplyCustodianName ||
            user?.name ||
            'Supply Custodian';

        const accountingStaffName =
            publicSettings['signatories_rsmi_posted_by_name'] ||
            payload.accountingStaffName ||
            'Accounting Staff';

        return {
            type: 'RSMI',
            reference,
            generatedDate: formattedDate,
            title,
            rsmiData: {
                entityName,
                fundCluster,
                serialNo: reference,
                date: formattedDate,
                issuedItems: Array.isArray(issuedItems) ? issuedItems : [],
                recapitulationItems: Array.isArray(recapitulationItems) ? recapitulationItems : [],
                supplyCustodianName,
                accountingStaffName,
                accountingDate: formattedDate,
            },
        };
    }

    // 2. RPCI Normalization
    if (type === 'RPCI') {
        const rpciSource =
            dataset?.rpci ||
            snapshot?.rpci ||
            payload?.rpci ||
            (payload?.items ? payload : null) ||
            (snapshot?.items ? snapshot : null) ||
            {};

        const rawItems =
            rpciSource.items ||
            payload.items ||
            snapshot.items ||
            [];

        const items = (Array.isArray(rawItems) ? rawItems : []).map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const officialStockNo = item.supplier_stock_no || item.stock_no || '-';
            return {
                ...item,
                stock_no: officialStockNo,
                supplier_stock_no: item.supplier_stock_no || (officialStockNo !== '-' ? officialStockNo : null),
                item_no: item.item_no || item.sku || null,
            };
        });

        const entity_name = isSavedReport
            ? (savedEntityName || rpciSource.entity_name || rpciSource.entityName || resolvedEntityName)
            : resolvedEntityName;

        const fund_cluster = formatFundClusterDisplay(
            rpciSource.fund_cluster ||
            rpciSource.fundCluster ||
            payload.fund_cluster ||
            fallbackFormData?.fundCluster ||
            defaultFundCluster,
        );

        const savedSignatories =
            snapshot?.signatories ||
            payload?.signatories ||
            rpciSource?.signatories;

        // Approved by is mapped strictly from Accountable Officer
        const approvedByName = isSavedReport
            ? (savedSignatories?.approved_by?.name ||
               rpciSource.accountable_officer ||
               payload.accountable_officer ||
               user?.name ||
               'Supply Custodian')
            : (publicSettings['signatories_rpci_accountable_officer_name'] ||
               publicSettings['rpci_accountable_officer_name'] ||
               rpciSource.accountable_officer ||
               payload.accountable_officer ||
               user?.name ||
               'Supply Custodian');

        const approvedByPosition = isSavedReport
            ? (savedSignatories?.approved_by?.position ||
               rpciSource.designation ||
               payload.designation ||
               'Supply Officer III')
            : (publicSettings['signatories_rpci_accountable_officer_designation'] ||
               publicSettings['rpci_accountable_officer_designation'] ||
               rpciSource.designation ||
               payload.designation ||
               'Supply Officer III');

        const certifiedByName = isSavedReport
            ? (savedSignatories?.certified_by?.name ??
               rpciSource.certified_by_name ??
               rpciSource.committee_chair_name ??
               '')
            : (publicSettings['signatories_rpci_certified_by_name'] ||
               publicSettings['rpci_certified_by_name'] ||
               publicSettings['signatories_rpci_committee_chair'] ||
               publicSettings['rpci_committee_chair'] ||
               '');

        const certifiedByPosition = isSavedReport
            ? (savedSignatories?.certified_by?.position ??
               rpciSource.certified_by_position ??
               'Inventory Committee Chair and Members')
            : (publicSettings['signatories_rpci_certified_by_position'] ||
               publicSettings['rpci_certified_by_position'] ||
               'Inventory Committee Chair and Members');

        const verifiedByName = isSavedReport
            ? (savedSignatories?.verified_by?.name ??
               rpciSource.verified_by_name ??
               rpciSource.coa_representative_name ??
               '')
            : (publicSettings['signatories_rpci_verified_by_name'] ||
               publicSettings['rpci_verified_by_name'] ||
               '');

        const verifiedByPosition = isSavedReport
            ? (savedSignatories?.verified_by?.position ??
               rpciSource.verified_by_position ??
               'COA Representative')
            : (publicSettings['signatories_rpci_verified_by_position'] ||
               publicSettings['rpci_verified_by_position'] ||
               'COA Representative');

        const resolvedSignatories = {
            certified_by: {
                name: certifiedByName,
                position: certifiedByPosition,
            },
            approved_by: {
                name: approvedByName,
                position: approvedByPosition,
            },
            verified_by: {
                name: verifiedByName,
                position: verifiedByPosition,
            },
        };

        return {
            type: 'RPCI',
            reference,
            generatedDate: formattedDate,
            title,
            rpciData: {
                entity_name,
                as_at_date: formattedDate,
                fund_cluster,
                inventory_type: title || 'Report on Physical Count of Inventories',
                accountable_officer: approvedByName,
                designation: approvedByPosition,
                items: Array.isArray(items) ? items : [],
                signatories: resolvedSignatories,
                certified_by_name: certifiedByName,
                certified_by_position: certifiedByPosition,
                approved_by_name: approvedByName,
                approved_by_position: approvedByPosition,
                verified_by_name: verifiedByName,
                verified_by_position: verifiedByPosition,
                committee_chair_name: certifiedByName,
                head_of_agency_name: approvedByName,
                coa_representative_name: verifiedByName,
            },
        };
    }

    // 3. Stock Card Normalization
    if (type === 'STOCK_CARD') {
        const scSource =
            dataset?.stockCard ||
            snapshot?.stockCard ||
            payload?.stockCard ||
            (payload?.entries ? payload : null) ||
            (snapshot?.entries ? snapshot : null) ||
            {};

        const entries =
            scSource.entries ||
            payload.entries ||
            snapshot.entries ||
            [];

        const entity_name = isSavedReport
            ? (savedEntityName || scSource.entity_name || scSource.entityName || resolvedEntityName)
            : resolvedEntityName;

        const fund_cluster = formatFundClusterDisplay(
            scSource.fund_cluster ||
            scSource.fundCluster ||
            payload.fund_cluster ||
            fallbackFormData?.fundCluster ||
            defaultFundCluster,
        );

        const item =
            scSource.item ||
            payload.item ||
            report?.itemName ||
            fallbackFormData?.itemName ||
            title;

        const stock_no =
            scSource.supplier_stock_no ||
            payload.supplier_stock_no ||
            scSource.stock_no ||
            payload.stock_no ||
            '-';

        const supplier_stock_no = scSource.supplier_stock_no || payload.supplier_stock_no || (stock_no !== '-' ? stock_no : null);
        const item_no = scSource.item_no || payload.item_no || null;

        const description =
            scSource.description ||
            payload.description ||
            item;

        const re_order_point =
            scSource.re_order_point ||
            payload.re_order_point ||
            '-';

        const unit_of_measurement =
            scSource.unit_of_measurement ||
            payload.unit_of_measurement ||
            'Pieces';

        return {
            type: 'STOCK_CARD',
            reference,
            generatedDate: formattedDate,
            title,
            stockCardData: {
                entity_name,
                fund_cluster,
                item,
                stock_no,
                supplier_stock_no,
                item_no,
                description,
                re_order_point,
                unit_of_measurement,
                entries: Array.isArray(entries) ? entries : [],
            },
        };
    }

    // 4. Memorandum Receipt (MR / MOR) Normalization
    if (type === 'MR' || (type as string) === 'MOR') {
        const mrSource =
            dataset?.mr ||
            snapshot?.mr ||
            payload?.mr ||
            (payload?.items ? payload : null) ||
            (snapshot?.items ? snapshot : null) ||
            {};

        const rawMrItems =
            mrSource.items ||
            payload.items ||
            snapshot.items ||
            [];

        const items = (Array.isArray(rawMrItems) ? rawMrItems : []).map((item: any) => {
            if (!item || typeof item !== 'object') return item;
            const officialPropNo =
                item.serial_no ||
                item.serial_number ||
                item.property_number ||
                item.propertyNo ||
                item.supplier_stock_no ||
                item.stock_no ||
                '-';
            const supplierStockNo = item.supplier_stock_no || item.stock_no || (officialPropNo !== '-' ? officialPropNo : null);

            return {
                ...item,
                propertyNo: officialPropNo,
                stock_no: supplierStockNo || '-',
                supplier_stock_no: supplierStockNo,
                item_no: item.item_no || item.sku || null,
            };
        });

        const entityName = isSavedReport
            ? (savedEntityName || mrSource.entityName || mrSource.entity_name || resolvedEntityName)
            : resolvedEntityName;

        const fundCluster = formatFundClusterDisplay(
            mrSource.fundCluster ||
            mrSource.fund_cluster ||
            payload.fundCluster ||
            fallbackFormData?.fundCluster ||
            defaultFundCluster,
        );

        const receivedByName =
            report?.endUser ||
            fallbackFormData?.endUser ||
            mrSource.receivedByName ||
            payload.receivedByName ||
            'Accountable Officer';

        const receivedByPosition =
            mrSource.receivedByPosition ||
            payload.receivedByPosition ||
            'Recipient';

        const receivedByOffice =
            mrSource.receivedByOffice ||
            payload.receivedByOffice ||
            payload.purpose ||
            'Official Business';

        const grandTotal =
            mrSource.grandTotal ||
            payload.grandTotal ||
            0;

        const appendixNumber =
            publicSettings['compliance_mor_appendix_number'] ||
            publicSettings['compliance.mor_appendix_number'] ||
            payload.appendixNumber ||
            snapshot?.appendixNumber ||
            'Appendix 59-A';

        const issuedByName =
            publicSettings['signatories_mor_issued_by_name'] ||
            publicSettings['signatories.mor_issued_by_name'] ||
            mrSource.issuedByName ||
            payload.issuedByName ||
            user?.name ||
            'ARSENIO GEM A. GARCILLANOSA';

        const issuedByPosition =
            publicSettings['signatories_mor_issued_by_designation'] ||
            publicSettings['signatories.mor_issued_by_designation'] ||
            mrSource.issuedByPosition ||
            payload.issuedByPosition ||
            'SUPPLY OFFICER III / PROPERTY CUSTODIAN';

        const issuedByOffice =
            publicSettings['signatories_mor_issued_by_office'] ||
            publicSettings['signatories.mor_issued_by_office'] ||
            publicSettings['institution_custodial_office'] ||
            mrSource.issuedByOffice ||
            payload.issuedByOffice ||
            'Supply & Property Management Office (SPMO)';

        return {
            type: 'MR',
            reference,
            generatedDate: formattedDate,
            title,
            mrData: {
                entityName,
                fundCluster,
                mrNo: reference,
                date: formattedDate,
                purpose: receivedByOffice,
                items: Array.isArray(items) ? items : [],
                receivedByName,
                receivedByPosition,
                receivedByOffice,
                receivedByDate: formattedDate,
                issuedByName,
                issuedByPosition,
                issuedByOffice,
                issuedByDate: formattedDate,
                grandTotal,
                appendixNumber,
            },
        };
    }

    return null;
}
