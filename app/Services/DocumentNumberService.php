<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

class DocumentNumberService
{
    public function canonicalType(string $type): string
    {
        return match (strtoupper(trim($type))) {
            'STOCKCARD', 'STOCK_CARD' => 'STOCK_CARD',
            'MR', 'MOR', 'MEMORANDUM_RECEIPT', 'MEMORANDUM RECEIPT' => 'MR',
            'RIS' => 'RIS',
            'RSMI' => 'RSMI',
            'RPCI' => 'RPCI',
            default => throw new InvalidArgumentException('Unsupported document type.'),
        };
    }

    private function definition(string $type, ?string $date): array
    {
        $type = $this->canonicalType($type);
        $day = $date ? Carbon::parse($date) : now();
        [$period, $stem, $width] = match ($type) {
            'RIS' => [$day->format('Y-m'), $day->format('Y-m').'-', 4],
            'RSMI' => [$day->format('Y-m'), $day->format('Y-m').'-', 3],
            'RPCI' => [$day->format('Y'), $day->format('Y').'-', 3],
            'MR' => [$day->format('Y'), $day->format('Y').'-', 4],
            'STOCK_CARD' => ['continuous', $day->format('Y').'-', 5],
        };

        return [$type, $type.':'.$period, $stem, $width];
    }

    /** Preview is read-only; final numbers are reserved only when creating a document. */
    public function preview(string $type, ?string $date = null): string
    {
        [$type, $series, $stem, $width] = $this->definition($type, $date);
        $last = (int) DB::table('document_number_sequences')->where('series', $series)->value('last_number');
        $next = max($last, $this->historicalMaximum($type, $stem)) + 1;
        do {
            $number = $stem.str_pad((string) $next++, $width, '0', STR_PAD_LEFT);
        } while ($this->exists($number));

        return $number;
    }

    /** A locked counter and a unique reservation protect both RIS creation paths. */
    public function reserve(string $type, ?string $date = null, ?string $preferred = null): string
    {
        [$type, $series, $stem, $width] = $this->definition($type, $date);

        return DB::transaction(function () use ($type, $series, $stem, $width, $preferred) {
            DB::table('document_number_sequences')->insertOrIgnore(['series' => $series, 'last_number' => 0]);
            $counter = DB::table('document_number_sequences')->where('series', $series)->lockForUpdate()->first();
            if ($preferred && preg_match('/^\d{4}(?:-\d+)+$/D', $preferred) && ! $this->exists($preferred) && DB::table('document_number_reservations')->insertOrIgnore(['number' => $preferred])) {
                return $preferred;
            }
            $next = max((int) $counter->last_number, $this->historicalMaximum($type, $stem));
            do {
                $number = $stem.str_pad((string) ++$next, $width, '0', STR_PAD_LEFT);
            } while ($this->exists($number) || ! DB::table('document_number_reservations')->insertOrIgnore(['number' => $number]));
            DB::table('document_number_sequences')->where('series', $series)->update(['last_number' => $next]);

            return $number;
        }, 5);
    }

    private function exists(string $number): bool
    {
        return DB::table('document_number_reservations')->where('number', $number)->exists()
            || DB::table('issuances')->where('ris_number', $number)->exists()
            || DB::table('supply_requests')->where('ris_number', $number)->exists()
            || DB::table('compliance_reports')->where('reference', $number)->exists();
    }

    private function historicalMaximum(string $type, string $stem): int
    {
        $sources = $type === 'RIS'
            ? [['issuances', 'ris_number'], ['supply_requests', 'ris_number']]
            : [['compliance_reports', 'reference']];
        $max = 0;
        foreach ($sources as [$table, $column]) {
            $query = DB::table($table)->select($column);
            if ($table === 'compliance_reports') {
                $aliases = match ($type) {
                    'MR' => ['MR', 'MOR', 'MEMORANDUM_RECEIPT', 'MEMORANDUM RECEIPT'],
                    'STOCK_CARD' => ['STOCK_CARD', 'STOCKCARD'],
                    default => [$type],
                };
                $query->whereIn('type', $aliases);
            }
            // Include old prefixed numbers when seeding an existing series.
            if ($type !== 'STOCK_CARD') {
                $query->where($column, 'like', '%'.$stem.'%');
            }
            $pattern = $type === 'STOCK_CARD'
                ? '/(?:^|-)(\d+)$/'
                : '/(?:^|[^\d])'.preg_quote($stem, '/').'(\d+)$/';
            foreach ($query->cursor() as $row) {
                if (preg_match($pattern, $row->$column ?? '', $matches)) {
                    $max = max($max, (int) $matches[1]);
                }
            }
        }

        return $max;
    }
}
