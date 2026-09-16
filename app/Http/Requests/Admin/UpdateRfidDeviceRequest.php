<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRfidDeviceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return (bool) ($user && ($user->hasRole('System Admin') || $user->hasRole('System Administrator') || $user->can('system.settings.update')));
    }

    public function rules(): array
    {
        return [
            'device_name' => ['required', 'string', 'max:100'],
            'wifi_ssid' => ['nullable', 'string', 'max:32'],
            'wifi_password' => ['nullable', 'string', 'min:8', 'max:63'],
            'server_url' => ['required', 'url:https', 'max:2048'],
            'scan_mode' => ['required', Rule::in(['single', 'inventory'])],
            'rf_power' => ['required', 'integer', 'between:0,26'],
            'scan_timeout' => ['required', 'integer', 'between:100,30000'],
            'heartbeat_interval' => ['required', 'integer', 'between:10,3600'],
            'buzzer_enabled' => ['required', 'boolean'],
            'auto_reconnect' => ['required', 'boolean'],
        ];
    }
}
