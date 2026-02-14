// src/hooks/usePaystack.js
import { useState } from 'react';
import { PAYSTACK_CONFIG, verifyPayment, simulatePaymentVerification } from '../services/paystackService';

export const usePaystack = () => {
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const initializePayment = async (email, amount, metadata = {}) => {
    setProcessing(true);
    setError(null);
    
    try {
      // For demo purposes, we'll simulate a successful initialization
      // In production, this would call your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate successful initialization
      return {
        authorization_url: 'https://checkout.paystack.com/demo-reference',
        access_code: 'demo_access_code',
        reference: `ref_${Date.now()}`
      };
      
      /* Uncomment for production:
      const response = await fetch('/api/initialize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, amount, metadata })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        return data.data;
      } else {
        throw new Error(data.message || 'Payment initialization failed');
      }
      */
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  const verifyTransaction = async (reference) => {
    setProcessing(true);
    setError(null);
    
    try {
      // For demo purposes, use simulated verification
      const result = await simulatePaymentVerification(reference);
      return result;
      
      /* Uncomment for production:
      const result = await verifyPayment(reference);
      return result;
      */
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setProcessing(false);
    }
  };

  return {
    processing,
    error,
    initializePayment,
    verifyTransaction,
    config: PAYSTACK_CONFIG
  };
};