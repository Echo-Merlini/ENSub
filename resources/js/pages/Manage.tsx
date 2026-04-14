import { useState, useEffect } from 'react'
import { WagmiProvider, useAccount, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit'
import { injectedWallet, metaMaskWallet, rainbowWallet, coinbaseWallet, walletConnectWallet } from '@rainbow-me/rainbowkit/wallets'
import { mainnet } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

interface ClaimEntry {
    id: number
    wallet_address: string
    subdomain: string
    full_name: string
    claimed_at: string
}

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
    min_balance: string | null
    allowlist_addresses: string | null
    namestone_api_key: string
    claims: ClaimEntry[]
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
    bg:     'var(--bg-primary)',
    card:   'var(--card-bg)',
    border: 'var(--card-border)',
    text:   'var(--text)',
    muted:  'var(--text-muted)',
    dim:    'var(--text-dim)',
}

const inputStyle = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--input-border)',
    borderRadius: '8px',
    padding: '10px 14px',
    color: 'var(--text)',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.9rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
}

const labelStyle = {
    display: 'block',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
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
        min_balance: tenant.min_balance ?? '1',
        allowlist_addresses: tenant.allowlist_addresses ?? '',
        claim_limit: tenant.claim_limit,
    })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [error, setError] = useState('')
    const [claims, setClaims] = useState<ClaimEntry[]>(tenant.claims)
    const [revoking, setRevoking] = useState<number | null>(null)
    const [linkCopied, setLinkCopied] = useState(false)
    const [embedCopied, setEmbedCopied] = useState(false)

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

    const handleRevoke = async (claim: ClaimEntry) => {
        if (!address) return
        setRevoking(claim.id)
        try {
            const res = await fetch(`/api/manage/${tenant.slug}/claims/${claim.id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ owner_address: address }),
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Revoke failed')
            }
            setClaims(prev => prev.filter(c => c.id !== claim.id))
        } catch (e: any) {
            setError(e.message)
        } finally {
            setRevoking(null)
        }
    }

    const card = {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
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
                background: 'var(--header-bg)',
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
                                        <option value="token">Token holders (ERC-20)</option>
                                        <option value="allowlist">Allowlist</option>
                                    </select>
                                </div>

                                {form.gate_type === 'nft' && (
                                    <>
                                        <div>
                                            <label style={labelStyle}>ETHscriptions collection slug</label>
                                            <input style={inputStyle} value={form.collection_slug} onChange={e => set('collection_slug', e.target.value)} placeholder="e.g. pixel-goblins" />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>ERC-721 contract address</label>
                                            <input style={inputStyle} value={form.contract_address} onChange={e => set('contract_address', e.target.value)} placeholder="0x..." />
                                        </div>
                                    </>
                                )}

                                {form.gate_type === 'token' && (
                                    <>
                                        <div>
                                            <label style={labelStyle}>ERC-20 contract address</label>
                                            <input style={inputStyle} value={form.contract_address} onChange={e => set('contract_address', e.target.value)} placeholder="0x..." />
                                        </div>
                                        <div>
                                            <label style={labelStyle}>Minimum balance required</label>
                                            <input style={inputStyle} type="number" min={0} step="any"
                                                value={form.min_balance} onChange={e => set('min_balance', e.target.value)} placeholder="1" />
                                            <p style={{ color: COLORS.dim, fontSize: '0.72rem', marginTop: '4px' }}>In whole tokens (e.g. 1 = 1 token)</p>
                                        </div>
                                    </>
                                )}

                                {form.gate_type === 'allowlist' && (
                                    <div>
                                        <label style={labelStyle}>Allowed wallet addresses</label>
                                        <textarea
                                            style={{ ...inputStyle, height: '120px', resize: 'vertical' as const, fontFamily: 'monospace', fontSize: '0.78rem' }}
                                            value={form.allowlist_addresses}
                                            onChange={e => set('allowlist_addresses', e.target.value)}
                                            placeholder={'0xabc...\n0xdef...\n0x123...'}
                                        />
                                        <p style={{ color: COLORS.dim, fontSize: '0.72rem', marginTop: '4px' }}>One address per line</p>
                                    </div>
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
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <img src="/images/namestone-logo.png" alt="" style={{ height: '16px', opacity: 0.85 }} />Namestone API key
                            </h2>
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

                        {/* Claims list */}
                        <div style={card}>
                            <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '16px' }}>
                                Claimed subdomains
                                <span style={{ color: COLORS.muted, fontWeight: 'normal', fontSize: '0.8rem', marginLeft: '8px' }}>
                                    ({claims.length})
                                </span>
                            </h2>
                            {claims.length === 0 ? (
                                <p style={{ color: COLORS.dim, fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                                    No claims yet
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {claims.map(c => (
                                        <div key={c.id} style={{
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '10px 12px', borderRadius: '8px',
                                            background: 'var(--row-bg)',
                                            border: '1px solid var(--row-border)',
                                            gap: '12px',
                                        }}>
                                            <div style={{ minWidth: 0 }}>
                                                <p style={{ color: accent, fontSize: '0.875rem', fontWeight: 'bold',
                                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {c.full_name}
                                                </p>
                                                <p style={{ color: COLORS.dim, fontSize: '0.72rem', fontFamily: 'monospace', marginTop: '2px' }}>
                                                    {c.wallet_address.slice(0, 6)}…{c.wallet_address.slice(-4)}
                                                    <span style={{ marginLeft: '8px', color: 'var(--text-dim)' }}>
                                                        {new Date(c.claimed_at).toLocaleDateString()}
                                                    </span>
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => handleRevoke(c)}
                                                disabled={revoking === c.id}
                                                style={{
                                                    flexShrink: 0,
                                                    padding: '5px 10px',
                                                    borderRadius: '6px',
                                                    fontSize: '0.75rem',
                                                    fontWeight: 'bold',
                                                    background: 'transparent',
                                                    border: '1px solid rgba(255,68,68,0.3)',
                                                    color: revoking === c.id ? COLORS.dim : '#ff6666',
                                                    cursor: revoking === c.id ? 'not-allowed' : 'pointer',
                                                }}
                                            >
                                                {revoking === c.id ? '...' : 'Revoke'}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Share */}
                        {(() => {
                            const claimUrl = `${window.location.origin}/claim/${tenant.slug}`
                            const shareText = `Claim your free ${tenant.ens_domain} subdomain on ENSub 🌐`
                            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(claimUrl)}`
                            const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText + '\n' + claimUrl)}`
                            const btnStyle = {
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '8px 14px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold',
                                background: 'var(--row-bg)', border: '1px solid var(--row-border)',
                                color: 'var(--text-muted)', textDecoration: 'none', cursor: 'pointer',
                            } as const
                            return (
                                <div style={card}>
                                    <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px' }}>Share claim page</h2>
                                    <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '14px', fontFamily: 'monospace' }}>{claimUrl}</p>
                                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                        <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, color: '#1d9bf0' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.632 5.907-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                            </svg>
                                            Share on X
                                        </a>
                                        <a href={farcasterUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, color: '#8b5cf6' }}>
                                            <svg width="14" height="14" viewBox="0 0 1000 1000" fill="currentColor">
                                                <path d="M257.778 155.556H742.222V844.445H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.445H257.778V155.556Z"/>
                                                <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                                                <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z"/>
                                            </svg>
                                            Farcaster
                                        </a>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(claimUrl); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000) }}
                                            style={{ ...btnStyle, color: linkCopied ? '#00ff88' : 'var(--text-muted)' }}>
                                            {linkCopied ? '✓ Copied' : '🔗 Copy link'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })()}

                        {/* Embed */}
                        {tenant.plan === 'free' ? (
                            <div style={{ ...card, borderColor: `${accent}22` }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                                    <div>
                                        <p style={{ color: COLORS.text, fontWeight: 'bold', fontSize: '0.9rem' }}>
                                            {'</>'} Embed claim box
                                        </p>
                                        <p style={{ color: COLORS.muted, fontSize: '0.8rem', marginTop: '2px' }}>
                                            Add the claim widget to your own site — Pro &amp; Business only
                                        </p>
                                    </div>
                                    <a href={`/pricing?slug=${tenant.slug}`}
                                        style={{
                                            padding: '8px 18px', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 'bold',
                                            background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                            color: '#0a0a1a', textDecoration: 'none', flexShrink: 0,
                                        }}>
                                        Upgrade →
                                    </a>
                                </div>
                            </div>
                        ) : (
                            <div style={card}>
                                <h2 style={{ color: COLORS.text, fontSize: '1rem', fontWeight: 'bold', marginBottom: '6px' }}>{'</>'} Embed claim box</h2>
                                <p style={{ color: COLORS.muted, fontSize: '0.78rem', marginBottom: '12px' }}>
                                    Drop this snippet anywhere on your site to embed the claim widget.
                                </p>
                                <pre style={{
                                    background: 'var(--pre-bg)', border: '1px solid var(--pre-border)',
                                    borderRadius: '8px', padding: '14px', fontSize: '0.72rem',
                                    color: 'var(--text-muted)', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all',
                                    fontFamily: "'Fira Code', 'Courier New', monospace", margin: 0,
                                }}>{`<iframe\n  src="${window.location.origin}/claim/${tenant.slug}"\n  width="480"\n  height="560"\n  frameborder="0"\n  style="border-radius:12px;border:none;overflow:hidden;"\n  allow="clipboard-write; ethereum"\n></iframe>`}</pre>
                                <button
                                    onClick={() => {
                                        const snippet = `<iframe\n  src="${window.location.origin}/claim/${tenant.slug}"\n  width="480"\n  height="560"\n  frameborder="0"\n  style="border-radius:12px;border:none;overflow:hidden;"\n  allow="clipboard-write; ethereum"\n></iframe>`
                                        navigator.clipboard.writeText(snippet)
                                        setEmbedCopied(true)
                                        setTimeout(() => setEmbedCopied(false), 2000)
                                    }}
                                    style={{
                                        marginTop: '10px', padding: '8px 16px', borderRadius: '8px',
                                        fontSize: '0.8rem', fontWeight: 'bold', cursor: 'pointer',
                                        background: embedCopied ? 'rgba(0,255,136,0.1)' : 'var(--row-bg)',
                                        border: `1px solid ${embedCopied ? '#00ff8844' : 'var(--row-border)'}`,
                                        color: embedCopied ? '#00ff88' : 'var(--text-muted)',
                                    }}>
                                    {embedCopied ? '✓ Copied!' : 'Copy snippet'}
                                </button>
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

                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Powered by <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>ENSub</a>
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
