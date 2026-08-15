<?php

namespace Modules\Inventory\App\DTOs;

use App\Contracts\DTOInterface;
use Illuminate\Http\Request;

class InventoryItemDTO implements DTOInterface
{
    public string $name;
    public int $supplier_id;
    public ?string $sku;
    public int $stock;
    public ?float $unit_cost;
    public ?float $amount;
    public string $status;
    public ?string $description;
    public ?string $unit_of_issue;

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->name = $data['name'];
        $dto->supplier_id = (int) $data['supplier_id'];
        $dto->sku = $data['sku'] ?? null;
        $dto->stock = (int) $data['stock'];
        $dto->unit_cost = isset($data['unit_cost']) ? (float) $data['unit_cost'] : null;
        $dto->amount = isset($data['amount']) ? (float) $data['amount'] : null;
        $dto->status = $data['status'];
        $dto->description = $data['description'] ?? null;
        $dto->unit_of_issue = $data['unit_of_issue'] ?? null;
        return $dto;
    }
}
