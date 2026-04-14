<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\TenantChain;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantChainController extends Controller
{
    // GET /api/manage/{slug}/chains
    public function index(string $slug): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();
        return response()->json($tenant->chains()->orderBy('chain_id')->get());
    }

    // POST /api/manage/{slug}/chains
    public function store(Request $request, string $slug): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'chain_id'            => 'required|integer',
            'chain_name'          => 'required|string|max:64',
            'registry_address'    => 'nullable|string|max:42',
            'registrar_address'   => 'nullable|string|max:42',
        ]);

        $chain = $tenant->chains()->updateOrCreate(
            ['chain_id' => $validated['chain_id']],
            array_merge($validated, ['enabled' => true])
        );

        return response()->json($chain, 201);
    }

    // PATCH /api/manage/{slug}/chains/{chainId}
    public function update(Request $request, string $slug, int $chainId): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();
        $chain  = TenantChain::where('tenant_id', $tenant->id)
                              ->where('chain_id', $chainId)
                              ->firstOrFail();

        $validated = $request->validate([
            'registry_address'  => 'nullable|string|max:42',
            'registrar_address' => 'nullable|string|max:42',
            'enabled'           => 'nullable|boolean',
        ]);

        $chain->update($validated);

        return response()->json($chain);
    }

    // DELETE /api/manage/{slug}/chains/{chainId}
    public function destroy(string $slug, int $chainId): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();
        TenantChain::where('tenant_id', $tenant->id)
                   ->where('chain_id', $chainId)
                   ->delete();

        return response()->json(['ok' => true]);
    }
}
