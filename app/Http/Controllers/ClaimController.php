<?php

namespace App\Http\Controllers;

use App\Models\Claim;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
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
                'name'          => $tenant->name,
                'ens_domain'    => $tenant->ens_domain,
                'slug'          => $tenant->slug,
                'owner_address' => $tenant->owner_address,
                'logo_url'      => $tenant->logo_url,
                'accent_color'  => $tenant->accent_color,
                'claim_limit'   => $tenant->claim_limit,
                'claims_count'  => $tenant->claims()->count(),
                'at_limit'      => $tenant->isAtLimit(),
                'gate_type'     => $tenant->gateConfig?->type ?? 'open',
                'plan'          => $tenant->plan,
            ],
        ]);
    }

    public function manage(string $slug): Response
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        return Inertia::render('Manage', [
            'tenant' => [
                'name'              => $tenant->name,
                'ens_domain'        => $tenant->ens_domain,
                'slug'              => $tenant->slug,
                'owner_address'     => $tenant->owner_address,
                'logo_url'          => $tenant->logo_url,
                'accent_color'      => $tenant->accent_color,
                'claim_limit'       => $tenant->claim_limit,
                'claims_count'      => $tenant->claims()->count(),
                'plan'              => $tenant->plan,
                'gate_type'           => $tenant->gateConfig?->type ?? 'open',
                'contract_address'    => $tenant->gateConfig?->contract_address,
                'collection_slug'     => $tenant->gateConfig?->collection_slug,
                'min_balance'         => $tenant->gateConfig?->min_balance,
                'allowlist_addresses' => $tenant->gateConfig?->allowlist_addresses,
                'namestone_api_key' => $tenant->namestone_api_key,
                'claims'            => $tenant->claims()->latest()->get()->map(fn($c) => [
                    'id'             => $c->id,
                    'wallet_address' => $c->wallet_address,
                    'subdomain'      => $c->subdomain,
                    'full_name'      => $c->full_name,
                    'claimed_at'     => $c->created_at->toDateTimeString(),
                ])->values()->toArray(),
            ],
        ]);
    }

    public function revokeClaim(string $slug, int $claimId, Request $request): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        $address = strtolower(trim($request->input('owner_address', '')));
        if ($address !== strtolower($tenant->owner_address)) {
            return response()->json(['error' => 'Not authorized'], 403);
        }

        $claim = Claim::where('id', $claimId)
            ->where('tenant_id', $tenant->id)
            ->firstOrFail();

        // Remove from Namestone
        Http::withHeaders(['Authorization' => $tenant->namestone_api_key])
            ->delete('https://namestone.com/api/public_v1/delete-name', [
                'domain' => $tenant->ens_domain,
                'name'   => $claim->subdomain,
            ]);

        $claim->delete();

        return response()->json(['success' => true]);
    }

    public function manageSave(string $slug, Request $request): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        // Verify caller owns this tenant
        $address = strtolower(trim($request->input('owner_address', '')));
        if ($address !== strtolower($tenant->owner_address)) {
            return response()->json(['error' => 'Not authorized'], 403);
        }

        $validated = $request->validate([
            'name'                => 'required|string|max:80',
            'logo_url'            => 'nullable|url|max:500',
            'accent_color'        => 'nullable|string|max:7',
            'namestone_api_key'   => 'required|string',
            'gate_type'           => 'required|in:open,nft,token,allowlist',
            'contract_address'    => 'nullable|string',
            'collection_slug'     => 'nullable|string',
            'min_balance'         => 'nullable|numeric|min:0',
            'allowlist_addresses' => 'nullable|string',
            'claim_limit'         => 'nullable|integer|min:1|max:50000',
        ]);

        $tenant->update([
            'name'              => $validated['name'],
            'logo_url'          => $validated['logo_url'] ?? null,
            'accent_color'      => $validated['accent_color'] ?? $tenant->accent_color,
            'namestone_api_key' => $validated['namestone_api_key'],
            'claim_limit'       => $validated['claim_limit'] ?? $tenant->claim_limit,
        ]);

        // Update or remove gate config
        if ($validated['gate_type'] === 'open') {
            $tenant->gateConfig()?->delete();
        } else {
            $tenant->gateConfig()->updateOrCreate(
                ['tenant_id' => $tenant->id],
                [
                    'type'                => $validated['gate_type'],
                    'contract_address'    => $validated['contract_address'] ?? null,
                    'collection_slug'     => $validated['collection_slug'] ?? null,
                    'min_balance'         => $validated['min_balance'] ?? null,
                    'allowlist_addresses' => $validated['allowlist_addresses'] ?? null,
                    'max_per_wallet'      => 1,
                ]
            );
        }

        return response()->json(['success' => true]);
    }
}
