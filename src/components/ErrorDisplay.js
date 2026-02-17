// components/ErrorDisplay.js
import React from 'react';

const ErrorDisplay = ({ error, onRetry, onDismiss }) => {
  if (!error) return null;

  const getIcon = () => {
    if (error.type === 'network') return '🌐';
    if (error.type === 'auth') return '🔒';
    if (error.type === 'validation') return '⚠️';
    if (error.type === 'database') return '🗄️';
    return '❌';
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.container}>
        <div style={styles.icon}>{getIcon()}</div>
        <h3 style={styles.title}>Oops! Something went wrong</h3>
        <p style={styles.message}>{error.userMessage || error.message}</p>
        <div style={styles.actions}>
          {onRetry && (
            <button onClick={onRetry} style={styles.retryButton}>
              Try Again
            </button>
          )}
          {onDismiss && (
            <button onClick={onDismiss} style={styles.dismissButton}>
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px'
  },
  container: {
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '30px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  icon: {
    fontSize: '3rem',
    marginBottom: '15px'
  },
  title: {
    color: '#333',
    marginBottom: '10px',
    fontSize: '1.3rem'
  },
  message: {
    color: '#666',
    marginBottom: '20px',
    fontSize: '0.95rem',
    lineHeight: '1.5'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  retryButton: {
    padding: '12px 24px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1,
    maxWidth: '150px'
  },
  dismissButton: {
    padding: '12px 24px',
    backgroundColor: '#f0f0f0',
    color: '#666',
    border: 'none',
    borderRadius: '8px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    flex: 1,
    maxWidth: '150px'
  }
};

export default ErrorDisplay;