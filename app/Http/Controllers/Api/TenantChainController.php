<?php

namespace App\Http\Controllers\Api;

use App\Console\Commands\SyncL2Mints;
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
            'chain_id'          => 'required|integer',
            'chain_name'        => 'required|string|max:64',
            'registry_address'  => 'nullable|string|max:42',
            'registrar_address' => 'nullable|string|max:42',
            'registrar_type'    => 'nullable|in:open,ensub',
        ]);

        $registrarType = $validated['registrar_type'] ?? 'open';
        $isNew = ! $tenant->chains()->where('chain_id', $validated['chain_id'])->exists();

        // Plan gating — only enforced for new chains (updates/redeploys keep existing slot)
        if ($isNew) {
            if ($tenant->plan === 'free' && $tenant->chains()->count() >= 1) {
                return response()->json([
                    'error' => 'Free plan is limited to 1 L2 chain. Upgrade to Pro to add more.',
                    'upgrade' => true,
                ], 403);
            }
        }

        if ($registrarType === 'ensub' && $tenant->plan === 'free') {
            return response()->json([
                'error' => 'ENSubRegistrar requires a Pro or Business plan.',
                'upgrade' => true,
            ], 403);
        }

        $chain = $tenant->chains()->updateOrCreate(
            ['chain_id' => $validated['chain_id']],
            array_merge($validated, ['enabled' => true, 'registrar_type' => $registrarType])
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

    // POST /api/manage/{slug}/chains/sync
    public function sync(string $slug): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->firstOrFail();

        try {
            $command = new SyncL2Mints();
            $command->setLaravel(app());

            // Run sync for this tenant only via Artisan
            \Artisan::call('l2:sync', ['--tenant' => $slug]);

            // Return refreshed chain list with updated last_synced_block
            $chains = $tenant->chains()->orderBy('chain_id')->get();
            return response()->json(['ok' => true, 'chains' => $chains]);
        } catch (\Throwable $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
