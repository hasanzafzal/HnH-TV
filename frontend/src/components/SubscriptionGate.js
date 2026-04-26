import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/subscription-gate.css';

/**
 * Full-page gate shown when a user tries to watch without an active subscription.
 */
export default function SubscriptionGate() {
    const navigate = useNavigate();

    return (
        <div className="sg-overlay">
            <div className="sg-card">
                {/* Icon */}
                <div className="sg-icon">🔒</div>

                <h1 className="sg-title">Subscription Required</h1>
                <p className="sg-text">
                    You need an active subscription to watch movies and series on HnH TV.
                </p>

                {/* Benefits list */}
                <ul className="sg-benefits">
                    <li>🎬 Unlimited movies &amp; series</li>
                    <li>📺 HD &amp; Ultra HD streaming</li>
                    <li>📱 Watch on any device</li>
                    <li>🔔 New releases every week</li>
                </ul>

                <div className="sg-actions">
                    <button
                        className="sg-btn sg-btn--primary"
                        onClick={() => navigate('/subscription')}
                    >
                        View Plans &amp; Subscribe
                    </button>
                    <button
                        className="sg-btn sg-btn--secondary"
                        onClick={() => navigate(-1)}
                    >
                        ← Go Back
                    </button>
                </div>

                <p className="sg-note">Already subscribed? Try logging out and back in.</p>
            </div>
        </div>
    );
}
