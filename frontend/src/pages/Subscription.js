import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PaymentGateway from '../components/PaymentGateway';
import Toast from '../components/Toast';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function Subscription() {
  const navigate = useNavigate();
  const user = getUser();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gatewayPlan, setGatewayPlan] = useState(null); // plan object to pay for
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPlans();
    fetchCurrentSubscription();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await apiClient.get('/subscription/plans');
      setPlans(res.data.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const res = await apiClient.get('/subscription');
      setCurrentPlan(res.data.data);
      setLoading(false);
    } catch (error) {
      setLoading(false);
    }
  };

  /* Opens the payment gateway instead of calling API directly */
  const handleUpgrade = (plan) => {
    setGatewayPlan(plan);
  };

  /* Called by PaymentGateway after the fake "success" screen */
  const handlePaymentSuccess = async (plan) => {
    setGatewayPlan(null);
    try {
      const res = await apiClient.post('/subscription', {
        plan: plan.name,
        billingCycle: 'monthly',
      });

      if (res.data.success) {
        // Immediately update the UI with the response data
        setCurrentPlan(res.data.data);
        setToast({
          message: `🎉 You're now subscribed to the ${plan.name.toUpperCase()} plan!`,
          type: 'success',
        });
      } else {
        setToast({
          message: res.data.message || 'Failed to update subscription. Please try again.',
          type: 'warning',
        });
      }
    } catch (err) {
      console.error('Subscription update error:', err);
      setToast({
        message: err.response?.data?.message || 'Failed to update subscription. Please try again.',
        type: 'warning',
      });
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await apiClient.delete('/subscription');
        setToast({ message: 'Subscription cancelled.', type: 'warning' });
        fetchCurrentSubscription();
      } catch (error) {
        setToast({
          message: error.response?.data?.message || 'Error cancelling subscription',
          type: 'warning',
        });
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="subscription-page">
      <Header />

      {/* Toast notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Payment Gateway modal */}
      {gatewayPlan && (
        <PaymentGateway
          plan={gatewayPlan}
          onSuccess={handlePaymentSuccess}
          onClose={() => setGatewayPlan(null)}
        />
      )}

      <div className="subscription-container">
        <h1>Subscription Plans</h1>

        {currentPlan && (
          <div className="current-plan-banner">
            <h2>Current Plan: {currentPlan.plan.toUpperCase()}</h2>
            <p>Status: {currentPlan.isActive ? 'Active' : 'Inactive'}</p>
            {currentPlan.plan !== 'free' && (
              <button className="btn btn-danger" onClick={handleCancel}>
                Cancel Subscription
              </button>
            )}
          </div>
        )}

        <div className="plans-grid">
          {plans.map((plan) => (
            <div key={plan.name} className={`plan-card ${currentPlan?.plan === plan.name ? 'active' : ''}`}>
              <h3>{plan.name}</h3>
              <div className="price">
                <span className="amount">${plan.price}</span>
                <span className="period">/month</span>
              </div>

              <ul className="features">
                {plan.features.map((feature) => (
                  <li key={feature}>✓ {feature}</li>
                ))}
              </ul>

              <div className="specs">
                <p><strong>Screens:</strong> {plan.maxScreens}</p>
                <p><strong>Max Quality:</strong> {plan.maxQuality}</p>
              </div>

              {currentPlan?.plan !== plan.name && (
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpgrade(plan)}
                >
                  {currentPlan?.plan === 'free' ? 'Upgrade' : 'Change Plan'}
                </button>
              )}
              {currentPlan?.plan === plan.name && (
                <button className="btn" disabled>
                  Current Plan
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Subscription;
