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

    public function test_staff_creation_sends_registration_invitation_email(): void
    {
        Notification::fake();

        Role::create(['name' => 'Property Staff']);

        $admin = User::factory()->create([
            'email_verified_at' => now(),
        ]);

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
}
