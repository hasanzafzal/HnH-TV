import React, { useState } from 'react';
import '../styles/payment.css';

/* ── Card network definitions ─────────────────────────────── */
const CARD_NETWORKS = [
    {
        id: 'visa',
        name: 'Visa',
        logo: (
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="card-logo-svg">
                <rect width="48" height="32" rx="4" fill="#1A1F71" />
                <text x="7" y="22" fontFamily="'Times New Roman',serif" fontSize="16" fontWeight="bold" fill="white" fontStyle="italic">VISA</text>
            </svg>
        ),
        color: '#1A1F71',
        prefix: /^4/,
    },
    {
        id: 'mastercard',
        name: 'Mastercard',
        logo: (
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="card-logo-svg">
                <rect width="48" height="32" rx="4" fill="#252525" />
                <circle cx="18" cy="16" r="9" fill="#EB001B" />
                <circle cx="30" cy="16" r="9" fill="#F79E1B" />
                <path d="M24 9.13A9 9 0 0 1 30 16a9 9 0 0 1-6 6.87A9 9 0 0 1 18 16a9 9 0 0 1 6-6.87z" fill="#FF5F00" />
            </svg>
        ),
        color: '#252525',
        prefix: /^5[1-5]/,
    },
    {
        id: 'paypak',
        name: 'PayPak',
        logo: (
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="card-logo-svg">
                <rect width="48" height="32" rx="4" fill="#006B3F" />
                <rect x="4" y="12" width="40" height="8" rx="2" fill="#fff" opacity="0.15" />
                <text x="5" y="22" fontFamily="Arial,sans-serif" fontSize="11" fontWeight="bold" fill="white">PayPak</text>
                <circle cx="40" cy="16" r="5" fill="#FFD700" opacity="0.9" />
            </svg>
        ),
        color: '#006B3F',
        prefix: /^9/,
    },
    {
        id: 'unionpay',
        name: 'UnionPay',
        logo: (
            <svg viewBox="0 0 48 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="card-logo-svg">
                <rect width="48" height="32" rx="4" fill="#C0392B" />
                <rect x="14" y="0" width="34" height="32" rx="4" fill="#2471A3" />
                <rect x="22" y="0" width="26" height="32" rx="0" fill="#E8E8E8" />
                <text x="14" y="22" fontFamily="Arial,sans-serif" fontSize="8" fontWeight="bold" fill="#C0392B">UP</text>
            </svg>
        ),
        color: '#C0392B',
        prefix: /^62/,
    },
];

/* ── Helpers ─────────────────────────────────────────────── */
const formatCardNumber = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

const formatExpiry = (val) => {
    const clean = val.replace(/\D/g, '').slice(0, 4);
    return clean.length >= 3 ? clean.slice(0, 2) + '/' + clean.slice(2) : clean;
};

const detectNetwork = (number) => {
    const clean = number.replace(/\s/g, '');
    return CARD_NETWORKS.find((n) => n.prefix.test(clean)) || null;
};

