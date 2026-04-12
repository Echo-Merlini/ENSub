<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use kornrunner\Keccak;

class EnsService
{
    private const REGISTRY     = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';
    private const NAME_WRAPPER = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401';

    // Compute ENS namehash (EIP-137) — hashes raw bytes, not hex strings
    public function namehash(string $name): string
    {
        $node = str_repeat("\x00", 32); // 32 zero bytes

        if ($name === '') {
            return '0x' . bin2hex($node);
        }

        foreach (array_reverse(explode('.', $name)) as $label) {
            $labelHash = hex2bin(Keccak::hash($label, 256));           // keccak256(label bytes) → 32 bytes
            $node      = hex2bin(Keccak::hash($node . $labelHash, 256)); // keccak256(node ++ labelHash) → 32 bytes
        }

        return '0x' . bin2hex($node);
    }

    // Low-level eth_call helper — returns the address from a 32-byte result
    private function ethCall(string $to, string $selector, string $param): ?string
    {
        $paddedParam = str_pad(ltrim($param, '0x'), 64, '0', STR_PAD_LEFT);
        $data        = $selector . $paddedParam;

        $res = Http::post('https://eth-mainnet.g.alchemy.com/v2/' . config('services.alchemy.key'), [
            'jsonrpc' => '2.0',
            'method'  => 'eth_call',
            'params'  => [['to' => $to, 'data' => $data], 'latest'],
            'id'      => 1,
        ]);

        if (! $res->successful()) {
            return null;
        }

        $result = $res->json()['result'] ?? '0x';

        if (strlen($result) < 66) {
            return null;
        }

        $address = strtolower('0x' . substr($result, -40));

        // Zero address = not set
        if ($address === '0x' . str_repeat('0', 40)) {
            return null;
        }

        return $address;
    }

    public function getOwner(string $ensDomain): ?string
    {
        $namehash = $this->namehash($ensDomain);

        // 1. Check ENS registry: owner(bytes32)
        $registryOwner = $this->ethCall(self::REGISTRY, '0x02571be3', $namehash);

        if ($registryOwner === null) {
            return null;
        }

        // 2. If the registry owner is the Name Wrapper, check ownerOf(uint256) there
        //    Most names registered after May 2023 are wrapped.
        if ($registryOwner === strtolower(self::NAME_WRAPPER)) {
            return $this->ethCall(self::NAME_WRAPPER, '0x6352211e', $namehash);
        }

        return $registryOwner;
    }

    public function isOwnedBy(string $ensDomain, string $walletAddress): bool
    {
        $owner = $this->getOwner($ensDomain);
        return $owner !== null && $owner === strtolower($walletAddress);
    }
}
