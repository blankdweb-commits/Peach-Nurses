// src/services/paystackService.js

// Paystack configuration
export const PAYSTACK_CONFIG = {
  publicKey: 'pk_test_xxxxxxxxxxxxxxxxxxxxx', // Replace with your Paystack public key
  currency: 'NGN',
  plans: {
    premium: {
      amount: 2500, // ₦2,500
      planCode: 'PLN_xxxxxxxxxxxxx' // Optional: for subscription plans
    }
  }
};

// Initialize payment
export const initializePayment = ({ email, amount, metadata = {} }) => {
  return {
    key: PAYSTACK_CONFIG.publicKey,
    email,
    amount: amount * 100, // Convert to kobo
    currency: PAYSTACK_CONFIG.currency,
    metadata: {
      ...metadata,
      custom_fields: [
        {
          display_name: "User ID",
          variable_name: "user_id",
          value: metadata.userId || ''
        }
      ]
    },
    onSuccess: (reference) => {
      console.log('Payment successful:', reference);
      return reference;
    },
    onClose: () => {
      console.log('Payment dialog closed');
    }
  };
};

// Verify payment (backend implementation)
export const verifyPayment = async (reference) => {
  // This should be implemented on your backend
  // For demo purposes, we'll simulate verification
  try {
    // Simulate API call to your backend
    const response = await new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          data: {
            status: 'success',
            reference: reference,
            amount: 2500,
            plan: 'premium'
          }
        });
      }, 1000);
    });
    
    return response.data;
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};

// Initialize subscription
export const initializeSubscription = ({ email, planCode, metadata = {} }) => {
  return {
    key: PAYSTACK_CONFIG.publicKey,
    email,
    plan: planCode,
    metadata: {
      ...metadata,
      subscription_type: 'premium'
    },
    onSuccess: (reference) => {
      console.log('Subscription successful:', reference);
      return reference;
    },
    onClose: () => {
      console.log('Subscription dialog closed');
    }
  };
};