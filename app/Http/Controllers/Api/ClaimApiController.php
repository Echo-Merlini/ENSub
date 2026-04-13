<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Claim;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ClaimApiController extends Controller
{
    private const NAMESTONE_API = 'https://namestone.com/api/public_v1';
    private const ETHSCRIPTIONS_API = 'https://api.ethscriptions.com/api/ethscriptions';

    // GET /api/claim/{slug}/check?name=xxx
    public function check(string $slug, Request $request): JsonResponse
    {
        $tenant = $this->getTenant($slug);
        if (! $tenant) return $this->notFound();

        $name = strtolower(trim($request->query('name', '')));

        if (! preg_match('/^[a-z0-9-]{3,32}$/', $name)) {
            return response()->json(['available' => false]);
        }

        // Check local DB first (faster)
        $takenLocally = Claim::where('tenant_id', $tenant->id)
            ->where('subdomain', $name)
            ->exists();

        if ($takenLocally) {
            return response()->json(['available' => false]);
        }

        // Also check Namestone — if the call fails, treat as taken (safe default)
        $res = Http::withHeaders(['Authorization' => $tenant->namestone_api_key])
            ->get(self::NAMESTONE_API . '/search-names', [
                'domain'      => $tenant->ens_domain,
                'name'        => $name,
                'exact_match' => 1,
            ]);

        if (! $res->successful()) {
            \Log::warning('Namestone search-names failed', [
                'status'  => $res->status(),
                'body'    => $res->body(),
                'domain'  => $tenant->ens_domain,
                'name'    => $name,
            ]);
            return response()->json(['available' => false]);
        }

        $taken = count($res->json()) > 0;

        return response()->json(['available' => ! $taken]);
    }

    // GET /api/claim/{slug}/mine?address=0x...
    public function mine(string $slug, Request $request): JsonResponse
    {
        $tenant = $this->getTenant($slug);
        if (! $tenant) return $this->notFound();

        $address = strtolower($request->query('address', ''));

        $claim = Claim::where('tenant_id', $tenant->id)
            ->where('wallet_address', strtolower($address))
            ->first();

        return response()->json([
            'subdomain' => $claim?->subdomain,
            'full_name' => $claim?->full_name,
        ]);
    }

    // POST /api/claim/{slug}
    public function claim(string $slug, Request $request): JsonResponse
    {
        $tenant = $this->getTenant($slug);
        if (! $tenant) return $this->notFound();

        $address = strtolower(trim($request->input('address', '')));
        $name    = strtolower(trim($request->input('name', '')));

        if (! $address || ! $name) {
            return response()->json(['error' => 'Missing address or name'], 400);
        }

        if (! preg_match('/^[a-z0-9-]{3,32}$/', $name)) {
            return response()->json(['error' => 'Invalid name format'], 400);
        }

        if ($tenant->isAtLimit()) {
            return response()->json(['error' => 'This project has reached its claim limit'], 403);
        }

        // 1. Eligibility gate
        $gateError = $this->checkGate($tenant, $address);
        if ($gateError) {
            return response()->json(['error' => $gateError], 403);
        }

        // 2. One per wallet
        $alreadyClaimed = Claim::where('tenant_id', $tenant->id)
            ->where('wallet_address', $address)
            ->exists();

        if ($alreadyClaimed) {
            return response()->json(['error' => 'This wallet already claimed a subdomain'], 409);
        }

        // 3. Name availability
        $taken = Claim::where('tenant_id', $tenant->id)
            ->where('subdomain', $name)
            ->exists();

        if ($taken) {
            return response()->json(['error' => 'Name already taken'], 409);
        }

        // 4. Register via Namestone
        $res = Http::withHeaders(['Authorization' => $tenant->namestone_api_key])
            ->post(self::NAMESTONE_API . '/set-name', [
                'domain'  => $tenant->ens_domain,
                'name'    => $name,
                'address' => $address,
            ]);

        if (! $res->successful() || ! ($res->json()['success'] ?? false)) {
            $nsError = $res->json()['message'] ?? $res->json()['error'] ?? $res->body();
            \Log::error('Namestone set-name failed', [
                'status' => $res->status(),
                'body'   => $res->body(),
            ]);
            return response()->json(['error' => 'Namestone: ' . $nsError], 500);
        }

        // 5. Record in DB
        $full = "{$name}.{$tenant->ens_domain}";
        Claim::create([
            'tenant_id'      => $tenant->id,
            'wallet_address' => $address,
            'subdomain'      => $name,
            'full_name'      => $full,
        ]);

        return response()->json(['success' => true, 'full_name' => $full]);
    }

    // --- helpers ---

    private function getTenant(string $slug): ?Tenant
    {
        return Tenant::where('slug', $slug)
            ->where('active', true)
            ->with('gateConfig')
            ->first();
    }

    private function notFound(): JsonResponse
    {
        return response()->json(['error' => 'Project not found'], 404);
    }

    private function checkGate(Tenant $tenant, string $address): ?string
    {
        $gate = $tenant->gateConfig;

        if (! $gate || $gate->type === 'open') {
            return null;
        }

        if ($gate->type === 'nft') {
            if ($gate->collection_slug) {
                // ETHscriptions collection check
                $res = Http::get(self::ETHSCRIPTIONS_API, [
                    'owner'           => $address,
                    'collection_slug' => $gate->collection_slug,
                    'per_page'        => 1,
                ]);
                $items = $res->json();
                if (! is_array($items) || count($items) === 0) {
                    return 'No qualifying NFTs found in this wallet';
                }
            } elseif ($gate->contract_address) {
                // ERC-721 balanceOf check
                if (! $this->checkErc721Balance($address, $gate->contract_address)) {
                    return 'No qualifying NFTs found in this wallet';
                }
            }
            return null;
        }

        if ($gate->type === 'token') {
            if (! $gate->contract_address) {
                return 'Token gate is misconfigured — no contract address set';
            }
            $minBalance = $gate->min_balance ?? 1;
            $balance = $this->checkErc20Balance($address, $gate->contract_address);
            if ($balance < (float) $minBalance) {
                return 'Insufficient token balance to claim';
            }
            return null;
        }

        if ($gate->type === 'allowlist') {
            if (! $gate->allowlist_addresses) {
                return 'Allowlist gate is misconfigured — no addresses set';
            }
            $list = array_map(
                fn($a) => strtolower(trim($a)),
                preg_split('/[\r\n,]+/', $gate->allowlist_addresses)
            );
            if (! in_array(strtolower($address), array_filter($list))) {
                return 'Your wallet is not on the allowlist';
            }
            return null;
        }

        return null;
    }

    private function ethCall(string $contract, string $data): string
    {
        $res = Http::post('https://eth-mainnet.g.alchemy.com/v2/' . config('services.alchemy.key'), [
            'jsonrpc' => '2.0',
            'method'  => 'eth_call',
            'params'  => [['to' => $contract, 'data' => $data], 'latest'],
            'id'      => 1,
        ]);
        return $res->json()['result'] ?? '0x0';
    }

    private function checkErc721Balance(string $address, string $contract): bool
    {
        // balanceOf(address) → 0x70a08231
        $data = '0x70a08231' . str_pad(substr($address, 2), 64, '0', STR_PAD_LEFT);
        return hexdec($this->ethCall($contract, $data)) > 0;
    }

    private function checkErc20Balance(string $address, string $contract): float
    {
        // balanceOf(address) → 0x70a08231 (same selector as ERC-721)
        $data = '0x70a08231' . str_pad(substr($address, 2), 64, '0', STR_PAD_LEFT);
        $hex  = $this->ethCall($contract, $data);
        // ERC-20 balances are uint256; use bcmath to avoid overflow
        $raw  = ltrim($hex, '0x') ?: '0';
        return (float) bcdiv(base_convert($raw, 16, 10), bcpow('10', '18'), 6);
    }
}
