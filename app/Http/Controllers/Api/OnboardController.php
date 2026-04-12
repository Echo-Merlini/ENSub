<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Services\EnsService;
use App\Services\SiweService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OnboardController extends Controller
{
    public function __construct(
        private SiweService $siwe,
        private EnsService  $ens,
    ) {}

    // Step 1a — GET /api/onboard/nonce?address=0x...
    public function nonce(Request $request): JsonResponse
    {
        $address = strtolower(trim($request->query('address', '')));

        if (! preg_match('/^0x[0-9a-f]{40}$/i', $address)) {
            return response()->json(['error' => 'Invalid address'], 400);
        }

        $nonce   = $this->siwe->generateNonce($address);
        $message = $this->siwe->buildMessage($address, $nonce);

        return response()->json(['nonce' => $nonce, 'message' => $message]);
    }

    // Step 1b — POST /api/onboard/verify
    public function verify(Request $request): JsonResponse
    {
        $address   = strtolower(trim($request->input('address', '')));
        $signature = trim($request->input('signature', ''));
        $nonce     = trim($request->input('nonce', ''));

        if (! $this->siwe->verifySignature($address, $signature, $nonce)) {
            return response()->json(['error' => 'Invalid signature'], 401);
        }

        // Store verified address in session
        $request->session()->put('verified_address', $address);

        return response()->json(['success' => true, 'address' => $address]);
    }

    // Step 2 — POST /api/onboard/check-ens
    public function checkEns(Request $request): JsonResponse
    {
        $address   = $request->session()->get('verified_address');
        $ensDomain = strtolower(trim($request->input('ens_domain', '')));

        if (! $address) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        if (! str_ends_with($ensDomain, '.eth')) {
            return response()->json(['error' => 'Must be a .eth domain'], 400);
        }

        // Check already registered on this platform
        if (Tenant::where('ens_domain', $ensDomain)->exists()) {
            return response()->json(['error' => 'This domain is already registered on ENSub'], 409);
        }

        // Check on-chain ownership
        if (! $this->ens->isOwnedBy($ensDomain, $address)) {
            return response()->json([
                'error'  => 'This wallet does not own ' . $ensDomain,
                'owner'  => $this->ens->getOwner($ensDomain),
            ], 403);
        }

        return response()->json(['success' => true, 'ens_domain' => $ensDomain]);
    }

    // Step 3 & 4 — POST /api/onboard/create
    public function create(Request $request): JsonResponse
    {
        $address = $request->session()->get('verified_address');

        if (! $address) {
            return response()->json(['error' => 'Not authenticated'], 401);
        }

        $validated = $request->validate([
            'name'              => 'required|string|max:80',
            'ens_domain'        => 'required|string|ends_with:.eth',
            'namestone_api_key' => 'required|string',
            'gate_type'         => 'required|in:open,nft,token,allowlist',
            'contract_address'  => 'nullable|string',
            'collection_slug'   => 'nullable|string',
            'accent_color'      => 'nullable|string|max:7',
            'logo_url'          => 'nullable|url',
            'claim_limit'       => 'nullable|integer|min:1|max:10000',
        ]);

        $ensDomain = strtolower($validated['ens_domain']);

        // Re-verify ownership (double-check before writing)
        if (! $this->ens->isOwnedBy($ensDomain, $address)) {
            return response()->json(['error' => 'ENS ownership check failed'], 403);
        }

        // Check platform duplicate
        if (Tenant::where('ens_domain', $ensDomain)->exists()) {
            return response()->json(['error' => 'Domain already registered'], 409);
        }

        // Generate unique slug from domain name
        $baseName = str_replace('.eth', '', $ensDomain);
        $slug     = Str::slug($baseName);
        $counter  = 1;
        while (Tenant::where('slug', $slug)->exists()) {
            $slug = Str::slug($baseName) . '-' . $counter++;
        }

        $tenant = Tenant::create([
            'name'              => $validated['name'],
            'ens_domain'        => $ensDomain,
            'owner_address'     => $address,
            'namestone_api_key' => $validated['namestone_api_key'],
            'slug'              => $slug,
            'accent_color'      => $validated['accent_color'] ?? '#00ff88',
            'logo_url'          => $validated['logo_url'] ?? null,
            'plan'              => 'free',
            'claim_limit'       => $validated['claim_limit'] ?? 50,
            'active'            => true,
        ]);

        // Create gate config
        if ($validated['gate_type'] !== 'open') {
            $tenant->gateConfig()->create([
                'type'             => $validated['gate_type'],
                'contract_address' => $validated['contract_address'] ?? null,
                'collection_slug'  => $validated['collection_slug'] ?? null,
                'max_per_wallet'   => 1,
            ]);
        }

        $request->session()->forget('verified_address');

        return response()->json([
            'success'   => true,
            'slug'      => $slug,
            'claim_url' => url("/claim/{$slug}"),
        ]);
    }
}
