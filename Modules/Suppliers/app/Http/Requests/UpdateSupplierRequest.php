<?php

namespace Modules\Suppliers\Http\Requests;

use App\Policies\ResourceOwnershipPolicy;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Modules\Suppliers\Enums\SupplierStatus;
use Modules\Suppliers\Models\Supplier;

class UpdateSupplierRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $supplierId = $this->route('supplier');
        $supplier = $supplierId instanceof Supplier ? $supplierId : Supplier::find($supplierId);

        if (! $supplier) {
            return false;
        }

        return ResourceOwnershipPolicy::canManage(auth()->user(), $supplier, 'created_by');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $supplierId = $this->route('supplier');
        $id = $supplierId instanceof Supplier ? $supplierId->id : $supplierId;

        return [
            'name' => ['required', 'string', 'max:255'],
            'tin' => ['required', 'string', 'max:50', Rule::unique('suppliers', 'tin')->ignore($id)],
            'address' => ['required', 'string', 'max:255'],
            'reg_number' => ['required', 'string', 'max:100', Rule::unique('suppliers', 'reg_number')->ignore($id)],
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
