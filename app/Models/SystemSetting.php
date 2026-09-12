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
     * Clear all cached settings.
     */
    public static function clearSettingCache(?string $key = null): void
    {
        if ($key) {
            Cache::forget(self::CACHE_KEY_PREFIX . $key);
        }
        Cache::forget(self::PUBLIC_CACHE_KEY);
        Cache::forget(self::ALL_CACHE_KEY);
    }

    /**
     * Get a setting value with caching and fallback.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        // Support alias: entity_name -> institution.name
        $lookupKey = ($key === 'entity_name' || $key === 'entity.name') ? 'institution.name' : $key;

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
        $lookupKey = ($key === 'entity_name' || $key === 'entity.name') ? 'institution.name' : $key;
        $setting = static::where('key', $lookupKey)->first();

        if ($setting) {
            $setting->update([
                'value' => json_encode($value),
            ]);
        }
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
            'integer' => is_numeric($decoded) ? (int) $decoded : (int) $default,
            'float' => is_numeric($decoded) ? (float) $decoded : (float) $default,
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

            // Provide centralized canonical aliases for Compliance forms
            if (isset($settings['institution_name'])) {
                $settings['entity_name'] = $settings['institution_name'];
            }
            if (isset($settings['institution_default_fund_cluster'])) {
                $settings['default_fund_cluster'] = $settings['institution_default_fund_cluster'];
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
