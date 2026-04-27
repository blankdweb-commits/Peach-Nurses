import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const Divider = ({ children }) => (
  <div style={styles.divider}>
    <div style={styles.dividerLine}></div>
    <span style={styles.dividerText}>{children}</span>
    <div style={styles.dividerLine}></div>
  </div>
);

export const Login = ({ onLoginSuccess, onSwitchToSignup }) => {
  const { loginUser, loginAsGuest, loginAsDemo, hasSupabase } = useUser();
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

        <div style={styles.devSection}>
          <button className="primary" style={styles.guestBtn} onClick={loginAsGuest}>
            Try Peach Instantly ✨
          </button>

          <Divider>Demo Accounts</Divider>
          <div style={styles.demoGrid}>
            <button style={styles.demoBtn} onClick={() => loginAsDemo('male')}>Demo Male</button>
            <button style={styles.demoBtn} onClick={() => loginAsDemo('female')}>Demo Female</button>
            <button style={styles.demoBtn} onClick={() => loginAsDemo('premium')}>Premium User</button>
            <button style={styles.demoBtn} onClick={() => loginAsDemo('admin')}>Admin Tester</button>
          </div>

          <Divider>{hasSupabase ? 'Continue with Email' : 'Sign In'}</Divider>
        </div>

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
  const { signupUser, loginAsGuest, hasSupabase, updateUserProfile } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [gender, setGender] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signupUser(email, password, username);
      await updateUserProfile({ gender, based: city });
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

        <div style={styles.devSection}>
          <button className="primary" style={styles.guestBtn} onClick={loginAsGuest}>
            Try Peach Instantly ✨
          </button>
          <Divider>{hasSupabase ? 'Or use email' : 'Create Local Account'}</Divider>
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Name"
            style={styles.input}
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
          />
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
          <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
            <select
              style={{ ...styles.input, marginBottom: 0, flex: 1 }}
              value={gender}
              onChange={e => setGender(e.target.value)}
              required
            >
              <option value="">Gender</option>
              <option value="Man">Man</option>
              <option value="Woman">Woman</option>
              <option value="Non-binary">Non-binary</option>
            </select>
            <input
              type="text"
              placeholder="City"
              style={{ ...styles.input, marginBottom: 0, flex: 1 }}
              value={city}
              onChange={e => setCity(e.target.value)}
              required
            />
          </div>
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
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--base-bg)',
    padding: '20px'
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
  devSection: {
    marginBottom: '30px'
  },
  guestBtn: {
    width: '100%',
    padding: '14px',
    fontSize: '1.1rem',
    marginBottom: '20px',
    background: 'linear-gradient(45deg, var(--soft-peach), var(--gold))',
    color: 'var(--base-bg)',
    border: 'none',
    fontWeight: 'bold'
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    margin: '20px 0'
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    backgroundColor: 'var(--glass-border)'
  },
  dividerText: {
    padding: '0 10px',
    color: 'var(--text-dim)',
    fontSize: '0.8rem'
  },
  demoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px'
  },
  demoBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    background: 'var(--glass-bg)',
    color: 'white',
    fontSize: '0.85rem',
    cursor: 'pointer'
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
    marginTop: '10px',
    border: 'none'
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
