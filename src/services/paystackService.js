// src/services/paystackService.js
export const PAYSTACK_CONFIG = {
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

export const initializePaystackPayment = async (email, amount, metadata, callbacks) => {
  try {
    // Ensure Paystack is loaded
    await loadPaystackScript();

    if (!window.PaystackPop) {
      throw new Error('Paystack failed to load. Please refresh the page.');
    }

    if (amount < 100) {
      throw new Error('Minimum amount is ₦100');
    }

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
    return { success: true, reference };
  } catch (error) {
    console.error('Payment initialization error:', error);
    callbacks.onError?.(error.message);
    return { success: false, error: error.message };
  }
};