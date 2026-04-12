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
    logo_url: string | null
    accent_color: string
    claim_limit: number
    claims_count: number
    at_limit: boolean
    gate_type: string
}

const queryClient = new QueryClient()

const _projectId = (window as any).__WALLETCONNECT_PROJECT_ID__ || '3b3f1c4ecbfa7edd5c5327b56985074a'
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
    transports: { [mainnet.id]: http() },
    ssr: false,
})

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
        background: 'rgba(22,33,62,0.7)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '12px',
        backdropFilter: 'blur(8px)',
    } as const

    if (tenant.at_limit) {
        return (
            <div style={{ ...card, padding: '32px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔒</div>
                <p style={{ color: accent, fontWeight: 'bold' }}>Claim limit reached</p>
                <p style={{ color: '#888', fontSize: '0.875rem', marginTop: '8px' }}>
                    All {tenant.claim_limit} subdomains have been claimed.
                </p>
            </div>
        )
    }

    if (!isConnected) {
        return (
            <div style={{ ...card, padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', textAlign: 'center' }}>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>Connect your wallet to claim</p>
                <ConnectButton />
            </div>
        )
    }

    if (status === 'already-claimed') {
        return (
            <div style={{ ...card, padding: '40px 32px', textAlign: 'center', borderColor: `${accent}44` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>You already claimed</p>
                <p style={{ color: accent, fontSize: '1.25rem', fontWeight: 'bold', margin: '8px 0' }}>{claimedName}</p>
                <a href={`https://app.ens.domains/${claimedName}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'underline' }}>
                    View on ENS →
                </a>
            </div>
        )
    }

    if (status === 'claimed') {
        return (
            <div style={{ ...card, padding: '40px 32px', textAlign: 'center', borderColor: `${accent}66`, boxShadow: `0 0 30px ${accent}20` }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>Successfully claimed!</p>
                <p style={{ color: accent, fontSize: '1.4rem', fontWeight: 'bold', margin: '8px 0',
                    textShadow: `0 0 20px ${accent}` }}>{claimedName}</p>
                <a href={`https://app.ens.domains/${claimedName}`} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#888', fontSize: '0.85rem', textDecoration: 'underline' }}>
                    View on ENS →
                </a>
            </div>
        )
    }

    if (status === 'not-eligible') {
        return (
            <div style={{ ...card, padding: '40px 32px', textAlign: 'center', borderColor: 'rgba(255,68,68,0.3)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🚫</div>
                <p style={{ color: '#ff4444', fontWeight: 'bold' }}>Not eligible</p>
                <p style={{ color: '#888', fontSize: '0.875rem', marginTop: '8px' }}>{message}</p>
            </div>
        )
    }

    return (
        <div style={{ ...card, padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.85rem', color: '#888' }}>Choose your name</label>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    background: 'rgba(10,10,30,0.5)',
                    border: `1.5px solid ${status === 'available' ? accent + '99' : status === 'taken' ? 'rgba(255,68,68,0.5)' : 'rgba(255,255,255,0.08)'}`,
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
                            color: '#e4e4e4', fontFamily: "'Inter', system-ui, sans-serif", fontSize: '1rem', padding: 0,
                        }}
                    />
                    <span style={{ color: '#555', fontSize: '0.875rem', flexShrink: 0 }}>
                        .{tenant.ens_domain}
                    </span>
                </div>
                {statusText[status] && (
                    <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: statusColor[status] }}>
                        {statusText[status]}
                    </p>
                )}
                <p style={{ fontSize: '0.75rem', color: '#3a3a3a' }}>3–32 chars · lowercase, numbers, hyphens</p>
            </div>

            {status === 'error' && <p style={{ color: '#ff4444', fontSize: '0.875rem' }}>{message}</p>}

            <button
                onClick={handleClaim}
                disabled={status !== 'available'}
                style={{
                    width: '100%', padding: '14px',
                    background: status === 'available'
                        ? `linear-gradient(135deg, ${accent}, ${accent}cc)`
                        : 'rgba(255,255,255,0.06)',
                    color: status === 'available' ? '#0a0a1a' : '#555',
                    border: 'none', borderRadius: '8px',
                    fontWeight: 'bold', fontSize: '0.9rem', letterSpacing: '0.08em',
                    cursor: status === 'available' ? 'pointer' : 'not-allowed',
                    boxShadow: status === 'available' ? `0 0 20px ${accent}50` : 'none',
                    transition: 'all 0.2s',
                }}
            >
                {status === 'claiming' ? '⟳ CLAIMING...' : 'CLAIM'}
            </button>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#3a3a3a' }}>
                <span>No gas required · Powered by ENSub</span>
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
                            background: 'rgba(15,17,23,0.8)',
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
                            <ConnectButton />
                        </header>

                        {/* Content */}
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                            <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                                <div style={{ textAlign: 'center' }}>
                                    <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '8px' }}>
                                        Claim your subdomain
                                    </h1>
                                    <p style={{ fontSize: '0.875rem', color: '#888' }}>
                                        One free{' '}
                                        <span style={{ color: accent, textShadow: `0 0 8px ${accent}80` }}>
                                            *.{tenant.ens_domain}
                                        </span>{' '}
                                        {tenant.gate_type !== 'open' ? 'per eligible wallet' : 'per wallet'}
                                    </p>
                                </div>

                                <ClaimForm tenant={tenant} />

                                <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#2a2a2a' }}>
                                    Powered by{' '}
                                    <a href="/" style={{ color: '#3a3a3a', textDecoration: 'underline' }}>ENSub</a>
                                </p>
                            </div>
                        </div>
                    </main>
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
