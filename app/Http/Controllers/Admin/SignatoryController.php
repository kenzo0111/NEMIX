<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSignatoryRequest;
use App\Models\Signatory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SignatoryController extends Controller
{
    /**
     * Authorize that the current authenticated user is a System Administrator.
     */
    protected function authorizeSystemAdmin(Request $request, string $permission = 'system.settings.index'): void
    {
        $user = $request->user();

        $isAuthorized = $user && (
            (method_exists($user, 'isSystemAdmin') && $user->isSystemAdmin()) ||
            $user->hasRole('System Admin') ||
            $user->hasRole('System Administrator') ||
            ($user->role ?? null) === 'System Admin' ||
            ($user->role ?? null) === 'System Administrator' ||
            (method_exists($user, 'can') && $user->can($permission))
        );

        if (! $isAuthorized) {
            abort(403, 'Unauthorized. Access to Signatories directory is restricted to System Administrators.');
        }
    }

    /**
     * Display a listing of signatories.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorizeSystemAdmin($request, 'system.settings.index');

        $query = Signatory::query();

        if ($request->boolean('active_only')) {
            $query->active();
        }

        $signatories = $query->orderBy('name')->get();

        return response()->json([
            'signatories' => $signatories,
        ]);
    }

    /**
     * Store a newly created signatory in the directory.
     */
    public function store(StoreSignatoryRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['name'] = trim($data['name']);
        $data['designation'] = trim($data['designation']);
        $data['is_active'] = $request->boolean('is_active', true);

        $signatory = Signatory::create($data);

        return response()->json([
            'message' => 'Signatory created successfully.',
            'signatory' => $signatory,
        ], 201);
    }

    /**
     * Remove the specified signatory from the directory.
     */
    public function destroy(Request $request, Signatory $signatory): JsonResponse
    {
        $this->authorizeSystemAdmin($request, 'system.settings.update');

        // Safeguard: Check if currently assigned to any active role in system_settings
        $idMatches = \App\Models\SystemSetting::where('category', 'signatories')
            ->where('key', 'like', '%_id')
            ->where('value', json_encode($signatory->id))
            ->exists();

        $nameMatches = \App\Models\SystemSetting::where('category', 'signatories')
            ->where(function ($q) {
                $q->where('key', 'like', '%_name')
                    ->orWhere('key', 'signatories.rpci_committee_chair')
                    ->orWhere('key', 'signatories.stock_card_custodian');
            })
            ->where('value', json_encode($signatory->name))
            ->exists();

        if ($idMatches || $nameMatches) {
            return response()->json([
                'message' => "Cannot remove \"{$signatory->name}\" because they are currently assigned to one or more active roles in System Settings. Please reassign those roles before removing this signatory.",
            ], 422);
        }

        $signatory->delete();

        return response()->json([
            'message' => 'Signatory removed from directory successfully.',
            'id' => $signatory->id,
        ]);
    }
}
