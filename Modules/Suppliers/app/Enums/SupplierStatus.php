<?php

namespace Modules\Suppliers\Enums;

enum SupplierStatus: string
{
    case Active = 'active';
    case Pending = 'pending';
    case Blacklisted = 'blacklisted';

    /**
     * Get all enum values as an array.
     *
     * @return string[]
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get the human-readable institutional label for the status.
     */
    public function label(): string
    {
        return match ($this) {
            self::Active => 'Active / Compliant',
            self::Pending => 'Pending Renewal',
            self::Blacklisted => 'Blacklisted',
        };
    }
}
