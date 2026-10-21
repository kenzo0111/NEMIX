<?php

namespace Modules\Inventory\Services;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Modules\Inventory\Models\SupplyRequest;

class SupportingDocumentService
{
    public static function rules(bool $required, ?SupplyRequest $supplyRequest = null): array
    {
        if (!$required) {
            return ['supporting_document' => ['prohibited'], 'supporting_document_type' => ['prohibited']];
        }

        return [
            'supporting_document_type' => ['required', Rule::in(['Approved MOA', 'Approved Research', 'Approved Letter', 'Others'])],
            'supporting_document' => [Rule::requiredIf(!$supplyRequest?->supporting_document_path), 'nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'extensions:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }

    /** Keep private storage consistent with the database, including failed submissions. */
    public static function save(Request $request, bool $required, ?SupplyRequest $existing, Closure $callback): void
    {
        $path = null;
        $oldPath = $existing?->supporting_document_path;
        try {
            $fields = [];
            if ($required) {
                $fields = [
                    'requires_supporting_document' => true,
                    'supporting_document_type' => $request->input('supporting_document_type'),
                    'status' => 'Pending Verification',
                    'document_verified_by' => null,
                    'document_verified_at' => null,
                    'document_verification_remarks' => null,
                ];
                if ($file = $request->file('supporting_document')) {
                    $path = $file->store('supporting-documents', 'local');
                    if (!$path) {
                        throw new \RuntimeException('The supporting document could not be stored. Please try again.');
                    }
                    $fields += [
                        'supporting_document_path' => $path,
                        'supporting_document_name' => mb_substr(basename(str_replace('\\', '/', $file->getClientOriginalName())), 0, 255),
                        'supporting_document_mime' => $file->getMimeType(),
                    ];
                }
            }
            DB::transaction(function () use ($existing, $callback, $fields, &$oldPath) {
                if ($existing) {
                    $oldPath = SupplyRequest::whereKey($existing->id)->lockForUpdate()->firstOrFail()->supporting_document_path;
                }
                $callback($fields);
            });
        } catch (\Throwable $e) {
            if ($path) Storage::disk('local')->delete($path);
            throw $e;
        }
        if ($path && $oldPath && $oldPath !== $path) Storage::disk('local')->delete($oldPath);
    }
}
