# ENSub

**Gasless ENS subdomain manager** — lets any ENS domain owner launch a token-gated subdomain claim page in minutes. No code, no gas fees.

🌐 **Live:** https://www.ensub.org

## Stack

- **Backend:** Laravel 11 + Filament 3 (admin panel)
- **Frontend:** Inertia.js + React + Tailwind v3
- **Auth:** SIWE (Sign In With Ethereum) via web3p/ethereum-util
- **ENS:** On-chain ownership via Alchemy + EIP-137 namehash
- **Subdomains:** Namestone API (gasless offchain resolver)
- **Billing:** Laravel Cashier + Stripe (Pro $9/mo, Business $29/mo)
- **DB:** SQLite (persistent volume on NAS)
- **Deploy:** Docker → Coolify (NAS) → Cloudflare Tunnel

## Onboarding flow

1. **Verify wallet** — SIWE nonce/signature to prove ENS ownership
2. **ENS domain** — checks on-chain ownership via Alchemy + ENS Registry
3. **Eligibility** — gate config: open / NFT / allowlist
4. **Set resolver** — in-app on-chain tx to point ENS to Namestone's resolver (`0xA87361c4E58B619c390f469B9E6F27d759715125`); detects wrapped vs unwrapped domains (Name Wrapper aware); auto-skips if resolver already set
5. **Namestone API key** — "Enable via wallet" button: fetches SIWE message from Namestone, user signs once, backend calls `POST /enable-domain`; API key auto-populated from response; security warning shown once key is visible

## Features

- Multi-tenant: each ENS owner gets their own branded claim page at `/claim/{slug}`
- Gate types: open, NFT (ETHscriptions/ERC-721), allowlist
- **Manage page** (owner-only, wallet-verified):
  - Edit branding, gate config, Namestone API key, claim limit
  - Claims list with per-row revoke (removes from Namestone + DB)
  - Share card: Twitter/X, Farcaster, copy-link buttons
  - Embed card (Pro/Business only): copy-able `<iframe>` snippet for external sites; free plan shows upgrade prompt
- **Claim page**: "⚙ Manage" button visible only to the ENS owner wallet; social share bar (Twitter/X, Farcaster, copy link) for all visitors
- Stripe billing with plan-based claim limits (Free: 50, Pro: 500, Business: unlimited)
- Filament admin panel at `/admin`

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
ALCHEMY_KEY=           # Ethereum RPC for ENS ownership checks
WALLETCONNECT_PROJECT_ID=
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=      # price_...
STRIPE_PRICE_BUSINESS= # price_...
```

## Deployment (Coolify on NAS)

- App UUID: `tx65hcp19435t5khjwpqh627`
- Container port: 80 mapped to host port **8181**
- Traefik dynamic config: `/volume1/docker/ECHO/data/coolify/proxy/dynamic/ensub.yaml`
- Cloudflare tunnel: `cloudflared-ensub` container (separate from main cloudflared)
- Persistent SQLite: `/volume1/docker/ECHO/data/ensub/database/database.sqlite`

After each redeploy the container IP changes — but Traefik routes via fixed host port `127.0.0.1:8181` so no manual updates needed.

## Stripe webhook

Registered at: `https://www.ensub.org/stripe/webhook`
Webhook ID: `we_1TLUw4Hy6KPYkr46RrkDb9ke`
Events: `customer.subscription.created/updated/deleted`

## GitHub

https://github.com/Echo-Merlini/ENSub
