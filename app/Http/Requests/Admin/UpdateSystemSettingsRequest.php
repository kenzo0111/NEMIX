<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateSystemSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return (bool) ($user && (
            (method_exists($user, 'isSystemAdmin') && $user->isSystemAdmin()) ||
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator' ||
            ($user->can('system.settings.update'))
        ));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * Note: Settings are sent as a flat key-value dictionary where keys contain dots
     * (e.g. 'inventory.low_stock_threshold').
     */
    public function rules(): array
    {
        return [
            'settings' => ['required', 'array'],
            'settings.*' => ['nullable'],
        ];
    }

    /**
     * Configure the validator instance with granular domain validation for dotted setting keys.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $settings = (array) $this->input('settings', []);

            // 1. Institution strings
            $stringLimits = [
                'institution.name' => 255,
                'institution.acronym' => 50,
                'institution.custodial_office' => 255,
                'institution.campus_address' => 255,
                'institution.responsibility_center_code' => 100,
                'institution.logo_path' => 255,
                'signatories.ris_approved_by_name' => 255,
                'signatories.ris_approved_by_designation' => 255,
                'signatories.ris_issued_by_name' => 255,
                'signatories.ris_issued_by_designation' => 255,
                'signatories.ris_oic_prefix' => 50,
                'signatories.rsmi_certified_by_name' => 255,
                'signatories.rsmi_certified_by_designation' => 255,
                'signatories.rsmi_posted_by_name' => 255,
                'signatories.rsmi_posted_by_designation' => 255,
                'signatories.rpci_accountable_officer_name' => 255,
                'signatories.rpci_accountable_officer_designation' => 255,
                'signatories.rpci_committee_chair' => 255,
                'signatories.stock_card_custodian' => 255,
                'signatories.mor_issued_by_name' => 255,
                'signatories.mor_issued_by_designation' => 255,
                'signatories.mor_issued_by_office' => 255,
                'numbering.ris_prefix' => 30,
                'numbering.rsmi_prefix' => 30,
                'numbering.rpci_prefix' => 30,
                'numbering.stock_card_prefix' => 30,
                'numbering.mor_prefix' => 30,
                'institution.default_fund_cluster' => 100,
                'compliance.mor_appendix_number' => 50,
            ];

            foreach ($stringLimits as $key => $maxLen) {
                if (isset($settings[$key]) && is_string($settings[$key]) && mb_strlen($settings[$key]) > $maxLen) {
                    $v->errors()->add("settings.{$key}", "The {$key} cannot exceed {$maxLen} characters.");
                }
            }

            // 2. Inventory Thresholds & Ranges
            if (array_key_exists('inventory.low_stock_threshold', $settings)) {
                $val = $settings['inventory.low_stock_threshold'];
                if (! is_numeric($val) || (int) $val < 1 || (int) $val > 1000) {
                    $v->errors()->add('settings.inventory.low_stock_threshold', 'The low-stock threshold must be between 1 and 1000.');
                }
            }

            if (array_key_exists('inventory.critical_stock_threshold', $settings)) {
                $val = $settings['inventory.critical_stock_threshold'];
                if (! is_numeric($val) || (int) $val < 0 || (int) $val > 1000) {
                    $v->errors()->add('settings.inventory.critical_stock_threshold', 'The critical stock threshold must be between 0 and 1000.');
                }
            }

            // Cross-validation: critical_stock_threshold <= low_stock_threshold
            $critical = array_key_exists('inventory.critical_stock_threshold', $settings)
                ? (int) $settings['inventory.critical_stock_threshold']
                : (int) \App\Models\SystemSetting::get('inventory.critical_stock_threshold', 3);

            $lowStock = array_key_exists('inventory.low_stock_threshold', $settings)
                ? (int) $settings['inventory.low_stock_threshold']
                : (int) \App\Models\SystemSetting::get('inventory.low_stock_threshold', 10);

            if (
                (array_key_exists('inventory.critical_stock_threshold', $settings) || array_key_exists('inventory.low_stock_threshold', $settings)) &&
                $critical > $lowStock
            ) {
                $v->errors()->add(
                    'settings.inventory.critical_stock_threshold',
                    'Critical stock threshold cannot exceed the low-stock threshold.'
                );
            }

            // 3. Units of Issue
            if (array_key_exists('inventory.units_of_issue', $settings)) {
                $units = $settings['inventory.units_of_issue'];
                if (! is_array($units)) {
                    $v->errors()->add('settings.inventory.units_of_issue', 'Units of issue must be a list of unit names.');
                }
            }

            // 4. RFID debounce & mode
            if (array_key_exists('rfid.scan_debounce_ms', $settings)) {
                $debounce = $settings['rfid.scan_debounce_ms'];
                if (! is_numeric($debounce) || (int) $debounce < 300 || (int) $debounce > 10000) {
                    $v->errors()->add('settings.rfid.scan_debounce_ms', 'RFID scan delay must be between 300ms and 10,000ms.');
                }
            }

            if (array_key_exists('rfid.active_mode', $settings)) {
                $mode = (string) $settings['rfid.active_mode'];
                $allowedModes = ['bin_association', 'issuance_verification', 'rpci_stocktake'];
                if (! in_array($mode, $allowedModes, true)) {
                    $v->errors()->add('settings.rfid.active_mode', 'Invalid RFID operational mode.');
                }
            }

            // 5. Session timeout
            if (array_key_exists('security.session_timeout_minutes', $settings)) {
                $timeout = $settings['security.session_timeout_minutes'];
                if (! is_numeric($timeout) || (int) $timeout < 5 || (int) $timeout > 480) {
                    $v->errors()->add('settings.security.session_timeout_minutes', 'Session timeout must be between 5 and 480 minutes.');
                }
            }

            // 6. Email validation if alert recipient provided
            if (! empty($settings['mail.alert_recipient_email'])) {
                $email = trim((string) $settings['mail.alert_recipient_email']);
                if (! filter_var($email, FILTER_VALIDATE_EMAIL)) {
                    $v->errors()->add(
                        'settings.mail.alert_recipient_email',
                        'The alert recipient email must be a valid email address.'
                    );
                }
            }
        });
    }

    /**
     * Retrieve the validated settings array.
     */
    public function settingsData(): array
    {
        return (array) $this->input('settings', []);
    }
}
