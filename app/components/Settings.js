import React from 'react';
import { useUser } from '../context/UserContext';

const Settings = ({ onNavigateToMembership, onNavigateToAdmin }) => {
  const { logoutUser, userProfile, kycStatus, updateKYC } = useUser();

  const handleLogout = async () => {
    await logoutUser();
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Settings</h2>
      </header>

      <section className="glass-card" style={styles.section}>
        <div style={styles.profileInfo}>
          <img
            src={userProfile?.photo_url || 'https://via.placeholder.com/100'}
            alt="Profile"
            style={styles.avatar}
          />
          <div>
            <div style={styles.name}>{userProfile?.username}</div>
            <div style={styles.email}>{userProfile?.email}</div>
          </div>
        </div>
      </section>

      <div style={styles.menuList}>
        <button className="glass-card" style={styles.menuItem} onClick={onNavigateToMembership}>
          <span style={styles.menuIcon}>👑</span>
          <div style={styles.menuText}>
            <div style={styles.menuTitle}>Premium Membership</div>
            <div style={styles.menuSubtitle}>Manage your subscription</div>
          </div>
          <span style={styles.menuArrow}>→</span>
        </button>

        <div className="glass-card" style={styles.menuItem}>
          <span style={styles.menuIcon}>🛡️</span>
          <div style={styles.menuText}>
            <div style={styles.menuTitle}>KYC Verification</div>
            <div style={styles.menuSubtitle}>{kycStatus === 'verified' ? 'Verified' : 'Not Verified'}</div>
          </div>
          {kycStatus !== 'verified' && (
            <button
              className="primary"
              style={styles.verifyBtn}
              onClick={() => updateKYC('verified')}
            >
              Verify
            </button>
          )}
        </div>

        {userProfile?.is_admin && (
          <button className="glass-card" style={styles.menuItem} onClick={onNavigateToAdmin}>
            <span style={styles.menuIcon}>🔑</span>
            <div style={styles.menuText}>
              <div style={styles.menuTitle}>Admin Dashboard</div>
              <div style={styles.menuSubtitle}>System management</div>
            </div>
            <span style={styles.menuArrow}>→</span>
          </button>
        )}

        <button className="glass-card" style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '30px'
  },
  title: {
    fontSize: '1.5rem'
  },
  section: {
    padding: '20px',
    marginBottom: '20px',
    border: '1px solid var(--glass-border)'
  },
  profileInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  avatar: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--soft-peach)'
  },
  name: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  email: {
    color: 'var(--text-dim)',
    fontSize: '0.9rem'
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  menuItem: {
    display: 'flex',
    padding: '15px 20px',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    border: '1px solid var(--glass-border)',
    background: 'none',
    textAlign: 'left',
    color: 'white',
    width: '100%'
  },
  menuIcon: {
    fontSize: '1.5rem'
  },
  menuText: {
    flex: 1
  },
  menuTitle: {
    fontWeight: 'bold'
  },
  menuSubtitle: {
    fontSize: '0.8rem',
    color: 'var(--text-dim)'
  },
  menuArrow: {
    color: 'var(--text-dim)'
  },
  verifyBtn: {
    padding: '8px 15px',
    fontSize: '0.8rem'
  },
  logoutBtn: {
    marginTop: '20px',
    padding: '15px',
    color: '#FF6347',
    fontWeight: 'bold',
    border: '1px solid rgba(255, 99, 71, 0.2)',
    background: 'none',
    width: '100%',
    cursor: 'pointer'
  }
};

export default Settings;
