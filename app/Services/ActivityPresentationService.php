<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Str;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\AuditLogs\Support\AuditLogFormatter;

class ActivityPresentationService
{
    /**
     * Technical child actions that must be excluded from Dashboard top-level activity.
     */
    protected static array $excludedChildActions = [
        'Created Issuance Batch Allocation',
        'Allocated Inventory Batch',
        'Updated Inventory Batch',
        'Updated Inventory Balance',
        'Created Issuance Item',
        'Added Issuance Item',
        'inventory.issuance_batch_allocation.created',
        'inventory.issuance_item.created',
        'inventory.batch.created',
        'inventory.batch.updated',
    ];

    /**
     * Authentication and session actions that belong strictly to Login Audit.
     */
    protected static array $excludedAuthActions = [
        'User Login',
        'User Logout',
        'Failed Login Attempt',
        'Token Refreshed',
        'OTP Requested',
        'Session Created',
        'User Authentication',
        'auth.login',
        'auth.logout',
        'auth.failed',
        'auth.lockout',
        'auth.password_reset',
        'auth.refresh',
    ];

    /**
     * Query and normalize recent business-level activities for dashboard presentation.
     *
     * @param mixed $user
     * @param int $limit
     * @return array<int, array<string, mixed>>
     */
    public function getRecentDashboardActivities($user = null, int $limit = 6): array
    {
        if (!class_exists(TransactionTrail::class)) {
            return [];
        }

        $query = TransactionTrail::with('user.roles');

        // Scope to parent / standalone business events
        if (method_exists(TransactionTrail::class, 'scopeBusinessEvents')) {
            $query->where(function ($q) {
                $q->where('is_parent', true)
                  ->orWhereNull('is_parent');
            });
        }

        // Exclude internal child technical events
        $query->where(function ($q) {
            $q->whereNull('action')
              ->orWhereNotIn('action', static::$excludedChildActions);
        });

        // Exclude ordinary authentication actions
        $query->where(function ($q) {
            $q->whereNull('action')
              ->orWhereNotIn('action', static::$excludedAuthActions);
        });

        $query->where(function ($q) {
            $q->whereNull('event_key')
              ->orWhereNotIn('event_key', static::$excludedAuthActions);
        });

        // Exclude authentication and low-level security modules
        $query->where(function ($q) {
            $q->whereNull('module')
              ->orWhereNotIn('module', ['Auth', 'Authentication', 'Login', 'Security']);
        });

        // Exclude references matching AUTH patterns
        $query->where(function ($q) {
            $q->whereNull('resource_ref')
              ->orWhere(function ($sub) {
                  $sub->where('resource_ref', 'not like', 'AUTH-%')
                      ->where('resource_ref', 'not like', 'AUTH_%');
              });
        });

        // Pull candidate records to permit group deduplication
        $candidateTrails = $query->latest('created_at')
            ->take(max($limit * 4, 30))
            ->get();

        // Deduplicate duplicate business events from the same operational action
        $deduplicated = $this->deduplicateBusinessEvents($candidateTrails);

        return $deduplicated
            ->take($limit)
            ->map(fn (TransactionTrail $trail) => $this->normalizeTrail($trail))
            ->values()
            ->all();
    }

    /**
     * Deduplicate business events sharing the same operational audit group.
     *
     * @param \Illuminate\Support\Collection<int, TransactionTrail> $trails
     * @return \Illuminate\Support\Collection<int, TransactionTrail>
     */
    protected function deduplicateBusinessEvents($trails)
    {
        $seenGroups = [];
        $result = collect();

        foreach ($trails as $trail) {
            $groupId = $trail->audit_group_id;

            if (empty($groupId)) {
                $meta = $this->extractMetadata($trail);
                $groupId = $meta['correlation_id'] ?? $meta['transaction_id'] ?? $meta['request_id'] ?? null;
            }

            if (!empty($groupId)) {
                if (isset($seenGroups[$groupId])) {
                    $existingIndex = $seenGroups[$groupId];
                    $existingTrail = $result->get($existingIndex);

                    // Prefer true parent event or higher-precedence domain action
                    if (!$existingTrail->is_parent && $trail->is_parent) {
                        $result->put($existingIndex, $trail);
                    } elseif ($this->getEventPrecedence($trail) > $this->getEventPrecedence($existingTrail)) {
                        $result->put($existingIndex, $trail);
                    }
                    continue;
                }

                $seenGroups[$groupId] = $result->count();
                $result->push($trail);
            } else {
                $result->push($trail);
            }
        }

        return $result;
    }

