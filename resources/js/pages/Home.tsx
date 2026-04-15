import { useState, useEffect } from 'react'

function useDarkMode() {
    const [dark, setDark] = useState(() => {
        if (typeof window === 'undefined') return true
        const saved = localStorage.getItem('theme')
        return saved ? saved === 'dark' : true // default dark
    })

    useEffect(() => {
        const root = document.documentElement
        if (dark) {
            root.classList.remove('light')
        } else {
            root.classList.add('light')
        }
        localStorage.setItem('theme', dark ? 'dark' : 'light')
    }, [dark])

    return [dark, setDark] as const
}

const ACCENT = '#00ff88'

// ─── Shared styles ──────────────────────────────────────────────────────────

const btnPrimary = {
    display: 'inline-block',
    padding: '14px 28px',
    background: `linear-gradient(135deg, ${ACCENT}, ${ACCENT}cc)`,
    color: '#0a0a1a',
    border: 'none',
    borderRadius: '8px',
    fontWeight: 'bold' as const,
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    boxShadow: `0 0 24px ${ACCENT}40`,
    textDecoration: 'none',
    transition: 'all 0.2s',
}

const btnGhost = {
    display: 'inline-block',
    padding: '13px 28px',
    background: 'transparent',
    color: ACCENT,
    border: `1.5px solid ${ACCENT}66`,
    borderRadius: '8px',
    fontWeight: 'bold' as const,
    fontSize: '0.9rem',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'all 0.2s',
}

const card = (accent = 'rgba(255,255,255,0.06)') => ({
    background: 'var(--card-bg)',
    border: `1px solid ${accent}`,
    borderRadius: '16px',
    backdropFilter: 'blur(8px)',
    padding: '32px',
})

// ─── Pricing data ───────────────────────────────────────────────────────────

const plans = [
    {
        name: 'Free',
        price: '$0',
        period: 'forever',
        color: 'rgba(255,255,255,0.08)',
        features: [
            '50 total claims',
            'Gasless offchain minting',
            '1 L2 chain (open registrar)',
            'Open or NFT gate',
            'Custom logo & accent colour',
            'ENSub badge shown',
        ],
        cta: 'Get started free',
        ctaHref: '/start',
        highlight: false,
    },
    {
        name: 'Pro',
        price: '$9',
        period: '/ month',
        color: `${ACCENT}33`,
        features: [
            '500 total claims',
            'Gasless offchain minting',
            'All 8 L2 chains (Base · OP · Arb · Polygon · Linea · Scroll · Celo · World Chain)',
            'ENSub registrar — set price, treasury & mint limits',
            'All gate types (NFT, token, allowlist)',
            'No ENSub badge',
            'Embeddable claim widget',
            'Priority email support',
        ],
        cta: 'Start with Pro',
        ctaHref: '/start?plan=pro',
        highlight: true,
    },
    {
        name: 'Business',
        price: '$29',
        period: '/ month',
        color: 'rgba(0,136,255,0.25)',
        features: [
            'Unlimited claims (up to 10k)',
            'Gasless offchain minting',
            'All 8 L2 chains + ENSub registrar',
            'On-chain ENS resolution via Durin L1Resolver',
            'All gate types (NFT, token, allowlist)',
            'No ENSub badge',
            'Embeddable claim widget',
            'Slack + email support',
        ],
        cta: 'Start with Business',
        ctaHref: '/start?plan=business',
        highlight: false,
    },
]

// ─── FAQ ─────────────────────────────────────────────────────────────────────

