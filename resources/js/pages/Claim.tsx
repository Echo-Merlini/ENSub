import { useState, useEffect, useCallback } from 'react'
import { WagmiProvider, useAccount, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
    injectedWallet,
    metaMaskWallet,
    rainbowWallet,
    coinbaseWallet,
    walletConnectWallet,
    safeWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { mainnet } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

interface Tenant {
    name: string
    ens_domain: string
    slug: string
    owner_address: string
    logo_url: string | null
    accent_color: string
    claim_limit: number
    claims_count: number
    at_limit: boolean
    gate_type: string
    plan: string
}

const queryClient = new QueryClient()

const _projectId = (window as any).__WALLETCONNECT_PROJECT_ID__ || '3b3f1c4ecbfa7edd5c5327b56985074a'
const _alchemyKey = (window as any).__ALCHEMY_KEY__
const _rpcUrl = _alchemyKey
    ? `https://eth-mainnet.g.alchemy.com/v2/${_alchemyKey}`
    : 'https://cloudflare-eth.com'
const wagmiConfig = createConfig({
    chains: [mainnet],
    connectors: connectorsForWallets(
        [
            {
                groupName: 'Popular',
                wallets: [
                    injectedWallet,
                    metaMaskWallet,
                    rainbowWallet,
                    coinbaseWallet,
                    walletConnectWallet,
                    safeWallet,
                ],
            },
        ],
        { appName: 'ENSub', projectId: _projectId }
    ),
    transports: { [mainnet.id]: http(_rpcUrl) },
    ssr: false,
})

function OwnerControls({ tenant }: { tenant: Tenant }) {
    const { address, isConnected } = useAccount()
    if (!isConnected || address?.toLowerCase() !== tenant.owner_address.toLowerCase()) return null
    return (
        <a
            href={`/manage/${tenant.slug}`}
            style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                border: `1px solid ${tenant.accent_color}55`,
                color: tenant.accent_color,
                textDecoration: 'none',
                letterSpacing: '0.04em',
            }}
        >
            ⚙ Manage
        </a>
    )
}

function ShareBar({ tenant }: { tenant: Tenant }) {
    const [copied, setCopied] = useState(false)
    const claimUrl = `${window.location.origin}/claim/${tenant.slug}`
    const shareText = `Claim your free ${tenant.ens_domain} subdomain on ENSub 🌐`

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(claimUrl)}`
    const farcasterUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText + '\n' + claimUrl)}`

    const copyLink = () => {
        navigator.clipboard.writeText(claimUrl).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const btnStyle = {
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 13px', borderRadius: '8px', fontSize: '0.78rem', fontWeight: 'bold',
        background: 'var(--row-bg)', border: '1px solid var(--card-border)',
        color: 'var(--text-muted)', textDecoration: 'none', cursor: 'pointer', transition: 'all 0.15s',
    } as const

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.73rem', color: 'var(--text-dim)', marginRight: '2px' }}>Share</span>
            <a href={twitterUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, color: '#1d9bf0' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.258 5.632 5.907-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share
            </a>
            <a href={farcasterUrl} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, color: '#8b5cf6' }}>
                <svg width="14" height="14" viewBox="0 0 1000 1000" fill="currentColor">
                    <path d="M257.778 155.556H742.222V844.445H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.445H257.778V155.556Z"/>
                    <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.445H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                    <path d="M675.556 746.667C663.283 746.667 653.333 756.616 653.333 768.889V795.556H648.889C636.616 795.556 626.667 805.505 626.667 817.778V844.445H875.556V817.778C875.556 805.505 865.606 795.556 853.333 795.556H848.889V768.889C848.889 756.616 838.94 746.667 826.667 746.667V351.111H851.111L880 253.333H702.222V746.667H675.556Z"/>
                </svg>
                Farcaster
            </a>
            <button onClick={copyLink} style={{ ...btnStyle, color: copied ? '#00ff88' : 'var(--text-muted)' }}>
                {copied ? '✓ Copied' : '🔗 Copy link'}
            </button>
        </div>
    )
}

type Status = 'idle' | 'checking' | 'available' | 'taken' | 'claiming' | 'claimed' | 'error' | 'already-claimed' | 'not-eligible'

