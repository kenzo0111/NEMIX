<?php

namespace Tests\Feature\AccessControl;

use App\Models\DeliveryUnitHead;
use App\Models\Signatory;
use App\Models\User;
use Database\Seeders\CollegeDeanSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CollegeDeanAutofillTest extends TestCase
{
    use RefreshDatabase;

    private const CCMS = 'College of Computing and Multimedia Studies (CCMS) - Main Campus';
    private const ENGINEERING = 'College of Engineering - Main Campus';

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
        $user->assignRole($role);
        return $user;
    }

    public function test_seed_contains_ten_colleges_and_is_idempotent(): void
    {
        $this->seed(CollegeDeanSeeder::class);
        $this->seed(CollegeDeanSeeder::class);
        $this->assertSame(10, Signatory::count());
        $this->assertSame(10, DeliveryUnitHead::count());
        $departments = collect(config('university.divisions'))->flatMap(fn ($group) => $group['options'])->pluck('value');
        foreach (DeliveryUnitHead::with('officeHead')->get() as $mapping) {
            $this->assertContains($mapping->department, $departments);
            $this->assertSame('DEAN', $mapping->officeHead->designation);
            $this->assertSame(mb_strtoupper($mapping->officeHead->name), $mapping->officeHead->name);
            $this->assertDoesNotMatchRegularExpression('/^(Dr|Engr)\./i', $mapping->officeHead->name);
        }
        $this->assertSame('JOSELITO A. OLALO', DeliveryUnitHead::where('department', self::ENGINEERING)->firstOrFail()->officeHead->name);
    }

    public function test_seed_reuses_existing_person_and_preserves_verified_details_and_mapping(): void
    {
        $head = Signatory::create(['name' => 'Joselito A. Olalo', 'designation' => 'Verified Dean designation', 'is_active' => true]);
        $this->seed(CollegeDeanSeeder::class);
        $mapping = DeliveryUnitHead::where('department', self::ENGINEERING)->firstOrFail();
        $this->assertSame($head->id, $mapping->office_head_id);
        $this->assertSame('Verified Dean designation', $head->fresh()->designation);
        $override = Signatory::create(['name' => 'Administrator Verified Head', 'designation' => 'Acting Dean', 'is_active' => true]);
        $mapping->update(['office_head_id' => $override->id]);
        $this->seed(CollegeDeanSeeder::class);
        $this->assertSame($override->id, $mapping->fresh()->office_head_id);
        $this->assertSame(11, Signatory::count());
    }

    public function test_staff_page_exposes_dean_mapping_and_saving_department_autofills_head(): void
    {
        $this->seed(CollegeDeanSeeder::class);
        $admin = $this->user('System Admin');
        $staff = $this->user('Supply Coordinator');
        $head = DeliveryUnitHead::where('department', self::CCMS)->firstOrFail()->officeHead;
        $this->actingAs($admin)->get(route('access-control.staffs'))->assertInertia(fn ($page) => $page
            ->where('departmentHeads', fn ($mappings) => $mappings[self::CCMS] === $head->id));
        $this->put(route('access-control.staffs.update', $staff), [
            'name' => $staff->name, 'email' => $staff->email, 'role' => 'Supply Coordinator', 'department' => self::CCMS,
        ])->assertSessionHasNoErrors();
        $this->assertSame($head->id, $staff->fresh()->office_head_id);

        // The assigned dean then fills the request and its saved signatory fields.
        $item = Item::create(['name' => 'Paper', 'sku' => 'DEAN-PAPER', 'stock' => 5, 'unit_cost' => 1, 'amount' => 5, 'status' => 'Available']);
        $this->actingAs($staff->fresh())->post(route('inventory.requests.store'), [
            'purpose' => 'College operations', 'items' => [['item_id' => $item->id, 'quantity' => 1]],
        ])->assertSessionHasNoErrors();
        $request = SupplyRequest::firstOrFail();
        $this->assertSame(self::CCMS, $request->department);
        $this->assertSame('DANIEL E. MALIGAT JR.', $request->recipient);
        $this->assertSame('DEAN', $request->recipient_designation);
    }

    public function test_changing_unit_uses_new_dean_but_same_unit_keeps_verified_assignment(): void
    {
        $this->seed(CollegeDeanSeeder::class);
        $admin = $this->user('System Admin');
        $staff = $this->user('Supply Coordinator');
        $override = Signatory::create(['name' => 'Verified Acting Dean', 'designation' => 'Acting Dean', 'is_active' => true]);
        $staff->update(['department' => self::CCMS, 'office_head_id' => $override->id]);
        $payload = ['name' => $staff->name, 'email' => $staff->email, 'role' => 'Supply Coordinator', 'department' => self::CCMS];
        $this->actingAs($admin)->put(route('access-control.staffs.update', $staff), $payload)->assertSessionHasNoErrors();
        $this->assertSame($override->id, $staff->fresh()->office_head_id);
        $payload['department'] = self::ENGINEERING;
        $this->put(route('access-control.staffs.update', $staff), $payload)->assertSessionHasNoErrors();
        $this->assertSame(DeliveryUnitHead::where('department', self::ENGINEERING)->firstOrFail()->office_head_id, $staff->fresh()->office_head_id);
    }

    public function test_unknown_and_inactive_heads_require_an_explicit_active_assignment(): void
    {
        $this->seed(CollegeDeanSeeder::class);
        $admin = $this->user('System Admin');
        $staff = $this->user('Supply Coordinator');
        $payload = ['name' => $staff->name, 'email' => $staff->email, 'role' => 'Supply Coordinator', 'department' => 'Unknown Office'];
        $this->actingAs($admin)->put(route('access-control.staffs.update', $staff), $payload)->assertSessionHasErrors('office_head_id');
        DeliveryUnitHead::where('department', self::CCMS)->firstOrFail()->officeHead->update(['is_active' => false]);
        $payload['department'] = self::CCMS;
        $this->put(route('access-control.staffs.update', $staff), $payload)->assertSessionHasErrors('office_head_id');
        $this->assertArrayNotHasKey(self::CCMS, DeliveryUnitHead::activeAssignments());
    }

    public function test_formatting_existing_deans_keeps_assignments_and_historical_requests(): void
    {
        $this->seed(CollegeDeanSeeder::class);
        $head = DeliveryUnitHead::where('department', self::CCMS)->firstOrFail()->officeHead;
        $head->update(['name' => 'Dr. Daniel E. Maligat Jr.', 'designation' => 'Dean, College of Computing and Multimedia Studies']);
        $staff = $this->user('Supply Coordinator');
        $staff->update(['department' => self::CCMS, 'office_head_id' => $head->id]);
        $request = SupplyRequest::create(['requested_by' => $staff->id, 'department' => self::CCMS,
            'recipient' => $head->name, 'recipient_designation' => $head->designation, 'purpose' => 'Historical request', 'status' => 'Pending']);
        $other = Signatory::create(['name' => 'Dr. Other Officer', 'designation' => 'Medical Officer']);
        $migration = require database_path('migrations/2026_10_22_000004_format_delivery_unit_dean_names.php');
        $migration->up();
        $migration->up();
        $this->assertSame('DANIEL E. MALIGAT JR.', $head->fresh()->name);
        $this->assertSame('daniel e maligat jr', $head->fresh()->normalized_name);
        $this->assertSame('DEAN', $head->fresh()->designation);
        $this->assertSame($head->id, $staff->fresh()->office_head_id);
        $this->assertSame('Dr. Daniel E. Maligat Jr.', $request->fresh()->recipient);
        $this->assertSame('Dean, College of Computing and Multimedia Studies', $request->fresh()->recipient_designation);
        $this->assertSame('Dr. Other Officer', $other->fresh()->name);
        $this->assertSame('Medical Officer', $other->fresh()->designation);
    }
}
