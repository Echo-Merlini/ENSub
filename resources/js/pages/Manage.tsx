import { useState, useEffect } from 'react'
import { WagmiProvider, useAccount, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { injectedWallet, metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { mainnet } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

interface TenantData {
    name: string
    ens_domain: string
    slug: string
    owner_address: string
    logo_url: string | null
    accent_color: string
    claim_limit: number
    claims_count: number
    plan: string
    gate_type: string
    contract_address: string | null
    collection_slug: string | null
    namestone_api_key: string
}

const queryClient = new QueryClient()

function getWagmiConfig() {
    const projectId = (window as any).__WALLETCONNECT_PROJECT_ID__ || '3b3f1c4ecbfa7edd5c5327b56985074a'
    const alchemyKey = (window as any).__ALCHEMY_KEY__
    const rpcUrl = alchemyKey ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}` : 'https://cloudflare-eth.com'
    return createConfig({
        chains: [mainnet],
        connectors: connectorsForWallets(
            [{ groupName: 'Popular', wallets: [injectedWallet, metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet] }],
            { appName: 'ENSub', projectId }
        ),
        transports: { [mainnet.id]: http(rpcUrl) },
        ssr: false,
    })
}

const wagmiConfig = getWagmiConfig()

const COLORS = {
    bg: '#0a0a1a',
    card: 'rgba(22,33,62,0.7)',
    border: 'rgba(255,255,255,0.07)',
    text: '#e4e4e4',
    muted: '#888',
    dim: '#555',
}

const inputStyle = {
    width: '100%',
    background: 'rgba(10,10,30,0.5)',
    border: '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: COLORS.text,
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
}

const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    color: COLORS.muted,
    marginBottom: '5px',
    letterSpacing: '0.05em',
} as const

function ManageContent({ tenant }: { tenant: TenantData }) {
    const { address, isConnected } = useAccount()
    const accent = tenant.accent_color

    const [form, setForm] = useState({
        name: tenant.name,
        logo_url: tenant.logo_url ?? '',
        accent_color: tenant.accent_color,
        namestone_api_key: tenant.namestone_api_key,
        gate_type: tenant.gate_type,
        contract_address: tenant.contract_address ?? '',
        collection_slug: tenant.collection_slug ?? '',
        claim_limit: tenant.claim_limit,
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')

    const isOwner = isConnected && address?.toLowerCase() === tenant.owner_address.toLowerCase()

    const set = (key: string, val: any) => setForm(f => ({ ...f, [key]: val }))

    const handleSave = async () => {
        if (!address) return
        setSaving(true)
        setError('')
        setSaved(false)
        try {
            const res = await fetch(`/api/manage/${tenant.slug}/save`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, owner_address: address }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Save failed')
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setSaving(false)
        }
    }

    const card = {
        background: COLORS.card,
        border: `1px solid ${COLORS.border}`,
        borderRadius: '12px',
        padding: '24px',
    }

    const planBadge: Record<string, string> = {
        free: '#555',
        pro: '#7c3aed',
        business: '#0891b2',
    }

    return (
        <main style={{ minHeight: '100vh', background: COLORS.bg, fontFamily: "'Inter', system-ui, sans-serif" }}>
            {/* Header */}
            <header style={{
                borderBottom: `1px solid ${COLORS.border}`,
                background: 'rgba(15,17,23,0.9)',
                backdropFilter: 'blur(8px)',
                padding: '16px 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                position: 'sticky', top: 0, zIndex: 10,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {tenant.logo_url && (
                        <img src={tenant.logo_url} alt={tenant.name}
                            style={{ width: '28px', height: '28px', borderRadius: '6px', imageRendering: 'pixelated' }} />
                    )}
                    <span style={{ fontWeight: 'bold', color: accent, textShadow: `0 0 10px ${accent}80` }}>
                        {tenant.name}
                    </span>
                    <span style={{
                        fontSize: '0.7rem', padding: '2px 8px', borderRadius: '99px',
                        background: planBadge[tenant.plan] ?? '#555', color: '#fff', fontWeight: 'bold',
                    }}>{tenant.plan.toUpperCase()}</span>
                </div>
                <ConnectButton />
            </header>

            <div style={{ maxWidth: '640px', margin: '0 auto', padding: '40px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Stats bar */}
                <div style={{ ...card, display: 'flex', gap: '24px' }}>
                    <div>
                        <p style={{ color: COLORS.muted, fontSize: '0.75rem' }}>Claims</p>
                        <p style={{ color: accent, fontWeight: 'bold', fontSize: '1.25rem' }}>
                            {tenant.claims_count}<span style={{ color: COLORS.dim, fontSize: '0.85rem' }}>/{tenant.claim_limit}</span>
                        </p>
                    </div>
                    <div>
                        <p style={{ color: COLORS.muted, fontSize: '0.75rem' }}>Domain</p>
                        <p style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '0.95rem' }}>*.{tenant.ens_domain}</p>
                    </div>
                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <a href={`/claim/${tenant.slug}`} target="_blank" rel="noopener noreferrer"
                            style={{
                                padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                                background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                color: '#0a0a1a', textDecoration: 'none',
                            }}>
                            View claim page →
                        </a>
                    </div>
                </div>

                {!isConnected && (
                    <div style={{ ...card, textAlign: 'center', padding: '40px' }}>
                        <p style={{ color: COLORS.muted, marginBottom: '20px', fontSize: '0.875rem' }}>
                            Connect the owner wallet to manage settings
                        </p>
                        <ConnectButton />
                    </div>
                )}

                {isConnected && !isOwner && (
                    <div style={{ ...card, textAlign: 'center', padding: '32px', borderColor: 'rgba(255,68,68,0.3)' }}>
                        <p style={{ color: '#ff4444', fontWeight: 'bold' }}>Not authorized</p>
                        <p style={{ color: COLORS.muted, fontSize: '0.875rem', marginTop: '8px' }}>
                            This page belongs to <span style={{ fontFamily: 'monospace', color: COLORS.dim }}>
                                {tenant.owner_address.slice(0, 6)}…{tenant.owner_address.slice(-4)}
                            </span>
                        </p>
                    </div>
                )}

                {isOwner && (
                    <>
                        {/* Branding */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '18px' }}>Branding</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Project name</label>
                                    <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} />
                                </div>
                                <div>
                                    <label style={labelStyle}>Logo URL</label>
                                    <input style={inputStyle} value={form.logo_url} onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
                                </div>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={labelStyle}>Accent color</label>
                                        <input style={inputStyle} value={form.accent_color} onChange={e => set('accent_color', e.target.value)} placeholder="#00ff88" />
                                    </div>
                                    <input type="color" value={form.accent_color} onChange={e => set('accent_color', e.target.value)}
                                        style={{ width: '44px', height: '40px', border: 'none', background: 'none', cursor: 'pointer', borderRadius: '6px' }} />
                                </div>
                            </div>
                        </div>

                        {/* Gate */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '18px' }}>Access gate</h2>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label style={labelStyle}>Gate type</label>
                                    <select style={{ ...inputStyle, appearance: 'none' as const }}
                                        value={form.gate_type} onChange={e => set('gate_type', e.target.value)}>
                                        <option value="open">Open — anyone can claim</option>
                                        <option value="nft">NFT holders only</option>
                                        <option value="allowlist">Allowlist</option>
                                    </select>
                                </div>
                                {form.gate_type === 'nft' && (
                                    <>
                                        <div>
                                            <label style={labelStyle}>Contract address</label>
                                            <input style={inputStyle} value={form.contract_address} onChange={e => set('contract_address', e.target.value)} placeholder="0x..." />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Collection slug (OpenSea/ETHscriptions)</label>
                                            <input style={inputStyle} value={form.collection_slug} onChange={e => set('collection_slug', e.target.value)} placeholder="my-collection" />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <label style={labelStyle}>Claim limit</label>
                                    <input style={inputStyle} type="number" min={1} max={50000}
                                        value={form.claim_limit} onChange={e => set('claim_limit', parseInt(e.target.value) || 1)} />
                                </div>
                            </div>
                        </div>

                        {/* Namestone */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px' }}>Namestone API key</h2>
                            <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '14px' }}>
                                Get your key at <a href="https://namestone.com" target="_blank" rel="noopener noreferrer"
                                    style={{ color: accent }}>namestone.com</a>
                            </p>
                            <input style={inputStyle} value={form.namestone_api_key}
                                onChange={e => set('namestone_api_key', e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
                        </div>

                        {/* Upgrade */}
                        {tenant.plan === 'free' && (
                            <div style={{ ...card, borderColor: `${accent}33`, background: `rgba(0,255,136,0.03)` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '0.9rem' }}>You're on the Free plan</p>
                                        <p style={{ color: COLORS.muted, fontSize: '0.8rem', marginTop: '2px' }}>50 claims · Upgrade for more</p>
                                    </div>
                                    <a href={`/pricing?slug=${tenant.slug}`}
                                        style={{
                                            padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold',
                                            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                            color: '#0a0a1a', textDecoration: 'none',
                                        }}>
                                        Upgrade →
                                    </a>
                                </div>
                            </div>
                        )}

                        {error && <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>}

                        <button
                            onClick={handleSave}
                            disabled={saving}
                            style={{
                                width: '100%', padding: '14px',
                                background: saving ? 'rgba(255,255,255,0.06)' : saved
                                    ? 'rgba(0,200,80,0.2)'
                                    : `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                color: saving ? '#555' : saved ? '#00c850' : '#0a0a1a',
                                border: saved ? '1px solid #00c85044' : 'none',
                                borderRadius: '8px', fontWeight: 'bold', fontSize: '0.9rem',
                                letterSpacing: '0.08em', cursor: saving ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                            }}>
                            {saving ? '⟳ SAVING...' : saved ? '✓ SAVED' : 'SAVE CHANGES'}
                        </button>
                    </>
                )}

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#2a2a2a' }}>
                    Powered by <a href="/" style={{ color: '#3a3a3a', textDecoration: 'underline' }}>ENSub</a>
                </p>
            </div>
        </main>
    )
}

export default function Manage({ tenant }: { tenant: TenantData }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    <ManageContent tenant={tenant} />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
