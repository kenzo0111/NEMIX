import { SettingItem, SystemSettings, RfidMode } from './types';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
    // 1. Institution & Branding
    'institution.name': 'University of Camarines Norte',
    'institution.acronym': 'UCN',
    'institution.custodial_office': 'Supply & Property Management Office (SPMO)',
    'institution.campus_address': 'Daet, Camarines Norte',
    'institution.responsibility_center_code': '01-101-00',
    'institution.logo_path': '/images/ucn-crest.png',

    // 2. Signatories
    'signatories.ris_approved_by_name': 'ARSENIO GEM A. GARCILLANOSA',
    'signatories.ris_approved_by_designation': 'SUPPLY OFFICER III / ADMIN OFFICER V',
    'signatories.ris_issued_by_name': 'Supply Custodian / Storekeeper',
    'signatories.ris_issued_by_designation': 'Administrative Aide VI / Storekeeper',
    'signatories.ris_oic_active': false,
    'signatories.ris_oic_prefix': 'OIC, ',

    'signatories.rsmi_certified_by_name': 'ARSENIO GEM A. GARCILLANOSA',
    'signatories.rsmi_certified_by_designation': 'Supply Officer III / SPMO Head',
    'signatories.rsmi_posted_by_name': 'Accounting Representative / Bookkeeper',
    'signatories.rsmi_posted_by_designation': 'Administrative Officer IV',

    'signatories.rpci_accountable_officer_name': 'Arsenio Gem A. Garcillanosa',
    'signatories.rpci_accountable_officer_designation': 'Supply Custodian / Supply Officer III',
    'signatories.rpci_committee_chair': 'Inspection Committee Chairman',

    'signatories.stock_card_custodian': 'Storekeeper / Property Custodian',

    // 3. Inventory & Stock Rules
    'inventory.low_stock_threshold': 10,
    'inventory.critical_stock_threshold': 3,
    'inventory.strict_stock_enforcement': true,
    'inventory.units_of_issue': [
        'piece',
        'box',
        'ream',
        'pack',
        'roll',
        'bottle',
        'gallon',
        'liter',
        'tube',
        'pad',
        'set',
    ],

    // 4. Document Sequences
    'numbering.ris_prefix': 'RIS-',
    'numbering.rsmi_prefix': 'RSMI-',
    'numbering.rpci_prefix': 'RPCI-',
    'numbering.stock_card_prefix': 'STOCK-',

    // 5. RFID & Storage
    'rfid.scan_debounce_ms': 1200,
    'rfid.active_mode': 'bin_association',

    // 6. Notifications & Mail
    'mail.low_stock_email_alerts': true,
    'mail.alert_recipient_email': '',

    // 7. Security & Operations
    'security.session_timeout_minutes': 30,
};

/**
 * Normalizes backend grouped settings into a strongly-typed SystemSettings shape.
 */
export function normalizeSystemSettings(
    groupedSettings?: Record<string, SettingItem[]> | null
): SystemSettings {
    const normalized: SystemSettings = { ...DEFAULT_SYSTEM_SETTINGS };

    if (!groupedSettings || typeof groupedSettings !== 'object') {
        return normalized;
    }

    const flatValues: Record<string, unknown> = {};

    Object.values(groupedSettings).forEach((categoryItems) => {
        if (Array.isArray(categoryItems)) {
            categoryItems.forEach((item) => {
                if (item && item.key) {
                    flatValues[item.key] = item.value;
                }
            });
        }
    });

    // Helper to safely assign string
    const assignString = (key: keyof SystemSettings) => {
        if (typeof flatValues[key] === 'string') {
            (normalized[key] as string) = flatValues[key] as string;
        }
    };

    // Helper to safely assign number
    const assignNumber = (key: keyof SystemSettings, min: number, max: number) => {
        const val = Number(flatValues[key]);
        if (!isNaN(val) && val >= min && val <= max) {
            (normalized[key] as number) = Math.round(val);
        }
    };

    // Helper to safely assign boolean
    const assignBool = (key: keyof SystemSettings) => {
        if (key in flatValues) {
            const raw = flatValues[key];
            (normalized[key] as boolean) =
                raw === true || raw === 1 || raw === '1' || raw === 'true';
        }
    };

    // Institution
    assignString('institution.name');
    assignString('institution.acronym');
    assignString('institution.custodial_office');
    assignString('institution.campus_address');
    assignString('institution.responsibility_center_code');
    assignString('institution.logo_path');

    // Signatories
    assignString('signatories.ris_approved_by_name');
    assignString('signatories.ris_approved_by_designation');
    assignString('signatories.ris_issued_by_name');
    assignString('signatories.ris_issued_by_designation');
    assignBool('signatories.ris_oic_active');
    assignString('signatories.ris_oic_prefix');
    assignString('signatories.rsmi_certified_by_name');
    assignString('signatories.rsmi_certified_by_designation');
    assignString('signatories.rsmi_posted_by_name');
    assignString('signatories.rsmi_posted_by_designation');
    assignString('signatories.rpci_accountable_officer_name');
    assignString('signatories.rpci_accountable_officer_designation');
    assignString('signatories.rpci_committee_chair');
    assignString('signatories.stock_card_custodian');

    // Inventory
    assignNumber('inventory.low_stock_threshold', 1, 1000);
    assignNumber('inventory.critical_stock_threshold', 0, 1000);
    assignBool('inventory.strict_stock_enforcement');

    if (Array.isArray(flatValues['inventory.units_of_issue'])) {
        normalized['inventory.units_of_issue'] = flatValues[
            'inventory.units_of_issue'
        ] as string[];
    }

    // Numbering
    assignString('numbering.ris_prefix');
    assignString('numbering.rsmi_prefix');
    assignString('numbering.rpci_prefix');
    assignString('numbering.stock_card_prefix');

    // RFID
    assignNumber('rfid.scan_debounce_ms', 300, 10000);
    if (
        flatValues['rfid.active_mode'] === 'bin_association' ||
        flatValues['rfid.active_mode'] === 'issuance_verification' ||
        flatValues['rfid.active_mode'] === 'rpci_stocktake'
    ) {
        normalized['rfid.active_mode'] = flatValues['rfid.active_mode'] as RfidMode;
    }

    // Mail
    assignBool('mail.low_stock_email_alerts');
    assignString('mail.alert_recipient_email');

    // Security
    assignNumber('security.session_timeout_minutes', 5, 480);

    return normalized;
}
