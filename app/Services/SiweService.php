<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Web3p\EthereumUtil\Util;

class SiweService
{
    public function generateNonce(string $address): string
    {
        $nonce   = Str::random(16);
        $message = $this->buildMessage($address, $nonce);

        Cache::put("siwe_nonce_{$address}",   $nonce,   now()->addMinutes(5));
        Cache::put("siwe_message_{$address}", $message, now()->addMinutes(5));

        return $nonce;
    }

    public function buildMessage(string $address, string $nonce): string
    {
        return implode("\n", [
            'ensub.org wants you to sign in with your Ethereum account:',
            $address,
            '',
            'Sign in to ENSub — ensub.org',
            '',
            'Nonce: ' . $nonce,
            'Issued At: ' . now()->toIso8601String(),
        ]);
    }

    public function getCachedMessage(string $address): string
    {
        return Cache::get("siwe_message_{$address}", '');
    }

    public function verifySignature(string $address, string $signature, string $nonce): bool
    {
        $storedNonce   = Cache::get("siwe_nonce_{$address}");
        $storedMessage = Cache::get("siwe_message_{$address}");

        if (! $storedNonce || $storedNonce !== $nonce || ! $storedMessage) {
            return false;
        }

        try {
            $util    = new Util();
            $prefixedHash  = $util->hashPersonalMessage($storedMessage);
            $recovered     = $util->recoverPublicKey($prefixedHash, $signature);
            $recoveredAddr = strtolower('0x' . substr($util->publicKeyToAddress($recovered), -40));

            if ($recoveredAddr === strtolower($address)) {
                Cache::forget("siwe_nonce_{$address}");
                Cache::forget("siwe_message_{$address}");
                return true;
            }
        } catch (\Throwable) {
            // signature parse error
        }

        return false;
    }
}
