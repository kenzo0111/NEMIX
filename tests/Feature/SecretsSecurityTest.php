<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecretsSecurityTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Test that direct env() function calls are not present in app/ directory.
     */
    public function test_no_direct_env_calls_in_app_directory(): void
    {
        $appPath = app_path();
        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($appPath)
        );

        $violations = [];

        foreach ($files as $file) {
            if ($file->isDir() || $file->getExtension() !== 'php') {
                continue;
            }

            $content = file_get_contents($file->getPathname());
            if (preg_match('/\benv\(/', $content)) {
                $violations[] = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file->getPathname());
            }
        }

        $this->assertEmpty(
            $violations,
            'Direct env() calls found in app/ directory (use config() instead for config:cache safety): ' . implode(', ', $violations)
        );
    }

    /**
     * Test that Inertia shared props do not leak sensitive environment secrets to the frontend.
     */
    public function test_inertia_shared_props_do_not_leak_sensitive_secrets(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertStatus(200);

        $pageProps = $response->original->getData()['page']['props'];

        $jsonProps = json_encode($pageProps);

        $sensitiveTerms = [
            config('database.connections.pgsql.password'),
            config('mail.mailers.smtp.password'),
            config('services.resend.key'),
            config('services.postmark.key'),
            config('services.ses.secret'),
        ];

        foreach ($sensitiveTerms as $secret) {
            if (!empty($secret)) {
                $this->assertStringNotContainsString(
                    $secret,
                    $jsonProps,
                    'Sensitive credential leaked in Inertia frontend props!'
                );
            }
        }
    }

    /**
     * Test that .env file is gitignored.
     */
    public function test_env_file_is_gitignored(): void
    {
        $gitignorePath = base_path('.gitignore');
        $this->assertFileExists($gitignorePath);

        $gitignoreContent = file_get_contents($gitignorePath);

        $this->assertMatchesRegularExpression('/^\.env$/m', $gitignoreContent, '.env must be strictly ignored in .gitignore');
    }
}
