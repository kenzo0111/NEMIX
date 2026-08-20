<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use App\Models\Compliance\RsmiMigratedRecord;
use App\Models\Compliance\RpcIMigratedRecord;
use App\Models\Compliance\StockCardMigratedRecord;
use App\Models\Compliance\MemorandumReceiptMigratedRecord;
use App\Models\ComplianceMigrationLog;
use App\Models\ComplianceMigratedRecord;

class VerifyComplianceMigration extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'compliance:verify-migration 
                            {--migrate-old : Transfer any existing records from compliance_migrated_records into dedicated tables}
                            {--drop-old : Drop the legacy compliance_migrated_records table after verification}';

    /**
     * The console command description.
     */
    protected $description = 'Verify that historical migration data is stored in dedicated tables, check integrity, and optionally deprecate the legacy table.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('====================================================');
        $this->info('  COA HISTORICAL MIGRATION DATA INTEGRITY CHECK');
        $this->info('====================================================');

        $tables = [
            'rsmi_migrated_records' => [
                'model' => RsmiMigratedRecord::class,
                'form' => 'RSMI',
                'item_col' => 'item',
                'ref_col' => 'ris_no',
            ],
            'rpci_migrated_records' => [
                'model' => RpcIMigratedRecord::class,
                'form' => 'RPCI',
                'item_col' => 'item',
                'ref_col' => 'serial_no',
            ],
            'stock_card_migrated_records' => [
                'model' => StockCardMigratedRecord::class,
                'form' => 'STOCK_CARD',
                'item_col' => 'item',
                'ref_col' => 'reference_no',
            ],
            'memorandum_receipt_migrated_records' => [
                'model' => MemorandumReceiptMigratedRecord::class,
                'form' => 'MR',
                'item_col' => 'remarks',
                'ref_col' => 'memorial_no',
            ],
        ];

        // 1. Check dedicated tables existence and counts
        $allDedicatedExist = true;
        foreach ($tables as $tableName => $meta) {
            if (!Schema::hasTable($tableName)) {
                $this->error("❌ Table {$tableName} DOES NOT exist!");
                $allDedicatedExist = false;
                continue;
            }

            $model = $meta['model'];
            $count = $model::count();
            $this->info("✔ [{$meta['form']}] Table {$tableName}: {$count} records");

            // Integrity checks on dedicated records
            if ($count > 0) {
                $nullRef = $model::whereNull($meta['ref_col'])->count();
                if ($nullRef > 0) {
                    $this->warn("   ↳ Warning: {$nullRef} records have NULL reference column ({$meta['ref_col']}).");
                }
            }
        }

        // 2. Check Central Migration Logs
        if (Schema::hasTable('compliance_migration_logs')) {
            $logCount = ComplianceMigrationLog::count();
            $this->info("✔ [AUDIT] Table compliance_migration_logs: {$logCount} audit logs recorded.");
        } else {
            $this->error("❌ Table compliance_migration_logs is MISSING!");
        }

        // 3. Check Legacy Table
        $legacyTable = 'compliance_migrated_records';
        $hasLegacy = Schema::hasTable($legacyTable);

        if ($hasLegacy) {
            $legacyCount = ComplianceMigratedRecord::count();
            $this->warn("⚠ Legacy table {$legacyTable} exists with {$legacyCount} records.");

            // Migrate old records if flag provided
            if ($this->option('migrate-old') && $legacyCount > 0) {
                $this->info("Transferring {$legacyCount} legacy records to dedicated tables...");
                $legacyRecords = ComplianceMigratedRecord::all();
                $transferred = 0;

                foreach ($legacyRecords as $rec) {
                    $formType = strtoupper($rec->form_type ?? 'RSMI');
                    $payload = $rec->payload ?? [];

                    if ($formType === 'RSMI') {
                        RsmiMigratedRecord::create([
                            'source_file' => $rec->source,
                            'form_identifier' => 'RSMI',
                            'serial_no' => $rec->reference,
                            'ris_no' => $rec->reference,
                            'date' => $rec->date,
                            'entity_name' => $rec->department,
                            'item' => $rec->item_name,
                            'quantity_issued' => $rec->quantity,
                            'unit' => data_get($payload, 'unit'),
                            'unit_cost' => data_get($payload, 'unit_cost'),
                            'amount' => data_get($payload, 'amount'),
                            'raw_data' => $payload,
                        ]);
                        $transferred++;
                    } elseif ($formType === 'RPCI') {
                        RpcIMigratedRecord::create([
                            'source_file' => $rec->source,
                            'form_identifier' => 'RPCI',
                            'serial_no' => $rec->reference,
                            'date' => $rec->date,
                            'item' => $rec->item_name,
                            'quantity_per_books' => $rec->quantity,
                            'location' => $rec->department,
                            'remarks' => $rec->remarks,
                            'raw_data' => $payload,
                        ]);
                        $transferred++;
                    } elseif ($formType === 'STOCK_CARD' || $formType === 'STOCKCARD' || $formType === 'SC') {
                        StockCardMigratedRecord::create([
                            'source_file' => $rec->source,
                            'form_identifier' => 'STOCK_CARD',
                            'reference_no' => $rec->reference,
                            'date' => $rec->date,
                            'item' => $rec->item_name,
                            'issue_quantity' => $rec->quantity,
                            'office_end_user' => $rec->recipient,
                            'supplier_source' => $rec->department,
                            'remarks' => $rec->remarks,
                            'raw_data' => $payload,
                        ]);
                        $transferred++;
                    } elseif ($formType === 'MR' || $formType === 'MOR') {
                        MemorandumReceiptMigratedRecord::create([
                            'source_file' => $rec->source,
                            'form_identifier' => 'MR',
                            'memorial_no' => $rec->reference,
                            'date_received' => $rec->date,
                            'received_from' => $rec->department,
                            'received_by' => $rec->recipient,
                            'received_for' => $rec->designation,
                            'remarks' => $rec->remarks ?? $rec->item_name,
                            'raw_data' => $payload,
                        ]);
                        $transferred++;
                    }
                }
                $this->info("✔ Successfully transferred {$transferred} records to dedicated tables.");
            }

            // Drop old table if requested
            if ($this->option('drop-old')) {
                Schema::dropIfExists($legacyTable);
                $this->info("✔ Legacy table {$legacyTable} dropped successfully.");
            }
        } else {
            $this->info("✔ Legacy table {$legacyTable} is not present (already deprecated / removed).");
        }

        $this->info('====================================================');
        $this->info('  VERIFICATION COMPLETE');
        $this->info('====================================================');

        return 0;
    }
}
