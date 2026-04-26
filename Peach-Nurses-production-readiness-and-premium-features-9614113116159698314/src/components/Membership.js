import React from 'react';
import { useUser } from '../context/UserContext';
import { initializePayment, verifyPayment } from '../services/paystackService';

const Membership = ({ onBack }) => {
  const { subscription, upgradeToPremium, currentUser } = useUser();

  const handleUpgrade = async (plan) => {
    const amount = plan === 'Ultra' ? 250000 : 25000;

    // In a real app, this would use PaystackPop from window
    const paymentConfig = initializePayment({
        email: currentUser.email,
        amount,
        metadata: { userId: currentUser.id, plan }
    });

    alert(`Redirecting to Paystack for ${plan} payment (₦${amount.toLocaleString()})...`);

    // Simulate payment success for demo
    const reference = { reference: 'ref_' + Date.now() };
    const verification = await verifyPayment(reference.reference);

    if (verification.status === 'success') {
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + 1);

        await upgradeToPremium({
          plan,
          amount,
          reference: reference.reference,
          expiresAt: expiresAt.toISOString()
        });
        alert('Upgrade successful! You are now a ' + plan + ' member.');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>←</button>
        <h2 style={styles.title}>Premium</h2>
      </header>

      <div className="glass-card" style={styles.statusCard}>
        <div style={styles.statusLabel}>Current Plan</div>
        <div style={styles.planName}>{subscription.isPremium ? 'Premium' : 'Free'}</div>
      </div>

      <div style={styles.plans}>
        <div className="glass-card" style={styles.planCard}>
          <h3 style={styles.planTitle}>Premium</h3>
          <div style={styles.price}>₦25,000 <span style={styles.period}>/ month</span></div>
          <ul style={styles.features}>
            <li>Priority matching</li>
            <li>More intros weekly</li>
            <li>Deeper analysis</li>
            <li>Elite pool access</li>
          </ul>
          <button
            className="primary"
            style={styles.planBtn}
            onClick={() => handleUpgrade('Premium')}
            disabled={subscription.isPremium}
          >
            {subscription.isPremium ? 'Active' : 'Upgrade Now'}
          </button>
        </div>

        <div className="glass-card" style={{...styles.planCard, border: '1px solid var(--gold)'}}>
          <div style={styles.badge}>Best Experience</div>
          <h3 style={styles.planTitle}>Ultra Premium</h3>
          <div style={styles.price}>₦250,000 <span style={styles.period}>/ month</span></div>
          <ul style={styles.features}>
            <li>Human + AI matchmaking</li>
            <li>Direct concierge mode</li>
            <li>Verified elite network</li>
            <li>Personal relationship coach</li>
          </ul>
          <button className="secondary" style={styles.planBtn} onClick={() => handleUpgrade('Ultra')}>
            Inquire Now
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '30px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--soft-peach)',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  title: {
    margin: 0
  },
  statusCard: {
    padding: '20px',
    textAlign: 'center',
    marginBottom: '30px',
    border: '1px solid var(--glass-border)'
  },
  statusLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-dim)',
    textTransform: 'uppercase'
  },
  planName: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'var(--soft-peach)',
    marginTop: '5px'
  },
  plans: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  planCard: {
    padding: '30px',
    position: 'relative',
    border: '1px solid var(--glass-border)'
  },
  badge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    backgroundColor: 'var(--gold)',
    color: 'var(--base-bg)',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '0.7rem',
    fontWeight: 'bold'
  },
  planTitle: {
    fontSize: '1.3rem',
    marginBottom: '10px'
  },
  price: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    marginBottom: '20px'
  },
  period: {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    fontWeight: 'normal'
  },
  features: {
    margin: '0 0 30px 0',
    padding: '0 0 0 20px',
    color: 'var(--text-dim)',
    lineHeight: '2'
  },
  planBtn: {
    width: '100%'
  }
};

export default Membership;
