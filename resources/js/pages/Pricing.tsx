import { useState } from 'react'

const ACCENT = '#00ff88'

interface Props {
    slug?: string
}

const plans = [
    {
        id: 'pro' as const,
        name: 'Pro',
        price: '$9',
        period: '/ month',
        highlight: true,
        limits: { claims: 500, limit_label: '500 claims' },
        features: [
            '500 total claims',
            'All gate types (NFT, token, allowlist)',
            'No ENSub badge',
            'Embeddable claim widget',
            'Priority email support',
        ],
    },
    {
        id: 'business' as const,
        name: 'Business',
        price: '$29',
        period: '/ month',
        highlight: false,
        limits: { claims: 10000, limit_label: 'Unlimited claims' },
        features: [
            'Unlimited claims (up to 10k)',
            'All gate types (NFT, token, allowlist)',
            'No ENSub badge',
            'Embeddable claim widget',
            'Slack + email support',
        ],
    },
]

export default function Pricing({ slug }: Props) {
    const [loading, setLoading] = useState<string | null>(null)
    const [email, setEmail] = useState('')
    const [emailFor, setEmailFor] = useState<string | null>(null)
    const [error, setError] = useState('')

    const handleUpgrade = async (planId: 'pro' | 'business') => {
        if (!slug) {
            window.location.href = '/start'
            return
        }
        if (!email) {
            setEmailFor(planId)
            return
        }
        setLoading(planId)
        setError('')
        try {
            const res = await fetch('/api/billing/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    plan: planId,
                    email,
                    success_url: window.location.origin + `/claim/${slug}?upgraded=1`,
                    cancel_url: window.location.href,
                }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed')
            window.location.href = data.url
        } catch (e: any) {
            setError(e.message)
        } finally {
            setLoading(null)
        }
    }

    const btnPrimary = (disabled = false) => ({
        display: 'block',
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
        textAlign: 'center' as const,
        boxSizing: 'border-box' as const,
    })

    const btnGhost = {
        display: 'block',
        width: '100%',
        padding: '13px',
        background: 'transparent',
        color: ACCENT,
        border: `1.5px solid ${ACCENT}55`,
        borderRadius: '8px',
        fontWeight: 'bold' as const,
        fontSize: '0.9rem',
        letterSpacing: '0.08em',
        cursor: 'pointer',
        transition: 'all 0.2s',
        boxSizing: 'border-box' as const,
    }

    return (
        <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            {/* Nav */}
            <header style={{
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                background: 'rgba(15,17,23,0.9)',
                backdropFilter: 'blur(8px)',
                padding: '16px 32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
            }}>
                <a href="/" style={{ textDecoration: 'none' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: ACCENT, textShadow: `0 0 10px ${ACCENT}80` }}>
                        ENSub
                    </span>
                </a>
                {slug && (
                    <a href={`/claim/${slug}`} style={{ color: '#555', fontSize: '0.85rem', textDecoration: 'underline' }}>
                        ← Back to claim page
                    </a>
                )}
            </header>

            <div style={{ flex: 1, padding: '64px 24px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '10px' }}>
                        Upgrade your plan
                    </h1>
                    <p style={{ color: '#888', fontSize: '0.9rem' }}>
                        More claims, more power, no badge.
                    </p>
                </div>

                {/* Email input (shown when plan selected without email) */}
                {emailFor && !email && (
                    <div style={{
                        background: 'rgba(22,33,62,0.7)',
                        border: `1px solid ${ACCENT}33`,
                        borderRadius: '12px',
                        padding: '28px',
                        marginBottom: '32px',
                        maxWidth: '440px',
                        marginLeft: 'auto',
                        marginRight: 'auto',
                    }}>
                        <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '12px' }}>
                            Enter the email for your billing receipt
                        </p>
                        <input
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleUpgrade(emailFor as 'pro' | 'business')}
                            style={{
                                width: '100%',
                                background: 'rgba(10,10,30,0.5)',
                                border: '1.5px solid rgba(255,255,255,0.08)',
                                borderRadius: '10px',
                                padding: '12px 16px',
                                color: '#e4e4e4',
                                fontSize: '0.95rem',
                                outline: 'none',
                                boxSizing: 'border-box',
                                marginBottom: '12px',
                            }}
                            autoFocus
                        />
                        <button
                            style={btnPrimary(!email)}
                            disabled={!email}
                            onClick={() => handleUpgrade(emailFor as 'pro' | 'business')}
                        >
                            CONTINUE TO CHECKOUT
                        </button>
                    </div>
                )}

                {error && (
                    <p style={{ textAlign: 'center', color: '#ff4444', fontSize: '0.875rem', marginBottom: '24px' }}>{error}</p>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
                    {/* Free — current / reference */}
                    <div style={{
                        background: 'rgba(22,33,62,0.4)',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: '16px',
                        padding: '32px',
                        opacity: 0.7,
                    }}>
                        <h3 style={{ color: '#888', fontWeight: 'bold', marginBottom: '8px' }}>Free</h3>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                            <span style={{ fontSize: '2.2rem', fontWeight: 'bold', color: '#666' }}>$0</span>
                        </div>
                        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['50 total claims', 'Open or NFT gate', 'Custom logo & accent colour', 'ENSub badge shown'].map(f => (
                                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#555' }}>
                                    <span style={{ color: '#444' }}>✓</span>{f}
                                </li>
                            ))}
                        </ul>
                        <div style={{
                            display: 'block', width: '100%', padding: '13px',
                            background: 'rgba(255,255,255,0.04)', color: '#444',
                            border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px',
                            textAlign: 'center', fontSize: '0.85rem', boxSizing: 'border-box',
                        }}>
                            Current plan
                        </div>
                    </div>

                    {plans.map(plan => (
                        <div key={plan.id} style={{
                            background: 'rgba(22,33,62,0.7)',
                            border: `1.5px solid ${plan.highlight ? `${ACCENT}55` : 'rgba(255,255,255,0.08)'}`,
                            borderRadius: '16px',
                            backdropFilter: 'blur(8px)',
                            padding: '32px',
                            position: 'relative',
                            ...(plan.highlight ? { boxShadow: `0 0 40px ${ACCENT}18`, transform: 'scale(1.02)' } : {}),
                        }}>
                            {plan.highlight && (
                                <div style={{
                                    position: 'absolute', top: '-14px', left: '50%', transform: 'translateX(-50%)',
                                    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
                                    color: '#0a0a1a', padding: '4px 14px', borderRadius: '20px',
                                    fontSize: '0.75rem', fontWeight: 'bold', letterSpacing: '0.08em', whiteSpace: 'nowrap',
                                }}>
                                    MOST POPULAR
                                </div>
                            )}

                            <h3 style={{ fontWeight: 'bold', color: '#ccc', marginBottom: '8px' }}>{plan.name}</h3>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px', marginBottom: '24px' }}>
                                <span style={{
                                    fontSize: '2.2rem', fontWeight: 'bold',
                                    color: plan.highlight ? ACCENT : '#e4e4e4',
                                    textShadow: plan.highlight ? `0 0 20px ${ACCENT}60` : 'none',
                                }}>
                                    {plan.price}
                                </span>
                                <span style={{ color: '#555', fontSize: '0.875rem' }}>{plan.period}</span>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {plan.features.map(f => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#aaa' }}>
                                        <span style={{ color: ACCENT, flexShrink: 0 }}>✓</span>{f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                style={plan.highlight ? btnPrimary(loading === plan.id) : { ...btnGhost, cursor: loading === plan.id ? 'not-allowed' : 'pointer', opacity: loading === plan.id ? 0.6 : 1 }}
                                disabled={loading === plan.id}
                                onClick={() => handleUpgrade(plan.id)}
                            >
                                {loading === plan.id ? '⟳ Redirecting...' : `Upgrade to ${plan.name}`}
                            </button>
                        </div>
                    ))}
                </div>

                <p style={{ textAlign: 'center', color: '#333', fontSize: '0.75rem', marginTop: '40px' }}>
                    Billed monthly via Stripe · Cancel anytime · Existing claims preserved on downgrade
                </p>
            </div>

            <footer style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.04)', textAlign: 'center' }}>
                <p style={{ color: '#1e1e1e', fontSize: '0.75rem' }}>ENSub · Gasless ENS subdomain management</p>
            </footer>
        </main>
    )
}
