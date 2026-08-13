<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        if ($user) {
            $user->loadMissing('roles');
            $userArray = $user->toArray();
            $userArray['role'] = $user->roles->first()?->name ?? 'Supply Officer';
            $userArray['roles'] = $user->getRoleNames()->toArray();
        } else {
            $userArray = null;
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userArray,
                'permissions' => $request->user()?->getPermissionNames()->toArray() ?? [],
                'is_system_admin' => $request->user()?->hasRole('System Admin') ?? false,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}

