<?php

namespace Tests\Feature\Inventory;

use App\Models\Signatory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class CoordinatorDepartmentAssignmentTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    private function user(string $role = 'Supply Coordinator'): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true, 'email_verified_at' => now()]);
        $user->assignRole($role);
        return $user;
    }

    private function officeHead(string $name = 'Finance Head'): Signatory
    {
        return Signatory::create(['name' => $name, 'designation' => 'Department Head', 'department' => 'Finance', 'is_active' => true]);
    }

    private function payload(): array
    {
        $item = Item::create(['name' => 'Paper', 'sku' => 'PAPER-'.Item::count(), 'stock' => 10,
            'unit_cost' => 10, 'amount' => 100, 'status' => 'Available', 'unit_of_issue' => 'ream']);

        return ['department' => 'Spoofed Department', 'recipient' => 'Spoofed Head',
            'recipient_designation' => 'Spoofed Designation', 'purpose' => 'Office work',
            'items' => [['item_id' => $item->id, 'quantity' => 1]]];
    }

    public function test_admin_assigns_unit_and_head_and_staff_directory_identifies_them(): void
    {
        $admin = $this->user('System Admin');
        $coordinator = $this->user();
        $head = $this->officeHead();
        $this->actingAs($admin)->put(route('access-control.staffs.update', $coordinator), [
            'name' => $coordinator->name, 'email' => $coordinator->email, 'role' => 'Supply Coordinator',
            'department' => 'Finance', 'office_head_id' => $head->id,
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseHas('users', ['id' => $coordinator->id, 'department' => 'Finance', 'office_head_id' => $head->id]);
        $this->get(route('access-control.staffs'))->assertInertia(function ($page) use ($coordinator, $head) {
            $page->where('staffs', fn ($staffs) => collect($staffs)->contains(fn ($staff) =>
                $staff['id'] === $coordinator->id && $staff['department'] === 'Finance'
                && $staff['office_head']['name'] === $head->name));
        });
    }

    public function test_admin_invitation_saves_assignment_and_requires_it_for_coordinators(): void
    {
        Notification::fake();
        $admin = $this->user('System Admin');
        $this->user();
        $head = $this->officeHead();
        $payload = ['name' => 'New Coordinator', 'email' => 'new@example.com', 'role' => 'Supply Coordinator'];
        $this->actingAs($admin)->post(route('access-control.staffs.store'), $payload)
            ->assertSessionHasErrors(['department', 'office_head_id']);
        $this->post(route('access-control.staffs.store'), $payload + ['department' => 'Finance', 'office_head_id' => $head->id])
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('users', ['email' => 'new@example.com', 'department' => 'Finance', 'office_head_id' => $head->id]);
    }

    public function test_request_autofill_uses_assignment_and_ignores_spoofed_values(): void
    {
        $user = $this->user();
        $head = $this->officeHead();
        $user->update(['department' => 'Finance', 'office_head_id' => $head->id]);
        $this->actingAs($user)->get(route('inventory.requests.index'))->assertInertia(fn ($page) => $page
            ->where('departmentAssignment.department', 'Finance')->where('departmentAssignment.recipient', $head->name)
            ->where('departmentAssignment.recipient_designation', 'Department Head')->where('departmentAssignment.ready', true));
        $payload = $this->payload();
        $this->post(route('inventory.requests.store'), $payload)->assertSessionHasNoErrors();
        $request = SupplyRequest::firstOrFail();
        $this->assertSame($user->id, $request->requested_by);
        $this->assertSame('Finance', $request->department);
        $this->assertSame($head->name, $request->recipient);
        $this->assertSame('Department Head', $request->recipient_designation);

        // A later transfer and head change must not relabel an earlier request.
        $user->update(['department' => 'HR', 'office_head_id' => $this->officeHead('HR Head')->id]);
        $this->put(route('inventory.requests.update', $request), $payload)->assertSessionHasNoErrors();
        $request->refresh();
        $this->assertSame('Finance', $request->department);
        $this->assertSame('Finance Head', $request->recipient);
        $this->assertSame('Department Head', $request->recipient_designation);
    }

    public function test_coordinators_without_complete_active_assignment_cannot_submit(): void
    {
        $user = $this->user();
        $payload = $this->payload();
        $this->actingAs($user)->post(route('inventory.requests.store'), $payload)->assertSessionHasErrors('department');
        $head = $this->officeHead();
        $user->update(['department' => 'Finance', 'office_head_id' => $head->id]);
        $head->update(['is_active' => false]);
        $this->post(route('inventory.requests.store'), $payload)->assertSessionHasErrors('department');
        $head->update(['is_active' => true, 'designation' => '']);
        $this->post(route('inventory.requests.store'), $payload)->assertSessionHasErrors('department');
        $this->assertSame(0, SupplyRequest::count());
    }

    public function test_coordinator_cannot_change_own_assignment_through_staff_endpoint(): void
    {
        $user = $this->user();
        $this->actingAs($user)->put(route('access-control.staffs.update', $user), [
            'name' => $user->name, 'email' => $user->email, 'role' => 'Supply Coordinator',
            'department' => 'Unauthorized Office', 'office_head_id' => $this->officeHead()->id,
        ])->assertForbidden();
        $this->assertNull($user->fresh()->department);
    }

    public function test_different_units_share_one_role_but_requests_remain_private(): void
    {
        $first = $this->user();
        $second = $this->user();
        $first->update(['department' => 'Finance', 'office_head_id' => $this->officeHead()->id]);
        $second->update(['department' => 'HR', 'office_head_id' => $this->officeHead('HR Head')->id]);
        $this->actingAs($first)->post(route('inventory.requests.store'), $this->payload())->assertSessionHasNoErrors();
        $this->actingAs($second)->get(route('inventory.requests.index'))->assertInertia(fn ($page) => $page
            ->has('requests', 0)->where('departmentAssignment.department', 'HR')->where('departmentAssignment.recipient', 'HR Head'));
    }
}
