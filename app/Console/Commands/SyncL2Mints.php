<?php

namespace App\Console\Commands;

use App\Models\Claim;
use App\Models\TenantChain;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use kornrunner\Keccak;

class SyncL2Mints extends Command
{
    protected $signature   = 'l2:sync {--tenant= : Only sync a specific tenant slug} {--full : Start from block 0 (full historical sync)}';
    protected $description = 'Sync L2 SubnodeCreated events from each tenant\'s L2Registry into the claims table';

    // Public fallback RPCs per chain
    private const PUBLIC_RPC = [
        8453   => 'https://mainnet.base.org',
        10     => 'https://mainnet.optimism.io',
        42161  => 'https://arb1.arbitrum.io/rpc',
        137    => 'https://polygon-rpc.com',
        59144  => 'https://rpc.linea.build',
        534352 => 'https://rpc.scroll.io',
    ];

    // Alchemy network slugs per chain (where supported)
    private const ALCHEMY_NETWORK = [
        8453   => 'base-mainnet',
        10     => 'opt-mainnet',
        42161  => 'arb-mainnet',
        137    => 'polygon-mainnet',
        59144  => 'linea-mainnet',
    ];

    // Max blocks per eth_getLogs request — 2000 is safe for all public RPCs
    private const CHUNK_SIZE = 2_000;

    private ?int $currentChainId = null;

    public function handle(): int
    {
        $eventTopic = '0x' . Keccak::hash('SubnodeCreated(bytes32,bytes,address)', 256);

        $query = TenantChain::with('tenant')
            ->whereNotNull('registry_address');

        if ($slug = $this->option('tenant')) {
            $query->whereHas('tenant', fn ($q) => $q->where('slug', $slug));
        }

        $chains = $query->get();

        if ($chains->isEmpty()) {
            $this->info('No chains to sync.');
            return 0;
        }

        foreach ($chains as $chain) {
            $this->syncChain($chain, $eventTopic);
        }

        return 0;
    }

    private function syncChain(TenantChain $chain, string $eventTopic): void
    {
        $this->currentChainId = $chain->chain_id;
        $tenant  = $chain->tenant;
        $rpcUrl  = $this->getRpcUrl($chain->chain_id);
        $label   = "{$tenant->slug} / {$chain->chain_name}";

        // Get current block
        $current = $this->getBlockNumber($rpcUrl);
        if ($current === null) {
            $this->warn("[{$label}] Could not fetch current block — skipping.");
            return;
        }

        // Determine starting block
        if ($this->option('full')) {
            $fromBlock = 0;
        } elseif ($chain->last_synced_block !== null) {
            $fromBlock = $chain->last_synced_block + 1;
        } else {
            // First-time sync: go back ~100k blocks (~3–5 days depending on chain)
            $fromBlock = max(0, $current - 100_000);
        }

        if ($fromBlock > $current) {
            $this->line("[{$label}] Already up to date.");
            return;
        }

        $this->info("[{$label}] Syncing blocks {$fromBlock} → {$current}…");

        $newMints   = 0;
        $latestSeen = $chain->last_synced_block ?? 0;

        // Chunk to respect RPC block-range limits
        for ($from = $fromBlock; $from <= $current; $from += self::CHUNK_SIZE) {
            $to   = min($from + self::CHUNK_SIZE - 1, $current);
            $logs = $this->getLogs($rpcUrl, $chain->registry_address, $eventTopic, $from, $to);

            if ($logs === null) {
                $this->warn("[{$label}] eth_getLogs failed for {$from}-{$to} — stopping early.");
                break;
            }

            foreach ($logs as $log) {
                if ($this->processLog($log, $chain, $tenant)) {
                    $newMints++;
                }
                $blockNum = hexdec($log['blockNumber']);
                if ($blockNum > $latestSeen) {
                    $latestSeen = $blockNum;
                }
            }
        }

        // Persist furthest synced block
        $chain->last_synced_block = max($latestSeen, $current);
        $chain->save();

        $this->info("[{$label}] Done — {$newMints} new mint(s) synced.");
    }

