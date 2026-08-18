<?php

namespace Tests\Feature;

use App\Models\User;
use App\Rules\SafeFileUploadRule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Validator;
use Modules\Inventory\Models\Item;
use Modules\Suppliers\Models\Supplier;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class InputValidationAndSanitizationTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        Role::firstOrCreate(['name' => 'System Admin']);
        Role::firstOrCreate(['name' => 'Staff']);

        $this->admin = User::factory()->create();
        $this->admin->assignRole('System Admin');

        $this->user = User::factory()->create();
        $this->user->assignRole('Staff');
    }

    public function test_sanitize_input_middleware_strips_script_tags(): void
    {
        $response = $this->actingAs($this->admin)->post('/suppliers', [
            'name' => '<script>alert("xss")</script>Test Supplier',
            'tin' => '111-222-333-000',
            'address' => '123 Main St',
            'reg_number' => 'REG-999',
            'category' => 'Hardware',
            'status' => 'active',
            'amount' => 500,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('suppliers', [
            'name' => 'alert("xss")Test Supplier',
        ]);
    }

    public function test_dashboard_query_parameters_validation(): void
    {
        // Valid query params
        $validResponse = $this->actingAs($this->admin)->get('/dashboard?chart_filter=monthly&start_date=2026-01-01&end_date=2026-01-31');
        $validResponse->assertStatus(200);

        // Invalid chart filter
        $invalidResponse = $this->actingAs($this->admin)->get('/dashboard?chart_filter=invalid_filter');
        $invalidResponse->assertSessionHasErrors(['chart_filter']);

        // Invalid date format
        $invalidDateResponse = $this->actingAs($this->admin)->get('/dashboard?start_date=not-a-date');
        $invalidDateResponse->assertSessionHasErrors(['start_date']);
    }

    public function test_rfid_scanner_parameter_validation(): void
    {
        // Valid lookup format
        $validLookup = $this->actingAs($this->admin)->getJson('/rfid-scanner/lookup/RFID-12345');
        $validLookup->assertStatus(404); // Not found, but format was valid

        // Invalid lookup format with script/SQL injection symbols
        $invalidLookup = $this->actingAs($this->admin)->getJson('/rfid-scanner/lookup/INVALID!TAG<script>');
        $invalidLookup->assertStatus(422)
            ->assertJson(['found' => false, 'message' => 'Invalid RFID tag format.']);
    }

    public function test_safe_file_upload_rule_rejects_unsafe_files(): void
    {
        $rule = new SafeFileUploadRule();

        // 1. Executable file .php
        $phpFile = UploadedFile::fake()->create('malicious.php', 10, 'text/plain');
        $validator = Validator::make(['file' => $phpFile], ['file' => [$rule]]);
        $this->assertTrue($validator->fails());

        // 2. Hidden executable double extension .php.png
        $doubleExtFile = UploadedFile::fake()->create('image.php.png', 10, 'image/png');
        $validator2 = Validator::make(['file' => $doubleExtFile], ['file' => [$rule]]);
        $this->assertTrue($validator2->fails());

        // 3. Valid safe PDF file
        $pdfFile = UploadedFile::fake()->create('document.pdf', 100, 'application/pdf');
        $validator3 = Validator::make(['file' => $pdfFile], ['file' => [$rule]]);
        $this->assertFalse($validator3->fails());
    }

    public function test_supplier_creation_rejects_invalid_status_and_data_types(): void
    {
        $response = $this->actingAs($this->admin)->post('/suppliers', [
            'name' => 'Safe Supplier',
            'tin' => '123-456-789-000',
            'address' => '123 Main St',
            'reg_number' => 'REG-100',
            'category' => 'Hardware',
            'status' => 'invalid_status_type', // Invalid status enum
            'amount' => -100, // Invalid negative amount
        ]);

        $response->assertSessionHasErrors(['status', 'amount']);
    }

    public function test_inventory_creation_rejects_negative_stock(): void
    {
        $supplier = Supplier::create([
            'name' => 'Supplier 1',
            'tin' => 'TIN-001',
            'address' => 'Address 1',
            'reg_number' => 'REG-001',
            'category' => 'Cat 1',
            'status' => 'active',
            'created_by' => $this->admin->id,
        ]);

        $response = $this->actingAs($this->admin)->post('/inventories', [
            'name' => 'Item 1',
            'supplier_id' => $supplier->id,
            'stock' => -5, // Invalid negative stock
            'status' => 'Available',
        ]);

        $response->assertSessionHasErrors(['stock']);
    }
}
