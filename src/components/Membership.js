// src/components/Membership.js
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { PaystackButton } from 'react-paystack';
import { PAYSTACK_CONFIG, verifyPayment } from '../services/paystackService';

const Membership = ({ onBack }) => {
  const { userProfile, upgradeToPremium, subscription } = useUser();
  const [processing, setProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('onetime'); // 'onetime' or 'subscription'
  const [paymentStatus, setPaymentStatus] = useState(null);

  const handlePaymentSuccess = async (reference) => {
    setProcessing(true);
    try {
      // Verify payment with your backend
      const verification = await verifyPayment(reference.reference);
      
      if (verification.status === 'success') {
        // Update user to premium
        await upgradeToPremium({
          plan: 'premium',
          paymentMethod: paymentMethod,
          reference: reference.reference,
          amount: verification.amount,
          expiresAt: paymentMethod === 'subscription' 
            ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            : null
        });
        
        setPaymentStatus('success');
      } else {
        setPaymentStatus('failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
    } finally {
      setProcessing(false);
    }
  };

  const handlePaymentClose = () => {
    console.log('Payment dialog closed');
    setPaymentStatus(null);
  };

  // Paystack configuration for one-time payment
  const componentProps = {
    email: userProfile?.email || 'user@example.com',
    amount: PAYSTACK_CONFIG.plans.premium.amount * 100, // Convert to kobo
    currency: PAYSTACK_CONFIG.currency,
    publicKey: PAYSTACK_CONFIG.publicKey,
    text: processing ? 'Processing...' : 'Pay ₦2,500',
    onSuccess: handlePaymentSuccess,
    onClose: handlePaymentClose,
    metadata: {
      userId: userProfile?.id,
      plan: 'premium',
      paymentType: paymentMethod
    }
  };

  // For subscription (if you have a plan code)
  const subscriptionProps = {
    ...componentProps,
    plan: PAYSTACK_CONFIG.plans.premium.planCode,
    text: processing ? 'Processing...' : 'Subscribe ₦2,500/month'
  };

  if (subscription?.isPremium || paymentStatus === 'success') {
    return (
      <div style={styles.successContainer}>
        <div style={styles.successIcon}>👑</div>
        <h1 style={styles.successTitle}>Welcome to Peach Premium!</h1>
        <p style={styles.successText}>
          You now have unlimited access to ripen matches and exclusive features.
        </p>
        <div style={styles.benefitsList}>
          <div style={styles.benefitItem}>✓ Unlimited daily ripens</div>
          <div style={styles.benefitItem}>✓ See who likes you</div>
          <div style={styles.benefitItem}>✓ No ads in feed</div>
          <div style={styles.benefitItem}>✓ Priority support</div>
        </div>
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
        <h2 style={styles.headerTitle}>Membership Plans</h2>
      </header>

      {paymentStatus === 'failed' && (
        <div style={styles.errorMessage}>
          Payment failed. Please try again.
        </div>
      )}

      <div style={styles.plansContainer}>
        {/* Free Plan */}
        <div style={styles.freePlan}>
          <h3 style={styles.planTitle}>Free Plan</h3>
          <p style={styles.price}>₦0 <span style={styles.monthly}>/ month</span></p>
          <ul style={styles.featuresList}>
            <li style={styles.featureItem}>✅ Match with anyone</li>
            <li style={styles.featureItem}>⚠️ <strong>25 Unripes / Day</strong> limit</li>
            <li style={styles.featureItem}>❌ Ads in feed</li>
          </ul>
          <button disabled style={styles.currentPlanButton}>
            Current Plan
          </button>
        </div>

        {/* Premium Plan */}
        <div style={styles.premiumPlan}>
          <div style={styles.bestValueBadge}>BEST VALUE</div>
          <h3 style={styles.planTitle}>Peach Premium 👑</h3>
          <p style={styles.price}>₦2,500 <span style={styles.monthly}>/ month</span></p>
          <ul style={styles.featuresList}>
            <li style={styles.featureItem}>✅ <strong>Unlimited Unripes</strong></li>
            <li style={styles.featureItem}>✅ See who likes you</li>
            <li style={styles.featureItem}>✅ No Ads in feed</li>
            <li style={styles.featureItem}>✅ Priority support</li>
          </ul>

          {/* Payment Method Toggle */}
          <div style={styles.paymentToggle}>
            <button
              style={{
                ...styles.toggleButton,
                ...(paymentMethod === 'onetime' ? styles.toggleActive : {})
              }}
              onClick={() => setPaymentMethod('onetime')}
            >
              One-time
            </button>
            <button
              style={{
                ...styles.toggleButton,
                ...(paymentMethod === 'subscription' ? styles.toggleActive : {})
              }}
              onClick={() => setPaymentMethod('subscription')}
            >
              Monthly
            </button>
          </div>

          {/* Paystack Button */}
          <PaystackButton
            {...(paymentMethod === 'subscription' && PAYSTACK_CONFIG.plans.premium.planCode 
              ? subscriptionProps 
              : componentProps)}
            style={styles.upgradeButton}
          />

          <p style={styles.paymentNote}>
            Secure payment via Paystack. Cancel anytime.
          </p>
        </div>
      </div>

      {/* Features Comparison */}
      <div style={styles.comparisonSection}>
        <h3 style={styles.comparisonTitle}>Why Go Premium?</h3>
        <div style={styles.comparisonGrid}>
          <div style={styles.comparisonCard}>
            <div style={styles.comparisonIcon}>🎯</div>
            <h4>More Matches</h4>
            <p>Unlimited daily ripens to find your perfect match faster</p>
          </div>
          <div style={styles.comparisonCard}>
            <div style={styles.comparisonIcon}>👁️</div>
            <h4>See Who Likes You</h4>
            <p>Know who's interested before you swipe</p>
          </div>
          <div style={styles.comparisonCard}>
            <div style={styles.comparisonIcon}>🚫</div>
            <h4>No Ads</h4>
            <p>Enjoy an uninterrupted experience</p>
          </div>
          <div style={styles.comparisonCard}>
            <div style={styles.comparisonIcon}>⚡</div>
            <h4>Priority Support</h4>
            <p>Get help faster when you need it</p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div style={styles.faqSection}>
        <h3 style={styles.faqTitle}>Frequently Asked Questions</h3>
        
        <div style={styles.faqItem}>
          <h4>How does Paystack work?</h4>
          <p>Paystack is a secure payment gateway that accepts all Nigerian cards and bank transfers. Your payment information is encrypted and never stored on our servers.</p>
        </div>

        <div style={styles.faqItem}>
          <h4>Can I cancel my subscription?</h4>
          <p>Yes, you can cancel anytime from your settings. Your premium benefits will continue until the end of your billing period.</p>
        </div>

        <div style={styles.faqItem}>
          <h4>What payment methods are accepted?</h4>
          <p>All Nigerian bank cards (Verve, Mastercard, Visa), bank transfers, and USSD codes are accepted.</p>
        </div>

        <div style={styles.faqItem}>
          <h4>Is there a free trial?</h4>
          <p>We occasionally offer free trials to new users. Check your email or app notifications for current offers.</p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    paddingBottom: '40px',
    overflowY: 'auto'
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
    marginRight: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: '1.2rem',
    margin: 0,
    color: '#333'
  },
  errorMessage: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    padding: '15px',
    margin: '20px',
    borderRadius: '10px',
    textAlign: 'center',
    border: '1px solid #FFCDD2'
  },
  plansContainer: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  freePlan: {
    border: '1px solid #ddd',
    borderRadius: '15px',
    padding: '25px',
    backgroundColor: 'white',
    marginBottom: '20px'
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
    top: '15px',
    right: '-30px',
    background: '#FFD700',
    padding: '5px 40px',
    transform: 'rotate(45deg)',
    fontWeight: 'bold',
    fontSize: '0.8rem',
    color: '#333'
  },
  planTitle: {
    fontSize: '1.3rem',
    marginBottom: '10px',
    color: '#333'
  },
  price: {
    fontSize: '2rem',
    fontWeight: 'bold',
    margin: '10px 0',
    color: '#333'
  },
  monthly: {
    fontSize: '1rem',
    fontWeight: 'normal',
    color: '#666'
  },
  featuresList: {
    listStyle: 'none',
    padding: 0,
    margin: '20px 0'
  },
  featureItem: {
    padding: '8px 0',
    fontSize: '0.95rem',
    color: '#555'
  },
  currentPlanButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    background: '#e0e0e0',
    color: '#888',
    fontSize: '1rem',
    cursor: 'not-allowed'
  },
  paymentToggle: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px'
  },
  toggleButton: {
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    background: 'white',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  toggleActive: {
    background: '#FF6347',
    color: 'white',
    borderColor: '#FF6347'
  },
  upgradeButton: {
    width: '100%',
    padding: '15px',
    borderRadius: '10px',
    border: 'none',
    background: '#FF6347',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '1rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  paymentNote: {
    fontSize: '0.8rem',
    textAlign: 'center',
    marginTop: '10px',
    color: '#666'
  },
  successContainer: {
    minHeight: '100vh',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    textAlign: 'center'
  },
  successIcon: {
    fontSize: '5rem',
    marginBottom: '20px'
  },
  successTitle: {
    fontSize: '1.8rem',
    color: '#333',
    marginBottom: '15px'
  },
  successText: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '25px',
    maxWidth: '300px'
  },
  benefitsList: {
    marginBottom: '30px',
    textAlign: 'left',
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '15px',
    boxShadow: '0 5px 15px rgba(0,0,0,0.05)'
  },
  benefitItem: {
    padding: '8px 0',
    color: '#555',
    fontSize: '0.95rem'
  },
  successButton: {
    padding: '15px 40px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  comparisonSection: {
    padding: '40px 20px',
    backgroundColor: 'white',
    marginTop: '20px'
  },
  comparisonTitle: {
    fontSize: '1.5rem',
    color: '#333',
    textAlign: 'center',
    marginBottom: '30px'
  },
  comparisonGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  comparisonCard: {
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px'
  },
  comparisonIcon: {
    fontSize: '2rem',
    marginBottom: '10px'
  },
  faqSection: {
    padding: '40px 20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  faqTitle: {
    fontSize: '1.3rem',
    color: '#333',
    marginBottom: '20px',
    textAlign: 'center'
  },
  faqItem: {
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: 'white',
    borderRadius: '10px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
  }
};

export default Membership;