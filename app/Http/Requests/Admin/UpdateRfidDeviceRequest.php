<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRfidDeviceRequest extends FormRequest
{
    protected function prepareForValidation(): void
    {
        if (is_string($this->input('server_url'))) {
            $this->merge(['server_url' => rtrim($this->input('server_url'), '/')]);
        }
    }

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
            'wifi_open_network' => ['sometimes', 'boolean'],
            'station_id' => ['nullable', 'string', 'max:100', 'regex:/^[A-Za-z0-9_-]+$/'],
            'server_url' => ['required', 'url:https', 'max:2048'],
            'scan_mode' => ['required', Rule::in(['single', 'inventory'])],
            'rf_power' => ['required', 'integer', 'between:0,26'],
            'scan_timeout' => ['required', 'integer', 'between:100,30000'],
            'heartbeat_interval' => ['required', 'integer', 'between:10,3600'],
            'buzzer_enabled' => ['required', 'boolean'],
            'auto_reconnect' => ['required', 'boolean'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            if (strlen((string) $this->input('wifi_ssid', '')) > 32) {
                $validator->errors()->add('wifi_ssid', 'Wi-Fi SSID must not exceed 32 bytes.');
            }
            $password = (string) $this->input('wifi_password', '');
            if (strlen($password) > 63 || (strlen($password) > 0 && strlen($password) < 8)) {
                $validator->errors()->add('wifi_password', 'Wi-Fi password must contain 8–63 bytes.');
            }
            if (str_contains($password, "\0") || str_contains((string) $this->input('wifi_ssid', ''), "\0")) {
                $validator->errors()->add('wifi_ssid', 'Wi-Fi credentials cannot contain a null character.');
            }
            if ($this->boolean('wifi_open_network') && strlen($password) > 0) {
                $validator->errors()->add('wifi_password', 'Leave the password empty for an open network.');
            }
            $url = parse_url((string) $this->input('server_url'));
            if (! $url || isset($url['path']) || isset($url['query']) || isset($url['fragment']) || isset($url['user']) || isset($url['pass'])) {
                $validator->errors()->add('server_url', 'Use an HTTPS server origin without a path, query or credentials.');
            }
        });
    }
}
