<?php

// Run with: php tests/Regression/supply-request-calendar-date.php
// Uses in-memory model instances only; never reads or writes request records.
$root = $argv[1] ?? dirname(__DIR__, 2);
require $root.'/vendor/autoload.php';
// Optionally validate a candidate model without replacing the running application file.
if (isset($argv[2])) {
    require $argv[2];
}
$app = require $root.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$originalTimezone = date_default_timezone_get();
try {
    foreach (['Asia/Manila', 'Asia/Singapore', 'UTC', 'America/Los_Angeles'] as $timezone) {
        date_default_timezone_set($timezone);
        foreach (['2026-10-16', '2026-01-01', '2028-02-29'] as $selectedDate) {
            $request = new \Modules\Inventory\Models\SupplyRequest();
            $request->setRawAttributes(['date_requested' => $selectedDate]);
            foreach ([$request->toArray(), json_decode($request->toJson(), true)] as $payload) {
                if ($payload['date_requested'] !== $selectedDate) {
                    throw new \RuntimeException("{$timezone}: selected {$selectedDate}, serialized {$payload['date_requested']}");
                }
            }
            if ($request->date_requested->format('Y-m-d') !== $selectedDate) {
                throw new \RuntimeException('The server-side calendar date changed.');
            }
        }
        $request = new \Modules\Inventory\Models\SupplyRequest();
        $request->setRawAttributes(['date_requested' => null, 'reviewed_at' => '2026-10-16 00:00:00']);
        if ($request->toArray()['date_requested'] !== null || !str_ends_with($request->toArray()['reviewed_at'], 'Z')) {
            throw new \RuntimeException('Null dates or audit timestamp serialization changed.');
        }
    }
} catch (\Throwable $error) {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
} finally {
    date_default_timezone_set($originalTimezone);
}
echo "PASS: request calendar dates survive array/JSON serialization in four timezones; audit timestamps remain UTC.\n";
