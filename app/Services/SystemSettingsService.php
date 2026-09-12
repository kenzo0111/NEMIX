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
}
