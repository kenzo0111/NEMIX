<?php

// Render synthetic snapshots only; optionally inspect a real item's dataset without writing records.
$root = dirname(__DIR__, 2);
require $root.'/vendor/autoload.php';
$app = require $root.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

try {
    foreach (['OFFICE SUPPLIES', 'Historical Migration', 14, '', null] as $days) {
        $entries = [[
            'date' => '2026-10-16', 'reference' => 'RIS-TEST', 'issue_qty' => 20,
            'issue_office' => 'Test Office', 'balance_qty' => 30, 'days_to_consume' => $days,
        ]];
        $html = view('compliance.pdf.stock_card', [
            'stockCard' => ['item' => 'Test Item', 'entries' => $entries],
            'entries' => $entries, 'dataset' => [],
        ])->render();
        $document = new \DOMDocument();
        @$document->loadHTML($html);
        $xpath = new \DOMXPath($document);
        $rows = $xpath->query('//tr[td[contains(text(), "RIS-TEST")]]');
        if ($rows->length !== 1) {
            throw new \RuntimeException('PDF transaction row is missing.');
        }
        $cells = $xpath->query('./td', $rows->item(0));
        if ($cells->length !== 7 || trim($cells->item(3)->textContent) !== '20'
            || trim($cells->item(4)->textContent) !== 'Test Office'
            || trim($cells->item(5)->textContent) !== '30'
            || trim(str_replace("\xc2\xa0", '', $cells->item(6)->textContent)) !== '') {
            throw new \RuntimeException('PDF must preserve transaction values and leave consumption blank.');
        }
    }
    if (isset($argv[1])) {
        $data = app(\App\Services\Compliance\ComplianceReportDataService::class)->getStockCardRecords([
            'itemName' => $argv[1], 'periodType' => 'all',
        ]);
        foreach ($data['entries'] as $entry) {
            if (($entry['days_to_consume'] ?? '') !== '') {
                throw new \RuntimeException('Generated consumption values must be blank.');
            }
        }
        echo 'PASS: generated dataset consumption cells are blank across '.count($data['entries'])." entries.\n";
    }
    echo "PASS: PDF renders blank consumption cells even for older snapshot values.\n";
} catch (\Throwable $error) {
    fwrite(STDERR, $error->getMessage()."\n");
    exit(1);
}
