<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SystemSetting extends Model
{
    use HasFactory;

    protected $table = 'system_settings';

    protected $fillable = [
        'category',
        'key',
        'value',
        'data_type',
        'label',
        'description',
        'is_public',
        'is_encrypted',
    ];

    protected $casts = [
        'is_public' => 'boolean',
        'is_encrypted' => 'boolean',
    ];

    public const CACHE_KEY_PREFIX = 'system_setting_';
    public const PUBLIC_CACHE_KEY = 'system_settings_public';
    public const ALL_CACHE_KEY = 'system_settings_all_grouped';

    protected static function booted(): void
    {
        static::saved(function (SystemSetting $setting) {
            static::clearSettingCache($setting->key);
        });

        static::deleted(function (SystemSetting $setting) {
            static::clearSettingCache($setting->key);
        });
    }

    /**
     * Map canonical aliases to their underlying database keys.
     */
    public static function getCanonicalKey(string $key): string
    {
        return match ($key) {
            'entity_name', 'entity.name' => 'institution.name',
            'issued_by_name', 'issued_by' => 'signatories.ris_issued_by_name',
            'issued_by_position', 'issued_by_designation' => 'signatories.ris_issued_by_designation',
            'approved_by_name', 'approved_by' => 'signatories.ris_approved_by_name',
            'approved_by_position', 'approved_by_designation' => 'signatories.ris_approved_by_designation',
            // RSMI Aliases
            'signatories.rsmi_custodian_name', 'rsmi_custodian_name' => 'signatories.rsmi_certified_by_name',
            'signatories.rsmi_custodian_designation', 'rsmi_custodian_designation' => 'signatories.rsmi_certified_by_designation',
            'signatories.rsmi_accounting_name', 'rsmi_accounting_name' => 'signatories.rsmi_posted_by_name',
            'signatories.rsmi_accounting_designation', 'rsmi_accounting_designation' => 'signatories.rsmi_posted_by_designation',
            // MOR / MR Aliases
            'signatories.mr_issued_by_name', 'mr_issued_by_name' => 'signatories.mor_issued_by_name',
            'signatories.mr_issued_by_position', 'mr_issued_by_position', 'mr_issued_by_designation' => 'signatories.mor_issued_by_designation',
            'signatories.mr_issued_by_office', 'mr_issued_by_office' => 'signatories.mor_issued_by_office',
            default => $key,
        };
    }

    /**
     * Return all known aliases that resolve to a given canonical database key.
     */
    public static function getAliasesForKey(string $key): array
    {
        $map = [
            'institution.name' => ['entity_name', 'entity.name'],
            'signatories.ris_issued_by_name' => ['issued_by_name', 'issued_by'],
            'signatories.ris_issued_by_designation' => ['issued_by_position', 'issued_by_designation'],
            'signatories.ris_approved_by_name' => ['approved_by_name', 'approved_by'],
            'signatories.ris_approved_by_designation' => ['approved_by_position', 'approved_by_designation'],
            'signatories.rsmi_certified_by_name' => ['signatories.rsmi_custodian_name', 'rsmi_custodian_name'],
            'signatories.rsmi_certified_by_designation' => ['signatories.rsmi_custodian_designation', 'rsmi_custodian_designation'],
            'signatories.rsmi_posted_by_name' => ['signatories.rsmi_accounting_name', 'rsmi_accounting_name'],
            'signatories.rsmi_posted_by_designation' => ['signatories.rsmi_accounting_designation', 'rsmi_accounting_designation'],
            'signatories.mor_issued_by_name' => ['signatories.mr_issued_by_name', 'mr_issued_by_name'],
            'signatories.mor_issued_by_designation' => ['signatories.mr_issued_by_position', 'mr_issued_by_position', 'mr_issued_by_designation'],
            'signatories.mor_issued_by_office' => ['signatories.mr_issued_by_office', 'mr_issued_by_office'],
        ];

        return $map[$key] ?? [];
    }

    /**
     * Clear all cached settings.
     */
    public static function clearSettingCache(?string $key = null): void
    {
        if ($key) {
            $lookupKey = static::getCanonicalKey($key);
            Cache::forget(self::CACHE_KEY_PREFIX . $key);
            Cache::forget(self::CACHE_KEY_PREFIX . $lookupKey);
            foreach (static::getAliasesForKey($lookupKey) as $alias) {
                Cache::forget(self::CACHE_KEY_PREFIX . $alias);
            }
        } else {
            try {
                $allKeys = static::pluck('key');
                foreach ($allKeys as $k) {
                    Cache::forget(self::CACHE_KEY_PREFIX . $k);
                    foreach (static::getAliasesForKey($k) as $alias) {
                        Cache::forget(self::CACHE_KEY_PREFIX . $alias);
                    }
                }
            } catch (\Throwable $e) {
                // Ignore DB error during early boot/migrations
            }
        }
        Cache::forget(self::PUBLIC_CACHE_KEY);
        Cache::forget(self::ALL_CACHE_KEY);
    }

    /**
     * Get a setting value with caching and fallback.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $lookupKey = static::getCanonicalKey($key);

        return Cache::remember(self::CACHE_KEY_PREFIX . $lookupKey, 86400, function () use ($lookupKey, $default) {
            $setting = static::where('key', $lookupKey)->first();

            if (! $setting) {
                return $default;
            }

            return static::castValue($setting->value, $setting->data_type, $default);
        });
    }

    /**
     * Set/update a setting value.
     */
    public static function set(string $key, mixed $value): void
    {
        $lookupKey = static::getCanonicalKey($key);
        $setting = static::where('key', $lookupKey)->first();

        if ($setting) {
            $setting->update([
                'value' => json_encode($value),
            ]);
        } else {
            $category = explode('.', $lookupKey)[0] ?? 'general';
            $dataType = is_int($value) ? 'integer' : (is_bool($value) ? 'boolean' : (is_array($value) ? 'json' : 'string'));
            $label = ucwords(str_replace(['.', '_'], ' ', $lookupKey));
            static::create([
                'category' => $category,
                'key' => $lookupKey,
                'value' => json_encode($value),
                'data_type' => $dataType,
                'label' => $label,
                'description' => $label,
                'is_public' => true,
                'is_encrypted' => false,
            ]);
        }
        static::clearSettingCache($lookupKey);
    }

    /**
     * Cast raw JSON/value based on data_type.
     */
    public static function castValue(mixed $rawJson, string $dataType, mixed $default = null): mixed
    {
        if (is_null($rawJson)) {
            return $default;
        }

        $decoded = is_string($rawJson) ? json_decode($rawJson, true) : $rawJson;

        return match ($dataType) {
            'integer' => is_numeric($decoded) ? (int) $decoded : (is_null($decoded) ? null : (is_null($default) ? null : (int) $default)),
            'float' => is_numeric($decoded) ? (float) $decoded : (is_null($decoded) ? null : (is_null($default) ? null : (float) $default)),
            'boolean' => filter_var($decoded, FILTER_VALIDATE_BOOLEAN),
            'json', 'array' => is_array($decoded) ? $decoded : (is_array($default) ? $default : []),
            default => is_string($decoded) ? $decoded : (string) ($decoded ?? $default),
        };
    }

    /**
     * Get all public settings as a key-value dictionary for frontend sharing.
     */
    public static function getPublicSettings(): array
    {
        return Cache::remember(self::PUBLIC_CACHE_KEY, 86400, function () {
            $settings = static::where('is_public', true)
                ->get()
                ->mapWithKeys(function (SystemSetting $setting) {
                    $cleanKey = str_replace(['.', '-'], '_', $setting->key);
                    return [$cleanKey => static::castValue($setting->value, $setting->data_type)];
                })
                ->toArray();

            // Provide centralized canonical aliases for Compliance and Inventory Issuance
            if (isset($settings['institution_name'])) {
                $settings['entity_name'] = $settings['institution_name'];
            }
            if (isset($settings['institution_default_fund_cluster'])) {
                $settings['default_fund_cluster'] = $settings['institution_default_fund_cluster'];
            }
            if (isset($settings['signatories_ris_issued_by_name'])) {
                $settings['issued_by_name'] = $settings['signatories_ris_issued_by_name'];
                $settings['issued_by'] = $settings['signatories_ris_issued_by_name'];
            }
            if (isset($settings['signatories_ris_issued_by_designation'])) {
                $settings['issued_by_position'] = $settings['signatories_ris_issued_by_designation'];
                $settings['issued_by_designation'] = $settings['signatories_ris_issued_by_designation'];
            }
            if (isset($settings['signatories_ris_approved_by_name'])) {
                $settings['approved_by_name'] = $settings['signatories_ris_approved_by_name'];
                $settings['approved_by'] = $settings['signatories_ris_approved_by_name'];
            }
            if (isset($settings['signatories_ris_approved_by_designation'])) {
                $settings['approved_by_position'] = $settings['signatories_ris_approved_by_designation'];
                $settings['approved_by_designation'] = $settings['signatories_ris_approved_by_designation'];
            }

            // RPCI Signatories Aliases
            if (isset($settings['signatories_rpci_accountable_officer_name'])) {
                $settings['rpci_accountable_officer_name'] = $settings['signatories_rpci_accountable_officer_name'];
            }
            if (isset($settings['signatories_rpci_accountable_officer_designation'])) {
                $settings['rpci_accountable_officer_designation'] = $settings['signatories_rpci_accountable_officer_designation'];
            }
            if (isset($settings['signatories_rpci_committee_chair'])) {
                $settings['rpci_committee_chair'] = $settings['signatories_rpci_committee_chair'];
            }
            if (isset($settings['signatories_rpci_certified_by_name'])) {
                $settings['rpci_certified_by_name'] = $settings['signatories_rpci_certified_by_name'];
            }
            if (isset($settings['signatories_rpci_certified_by_position'])) {
                $settings['rpci_certified_by_position'] = $settings['signatories_rpci_certified_by_position'];
            }
            if (isset($settings['signatories_rpci_verified_by_name'])) {
                $settings['rpci_verified_by_name'] = $settings['signatories_rpci_verified_by_name'];
            }
            if (isset($settings['signatories_rpci_verified_by_position'])) {
                $settings['rpci_verified_by_position'] = $settings['signatories_rpci_verified_by_position'];
            }

            // RSMI Signatories Aliases
            if (isset($settings['signatories_rsmi_certified_by_name'])) {
                $settings['rsmi_certified_by_name'] = $settings['signatories_rsmi_certified_by_name'];
                $settings['rsmi_custodian_name'] = $settings['signatories_rsmi_certified_by_name'];
            }
            if (isset($settings['signatories_rsmi_certified_by_designation'])) {
                $settings['rsmi_certified_by_designation'] = $settings['signatories_rsmi_certified_by_designation'];
                $settings['rsmi_custodian_designation'] = $settings['signatories_rsmi_certified_by_designation'];
            }
            if (isset($settings['signatories_rsmi_posted_by_name'])) {
                $settings['rsmi_posted_by_name'] = $settings['signatories_rsmi_posted_by_name'];
                $settings['rsmi_accounting_name'] = $settings['signatories_rsmi_posted_by_name'];
            }
            if (isset($settings['signatories_rsmi_posted_by_designation'])) {
                $settings['rsmi_posted_by_designation'] = $settings['signatories_rsmi_posted_by_designation'];
                $settings['rsmi_accounting_designation'] = $settings['signatories_rsmi_posted_by_designation'];
            }

            // Stock Card Custodian Alias
            if (isset($settings['signatories_stock_card_custodian'])) {
                $settings['stock_card_custodian'] = $settings['signatories_stock_card_custodian'];
            }

            // MOR / MR Signatories Aliases
            if (isset($settings['signatories_mor_issued_by_name'])) {
                $settings['mor_issued_by_name'] = $settings['signatories_mor_issued_by_name'];
                $settings['mr_issued_by_name'] = $settings['signatories_mor_issued_by_name'];
            }
            if (isset($settings['signatories_mor_issued_by_designation'])) {
                $settings['mor_issued_by_designation'] = $settings['signatories_mor_issued_by_designation'];
                $settings['mr_issued_by_position'] = $settings['signatories_mor_issued_by_designation'];
            }
            if (isset($settings['signatories_mor_issued_by_office'])) {
                $settings['mor_issued_by_office'] = $settings['signatories_mor_issued_by_office'];
                $settings['mr_issued_by_office'] = $settings['signatories_mor_issued_by_office'];
            }
            if (isset($settings['compliance_mor_appendix_number'])) {
                $settings['mor_appendix_number'] = $settings['compliance_mor_appendix_number'];
            }

            return $settings;
        });
    }

    /**
     * Get all settings grouped by category with metadata for the admin management UI.
     */
    public static function getAllGrouped(): array
    {
        return Cache::remember(self::ALL_CACHE_KEY, 86400, function () {
            $grouped = [];
            $settings = static::orderBy('category')->orderBy('id')->get();

            foreach ($settings as $s) {
                $grouped[$s->category][] = [
                    'id' => $s->id,
                    'key' => $s->key,
                    'category' => $s->category,
                    'label' => $s->label,
                    'description' => $s->description,
                    'data_type' => $s->data_type,
                    'is_public' => $s->is_public,
                    'value' => static::castValue($s->value, $s->data_type),
                ];
            }

            return $grouped;
        });
    }
}
