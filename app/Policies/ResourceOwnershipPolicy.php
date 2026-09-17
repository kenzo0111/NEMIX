<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class ResourceOwnershipPolicy
{
    /**
     * Determine whether the user owns the resource or is a System Admin.
     */
    public static function canManage(?User $user, Model $model, string $ownerColumn = 'created_by'): bool
    {
        if (! $user) {
            return false;
        }

        // System Admin and operational Property Staff bypass ownership restrictions for institutional assets
        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['System Admin', 'System Administrator', 'Property Staff'])) {
            return true;
        }

        $ownerId = $model->getAttribute($ownerColumn);

        // Ownerless legacy records require an administrator.
        if ($ownerId === null) {
            return false;
        }

        return (int) $ownerId === (int) $user->id;
    }

    /**
     * Authorize user or abort with 403 Forbidden exception.
     */
    public static function authorize(?User $user, Model $model, string $ownerColumn = 'created_by'): void
    {
        if (! self::canManage($user, $model, $ownerColumn)) {
            abort(403, 'Unauthorized action. You do not own this resource.');
        }
    }

    /**
     * Scope Eloquent query to only include records owned by the user (unless System Admin or Property Staff).
     */
    public static function scopeQuery($query, ?User $user, string $ownerColumn = 'created_by')
    {
        if (! $user) {
            return $query->whereRaw('1 = 0');
        }

        if (method_exists($user, 'hasAnyRole') && $user->hasAnyRole(['System Admin', 'System Administrator', 'Property Staff'])) {
            return $query;
        }

        if (method_exists($user, 'can') && ($user->can('inventory.index') || $user->can('route:inventory.index') || $user->can('suppliers.index') || $user->can('route:suppliers.index'))) {
            return $query;
        }

        return $query->where($ownerColumn, $user->id);
    }
}