    /**
     * Assign business priority weight for operational events within the same transaction group.
     */
    protected function getEventPrecedence(TransactionTrail $trail): int
    {
        $action = strtolower(trim((string) $trail->action));
        $eventKey = strtolower(trim((string) $trail->event_key));

        if (str_contains($action, 'rfid') || str_contains($eventKey, 'rfid')) {
            return 100;
        }

        if (str_contains($action, 'issuance') || str_contains($action, 'receiving')) {
            return 90;
        }

        if (str_contains($action, 'memorandum') || str_contains($action, 'rpci') || str_contains($action, 'rsmi')) {
            return 80;
        }

        if ($trail->is_parent) {
            return 50;
        }

        return 10;
    }

    /**
     * Normalize a single TransactionTrail model into a standardized Dashboard activity payload.
     *
     * @param TransactionTrail $trail
     * @return array<string, mixed>
     */
    public function normalizeTrail(TransactionTrail $trail): array
    {
        // 1. Resolve raw details and metadata (handles string JSON, arrays, nulls)
        $metadata = $this->extractMetadata($trail);
        $rawDetails = is_string($trail->details) ? trim($trail->details) : '';

        // Check if details itself was stored as serialized JSON
        $detailsDecoded = $this->safeJsonDecode($rawDetails);
        if (is_array($detailsDecoded)) {
            $metadata = array_merge($detailsDecoded, $metadata);
        }

        // 2. Derive event key and module
        $eventKey = $this->resolveEventKey($trail, $metadata);
        $module = $this->resolveModule($trail, $metadata);

        // 3. Resolve human-readable business Title, Reference, Summary, and Context
        [$title, $reference, $summary, $context] = $this->formatBusinessDetails($trail, $eventKey, $metadata, $rawDetails);

        // 4. Resolve Actor (No "by" prefix)
        $actorName = $trail->user ? $trail->user->name : 'System Administrator';
        $actorRole = $trail->user && $trail->user->roles && $trail->user->roles->isNotEmpty()
            ? $trail->user->roles->first()->name
            : 'Authorized Staff';
        $actorId = $trail->user_id;

        // 5. Resolve Timestamps according to actual occurred time
        $occurredCarbon = $trail->created_at ? $trail->created_at->timezone('Asia/Manila') : null;
        if ($occurredCarbon) {
            $occurredAt = $occurredCarbon->toIso8601String();
            $now = now('Asia/Manila');
            if ($occurredCarbon->isToday()) {
                $timeStr = $occurredCarbon->format('g:i A');
            } elseif ($occurredCarbon->year === $now->year) {
                $timeStr = $occurredCarbon->format('M j') . ' • ' . $occurredCarbon->format('g:i A');
            } else {
                $timeStr = $occurredCarbon->format('M j, Y') . ' • ' . $occurredCarbon->format('g:i A');
            }
            $timestampStr = $occurredCarbon->format('M j, Y • g:i A');
        } else {
            $occurredAt = '';
            $timeStr = '';
            $timestampStr = '';
        }

        // 6. Resolve Status & Badge
        $status = (string) ($trail->status ?: 'Success');
        $badge = match (strtolower(trim($status))) {
            'verified', 'success', 'completed' => 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-600/20',
            'logged' => 'bg-blue-50 text-blue-700 ring-1 ring-blue-600/20',
            'flagged', 'failed', 'error' => 'bg-amber-50 text-amber-700 ring-1 ring-amber-600/20',
            'in progress', 'pending' => 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600/20',
            default => 'bg-gray-50 text-gray-700 ring-1 ring-gray-600/20',
        };

        // 7. Ensure NO raw JSON string leaks into summary, title, or details
        $cleanSummary = $this->sanitizeForDisplay($summary ?: $title);
        $cleanDetails = $this->sanitizeForDisplay($summary ?: ($title ?: 'System activity recorded'));

        // Resolve legacy action for tests and backward compatibility
        $legacyAction = $trail->action;
        if (class_exists(AuditLogFormatter::class)) {
            $resolvedLog = AuditLogFormatter::resolveLogEntry($trail);
            $legacyAction = $resolvedLog['action'] ?: $trail->action;
        }

        return [
            'id' => $trail->resource_ref ?: ('TRX-' . $trail->id),
            'event_key' => $eventKey,
            'title' => $title,
            'summary' => $cleanSummary,
            'reference' => $reference,
            'module' => $module,
            'occurred_at' => $occurredAt,
            'time' => $timeStr,
            'timestamp' => $timestampStr,
            'actor' => [
                'id' => $actorId,
                'name' => $actorName,
                'role' => $actorRole,
            ],
            'group_id' => $trail->audit_group_id ?? ($metadata['correlation_id'] ?? null),
            'context' => $context,

            // Backward compatibility fields for legacy components and tests
            'user' => $actorName,
            'role' => $actorRole,
            'action' => $legacyAction ?: $title,
            'details' => $cleanDetails,
            'status' => $status,
            'badge' => $badge,
        ];
    }

