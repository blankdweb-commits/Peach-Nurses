// utils/errorHandler.js
export const ErrorTypes = {
  NETWORK: 'network',
  AUTH: 'auth',
  VALIDATION: 'validation',
  DATABASE: 'database',
  UNKNOWN: 'unknown'
};

export const getErrorMessage = (error, context = '') => {
  console.error(`Error in ${context}:`, error);
  
  // Network errors
  if (error.message?.includes('Failed to fetch') || 
      error.message?.includes('NetworkError') ||
      error.code === 'ERR_NAME_NOT_RESOLVED') {
    return {
      type: ErrorTypes.NETWORK,
      message: 'Cannot connect to server. Please check your internet connection.',
      userMessage: 'Network connection issue. Please check your internet and try again.'
    };
  }
  
  // Supabase specific errors
  if (error.message?.includes('supabase')) {
    return {
      type: ErrorTypes.DATABASE,
      message: 'Database connection error',
      userMessage: 'Service temporarily unavailable. Please try again later.'
    };
  }
  
  // Auth errors
  if (error.message?.includes('Invalid login') || 
      error.message?.includes('Email already exists')) {
    return {
      type: ErrorTypes.AUTH,
      message: error.message,
      userMessage: error.message
    };
  }
  
  // Default
  return {
    type: ErrorTypes.UNKNOWN,
    message: error.message || 'An unknown error occurred',
    userMessage: 'Something went wrong. Please try again.'
  };
};

export const showErrorToast = (message, type = 'error') => {
  // You can implement a toast notification system here
  // For now, we'll use alert
  alert(message);
};