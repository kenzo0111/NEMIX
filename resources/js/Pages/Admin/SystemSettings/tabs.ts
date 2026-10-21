import {
    Building2,
    PenTool,
    PackageSearch,
    Hash,
    Radio,
    Mail,
    ShieldCheck,
} from 'lucide-react';
import { TabMeta } from './types';

export const SETTINGS_TABS: TabMeta[] = [
    {
        id: 'institution',
        num: '01',
        label: 'Institution & Branding',
        shortLabel: 'Institution',
        description: 'Set institution details, custodial office, and letterhead branding.',
        icon: Building2,
    },
    {
        id: 'signatories',
        num: '02',
        label: 'Consumable Signatories',
        shortLabel: 'Signatories',
        description: 'Choose approving, issuing, and accounting officers for official forms.',
        icon: PenTool,
    },
    {
        id: 'inventory',
        num: '03',
        label: 'Stock & Reorder Rules',
        shortLabel: 'Inventory Rules',
        description: 'Set stock thresholds, issuance rules, and units of issue.',
        icon: PackageSearch,
    },
    {
        id: 'numbering',
        num: '04',
        label: 'Document Sequences',
        shortLabel: 'Numbering',
        description: 'Year-first document numbers are generated and reserved by the system.',
        icon: Hash,
    },
    {
        id: 'rfid',
        num: '05',
        label: 'RFID & Bin Storage',
        shortLabel: 'RFID',
        description: 'Set scan delays and operating modes for RFID readers.',
        icon: Radio,
    },
    {
        id: 'mail',
        num: '06',
        label: 'Email & Notifications',
        shortLabel: 'Notifications',
        description: 'Configure low-stock alerts and test email delivery.',
        icon: Mail,
    },
    {
        id: 'operations',
        num: '07',
        label: 'Operations & Telemetry',
        shortLabel: 'Operations',
        description: 'Manage session security, policy backups, and system diagnostics.',
        icon: ShieldCheck,
    },
];
