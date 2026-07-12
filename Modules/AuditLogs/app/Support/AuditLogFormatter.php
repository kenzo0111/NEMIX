<?php

namespace Modules\AuditLogs\Support;

use Illuminate\Support\Str;

class AuditLogFormatter
{
    /**
     * Fields that should not appear in audit descriptions.
     *
     * @var array<int, string>
     */
    protected static array $ignoredFields = [
        'created_at',
        'updated_at',
        'deleted_at',
        'remember_token',
        'password',
        'password_confirmation',
    ];

    /**
     * Convert a model or resource name into a readable label.
     */
    public static function humanizeResourceName(string $name): string
    {
        return Str::of(class_basename($name))
            ->replaceMatches('/([a-z])([A-Z])/', '$1 $2')
            ->replaceMatches('/[_-]+/', ' ')
            ->squish()
            ->title()
            ->toString();
    }

    /**
     * Convert an action into a direct verb.
     */
    public static function humanizeAction(string $action): string
    {
        return Str::of($action)->trim()->ucfirst()->toString();
    }

    /**
     * Format a list of changed fields for audit text.
     */
    public static function humanizeFields(array $fields): string
    {
        $labels = [];

        foreach ($fields as $field => $value) {
            $label = static::humanizeFieldName(is_string($field) ? $field : (string) $value);

            if ($label !== '') {
                $labels[] = $label;
            }
        }

        return implode(', ', array_values(array_unique($labels)));
    }

    /**
     * Convert a database field name into a readable label.
     */
    public static function humanizeFieldName(string $field): string
    {
        if (in_array($field, static::$ignoredFields, true)) {
            return '';
        }

        if ($field === 'is_active') {
            return 'Account Status';
        }

        return Str::of($field)
            ->replaceMatches('/([a-z])([A-Z])/', '$1 $2')
            ->replaceMatches('/[_-]+/', ' ')
            ->squish()
            ->title()
            ->toString();
    }

    /**
     * Build a readable transaction description.
     */
    public static function describe(string $action, string $resourceName, array $fields = []): string
    {
        $verb = static::humanizeAction($action);
        $resource = static::humanizeResourceName($resourceName);
        $details = trim($verb . ' ' . $resource);

        if (!empty($fields)) {
            $fieldList = static::humanizeFields($fields);

            if ($fieldList !== '') {
                $details .= ': ' . $fieldList;
            }
        }

        return $details;
    }
}