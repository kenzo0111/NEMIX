<?php

namespace Tests\Feature\Inventory;

use App\Models\CoordinatorStock;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Modules\AuditLogs\Models\TransactionTrail;
use Modules\Inventory\Models\Item;
use Modules\Inventory\Models\SupplyRequest;
use Modules\Inventory\Models\SupplyRequestAlert;
use Modules\Inventory\Services\SupplyRequestService;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthorizedPersonnelWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
        Storage::fake('local');
    }

    private function user(string $role = 'Authorized Personnel'): User
    {
        Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        $user = User::factory()->create(['is_active' => true]);
        $user->assignRole($role);
        if ($user->usesCoordinatorInventory()) {
            $head = \App\Models\Signatory::firstOrCreate(['name' => 'Registrar Office Head'], ['designation' => 'Office Head', 'is_active' => true]);
            $user->update(['department' => 'Registrar', 'office_head_id' => $head->id]);
        }
        return $user;
    }

    private function payload(): array
    {
        $item = Item::create(['name' => 'Paper', 'sku' => 'PAPER-'.Item::count(), 'stock' => 50,
            'unit_cost' => 10, 'amount' => 500, 'status' => 'Available', 'unit_of_issue' => 'ream']);
        return ['department' => 'Research', 'purpose' => 'Approved study',
            'items' => [['item_id' => $item->id, 'quantity' => 5]]];
    }

    private function document(): UploadedFile
    {
        return UploadedFile::fake()->createWithContent('approved-letter.pdf', "%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF");
    }

    private function submit(User $user): SupplyRequest
    {
        $this->actingAs($user)->post(route('inventory.requests.store'), $this->payload() + [
            'supporting_document_type' => 'Approved Letter', 'supporting_document' => $this->document(),
        ])->assertSessionHasNoErrors()->assertRedirect(route('inventory.requests.index'));
        return SupplyRequest::latest('id')->firstOrFail();
    }

    public function test_role_reuses_coordinator_dashboard_catalog_and_account_scope(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $request = $this->submit($owner);
        $this->assertTrue($owner->usesCoordinatorInventory());
        $this->actingAs($owner)->get(route('dashboard'))->assertOk()->assertInertia(fn ($page) => $page
            ->component('Dashboard')->where('inventoryScope', 'coordinator')->where('auth.capabilities.requiresSupportingDocument', true));
        $this->get(route('coordinator.catalog.index'))->assertOk();
        $this->get(route('inventory.index'))->assertForbidden();
        $this->actingAs($other)->get(route('inventory.requests.index'))->assertInertia(fn ($page) => $page->has('requests', 0));
        $this->put(route('inventory.requests.update', $request), $this->payload())->assertForbidden();
    }

    public function test_document_and_type_are_required_without_creating_a_request(): void
    {
        $this->actingAs($this->user())->post(route('inventory.requests.store'), $this->payload())
            ->assertSessionHasErrors(['supporting_document', 'supporting_document_type']);
        $this->assertDatabaseCount('supply_requests', 0);
        $this->assertSame([], Storage::disk('local')->allFiles());
    }

    public function test_invalid_types_extensions_and_oversized_files_are_rejected(): void
    {
        $user = $this->user();
        $payload = $this->payload();
        $disguised = UploadedFile::fake()->createWithContent('payload.tmp', '<?php echo 1;');
        foreach ([UploadedFile::fake()->create('script.php', 2, 'text/plain'),
            UploadedFile::fake()->create('letter.pdf', 10241, 'application/pdf'),
            new UploadedFile($disguised->getPathname(), 'disguised.pdf', 'application/pdf', null, true)] as $file) {
            $this->actingAs($user)->post(route('inventory.requests.store'), $payload + [
                'supporting_document_type' => 'Approved MOA', 'supporting_document' => $file,
            ])->assertSessionHasErrors('supporting_document');
        }
        $this->post(route('inventory.requests.store'), $payload + [
            'supporting_document_type' => 'RIS', 'supporting_document' => $this->document(),
        ])->assertSessionHasErrors('supporting_document_type');
        $this->assertDatabaseCount('supply_requests', 0);
    }

    public function test_all_supported_formats_and_document_types_can_be_submitted(): void
    {
        $owner = $this->user();
        foreach ([['pdf', 'application/pdf', 'Approved MOA'], ['jpg', 'image/jpeg', 'Approved Research'],
            ['jpeg', 'image/jpeg', 'Approved Letter'], ['png', 'image/png', 'Others']] as [$extension, $mime, $type]) {
            $this->actingAs($owner)->post(route('inventory.requests.store'), $this->payload() + [
                'supporting_document_type' => $type,
                'supporting_document' => UploadedFile::fake()->create('approved.'.$extension, 32, $mime),
            ])->assertRedirect()->assertSessionHasNoErrors();
            $this->assertSame('Pending Verification', SupplyRequest::latest('id')->firstOrFail()->status);
        }
        $this->assertDatabaseCount('supply_requests', 4);
    }

    public function test_private_document_can_only_be_viewed_by_owner_or_authorized_staff(): void
    {
        $owner = $this->user();
        $other = $this->user();
        $custodian = $this->user('Property Custodian');
        $request = $this->submit($owner);
        Storage::disk('local')->assertExists($request->supporting_document_path);
        $this->assertSame('Pending Verification', $request->status);
        $this->assertArrayNotHasKey('supporting_document_path', $request->toArray());
        $this->actingAs($owner)->get(route('inventory.requests.document', $request))->assertOk()->assertDownload('approved-letter.pdf');
        $this->actingAs($custodian)->get(route('inventory.requests.document', ['supplyRequest' => $request, 'inline' => 1]))
            ->assertOk()->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->actingAs($other)->get(route('inventory.requests.document', $request))->assertForbidden();
        $this->actingAs($this->user('Unrelated'))->get(route('inventory.requests.document', $request))->assertForbidden();
    }

    public function test_unverified_document_cannot_be_approved_released_or_marked_ready(): void
    {
        $request = $this->submit($this->user());
        $custodian = $this->user('Property Custodian');
        $line = $request->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.approve', $request), ['approved_quantities' => [$line->id => 5]])->assertSessionHasErrors('request');
        $this->post(route('inventory.requests.ready', $request))->assertSessionHasErrors('request');
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertSessionHasErrors('request');
        $this->assertSame(0, SupplyRequestService::reservedQuantity($line->item_id));
        $this->assertDatabaseCount('issuances', 0);

        // A corrupted or manually advanced status must not bypass document checks.
        $request->update(['status' => 'Under Review']);
        $this->post(route('inventory.requests.approve', $request), ['approved_quantities' => [$line->id => 5]])->assertSessionHasErrors('request');
        $request->update(['status' => 'Ready for Pickup']);
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertSessionHasErrors('request');
    }

    public function test_verification_approval_pickup_and_release_preserve_stock_and_ris_workflow(): void
    {
        $owner = $this->user();
        $custodian = $this->user('Property Custodian');
        $request = $this->submit($owner);
        $line = $request->items()->firstOrFail();
        $this->actingAs($custodian)->post(route('inventory.requests.verify-document', $request), ['decision' => 'verified', 'remarks' => 'Signed approval confirmed.'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Under Review', $request->fresh()->status);
        $this->assertSame($custodian->id, $request->fresh()->document_verified_by);
        $this->assertNotNull($request->fresh()->document_verified_at);
        $this->post(route('inventory.requests.approve', $request), ['approved_quantities' => [$line->id => 5]])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Approved', $request->fresh()->status);
        $this->assertSame(5, SupplyRequestService::reservedQuantity($line->item_id));
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertSessionHasErrors('request');
        $this->post(route('inventory.requests.ready', $request))->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Ready for Pickup', $request->fresh()->status);
        $this->assertSame(5, SupplyRequestService::reservedQuantity($line->item_id));
        $this->actingAs($owner)->get(route('inventory.request-alerts.index'))->assertOk()->assertJsonPath('alerts.0.status', 'Ready for Pickup');
        $this->assertTrue(SupplyRequestAlert::where('user_id', $owner->id)->where('supply_request_id', $request->id)->exists());
        $this->actingAs($custodian)->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('Released', $request->fresh()->status);
        $this->assertSame(45, $line->item->fresh()->stock);
        $this->assertSame(0, SupplyRequestService::reservedQuantity($line->item_id));
        $this->assertSame(5, CoordinatorStock::where('coordinator_id', $owner->id)->value('quantity'));
        $this->assertSame($request->ris_number, $request->fresh()->issuance->ris_number);
        $this->post(route('inventory.requests.release', $request), ['signed_ris_presented' => true])->assertSessionHasErrors('request');
        $this->assertDatabaseCount('issuances', 1);
        $this->actingAs($owner)->get(route('inventory.requests.ris-pdf', $request))->assertOk()->assertHeader('content-type', 'application/pdf');
    }

    public function test_correction_requires_remarks_and_replacement_resets_verification_with_audit(): void
    {
        $owner = $this->user();
        $custodian = $this->user('Property Custodian');
        $request = $this->submit($owner);
        $oldPath = $request->supporting_document_path;
        $this->actingAs($custodian)->post(route('inventory.requests.verify-document', $request), ['decision' => 'correction'])->assertSessionHasErrors('remarks');
        $this->post(route('inventory.requests.verify-document', $request), ['decision' => 'correction', 'remarks' => 'Missing signature.'])->assertRedirect()->assertSessionHasNoErrors();
        $this->assertSame('For Correction', $request->fresh()->status);
        $this->assertTrue(TransactionTrail::where('subject_id', (string) $request->id)->get()->contains(fn ($trail) => ($trail->metadata['document_remarks'] ?? null) === 'Missing signature.'));
        $line = $request->items()->firstOrFail();
        $this->actingAs($owner)->post(route('inventory.requests.update', $request), [
            '_method' => 'put', 'department' => $request->department, 'purpose' => $request->purpose,
            'items' => [['item_id' => $line->item_id, 'quantity' => 5]],
            'supporting_document_type' => 'Approved MOA', 'supporting_document' => $this->document(),
        ])->assertRedirect()->assertSessionHasNoErrors();
        $request->refresh();
        $this->assertSame('Pending Verification', $request->status);
        $this->assertNull($request->document_verified_at);
        $this->assertNull($request->document_verified_by);
        Storage::disk('local')->assertMissing($oldPath);
        Storage::disk('local')->assertExists($request->supporting_document_path);
    }

    public function test_failed_edit_cleans_new_upload_and_preserves_existing_document(): void
    {
        $owner = $this->user();
        $request = $this->submit($owner);
        $oldPath = $request->supporting_document_path;
        $request->update(['status' => 'Approved']);
        $this->actingAs($owner)->put(route('inventory.requests.update', $request), $this->payload() + [
            'supporting_document_type' => 'Approved Letter', 'supporting_document' => $this->document(),
        ])->assertSessionHasErrors('request');
        $this->assertSame([$oldPath], Storage::disk('local')->allFiles('supporting-documents'));
    }

    public function test_requester_cannot_verify_or_bypass_requirement_after_role_change(): void
    {
        $owner = $this->user();
        $request = $this->submit($owner);
        $this->actingAs($owner)->post(route('inventory.requests.verify-document', $request), ['decision' => 'verified'])->assertForbidden();
        $owner->syncRoles(['Supply Coordinator']);
        $this->actingAs($owner)->put(route('inventory.requests.update', $request), $this->payload())->assertSessionHasErrors('supporting_document_type');
        $this->assertTrue($request->fresh()->requires_supporting_document);
    }

    public function test_approval_permission_alone_does_not_authorize_document_verification(): void
    {
        $request = $this->submit($this->user());
        $staff = $this->user('Limited reviewer');
        $staff->givePermissionTo(Permission::findOrCreate('route:inventory.requests.approve', 'web'));
        $this->actingAs($staff)->post(route('inventory.requests.verify-document', $request), ['decision' => 'verified'])->assertForbidden();
    }

    public function test_production_inventory_staff_role_receives_document_processing_permissions(): void
    {
        $staff = $this->user('Inventory Staff');
        $migration = require database_path('migrations/2026_10_22_000002_add_document_review_permissions_to_inventory_staff.php');
        $migration->up();
        $staff->unsetRelation('roles');
        foreach (['document', 'verify-document', 'ready'] as $action) {
            $this->assertTrue($staff->hasPermissionTo('route:inventory.requests.'.$action));
        }
    }

    public function test_designated_verifier_can_review_without_inventory_approval_and_missing_files_cannot_be_verified(): void
    {
        $owner = $this->user();
        $request = $this->submit($owner);
        $verifier = $this->user('Document verifier');
        $verifier->givePermissionTo(Permission::findOrCreate('route:inventory.requests.verify-document', 'web'));
        $this->actingAs($verifier)->get(route('inventory.issuance'))->assertOk()->assertInertia(fn ($page) => $page->has('supplyRequests', 1));
        $this->get(route('inventory.requests.document', $request))->assertOk();
        $line = $request->items()->firstOrFail();
        $this->post(route('inventory.requests.approve', $request), ['approved_quantities' => [$line->id => 5]])->assertForbidden();
        Storage::disk('local')->delete($request->supporting_document_path);
        $this->post(route('inventory.requests.verify-document', $request), ['decision' => 'verified'])->assertSessionHasErrors('request');
        $this->assertSame('Pending Verification', $request->fresh()->status);
    }
}
