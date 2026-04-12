<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use kornrunner\Keccak;
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
            'Sign in to ENSub',
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
            // Build personal message hash using byte length (strlen), not char length (mb_strlen)
            // MetaMask uses: "\x19Ethereum Signed Message:\n{byteLength}{message}"
            $prefix = "\x19Ethereum Signed Message:\n" . strlen($storedMessage);
            $hash   = '0x' . Keccak::hash($prefix . $storedMessage, 256);

            // Parse the 65-byte signature: 0x{r:64}{s:64}{v:2}
            $sig = ltrim($signature, '0x');
            if (strlen($sig) !== 130) {
                return false;
            }
            $r = '0x' . substr($sig, 0, 64);
            $s = '0x' . substr($sig, 64, 64);
            $v = hexdec(substr($sig, 128, 2));
            if ($v >= 27) {
                $v -= 27; // normalize to 0 or 1
            }

            $util      = new Util();
            $publicKey = $util->recoverPublicKey($hash, $r, $s, $v);
            $recovered = strtolower($util->publicKeyToAddress($publicKey));

            if ($recovered === strtolower($address)) {
                Cache::forget("siwe_nonce_{$address}");
                Cache::forget("siwe_message_{$address}");
                return true;
            }
        } catch (\Throwable $e) {
            \Log::debug('SIWE verify failed: ' . $e->getMessage());
        }

        return false;
    }
}