/* ── Component ──────────────────────────────────────────── */
export default function PaymentGateway({ plan, onSuccess, onClose }) {
    const [selectedNetwork, setSelectedNetwork] = useState(null);
    const [step, setStep] = useState('network'); // 'network' | 'details' | 'processing' | 'done'

    const [cardNumber, setCardNumber] = useState('');
    const [cardHolder, setCardHolder] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvv, setCvv] = useState('');
    const [errors, setErrors] = useState({});

    /* ---- Validation ---- */
    const validate = () => {
        const e = {};
        const digits = cardNumber.replace(/\s/g, '');
        if (digits.length !== 16) e.cardNumber = 'Card number must be exactly 16 digits.';
        if (!cardHolder.trim()) e.cardHolder = 'Cardholder name is required.';
        if (!/^\d{2}\/\d{2}$/.test(expiry)) e.expiry = 'Enter expiry as MM/YY.';
        if (!/^\d{3,4}$/.test(cvv)) e.cvv = 'CVV must be 3 or 4 digits.';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    /* ---- Submit ---- */
    const handlePay = (e) => {
        e.preventDefault();
        if (!validate()) return;

        setStep('processing');
        setTimeout(() => {
            setStep('done');
            setTimeout(() => {
                onSuccess(plan);
            }, 2000);
        }, 2000);
    };

    /* ---- Auto-detect network as user types ---- */
    const handleCardNumberChange = (e) => {
        const formatted = formatCardNumber(e.target.value);
        setCardNumber(formatted);
        const net = detectNetwork(formatted);
        if (net) setSelectedNetwork(net);
    };

    /* ── Render: choose card network ── */
    if (step === 'network') {
        return (
            <div className="pg-overlay" onClick={onClose}>
                <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
                    <button className="pg-close" onClick={onClose}>✕</button>

                    <div className="pg-header">
                        <div className="pg-lock">🔒</div>
                        <h2>Secure Payment</h2>
                        <p className="pg-plan-label">Plan: <strong>{plan?.name?.toUpperCase()}</strong> — ${plan?.price}/mo</p>
                    </div>

                    <p className="pg-subtitle">Select your card network</p>

                    <div className="pg-networks">
                        {CARD_NETWORKS.map((net) => (
                            <button
                                key={net.id}
                                className={`pg-network-btn ${selectedNetwork?.id === net.id ? 'pg-network-btn--active' : ''}`}
                                style={{ '--net-color': net.color }}
                                onClick={() => { setSelectedNetwork(net); setStep('details'); }}
                            >
                                {net.logo}
                                <span>{net.name}</span>
                            </button>
                        ))}
                    </div>

                    <p className="pg-secured-text">🛡️ 256-bit SSL encrypted · Mock gateway · No real transaction</p>
                </div>
            </div>
        );
    }

    /* ── Render: processing spinner ── */
    if (step === 'processing') {
        return (
            <div className="pg-overlay">
                <div className="pg-modal pg-modal--center">
                    <div className="pg-spinner"></div>
                    <p className="pg-processing-text">Processing payment…</p>
                </div>
            </div>
        );
    }

    /* ── Render: success ── */
    if (step === 'done') {
        return (
            <div className="pg-overlay">
                <div className="pg-modal pg-modal--center">
                    <div className="pg-success-icon">✅</div>
                    <h2 className="pg-success-title">Payment Successful!</h2>
                    <p className="pg-success-sub">You are now subscribed to the <strong>{plan?.name?.toUpperCase()}</strong> plan.</p>
                </div>
            </div>
        );
    }

    /* ── Render: card details form ── */
    return (
        <div className="pg-overlay" onClick={onClose}>
            <div className="pg-modal" onClick={(e) => e.stopPropagation()}>
                <button className="pg-close" onClick={onClose}>✕</button>

                <div className="pg-header">
                    <div className="pg-lock">🔒</div>
                    <h2>Card Details</h2>
                    <p className="pg-plan-label">Plan: <strong>{plan?.name?.toUpperCase()}</strong> — ${plan?.price}/mo</p>
                </div>

                {/* Active network badge */}
                <div className="pg-active-network">
                    {selectedNetwork?.logo}
                    <span>{selectedNetwork?.name}</span>
                    <button className="pg-change-btn" onClick={() => setStep('network')}>Change</button>
                </div>

                {/* Visual card preview */}
                <div className="pg-card-preview" style={{ background: `linear-gradient(135deg, ${selectedNetwork?.color || '#333'} 0%, #1a1a2e 100%)` }}>
                    <div className="pg-card-chip">
                        <svg viewBox="0 0 32 24" fill="none"><rect x="1" y="1" width="30" height="22" rx="3" fill="#d4a843" stroke="#b8922a" /><rect x="11" y="1" width="10" height="22" fill="#c4972f" opacity="0.4" /><rect x="1" y="8" width="30" height="8" fill="#c4972f" opacity="0.4" /></svg>
                    </div>
                    <p className="pg-card-number-preview">{cardNumber || '•••• •••• •••• ••••'}</p>
                    <div className="pg-card-meta">
                        <span>{cardHolder || 'CARDHOLDER NAME'}</span>
                        <span>{expiry || 'MM/YY'}</span>
                    </div>
                    <div className="pg-card-network-logo">{selectedNetwork?.logo}</div>
                </div>

                <form className="pg-form" onSubmit={handlePay} noValidate>
                    {/* Card Number */}
                    <div className="pg-field">
                        <label>Card Number</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            placeholder="1234 5678 9012 3456"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                        />
                        {errors.cardNumber && <span className="pg-error">{errors.cardNumber}</span>}
                        <span className="pg-hint">Must be exactly 16 digits</span>
                    </div>

                    {/* Cardholder */}
                    <div className="pg-field">
                        <label>Cardholder Name</label>
                        <input
                            type="text"
                            placeholder="Name as on card"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        />
                        {errors.cardHolder && <span className="pg-error">{errors.cardHolder}</span>}
                    </div>

                    {/* Expiry + CVV side by side */}
                    <div className="pg-row">
                        <div className="pg-field">
                            <label>Expiry (MM/YY)</label>
                            <input
                                type="text"
                                inputMode="numeric"
                                placeholder="09/27"
                                value={expiry}
                                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                maxLength={5}
                            />
                            {errors.expiry && <span className="pg-error">{errors.expiry}</span>}
                        </div>
                        <div className="pg-field">
                            <label>CVV</label>
                            <input
                                type="password"
                                inputMode="numeric"
                                placeholder="•••"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                maxLength={4}
                            />
                            {errors.cvv && <span className="pg-error">{errors.cvv}</span>}
                        </div>
                    </div>

                    <button type="submit" className="pg-pay-btn">
                        Pay ${plan?.price} · Subscribe Now
                    </button>
                </form>

                <p className="pg-secured-text">🛡️ 256-bit SSL encrypted · Mock gateway · No real transaction</p>
            </div>
        </div>
    );
}
