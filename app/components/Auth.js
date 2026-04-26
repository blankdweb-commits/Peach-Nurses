import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export const Login = ({ onLoginSuccess, onSwitchToSignup }) => {
  const { loginUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      onLoginSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card" style={styles.card}>
        <div style={styles.logo}>🍑</div>
        <h2 style={styles.title}>Welcome to <span className="peach-text">Peach</span></h2>
        <p style={styles.subtitle}>AI Matchmaking for serious singles.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary" style={styles.btn}>Sign In</button>
        </form>

        <p style={styles.switch}>
          Don't have an account? <span style={styles.link} onClick={onSwitchToSignup}>Join Peach</span>
        </p>
      </div>
    </div>
  );
};

export const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const { signupUser } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signupUser(email, password);
      onSignupSuccess();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-card" style={styles.card}>
        <div style={styles.logo}>🍑</div>
        <h2 style={styles.title}>Create <span className="peach-text">Peach</span> Account</h2>
        <p style={styles.subtitle}>Start your journey to a serious relationship.</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            style={styles.input}
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            style={styles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="primary" style={styles.btn}>Join Now</button>
        </form>

        <p style={styles.switch}>
          Already have an account? <span style={styles.link} onClick={onSwitchToLogin}>Sign In</span>
        </p>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--base-bg)'
  },
  card: {
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
    textAlign: 'center'
  },
  logo: {
    fontSize: '3.5rem',
    marginBottom: '20px'
  },
  title: {
    fontSize: '1.8rem',
    marginBottom: '10px'
  },
  subtitle: {
    color: 'var(--text-dim)',
    marginBottom: '30px'
  },
  input: {
    width: '100%',
    padding: '14px',
    marginBottom: '15px',
    borderRadius: '10px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
    color: 'white',
    outline: 'none'
  },
  btn: {
    width: '100%',
    padding: '14px',
    fontSize: '1.1rem',
    marginTop: '10px'
  },
  error: {
    color: '#FF6347',
    marginBottom: '15px',
    fontSize: '0.9rem'
  },
  switch: {
    marginTop: '25px',
    fontSize: '0.9rem',
    color: 'var(--text-dim)'
  },
  link: {
    color: 'var(--soft-peach)',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
};