    /**
     * Extract and sanitize metadata array from trail.
     */
    protected function extractMetadata(TransactionTrail $trail): array
    {
        $metadata = $trail->metadata;

        if (is_string($metadata)) {
            $decoded = $this->safeJsonDecode($metadata);
            $metadata = is_array($decoded) ? $decoded : [];
        } elseif (!is_array($metadata)) {
            $metadata = [];
        }

        if (class_exists(AuditLogFormatter::class)) {
            $sanitized = AuditLogFormatter::sanitizeValues($metadata);
            return is_array($sanitized) ? $sanitized : [];
        }

        return $metadata;
    }

    /**
     * Safely decode a JSON string without throwing warnings.
     */
    protected function safeJsonDecode(?string $str): mixed
    {
        if (empty($str)) {
            return null;
        }

        $trimmed = trim($str);
        if (!str_starts_with($trimmed, '{') && !str_starts_with($trimmed, '[')) {
            return null;
        }

        $decoded = json_decode($trimmed, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $decoded;
        }

        return null;
    }

    /**
     * Resolve the normalized event key.
     */
    protected function resolveEventKey(TransactionTrail $trail, array $metadata): string
    {
        if (!empty($trail->event_key)) {
            return $trail->event_key;
        }

        $actionLower = strtolower(trim((string) $trail->action));
        $moduleLower = strtolower(trim((string) $trail->module));
        $detailsLower = strtolower(trim((string) $trail->details));

        if (isset($metadata['ris_number']) || str_contains($actionLower, 'issuance')) {
            return 'inventory.issuance.created';
        }

        if (isset($metadata['receiving_id']) || isset($metadata['quantity_received']) || str_contains($actionLower, 'receiving') || str_contains($actionLower, 'stock in')) {
            return 'inventory.receiving.created';
        }

        if (isset($metadata['rfid_tag']) || str_contains($moduleLower, 'rfid') || str_contains($actionLower, 'rfid')) {
            return 'rfid.tag.assigned';
        }

        if (str_contains($actionLower, 'setting') || str_contains($moduleLower, 'setting') || str_contains($moduleLower, 'config')) {
            return 'system.settings.updated';
        }

        if (str_contains($actionLower, 'memorandum') || str_contains($detailsLower, 'memorandum receipt') || (isset($metadata['report_type']) && str_contains(strtolower($metadata['report_type']), 'memorandum'))) {
            return 'compliance.mr.generated';
        }

        if (str_contains($actionLower, 'rpci') || str_contains($detailsLower, 'rpci') || (isset($metadata['report_type']) && str_contains(strtolower($metadata['report_type']), 'rpci'))) {
            return 'compliance.rpci.generated';
        }

        if (str_contains($actionLower, 'rsmi') || str_contains($detailsLower, 'rsmi') || (isset($metadata['report_type']) && str_contains(strtolower($metadata['report_type']), 'rsmi'))) {
            return 'compliance.rsmi.generated';
        }

        if (str_contains($actionLower, 'stock card') || str_contains($detailsLower, 'stock card') || (isset($metadata['report_type']) && str_contains(strtolower($metadata['report_type']), 'stock card'))) {
            return 'compliance.stock_card.generated';
        }

        if (str_contains($actionLower, 'report') || str_contains($moduleLower, 'compliance')) {
            return 'compliance.report.generated';
        }

        if (str_contains($moduleLower, 'supplier') || str_contains($actionLower, 'supplier')) {
            return str_contains($actionLower, 'create') || str_contains($actionLower, 'register') ? 'supplier.created' : 'supplier.updated';
        }

        if (str_contains($actionLower, 'item') || str_contains($moduleLower, 'item')) {
            return str_contains($actionLower, 'create') || str_contains($actionLower, 'add')
                ? 'inventory.item.created'
                : 'inventory.item.updated';
        }

        return 'system.activity.logged';
    }

