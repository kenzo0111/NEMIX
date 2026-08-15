<?php

namespace Modules\Inventory\DTOs;

use App\Contracts\DTOInterface;

class ReceivingDTO implements DTOInterface
{
    public int $item_id;
    public int $supplier_id;
    public int $quantity;
    public string $date_received;

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->item_id = (int) $data['item_id'];
        $dto->supplier_id = (int) $data['supplier_id'];
        $dto->quantity = (int) $data['quantity'];
        $dto->date_received = $data['date_received'];
        return $dto;
    }
}
