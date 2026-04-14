# Durin Integration

**Goal:** Add on-chain L2 subdomain minting (via Durin) as an optional add-on to ENSub's existing offchain (Namestone) flow.  
**Status:** ✅ Phase 1 + Phase 2 done — Phase 3 pending

---

## What is Durin?

Open-source framework by Namestone for deploying ENS subdomains as mintable NFTs on L2 chains.  
Repo: https://github.com/namestonehq/durin  
Site: https://durin.dev/

**Core contracts:**
| Contract | Address | Role |
|---|---|---|
| L1Resolver | `0x8A968aB9eb8C084FBC44c531058Fc9ef945c3D61` | ENS mainnet entry point, forwards to L2 via CCIP-Read |
| L2RegistryFactory | `0xDddddDdDDD8Aa1f237b4fa0669cb46892346d22d` | Permissionless registry deployer (same address on all chains) |
| L2Registry | deployed per tenant | ERC-721, tracks subdomain ownership + records |
| L2Registrar | deployed per tenant | Controls mint logic (pricing, gating, expiry) |

**Resolver addresses:**
| Resolver | Address | Role |
|---|---|---|
| Namestone offchain | `0xA87361C4E58B619c390f469B9E6F27d759715125` | CCIP-Read → Namestone DB (gasless) |
| Durin L1Resolver | `0x8A968aB9eb8C084FBC44c531058Fc9ef945c3D61` | CCIP-Read → L2Registry (on-chain NFT) |

**Supported chains:** Arbitrum · Base · Celo · Linea · Optimism · Polygon · Scroll · Worldchain

---

## Product Design

### Manage page
- **L2 Claim Chains** section: add chain → deploy registry + registrar (in-browser wallet txs) → chain active on claim page. Per-chain toggle, ⚙ Fix button to redeploy registrar.
- **ENS On-chain Resolution** section (shown when ≥1 chain deployed): Step 1 set resolver, Step 2 register each L2 registry on mainnet. Revert to Namestone button included.

### Claim page
```
[Ξ ETH — Gasless ▼]   ← always shown, Namestone offchain
  ─────────────────
  🔵 Base              ← shown per configured L2 chain
  🔴 Optimism
```
Selecting an L2 chain triggers `L2Registrar.register()` on that chain. 1-per-wallet per chain enforced in UI; seeded from DB on page load.

---

## DB Schema

### `tenant_chains`
```
id
tenant_id          FK → tenants.id
chain_id           int  (8453=Base, 10=Optimism, 42161=Arbitrum, 137=Polygon, etc.)
chain_name         string
registry_address   string nullable
registrar_address  string nullable
enabled            bool default true
created_at / updated_at
```

### `claims` additions
```
minted_chains      JSON nullable  — array of chain IDs where this wallet has minted
```

---

## Phases

### ✅ Phase 0 — Planning
- [x] Research Durin architecture
- [x] Define product design
- [x] Define DB schema

---

### ✅ Phase 1 — Foundation
- [x] Migration: `tenant_chains` table
- [x] Migration: `minted_chains` JSON column on `claims`
- [x] Model: `TenantChain.php` + `Claim.php` cast
- [x] API: CRUD endpoints for tenant chains
- [x] Manage page: L2 Chains section (deploy or paste addresses, toggle, remove, ⚙ Fix)
- [x] Claim page: chain selector, L2 mint flow, 1-per-wallet UI enforcement
- [x] `record-l2-mint` API endpoint — records chain ID after successful mint tx
- [x] Manage claims list: `Ξ ETH` badge + per-chain mint badges
- [x] Filament admin: L2 Mints column

---

### ✅ Phase 2 — ENS On-chain Resolution
- [x] Deploy flow: `L2RegistryFactory.deployRegistry()` + deploy `L2Registrar` + `addRegistrar()` + `setBaseURI()` — all in one click
- [x] NFT metadata endpoint: `GET /nft/{slug}/{chainId}/{tokenId}` — resolves tokenId via keccak256 namehash, returns ERC-721 JSON with animated GIF image
- [x] Manage page: ENS On-chain Resolution card
  - [x] Step 1: `ENSRegistry.setResolver(node, L1ResolverAddress)` on mainnet
  - [x] Step 2: `L1Resolver.setL2Registry(node, chainId, registryAddress)` per chain
  - [x] ↩ Revert to Namestone button
  - [x] Amber warning about breaking Namestone offchain resolution

---

### ⬜ Phase 3 — Cross-chain Claims Sync
**Goal:** Index on-chain L2 mints so they appear in the claims list even if the user bypassed the claim page.

- [ ] Index `NameRegistered` events from each tenant's L2Registry via Alchemy webhooks or polling
- [ ] Sync to `claims` table (create record if missing, update `minted_chains`)
- [ ] Revoke = call `L2Registry.burn(tokenId)` on the correct L2 chain (owner-gated)

---

### ⬜ Phase 4 — Registrar Upgrades
**Goal:** Contract-level enforcement and paid/gated minting.

- [ ] Custom L2Registrar with on-chain 1-per-wallet check
- [ ] Paid registrar: configurable mint price, treasury address
- [ ] Expiry support: subdomain renewal flow
- [ ] Gate at contract level: NFT/token-gated minting matching the tenant's gate config

---

## Notes / Decisions Log

- **Dual-resolver trade-off:** Switching to Durin L1Resolver breaks Namestone offchain resolution — these are incompatible at the ENS resolver level. ENSub shows a clear warning before Step 1 and provides a revert button. Migration path: encourage all claimants to mint on at least one L2 chain, then switch.
- **keccak256 vs SHA3-256:** ENS namehash uses pre-standard Keccak (not NIST SHA3). PHP `hash('sha3-256')` is wrong — must use `kornrunner/Keccak::hash()`.
- **L2 TLD limitation:** `.base`, `.op` etc. are separate name systems not accessible through Durin. L2 chains are storage/NFT layers only; names stay `.eth`.
- **deployContract vs sendTransaction:** wagmi's `sendTransaction` without explicit `account` doesn't produce a contract creation tx (contractAddress = null). Must use `deployContract` with `account: address`.
- **Open registrar:** Current L2Registrar is free/open — anyone can call `register()` directly. 1-per-wallet is UI-only until Phase 4.
