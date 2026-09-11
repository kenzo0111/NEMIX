import { PageProps, User } from '@/types';

export type RfidMode = 'bin_association' | 'issuance_verification' | 'rpci_stocktake';

export interface SystemSettings {
    // 1. Institution & Branding
    'institution.name': string;
    'institution.acronym': string;
    'institution.custodial_office': string;
    'institution.campus_address': string;
    'institution.responsibility_center_code': string;
    'institution.logo_path': string;

    // 2. Signatories
    'signatories.ris_approved_by_name': string;
    'signatories.ris_approved_by_designation': string;
    'signatories.ris_issued_by_name': string;
    'signatories.ris_issued_by_designation': string;
    'signatories.ris_oic_active': boolean;
    'signatories.ris_oic_prefix': string;

    'signatories.rsmi_certified_by_name': string;
    'signatories.rsmi_certified_by_designation': string;
    'signatories.rsmi_posted_by_name': string;
    'signatories.rsmi_posted_by_designation': string;

    'signatories.rpci_accountable_officer_name': string;
    'signatories.rpci_accountable_officer_designation': string;
    'signatories.rpci_committee_chair': string;

    'signatories.stock_card_custodian': string;

    // 3. Inventory & Stock Rules
    'inventory.low_stock_threshold': number;
    'inventory.critical_stock_threshold': number;
    'inventory.strict_stock_enforcement': boolean;
    'inventory.units_of_issue': string[];

    // 4. Document Sequences
    'numbering.ris_prefix': string;
    'numbering.rsmi_prefix': string;
    'numbering.rpci_prefix': string;
    'numbering.stock_card_prefix': string;

    // 5. RFID & Storage
    'rfid.scan_debounce_ms': number;
    'rfid.active_mode': RfidMode;

    // 6. Notifications & Mail
    'mail.low_stock_email_alerts': boolean;
    'mail.alert_recipient_email': string;

    // 7. Security & Operations
    'security.session_timeout_minutes': number;
}

export type SettingValue =
    | string
    | number
    | boolean
    | string[]
    | Record<string, number>
    | Record<string, unknown>
    | null;

export interface SettingItem {
    id: number;
    key: string;
    category: string;
    label: string;
    description: string;
    data_type: 'string' | 'integer' | 'boolean' | 'json';
    is_public: boolean;
    value: SettingValue;
}

export interface TelemetryData {
    php_version: string | null;
    laravel_version: string | null;
    database_driver: string | null;
    system_mode: string | null;
    server_node: string | null;
    environment: string | null;
    cached_at: string | null;
}

export type SystemSettingsPageProps = PageProps<{
    groupedSettings: Record<string, SettingItem[]>;
    telemetry: TelemetryData | null;
}>;

export type TabId =
    | 'institution'
    | 'signatories'
    | 'inventory'
    | 'numbering'
    | 'rfid'
    | 'mail'
    | 'operations';

export interface TabMeta {
    id: TabId;
    num: string;
    label: string;
    shortLabel: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
}

export interface ToastAlert {
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
}
