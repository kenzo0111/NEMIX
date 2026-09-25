<?php

namespace App\Services;

class MailAssetService
{
    /**
     * Fallback public production base URL when running in local development or without public HTTPS.
     */
    public const PRODUCTION_FALLBACK_URL = 'https://unc-nemix.com';

    /**
     * Resolve the base URL for email assets.
     */
    public static function baseUrl(): string
    {
        $appUrl = config('app.url');
        $scheme = parse_url((string) $appUrl, PHP_URL_SCHEME);
        $host = parse_url((string) $appUrl, PHP_URL_HOST);

        if ($scheme === 'https' && !in_array($host, ['localhost', '127.0.0.1', '::1', '0.0.0.0'], true)) {
            return rtrim((string) $appUrl, '/');
        }

        return self::PRODUCTION_FALLBACK_URL;
    }

    /**
     * Resolve the absolute URL for a given asset path in emails.
     */
    public static function url(string $path): string
    {
        return self::baseUrl() . '/' . ltrim($path, '/');
    }
}
