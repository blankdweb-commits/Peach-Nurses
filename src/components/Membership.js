// src/components/Membership.js
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { initializePaystackPayment, PAYSTACK_CONFIG, loadPaystackScript } from '../services/paystackService';

const Membership = ({ onBack }) => {
  const { userProfile, grantPremium, subscription } = useUser();
  const [selectedPlan, setSelectedPlan] = useState('monthly');
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  // Load Paystack script on component mount
  useEffect(() => {
    const loadPaystack = async () => {
      try {
        await loadPaystackScript();
        setPaystackLoaded(true);
        console.log('Paystack loaded successfully');
      } catch (err) {
        console.error('Failed to load Paystack:', err);
        setError('Failed to load payment system. Please refresh the page.');
      }
    };
    loadPaystack();
  }, []);

  const plans = {
    monthly: {
      name: 'Monthly Premium',
      price: 2500,
      features: [
        'Unlimited daily ripens (999/day)',
        'No advertisements',
        'See who likes you',
        'Profile badge',
        'Priority support',
        'Wingman AI Assistant'
      ]
    },
    yearly: {
      name: 'Yearly Premium',
      price: 24000,
      savings: 'Save ₦6,000',
      features: [
        'All monthly features',
        '20% savings (₦6,000 off)',
        'Exclusive yearly badge',
        'Early access to new features',
        'Premium support'
      ]
    }
  };

  const handlePayment = async () => {
    if (!userProfile?.email) {
      alert('Please log in first');
      return;
    }

    if (!PAYSTACK_CONFIG.publicKey) {
      setError('Payment system not configured. Please contact support.');
      return;
    }

    if (!paystackLoaded) {
      setError('Payment system still loading. Please try again.');
      return;
    }

    setProcessing(true);
    setPaymentStatus('processing');
    setError(null);

    const plan = plans[selectedPlan];
    const metadata = {
      plan: selectedPlan,
      userId: userProfile.id,
      userName: userProfile.name || userProfile.alias,
      userEmail: userProfile.email
    };

    await initializePaystackPayment(
      userProfile.email,
      plan.price,
      metadata,
      {
        onSuccess: async (response) => {
          console.log('Payment callback received:', response);
          setPaymentStatus('verifying');
          
          try {
            // Grant premium access
            await grantPremium(userProfile.id, selectedPlan, response.reference);
            setPaymentStatus('success');
            setProcessing(false);
          } catch (err) {
            console.error('Error granting premium:', err);
            setError('Payment successful but failed to update account. Contact support.');
            setPaymentStatus('failed');
            setProcessing(false);
          }
        },
        onClose: () => {
          console.log('Payment window closed');
          setProcessing(false);
          setPaymentStatus(null);
          setError('Payment was cancelled');
        },
        onError: (err) => {
          console.error('Payment error:', err);
          setError(err);
          setPaymentStatus('failed');
          setProcessing(false);
        }
      }
    );
  };

  // Show premium active state
  if (subscription?.isPremium || paymentStatus === 'success') {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>👑</div>
        <h1 style={styles.successTitle}>Welcome to Peach Premium!</h1>
        <p style={styles.successText}>
          You now have unlimited access to all premium features.
        </p>
        <div style={styles.benefitsList}>
          <div style={styles.benefitItem}>✓ Unlimited daily ripens (999/day)</div>
          <div style={styles.benefitItem}>✓ No ads in your feed</div>
          <div style={styles.benefitItem}>✓ See who likes you</div>
          <div style={styles.benefitItem}>✓ Wingman AI Assistant</div>
          <div style={styles.benefitItem}>✓ Priority support</div>
        </div>
        <button onClick={onBack} style={styles.successButton}>
          Start Discovering
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>←</button>
        <h2 style={styles.headerTitle}>Upgrade to Premium</h2>
      </header>

      {/* Paystack Loading State */}
      {!paystackLoaded && !error && (
        <div style={styles.loadingPaystack}>
          <div style={styles.smallSpinner}></div>
          <p>Loading payment system...</p>
        </div>
      )}

      {/* Error Message */}
      {(paymentStatus === 'failed' || error) && (
        <div style={styles.error}>
          <strong>Error:</strong> {error || 'Payment failed. Please try again.'}
        </div>
      )}

      {/* Processing State */}
      {paymentStatus === 'processing' && (
        <div style={styles.processing}>
          <div style={styles.spinner}></div>
          <p>Opening Paystack payment window...</p>
        </div>
      )}

      {paymentStatus === 'verifying' && (
        <div style={styles.processing}>
          <div style={styles.spinner}></div>
          <p>Verifying your payment...</p>
          <p style={styles.processingNote}>Please wait while we confirm your transaction</p>
        </div>
      )}

      {/* Plans */}
      <div style={styles.plansContainer}>
        {/* Free Plan */}
        <div style={styles.freePlan}>
          <h3 style={styles.planTitle}>Free Plan</h3>
          <div style={styles.price}>₦0 <span style={styles.period}>/ month</span></div>
          <ul style={styles.featureList}>
            <li style={styles.featureItem}>✓ Basic matching</li>
            <li style={styles.featureItem}>⚠️ 25 ripens per day</li>
            <li style={styles.featureItem}>❌ Ads shown in feed</li>
            <li style={styles.featureItem}>❌ See who likes you</li>
            <li style={styles.featureItem}>❌ Wingman AI</li>
          </ul>
          <button disabled style={styles.currentPlanButton}>
            Current Plan
          </button>
        </div>

        {/* Premium Plans */}
        {Object.entries(plans).map(([key, plan]) => (
          <div
            key={key}
            style={{
              ...styles.premiumPlan,
              ...(selectedPlan === key ? styles.selectedPlan : {})
            }}
            onClick={() => !processing && setSelectedPlan(key)}
          >
            {plan.savings && (
              <div style={styles.savingsBadge}>{plan.savings}</div>
            )}
            <h3 style={styles.planTitle}>
              {plan.name} 👑
            </h3>
            <div style={styles.price}>
              ₦{plan.price.toLocaleString()}
              <span style={styles.period}>/{key === 'yearly' ? 'year' : 'month'}</span>
            </div>
            <ul style={styles.featureList}>
              {plan.features.map((feature, index) => (
                <li key={index} style={styles.featureItem}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        ))}

        {/* Upgrade Button */}
        <button
          onClick={handlePayment}
          disabled={processing || !paystackLoaded}
          style={{
            ...styles.upgradeButton,
            ...((processing || !paystackLoaded) ? styles.disabledButton : {})
          }}
        >
          {!paystackLoaded ? 'Loading...' : 
           processing ? 'Processing...' : 
           `Pay ₦${plans[selectedPlan].price.toLocaleString()}`}
        </button>

        <p style={styles.note}>
          🔒 Secure payment powered by Paystack. All major cards accepted.
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    paddingBottom: '40px'
  },
  header: {
    padding: '20px',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  backButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    marginRight: '15px',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%'
  },
  headerTitle: {
    fontSize: '1.2rem',
    margin: 0,
    color: '#333'
  },
  loadingPaystack: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#e3f2fd',
    margin: '20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px'
  },
  smallSpinner: {
    width: '20px',
    height: '20px',
    border: '2px solid #f3f3f3',
    borderTop: '2px solid #FF6347',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  error: {
    backgroundColor: '#ffebee',
    color: '#c62828',
    padding: '15px',
    margin: '20px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #ffcdd2'
  },
  processing: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
    textAlign: 'center'
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #FF6347',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  processingNote: {
    color: '#666',
    fontSize: '0.9rem',
    marginTop: '10px'
  },
  plansContainer: {
    padding: '20px',
    maxWidth: '500px',
    margin: '0 auto'
  },
  freePlan: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    border: '1px solid #ddd'
  },
  premiumPlan: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '20px',
    border: '2px solid #e0e0e0',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative',
    overflow: 'hidden'
  },
  selectedPlan: {
    borderColor: '#FF6347',
    boxShadow: '0 10px 30px rgba(255,99,71,0.15)',
    transform: 'scale(1.02)'
  },
  savingsBadge: {
    position: 'absolute',
    top: '10px',
    right: '-30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '5px 40px',
    transform: 'rotate(45deg)',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  planTitle: {
    fontSize: '1.3rem',
    marginBottom: '10px',
    color: '#333'
  },
  price: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: '#FF6347',
    marginBottom: '15px'
  },
  period: {
    fontSize: '1rem',
    fontWeight: 'normal',
    color: '#666'
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '20px 0'
  },
  featureItem: {
    padding: '8px 0',
    color: '#555',
    fontSize: '0.95rem',
    borderBottom: '1px solid #f0f0f0'
  },
  currentPlanButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#e0e0e0',
    color: '#888',
    border: 'none',
    borderRadius: '6px',
    fontSize: '1rem',
    cursor: 'not-allowed'
  },
  upgradeButton: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginTop: '10px'
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  note: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.8rem',
    marginTop: '15px'
  },
  successContainer: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
  },
  successIcon: {
    fontSize: '5rem',
    marginBottom: '20px'
  },
  successTitle: {
    fontSize: '2rem',
    color: '#333',
    marginBottom: '15px'
  },
  successText: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '30px'
  },
  benefitsList: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '30px',
    textAlign: 'left',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)',
    maxWidth: '400px'
  },
  benefitItem: {
    padding: '8px 0',
    color: '#555',
    fontSize: '1rem'
  },
  successButton: {
    padding: '15px 40px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

// Add keyframes for animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);
}

export default Membership;