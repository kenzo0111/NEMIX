<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SanitizeInput
{
    /**
     * Keys that should NOT be modified (e.g., passwords).
     */
    protected array $except = [
        'password',
        'password_confirmation',
        'current_password',
        'secret',
        'token',
        '_token',
    ];

    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();
        $sanitized = $this->cleanArray($input);
        $request->merge($sanitized);

        return $next($request);
    }

    /**
     * Clean array values recursively.
     */
    protected function cleanArray(array $input): array
    {
        foreach ($input as $key => $value) {
            if (in_array($key, $this->except, true)) {
                continue;
            }

            if (is_array($value)) {
                $input[$key] = $this->cleanArray($value);
            } elseif (is_string($value)) {
                $input[$key] = $this->cleanString($value);
            }
        }

        return $input;
    }

    /**
     * Clean a string value against XSS and injection.
     */
    protected function cleanString(string $value): string
    {
        $trimmed = trim($value);

        // Strip HTML and PHP tags
        $stripped = strip_tags($trimmed);

        // Remove dangerous pseudo-protocols like javascript: or vbscript:
        $cleaned = preg_replace('/javascript\s*:/i', '', $stripped);
        $cleaned = preg_replace('/vbscript\s*:/i', '', $cleaned);

        // Remove inline event handlers like onerror= or onload=
        $cleaned = preg_replace('/on[a-z]+\s*=/i', '', $cleaned);

        return $cleaned;
    }
}
