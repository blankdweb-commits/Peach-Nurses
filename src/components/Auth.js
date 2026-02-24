import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

export const Login = ({ onLoginSuccess, onSwitchToSignup }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { loginUser } = useUser();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await loginUser(email, password);
      onLoginSuccess();
    } catch (error) {
      alert("Login failed: " + error.message);
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Peach 🍑</h1>
      <h2>Login</h2>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px', background: '#FF6347', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
      </form>
      <div style={{ marginTop: '20px' }}>
        <p>New to Peach?</p>
        <button onClick={onSwitchToSignup} style={{ background: 'none', border: 'none', color: '#FF6347', cursor: 'pointer', fontWeight: 'bold' }}>Create Account</button>
      </div>
    </div>
  );
};

export const Signup = ({ onSignupSuccess, onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signupUser } = useUser();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (email && password) {
      try {
        await signupUser(email, password);
        onSignupSuccess();
      } catch (error) {
        alert("Signup failed: " + error.message);
      }
    } else {
      alert("Please fill all fields.");
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto', textAlign: 'center' }}>
      <h1>Peach 🍑</h1>
      <h2>Create Account</h2>
      <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <input
          type="password"
          placeholder="Create Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: '12px', borderRadius: '5px', border: '1px solid #ccc' }}
        />
        <button type="submit" style={{ padding: '12px', background: '#FF6347', color: 'white', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' }}>Sign Up</button>
      </form>
      <div style={{ marginTop: '20px' }}>
        <p>Already have an account?</p>
        <button onClick={onSwitchToLogin} style={{ background: 'none', border: 'none', color: '#FF6347', cursor: 'pointer', fontWeight: 'bold' }}>Login</button>
      </div>
    </div>
  );
};
