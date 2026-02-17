// components/Auth.js
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import LoadingSpinner from './LoadingSpinner';
import ErrorDisplay from './ErrorDisplay';
import { getErrorMessage, showErrorToast } from '../utils/errorHandler';

export const Login = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const { loginUser, signInWithGoogle, error: contextError } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password) {
        throw new Error('Please fill in all fields');
      }

      const success = await loginUser(email, password);
      
      if (success) {
        onLoginSuccess();
      } else {
        throw new Error(contextError || 'Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      const errorInfo = getErrorMessage(err, 'login');
      setError(errorInfo);
      showErrorToast(errorInfo.userMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // No need to call onLoginSuccess - the auth state change will handle it
    } catch (err) {
      console.error('Google sign-in error:', err);
      const errorInfo = getErrorMessage(err, 'google-login');
      setError(errorInfo);
      showErrorToast(errorInfo.userMessage);
      setGoogleLoading(false);
    }
  };

  if (loading || googleLoading) {
    return <LoadingSpinner message={googleLoading ? "Connecting to Google..." : "Signing in..."} />;
  }

  return (
    <>
      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>🍑</div>
            <h1 style={styles.title}>Welcome to Peach</h1>
            <p style={styles.subtitle}>Sign in to continue finding your perfect match</p>
          </div>

          {/* Google Sign-In Button */}
          <button
            onClick={handleGoogleSignIn}
            style={styles.googleButton}
            disabled={googleLoading}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google logo"
              style={styles.googleIcon}
            />
            Continue with Google
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <form onSubmit={handleLogin} style={styles.form}>
            {error && (
              <div style={styles.errorMessage}>
                {error.userMessage}
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
                autoComplete="email"
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
                autoComplete="current-password"
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
                type="button"
              >
                Create Account
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState(null);
  const { signupUser, signInWithGoogle, error: contextError } = useUser();

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!email || !password || !confirmPassword) {
        throw new Error('Please fill in all fields');
      }

      if (password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      if (password.length < 6) {
        throw new Error('Password must be at least 6 characters');
      }

      const result = await signupUser(email, password);
      
      if (result.success) {
        onSignupSuccess();
      } else {
        throw new Error(result.error || 'Signup failed');
      }
    } catch (err) {
      console.error('Signup error:', err);
      const errorInfo = getErrorMessage(err, 'signup');
      setError(errorInfo);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError(null);
    
    try {
      const { error } = await signInWithGoogle();
      if (error) throw error;
      // Auth state change will handle navigation
    } catch (err) {
      console.error('Google sign-in error:', err);
      const errorInfo = getErrorMessage(err, 'google-signup');
      setError(errorInfo);
      setGoogleLoading(false);
    }
  };

  if (loading || googleLoading) {
    return <LoadingSpinner message={googleLoading ? "Connecting to Google..." : "Creating your account..."} />;
  }

  return (
    <>
      {error && <ErrorDisplay error={error} onDismiss={() => setError(null)} />}
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <div style={styles.logo}>🍑</div>
            <h1 style={styles.title}>Join Peach</h1>
            <p style={styles.subtitle}>Create an account to start your journey</p>
          </div>

          {/* Google Sign-Up Button */}
          <button
            onClick={handleGoogleSignIn}
            style={styles.googleButton}
            disabled={googleLoading}
          >
            <img 
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
              alt="Google logo"
              style={styles.googleIcon}
            />
            Continue with Google
          </button>

          <div style={styles.divider}>
            <span style={styles.dividerText}>or</span>
          </div>

          <form onSubmit={handleSignup} style={styles.form}>
            {error && (
              <div style={styles.errorMessage}>
                {error.userMessage}
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
                autoComplete="email"
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
                autoComplete="new-password"
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  ...styles.input,
                  borderColor: confirmPassword && password !== confirmPassword ? '#ff4d4d' : '#ddd'
                }}
                disabled={loading}
                required
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <div style={styles.passwordMismatch}>
                  Passwords do not match
                </div>
              )}
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
                type="button"
              >
                Sign In
              </button>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

// Add these new styles
const styles = {
  // ... existing styles ...

  googleButton: {
    width: '100%',
    padding: '12px',
    backgroundColor: 'white',
    color: '#333',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    marginBottom: '20px',
    transition: 'background-color 0.2s, border-color 0.2s',
    ':hover': {
      backgroundColor: '#f8f8f8',
      borderColor: '#ccc'
    }
  },
  googleIcon: {
    width: '20px',
    height: '20px'
  },
  divider: {
    position: 'relative',
    textAlign: 'center',
    margin: '20px 0',
    '::before': {
      content: '""',
      position: 'absolute',
      top: '50%',
      left: 0,
      right: 0,
      height: '1px',
      backgroundColor: '#e0e0e0',
      zIndex: 1
    }
  },
  dividerText: {
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'white',
    padding: '0 10px',
    color: '#999',
    fontSize: '0.9rem'
  },

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
    textDecoration: 'underline',
    padding: '0 4px'
  },
  passwordStrength: {
    marginTop: '5px',
    fontSize: '0.85rem'
  },
  passwordMismatch: {
    marginTop: '5px',
    fontSize: '0.85rem',
    color: '#ff4d4d'
  }
};