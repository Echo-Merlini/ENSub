import { useState, useEffect } from 'react'
import { WagmiProvider, useAccount, useSignMessage, createConfig, http } from 'wagmi'
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

const queryClient = new QueryClient()

function getWagmiConfig() {
    const projectId = (window as any).__WALLETCONNECT_PROJECT_ID__ || '3b3f1c4ecbfa7edd5c5327b56985074a'
    const alchemyKey = (window as any).__ALCHEMY_KEY__
    const rpcUrl = alchemyKey
        ? `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`
        : 'https://cloudflare-eth.com'

    const connectors = connectorsForWallets(
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
        { appName: 'ENSub', projectId }
    )

    return createConfig({
        chains: [mainnet],
        connectors,
        transports: { [mainnet.id]: http(rpcUrl) },
        ssr: false,
    })
}

const wagmiConfig = getWagmiConfig()

const ACCENT = '#00ff88'

const card = {
    background: 'rgba(22,33,62,0.7)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: '14px',
    backdropFilter: 'blur(8px)',
    padding: '36px 32px',
} as const

const input = {
    width: '100%',
    background: 'rgba(10,10,30,0.5)',
    border: '1.5px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: '#e4e4e4',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
}

const label = {
    display: 'block',
    fontSize: '0.8rem',
    color: '#888',
    marginBottom: '6px',
    letterSpacing: '0.05em',
} as const

