<?php

namespace Tests\Feature;

use App\Models\User;
use App\Notifications\DiagnosticTestNotification;
use App\Notifications\PasswordChangedSecurityNotification;
use App\Notifications\PasswordChangeOtpNotification;
use App\Notifications\StaffRegistrationInvitation;
use App\Notifications\VerifyEmailNotification;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class EmailTemplatesVisualTest extends TestCase
{
    use RefreshDatabase;

    protected User $user;
    protected string $previewDir;

    protected function setUp(): void
    {
        parent::setUp();

        $this->user = User::factory()->create([
            'name' => 'Vince Steven Balce',
            'email' => 'vince.balce@unc-nemix.com',
        ]);

        $this->previewDir = public_path('previews');
        if (!File::exists($this->previewDir)) {
            File::makeDirectory($this->previewDir, 0755, true);
        }
    }

    public function test_all_six_email_notifications_render_consistently(): void
    {
        // 1. Password Reset Request
        $token = '3b66d624833bda6e2fcf69f265bf283b66841030d394f064c4de91728c';
        $resetNotif = new ResetPassword($token);
        $resetMail = $resetNotif->toMail($this->user);
        $this->assertEquals('[UCN SPMO] Password Reset Request', $resetMail->subject);
        $resetHtml = (string) $resetMail->render();
        File::put($this->previewDir . '/email_1_password_reset.html', $resetHtml);

        $this->assertStringContainsString('Password Reset Request', $resetHtml);
        $this->assertStringContainsString('Hello Vince Steven Balce,', $resetHtml);
        $this->assertStringContainsString('Reset My Password', $resetHtml);
        $this->assertStringContainsString('This password reset link will expire in 60 minutes.', $resetHtml);
        $this->assertStringContainsString('icon-lock.png', $resetHtml);
        $this->assertStringContainsString('780', $resetHtml);

        // 2. Password Change OTP Code
        $otpNotif = new PasswordChangeOtpNotification('123456', 5);
        $otpMail = $otpNotif->toMail($this->user);
        $this->assertEquals('[UCN SPMO] Password Change Verification', $otpMail->subject);
        $otpHtml = (string) $otpMail->render();
        File::put($this->previewDir . '/email_2_otp_code.html', $otpHtml);

        $this->assertStringContainsString('Password Change Verification Code', $otpHtml);
        $this->assertStringContainsString('Use the verification code below', $otpHtml);
        $this->assertStringContainsString('otp-box', $otpHtml);
        $this->assertStringContainsString('This code will expire in 5 minutes.', $otpHtml);
        $this->assertStringContainsString('icon-shield.png', $otpHtml);

        // 3. Password Changed Security Alert
        $changedNotif = new PasswordChangedSecurityNotification('103.160.12.45');
        $changedMail = $changedNotif->toMail($this->user);
        $this->assertEquals('[UCN SPMO] Password Changed', $changedMail->subject);
        $changedHtml = (string) $changedMail->render();
        File::put($this->previewDir . '/email_3_password_changed.html', $changedHtml);

        $this->assertStringContainsString('Password Changed Successfully', $changedHtml);
        $this->assertStringContainsString('103.160.12.45', $changedHtml);
        $this->assertStringContainsString('Date &amp; Time', $changedHtml);
        $this->assertStringContainsString('If you did not make this change, please secure your account immediately', $changedHtml);
        $this->assertStringContainsString('icon-check.png', $changedHtml);

        // 4. Verify Email Address
        $verifyNotif = new VerifyEmailNotification();
        $verifyMail = $verifyNotif->toMail($this->user);
        $this->assertEquals('[UCN SPMO] Verify Email Address', $verifyMail->subject);
        $verifyHtml = (string) $verifyMail->render();
        File::put($this->previewDir . '/email_4_verify_email.html', $verifyHtml);

        $this->assertStringContainsString('Verify Your Email Address', $verifyHtml);
        $this->assertStringContainsString('Verify Email Address', $verifyHtml);
        $this->assertStringContainsString('This verification link will expire in 60 minutes.', $verifyHtml);
        $this->assertStringContainsString('icon-envelope.png', $verifyHtml);

        // 5. Staff Account Invitation
        $inviteNotif = new StaffRegistrationInvitation('3b66d624833bda6e2fcf69f265bf283b66841030d394f064c4de91728c');
        $inviteMail = $inviteNotif->toMail($this->user);
        $this->assertEquals('[UCN SPMO] Staff Account Invitation', $inviteMail->subject);
        $inviteHtml = (string) $inviteMail->render();
        File::put($this->previewDir . '/email_5_staff_invitation.html', $inviteHtml);

        $this->assertStringContainsString('Staff Account Invitation', $inviteHtml);
        $this->assertStringContainsString('Accept Invitation', $inviteHtml);
        $this->assertStringContainsString('This invitation link will expire in 60 minutes.', $inviteHtml);
        $this->assertStringContainsString('icon-user.png', $inviteHtml);

        // 6. SMTP Configuration Test
        $diagNotif = new DiagnosticTestNotification();
        $diagMail = $diagNotif->toMail($this->user);
        $this->assertEquals('[UCN SPMO] SMTP Configuration Test', $diagMail->subject);
        $diagHtml = (string) $diagMail->render();
        File::put($this->previewDir . '/email_6_smtp_test.html', $diagHtml);

        $this->assertStringContainsString('SMTP Configuration Test', $diagHtml);
        $this->assertStringContainsString('Email sent successfully.', $diagHtml);
        $this->assertStringContainsString('This confirms that your SMTP configuration is working as intended.', $diagHtml);
        $this->assertStringContainsString('icon-paperplane.png', $diagHtml);

        // Generate showcase HTML
        $showcaseHtml = <<<HTML
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>UCN SPMO Email Notifications Showcase</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f172a;
            color: #f8fafc;
            margin: 0;
            padding: 24px;
        }
        .header-title {
            text-align: center;
            margin-bottom: 28px;
        }
        .header-title h1 {
            color: #ffffff;
            margin: 0 0 6px 0;
            font-size: 24px;
        }
        .header-title p {
            color: #94a3b8;
            margin: 0;
            font-size: 13px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
            gap: 20px;
            max-width: 1750px;
            margin: 0 auto;
        }
        .card {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 8px;
            overflow: hidden;
        }
        .card-header {
            background: #1e293b;
            padding: 10px 16px;
            border-bottom: 1px solid #334155;
            font-weight: 600;
            font-size: 13px;
            color: #38bdf8;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .card-header span.badge {
            background: #9b111e;
            color: #ffffff;
            font-size: 10px;
            padding: 2px 7px;
            border-radius: 4px;
        }
        iframe {
            width: 100%;
            height: 750px;
            border: none;
            background: #f6f7f9;
        }
    </style>
</head>
<body>
    <div class="header-title">
        <h1>UCN SPMO Email Design System Showcase</h1>
        <p>Verified institutional email templates matching the visual design target</p>
    </div>
    <div class="grid">
        <div class="card">
            <div class="card-header">
                <span>1. Password Reset Request</span>
                <span class="badge">[UCN SPMO]</span>
            </div>
            <iframe src="email_1_password_reset.html"></iframe>
        </div>
        <div class="card">
            <div class="card-header">
                <span>2. Password Change Verification Code</span>
                <span class="badge">[UCN SPMO]</span>
            </div>
            <iframe src="email_2_otp_code.html"></iframe>
        </div>
        <div class="card">
            <div class="card-header">
                <span>3. Password Changed Successfully / Security Alert</span>
                <span class="badge">[UCN SPMO]</span>
            </div>
            <iframe src="email_3_password_changed.html"></iframe>
        </div>
        <div class="card">
            <div class="card-header">
                <span>4. Verify Your Email Address</span>
                <span class="badge">[UCN SPMO]</span>
            </div>
            <iframe src="email_4_verify_email.html"></iframe>
        </div>
        <div class="card">
            <div class="card-header">
                <span>5. Staff Account Invitation</span>
                <span class="badge">[UCN SPMO]</span>
            </div>
            <iframe src="email_5_staff_invitation.html"></iframe>
        </div>
        <div class="card">
            <div class="card-header">
                <span>6. SMTP Configuration Test</span>
                <span class="badge">[UCN SPMO]</span>
            </div>
            <iframe src="email_6_smtp_test.html"></iframe>
        </div>
    </div>
</body>
</html>
HTML;
        File::put($this->previewDir . '/showcase.html', $showcaseHtml);
    }
}
