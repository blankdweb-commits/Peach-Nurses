// src/services/paystackService.js

// IMPORTANT: Replace these with your actual Paystack keys from https://dashboard.paystack.com
// For production, use environment variables
export const PAYSTACK_CONFIG = {
  // For testing, use test keys. For production, use live keys
  publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY || 'pk_test_your_public_key_here', // Replace with your actual test key
  currency: 'NGN',
  plans: {
    premium: {
      amount: 2500, // ₦2,500
      planCode: process.env.REACT_APP_PAYSTACK_PLAN_CODE || '', // Leave empty for one-time payments
      name: 'Peach Premium'
    },
    yearly: {
      amount: 24000, // ₦24,000 (save 20%)
      planCode: process.env.REACT_APP_PAYSTACK_YEARLY_CODE || '',
      name: 'Peach Premium Yearly'
    }
  }
};

// Initialize transaction with your backend
export const initializeTransaction = async (email, amount, metadata = {}) => {
  try {
    // In a real app, this would call YOUR backend, which then calls Paystack
    // This prevents exposing your secret key
    const response = await fetch('/api/initialize-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, amount, metadata })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Payment initialization failed');
    }
    
    return data;
  } catch (error) {
    console.error('Payment initialization error:', error);
    throw error;
  }
};

// Verify payment with your backend
export const verifyPayment = async (reference) => {
  try {
    // Call your backend to verify the payment
    const response = await fetch(`/api/verify-payment/${reference}`);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Payment verification failed');
    }
    
    return data;
  } catch (error) {
    console.error('Payment verification error:', error);
    throw error;
  }
};

// For demo purposes only - simulate payment verification
export const simulatePaymentVerification = async (reference) => {
  console.log('Simulating payment verification for:', reference);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock successful verification
  return {
    status: 'success',
    data: {
      status: 'success',
      reference: reference,
      amount: 250000, // in kobo (₦2,500)
      customer: {
        email: 'user@example.com'
      },
      metadata: {
        plan: 'premium',
        userId: 'user_123'
      },
      paidAt: new Date().toISOString()
    }
  };
};

// Check subscription status
export const checkSubscription = async (userId) => {
  try {
    const response = await fetch(`/api/subscription/${userId}`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return {
      isSubscribed: false,
      plan: null,
      expiresAt: null
    };
  }
};

// Cancel subscription
export const cancelSubscription = async (subscriptionCode) => {
  try {
    const response = await fetch('/api/cancel-subscription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subscriptionCode })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
};