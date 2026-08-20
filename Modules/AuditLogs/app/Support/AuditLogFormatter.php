<?php

namespace Modules\AuditLogs\Support;

use Illuminate\Database\Eloquent\Model;
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
    public static function humanizeResourceName(string|object $name): string
    {
        $className = is_object($name) ? class_basename($name) : class_basename((string) $name);

        return Str::of($className)
            ->replaceMatches('/([a-z])([A-Z])/', '$1 $2')
            ->replaceMatches('/[_-]+/', ' ')
            ->squish()
            ->title()
            ->toString();
    }

    /**
     * Convert an action into a direct verb or title-cased action.
     */
    public static function humanizeAction(string $action): string
    {
        return Str::of($action)->trim()->title()->toString();
    }

    /**
     * Map a model class or module identifier to a clean, standardized system module name.
     */
    public static function resolveModuleName(string|object $moduleOrModel): string
    {
        $name = is_object($moduleOrModel) ? class_basename($moduleOrModel) : class_basename((string) $moduleOrModel);
        $nameLower = strtolower($name);

        return match (true) {
            str_contains($nameLower, 'item') ||
            str_contains($nameLower, 'receiving') ||
            str_contains($nameLower, 'issuance') ||
            str_contains($nameLower, 'requisition') ||
            str_contains($nameLower, 'custodian') ||
            str_contains($nameLower, 'acknowledgement') ||
            str_contains($nameLower, 'inspection') ||
            str_contains($nameLower, 'purchaserequest') ||
            $nameLower === 'inventory' => 'Inventory',

            str_contains($nameLower, 'supplier') => 'Suppliers',

            str_contains($nameLower, 'user') ||
            str_contains($nameLower, 'role') ||
            str_contains($nameLower, 'permission') ||
            str_contains($nameLower, 'staff') ||
            $nameLower === 'access control' ||
            $nameLower === 'accesscontrol' => 'Access Control',

            str_contains($nameLower, 'systemconfig') ||
            str_contains($nameLower, 'operating mode') ||
            str_contains($nameLower, 'system configuration') => 'System Configuration',

            str_contains($nameLower, 'compliance') ||
            str_contains($nameLower, 'rsmi') ||
            str_contains($nameLower, 'rpci') ||
            str_contains($nameLower, 'stockcard') ||
            str_contains($nameLower, 'memorandumreceipt') ||
            str_contains($nameLower, 'report') => 'Compliance',

            str_contains($nameLower, 'login') ||
            str_contains($nameLower, 'transactiontrail') ||
            str_contains($nameLower, 'audit') => 'Audit Logs',

            default => static::humanizeResourceName($name) ?: 'System',
        };
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

        if ($field === 'sku') {
            return 'SKU';
        }

        if ($field === 'tin') {
            return 'TIN';
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

    /**
     * Format a specific, descriptive audit log payload for an Eloquent model event.
     *
     * @param Model $model The affected Eloquent model
     * @param string $event Eloquent event name ('Created', 'Updated', 'Deleted')
     * @param array $changes Changed attributes array
     * @param array $original Original attributes prior to changes
     * @return array{action: string, module: string, resource_ref: string, details: string, status: string}
     */
    public static function formatForModel(Model $model, string $event, array $changes = [], array $original = []): array
    {
        $className = class_basename($model);
        $module = static::resolveModuleName($className);
        $event = ucfirst(strtolower($event));

        $action = match ($event) {
            'Created' => 'Created ' . static::humanizeResourceName($className),
            'Updated' => 'Updated ' . static::humanizeResourceName($className),
            'Deleted' => 'Deleted ' . static::humanizeResourceName($className),
            default => $event,
        };

        $resourceRef = 'ID-' . $model->getKey();
        $details = static::describe($event, $className, $changes);
        $status = match (strtolower($event)) {
            'created' => 'Verified',
            'updated' => 'Updated',
            'deleted' => 'Deleted',
            default => 'Logged',
        };

        // Model-specific customizations
        switch ($className) {
            case 'Item':
                $itemName = $model->name ?? ($original['name'] ?? 'Inventory Item');
                $sku = $model->sku ?? ($original['sku'] ?? null);
                $skuText = $sku ? " (SKU: {$sku})" : '';
                $unit = $model->unit_of_issue ?? ($original['unit_of_issue'] ?? 'units');
                $resourceRef = 'ITEM-' . ($sku ?: $model->getKey());

                if ($event === 'Created') {
                    $action = 'Added Inventory Item';
                    $stock = $model->stock ?? 0;
                    $costText = $model->unit_cost !== null ? ', Cost: ₱' . number_format((float) $model->unit_cost, 2) : '';
                    $details = "Added item '{$itemName}'{$skuText} with {$stock} {$unit} initial stock{$costText}";
                } elseif ($event === 'Updated') {
                    if (array_key_exists('stock', $changes)) {
                        $action = 'Adjusted Item Stock';
                        $oldStock = $original['stock'] ?? 'unknown';
                        $newStock = $model->stock ?? 0;
                        $details = "Adjusted stock for '{$itemName}'{$skuText} from {$oldStock} to {$newStock} {$unit}";
                    } elseif (array_key_exists('status', $changes)) {
                        $action = 'Updated Item Stock Status';
                        $oldStatus = $original['status'] ?? 'unknown';
                        $newStatus = $model->status ?? 'unknown';
                        $details = "Changed inventory status for '{$itemName}'{$skuText} from '{$oldStatus}' to '{$newStatus}'";
                    } else {
                        $action = 'Updated Inventory Item Details';
                        $fieldsList = static::humanizeFields($changes);
                        $details = "Updated details for item '{$itemName}'{$skuText}" . ($fieldsList ? " ({$fieldsList})" : '');
                    }
                } elseif ($event === 'Deleted') {
                    $action = 'Deleted Inventory Item';
                    $details = "Removed item '{$itemName}'{$skuText} from inventory records";
                }
                break;

            case 'Receiving':
                $resourceRef = 'RCV-' . $model->getKey();
                $itemName = $model->item?->name ?? 'Inventory Item';
                $supplierName = $model->supplier?->name ?? null;
                $supplierText = $supplierName ? " from supplier '{$supplierName}'" : '';
                $qty = $model->quantity ?? ($original['quantity'] ?? 0);
                $dateText = $model->date_received ? ' on ' . date('M d, Y', strtotime((string) $model->date_received)) : '';

                if ($event === 'Created') {
                    $action = 'Stock In Requisition';
                    $details = "Received {$qty} units of '{$itemName}'{$supplierText}{$dateText}";
                } elseif ($event === 'Updated') {
                    $action = 'Updated Stock Receiving';
                    $details = "Updated receiving record for {$qty} units of '{$itemName}'{$supplierText}";
                } elseif ($event === 'Deleted') {
                    $action = 'Voided Stock Receiving';
                    $details = "Voided receiving record for {$qty} units of '{$itemName}'";
                }
                break;

            case 'Issuance':
                $resourceRef = 'RIS-' . $model->getKey();
                $itemName = $model->item?->name ?? 'Inventory Item';
                $recipient = $model->recipient ?? ($original['recipient'] ?? 'Personnel');
                $deptText = !empty($model->department) ? " ({$model->department})" : '';
                $qty = $model->quantity ?? ($original['quantity'] ?? 0);

                if ($event === 'Created') {
                    $action = 'Issued Inventory Stock';
                    $purposeText = !empty($model->purpose) ? " - Purpose: {$model->purpose}" : '';
                    $details = "Issued {$qty} units of '{$itemName}' to {$recipient}{$deptText}{$purposeText}";
                } elseif ($event === 'Updated') {
                    $action = 'Updated Stock Issuance';
                    $statusText = $model->status ? " (Status: {$model->status})" : '';
                    $details = "Updated issuance record of {$qty} units of '{$itemName}' for {$recipient}{$deptText}{$statusText}";
                } elseif ($event === 'Deleted') {
                    $action = 'Archived Stock Issuance';
                    $details = "Archived issuance record of {$qty} units for {$recipient}{$deptText}";
                }
                break;

            case 'Supplier':
                $supName = $model->name ?? ($original['name'] ?? 'Supplier');
                $tin = $model->tin ?? ($original['tin'] ?? null);
                $tinText = $tin ? " (TIN: {$tin})" : '';
                $resourceRef = 'SUP-' . ($tin ?: $model->getKey());

                if ($event === 'Created') {
                    $action = 'Registered New Supplier';
                    $catText = !empty($model->category) ? " [Category: {$model->category}]" : '';
                    $details = "Registered new supplier '{$supName}'{$tinText}{$catText}";
                } elseif ($event === 'Updated') {
                    $action = 'Updated Supplier Information';
                    $fieldsList = static::humanizeFields($changes);
                    $details = "Updated supplier '{$supName}'" . ($fieldsList ? " ({$fieldsList})" : '');
                } elseif ($event === 'Deleted') {
                    $action = 'Removed Supplier Profile';
                    $details = "Removed supplier '{$supName}'{$tinText} from records";
                }
                break;

            case 'User':
                $userName = $model->name ?? ($original['name'] ?? 'Staff User');
                $userEmail = $model->email ?? ($original['email'] ?? '');
                $emailText = $userEmail ? " ({$userEmail})" : '';
                $resourceRef = 'USR-' . $model->getKey();

                if ($event === 'Created') {
                    $action = 'Created Staff Account';
                    $details = "Created staff user account for {$userName}{$emailText}";
                } elseif ($event === 'Updated') {
                    if (array_key_exists('is_active', $changes)) {
                        $isActive = (bool) ($model->is_active ?? false);
                        $action = $isActive ? 'Activated Staff Account' : 'Deactivated Staff Account';
                        $details = ($isActive ? 'Activated' : 'Deactivated') . " account for staff user {$userName}{$emailText}";
                    } elseif (array_key_exists('password', $changes)) {
                        $action = 'Reset User Password';
                        $details = "Updated security credentials for {$userName}{$emailText}";
                    } else {
                        $action = 'Updated Staff Profile';
                        $fieldsList = static::humanizeFields($changes);
                        $details = "Updated profile for staff {$userName}{$emailText}" . ($fieldsList ? " ({$fieldsList})" : '');
                    }
                } elseif ($event === 'Deleted') {
                    $action = 'Deleted Staff Account';
                    $details = "Deleted staff user account for {$userName}{$emailText}";
                }
                break;

            case 'Role':
                $roleName = $model->name ?? ($original['name'] ?? 'Role');
                $resourceRef = 'ROLE-' . $model->getKey();

                if ($event === 'Created') {
                    $action = 'Created Security Role';
                    $details = "Created security role '{$roleName}'";
                } elseif ($event === 'Updated') {
                    $action = 'Updated Role Permissions';
                    $details = "Updated configuration for security role '{$roleName}'";
                } elseif ($event === 'Deleted') {
                    $action = 'Deleted Security Role';
                    $details = "Deleted security role '{$roleName}'";
                }
                break;

            case 'Permission':
                $permName = $model->name ?? ($original['name'] ?? 'Permission');
                $resourceRef = 'PERM-' . $model->getKey();
                $action = 'Modified Security Permission';
                $details = "Updated security permission '{$permName}'";
                break;

            case 'SystemConfiguration':
                $action = 'Operating Mode Switched';
                $resourceRef = 'MODE-' . str_replace(' ', '_', $model->active_mode ?? 'SYSTEM');
                $prevMode = $original['active_mode'] ?? $model->previous_mode ?? 'Default Mode';
                $newMode = $model->active_mode ?? 'LIVE PRODUCTION';
                $reason = !empty($model->change_reason) ? " - Reason: {$model->change_reason}" : '';
                $details = "Switched mode from '{$prevMode}' to '{$newMode}'{$reason}";
                $status = 'Verified';
                break;

            case 'RequisitionIssueSlip':
            case 'RequisitionIssueSlipItem':
                $risNo = $model->ris_no ?? ($original['ris_no'] ?? null);
                $resourceRef = 'RIS-' . ($risNo ?: $model->getKey());
                $risText = $risNo ? " #{$risNo}" : '';
                if ($event === 'Created') {
                    $action = 'Generated Requisition & Issue Slip';
                    $details = "Generated official Requisition and Issue Slip (RIS){$risText}";
                } elseif ($event === 'Updated') {
                    $action = 'Updated Requisition & Issue Slip';
                    $details = "Updated Requisition and Issue Slip (RIS){$risText}";
                } else {
                    $action = 'Archived Requisition & Issue Slip';
                    $details = "Archived Requisition and Issue Slip (RIS){$risText}";
                }
                break;

            case 'PropertyAcknowledgementReceipt':
            case 'PropertyAcknowledgementReceiptItem':
                $parNo = $model->par_no ?? ($original['par_no'] ?? null);
                $resourceRef = 'PAR-' . ($parNo ?: $model->getKey());
                $parText = $parNo ? " #{$parNo}" : '';
                if ($event === 'Created') {
                    $action = 'Generated PAR Document';
                    $details = "Generated Property Acknowledgement Receipt (PAR){$parText}";
                } else {
                    $action = 'Updated PAR Document';
                    $details = "Updated Property Acknowledgement Receipt (PAR){$parText}";
                }
                break;

            case 'InventoryCustodianSlip':
            case 'InventoryCustodianSlipItem':
                $icsNo = $model->ics_no ?? ($original['ics_no'] ?? null);
                $resourceRef = 'ICS-' . ($icsNo ?: $model->getKey());
                $icsText = $icsNo ? " #{$icsNo}" : '';
                if ($event === 'Created') {
                    $action = 'Generated ICS Document';
                    $details = "Generated Inventory Custodian Slip (ICS){$icsText}";
                } else {
                    $action = 'Updated ICS Document';
                    $details = "Updated Inventory Custodian Slip (ICS){$icsText}";
                }
                break;

            case 'InspectionAcceptanceReport':
            case 'InspectionAcceptanceReportItem':
                $iarNo = $model->iar_no ?? ($original['iar_no'] ?? null);
                $resourceRef = 'IAR-' . ($iarNo ?: $model->getKey());
                $iarText = $iarNo ? " #{$iarNo}" : '';
                if ($event === 'Created') {
                    $action = 'Generated IAR Document';
                    $details = "Generated Inspection and Acceptance Report (IAR){$iarText}";
                } else {
                    $action = 'Updated IAR Document';
                    $details = "Updated Inspection and Acceptance Report (IAR){$iarText}";
                }
                break;

            case 'PurchaseRequest':
            case 'PurchaseRequestItem':
                $prNo = $model->pr_no ?? ($original['pr_no'] ?? null);
                $resourceRef = 'PR-' . ($prNo ?: $model->getKey());
                $prText = $prNo ? " #{$prNo}" : '';
                if ($event === 'Created') {
                    $action = 'Created Purchase Request';
                    $details = "Created official Purchase Request (PR){$prText}";
                } else {
                    $action = 'Updated Purchase Request';
                    $details = "Updated official Purchase Request (PR){$prText}";
                }
                break;

            case 'ComplianceReport':
                $resourceRef = 'REP-' . $model->getKey();
                $title = $model->title ?? 'Official Report';
                $action = 'Generated Compliance Report';
                $details = "Generated compliance report '{$title}'" . ($model->report_type ? " ({$model->report_type})" : '');
                break;
        }

        return [
            'action' => $action,
            'module' => $module,
            'resource_ref' => $resourceRef,
            'details' => $details,
            'status' => $status,
        ];
    }

    /**
     * Resolve any transaction trail log into a specific, high-clarity action and description.
     * Useful for existing database entries, legacy records, and fallback datasets.
     *
     * @param mixed $trail TransactionTrail model or array
     * @return array{action: string, module: string, details: string, resource_ref: string, status: string}
     */
    public static function resolveLogEntry(mixed $trail): array
    {
        $action = is_array($trail) ? ($trail['action'] ?? '') : ($trail->action ?? '');
        $module = is_array($trail) ? ($trail['module'] ?? '') : ($trail->module ?? '');
        $details = is_array($trail) ? ($trail['details'] ?? '') : ($trail->details ?? '');
        $resourceRef = is_array($trail) ? ($trail['resource_ref'] ?? $trail['id'] ?? '') : ($trail->resource_ref ?? ('TRX-' . $trail->id));
        $status = is_array($trail) ? ($trail['status'] ?? 'Logged') : ($trail->status ?? 'Logged');

        $resolvedModule = static::resolveModuleName($module ?: $details);
        $actionLower = strtolower(trim((string) $action));
        $moduleLower = strtolower(trim((string) $module));
        $detailsLower = strtolower(trim((string) $details));

        $specificAction = $action;
        $specificDetails = $details;

        // If action is generic (Created, Updated, Deleted, Logged) or matches known patterns, make it specific
        if (
            in_array($actionLower, ['created', 'updated', 'deleted', 'logged', 'verified', 'flagged', '']) ||
            $actionLower === strtolower($moduleLower)
        ) {
            if ($resolvedModule === 'Inventory') {
                if (str_contains($moduleLower, 'receiving') || str_contains($detailsLower, 'receiving') || str_contains($detailsLower, 'received')) {
                    $specificAction = match ($actionLower) {
                        'updated' => 'Updated Stock Receiving',
                        'deleted' => 'Voided Stock Receiving',
                        default => 'Stock In Requisition',
                    };
                    $specificDetails = $details ?: ($actionLower === 'created' ? 'Received item stock into inventory' : 'Updated receiving record');
                } elseif (str_contains($moduleLower, 'issuance') || str_contains($detailsLower, 'issuance') || str_contains($detailsLower, 'issued')) {
                    $specificAction = match ($actionLower) {
                        'updated' => 'Updated Stock Issuance',
                        'deleted' => 'Archived Stock Issuance',
                        default => 'Issued Inventory Stock',
                    };
                    $specificDetails = $details ?: ($actionLower === 'created' ? 'Issued stock to department personnel' : 'Updated issuance record');
                } elseif (str_contains($moduleLower, 'requisition') || str_contains($detailsLower, 'requisition') || str_contains($detailsLower, 'ris')) {
                    $specificAction = $actionLower === 'created' ? 'Generated Requisition & Issue Slip' : 'Updated Requisition & Issue Slip';
                } elseif (str_contains($detailsLower, 'disposal') || str_contains($detailsLower, 'unserviceable')) {
                    $specificAction = 'Certified Unserviceable Assets';
                } else {
                    // General Inventory Item
                    if ($actionLower === 'created') {
                        $specificAction = 'Added Inventory Item';
                        $specificDetails = $details ?: 'Registered new item in inventory system';
                    } elseif ($actionLower === 'updated') {
                        if (str_contains($detailsLower, 'stock') || str_contains($detailsLower, 'quantity')) {
                            $specificAction = 'Adjusted Item Stock';
                        } elseif (str_contains($detailsLower, 'status')) {
                            $specificAction = 'Updated Item Stock Status';
                        } else {
                            $specificAction = 'Updated Inventory Item Details';
                        }
                    } elseif ($actionLower === 'deleted') {
                        $specificAction = 'Deleted Inventory Item';
                    } else {
                        $specificAction = 'Managed Inventory Item';
                    }
                }
            } elseif ($resolvedModule === 'Suppliers') {
                $specificAction = match ($actionLower) {
                    'updated' => 'Updated Supplier Information',
                    'deleted' => 'Removed Supplier Profile',
                    default => 'Registered New Supplier',
                };
                $specificDetails = $details ?: 'Managed supplier profile and contact records';
            } elseif ($resolvedModule === 'Access Control') {
                if (str_contains($moduleLower, 'role') || str_contains($detailsLower, 'role') || str_contains($detailsLower, 'permission')) {
                    $specificAction = match ($actionLower) {
                        'created' => 'Created Security Role',
                        'deleted' => 'Deleted Security Role',
                        default => 'Updated Role Permissions',
                    };
                } else {
                    if (str_contains($detailsLower, 'account status') || str_contains($detailsLower, 'active')) {
                        $specificAction = 'Updated Staff Account Status';
                    } elseif ($actionLower === 'created') {
                        $specificAction = 'Created Staff Account';
                    } elseif ($actionLower === 'deleted') {
                        $specificAction = 'Deleted Staff Account';
                    } else {
                        $specificAction = 'Updated Staff Profile';
                    }
                }
            } elseif ($resolvedModule === 'System Configuration') {
                $specificAction = 'Operating Mode Switched';
            } elseif ($resolvedModule === 'Compliance') {
                if (str_contains($detailsLower, 'migrat') || str_contains($moduleLower, 'migrat')) {
                    $specificAction = 'Migrated Compliance Records';
                } else {
                    $specificAction = 'Generated Compliance Report';
                }
            } else {
                $specificAction = static::humanizeAction($action ?: 'System Action') . ' ' . $resolvedModule;
            }
        }

        // If specificAction is already rich (e.g., 'Operating Mode Switched', 'Certified Unserviceable Assets'), preserve and title-case it
        if (!empty($specificAction)) {
            $specificAction = static::humanizeAction($specificAction);
        }

        return [
            'action' => $specificAction ?: 'System Operation',
            'module' => $resolvedModule,
            'resource_ref' => (string) $resourceRef,
            'details' => $specificDetails ?: $specificAction,
            'status' => (string) $status,
        ];
    }
}