function ClaimForm({ tenant }: { tenant: Tenant }) {
    const { address, isConnected } = useAccount()
    const [name, setName] = useState('')
    const [status, setStatus] = useState<Status>('idle')
    const [message, setMessage] = useState('')
    const [claimedName, setClaimedName] = useState('')
    const accent = tenant.accent_color

    useEffect(() => {
        if (!address) return
        fetch(`/api/claim/${tenant.slug}/mine?address=${address}`)
            .then(r => r.json())
            .then(data => {
                if (data.full_name) {
                    setClaimedName(data.full_name)
                    setStatus('already-claimed')
                }
            })
    }, [address, tenant.slug])

    const checkName = useCallback(async () => {
        if (!name || name.length < 3) return
        setStatus('checking')
        const res = await fetch(`/api/claim/${tenant.slug}/check?name=${encodeURIComponent(name)}`)
        const data = await res.json()
        setStatus(data.available ? 'available' : 'taken')
    }, [name, tenant.slug])

    useEffect(() => {
        if (name.length < 3) { setStatus('idle'); return }
        const t = setTimeout(checkName, 500)
        return () => clearTimeout(t)
    }, [name, checkName])

    const handleClaim = async () => {
        if (!address || status !== 'available') return
        setStatus('claiming')
        const res = await fetch(`/api/claim/${tenant.slug}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address, name }),
        })
        const data = await res.json()
        if (data.success) {
            setClaimedName(data.full_name)
            setStatus('claimed')
        } else if (res.status === 403) {
            setStatus('not-eligible')
            setMessage(data.error)
        } else {
            setStatus('error')
            setMessage(data.error || 'Something went wrong')
        }
    }

    const statusColor: Partial<Record<Status, string>> = {
        available: accent,
        taken: '#ff4444',
        checking: '#ffaa00',
    }
    const statusText: Partial<Record<Status, string>> = {
        available: '✓ Available',
        taken: '✗ Already taken',
        checking: '⟳ Checking...',
    }

    const card = {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
    } as const

    if (tenant.at_limit) {
        return (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
                <p style={{ color: accent, fontWeight: 'bold' }}>Claim limit reached</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '8px' }}>
                    All {tenant.claim_limit} subdomains have been claimed.
                </p>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div style={{ ...card, padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Connect your wallet to claim</p>
                <ConnectButton />
            </div>
        )
    }

    if (status === 'already-claimed') {
        return (
            <div style={{ ...card, padding: '40px 32px', textAlign: 'center', borderColor: `${accent}44` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>You already claimed</p>
                <p style={{ color: accent, fontSize: '1.25rem', fontWeight: 'bold', margin: '8px 0' }}>{claimedName}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '4px' }}>
                    <a href={`https://app.ens.domains/${claimedName}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                        View on ENS →
                    </a>
                    <span style={{ color: 'var(--text-dim)' }}>·</span>
                    <a href={`/claim/${tenant.slug}/my`}
                        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                        My name page →
                    </a>
                </div>
            </div>
        )
    }

    if (status === 'claimed') {
        return (
            <div style={{ ...card, padding: '40px 32px', textAlign: 'center', borderColor: `${accent}66`, boxShadow: `0 0 30px ${accent}20` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Successfully claimed!</p>
                <p style={{ color: accent, fontSize: '1.4rem', fontWeight: 'bold', margin: '8px 0',
                    textShadow: `0 0 20px ${accent}` }}>{claimedName}</p>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '4px' }}>
                    <a href={`https://app.ens.domains/${claimedName}`} target="_blank" rel="noopener noreferrer"
                        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                        View on ENS →
                    </a>
                    <span style={{ color: 'var(--text-dim)' }}>·</span>
                    <a href={`/claim/${tenant.slug}/my`}
                        style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'underline' }}>
                        Bookmark my name →
                    </a>
                </div>
            </div>
        )
    }

    if (status === 'not-eligible') {
        return (
            <div style={{ ...card, padding: '40px 32px', textAlign: 'center', borderColor: 'rgba(255,68,68,0.3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚫</div>
                <p style={{ color: '#ff4444', fontWeight: 'bold' }}>Not eligible</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '8px' }}>{message}</p>
            </div>
        )
    }

    return (
        <div style={{ ...card, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Choose your name</label>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'var(--input-bg)',
                    border: `1.5px solid ${status === 'available' ? accent + '99' : status === 'taken' ? 'rgba(255,68,68,0.5)' : 'var(--input-border)'}`,
                    borderRadius: '10px',
                    boxShadow: status === 'available' ? `0 0 0 3px ${accent}20` : 'none',
                    padding: '12px 16px',
                    transition: 'all 0.2s',
                }}>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                        placeholder="yourname"
                        maxLength={32}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            color: 'var(--text)', fontFamily: "'Inter', system-ui, sans-serif", fontSize: '1rem', padding: 0,
                        }}
                    />
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.875rem', flexShrink: 0 }}>
                        .{tenant.ens_domain}
                    </span>
                </div>
                {statusText[status] && (
                    <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: statusColor[status] }}>
                        {statusText[status]}
                    </p>
                )}
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>3–32 chars · lowercase, numbers, hyphens</p>
            </div>

            {status === 'error' && <p style={{ color: '#ff4444', fontSize: '0.875rem' }}>{message}</p>}

            <button
                onClick={handleClaim}
                disabled={status !== 'available'}
                style={{
                    width: '100%', padding: '14px',
                    background: status === 'available'
                        ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
                        : 'var(--row-bg)',
                    color: status === 'available' ? '#0a0a1a' : 'var(--text-dim)',
                    border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.08em',
                    cursor: status === 'available' ? 'pointer' : 'not-allowed',
                    boxShadow: status === 'available' ? `0 0 20px ${accent}50` : 'none',
                    transition: 'all 0.2s',
                }}
            >
                {status === 'claiming' ? '⟳ CLAIMING...' : 'CLAIM'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                <span>No gas required{tenant.plan === 'free' ? ' · Powered by ENSub' : ''}</span>
                <span>{tenant.claims_count}/{tenant.claim_limit} claimed</span>
            </div>
        </div>
    )
}

