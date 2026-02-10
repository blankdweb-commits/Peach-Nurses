import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
// Remove unused import
// import { mockBackend } from '../services/mockBackend';

const Membership = ({ onBack }) => {
  const { processUpgrade, subscription } = useUser();
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handlePaystackPayment = async () => {
    setProcessing(true);

    setTimeout(async () => {
      const fakeReference = "ref_" + Math.random().toString(36).substr(2, 9);
      const verified = await processUpgrade(fakeReference);

      setProcessing(false);
      if (verified) {
        setSuccess(true);
      } else {
        alert("Payment Verification Failed");
      }
    }, 2000);
  };

  if (success || subscription.isPremium) {
    return (
      <div style={styles.successContainer}>
        <h2 style={styles.successIcon}>👑</h2>
        <h1>Welcome to Peach Premium!</h1>
        <p>You now have unlimited access to ripen matches.</p>
        <button
          onClick={onBack}
          style={styles.successButton}
        >
          Start Discovering
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>←</button>
        <h2>Membership Plans</h2>
      </header>

      <div style={styles.plansContainer}>
        <div style={styles.freePlan}>
          <h3>Free Plan</h3>
          <p style={styles.price}>₦0 <span style={styles.monthly}>/ month</span></p>
          <ul style={styles.featuresList}>
            <li>✅ Match with anyone</li>
            <li>⚠️ <strong>25 Unripes / Day</strong> limit</li>
            <li>❌ Ads in feed</li>
          </ul>
          <button disabled style={styles.currentPlanButton}>
            Current Plan
          </button>
        </div>

        <div style={styles.premiumPlan}>
          <div style={styles.bestValueBadge}>BEST VALUE</div>
          <h3>Peach Premium 👑</h3>
          <p style={styles.price}>₦2,500 <span style={styles.monthly}>/ month</span></p>
          <ul style={styles.featuresList}>
            <li>✅ <strong>Unlimited Unripes</strong></li>
            <li>✅ See who likes you</li>
            <li>🚫 No Ads</li>
          </ul>

          <button
            onClick={handlePaystackPayment}
            disabled={processing}
            style={{
              ...styles.upgradeButton,
              opacity: processing ? 0.7 : 1
            }}
          >
            {processing ? 'Processing Paystack...' : 'Upgrade with Paystack'}
          </button>
          <p style={styles.paymentNote}>
            Secure payment via Paystack. Backend managed by Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'sans-serif'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '30px'
  },
  backButton: {
    marginRight: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  plansContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  freePlan: {
    border: '1px solid #ddd',
    borderRadius: '15px',
    padding: '25px',
    backgroundColor: '#f9f9f9'
  },
  premiumPlan: {
    border: '2px solid #FFD700',
    borderRadius: '15px',
    padding: '25px',
    backgroundColor: '#FFF8DC',
    position: 'relative',
    overflow: 'hidden'
  },
  bestValueBadge: {
    position: 'absolute',
    top: '10px',
    right: '-30px',
    background: '#FFD700',
    padding: '5px 40px',
    transform: 'rotate(45deg)',
    fontWeight: 'bold'
  },
  price: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '10px 0'
  },
  monthly: {
    fontSize: '1rem',
    fontWeight: 'normal'
  },
  featuresList: {
    listStyle: 'none',
    padding: 0
  },
  currentPlanButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    background: '#e0e0e0',
    color: '#888'
  },
  upgradeButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: 'none',
    background: '#FF6347',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer'
  },
  paymentNote: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginTop: '10px',
    color: '#666'
  },
  successContainer: {
    padding: '40px',
    textAlign: 'center',
    fontFamily: 'sans-serif'
  },
  successIcon: {
    fontSize: '3rem'
  },
  successButton: {
    marginTop: '20px',
    padding: '15px 30px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '1rem',
    cursor: 'pointer'
  }
};

export default Membership;