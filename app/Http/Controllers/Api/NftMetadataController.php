<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Tenant;
use App\Models\TenantChain;
use Illuminate\Http\JsonResponse;

class NftMetadataController extends Controller
{
    private const CHAIN_NAMES = [
        8453   => 'Base',
        10     => 'Optimism',
        42161  => 'Arbitrum',
        137    => 'Polygon',
        59144  => 'Linea',
        534352 => 'Scroll',
    ];

    // GET /nft/{slug}/{chainId}/{tokenId}
    public function show(string $slug, int $chainId, string $tokenId): JsonResponse
    {
        $tenant = Tenant::where('slug', $slug)->where('active', true)->first();
        if (! $tenant) {
            return response()->json(['error' => 'Not found'], 404);
        }

        $chain = TenantChain::where('tenant_id', $tenant->id)
            ->where('chain_id', $chainId)
            ->first();

        if (! $chain) {
            return response()->json(['error' => 'Chain not found'], 404);
        }

        // Try to match tokenId to a claim by computing namehash for each subdomain
        $tokenIdInt = gmp_init($tokenId, 10);
        $claim      = null;

        foreach (Claim::where('tenant_id', $tenant->id)->get() as $c) {
            $node = $this->namehash($c->full_name);
            if (gmp_cmp(gmp_init(bin2hex($node), 16), $tokenIdInt) === 0) {
                $claim = $c;
                break;
            }
        }

        $subdomain  = $claim?->subdomain ?? 'unknown';
        $fullName   = $claim?->full_name  ?? "{$subdomain}.{$tenant->ens_domain}";
        $chainName  = self::CHAIN_NAMES[$chainId] ?? "Chain {$chainId}";
        $claimUrl   = url("/claim/{$tenant->slug}");
        $imageUrl   = url('/images/ensub-logo.gif');

        return response()->json([
            'name'         => $fullName,
            'description'  => "{$fullName} — an ENS subdomain claimed via ENSub.org",
            'image'        => $imageUrl,
            'external_url' => $claimUrl,
            'attributes'   => [
                ['trait_type' => 'Domain',    'value' => $tenant->ens_domain],
                ['trait_type' => 'Subdomain', 'value' => $subdomain],
                ['trait_type' => 'Chain',     'value' => $chainName],
            ],
        ]);
    }

    // ENS namehash: https://docs.ens.domains/contract-api-reference/name-processing
    private function namehash(string $name): string
    {
        $node = str_repeat("\x00", 32);
        if ($name === '') {
            return $node;
        }
        $labels = array_reverse(explode('.', $name));
        foreach ($labels as $label) {
            $node = hash('sha3-256', $node . hash('sha3-256', $label, true), true);
        }
        return $node;
    }
}
