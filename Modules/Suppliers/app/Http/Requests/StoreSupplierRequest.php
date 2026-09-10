<?php

namespace Modules\Suppliers\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Suppliers\Enums\SupplierStatus;

class StoreSupplierRequest extends FormRequest
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
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'tin' => ['required', 'string', 'max:50', 'unique:suppliers,tin'],
            'address' => ['required', 'string', 'max:255'],
            'reg_number' => ['required', 'string', 'max:100', 'unique:suppliers,reg_number'],
            'category' => ['required', 'string', 'max:100'],
            'status' => ['required', Rule::in(SupplierStatus::values())],
        ];
    }

    /**
     * Custom attribute names for validation error messages.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'supplier name',
            'tin' => 'tax identification number (TIN)',
            'address' => 'business address',
            'reg_number' => 'registration number',
            'category' => 'classification',
            'status' => 'compliance status',
        ];
    }
}
