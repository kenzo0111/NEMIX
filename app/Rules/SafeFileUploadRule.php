<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\UploadedFile;

class SafeFileUploadRule implements ValidationRule
{
    /**
     * Allowed MIME types.
     */
    protected array $allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        'image/jpeg',
        'image/png',
        'image/webp',
    ];

    /**
     * Forbidden file extensions.
     */
    protected array $forbiddenExtensions = [
        'php', 'phtml', 'php3', 'php4', 'php5', 'phps', 'phar',
        'exe', 'sh', 'bat', 'cmd', 'cgi', 'pl', 'js', 'html', 'htm',
        'vbs', 'scr', 'dll', 'com', 'jar', 'py', 'asp', 'aspx', 'jsp',
    ];

    /**
     * Max size in kilobytes (default: 10MB = 10240KB).
     */
    protected int $maxSizeKb;

    public function __construct(int $maxSizeKb = 10240)
    {
        $this->maxSizeKb = $maxSizeKb;
    }

    /**
     * Run the validation rule.
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! $value instanceof UploadedFile) {
            $fail("The {$attribute} must be a valid uploaded file.");
            return;
        }

        if (! $value->isValid()) {
            $fail("The uploaded file {$attribute} is invalid or corrupted.");
            return;
        }

        // 1. Check size limit
        if ($value->getSize() > ($this->maxSizeKb * 1024)) {
            $fail("The {$attribute} size exceeds the maximum allowed size of " . ($this->maxSizeKb / 1024) . "MB.");
            return;
        }

        // 2. Check original client extension and null bytes
        $originalName = $value->getClientOriginalName();
        if (str_contains($originalName, "\0") || str_contains($originalName, "%00")) {
            $fail("The {$attribute} filename contains invalid null-byte characters.");
            return;
        }

        $extension = strtolower($value->getClientOriginalExtension());
        if (in_array($extension, $this->forbiddenExtensions, true)) {
            $fail("The {$attribute} contains an unsafe file extension: .{$extension}");
            return;
        }

        // Reject double extensions ending with dangerous script formats (e.g. file.php.png)
        $parts = explode('.', strtolower($originalName));
        if (count($parts) > 2) {
            foreach (array_slice($parts, 1, -1) as $middleExt) {
                if (in_array($middleExt, $this->forbiddenExtensions, true)) {
                    $fail("The {$attribute} filename contains a hidden executable extension: .{$middleExt}");
                    return;
                }
            }
        }

        // 3. Verify MIME type
        $mimeType = $value->getMimeType();
        if (! in_array($mimeType, $this->allowedMimes, true)) {
            $fail("The {$attribute} file type ({$mimeType}) is not allowed.");
            return;
        }
    }
}
