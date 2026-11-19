<?php

namespace App\Support;

use Closure;
use Illuminate\Database\Eloquent\Builder as EloquentBuilder;
use Illuminate\Database\Query\Builder;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** SQL identifiers and expressions come exclusively from each page's whitelist. */
final class TableSort
{
    private function __construct(
        public readonly string $column,
        public readonly string $direction,
        private readonly array $columns,
    ) {}

    public static function fromRequest(Request $request, array $columns, string $defaultColumn, string $defaultDirection = 'asc'): self
    {
        $validated = $request->validate([
            'sort' => ['nullable', 'string', Rule::in(array_keys($columns))],
            'direction' => ['nullable', 'string', Rule::in(['asc', 'desc'])],
        ]);

        return new self($validated['sort'] ?? $defaultColumn, $validated['direction'] ?? $defaultDirection, $columns);
    }

    public function apply(Builder|EloquentBuilder $query, string $idColumn, string $idDirection = 'desc'): void
    {
        $column = $this->columns[$this->column];
        $query->reorder();
        if ($column instanceof Closure) {
            $column($query, $this->direction);
        } else {
            $query->orderBy($column, $this->direction);
        }
        if ($column !== $idColumn) {
            $query->orderBy($idColumn, $idDirection);
        }
    }

    public function filters(): array
    {
        return ['sort' => $this->column, 'direction' => $this->direction];
    }

    public static function pageSize(Request $request, int $default): int
    {
        $validated = $request->validate([
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        return (int) ($validated['per_page'] ?? $default);
    }
}
