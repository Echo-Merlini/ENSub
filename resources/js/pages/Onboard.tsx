import { useState, useEffect } from 'react'
import { WagmiProvider, useAccount, useSignMessage, useReadContract, useWriteContract, useWaitForTransactionReceipt, createConfig, http } from 'wagmi'
import { namehash } from 'viem/ens'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, ConnectButton, connectorsForWallets, darkTheme, lightTheme } from '@rainbow-me/rainbowkit'
import {
    injectedWallet,
    metaMaskWallet,
    rainbowWallet,
    coinbaseWallet,
    walletConnectWallet,
    safeWallet,
} from '@rainbow-me/rainbowkit/wallets'
import { mainnet, base, optimism, arbitrum, polygon, linea, scroll, celo, worldchain } from 'wagmi/chains'
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
        chains: [mainnet, base, optimism, arbitrum, polygon, linea, scroll, celo, worldchain],
        connectors,
        transports: {
            [mainnet.id]:     http(rpcUrl),
            [base.id]:        http(),
            [optimism.id]:    http(),
            [arbitrum.id]:    http(),
            [polygon.id]:     http(),
            [linea.id]:       http(),
            [scroll.id]:      http(),
            [celo.id]:        http(),
            [worldchain.id]:  http(),
        },
        ssr: false,
    })
}

const wagmiConfig = getWagmiConfig()

const ACCENT = '#00ff88'

const card = {
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    borderRadius: '14px',
    backdropFilter: 'blur(8px)',
    padding: '36px 32px',
} as const

const input = {
    width: '100%',
    background: 'var(--input-bg)',
    border: '1.5px solid var(--input-border)',
    borderRadius: '10px',
    padding: '12px 16px',
    color: 'var(--text)',
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: '0.95rem',
    outline: 'none',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.2s',
}

const label = {
    display: 'block',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
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
            const msg: string = e.message || ''
            if (msg.toLowerCase().includes('chain not configured') || msg.toLowerCase().includes('switch chain')) {
                setError('Wallet is on an unsupported network. Switch to Ethereum mainnet and try again.')
            } else {
                setError(msg || 'Something went wrong')
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                    Verify your wallet
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
                        color: 'var(--text-muted)',
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
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                    Your ENS domain
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
                <p style={{ marginTop: '6px', fontSize: '0.75rem', color: '#555', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
                    Don't have a
                    <img src="/images/ens-logo.svg" alt="ENS" style={{ height: '12px', verticalAlign: 'middle', opacity: 0.8 }} />
                    .eth name yet?{' '}
                    <a
                        href="https://app.ens.domains/?referrer=0x27958d7791140ab141363330a6BD1B76622a09D7"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: ACCENT, textDecoration: 'underline', textUnderlineOffset: '2px' }}
                    >
                        Register one →
                    </a>
                </p>
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
    min_balance: string
    allowlist_addresses: string
}

function Step3({ onDone }: { onDone: (config: GateConfig) => void }) {
    const [gateType, setGateType] = useState<GateType>('open')
    const [contractAddress, setContractAddress] = useState('')
    const [collectionSlug, setCollectionSlug] = useState('')
    const [minBalance, setMinBalance] = useState('1')
    const [allowlistAddresses, setAllowlistAddresses] = useState('')

    const gates: { value: GateType; label: string; desc: string }[] = [
        { value: 'open',      label: 'Open',          desc: 'Anyone can claim' },
        { value: 'nft',       label: 'NFT Holders',   desc: 'ERC-721 or ETHscriptions collection' },
        { value: 'token',     label: 'Token Holders', desc: 'Requires a minimum ERC-20 balance' },
        { value: 'allowlist', label: 'Allowlist',     desc: 'Only specific wallet addresses' },
    ]

    const canProceed =
        gateType === 'open' ||
        (gateType === 'nft' && (contractAddress.trim() || collectionSlug.trim())) ||
        (gateType === 'token' && contractAddress.trim()) ||
        (gateType === 'allowlist' && allowlistAddresses.trim())

    const handleNext = () => {
        onDone({
            gate_type: gateType,
            contract_address: contractAddress.trim(),
            collection_slug: collectionSlug.trim(),
            min_balance: minBalance.trim() || '1',
            allowlist_addresses: allowlistAddresses.trim(),
        })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                    Set eligibility
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
                            borderRadius: '10px', padding: '14px 18px', cursor: 'pointer',
                            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                            gap: '2px', transition: 'all 0.15s', textAlign: 'left',
                        }}
                    >
                        <span style={{ color: gateType === g.value ? ACCENT : '#ccc', fontWeight: 'bold', fontSize: '0.9rem' }}>
                            {g.label}
                        </span>
                        <span style={{ color: '#555', fontSize: '0.8rem' }}>{g.desc}</span>
                    </button>
                ))}
            </div>

            {gateType === 'nft' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={label}>ETHscriptions collection slug</label>
                        <input style={input} type="text" placeholder="e.g. pixel-goblins"
                            value={collectionSlug} onChange={e => setCollectionSlug(e.target.value)} />
                        <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '4px' }}>or</p>
                    </div>
                    <div>
                        <label style={label}>ERC-721 contract address</label>
                        <input style={input} type="text" placeholder="0x..."
                            value={contractAddress} onChange={e => setContractAddress(e.target.value)} />
                    </div>
                </div>
            )}

            {gateType === 'token' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={label}>ERC-20 contract address</label>
                        <input style={input} type="text" placeholder="0x..."
                            value={contractAddress} onChange={e => setContractAddress(e.target.value)} />
                    </div>
                    <div>
                        <label style={label}>Minimum balance required</label>
                        <input style={input} type="number" min="0" step="any" placeholder="1"
                            value={minBalance} onChange={e => setMinBalance(e.target.value)} />
                        <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '4px' }}>
                            In whole tokens (e.g. 1 = 1 token)
                        </p>
                    </div>
                </div>
            )}

            {gateType === 'allowlist' && (
                <div>
                    <label style={label}>Allowed wallet addresses</label>
                    <textarea
                        style={{
                            ...input, height: '120px', resize: 'vertical' as const,
                            fontFamily: 'monospace', fontSize: '0.78rem',
                        }}
                        placeholder={'0xabc...\n0xdef...\n0x123...'}
                        value={allowlistAddresses}
                        onChange={e => setAllowlistAddresses(e.target.value)}
                    />
                    <p style={{ color: '#444', fontSize: '0.75rem', marginTop: '4px' }}>
                        One address per line
                    </p>
                </div>
            )}

            <button style={btnPrimary(!canProceed)} onClick={handleNext} disabled={!canProceed}>
                CONTINUE
            </button>
        </div>
    )
}