const btnPrimary = (disabled = false) => ({
    width: '100%',
    padding: '14px',
    background: disabled ? 'rgba(255,255,255,0.06)' : `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
    color: disabled ? '#555' : '#0a0a1a',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold' as const,
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    cursor: disabled ? 'not-allowed' : 'pointer',
    boxShadow: disabled ? 'none' : `0 0 20px ${ACCENT}40`,
    transition: 'all 0.2s',
})

// ─── Step indicators ────────────────────────────────────────────────────────

function StepBar({ current, total }: { current: number; total: number }) {
    return (
        <div style={{ display: 'flex', gap: '6px', marginBottom: '28px' }}>
            {Array.from({ length: total }).map((_, i) => (
                <div key={i} style={{
                    flex: 1, height: '3px', borderRadius: '2px',
                    background: i < current ? ACCENT : i === current ? `${ACCENT}80` : 'rgba(255,255,255,0.1)',
                    transition: 'background 0.3s',
                }} />
            ))}
        </div>
    )
}

// ─── Step 1: Connect wallet + SIWE sign ────────────────────────────────────

function Step1({ onDone }: { onDone: () => void }) {
    const { address, isConnected } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSign = async () => {
        if (!address) return
        setLoading(true)
        setError('')
        try {
            const nonceRes = await fetch(`/api/onboard/nonce?address=${address}`)
            const { nonce, message } = await nonceRes.json()

            const signature = await signMessageAsync({ message })

            const verifyRes = await fetch('/api/onboard/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address, signature, nonce }),
            })
            const data = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(data.error || 'Verification failed')

            onDone()
        } catch (e: any) {
            setError(e.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '8px' }}>
                    Verify your wallet
                </h2>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>
                    Sign a message to prove ownership — no gas required
                </p>
            </div>

            {!isConnected ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <p style={{ color: '#555', fontSize: '0.875rem' }}>Connect your ENS-owning wallet</p>
                    <ConnectButton />
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{
                        background: 'rgba(0,255,136,0.05)',
                        border: `1px solid ${ACCENT}33`,
                        borderRadius: '10px',
                        padding: '14px 18px',
                        fontSize: '0.875rem',
                        color: '#888',
                    }}>
                        <span style={{ color: '#555' }}>Connected: </span>
                        <span style={{ color: ACCENT, fontFamily: 'monospace' }}>
                            {address?.slice(0, 6)}…{address?.slice(-4)}
                        </span>
                    </div>

                    {error && (
                        <p style={{ color: '#ff4444', fontSize: '0.85rem', textAlign: 'center' }}>{error}</p>
                    )}

                    <button style={btnPrimary(loading)} onClick={handleSign} disabled={loading}>
                        {loading ? '⟳ SIGNING...' : 'SIGN MESSAGE'}
                    </button>

                    <div style={{ textAlign: 'center' }}>
                        <ConnectButton accountStatus="address" chainStatus="none" />
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Step 2: ENS domain verification ──────────────────────────────────────

interface ExistingPage {
    name: string
    ens_domain: string
    slug: string
    claim_url: string
}

function Step2({ onDone }: { onDone: (ensDomain: string) => void }) {
    const { address } = useAccount()
    const [domain, setDomain] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [existingPage, setExistingPage] = useState<ExistingPage | null>(null)
    const [pageChecked, setPageChecked] = useState(false)

    useEffect(() => {
        if (!address) return
        fetch(`/api/onboard/my-page?address=${address}`)
            .then(r => r.json())
            .then(data => {
                setExistingPage(data.found ? data : null)
                setPageChecked(true)
            })
    }, [address])

    const handleCheck = async () => {
        const d = domain.trim().toLowerCase()
        if (!d.endsWith('.eth')) { setError('Must end with .eth'); return }
        setLoading(true)
        setError('')
        try {
            const res = await fetch('/api/onboard/check-ens', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ens_domain: d }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'ENS check failed')
            onDone(d)
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '8px' }}>
                    Your ENS domain
                </h2>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>
                    We'll verify on-chain that your wallet owns it
                </p>
            </div>

            {pageChecked && existingPage && (
                <div style={{
                    background: 'rgba(0,255,136,0.05)',
                    border: `1px solid ${ACCENT}44`,
                    borderRadius: '10px',
                    padding: '16px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    flexWrap: 'wrap',
                }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', color: '#666', marginBottom: '2px' }}>
                            You already have a page
                        </p>
                        <p style={{ fontSize: '0.95rem', color: ACCENT, fontWeight: 'bold' }}>
                            {existingPage.name}
                        </p>
                        <p style={{ fontSize: '0.8rem', color: '#555' }}>*.{existingPage.ens_domain}</p>
                    </div>
                    <a
                        href={existingPage.claim_url}
                        style={{
                            padding: '8px 16px',
                            background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
                            color: '#0a0a1a', borderRadius: '8px',
                            fontWeight: 'bold', fontSize: '0.8rem',
                            textDecoration: 'none', letterSpacing: '0.05em',
                            whiteSpace: 'nowrap',
                        }}>
                        Go to page →
                    </a>
                </div>
            )}

            <div>
                <label style={label}>ENS Domain</label>
                <input
                    style={input}
                    type="text"
                    placeholder="yourcommunity.eth"
                    value={domain}
                    onChange={e => { setDomain(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleCheck()}
                />
            </div>

            {error && <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>}

            <button style={btnPrimary(!domain || loading)} onClick={handleCheck} disabled={!domain || loading}>
                {loading ? '⟳ VERIFYING ON-CHAIN...' : 'VERIFY OWNERSHIP'}
            </button>
        </div>
    )
}

// ─── Step 3: Gate configuration ───────────────────────────────────────────

type GateType = 'open' | 'nft' | 'token' | 'allowlist'

interface GateConfig {
    gate_type: GateType
    contract_address: string
    collection_slug: string
}

function Step3({ onDone }: { onDone: (config: GateConfig) => void }) {
    const [gateType, setGateType] = useState<GateType>('open')
    const [contractAddress, setContractAddress] = useState('')
    const [collectionSlug, setCollectionSlug] = useState('')

    const gates: { value: GateType; label: string; desc: string }[] = [
        { value: 'open', label: 'Open', desc: 'Anyone can claim' },
        { value: 'nft', label: 'NFT Holders', desc: 'Requires an NFT from a collection' },
        { value: 'token', label: 'Token Holders', desc: 'Requires an ERC-20 token balance' },
        { value: 'allowlist', label: 'Allowlist', desc: 'Only approved wallets' },
    ]

    const handleNext = () => {
        onDone({ gate_type: gateType, contract_address: contractAddress, collection_slug: collectionSlug })
    }

    const canProceed = gateType === 'open' || contractAddress || collectionSlug

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '8px' }}>
                    Set eligibility
                </h2>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>
                    Who can claim a subdomain under your ENS?
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {gates.map(g => (
                    <button
                        key={g.value}
                        onClick={() => setGateType(g.value)}
                        style={{
                            background: gateType === g.value ? `${ACCENT}14` : 'rgba(255,255,255,0.03)',
                            border: `1.5px solid ${gateType === g.value ? ACCENT + '66' : 'rgba(255,255,255,0.07)'}`,
                            borderRadius: '10px',
                            padding: '14px 18px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-start',
                            gap: '2px',
                            transition: 'all 0.15s',
                            textAlign: 'left',
                        }}
                    >
                        <span style={{ color: gateType === g.value ? ACCENT : '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {g.label}
                        </span>
                        <span style={{ color: '#555', fontSize: '0.8rem' }}>{g.desc}</span>
                    </button>
                ))}
            </div>

            {(gateType === 'nft' || gateType === 'token') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {gateType === 'nft' && (
                        <div>
                            <label style={label}>Collection Slug (ETHscriptions)</label>
                            <input
                                style={input}
                                type="text"
                                placeholder="e.g. pixel-goblins"
                                value={collectionSlug}
                                onChange={e => setCollectionSlug(e.target.value)}
                            />
                        </div>
                    )}
                    <div>
                        <label style={label}>Contract Address (ERC-721 / ERC-20)</label>
                        <input
                            style={input}
                            type="text"
                            placeholder="0x..."
                            value={contractAddress}
                            onChange={e => setContractAddress(e.target.value)}
                        />
                    </div>
                </div>
            )}

            <button style={btnPrimary(!canProceed)} onClick={handleNext} disabled={!canProceed}>
                CONTINUE
            </button>
        </div>
    )
}

// ─── Step 4: Branding + Namestone key ─────────────────────────────────────

interface BrandingConfig {
    name: string
    namestone_api_key: string
    accent_color: string
    logo_url: string
    claim_limit: string
}

function Step4({ ensDomain, onDone }: { ensDomain: string; onDone: (config: BrandingConfig) => void }) {
    const [name, setName] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [accentColor, setAccentColor] = useState('#00ff88')
    const [logoUrl, setLogoUrl] = useState('')
    const [claimLimit, setClaimLimit] = useState('50')
    const [error, setError] = useState('')

    const handleNext = () => {
        if (!name.trim()) { setError('Name is required'); return }
        if (!apiKey.trim()) { setError('Namestone API key is required'); return }
        onDone({ name: name.trim(), namestone_api_key: apiKey.trim(), accent_color: accentColor, logo_url: logoUrl, claim_limit: claimLimit })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '8px' }}>
                    Brand your page
                </h2>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>
                    This is what claimants will see at <span style={{ color: ACCENT }}>ensub.org/claim/…</span>
                </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                    <label style={label}>Community / Project Name</label>
                    <input style={input} type="text" placeholder="Pixel Goblins" value={name} onChange={e => setName(e.target.value)} />
                </div>

                <div>
                    <label style={label}>ENS Domain</label>
                    <input style={{ ...input, color: '#555', cursor: 'default' }} type="text" value={ensDomain} readOnly />
                </div>

                <div>
                    <label style={label}>
                        Namestone API Key{' '}
                        <a href="https://namestone.xyz" target="_blank" rel="noopener noreferrer"
                            style={{ color: ACCENT, fontSize: '0.75rem' }}>get one →</a>
                    </label>
                    <input style={input} type="text" placeholder="ns_…" value={apiKey} onChange={e => setApiKey(e.target.value)} />
                </div>

                <div style={{ display: 'flex', gap: '14px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={label}>Accent Colour</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                                type="color"
                                value={accentColor}
                                onChange={e => setAccentColor(e.target.value)}
                                style={{
                                    width: '40px', height: '40px', border: 'none',
                                    borderRadius: '8px', cursor: 'pointer', background: 'none', padding: 0,
                                }}
                            />
                            <input
                                style={{ ...input, flex: 1 }}
                                type="text"
                                value={accentColor}
                                onChange={e => setAccentColor(e.target.value)}
                                maxLength={7}
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={label}>Claim Limit</label>
                        <input
                            style={input}
                            type="number"
                            min="1"
                            max="10000"
                            value={claimLimit}
                            onChange={e => setClaimLimit(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label style={label}>Logo URL <span style={{ color: '#444' }}>(optional)</span></label>
                    <input style={input} type="url" placeholder="https://…" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                </div>
            </div>

            {error && <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>}

            {/* Preview pill */}
            <div style={{
                background: 'rgba(10,10,30,0.6)',
                border: `1px solid ${accentColor}33`,
                borderRadius: '10px',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                {logoUrl && <img src={logoUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />}
                <div>
                    <div style={{ color: accentColor, fontWeight: 'bold', fontSize: '0.9rem', textShadow: `0 0 8px ${accentColor}80` }}>
                        {name || 'Your Community'}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.75rem' }}>{ensDomain}</div>
                </div>
            </div>

            <button style={btnPrimary(!name || !apiKey)} onClick={handleNext} disabled={!name || !apiKey}>
                CONTINUE
            </button>
        </div>
    )
}

// ─── Step 5: Submit + Success ──────────────────────────────────────────────

function Step5({
    ensDomain,
    gateConfig,
    brandingConfig,
    onReset,
}: {
    ensDomain: string
    gateConfig: GateConfig
    brandingConfig: BrandingConfig
    onReset: () => void
}) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [result, setResult] = useState<{ slug: string; claim_url: string } | null>(null)

    useEffect(() => {
        const create = async () => {
            try {
                const body: Record<string, any> = {
                    name: brandingConfig.name,
                    ens_domain: ensDomain,
                    namestone_api_key: brandingConfig.namestone_api_key,
                    gate_type: gateConfig.gate_type,
                    accent_color: brandingConfig.accent_color,
                    logo_url: brandingConfig.logo_url || undefined,
                    claim_limit: parseInt(brandingConfig.claim_limit) || 50,
                }
                if (gateConfig.contract_address) body.contract_address = gateConfig.contract_address
                if (gateConfig.collection_slug) body.collection_slug = gateConfig.collection_slug

                const res = await fetch('/api/onboard/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data.error || 'Failed to create')
                setResult({ slug: data.slug, claim_url: data.claim_url })
            } catch (e: any) {
                setError(e.message)
            } finally {
                setLoading(false)
            }
        }
        create()
    }, [])

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <div style={{ fontSize: '2rem', marginBottom: '16px' }}>⟳</div>
                <p style={{ color: '#888' }}>Creating your subdomain manager…</p>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <p style={{ color: '#ff4444', fontWeight: 'bold' }}>Something went wrong</p>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>{error}</p>
                <button style={btnPrimary()} onClick={onReset}>START OVER</button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
            <div>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '8px' }}>
                    You're live!
                </h2>
                <p style={{ color: '#888', fontSize: '0.875rem' }}>
                    Your subdomain manager is ready
                </p>
            </div>

            <div style={{
                background: 'rgba(0,255,136,0.05)',
                border: `1px solid ${ACCENT}33`,
                borderRadius: '12px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
            }}>
                <p style={{ color: '#555', fontSize: '0.8rem' }}>Your claim page</p>
                <a
                    href={result?.claim_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                        color: ACCENT,
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        textDecoration: 'none',
                        textShadow: `0 0 10px ${ACCENT}60`,
                        wordBreak: 'break-all',
                    }}
                >
                    {result?.claim_url}
                </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                    href={result?.claim_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ ...btnPrimary(), display: 'block', textDecoration: 'none', textAlign: 'center' as const }}
                >
                    VIEW CLAIM PAGE →
                </a>
                <button
                    style={{
                        ...btnPrimary(),
                        background: 'rgba(255,255,255,0.06)',
                        color: '#888',
                        boxShadow: 'none',
                    }}
                    onClick={() => {
                        if (result?.claim_url) navigator.clipboard.writeText(result.claim_url)
                    }}
                >
                    COPY LINK
                </button>
            </div>

            <a
                href={result ? `/manage/${result.slug}` : '#'}
                style={{
                    display: 'block', textAlign: 'center' as const,
                    padding: '12px',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '8px',
                    color: '#888', fontSize: '0.85rem',
                    textDecoration: 'none',
                }}
            >
                Manage your page settings →
            </a>
        </div>
    )
}

// ─── Main wizard ───────────────────────────────────────────────────────────

function OnboardWizard() {
    const [step, setStep] = useState(0)
    const [ensDomain, setEnsDomain] = useState('')
    const [gateConfig, setGateConfig] = useState<GateConfig | null>(null)
    const [brandingConfig, setBrandingConfig] = useState<BrandingConfig | null>(null)

    const totalSteps = 4 // steps 0–3 before success (step 4)

    const reset = () => {
        setStep(0)
        setEnsDomain('')
        setGateConfig(null)
        setBrandingConfig(null)
    }

    const stepTitles = ['Verify Wallet', 'ENS Domain', 'Eligibility', 'Branding']

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <header style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(15,17,23,0.9)',
                backdropFilter: 'blur(8px)',
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                    <span style={{
                        fontWeight: 'bold',
                        fontSize: '1.1rem',
                        color: ACCENT,
                        textShadow: `0 0 10px ${ACCENT}80`,
                    }}>
                        ENSub
                    </span>
                </a>
                {step < 4 && (
                    <span style={{ fontSize: '0.8rem', color: '#444' }}>
                        Step {step + 1} of {totalSteps} — {stepTitles[step]}
                    </span>
                )}
            </header>

            {/* Content */}
            <div style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '48px 24px',
            }}>
                <div style={{ width: '100%', maxWidth: '480px' }}>
                    <div style={card}>
                        {step < 4 && <StepBar current={step} total={totalSteps} />}

                        {step === 0 && (
                            <Step1 onDone={() => setStep(1)} />
                        )}
                        {step === 1 && (
                            <Step2 onDone={(d) => { setEnsDomain(d); setStep(2) }} />
                        )}
                        {step === 2 && (
                            <Step3 onDone={(g) => { setGateConfig(g); setStep(3) }} />
                        )}
                        {step === 3 && (
                            <Step4
                                ensDomain={ensDomain}
                                onDone={(b) => { setBrandingConfig(b); setStep(4) }}
                            />
                        )}
                        {step === 4 && gateConfig && brandingConfig && (
                            <Step5
                                ensDomain={ensDomain}
                                gateConfig={gateConfig}
                                brandingConfig={brandingConfig}
                                onReset={reset}
                            />
                        )}
                    </div>

                    {step > 0 && step < 4 && (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            style={{
                                display: 'block',
                                margin: '16px auto 0',
                                background: 'none',
                                border: 'none',
                                color: '#444',
                                fontSize: '0.85rem',
                                cursor: 'pointer',
                                textDecoration: 'underline',
                            }}
                        >
                            ← Back
                        </button>
                    )}
                </div>
            </div>

            <footer style={{ padding: '20px', textAlign: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                <p style={{ color: '#1e1e1e', fontSize: '0.75rem' }}>
                    ENSub · Gasless ENS subdomain management
                </p>
            </footer>
        </main>
    )
}

export default function Onboard() {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider>
                    <OnboardWizard />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
