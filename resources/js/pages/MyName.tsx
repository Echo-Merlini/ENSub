import { useState, useEffect } from 'react'
import { WagmiProvider, useAccount, createConfig, http } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton, connectorsForWallets } from '@rainbow-me/rainbowkit'
import {
    injectedWallet,
    metaMaskWallet,
    rainbowWallet,
    coinbaseWallet,
    walletConnectWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { mainnet } from 'wagmi/chains'
import '@rainbow-me/rainbowkit/styles.css'

interface Tenant {
    name: string
    ens_domain: string
    slug: string
    logo_url: string | null
    accent_color: string
}

const queryClient = new QueryClient()

function getWagmiConfig() {
    const projectId = (window as any).__WALLETCONNECT_PROJECT_ID__ || '3b3f1c4ecbfa7edd5c5327b56985074a'
    const alchemyKey = (window as any).__ALCHEMY_KEY__
    const rpcUrl = alchemyKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://cloudflare-eth.com'

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

function MyNameContent({ tenant }: { tenant: Tenant }) {
    const { address, isConnected } = useAccount()
    const accent = tenant.accent_color
    const [claimedName, setClaimedName] = useState<string | null>(null)
    const [loading, setLoading] = useState(false)
    const [checked, setChecked] = useState(false)

    useEffect(() => {
        if (!address) { setChecked(false); setClaimedName(null); return }
        setLoading(true)
        fetch(`/api/claim/${tenant.slug}/mine?address=${address}`)
            .then(r => r.json())
            .then(data => {
                setClaimedName(data.full_name ?? null)
                setChecked(true)
            })
            .finally(() => setLoading(false))
    }, [address, tenant.slug])

    const card = {
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '14px',
        backdropFilter: 'blur(8px)',
        padding: '40px 32px',
        textAlign: 'center' as const,
    }

    return (
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
                    <span style={{ fontWeight: 'bold', color: accent, textShadow: `0 0 10px ${accent}80` }}>
                        {tenant.name}
                    </span>
                </div>
                <ConnectButton />
            </header>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
                <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div style={{ textAlign: 'center' }}>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                            Your subdomain
                        </h1>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Look up your <span style={{ color: accent }}>*.{tenant.ens_domain}</span> name
                        </p>
                    </div>

                    {!isConnected && (
                        <div style={{ ...card }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
                                Connect your wallet to see your registered name
                            </p>
                            <ConnectButton />
                        </div>
                    )}

                    {isConnected && loading && (
                        <div style={{ ...card }}>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Looking up your name...</p>
                        </div>
                    )}

                    {isConnected && checked && !loading && claimedName && (
                        <div style={{ ...card, borderColor: `${accent}44`, boxShadow: `0 0 30px ${accent}15` }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '4px' }}>You own</p>
                            <p style={{
                                color: accent, fontSize: '1.4rem', fontWeight: 'bold',
                                margin: '8px 0 20px', textShadow: `0 0 20px ${accent}60`,
                            }}>
                                {claimedName}
                            </p>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                <a
                                    href={`https://app.ens.domains/${claimedName}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{
                                        padding: '10px 20px',
                                        background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                        color: '#0a0a1a', borderRadius: '8px',
                                        fontWeight: 'bold', fontSize: '0.85rem',
                                        textDecoration: 'none', letterSpacing: '0.05em',
                                    }}>
                                    View on ENS
                                </a>
                                <button
                                    onClick={() => navigator.clipboard.writeText(claimedName)}
                                    style={{
                                        padding: '10px 20px',
                                        background: 'rgba(255,255,255,0.06)',
                                        color: '#aaa', borderRadius: '8px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        fontSize: '0.85rem', cursor: 'pointer',
                                    }}>
                                    Copy name
                                </button>
                            </div>
                            <p style={{ marginTop: '20px', fontSize: '0.75rem', color: '#3a3a3a' }}>
                                Bookmark this page to come back anytime
                            </p>
                        </div>
                    )}

                    {isConnected && checked && !loading && !claimedName && (
                        <div style={{ ...card }}>
                            <div style={{ fontSize: '2rem', marginBottom: '12px' }}>🔍</div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
                                This wallet hasn't claimed a subdomain yet
                            </p>
                            <a
                                href={`/claim/${tenant.slug}`}
                                style={{
                                    display: 'inline-block',
                                    padding: '12px 24px',
                                    background: `linear-gradient(135deg, ${accent}, ${accent}cc)`,
                                    color: '#0a0a1a', borderRadius: '8px',
                                    fontWeight: 'bold', fontSize: '0.875rem',
                                    textDecoration: 'none', letterSpacing: '0.06em',
                                }}>
                                Claim yours →
                            </a>
                        </div>
                    )}

                    <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#2a2a2a' }}>
                        Powered by <a href="/" style={{ color: '#3a3a3a', textDecoration: 'underline' }}>ENSub</a>
                    </p>
                </div>
            </div>
        </main>
    )
}

export default function MyName({ tenant }: { tenant: Tenant }) {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    <MyNameContent tenant={tenant} />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