// ─── Step 3b: Set ENS resolver ────────────────────────────────────────────

const ENS_REGISTRY    = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e' as const
const NAME_WRAPPER    = '0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401' as const
const NS_RESOLVER     = '0xA87361C4E58B619c390f469B9E6F27d759715125' as const

const REGISTRY_ABI = [
    { name: 'resolver', type: 'function', inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { name: 'owner',    type: 'function', inputs: [{ name: 'node', type: 'bytes32' }], outputs: [{ type: 'address' }], stateMutability: 'view' },
    { name: 'setResolver', type: 'function', inputs: [{ name: 'node', type: 'bytes32' }, { name: 'resolver', type: 'address' }], outputs: [], stateMutability: 'nonpayable' },
] as const

function StepResolver({ ensDomain, onDone }: { ensDomain: string; onDone: () => void }) {
    const node = namehash(ensDomain)
    const { writeContractAsync } = useWriteContract()
    const [txHash, setTxHash]   = useState<`0x${string}` | undefined>()
    const [setting, setSetting] = useState(false)
    const [error, setError]     = useState('')

    const { data: currentResolver, isLoading: resolverLoading } = useReadContract({
        address: ENS_REGISTRY, abi: REGISTRY_ABI, functionName: 'resolver', args: [node],
    })
    const { data: registryOwner } = useReadContract({
        address: ENS_REGISTRY, abi: REGISTRY_ABI, functionName: 'owner', args: [node],
    })
    const { isSuccess: confirmed } = useWaitForTransactionReceipt({ hash: txHash })

    const alreadySet = currentResolver?.toLowerCase() === NS_RESOLVER.toLowerCase()
    const isWrapped  = registryOwner?.toLowerCase() === NAME_WRAPPER.toLowerCase()

    // Auto-advance if resolver already correct
    useEffect(() => {
        if (!resolverLoading && alreadySet) onDone()
    }, [resolverLoading, alreadySet])

    // Advance once tx confirmed
    useEffect(() => {
        if (confirmed) onDone()
    }, [confirmed])

    const handleSet = async () => {
        setSetting(true)
        setError('')
        try {
            const target = isWrapped ? NAME_WRAPPER : ENS_REGISTRY
            const hash = await writeContractAsync({
                address: target,
                abi: REGISTRY_ABI,
                functionName: 'setResolver',
                args: [node, NS_RESOLVER],
            })
            setTxHash(hash)
        } catch (e: any) {
            setError(e.shortMessage || e.message || 'Transaction failed')
            setSetting(false)
        }
    }

    if (resolverLoading) {
        return (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>⟳ Checking resolver…</p>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                    Set resolver
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                    One-time transaction to point <span style={{ color: ACCENT }}>{ensDomain}</span> at <img src="/images/namestone-logo.png" alt="" style={{ height: '12px', verticalAlign: 'middle', display: 'inline-block', marginRight: '2px', opacity: 0.85 }} />Namestone's resolver
                </p>
            </div>

            <div style={{
                background: 'rgba(255,170,0,0.05)', border: '1px solid rgba(255,170,0,0.2)',
                borderRadius: '10px', padding: '14px 18px', fontSize: '0.82rem', color: '#ffaa00',
            }}>
                ⚠ This is an on-chain transaction — requires a small amount of ETH for gas (~$2–5)
            </div>

            <div style={{
                background: 'var(--row-bg)', border: '1px solid var(--card-border)',
                borderRadius: '10px', padding: '14px 18px', fontSize: '0.8rem',
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ color: '#555' }}>Current resolver</span>
                    <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {currentResolver ? `${currentResolver.slice(0, 6)}…${currentResolver.slice(-4)}` : 'none'}
                    </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#555' }}>New resolver</span>
                    <span style={{ color: ACCENT, fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {NS_RESOLVER.slice(0, 6)}…{NS_RESOLVER.slice(-4)} <img src="/images/namestone-logo.png" alt="" style={{ height: '11px', verticalAlign: 'middle', display: 'inline-block', marginLeft: '3px', marginRight: '2px', opacity: 0.8 }} />(Namestone)
                    </span>
                </div>
            </div>

            {txHash && !confirmed && (
                <div style={{
                    background: 'rgba(0,255,136,0.05)', border: `1px solid ${ACCENT}33`,
                    borderRadius: '8px', padding: '12px 16px', fontSize: '0.82rem', color: 'var(--text-muted)',
                    display: 'flex', alignItems: 'center', gap: '8px',
                }}>
                    <span>⟳</span>
                    <span>Waiting for confirmation…</span>
                    <a href={`https://etherscan.io/tx/${txHash}`} target="_blank" rel="noopener noreferrer"
                        style={{ marginLeft: 'auto', color: ACCENT, fontSize: '0.75rem', textDecoration: 'underline' }}>
                        View on Etherscan →
                    </a>
                </div>
            )}

            {error && <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>}

            {!txHash && (
                <button style={btnPrimary(setting)} onClick={handleSet} disabled={setting}>
                    {setting ? '⟳ WAITING FOR SIGNATURE…' : 'SET RESOLVER'}
                </button>
            )}
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
    const { address } = useAccount()
    const { signMessageAsync } = useSignMessage()
    const [name, setName] = useState('')
    const [apiKey, setApiKey] = useState('')
    const [accentColor, setAccentColor] = useState('#00ff88')
    const [logoUrl, setLogoUrl] = useState('')
    const [claimLimit, setClaimLimit] = useState('50')
    const [error, setError] = useState('')

    const [email, setEmail] = useState('')
    const [enableStatus, setEnableStatus] = useState<'idle' | 'busy' | 'done' | 'error'>('idle')
    const [enableError, setEnableError] = useState('')

    const handleNamestoneEnable = async () => {
        if (!address || !email.trim()) return
        setEnableStatus('busy')
        setEnableError('')
        try {
            const msgRes = await fetch(`/api/onboard/namestone-message?address=${address}`)
            const msgData = await msgRes.json()
            if (!msgRes.ok) throw new Error(msgData.error || 'Could not get SIWE message')

            const signature = await signMessageAsync({ message: msgData.message })

            const res = await fetch('/api/onboard/namestone-enable', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    address:      address,
                    domain:       ensDomain,
                    signature,
                    email:        email.trim(),
                    company_name: name.trim() || ensDomain,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Enable failed')
            if (data.api_key) setApiKey(data.api_key)
            setEnableStatus('done')
        } catch (e: any) {
            setEnableError(e.message || 'Something went wrong')
            setEnableStatus('error')
        }
    }

    const handleNext = () => {
        if (!name.trim()) { setError('Name is required'); return }
        if (!apiKey.trim()) { setError('Namestone API key is required'); return }
        onDone({ name: name.trim(), namestone_api_key: apiKey.trim(), accent_color: accentColor, logo_url: logoUrl, claim_limit: claimLimit })
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                    Brand your page
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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

                {/* Namestone wallet-enable section */}
                <div style={{
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '10px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    background: 'var(--row-bg)',
                }}>
                    <div>
                        <p style={{ color: '#ccc', fontSize: '0.85rem', fontWeight: 'bold', marginBottom: '2px' }}>
                            Namestone API Key
                        </p>
                        <p style={{ color: '#555', fontSize: '0.78rem' }}>
                            Enable your domain with your wallet — Namestone will email you the key
                        </p>
                    </div>

                    {enableStatus !== 'done' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                style={{ ...input, flex: 1 }}
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                            />
                            <button
                                onClick={handleNamestoneEnable}
                                disabled={!email.trim() || enableStatus === 'busy'}
                                style={{
                                    flexShrink: 0,
                                    padding: '0 16px',
                                    borderRadius: '8px',
                                    border: `1px solid ${ACCENT}55`,
                                    background: 'transparent',
                                    color: !email.trim() || enableStatus === 'busy' ? '#444' : ACCENT,
                                    fontWeight: 'bold',
                                    fontSize: '0.8rem',
                                    cursor: !email.trim() || enableStatus === 'busy' ? 'not-allowed' : 'pointer',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {enableStatus === 'busy' ? '⟳ Signing…' : '⚡ Enable via wallet'}
                            </button>
                        </div>
                    )}

                    {enableStatus === 'done' && (
                        <div style={{
                            background: 'rgba(0,255,136,0.06)',
                            border: `1px solid ${ACCENT}33`,
                            borderRadius: '8px',
                            padding: '10px 14px',
                            fontSize: '0.82rem',
                            color: ACCENT,
                        }}>
                            ✓ Domain enabled — Namestone is emailing your API key to <strong>{email}</strong>
                        </div>
                    )}

                    {enableStatus === 'error' && (
                        <p style={{ color: '#ff6666', fontSize: '0.8rem' }}>{enableError}</p>
                    )}

                    <div>
                        <label style={label}>Paste API key here when you receive it</label>
                        <input style={input} type="text" placeholder="ns_…" value={apiKey} onChange={e => setApiKey(e.target.value)} />
                    </div>

                    {apiKey && (
                        <div style={{
                            display: 'flex', alignItems: 'flex-start', gap: '8px',
                            background: 'rgba(255,170,0,0.05)',
                            border: '1px solid rgba(255,170,0,0.2)',
                            borderRadius: '8px',
                            padding: '10px 12px',
                            fontSize: '0.78rem',
                            color: '#ffaa00',
                        }}>
                            <span style={{ flexShrink: 0 }}>🔑</span>
                            <span>
                                Keep this key private — it controls subdomain issuance on your ENS domain.
                                Store a copy somewhere safe; it won't be shown again.
                            </span>
                        </div>
                    )}
                </div>

                <div>
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

                <div>
                    <label style={label}>Logo URL <span style={{ color: '#444' }}>(optional)</span></label>
                    <input style={input} type="url" placeholder="https://…" value={logoUrl} onChange={e => setLogoUrl(e.target.value)} />
                </div>
            </div>

            {error && <p style={{ color: '#ff4444', fontSize: '0.85rem' }}>{error}</p>}

            {/* Preview pill */}
            <div style={{
                background: 'var(--input-bg)',
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
    plan,
}: {
    ensDomain: string
    gateConfig: GateConfig
    brandingConfig: BrandingConfig
    onReset: () => void
    plan?: 'pro' | 'business'
}) {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [result, setResult] = useState<{ slug: string; claim_url: string } | null>(null)
    const [billingEmail, setBillingEmail] = useState('')
    const [billingLoading, setBillingLoading] = useState(false)
    const [billingError, setBillingError] = useState('')

    const handleBillingRedirect = async () => {
        if (!result || !billingEmail.trim()) return
        setBillingLoading(true)
        setBillingError('')
        try {
            const res = await fetch('/api/billing/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug: result.slug,
                    plan: plan,
                    email: billingEmail.trim(),
                    success_url: `${window.location.origin}/manage/${result.slug}?upgraded=1`,
                    cancel_url: `${window.location.origin}/manage/${result.slug}`,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to start checkout')
            window.location.href = data.url
        } catch (e: any) {
            setBillingError(e.message)
            setBillingLoading(false)
        }
    }

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
                if (gateConfig.collection_slug)  body.collection_slug  = gateConfig.collection_slug
                if (gateConfig.min_balance)       body.min_balance       = gateConfig.min_balance
                if (gateConfig.allowlist_addresses) body.allowlist_addresses = gateConfig.allowlist_addresses

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
                <p style={{ color: 'var(--text-muted)' }}>Creating your subdomain manager…</p>
            </div>
        )
    }

    if (error) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center' }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <p style={{ color: '#ff4444', fontWeight: 'bold' }}>Something went wrong</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{error}</p>
                <button style={btnPrimary()} onClick={onReset}>START OVER</button>
            </div>
        )
    }

    // Paid plan flow — ask for billing email then redirect to Stripe
    if (plan && result) {
        const planLabel = plan === 'pro' ? 'Pro ($9/mo)' : 'Business ($29/mo)'
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
                <div>
                    <div style={{ fontSize: '1.5rem', marginBottom: '12px', color: 'var(--text-muted)' }}>✓</div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                        Page created!
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                        One last step — set up your <span style={{ color: ACCENT }}>{planLabel}</span> subscription
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', textAlign: 'left' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Billing email</label>
                    <input
                        style={{
                            width: '100%', background: 'var(--input-bg)',
                            border: '1.5px solid var(--input-border)', borderRadius: '8px',
                            padding: '11px 14px', color: 'var(--text)',
                            fontFamily: "'Inter', system-ui, sans-serif", fontSize: '0.9rem',
                            outline: 'none', boxSizing: 'border-box' as const,
                        }}
                        type="email"
                        placeholder="you@example.com"
                        value={billingEmail}
                        onChange={e => setBillingEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleBillingRedirect()}
                        autoFocus
                    />
                    {billingError && <p style={{ color: '#ff4444', fontSize: '0.8rem' }}>{billingError}</p>}
                    <button
                        onClick={handleBillingRedirect}
                        disabled={!billingEmail.trim() || billingLoading}
                        style={{
                            ...btnPrimary(!billingEmail.trim() || billingLoading),
                            width: '100%',
                        }}
                    >
                        {billingLoading ? '⟳ Redirecting…' : `CONTINUE TO PAYMENT →`}
                    </button>
                </div>

                <a
                    href={`/manage/${result.slug}`}
                    style={{ color: '#444', fontSize: '0.8rem', textDecoration: 'underline' }}
                >
                    Skip for now — activate later from manage page
                </a>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'center' }}>
            <div>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🎉</div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '8px' }}>
                    You're live!
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
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
                        color: 'var(--text-muted)',
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
                    color: 'var(--text-muted)', fontSize: '0.85rem',
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

    const urlPlan = new URLSearchParams(window.location.search).get('plan') as 'pro' | 'business' | null
    const plan = urlPlan === 'pro' || urlPlan === 'business' ? urlPlan : undefined

    const totalSteps = 5 // steps 0–4 before success (step 5)

    const reset = () => {
        setStep(0)
        setEnsDomain('')
        setGateConfig(null)
        setBrandingConfig(null)
    }

    const stepTitles = ['Verify Wallet', 'ENS Domain', 'Eligibility', 'Resolver', 'Branding']

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

            {/* Header */}
            <header style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'var(--header-bg)',
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
                {step < 5 && (
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
                        {step < 5 && <StepBar current={step} total={totalSteps} />}

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
                            <StepResolver ensDomain={ensDomain} onDone={() => setStep(4)} />
                        )}
                        {step === 4 && (
                            <Step4
                                ensDomain={ensDomain}
                                onDone={(b) => { setBrandingConfig(b); setStep(5) }}
                            />
                        )}
                        {step === 5 && gateConfig && brandingConfig && (
                            <Step5
                                ensDomain={ensDomain}
                                gateConfig={gateConfig}
                                brandingConfig={brandingConfig}
                                onReset={reset}
                                plan={plan}
                            />
                        )}
                    </div>

                    {step > 0 && step < 5 && (
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
    const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'))
    useEffect(() => {
        const obs = new MutationObserver(() => setIsLight(document.documentElement.classList.contains('light')))
        obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
        return () => obs.disconnect()
    }, [])
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                <RainbowKitProvider theme={isLight ? lightTheme({ accentColor: ACCENT }) : darkTheme({ accentColor: ACCENT })}>
                    <OnboardWizard />
                </RainbowKitProvider>
            </QueryClientProvider>
        </WagmiProvider>
    )
}
