import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages.css';
import apiClient from '../utils/api';
import { getUser } from '../utils/storage';

function Subscription() {
  const navigate = useNavigate();
  const user = getUser();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPlans();
    fetchCurrentSubscription();
  }, [user, navigate]);

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

  const handleUpgrade = async (planName) => {
    try {
      await apiClient.post('/subscription', {
        plan: planName,
        billingCycle: 'monthly',
      });
      alert('Subscription updated successfully!');
      fetchCurrentSubscription();
    } catch (error) {
      alert(error.response?.data?.message || 'Error updating subscription');
    }
  };

  const handleCancel = async () => {
    if (window.confirm('Are you sure you want to cancel your subscription?')) {
      try {
        await apiClient.delete('/subscription');
        alert('Subscription cancelled');
        fetchCurrentSubscription();
      } catch (error) {
        alert(error.response?.data?.message || 'Error cancelling subscription');
      }
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="subscription-page">
      <Header />

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
                  onClick={() => handleUpgrade(plan.name)}
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
