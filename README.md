# ENSub

**Gasless ENS subdomain manager** — lets any ENS domain owner launch a token-gated subdomain claim page in minutes. No code, no gas fees.

🌐 **Live:** https://www.ensub.org

---

## What it does

ENSub gives any <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/ens-logo.svg" height="14" alt="ENS"> **ENS** domain owner a fully branded subdomain claim page at `ensub.org/claim/yourname`. Visitors connect their wallet and claim a free `*.yourdomain.eth` subdomain — gaslessly via Namestone, and optionally as an on-chain NFT on any supported L2 via [Durin](https://durin.dev).

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Laravel 11 + Filament 3 (admin panel) |
| Frontend | Inertia.js + React + Vite |
| Wallets | RainbowKit + wagmi v2 + viem |
| Auth | SIWE (Sign In With Ethereum) |
| <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/ens-logo.svg" height="13" alt="ENS"> ENS | On-chain ownership checks via Alchemy + EIP-137 namehash (keccak256) |
| <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="13" alt="Namestone"> Namestone | Gasless offchain subdomain resolver API |
| Durin | L2 subdomain NFT contracts (L2Registry + L2Registrar) |
| Billing | Laravel Cashier + Stripe (Pro $9/mo, Business $29/mo) |
| DB | SQLite (persistent volume on NAS) |
| Deploy | Docker → Coolify (NAS) → Cloudflare Tunnel |

---

## Claim modes

### Ξ ETH — Gasless (Namestone)
Subdomains are resolved offchain through Namestone using EIP-3668 CCIP-Read. Zero on-chain transactions for claimants after the domain owner does a one-time resolver setup. Tracked in the `claims` DB table.

### L2 NFT Minting (Durin)
Each L2 chain needs two deployed contracts:
- **L2Registry** — ERC-721 contract deployed via the Durin factory (`0xDddddDdDDD8Aa1f237b4fa0669cb46892346d22d`). Manages subnode records.
- **L2Registrar** — open registrar that calls `createSubnode()` on the registry. Must be authorized via `addRegistrar()` on the registry.

The Manage page deploys both in one click (registry → registrar → authorize → set metadata URI). L2 mints are tracked in the `minted_chains` JSON column on each claim record. Each minted NFT returns metadata from the `/nft/{slug}/{chainId}/{tokenId}` endpoint.

**Supported L2s:** Base · Optimism · Arbitrum · Polygon · Linea · Scroll

### ENS On-chain Resolution (Durin Phase 2)
Once L2 chains are deployed, the Manage page guides the domain owner through two mainnet steps:
1. **Set resolver** — points the ENS domain at the pre-deployed Durin L1Resolver (`0x8A968aB9eb8C084FBC44c531058Fc9ef945c3D61`)
2. **Register L2 registries** — calls `setL2Registry(node, chainId, registryAddress)` on the L1Resolver for each chain

After this, `subdomain.yourdomain.eth` resolves on-chain via CCIP-Read from the L2Registry. A **↩ Revert to Namestone** button is available to switch back to the Namestone offchain resolver (`0xA87361C4E58B619c390f469B9E6F27d759715125`).

> ⚠️ Switching to the L1Resolver disables Namestone offchain resolution — gasless-only claimants who haven't minted on an L2 will stop resolving in wallets/dApps.

---

## Onboarding flow

1. **Verify wallet** — SIWE nonce/signature to prove ENS ownership
2. **ENS domain** — checks on-chain ownership via Alchemy + ENS Registry
3. **Eligibility** — gate config: open / NFT / ERC-20 / allowlist
4. **Set resolver** — one-time on-chain tx to point ENS domain at Namestone's resolver; Name Wrapper aware; auto-skips if already set
5. **Namestone API key** — "Enable via wallet" SIWE sign → auto-populates API key

---

## Features

- **Multi-tenant** — each ENS owner gets their own branded claim page at `/claim/{slug}`
- **Gate types** — open, NFT (ETHscriptions/ERC-721), ERC-20 token, allowlist
- **Light/dark mode** — localStorage, toggled from nav
- **Animated background** — optional Vanta.js NET
- **Claim page** — `Ξ ETH` gasless row + one row per configured L2 chain with MINT button; already-claimed wallets see their chain status and can mint on additional L2s; 1-per-wallet per chain enforced in UI
- **NFT metadata** — `GET /nft/{slug}/{chainId}/{tokenId}` returns ERC-721 metadata (name, description, image, chain attribute); tokenId resolved via keccak256 namehash
- **Manage page** (owner-only, wallet-verified):
  - Edit branding, gate config, Namestone API key, claim limit
  - L2 Chains: deploy contracts in-browser (1 click); enable/disable per chain; ⚙ Fix button redeploys and re-authorizes the registrar
  - ENS On-chain Resolution: set/revert resolver + register L2 registries on mainnet; amber warning before switching away from Namestone
  - Claims list: `Ξ ETH` badge + per-chain mint badges; per-row revoke
  - Share card (Twitter/X, Farcaster, copy link) · Embed widget (Pro/Business only)
- **Filament admin** at `/admin` — tenant management, claims list with L2 Mints column
- **Stripe billing** — Free: 50 claims · Pro: 500 · Business: unlimited

---

## Known limitations / Next

- **L2 1-per-wallet is UI-only** — the L2Registrar contract is open; anyone can call `register()` directly and bypass the UI check. Needs a contract-level guard (custom registrar with on-chain duplicate check) for strict enforcement.
- **Revoke doesn't burn L2 NFT** — the Manage page Revoke button removes the Namestone offchain record only; it cannot burn the on-chain L2 NFT held by the claimant.
- **No cross-chain sync** — L2 mint events (`NameRegistered`) are not indexed. If a user mints on L2 directly (bypassing the claim page), it won't appear in the claims list. Phase 3 goal: index events via Alchemy and sync to DB.
- **L2-only claimants** — if a user mints on L2 without doing the offchain step, there's no Namestone record. Subdomain resolves on-chain only after the L1Resolver phase is done.
- **Open registrar** — current L2Registrar is free/open. No pricing, expiry, or gating at the contract level. Requires a custom registrar for paid or gated L2 minting.

---

## Local dev

```bash
composer install
npm install --legacy-peer-deps
cp .env.example .env
php artisan key:generate
php artisan migrate
npm run dev
php artisan serve
```

**Required `.env` keys:**
```
ALCHEMY_KEY=
WALLETCONNECT_PROJECT_ID=
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=
STRIPE_PRICE_BUSINESS=
```

---

## Deployment (Coolify on NAS)

- Container port: 80, reverse-proxied via Traefik
- Cloudflare tunnel exposes the app publicly
- Persistent SQLite on a mounted host volume
- `php artisan migrate` runs on each deploy

---

## Stripe webhook

- Endpoint: `https://www.ensub.org/stripe/webhook`
- Events: `customer.subscription.created/updated/deleted`

---

## GitHub

https://github.com/Echo-Merlini/ENSub
