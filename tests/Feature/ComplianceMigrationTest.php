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
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson(route('compliance.migrations.store'), [
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
        $this->assertSame('migrated', $record->status);
        $this->assertSame('LEGACY-001', $record->reference);
    }
}
