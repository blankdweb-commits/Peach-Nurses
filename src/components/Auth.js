// components/Auth.js
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export const Login = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginUser } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Basic validation
      if (!email || !password) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      // Simulate network delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      const success = loginUser(email, password);
      
      if (success) {
        onLoginSuccess();
      } else {
        setError('Invalid email or password. Try test@peach.com / password');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🍑</div>
          <h1 style={styles.title}>Welcome to Peach</h1>
          <p style={styles.subtitle}>Sign in to continue finding your perfect match</p>
        </div>

        <form onSubmit={handleLogin} style={styles.form}>
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.loginButton,
              ...(loading ? styles.disabledButton : {})
            }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.demoCredentials}>
          <p style={styles.demoText}>Demo credentials:</p>
          <p style={styles.demoCredentialsText}>test@peach.com / password</p>
        </div>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            New to Peach?{' '}
            <button 
              onClick={onSwitchToSignup} 
              style={styles.linkButton}
              disabled={loading}
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signupUser } = useUser();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validation
      if (!email || !password || !confirmPassword) {
        setError('Please fill in all fields');
        setLoading(false);
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      if (!email.includes('@') || !email.includes('.')) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 500));

      const success = signupUser(email, password);
      
      if (success) {
        onSignupSuccess();
      } else {
        setError('Email already exists. Please use a different email or try logging in.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logo}>🍑</div>
          <h1 style={styles.title}>Join Peach</h1>
          <p style={styles.subtitle}>Create an account to start your journey</p>
        </div>

        <form onSubmit={handleSignup} style={styles.form}>
          {error && (
            <div style={styles.errorMessage}>
              {error}
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              placeholder="Create a password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Confirm Password</label>
            <input
              type="password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              style={styles.input}
              disabled={loading}
              required
            />
          </div>

          <button 
            type="submit" 
            style={{
              ...styles.signupButton,
              ...(loading ? styles.disabledButton : {})
            }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.footerText}>
            Already have an account?{' '}
            <button 
              onClick={onSwitchToLogin} 
              style={styles.linkButton}
              disabled={loading}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa'
  },
  card: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '40px 30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
  },
  header: {
    textAlign: 'center',
    marginBottom: '30px'
  },
  logo: {
    fontSize: '4rem',
    marginBottom: '10px'
  },
  title: {
    fontSize: '1.8rem',
    color: '#333',
    marginBottom: '10px',
    fontWeight: '600'
  },
  subtitle: {
    color: '#666',
    fontSize: '1rem'
  },
  form: {
    marginBottom: '20px'
  },
  inputGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '0.95rem'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s'
  },
  loginButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  signupButton: {
    width: '100%',
    padding: '14px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  disabledButton: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  errorMessage: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    padding: '12px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '0.95rem',
    textAlign: 'center',
    border: '1px solid #FFCDD2'
  },
  demoCredentials: {
    textAlign: 'center',
    marginBottom: '20px',
    padding: '15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  demoText: {
    color: '#666',
    fontSize: '0.9rem',
    marginBottom: '5px'
  },
  demoCredentialsText: {
    color: '#333',
    fontSize: '0.9rem',
    fontWeight: '600'
  },
  footer: {
    textAlign: 'center',
    borderTop: '1px solid #f0f0f0',
    paddingTop: '20px'
  },
  footerText: {
    color: '#666',
    fontSize: '0.95rem'
  },
  linkButton: {
    background: 'none',
    border: 'none',
    color: '#FF6347',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.95rem',
    textDecoration: 'underline'
  }
};