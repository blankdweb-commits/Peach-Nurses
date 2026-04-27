"use client";
import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
import { DEV_MODE } from '../services/devService';

const DevToolbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const {
    userProfile,
    updateUserProfile,
    logoutUser,
    ripenMatch,
    potentialMatches
  } = useUser();

  if (!DEV_MODE) return null;

  const handleResetOnboarding = () => {
    updateUserProfile({ onboarding_complete: false });
    window.location.reload();
  };

  const handleSimulatePremium = () => {
    updateUserProfile({ is_premium: true });
  };

  const handleCreateMatches = async () => {
    for (const match of potentialMatches.slice(0, 3)) {
      await ripenMatch(match.id);
    }
    alert('Created 3 simulated matches!');
  };

  return (
    <div style={styles.container}>
      <button
        style={styles.toggleBtn}
        onClick={() => setIsOpen(!isOpen)}
      >
        🛠️ Dev Tools
      </button>

      {isOpen && (
        <div className="glass-card" style={styles.menu}>
          <h4 style={styles.title}>Developer Panel</h4>
          <div style={styles.info}>
            User: {userProfile?.username || 'None'}
          </div>
          <button style={styles.actionBtn} onClick={handleResetOnboarding}>Reset Onboarding</button>
          <button style={styles.actionBtn} onClick={handleSimulatePremium}>Simulate Premium</button>
          <button style={styles.actionBtn} onClick={handleCreateMatches}>Create 3 Matches</button>
          <button style={styles.actionBtn} onClick={() => { logoutUser(); window.location.reload(); }}>Clear Session</button>
          <button style={{...styles.actionBtn, background: '#FF6347'}} onClick={() => setIsOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    position: 'fixed',
    bottom: '80px',
    right: '20px',
    zIndex: 9999
  },
  toggleBtn: {
    padding: '10px 15px',
    borderRadius: '20px',
    border: 'none',
    background: 'var(--gold)',
    color: 'var(--base-bg)',
    fontWeight: 'bold',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)'
  },
  menu: {
    position: 'absolute',
    bottom: '50px',
    right: '0',
    width: '200px',
    padding: '15px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    border: '1px solid var(--gold)'
  },
  title: {
    margin: '0 0 10px 0',
    color: 'var(--gold)',
    borderBottom: '1px solid var(--glass-border)',
    paddingBottom: '5px'
  },
  info: {
    fontSize: '0.7rem',
    color: 'var(--text-dim)',
    marginBottom: '5px'
  },
  actionBtn: {
    padding: '8px',
    borderRadius: '5px',
    border: 'none',
    background: 'var(--glass-bg)',
    color: 'white',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'left'
  }
};

export default DevToolbar;
