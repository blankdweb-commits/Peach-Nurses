// Mock Backend Service
// Simulates Supabase Database & Paystack Payment Verification

export const mockBackend = {
  // Simulate Paystack verification
  // In real app, we would call https://api.paystack.co/transaction/verify/:reference
  verifyPayment: async (reference) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Logic: if reference contains 'fail', return false. Else true.
        if (reference.includes('fail')) {
          resolve({ status: false, message: "Verification failed" });
        } else {
          resolve({ status: true, message: "Verification successful", amount: 250000 }); // Amount in kobo
        }
      }, 1500);
    });
  },

  // Simulate storing user data
  saveUser: async (userData) => {
    console.log("Saving user to Supabase:", userData);
    return { status: true, id: "user_" + Date.now() };
  }
};
