<?php

namespace Modules\Inventory\App\DTOs;

use App\Contracts\DTOInterface;

class IssuanceDTO implements DTOInterface
{
    public int $item_id;
    public int $quantity;
    public string $recipient;
    public ?string $department;
    public ?string $fund_cluster;
    public ?string $recipient_designation;
    public ?string $purpose;
    public ?string $approved_by;
    public ?string $approved_by_designation;
    public string $date_issued;
    public string $status;

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->item_id = (int) $data['item_id'];
        $dto->quantity = (int) $data['quantity'];
        $dto->recipient = $data['recipient'];
        $dto->department = $data['department'] ?? null;
        $dto->fund_cluster = $data['fund_cluster'] ?? null;
        $dto->recipient_designation = $data['recipient_designation'] ?? null;
        $dto->purpose = $data['purpose'] ?? null;
        $dto->approved_by = $data['approved_by'] ?? null;
        $dto->approved_by_designation = $data['approved_by_designation'] ?? null;
        $dto->date_issued = $data['date_issued'];
        $dto->status = $data['status'] ?? 'Issued';
        return $dto;
    }
}