const faqs = [
    {
        q: 'Do I need to write any code?',
        a: 'No. Connect your wallet, verify your ENS domain, configure eligibility, and your claim page is live — no deployment or code required.',
    },
    {
        q: 'What is Namestone?',
        a: <><img src="/images/namestone-logo.png" alt="" style={{ height: '13px', verticalAlign: 'middle', display: 'inline-block', marginRight: '4px', opacity: 0.85 }} />Namestone is a gasless <img src="/images/ens-logo.svg" alt="" style={{ height: '11px', verticalAlign: 'middle', display: 'inline-block', marginRight: '2px', marginLeft: '1px', opacity: 0.85 }} />ENS offchain resolver. ENSub uses their API to issue subdomains instantly without any on-chain transaction costs.</>,
    },
    {
        q: 'Can I gate claims to NFT holders only?',
        a: 'Yes. You can restrict claims to holders of any ERC-721 NFT collection or ETHscriptions collection. Wallets are verified on-chain at claim time.',
    },
    {
        q: 'What happens if I cancel my Pro subscription?',
        a: 'Existing claims remain active. Your plan reverts to Free and the claim limit drops to 50. No subdomains are deleted.',
    },
    {
        q: 'Is my Namestone API key safe?',
        a: <><img src="/images/namestone-logo.png" alt="" style={{ height: '13px', verticalAlign: 'middle', display: 'inline-block', marginRight: '4px', opacity: 0.85 }} />Yes. Your Namestone key is stored encrypted and never exposed through the public claim API.</>,
    },
]

