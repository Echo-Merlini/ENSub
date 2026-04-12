<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Inertia\Inertia;
use Inertia\Response;

class ClaimController extends Controller
{
    public function my(string $slug): Response
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('active', true)
            ->firstOrFail();

        return Inertia::render('MyName', [
            'tenant' => [
                'name'         => $tenant->name,
                'ens_domain'   => $tenant->ens_domain,
                'slug'         => $tenant->slug,
                'logo_url'     => $tenant->logo_url,
                'accent_color' => $tenant->accent_color,
            ],
        ]);
    }

    public function show(string $slug): Response
    {
        $tenant = Tenant::where('slug', $slug)
            ->where('active', true)
            ->firstOrFail();

        return Inertia::render('Claim', [
            'tenant' => [
                'name'         => $tenant->name,
                'ens_domain'   => $tenant->ens_domain,
                'slug'         => $tenant->slug,
                'logo_url'     => $tenant->logo_url,
                'accent_color' => $tenant->accent_color,
                'claim_limit'  => $tenant->claim_limit,
                'claims_count' => $tenant->claims()->count(),
                'at_limit'     => $tenant->isAtLimit(),
                'gate_type'    => $tenant->gateConfig?->type ?? 'open',
            ],
        ]);
    }
}