    /**
     * Resolve the clean module name for user-facing display.
     */
    protected function resolveModule(TransactionTrail $trail, array $metadata): string
    {
        $module = $trail->module;

        if (class_exists(AuditLogFormatter::class)) {
            $resolved = AuditLogFormatter::resolveModuleName($module ?: ($metadata['class'] ?? 'System'));
            return $this->standardizeModuleName($resolved);
        }

        return $this->standardizeModuleName((string) $module);
    }

    /**
     * Enforce standard module naming.
     */
    protected function standardizeModuleName(string $name): string
    {
        $lower = strtolower(trim($name));

        return match (true) {
            str_contains($lower, 'rfid') => 'RFID',
            str_contains($lower, 'invent') || str_contains($lower, 'item') || str_contains($lower, 'stock') => 'Inventory',
            str_contains($lower, 'suppl') => 'Suppliers',
            str_contains($lower, 'complian') || str_contains($lower, 'rpci') || str_contains($lower, 'rsmi') || str_contains($lower, 'report') || str_contains($lower, 'memorandum') => 'Compliance',
            str_contains($lower, 'setting') || str_contains($lower, 'config') || str_contains($lower, 'admin') => 'Administration',
            str_contains($lower, 'user') || str_contains($lower, 'role') || str_contains($lower, 'access') => 'Access Control',
            default => class_exists(AuditLogFormatter::class) ? (AuditLogFormatter::humanizeResourceName($name) ?: 'System') : ucfirst($name),
        };
    }

