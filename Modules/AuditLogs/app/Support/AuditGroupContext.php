<?php

namespace Modules\AuditLogs\Support;

class AuditGroupContext
{
    /**
     * Active group stack for nested transactions.
     *
     * @var array<int, array{groupId: string, reference: ?string, module: ?string, parentKey: ?string}>
     */
    protected static array $stack = [];

    /**
     * Push a new audit group context.
     */
    public static function start(string $groupId, ?string $reference = null, ?string $module = null, ?string $parentKey = null): void
    {
        static::$stack[] = [
            'groupId' => $groupId,
            'reference' => $reference,
            'module' => $module,
            'parentKey' => $parentKey,
        ];
    }

    /**
     * Pop the current audit group context.
     */
    public static function stop(): void
    {
        array_pop(static::$stack);
    }

    /**
     * Execute a callback inside an active audit group context.
     */
    public static function runInGroup(string $groupId, callable $callback, ?string $reference = null, ?string $module = null, ?string $parentKey = null): mixed
    {
        static::start($groupId, $reference, $module, $parentKey);

        try {
            return $callback();
        } finally {
            static::stop();
        }
    }

    /**
     * Determine if an audit group context is currently active.
     */
    public static function hasActiveGroup(): bool
    {
        return !empty(static::$stack);
    }

    /**
     * Get the active audit group ID.
     */
    public static function getGroupId(): ?string
    {
        if (empty(static::$stack)) {
            return null;
        }

        $current = end(static::$stack);
        return $current['groupId'] ?? null;
    }

    /**
     * Get the active audit reference.
     */
    public static function getReference(): ?string
    {
        if (empty(static::$stack)) {
            return null;
        }

        $current = end(static::$stack);
        return $current['reference'] ?? null;
    }

    /**
     * Get the active audit module.
     */
    public static function getModule(): ?string
    {
        if (empty(static::$stack)) {
            return null;
        }

        $current = end(static::$stack);
        return $current['module'] ?? null;
    }

    /**
     * Get the active parent event key.
     */
    public static function getParentKey(): ?string
    {
        if (empty(static::$stack)) {
            return null;
        }

        $current = end(static::$stack);
        return $current['parentKey'] ?? null;
    }

    /**
     * Reset the audit group stack.
     */
    public static function reset(): void
    {
        static::$stack = [];
    }
}