    private function processLog(array $log, TenantChain $chain, $tenant): bool
    {
        // SubnodeCreated(bytes32 indexed node, bytes name, address owner)
        // topics[0] = event sig, topics[1] = node
        // data = ABI-encoded (bytes name, address owner)

        $rawData = hex2bin(ltrim($log['data'] ?? '', '0x'));
        if (strlen($rawData) < 96) {
            return false;
        }

        // Slot 0 (bytes 0-31): offset pointer to `name` (should be 0x40 = 64)
        // Slot 1 (bytes 32-63): `owner` address (right-aligned in 32 bytes)
        $ownerBytes = substr($rawData, 32 + 12, 20); // drop 12 leading zero bytes
        $owner      = '0x' . strtolower(bin2hex($ownerBytes));

        // Slot 2 (bytes 64-95): length of `name` bytes
        $nameLen = hexdec(bin2hex(substr($rawData, 64, 32)));
        if ($nameLen === 0 || strlen($rawData) < 96 + $nameLen) {
            return false;
        }

        // DNS-encoded name starts at byte 96
        $dnsName  = substr($rawData, 96, $nameLen);
        $fullName = $this->decodeDnsName($dnsName);
        if (!$fullName) {
            return false;
        }

        // Expect format: label.parentdomain.eth
        $parts = explode('.', $fullName, 2);
        if (count($parts) < 2) {
            return false;
        }
        $subLabel = $parts[0];

        try {
            $claim = Claim::firstOrCreate(
                ['tenant_id' => $tenant->id, 'wallet_address' => $owner],
                [
                    'subdomain'  => $subLabel,
                    'full_name'  => $fullName,
                    'claimed_at' => now(),
                ]
            );

            $minted = $claim->minted_chains ?? [];
            if (!in_array($chain->chain_id, $minted)) {
                $claim->minted_chains = array_values(array_unique([...$minted, $chain->chain_id]));
                $claim->save();
                return true; // new mint recorded
            }
        } catch (\Throwable $e) {
            Log::error('SyncL2Mints: failed to upsert claim', [
                'owner'    => $owner,
                'fullName' => $fullName,
                'chainId'  => $chain->chain_id,
                'error'    => $e->getMessage(),
            ]);
        }

        return false;
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private function getRpcUrl(int $chainId): string
    {
        $alchemyKey = config('app.alchemy_key') ?: env('ALCHEMY_KEY');
        if ($alchemyKey && isset(self::ALCHEMY_NETWORK[$chainId])) {
            return 'https://' . self::ALCHEMY_NETWORK[$chainId] . ".g.alchemy.com/v2/{$alchemyKey}";
        }
        return self::PUBLIC_RPC[$chainId] ?? throw new \RuntimeException("No RPC URL for chain {$chainId}");
    }

    private function getBlockNumber(string $rpcUrl): ?int
    {
        try {
            $res = Http::timeout(10)->post($rpcUrl, [
                'jsonrpc' => '2.0', 'method' => 'eth_blockNumber', 'params' => [], 'id' => 1,
            ]);
            $hex = $res->json('result');
            return $hex ? (int) hexdec($hex) : null;
        } catch (\Throwable) {
            return null;
        }
    }

    private function getLogs(string $rpcUrl, string $address, string $topic, int $from, int $to): ?array
    {
        $payload = [
            'jsonrpc' => '2.0',
            'method'  => 'eth_getLogs',
            'params'  => [[
                'fromBlock' => '0x' . dechex($from),
                'toBlock'   => '0x' . dechex($to),
                'address'   => $address,
                'topics'    => [$topic],
            ]],
            'id' => 1,
        ];

        $urls = [$rpcUrl];

        // If using Alchemy and it fails with a block-range restriction (free tier),
        // transparently retry with the public RPC fallback.
        foreach ($urls as $url) {
            try {
                $res   = Http::timeout(30)->post($url, $payload);
                $error = $res->json('error');

                if ($error) {
                    $msg = $error['message'] ?? '';
                    // Alchemy free-tier block range limit — retry on public RPC
                    if (str_contains($msg, 'block range') || str_contains($msg, 'Free tier')) {
                        Log::info('SyncL2Mints: Alchemy block-range limit hit, falling back to public RPC');
                        // Append public RPC as next attempt if not already queued
                        $chainId = $this->currentChainId;
                        if ($chainId && isset(self::PUBLIC_RPC[$chainId]) && !in_array(self::PUBLIC_RPC[$chainId], $urls)) {
                            $urls[] = self::PUBLIC_RPC[$chainId];
                        }
                        continue;
                    }
                    Log::warning('SyncL2Mints: eth_getLogs error', (array) $error);
                    return null;
                }

                return $res->json('result') ?? [];
            } catch (\Throwable $e) {
                Log::error('SyncL2Mints: HTTP error', ['url' => $url, 'error' => $e->getMessage()]);
            }
        }

        return null;
    }

    /**
     * Decode a DNS-encoded name (e.g. \x05alice\x0bpixelgoblins\x03eth\x00)
     * into a dotted string (e.g. "alice.pixelgoblins.eth").
     */
    private function decodeDnsName(string $dns): ?string
    {
        $parts = [];
        $i     = 0;
        $len   = strlen($dns);

        while ($i < $len) {
            $labelLen = ord($dns[$i]);
            if ($labelLen === 0) break;
            if ($i + 1 + $labelLen > $len) return null;
            $parts[] = substr($dns, $i + 1, $labelLen);
            $i += 1 + $labelLen;
        }

        return $parts ? implode('.', $parts) : null;
    }
}
