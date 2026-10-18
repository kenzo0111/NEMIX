<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreSignatoryRequest;
use App\Models\Signatory;
use App\Models\SystemSetting;
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

        // Retired settings and historical snapshots are not active assignments.
        $assigned = false;
        foreach (['ris_approved_by', 'ris_issued_by', 'rsmi_certified_by', 'rsmi_posted_by',
            'rpci_accountable_officer', 'rpci_certified_by', 'rpci_verified_by', 'mor_issued_by'] as $role) {
            $name = (string) SystemSetting::get('signatories.'.$role.'_name', '');
            $id = SystemSetting::get('signatories.'.$role.'_id');
            if ($role === 'rpci_certified_by' && trim($name) === '') {
                $name = (string) SystemSetting::get('signatories.rpci_committee_chair', '');
                $id = SystemSetting::get('signatories.rpci_committee_chair_id');
            }
            if ((int) $id === $signatory->id || mb_strtolower(trim($name)) === mb_strtolower(trim($signatory->name))) {
                $assigned = true;
                break;
            }
        }

        if ($assigned) {
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