export default function Claim({ tenant }: { tenant: Tenant }) {
    const accent = tenant.accent_color

    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

                        {/* Header */}
                        <header style={{
                            borderBottom: '1px solid rgba(255,255,255,0.06)',
                            background: 'var(--header-bg)',
                            backdropFilter: 'blur(8px)',
                            padding: '16px 32px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {tenant.logo_url && (
                                    <img src={tenant.logo_url} alt={tenant.name}
                                        style={{ width: '28px', height: '28px', borderRadius: '6px', imageRendering: 'pixelated' }} />
                                )}
                                <span style={{ fontWeight: 'bold', color: accent,
                                    textShadow: `0 0 10px ${accent}80` }}>
                                    {tenant.name}
                                </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <OwnerControls tenant={tenant} />
                                <ConnectButton />
                            </div>
                        </header>

                        {/* Content */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                            <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                <div style={{ textAlign: 'center' }}>
                                    {tenant.logo_url && (
                                        <img
                                            src={tenant.logo_url}
                                            alt={tenant.name}
                                            style={{
                                                width: '64px', height: '64px',
                                                borderRadius: '14px',
                                                imageRendering: 'pixelated',
                                                marginBottom: '16px',
                                                boxShadow: `0 0 20px ${accent}40`,
                                            }}
                                        />
                                    )}
                                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                                        Claim your subdomain
                                    </h1>
                                    <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                        One free{' '}
                                        <span style={{ color: accent, textShadow: `0 0 8px ${accent}80` }}>
                                            *.{tenant.ens_domain}
                                        </span>{' '}
                                        {tenant.gate_type !== 'open' ? 'per eligible wallet' : 'per wallet'}
                                    </p>
                                </div>

                                <ClaimForm tenant={tenant} />

                                <ShareBar tenant={tenant} />

                                {/* Why claim section */}
                                <div style={{
                                    borderTop: '1px solid var(--card-border)',
                                    paddingTop: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '10px',
                                }}>
                                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                                        Why claim a subdomain?
                                    </p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.65, margin: 0 }}>
                                        ENS subdomains are on-chain identities built on the Ethereum Name Service — the decentralised naming standard of the web.
                                        Claiming yours gives your wallet a human-readable name you actually own, not just a username on a platform.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {[
                                            '🔗  Receive crypto to your name instead of a long address',
                                            '🪪  Log into ENS-compatible dApps with a real identity',
                                            '🌐  Carry it across the entire ENS ecosystem',
                                            '🔮  As ENS adoption grows, so does every name\'s utility',
                                        ].map(item => (
                                            <p key={item} style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0, lineHeight: 1.5 }}>
                                                {item}
                                            </p>
                                        ))}
                                    </div>
                                </div>

                                {tenant.plan === 'free' && (
                                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                        Powered by{' '}
                                        <a href="/" style={{ color: 'var(--text-muted)', textDecoration: 'underline' }}>ENSub</a>
                                    </p>
                                )}
                            </div>
                        </div>
                    </main>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
