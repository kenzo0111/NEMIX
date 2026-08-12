<?php

namespace Tests\Feature;

use App\Models\ComplianceMigrationLog;
use App\Models\ComplianceMigratedRecord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComplianceMigrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_historical_records_can_be_migrated_to_the_database(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        $response = $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'RSMI',
            'source' => 'legacy_excel',
            'records' => [[
                'reference' => 'LEGACY-001',
                'date' => '2024-01-15',
                'item_name' => 'Ballpen',
                'quantity' => 10,
                'recipient' => 'Supply Office',
                'department' => 'Accounting',
                'designation' => 'Accountant',
                'remarks' => 'Migrated historic record',
            ]],
        ]);

        $response->assertRedirect(route('compliance.reports'));
        $this->assertSame(1, ComplianceMigratedRecord::count());
        $this->assertSame(1, ComplianceMigrationLog::count());

        $record = ComplianceMigratedRecord::first();
        $this->assertSame('RSMI', $record->form_type);
        $this->assertSame('historical_migration', $record->status);
        $this->assertSame('LEGACY-001', $record->reference);
    }

    public function test_migration_supports_rpci_and_stock_card_forms_with_duplicate_protection(): void
    {
        $this->withoutMiddleware();

        $role = \Spatie\Permission\Models\Role::firstOrCreate(['name' => 'System Admin']);
        $user = User::factory()->create(['email_verified_at' => now()]);
        $user->assignRole($role);

        // Migrate RPCI
        $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'RPCI',
            'source' => 'rpci_excel',
            'records' => [[
                'reference' => 'PROP-2024-01',
                'date' => '2024-12-31',
                'item_name' => 'Desktop Computer',
                'quantity' => 5,
                'recipient' => 'Jane Doe',
                'department' => 'IT Dept',
            ]],
        ]);

        // Migrate Stock Card
        $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'STOCK_CARD',
            'source' => 'stock_card_doc',
            'records' => [[
                'reference' => 'PO-2024-88',
                'date' => '2024-03-10',
                'item_name' => 'Ballpen',
                'quantity' => 20,
                'receipt_qty' => 50,
                'recipient' => 'Supply Office',
            ]],
        ]);

        $this->assertSame(2, ComplianceMigratedRecord::count());

        // Attempt duplicate migration (should be skipped)
        $this->actingAs($user)->post(route('compliance.migrations.store'), [
            'form_type' => 'RPCI',
            'source' => 'rpci_excel',
            'records' => [[
                'reference' => 'PROP-2024-01',
                'date' => '2024-12-31',
                'item_name' => 'Desktop Computer',
                'quantity' => 5,
            ]],
        ]);

        $this->assertSame(2, ComplianceMigratedRecord::count());
    }
}
