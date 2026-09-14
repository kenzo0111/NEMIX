<?php

namespace App\Http\Requests\Admin;

use App\Models\Signatory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreSignatoryRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        return (bool) ($user && (
            (method_exists($user, 'isSystemAdmin') && $user->isSystemAdmin()) ||
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator' ||
            ($user->can('system.settings.update'))
        ));
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:255'],
            'office' => ['nullable', 'string', 'max:255'],
            'department' => ['nullable', 'string', 'max:255'],
            'employee_no' => ['nullable', 'string', 'max:100'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }

    /**
     * Custom validation to prevent duplicate normalized names.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $name = (string) $this->input('name', '');
            if (! empty(trim($name))) {
                $normalized = Signatory::normalizeName($name);
                $exists = Signatory::where('normalized_name', $normalized)->exists();

                if ($exists) {
                    $v->errors()->add('name', 'A signatory with this name already exists in the directory.');
                }
            }
        });
    }

    /**
     * Custom error messages.
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Full Name is required.',
            'designation.required' => 'Designation is required.',
        ];
    }
}
