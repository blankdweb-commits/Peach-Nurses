// src/services/paystackService.js

// Paystack configuration
export const PAYSTACK_CONFIG = {
  // Get key from environment variable
  publicKey: process.env.REACT_APP_PAYSTACK_PUBLIC_KEY,
  currency: 'NGN',
  plans: {
    monthly: {
      amount: 2500,
      name: 'Monthly Premium',
      durationDays: 30
    },
    yearly: {
      amount: 24000,
      name: 'Yearly Premium',
      durationDays: 365,
      savings: 'Save 20%'
    }
  }
};

// Check if Paystack is properly configured
export const isPaystackConfigured = () => {
  return PAYSTACK_CONFIG.publicKey && 
         !PAYSTACK_CONFIG.publicKey.includes('your_public_key') &&
         PAYSTACK_CONFIG.publicKey.startsWith('pk_');
};

// Load Paystack script
export const loadPaystackScript = () => {
  return new Promise((resolve, reject) => {
    // If already loaded
    if (window.PaystackPop) {
      resolve();
      return;
    }

    // Check if script is already in document
    const existingScript = document.querySelector('script[src="https://js.paystack.co/v1/inline.js"]');
    if (existingScript) {
      existingScript.addEventListener('load', resolve);
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create new script
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
};

// Initialize Paystack payment
export const initializePaystackPayment = (email, amount, metadata, callbacks) => {
  // Check if Paystack is loaded
  if (!window.PaystackPop) {
    callbacks.onError?.('Paystack failed to load. Please refresh the page.');
    return;
  }

  // Check if configured
  if (!isPaystackConfigured()) {
    // Use simulation mode
    simulatePayment(email, amount, metadata, callbacks);
    return;
  }

  try {
    const amountInKobo = amount * 100;
    const reference = `PEACH_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_CONFIG.publicKey,
      email: email,
      amount: amountInKobo,
      currency: PAYSTACK_CONFIG.currency,
      ref: reference,
      metadata: {
        ...metadata,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: metadata.plan || 'monthly'
          },
          {
            display_name: "User ID",
            variable_name: "user_id",
            value: metadata.userId || ''
          }
        ]
      },
      callback: (response) => {
        console.log('Payment successful:', response);
        callbacks.onSuccess?.(response);
      },
      onClose: () => {
        console.log('Payment window closed');
        callbacks.onClose?.();
      }
    });

    handler.openIframe();
  } catch (error) {
    console.error('Payment initialization error:', error);
    callbacks.onError?.(error.message);
  }
};

// Simulation mode for testing without Paystack
export const simulatePayment = async (email, amount, metadata, callbacks) => {
  console.log('🔧 SIMULATION MODE: Processing payment simulation');
  console.log('Email:', email);
  console.log('Amount:', amount);
  console.log('Metadata:', metadata);

  // Simulate processing delay
  setTimeout(() => {
    // Simulate successful payment (90% success rate)
    const isSuccess = Math.random() > 0.1;
    
    if (isSuccess) {
      const response = {
        reference: `SIM_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'success',
        amount: amount * 100,
        transaction: 'simulated'
      };
      console.log('✅ Simulation: Payment successful', response);
      callbacks.onSuccess?.(response);
    } else {
      console.log('❌ Simulation: Payment failed');
      callbacks.onError?.('Payment simulation failed');
    }
  }, 2000);
};

// Verify payment (simulation)
export const verifyPayment = async (reference) => {
  console.log('Verifying payment:', reference);
  
  // Simulate verification delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    status: 'success',
    data: {
      status: 'success',
      reference: reference,
      amount: 250000,
      customer: { email: 'user@example.com' },
      paidAt: new Date().toISOString()
    }
  };
};