    /**
     * Format domain-specific business title, reference, summary, and context.
     *
     * @return array{0: string, 1: ?string, 2: string, 3: array<string, mixed>}
     */
    protected function formatBusinessDetails(
        TransactionTrail $trail,
        string $eventKey,
        array $metadata,
        string $rawDetails
    ): array {
        $context = [];
        $reference = $trail->resource_ref;
        $title = $trail->action ?: 'System Activity';
        $summary = '';

        // Normalize Title if generic or technical
        if (class_exists(AuditLogFormatter::class)) {
            $title = AuditLogFormatter::normalizeActivityLabel($trail->action, $eventKey);
        }

        // ==========================================
        // 1. Stock Issuance (Single Natural Sentence)
        // ==========================================
        if ($eventKey === 'inventory.issuance.created' || str_contains(strtolower($title), 'issuance')) {
            $title = 'Created Stock Issuance';
            $risNo = $metadata['ris_number'] ?? $trail->resource_ref ?? null;
            if ($risNo && !str_starts_with((string) $risNo, 'TRX-')) {
                $reference = (string) $risNo;
            }

            $itemsCount = (int) ($metadata['items_count'] ?? 1);
            $totalQty = isset($metadata['total_quantity']) ? (int) $metadata['total_quantity'] : null;
            $recipient = !empty($metadata['recipient']) ? trim((string) $metadata['recipient']) : null;
            $department = !empty($metadata['department']) ? trim((string) $metadata['department']) : null;

            if ($department) {
                $context['department'] = $department;
            }
            if ($recipient) {
                $context['recipient'] = $recipient;
            }

            $itemUnitText = $itemsCount === 1 ? '1 item' : "{$itemsCount} items";
            $qtyText = $totalQty !== null ? ' (' . number_format($totalQty) . ' units)' : '';

            if ($recipient && $department) {
                $summary = "Issued {$itemUnitText}{$qtyText} to {$recipient}, {$department}.";
            } elseif ($recipient) {
                $summary = "Issued {$itemUnitText}{$qtyText} to {$recipient}.";
            } elseif ($department) {
                $summary = "Issued {$itemUnitText}{$qtyText} to {$department}.";
            } else {
                $summary = "Issued {$itemUnitText}{$qtyText}.";
            }

            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 2. Inventory Receiving (Natural Sentence)
        // ==========================================
        if ($eventKey === 'inventory.receiving.created' || str_contains(strtolower($title), 'receiving')) {
            $title = 'Recorded Inventory Receiving';

            $itemName = $metadata['item_name'] ?? null;
            $supplierName = $metadata['supplier_name'] ?? null;
            $supplierStockNo = $metadata['supplier_stock_no'] ?? null;
            $qty = isset($metadata['quantity']) ? (int) $metadata['quantity'] : (isset($metadata['quantity_received']) ? (int) $metadata['quantity_received'] : null);
            $unit = $metadata['unit'] ?? 'units';

            if ($supplierStockNo) {
                $reference = 'Stock No. ' . $supplierStockNo;
            } elseif ($itemName) {
                $reference = $itemName;
            }

            if ($supplierName) {
                $context['supplier'] = $supplierName;
            }
            if ($itemName) {
                $context['entity'] = $itemName;
            }
            if ($supplierStockNo) {
                $context['stock_no'] = $supplierStockNo;
            }

            if ($qty !== null && $supplierName) {
                $summary = sprintf('Received %s %s from %s.', number_format($qty), $unit, $supplierName);
            } elseif ($qty !== null) {
                $summary = sprintf('Received %s %s into inventory.', number_format($qty), $unit);
            } elseif ($supplierName) {
                $summary = sprintf('Received from %s.', $supplierName);
            } else {
                $summary = 'Inventory receiving recorded.';
            }

            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 3. Item Registration
        // ==========================================
        if ($eventKey === 'inventory.item.created' || (str_contains(strtolower($title), 'item') && str_contains(strtolower($title), 'add'))) {
            $title = 'Registered Item Master';
            $itemName = $metadata['name'] ?? $metadata['item_name'] ?? $trail->resource_ref;
            $reference = $itemName;

            $unit = $metadata['unit_of_issue'] ?? $metadata['unit'] ?? null;
            $stock = isset($metadata['stock']) ? (int) $metadata['stock'] : null;

            if ($unit && $stock !== null) {
                $summary = sprintf('Initial stock: %s %s.', number_format($stock), strtolower($unit) . ($stock > 1 ? 's' : ''));
            } elseif ($unit) {
                $summary = sprintf('Catalog item registered with unit: %s.', $unit);
            } elseif ($stock !== null) {
                $summary = sprintf('Initial stock: %s units.', number_format($stock));
            } else {
                $summary = 'Item registered in inventory master catalog.';
            }

            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 4. Compliance: Memorandum Receipt
        // ==========================================
        if ($eventKey === 'compliance.mr.generated' || str_contains(strtolower($title), 'memorandum') || str_contains(strtolower($rawDetails), 'memorandum receipt')) {
            $title = 'Generated Memorandum Receipt';
            $ref = $metadata['report_number'] ?? $metadata['reference'] ?? $trail->resource_ref;
            if ($ref && !str_starts_with((string) $ref, 'TRX-')) {
                $reference = (string) $ref;
            }

            $recipient = $metadata['recipient'] ?? null;
            if (!$recipient && preg_match('/Memorandum Receipt\s*[-–:]\s*([^\'"\(\)]+)/i', $rawDetails, $m)) {
                $recipient = trim($m[1]);
            }

            $summary = $recipient ? "Prepared for {$recipient}." : "Memorandum Receipt compliance documentation generated.";
            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 5. Compliance: RSMI Report
        // ==========================================
        if ($eventKey === 'compliance.rsmi.generated' || str_contains(strtolower($title), 'rsmi') || str_contains(strtolower($rawDetails), 'rsmi')) {
            $title = 'Generated RSMI Report';
            $ref = $metadata['report_number'] ?? $metadata['reference'] ?? $trail->resource_ref;
            if ($ref && !str_starts_with((string) $ref, 'TRX-')) {
                $reference = (string) $ref;
            }
            $month = $metadata['month'] ?? $metadata['period'] ?? null;
            if (!$month && preg_match('/(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}/i', $rawDetails, $m)) {
                $month = $m[0];
            }

            $count = isset($metadata['issuances_count']) ? (int) $metadata['issuances_count'] : null;
            if ($month) {
                $summary = "{$month} reporting period.";
            } elseif ($count !== null) {
                $summary = "{$count} issuance records included.";
            } else {
                $summary = "Monthly report of supplies and materials issued.";
            }

            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 6. Compliance: RPCI Report
        // ==========================================
        if ($eventKey === 'compliance.rpci.generated' || str_contains(strtolower($title), 'rpci') || str_contains(strtolower($rawDetails), 'rpci')) {
            $title = 'Generated RPCI Report';
            $ref = $metadata['report_number'] ?? $metadata['reference'] ?? $trail->resource_ref;
            if ($ref && !str_starts_with((string) $ref, 'TRX-')) {
                $reference = (string) $ref;
            }
            $asOf = $metadata['as_of'] ?? $metadata['date'] ?? null;
            if ($asOf) {
                $dateFormatted = Carbon::canBeCreatedFromFormat($asOf, 'Y-m-d') ? Carbon::parse($asOf)->format('M d, Y') : $asOf;
                $summary = "Physical Count of Inventories as of {$dateFormatted}.";
            } else {
                $summary = "Physical count of inventories report generated.";
            }

            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 7. System Settings
        // ==========================================
        if ($eventKey === 'system.settings.updated' || str_contains(strtolower($title), 'setting')) {
            $title = 'Updated System Settings';
            $reference = null; // Do not display technical CONFIG-BATCH-x

            $updatedKeys = $metadata['updated_keys'] ?? [];
            if (is_array($updatedKeys) && !empty($updatedKeys)) {
                $keyNames = array_map(fn ($k) => Str::headline((string) $k), array_slice($updatedKeys, 0, 2));
                $summary = implode(', ', $keyNames) . (count($updatedKeys) > 2 ? ' and additional configuration parameters updated.' : ' updated.');
            } else {
                $summary = 'System configuration parameters updated.';
            }

            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 8. Supplier Activity
        // ==========================================
        if (str_starts_with($eventKey, 'supplier.') || str_contains(strtolower($title), 'supplier')) {
            $isCreated = str_contains(strtolower($title), 'new') || str_contains(strtolower($title), 'create') || $eventKey === 'supplier.created';
            $title = $isCreated ? 'Registered New Supplier' : 'Updated Supplier';
            $supplierName = $metadata['name'] ?? $metadata['supplier_name'] ?? $trail->resource_ref;
            $reference = $supplierName;

            $summary = $isCreated ? 'New supplier profile registered in directory.' : 'Supplier profile information was updated.';
            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // 9. RFID Activity
        // ==========================================
        if ($eventKey === 'rfid.tag.assigned' || str_contains(strtolower($title), 'rfid')) {
            $title = 'Assigned RFID Tag';
            $itemName = $metadata['item_name'] ?? $metadata['item']['name'] ?? null;
            $tag = $metadata['new_tag'] ?? $metadata['rfid_tag'] ?? null;

            if ($itemName) {
                $reference = $itemName;
            } elseif ($tag) {
                $reference = strlen((string) $tag) > 16 ? substr((string) $tag, 0, 16) . '...' : (string) $tag;
            }

            $summary = 'RFID tag assigned successfully.';
            return [$title, $reference, $summary, $context];
        }

        // ==========================================
        // Fallback: If details was plain text and not JSON
        // ==========================================
        if (!empty($rawDetails) && !str_starts_with($rawDetails, '{') && !str_starts_with($rawDetails, '[')) {
            $summary = rtrim($rawDetails, '.') . '.';
        } else {
            $summary = 'System operational activity recorded.';
        }

        return [$title, $reference, $summary, $context];
    }

    /**
     * Ensure any raw JSON strings, curly braces or developer dumps are sanitized into clean text.
     */
    protected function sanitizeForDisplay(string $text): string
    {
        $trimmed = trim($text);

        // If string begins and ends with JSON braces, decode or provide fallback
        if ((str_starts_with($trimmed, '{') && str_ends_with($trimmed, '}')) ||
            (str_starts_with($trimmed, '[') && str_ends_with($trimmed, ']'))
        ) {
            $decoded = $this->safeJsonDecode($trimmed);
            if (is_array($decoded)) {
                if (isset($decoded['ris_number'])) {
                    $count = $decoded['items_count'] ?? 1;
                    $qty = isset($decoded['total_quantity']) ? ' • ' . number_format($decoded['total_quantity']) . ' units' : '';
                    $rec = !empty($decoded['recipient']) ? ' • ' . $decoded['recipient'] : '';
                    return "{$decoded['ris_number']} • {$count} items{$qty}{$rec}";
                }
                if (isset($decoded['item_name'])) {
                    return $decoded['item_name'];
                }
            }

            return 'System activity recorded';
        }

        return $trimmed;
    }
}
