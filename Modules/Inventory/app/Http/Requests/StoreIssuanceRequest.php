<?php

namespace Modules\Inventory\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreIssuanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check();
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'issuances' => ['required', 'array', 'min:1', 'max:100'],
            'issuances.*.item_id' => ['required', 'integer', 'exists:items,id'],
            'issuances.*.quantity' => ['required', 'integer', 'min:1', 'max:1000000'],
            'recipient' => ['required', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'fund_cluster' => ['nullable', 'string', 'max:255'],
            'recipient_designation' => ['nullable', 'string', 'max:255'],
            'purpose' => ['nullable', 'string', 'max:2000'],
            'approved_by' => ['nullable', 'string', 'max:255'],
            'approved_by_designation' => ['nullable', 'string', 'max:255'],
            'issued_by_name' => ['nullable', 'string', 'max:255'],
            'issued_by_position' => ['nullable', 'string', 'max:255'],
            'date_issued' => ['required', 'date'],
        ];
    }

    /**
     * Configure the validator instance to check for duplicates.
     */
    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $issuances = $this->input('issuances', []);
            if (is_array($issuances)) {
                $itemIds = [];
                foreach ($issuances as $index => $row) {
                    if (!empty($row['item_id'])) {
                        if (in_array($row['item_id'], $itemIds)) {
                            $validator->errors()->add(
                                "issuances.{$index}.item_id",
                                'This item has already been added to this issuance transaction.'
                            );
                            $validator->errors()->add(
                                'issuances',
                                'Duplicate items are not allowed in the same issuance transaction.'
                            );
                        }
                        $itemIds[] = $row['item_id'];
                    }
                }
            }
        });
    }

    /**
     * Custom attribute names for user-friendly validation messages.
     */
    public function attributes(): array
    {
        return [
            'issuances.*.item_id' => 'item',
            'issuances.*.quantity' => 'quantity',
            'date_issued' => 'date issued',
            'fund_cluster' => 'fund cluster',
            'recipient_designation' => 'recipient designation',
        ];
    }
}
