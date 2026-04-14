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
| <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/ens-logo.svg" height="13" alt="ENS"> ENS | On-chain ownership checks via Alchemy + EIP-137 namehash |
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

The Manage page lets the owner deploy both contracts in 3 steps (registry → registrar → authorize) with a single button click. Per-chain "⚙ Fix" button redeploys the registrar and re-authorizes it if minting is broken. L2 mints are tracked in the `minted_chains` JSON column on each claim record.

**Supported L2s:** Base · Optimism · Arbitrum · Polygon · Linea · Scroll

---

## Onboarding flow

1. **Verify wallet** — SIWE nonce/signature to prove ENS ownership
2. **ENS domain** — checks on-chain ownership via Alchemy + ENS Registry
3. **Eligibility** — gate config: open / NFT / ERC-20 / allowlist
4. **Set resolver** — one-time on-chain tx to point your ENS domain at Namestone's resolver (`0xA87361c4E58B619c390f469B9E6F27d759715125`); Name Wrapper aware; auto-skips if already set
5. **Namestone API key** — "Enable via wallet" SIWE sign → auto-populates API key

---

## Features

- **Multi-tenant** — each ENS owner gets their own branded claim page at `/claim/{slug}`
- **Gate types** — open, NFT (ETHscriptions/ERC-721), ERC-20 token, allowlist
- **Light/dark mode** — localStorage, toggled from nav
- **Animated background** — optional Vanta.js NET, configurable in admin panel
- **Claim page** — shows offchain `Ξ ETH` row + one row per configured L2 chain with MINT button; already-claimed wallets see chain status bars and can mint on L2 without re-claiming offchain
- **Manage page** (owner-only, wallet-verified):
  - Edit branding, gate config, Namestone API key, claim limit
  - L2 Chains section: add chain (deploy contracts in-browser) or paste existing addresses; enable/disable per chain; "⚙ Fix" redeploys registrar
  - Claims list: per-claim `Ξ ETH` badge + L2 chain badges (Base, Optimism, etc.) for minted chains; per-row revoke
  - Share card: Twitter/X, Farcaster, copy-link
  - Embed card (Pro/Business only)
- **Filament admin** at `/admin` — tenant management, claims list with L2 Mints column, background settings
- **Stripe billing** — Free: 50 claims, Pro: 500, Business: unlimited

---

## Known limitations / TODO

- **L2 NFT metadata** — minted NFTs have no `tokenURI` / metadata (show as empty in wallets). Needs a metadata resolver contract or API endpoint implementing `tokenURI`.
- **L2 ENS resolution** — L2 subdomains are minted as NFTs but not yet resolvable via ENS. Requires a Phase 2 L1Resolver setup on Ethereum mainnet pointing at each L2Registry.
- **Revoke doesn't affect L2** — the Manage page "Revoke" button removes the offchain Namestone record but cannot burn the on-chain L2 NFT (which belongs to the holder).
- **L2 1-per-wallet is UI-only** — the L2Registrar contract is open; anyone can call `register()` directly and bypass the 1-per-wallet UI check. Needs a contract-level guard if strict enforcement is required.
- **No cross-chain sync** — if a user claims on L2 without offchain, there's no Namestone record (subdomain won't resolve in ENS until L1Resolver phase is done).

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
