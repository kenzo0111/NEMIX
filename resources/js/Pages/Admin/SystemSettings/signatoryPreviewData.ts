import type { RisData } from '../../../../Official Forms/RequisitionIssueSlip';
import type { RSMIFormProps } from '../../../../Official Forms/RSMI Report';
import type { RpciData } from '../../../../Official Forms/RPCI Report';
import type { MrData } from '../../../../Official Forms/MRForm';
import type { SystemSettings } from './types';

export function buildSignatoryPreviewData(settings: SystemSettings): {
    ris: RisData;
    rsmi: RSMIFormProps['data'];
    rpci: RpciData;
    mor: MrData;
} {
    const entityName = settings['institution.name'];
    const fundCluster = settings['institution.default_fund_cluster'];
    const custodialOffice = settings['institution.custodial_office'];
    const approvedByName = settings['signatories.ris_oic_active']
        ? `${settings['signatories.ris_oic_prefix'] || 'OIC, '}${settings['signatories.ris_approved_by_name']}`
        : settings['signatories.ris_approved_by_name'];

    return {
        ris: {
            entity_name: entityName,
            fund_cluster: fundCluster,
            division: 'Administrative Division',
            responsibility_center_code: settings['institution.responsibility_center_code'],
            office: custodialOffice,
            ris_no: 'RIS-PREVIEW',
            purpose: 'Live preview of the official form signatories.',
            items: [{
                stock_no: 'PREVIEW',
                unit: 'pc',
                description: 'Sample consumable supply item',
                quantity: 1,
                stock_available: true,
                issue_quantity: 1,
                remarks: 'Preview only',
            }],
            requested_by_name: 'REQUESTING PERSONNEL',
            requested_by_designation: 'Requesting Personnel',
            approved_by_name: approvedByName,
            approved_by_designation: settings['signatories.ris_approved_by_designation'],
            issued_by_name: settings['signatories.ris_issued_by_name'],
            issued_by_designation: settings['signatories.ris_issued_by_designation'],
            received_by_name: 'RECEIVING PERSONNEL',
            received_by_designation: 'Receiving Personnel',
        },
        rsmi: {
            entityName,
            fundCluster,
            serialNo: 'RSMI-PREVIEW',
            date: '',
            issuedItems: [{
                risNo: 'RIS-PREVIEW',
                responsibilityCenterCode: settings['institution.responsibility_center_code'],
                stockNo: 'PREVIEW',
                itemDescription: 'Sample consumable supply item',
                unit: 'pc',
                quantityIssued: 1,
                unitCost: 25,
                amount: 25,
            }],
            recapitulationItems: [{
                stockNo: 'PREVIEW',
                quantity: 1,
                unitCost: 25,
                totalCost: 25,
                uacsObjectCode: '',
            }],
            supplyCustodianName: settings['signatories.rsmi_certified_by_name'],
            accountingStaffName: settings['signatories.rsmi_posted_by_name'],
            accountingDate: '',
        },
        rpci: {
            entity_name: entityName,
            fund_cluster: fundCluster,
            inventory_type: 'Supplies and Materials',
            accountable_officer: settings['signatories.rpci_accountable_officer_name'],
            designation: settings['signatories.rpci_accountable_officer_designation'],
            certified_by_name: settings['signatories.rpci_certified_by_name'],
            approved_by_name: settings['signatories.rpci_accountable_officer_name'],
            approved_by_position: settings['signatories.rpci_accountable_officer_designation'],
            verified_by_name: settings['signatories.rpci_verified_by_name'],
            verified_by_position: settings['signatories.rpci_verified_by_position'],
            items: [{
                article: 'Sample supply',
                description: 'Sample consumable supply item',
                stock_no: 'PREVIEW',
                unit: 'pc',
                unit_value: 25,
                balance_per_card: 10,
                on_hand_count: 10,
                shortage_qty: 0,
                shortage_value: 0,
                remarks: 'Preview only',
            }],
        },
        mor: {
            appendixNumber: settings['compliance.mor_appendix_number'],
            entityName,
            fundCluster,
            mrNo: 'MOR-PREVIEW',
            items: [{
                quantity: 1,
                unit: 'unit',
                description: 'Sample office equipment',
                propertyNo: 'PROPERTY-PREVIEW',
                unitValue: 5000,
                totalValue: 5000,
            }],
            issuedByName: settings['signatories.mor_issued_by_name'],
            issuedByPosition: settings['signatories.mor_issued_by_designation'],
            issuedByOffice: custodialOffice,
            receivedByName: 'RECEIVING PERSONNEL',
            receivedByPosition: 'Receiving Personnel',
            receivedByOffice: 'Administrative Division',
        },
    };
}
