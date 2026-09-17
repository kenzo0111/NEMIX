<?php

namespace Tests\Feature\AccessControl;

use App\Models\User;
use App\Notifications\StaffRegistrationInvitation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ManageStaffInvitationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        Role::create(['name' => 'System Admin']);
        Role::create(['name' => 'Property Staff']);
    }

    public function test_staff_creation_sends_registration_invitation_email(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('System Admin');

        $response = $this->actingAs($admin)->post(route('access-control.staffs.store'), [
            'name' => 'Invited Staff',
            'email' => 'invited.staff@example.com',
            'role' => 'Property Staff',
        ]);

        $response->assertRedirect();

        $staff = User::where('email', 'invited.staff@example.com')->first();

        $this->assertNotNull($staff);
        $this->assertFalse($staff->is_active);
        $this->assertTrue($staff->hasRole('Property Staff'));

        Notification::assertSentTo(
            [$staff],
            StaffRegistrationInvitation::class,
            function (StaffRegistrationInvitation $notification) use ($staff) {
                $mailMessage = $notification->toMail($staff);

                $this->assertStringContainsString('/register-invitation/', $mailMessage->actionUrl ?? '');
                $this->assertStringContainsString(urlencode($staff->email), $mailMessage->actionUrl ?? '');

                return true;
            }
        );
    }

    public function test_staff_creation_handles_mailer_exception_gracefully_without_500_error(): void
    {
        Notification::shouldReceive('send')
            ->andThrow(new \Exception('SMTP Connection failed'));

        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('System Admin');

        $response = $this->actingAs($admin)->post(route('access-control.staffs.store'), [
            'name' => 'Offline Staff',
            'email' => 'offline.staff@example.com',
            'role' => 'Property Staff',
        ]);

        $response->assertRedirect();
        $response->assertSessionHas('warning');

        $staff = User::where('email', 'offline.staff@example.com')->first();
        $this->assertNotNull($staff);
        $this->assertFalse($staff->is_active);
    }

    public function test_admin_can_resend_staff_invitation(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);
        $admin->assignRole('System Admin');

        $staff = User::factory()->create([
            'is_active' => false,
        ]);
        $staff->assignRole('Property Staff');

        $response = $this->actingAs($admin)->post(route('access-control.staffs.resend-invitation', $staff->id));

        $response->assertRedirect();
        $response->assertSessionHas('success');

        Notification::assertSentTo([$staff], StaffRegistrationInvitation::class);
    }
}
