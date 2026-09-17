<?php

namespace App\Services;

use App\Models\SystemSetting;

class SystemSettingsService
{
    /**
     * Get a setting value by key, or all public settings dictionary.
     */
    public function get(?string $key = null, mixed $default = null): mixed
    {
        if ($key !== null) {
            return SystemSetting::get($key, $default);
        }

        return SystemSetting::getPublicSettings();
    }

    /**
     * Get canonical issuance signatories from system settings with fallbacks.
     */
    public function getIssuanceSignatories(): array
    {
        $approvedByName = (string) (SystemSetting::get('signatories.ris_approved_by_name') ?: 'ARSENIO GEM A. GARCILLANOSA');
        $approvedByDesignation = (string) (SystemSetting::get('signatories.ris_approved_by_designation') ?: 'SUPPLY OFFICER III/ADMIN OFFICER V');
        $issuedByName = (string) (SystemSetting::get('signatories.ris_issued_by_name') ?: 'Supply Custodian / Storekeeper');
        $issuedByPosition = (string) (SystemSetting::get('signatories.ris_issued_by_designation') ?: 'Administrative Aide VI / Storekeeper');

        return [
            'approved_by_name' => $approvedByName,
            'approved_by_designation' => $approvedByDesignation,
            'issued_by_name' => $issuedByName,
            'issued_by_position' => $issuedByPosition,
        ];
    }

    /**
     * Get authoritative signatories for any compliance form from system settings.
     */
    public function getSignatoriesForForm(string $formType): array
    {
        $normalizedType = strtoupper(trim($formType));

        return match ($normalizedType) {
            'RSMI' => [
                'supplyCustodianName' => (string) (SystemSetting::get('signatories.rsmi_certified_by_name') ?: 'Supply Custodian'),
                'supplyCustodianDesignation' => (string) (SystemSetting::get('signatories.rsmi_certified_by_designation') ?: 'Supply Custodian'),
                'accountingStaffName' => (string) (SystemSetting::get('signatories.rsmi_posted_by_name') ?: 'Accounting Staff'),
                'accountingStaffDesignation' => (string) (SystemSetting::get('signatories.rsmi_posted_by_designation') ?: 'Accounting Staff'),
                'supply_custodian_name' => (string) (SystemSetting::get('signatories.rsmi_certified_by_name') ?: 'Supply Custodian'),
                'supply_custodian_designation' => (string) (SystemSetting::get('signatories.rsmi_certified_by_designation') ?: 'Supply Custodian'),
                'accounting_staff_name' => (string) (SystemSetting::get('signatories.rsmi_posted_by_name') ?: 'Accounting Staff'),
                'accounting_staff_designation' => (string) (SystemSetting::get('signatories.rsmi_posted_by_designation') ?: 'Accounting Staff'),
            ],
            'RPCI' => [
                'accountable_officer' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_name') ?: ''),
                'designation' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_designation') ?: 'Supply Custodian / Supply Officer III'),
                'accountable_officer_name' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_name') ?: ''),
                'accountable_officer_designation' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_designation') ?: 'Supply Custodian / Supply Officer III'),
                'committee_chair' => (string) (SystemSetting::get('signatories.rpci_committee_chair') ?: ''),
                'certified_by_name' => (string) (SystemSetting::get('signatories.rpci_certified_by_name') ?: SystemSetting::get('signatories.rpci_committee_chair') ?: ''),
                'certified_by_position' => (string) (SystemSetting::get('signatories.rpci_certified_by_position') ?: 'Inventory Committee Chair and Members'),
                'approved_by_name' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_name') ?: ''),
                'approved_by_position' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_designation') ?: 'Supply Custodian / Supply Officer III'),
                'verified_by_name' => (string) (SystemSetting::get('signatories.rpci_verified_by_name') ?: ''),
                'verified_by_position' => (string) (SystemSetting::get('signatories.rpci_verified_by_position') ?: 'COA Representative'),
                'signatories' => [
                    'certified_by' => [
                        'name' => (string) (SystemSetting::get('signatories.rpci_certified_by_name') ?: SystemSetting::get('signatories.rpci_committee_chair') ?: ''),
                        'position' => (string) (SystemSetting::get('signatories.rpci_certified_by_position') ?: 'Inventory Committee Chair and Members'),
                    ],
                    'approved_by' => [
                        'name' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_name') ?: ''),
                        'position' => (string) (SystemSetting::get('signatories.rpci_accountable_officer_designation') ?: 'Supply Custodian / Supply Officer III'),
                    ],
                    'verified_by' => [
                        'name' => (string) (SystemSetting::get('signatories.rpci_verified_by_name') ?: ''),
                        'position' => (string) (SystemSetting::get('signatories.rpci_verified_by_position') ?: 'COA Representative'),
                    ],
                ],
            ],
            'STOCK_CARD', 'STOCKCARD' => [
                'custodian' => (string) (SystemSetting::get('signatories.stock_card_custodian') ?: ''),
                'custodian_name' => (string) (SystemSetting::get('signatories.stock_card_custodian') ?: ''),
            ],
            'MOR', 'MR', 'MEMORANDUM_RECEIPT', 'MEMORANDUM RECEIPT' => [
                'issuedByName' => (string) (SystemSetting::get('signatories.mor_issued_by_name') ?: 'ARSENIO GEM A. GARCILLANOSA'),
                'issuedByPosition' => (string) (SystemSetting::get('signatories.mor_issued_by_designation') ?: 'SUPPLY OFFICER III / PROPERTY CUSTODIAN'),
                'issuedByOffice' => (string) (SystemSetting::get('signatories.mor_issued_by_office') ?: 'Supply & Property Management Office (SPMO)'),
                'issued_by_name' => (string) (SystemSetting::get('signatories.mor_issued_by_name') ?: 'ARSENIO GEM A. GARCILLANOSA'),
                'issued_by_position' => (string) (SystemSetting::get('signatories.mor_issued_by_designation') ?: 'SUPPLY OFFICER III / PROPERTY CUSTODIAN'),
                'issued_by_office' => (string) (SystemSetting::get('signatories.mor_issued_by_office') ?: 'Supply & Property Management Office (SPMO)'),
                'appendixNumber' => (string) (SystemSetting::get('compliance.mor_appendix_number') ?: 'Appendix 59-A'),
                'appendix_number' => (string) (SystemSetting::get('compliance.mor_appendix_number') ?: 'Appendix 59-A'),
            ],
            'RIS' => [
                'approved_by_name' => (string) (SystemSetting::get('signatories.ris_approved_by_name') ?: 'ARSENIO GEM A. GARCILLANOSA'),
                'approved_by_designation' => (string) (SystemSetting::get('signatories.ris_approved_by_designation') ?: 'SUPPLY OFFICER III/ADMIN OFFICER V'),
                'issued_by_name' => (string) (SystemSetting::get('signatories.ris_issued_by_name') ?: 'Supply Custodian / Storekeeper'),
                'issued_by_position' => (string) (SystemSetting::get('signatories.ris_issued_by_designation') ?: 'Administrative Aide VI / Storekeeper'),
            ],
            default => [],
        };
    }
}
