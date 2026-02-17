// components/LoadingSpinner.js
import React from 'react';

const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizes = {
    small: { spinner: '20px', text: '0.8rem' },
    medium: { spinner: '40px', text: '1rem' },
    large: { spinner: '60px', text: '1.2rem' }
  };

  return (
    <div style={styles.container}>
      <div style={{
        ...styles.spinner,
        width: sizes[size].spinner,
        height: sizes[size].spinner,
        borderWidth: size === 'small' ? '2px' : '3px'
      }} />
      {message && <p style={{ ...styles.message, fontSize: sizes[size].text }}>{message}</p>}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  spinner: {
    border: '3px solid #f3f3f3',
    borderTop: '3px solid #FF6347',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '10px'
  },
  message: {
    color: '#666',
    margin: 0,
    textAlign: 'center'
  }
};

// Add global CSS for animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default LoadingSpinner;