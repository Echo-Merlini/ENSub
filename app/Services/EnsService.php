<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class EnsService
{
    private const REGISTRY = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

    // Compute ENS namehash (EIP-137)
    public function namehash(string $name): string
    {
        $node = str_repeat("\x00", 32);

        if ($name === '') {
            return '0x' . bin2hex($node);
        }

        $labels = array_reverse(explode('.', $name));

        foreach ($labels as $label) {
            $labelHash = hex2bin(substr(keccak256($label), 2));
            $node      = hex2bin(substr(keccak256(bin2hex($node . $labelHash)), 2));
        }

        return '0x' . bin2hex($node);
    }

    // Check who owns an ENS name via the registry
    public function getOwner(string $ensDomain): ?string
    {
        $namehash = $this->namehash($ensDomain);

        // owner(bytes32) = 0x02571be3
        $data = '0x02571be3' . str_pad(substr($namehash, 2), 64, '0', STR_PAD_LEFT);

        $res = Http::post('https://eth-mainnet.g.alchemy.com/v2/' . config('services.alchemy.key'), [
            'jsonrpc' => '2.0',
            'method'  => 'eth_call',
            'params'  => [['to' => self::REGISTRY, 'data' => $data], 'latest'],
            'id'      => 1,
        ]);

        if (! $res->successful()) {
            return null;
        }

        $result = $res->json()['result'] ?? '0x';
        if (strlen($result) < 66) {
            return null;
        }

        $address = '0x' . substr($result, -40);

        // Zero address means not registered
        if ($address === '0x' . str_repeat('0', 40)) {
            return null;
        }

        return strtolower($address);
    }

    public function isOwnedBy(string $ensDomain, string $walletAddress): bool
    {
        $owner = $this->getOwner($ensDomain);
        return $owner !== null && $owner === strtolower($walletAddress);
    }
}

// Standalone keccak256 helper (uses web3p under the hood)
function keccak256(string $input, bool $rawInput = false): string
{
    $util = new \Web3p\EthereumUtil\Util();
    return $util->sha3($rawInput ? $input : $input);
}
