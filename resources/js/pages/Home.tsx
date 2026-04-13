import { useState } from 'react'

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
    background: 'rgba(22,33,62,0.5)',
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
        a: 'Namestone is a gasless ENS offchain resolver. ENSub uses their API to issue subdomains instantly without any on-chain transaction costs.',
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
        a: 'Yes. It is stored encrypted and never exposed through the public claim API.',
    },
]

function FAQ() {
    const [open, setOpen] = useState<number | null>(null)

    return (
        <section style={{ maxWidth: '680px', margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '40px' }}>
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
                            <p style={{ marginTop: '12px', color: '#888', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 0 }}>
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
    return (
        <main style={{ minHeight: '100vh', overflowX: 'hidden' }}>

            {/* Nav */}
            <nav style={{
                position: 'sticky', top: 0, zIndex: 50,
                borderBottom: '1px solid rgba(255,255,255,0.05)',
                background: 'rgba(10,12,20,0.85)',
                backdropFilter: 'blur(12px)',
                padding: '0 32px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                height: '60px',
            }}>
                <span style={{ fontSize: '1.15rem', fontWeight: 'bold', color: ACCENT, textShadow: `0 0 12px ${ACCENT}80` }}>
                    ENSub
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <a href="#pricing" style={{ color: '#888', fontSize: '0.875rem', textDecoration: 'none' }}>Pricing</a>
                    <a href="#how" style={{ color: '#888', fontSize: '0.875rem', textDecoration: 'none' }}>How it works</a>
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
                        color: '#e4e4e4',
                        lineHeight: 1.1,
                        marginBottom: '24px',
                    }}>
                        Give your community a{' '}
                        <span style={{ color: ACCENT, textShadow: `0 0 30px ${ACCENT}60` }}>
                            *.yourname.eth
                        </span>{' '}
                        identity
                    </h1>

                    <p style={{ fontSize: '1.1rem', color: '#888', maxWidth: '560px', margin: '0 auto 40px', lineHeight: 1.7 }}>
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
                <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '56px' }}>
                    Up and running in 3 steps
                </h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px' }}>
                    {[
                        {
                            num: '01',
                            title: 'Verify ownership',
                            desc: 'Connect your wallet. We check on-chain that you own the ENS domain — no trust required.',
                        },
                        {
                            num: '02',
                            title: 'Configure & brand',
                            desc: 'Choose eligibility rules (open, NFT-gated, token-gated), set your accent colour and logo.',
                        },
                        {
                            num: '03',
                            title: 'Share the link',
                            desc: 'Your claim page is instantly live at ensub.org/claim/yourname. Share it and watch subdomains get claimed.',
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
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '10px' }}>
                                {step.title}
                            </h3>
                            <p style={{ color: '#888', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
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
                        { icon: '⛓', title: 'On-chain verified', desc: 'ENS ownership checked via mainnet registry — no third party.' },
                        { icon: '⚡', title: 'Gasless for claimants', desc: 'Powered by Namestone offchain resolution. Zero gas fees.' },
                        { icon: '🔒', title: 'Flexible gating', desc: 'Open, NFT-gated, ERC-20 token, or custom allowlist.' },
                        { icon: '🎨', title: 'Fully branded', desc: 'Your logo, accent colour, and domain — your page.' },
                    ].map(f => (
                        <div key={f.title} style={{ ...card(), padding: '24px' }}>
                            <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>{f.icon}</div>
                            <h4 style={{ color: '#ccc', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '6px' }}>{f.title}</h4>
                            <p style={{ color: '#555', fontSize: '0.8rem', lineHeight: 1.5, margin: 0 }}>{f.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" style={{ padding: '80px 24px', maxWidth: '1100px', margin: '0 auto' }}>
                <h2 style={{ textAlign: 'center', fontSize: '1.8rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '12px' }}>
                    Simple, transparent pricing
                </h2>
                <p style={{ textAlign: 'center', color: '#888', fontSize: '0.9rem', marginBottom: '48px' }}>
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
                                        color: plan.highlight ? ACCENT : '#e4e4e4',
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
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#e4e4e4', marginBottom: '12px' }}>
                        Ready to go live?
                    </h2>
                    <p style={{ color: '#888', marginBottom: '28px', lineHeight: 1.6 }}>
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
                <span style={{ color: '#2a2a2a', fontSize: '0.75rem' }}>
                    © {new Date().getFullYear()} ENSub · Built on ENS + Namestone
                </span>
            </footer>
        </main>
    )
}
