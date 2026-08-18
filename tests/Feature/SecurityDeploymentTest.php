<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Log;
use Tests\TestCase;

class SecurityDeploymentTest extends TestCase
{
    use RefreshDatabase;

    public function test_response_includes_security_headers(): void
    {
        $response = $this->get('/');

        $response->assertHeader('Strict-Transport-Security');
        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'SAMEORIGIN');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
        $response->assertHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->assertHeader('Content-Security-Policy');
    }

    public function test_successful_login_logs_security_event(): void
    {
        Log::shouldReceive('channel')
            ->with('security')
            ->atLeast()->once()
            ->andReturnSelf();

        Log::shouldReceive('log')
            ->atLeast()->once();

        $user = User::factory()->create([
            'password' => bcrypt('Password123!@#'),
        ]);

        $this->post('/login', [
            'email' => $user->email,
            'password' => 'Password123!@#',
        ]);
    }

    public function test_failed_login_logs_security_event(): void
    {
        Log::shouldReceive('channel')
            ->with('security')
            ->atLeast()->once()
            ->andReturnSelf();

        Log::shouldReceive('log')
            ->atLeast()->once();

        $this->post('/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'WrongPassword123!',
        ]);
    }

    public function test_suspicious_path_traversal_request_logs_warning(): void
    {
        Log::shouldReceive('channel')
            ->with('security')
            ->atLeast()->once()
            ->andReturnSelf();

        Log::shouldReceive('warning')
            ->atLeast()->once();

        $this->get('/?file=../../etc/passwd');
    }

    public function test_sensitive_path_probe_logs_warning(): void
    {
        Log::shouldReceive('channel')
            ->with('security')
            ->atLeast()->once()
            ->andReturnSelf();

        Log::shouldReceive('warning')
            ->atLeast()->once();

        $this->get('/.env');
    }

    public function test_force_https_redirects_http_requests(): void
    {
        config(['app.force_https' => true]);

        $response = $this->get('http://localhost/login');

        $response->assertRedirect('https://localhost/login');
    }
}
