# Durin Integration Plan

**Goal:** Add on-chain L2 subdomain minting (via Durin) as an optional add-on to ENSub's existing offchain (Namestone) flow.  
**Status:** 🔵 In progress — Phase 1

---

## What is Durin?

Open-source framework by Namestone for deploying ENS subdomains as mintable NFTs on L2 chains.  
Repo: https://github.com/namestonehq/durin  
Site: https://durin.dev/

**Core contracts:**
| Contract | Address | Role |
|---|---|---|
| L1Resolver | `0x8A968aB9eb8C084FBC44c531058Fc9ef945c3D61` | ENS mainnet entry point, forwards to L2 |
| L2RegistryFactory | `0xDddddDdDDD8Aa1f237b4fa0669cb46892346d22d` | Permissionless registry deployer (same address on all chains) |
| L2Registry | deployed per tenant | ERC-721, tracks subdomain ownership + records |
| L2Registrar | deployed per tenant | Controls mint logic (pricing, gating, expiry) |

**Supported chains (mainnet):** Arbitrum, Base, Celo, Linea, Optimism, Polygon, Scroll, Worldchain

---

## Product Design

### Manage page — "Claim Chains" section
- Offchain (Namestone) always shown as default, always on
- Owner can add L2 chains: select chain → deploy registry + registrar (wallet txs) → chain appears on claim page
- Per-chain toggle to enable/disable
- Shows registry + registrar contract addresses

### Claim page — chain dropdown
```
[Offchain — gasless ▼]
  Offchain (gasless)      ← default, current Namestone flow
  ─────────────────
  Base
  Optimism
  Arbitrum
```
Selecting an L2 chain swaps the claim button to a `L2Registrar.register()` tx on that chain.  
Includes "Switch to [Chain]" step if wallet is on wrong network.

### Business logic
- Offchain (Namestone) = always available, current free/pro limits apply
- L2 chains = Pro/Business add-on (natural upgrade hook)
- Claims from all chains merged in Manage claims list with "Source" column

---

## DB Schema

### New table: `tenant_chains`
```
id
tenant_id          FK → tenants.id
chain_id           int  (8453=Base, 10=Optimism, 42161=Arbitrum, 137=Polygon, etc.)
chain_name         string (Base, Optimism, Arbitrum, Polygon, ...)
chain_rpc_url      string nullable (optional custom RPC)
registry_address   string nullable
registrar_address  string nullable
enabled            bool default true
created_at / updated_at
```

---

## Phases

### ✅ Phase 0 — Planning
- [x] Research Durin architecture
- [x] Define product design (chain dropdown on claim, chain selector on manage)
- [x] Define DB schema

---

### 🔵 Phase 1 — Foundation (manual setup)
**Goal:** Full UI with manual contract address entry. No automated deployment yet.

- [ ] Migration: create `tenant_chains` table
- [ ] Model: `TenantChain.php`
- [ ] API: CRUD endpoints for tenant chains (`/api/manage/{slug}/chains`)
- [ ] Manage page: "Claim Chains" section (add/toggle/remove chains, enter addresses manually)
- [ ] Claim page: chain dropdown, L2 mint flow (wagmi contract call)
- [ ] Manage claims list: add source column

---

### ⬜ Phase 2 — Automated deployment
**Goal:** One-click chain activation from Manage page.

- [ ] Frontend: wallet flow to call `L2RegistryFactory.deployRegistry()` on L2
- [ ] Frontend: wallet flow to deploy `L2Registrar` with gate config
- [ ] Frontend: call `L2Registry.addRegistrar(registrarAddress)`
- [ ] Frontend: guide owner to set Durin L1Resolver on mainnet ENS (replaces Namestone resolver)
- [ ] Auto-populate registry + registrar addresses in DB on success

---

### ⬜ Phase 3 — Cross-chain claims sync
**Goal:** Read on-chain claims from L2 registries.

- [ ] Index `NameRegistered` events from each L2Registry via Alchemy
- [ ] Sync to `claims` table with `source` = chain name
- [ ] Revoke = call `L2Registry.burn()` (owner-gated)

---

## Supported Chain Config (for frontend dropdown)

```ts
export const DURIN_CHAINS = [
  { id: 8453,  name: 'Base',      icon: '🔵' },
  { id: 10,    name: 'Optimism',  icon: '🔴' },
  { id: 42161, name: 'Arbitrum',  icon: '🔷' },
  { id: 137,   name: 'Polygon',   icon: '🟣' },
  { id: 59144, name: 'Linea',     icon: '⬛' },
  { id: 534352,name: 'Scroll',    icon: '🟡' },
]
```

---

## Notes / Decisions Log

- **Dual-resolver complexity:** Running Namestone (offchain) AND Durin (L2) simultaneously requires the L1Resolver to handle both. To avoid this, L2 chains are an opt-in add-on — tenants can keep Namestone as offchain fallback, L2 chains are additive on the claim page. Resolver upgrade to Durin's L1Resolver is guided in Phase 2 when the owner activates their first L2 chain.
- **Phase 1 uses manual address entry** so we can test the full claim flow end-to-end before building the automated deployment in Phase 2.
- **Free tier gate:** L2 chain options only shown on claim page if the tenant is on Pro/Business plan.
