# ENSub

**Gasless ENS subdomain manager** — lets any ENS domain owner launch a token-gated subdomain claim page in minutes. No code, no gas fees.

🌐 **Live:** https://www.ensub.org

---

## What it does

ENSub gives any <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/ens-logo.svg" height="14" alt="ENS"> **ENS** domain owner a fully branded subdomain claim page at `ensub.org/claim/yourname`. Visitors connect their wallet and claim a free `*.yourdomain.eth` subdomain — gaslessly, instantly, with optional token-gating.

Subdomains are resolved offchain through <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="14" alt="Namestone"> **Namestone**, meaning zero on-chain transactions for claimants and no gas costs for the domain owner after the initial one-time resolver setup.

---

## Stack

| Layer | Tech |
|---|---|
| Backend | Laravel 11 + Filament 3 (admin panel) |
| Frontend | Inertia.js + React + Tailwind v3 |
| Auth | SIWE (Sign In With Ethereum) via web3p/ethereum-util |
| <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/ens-logo.svg" height="13" alt="ENS"> ENS | On-chain ownership checks via Alchemy + EIP-137 namehash |
| <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="13" alt="Namestone"> Namestone | Gasless offchain subdomain resolver API |
| Billing | Laravel Cashier + Stripe (Pro $9/mo, Business $29/mo) |
| DB | SQLite (persistent volume on NAS) |
| Deploy | Docker → Coolify (NAS) → Cloudflare Tunnel |

---

## Onboarding flow

1. **Verify wallet** — SIWE nonce/signature to prove <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/ens-logo.svg" height="13" alt="ENS"> ENS ownership
2. **ENS domain** — checks on-chain ownership via Alchemy + ENS Registry
3. **Eligibility** — gate config: open / NFT / ERC-20 / allowlist
4. **Set resolver** — one-time on-chain tx to point your ENS domain at <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="13" alt="Namestone"> Namestone's resolver (`0xA87361c4E58B619c390f469B9E6F27d759715125`); detects wrapped vs unwrapped domains (Name Wrapper aware); auto-skips if resolver already set
5. **Namestone API key** — "Enable via wallet" button: fetches SIWE message from <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="13" alt="Namestone"> Namestone, user signs once, backend calls `POST /enable-domain`; API key auto-populated from response

---

## Features

- **Multi-tenant** — each ENS owner gets their own branded claim page at `/claim/{slug}`
- **Gate types** — open, NFT (ETHscriptions/ERC-721), ERC-20 token, allowlist
- **Light/dark mode** — persisted in localStorage, toggled from the nav
- **Animated background** — optional Vanta.js NET effect, fully configurable from the admin panel
- **Manage page** (owner-only, wallet-verified):
  - Edit branding, gate config, <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="13" alt="Namestone"> Namestone API key, claim limit
  - Claims list with per-row revoke (removes from Namestone + DB)
  - Share card: Twitter/X, Farcaster, copy-link
  - Embed card (Pro/Business only): `<iframe>` snippet; free plan shows upgrade prompt
- **Claim page** — tenant logo, social share bar, ENS subdomain explainer section
- **Stripe billing** — plan-based claim limits (Free: 50, Pro: 500, Business: unlimited)
- **Filament admin** at `/admin` — tenant management, background settings

---

## How <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="14" alt="Namestone"> Namestone works

<img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/namestone-logo.png" height="13" alt="Namestone"> Namestone is an offchain <img src="https://raw.githubusercontent.com/Echo-Merlini/ENSub/main/public/images/ens-logo.svg" height="13" alt="ENS"> ENS resolver. Once a domain owner points their ENS domain at Namestone's resolver contract (one-time gas tx), all subdomain records are served offchain via Namestone's API using [EIP-3668 CCIP-Read](https://eips.ethereum.org/EIPS/eip-3668). Claimants pay zero gas. The domain owner manages everything through the ENSub dashboard.

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
ALCHEMY_KEY=             # Ethereum RPC for ENS ownership checks
WALLETCONNECT_PROJECT_ID=
STRIPE_KEY=
STRIPE_SECRET=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_PRO=        # price_...
STRIPE_PRICE_BUSINESS=   # price_...
```

---

## Deployment (Coolify on NAS)

- App UUID: `tx65hcp19435t5khjwpqh627`
- Container port: 80 → host port **8181**
- Traefik dynamic config: `/volume1/docker/ECHO/data/coolify/proxy/dynamic/ensub.yaml`
- Cloudflare tunnel: `cloudflared-ensub` container
- Persistent SQLite: `/volume1/docker/ECHO/data/ensub/database/database.sqlite`

After each redeploy the container IP changes — Traefik routes via fixed host port `127.0.0.1:8181` so no manual updates needed.

---

## Stripe webhook

- Endpoint: `https://www.ensub.org/stripe/webhook`
- Webhook ID: `we_1TLUw4Hy6KPYkr46RrkDb9ke`
- Events: `customer.subscription.created/updated/deleted`

---

## GitHub

https://github.com/Echo-Merlini/ENSub