function FAQ() {
    const [open, setOpen] = useState<number | null>(null)

    return (
        <section style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '40px' }}>
                Frequently asked questions
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {faqs.map((faq, i) => (
                    <div
                        key={i}
                        style={{
                            ...card(open === i ? `${ACCENT}33` : 'rgba(255,255,255,0.06)'),
                            padding: '18px 24px',
                            cursor: 'pointer',
                            transition: 'border-color 0.2s',
                        }}
                        onClick={() => setOpen(open === i ? null : i)}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                            <span style={{ fontWeight: 'bold', color: '#ccc', fontSize: '0.95rem' }}>{faq.q}</span>
                            <span style={{ color: ACCENT, fontSize: '1.2rem', flexShrink: 0, transition: 'transform 0.2s',
                                transform: open === i ? 'rotate(45deg)' : 'none' }}>+</span>
                        </div>
                        {open === i && (
                            <p style={{ marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 0 }}>
                                {faq.a}
                            </p>
                        )}
                    </div>
                ))}
            </div>
        </section>
    )
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function Home() {
    const [dark, setDark] = useDarkMode()

    return (
        <main style={{ minHeight: '100vh', overflowX: 'hidden' }}>

            {/* Nav */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 50,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'var(--header-bg)',
                backdropFilter: 'blur(12px)',
                padding: '0 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: '60px',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img src="/images/ensub-logo.gif" alt="ENSub" style={{ width: '28px', height: '28px', borderRadius: '6px' }} />
                    <span style={{
                        fontSize: '0.85rem',
                        fontWeight: 'bold',
                        color: ACCENT,
                        border: `1px solid ${ACCENT}55`,
                        borderRadius: '6px',
                        padding: '2px 8px',
                        letterSpacing: '0.05em',
                    }}>
                        ENSub
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div className="nav-links-desktop" style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                        <a href="#pricing" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>Pricing</a>
                        <a href="#how" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none' }}>How it works</a>
                    </div>
                    <button
                        onClick={() => setDark(d => !d)}
                        title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
                        style={{
                            background: 'none',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '6px',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.85rem',
                            padding: 0,
                            color: '#666',
                            transition: 'border-color 0.2s, color 0.2s',
                            flexShrink: 0,
                        }}
                    >
                        {dark ? '☀' : '☾'}
                    </button>
                    <a href="/start" style={btnPrimary}>Get started →</a>
                </div>
            </nav>

            {/* Hero */}
            <section style={{
                textAlign: 'center',
                padding: '100px 24px 80px',
                position: 'relative',
            }}>
                {/* Background glow */}
                <div style={{
                    position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
                    width: '600px', height: '400px',
                    background: `radial-gradient(ellipse at center, ${ACCENT}12 0%, transparent 70%)`,
                    pointerEvents: 'none',
                }} />

                <div style={{ position: 'relative', maxWidth: '800px', margin: '0 auto' }}>
                    <img
                        src="/images/ensub-logo.gif"
                        alt="ENSub"
                        style={{ width: '72px', height: '72px', borderRadius: '16px', display: 'block', margin: '0 auto 20px' }}
                    />
                    <div style={{
                        display: 'inline-block',
                        background: `${ACCENT}14`,
                        border: `1px solid ${ACCENT}33`,
                        borderRadius: '20px',
                        padding: '6px 14px',
                        fontSize: '0.8rem',
                        color: ACCENT,
                        marginBottom: '24px',
                        letterSpacing: '0.08em',
                    }}>
                        GASLESS · INSTANT · NO CODE
                    </div>

                    <h1 style={{
                        fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
                        fontWeight: 'bold',
                        color: 'var(--text)',
                        lineHeight: 1.1,
                        marginBottom: '24px',
                    }}>
                        Give your community a{' '}
                        <span style={{ color: ACCENT, textShadow: `0 0 30px ${ACCENT}60` }}>
                            *.yourname.eth
                        </span>{' '}
                        identity
                    </h1>

                    <p style={{ fontSize: '1.1rem', color: 'var(--text-muted)', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
                        ENSub lets any ENS domain owner launch a subdomain claim page in minutes.
                        Token-gate it, brand it, and share the link — no code, no gas.
                    </p>

                    <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                        <a href="/start" style={btnPrimary}>Launch your claim page →</a>
                        <a href="#how" style={btnGhost}>See how it works</a>
                    </div>

                    {/* Social proof */}
                    <p style={{ marginTop: '40px', color: '#333', fontSize: '0.8rem' }}>
                        Free to start · No credit card required
                    </p>
                </div>
            </section>

            {/* How it works */}
            <section id="how" style={{ padding: '80px 24px', maxWidth: '1000px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '56px' }}>
                    Up and running in 3 steps
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                    {[
                        {
                            num: '01',
                            title: 'Verify & configure',
                            desc: 'Connect your wallet — we check on-chain that you own the ENS domain. Set your gate type (open, NFT, token, allowlist), logo, and accent colour.',
                        },
                        {
                            num: '02',
                            title: 'Add L2 chains (optional)',
                            desc: 'Deploy an L2Registry + ENSub registrar on any supported chain in one click — Base, Optimism, Arbitrum, Polygon, Linea, Scroll, Celo, or World Chain. Set a mint price, treasury address, and per-wallet limits.',
                        },
                        {
                            num: '03',
                            title: 'Share & watch it grow',
                            desc: 'Your page is live at ensub.org/claim/yourname. Community members claim gaslessly via Namestone or mint an on-chain NFT on any chain you configured.',
                        },
                    ].map(step => (
                        <div key={step.num} style={card()}>
                            <div style={{
                                fontSize: '2rem', fontWeight: 'bold',
                                color: ACCENT, opacity: 0.3,
                                marginBottom: '16px', fontFamily: 'monospace',
                            }}>
                                {step.num}
                            </div>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '10px' }}>
                                {step.title}
                            </h3>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                                {step.desc}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Feature grid */}
            <section style={{ padding: '40px 24px 80px', maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                    {[
                        { icon: <img src="/images/ens-logo.svg" alt="ENS" style={{ width: '28px', height: '28px', display: 'block' }} />, title: 'On-chain verified', desc: 'ENS ownership checked via mainnet registry — no third party.' },
                        { icon: <img src="/images/namestone-logo.png" alt="Namestone" style={{ width: '28px', height: '28px', display: 'block' }} />, title: 'Gasless for claimants', desc: <>Powered by <img src="/images/namestone-logo.png" alt="" style={{ height: '11px', verticalAlign: 'middle', display: 'inline-block', marginRight: '2px', opacity: 0.8 }} />Namestone offchain resolution. Zero gas fees.</> },
                        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"/></svg>, title: 'Flexible gating', desc: 'Open, NFT-gated, ERC-20 token, or custom allowlist.' },
                        { icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42"/></svg>, title: 'Fully branded', desc: 'Your logo, accent colour, and domain — your page.' },
                    ].map(f => (
                        <div key={f.title} style={{ ...card(), padding: '24px' }}>
                            <div style={{ marginBottom: '10px' }}>{f.icon}</div>
                            <h4 style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px' }}>{f.title}</h4>
                            <p style={{ color: '#555', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '12px' }}>
                    Simple, transparent pricing
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '48px' }}>
                    Start free. Upgrade when you outgrow the limits.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', alignItems: 'start' }}>
                    {plans.map(plan => (
                        <div key={plan.name} style={{
                            ...card(plan.color),
                            position: 'relative',
                            ...(plan.highlight ? {
                                borderColor: `${ACCENT}66`,
                                boxShadow: `0 0 40px ${ACCENT}18`,
                                transform: 'scale(1.02)',
                            } : {}),
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

                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#ccc', marginBottom: '8px' }}>
                                    {plan.name}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                                    <span style={{
                                        fontSize: '2.5rem', fontWeight: 'bold',
                                        color: plan.highlight ? ACCENT : 'var(--text)',
                                        textShadow: plan.highlight ? `0 0 20px ${ACCENT}60` : 'none',
                                    }}>
                                        {plan.price}
                                    </span>
                                    <span style={{ color: '#555', fontSize: '0.875rem' }}>{plan.period}</span>
                                </div>
                            </div>

                            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {plan.features.map(f => (
                                    <li key={f} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.875rem', color: '#aaa' }}>
                                        <span style={{ color: ACCENT, flexShrink: 0 }}>✓</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>

                            <a
                                href={plan.ctaHref}
                                style={{
                                    ...(plan.highlight ? btnPrimary : btnGhost),
                                    display: 'block',
                                    textAlign: 'center' as const,
                                    width: '100%',
                                    boxSizing: 'border-box' as const,
                                }}
                            >
                                {plan.cta}
                            </a>
                        </div>
                    ))}
                </div>
            </section>

            {/* FAQ */}
            <section style={{ padding: '40px 0 80px' }}>
                <FAQ />
            </section>

            {/* CTA Banner */}
            <section style={{ padding: '80px 24px', maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{
                    ...card(`${ACCENT}22`),
                    boxShadow: `0 0 60px ${ACCENT}14`,
                }}>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--text)', marginBottom: '12px' }}>
                        Ready to go live?
                    </h2>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '28px', lineHeight: 1.6 }}>
                        Your community deserves a real on-chain identity. Set it up in under 5 minutes.
                    </p>
                    <a href="/start" style={btnPrimary}>Launch your subdomain page →</a>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                borderTop: '1px solid rgba(255,255,255,0.05)',
                padding: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <span style={{ color: ACCENT, fontWeight: 'bold', textShadow: `0 0 8px ${ACCENT}60` }}>ENSub</span>
                <div style={{ display: 'flex', gap: '24px' }}>
                    <a href="#pricing" style={{ color: '#444', fontSize: '0.8rem', textDecoration: 'none' }}>Pricing</a>
                    <a href="/admin" style={{ color: '#444', fontSize: '0.8rem', textDecoration: 'none' }}>Admin</a>
                    <a href="/start" style={{ color: '#444', fontSize: '0.8rem', textDecoration: 'none' }}>Get started</a>
                </div>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    © {new Date().getFullYear()} ENSub · Built on
                    <img src="/images/ens-logo.svg" alt="ENS" style={{ height: '11px', verticalAlign: 'middle', display: 'inline-block', opacity: 0.7 }} />
                    +
                    <img src="/images/namestone-logo.png" alt="Namestone" style={{ height: '13px', verticalAlign: 'middle', display: 'inline-block', opacity: 0.7 }} />
                </span>
            </footer>
        </main>
    )
}
