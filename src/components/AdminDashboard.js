// components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useUser } from '../context/UserContext';
import { adminService, profilesService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';

const AdminDashboard = ({ onBack }) => {
  const { isAdmin, loginAdmin, logoutAdmin } = useAdmin();
  const { userProfile } = useUser();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState({});

  // Load users and stats when admin is authenticated
  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Get all users
      const allUsers = await profilesService.getProfiles(userProfile?.id, {});
      setUsers(allUsers);
      
      // Get stats
      const systemStats = await adminService.getStats();
      setStats(systemStats);
    } catch (err) {
      console.error('Error loading admin data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const success = await loginAdmin(password);
      if (!success) {
        setError('Invalid password');
      }
      setPassword('');
    } catch (err) {
      setError('Login failed');
    }
  };

  const handleBanUser = async (userId) => {
    if (!window.confirm('Are you sure you want to ban this user?')) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'ban' }));
      await adminService.banUser(userId);
      
      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, banned: true } : user
      ));
      
      // Reload stats
      const systemStats = await adminService.getStats();
      setStats(systemStats);
    } catch (err) {
      console.error('Error banning user:', err);
      alert('Failed to ban user');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to permanently delete this user? This action cannot be undone.')) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'delete' }));
      await adminService.deleteUser(userId);
      
      // Update local state
      setUsers(prev => prev.filter(user => user.id !== userId));
      
      // Reload stats
      const systemStats = await adminService.getStats();
      setStats(systemStats);
    } catch (err) {
      console.error('Error deleting user:', err);
      alert('Failed to delete user');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleGrantPremium = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'premium' }));
      await adminService.grantPremium(userId);
      
      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            subscription: {
              ...user.subscription,
              isPremium: true
            }
          };
        }
        return user;
      }));
      
      // Reload stats
      const systemStats = await adminService.getStats();
      setStats(systemStats);
    } catch (err) {
      console.error('Error granting premium:', err);
      alert('Failed to grant premium');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  const handleRevokePremium = async (userId) => {
    try {
      setActionLoading(prev => ({ ...prev, [userId]: 'premium' }));
      await adminService.revokePremium(userId);
      
      // Update local state
      setUsers(prev => prev.map(user => {
        if (user.id === userId) {
          return {
            ...user,
            subscription: {
              ...user.subscription,
              isPremium: false
            }
          };
        }
        return user;
      }));
      
      // Reload stats
      const systemStats = await adminService.getStats();
      setStats(systemStats);
    } catch (err) {
      console.error('Error revoking premium:', err);
      alert('Failed to revoke premium');
    } finally {
      setActionLoading(prev => ({ ...prev, [userId]: null }));
    }
  };

  if (!isAdmin) {
    return (
      <div style={styles.loginContainer}>
        <h2 style={styles.loginTitle}>Admin Login</h2>
        <form onSubmit={handleLogin} style={styles.loginForm}>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.loginInput}
            autoFocus
          />
          {error && <div style={styles.errorMessage}>{error}</div>}
          <button type="submit" style={styles.loginButton}>
            Login
          </button>
          <button onClick={onBack} type="button" style={styles.backButton}>
            Back to App
          </button>
        </form>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner message="Loading admin dashboard..." />;
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Admin Dashboard 🛠️</h2>
        <button onClick={logoutAdmin} style={styles.logoutButton}>
          Logout
        </button>
      </header>

      {/* Stats Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Total Users</h3>
            <p style={styles.statValue}>{stats.totalUsers}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Premium Members</h3>
            <p style={styles.statValue}>{stats.premiumUsers}</p>
          </div>
          <div style={styles.statCard}>
            <h3 style={styles.statTitle}>Banned Users</h3>
            <p style={styles.statValue}>{stats.bannedUsers}</p>
          </div>
        </div>
      )}

      {/* User Management */}
      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>User Management</h3>
        
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.tableHeaderCell}>User</th>
                <th style={styles.tableHeaderCell}>Status</th>
                <th style={styles.tableHeaderCell}>Premium</th>
                <th style={styles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Current User Row */}
              {userProfile && (
                <tr style={styles.tableRowCurrent}>
                  <td style={styles.tableCell}>
                    <div><strong>You (Current User)</strong></div>
                    <div style={styles.userEmail}>{userProfile.email}</div>
                  </td>
                  <td style={styles.tableCell}>
                    <span style={styles.statusActive}>Active</span>
                  </td>
                  <td style={styles.tableCell}>
                    {userProfile.subscription?.isPremium ? '👑 YES' : 'NO'}
                  </td>
                  <td style={styles.tableCell}>
                    {userProfile.subscription?.isPremium ? (
                      <button
                        onClick={() => handleRevokePremium(userProfile.id)}
                        disabled={actionLoading[userProfile.id]}
                        style={styles.actionButtonSecondary}
                      >
                        {actionLoading[userProfile.id] ? '...' : 'Revoke Premium'}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleGrantPremium(userProfile.id)}
                        disabled={actionLoading[userProfile.id]}
                        style={styles.actionButtonPremium}
                      >
                        {actionLoading[userProfile.id] ? '...' : 'Grant Premium'}
                      </button>
                    )}
                  </td>
                </tr>
              )}

              {/* Other Users */}
              {users.map(user => (
                <tr key={user.id} style={styles.tableRow}>
                  <td style={styles.tableCell}>
                    <div><strong>{user.alias || user.name}</strong></div>
                    <div style={styles.userEmail}>{user.email}</div>
                    <div style={styles.userId}>ID: {user.id.slice(0, 8)}...</div>
                  </td>
                  <td style={styles.tableCell}>
                    {user.banned ? (
                      <span style={styles.statusBanned}>BANNED</span>
                    ) : (
                      <span style={styles.statusActive}>Active</span>
                    )}
                  </td>
                  <td style={styles.tableCell}>
                    {user.subscription?.isPremium ? '👑 YES' : 'NO'}
                  </td>
                  <td style={styles.tableCell}>
                    <div style={styles.actionGroup}>
                      <button
                        onClick={() => handleBanUser(user.id)}
                        disabled={user.banned || actionLoading[user.id]}
                        style={user.banned ? styles.actionButtonDisabled : styles.actionButtonWarning}
                      >
                        {actionLoading[user.id] === 'ban' ? '...' : (user.banned ? 'Banned' : 'Ban')}
                      </button>
                      
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={actionLoading[user.id]}
                        style={styles.actionButtonDanger}
                      >
                        {actionLoading[user.id] === 'delete' ? '...' : 'Delete'}
                      </button>
                      
                      {user.subscription?.isPremium ? (
                        <button
                          onClick={() => handleRevokePremium(user.id)}
                          disabled={actionLoading[user.id]}
                          style={styles.actionButtonSecondary}
                        >
                          {actionLoading[user.id] === 'premium' ? '...' : 'Revoke'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleGrantPremium(user.id)}
                          disabled={actionLoading[user.id]}
                          style={styles.actionButtonPremium}
                        >
                          {actionLoading[user.id] === 'premium' ? '...' : 'Grant'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Back Button */}
      <div style={styles.backSection}>
        <button onClick={onBack} style={styles.backButtonLarge}>
          Back to App
        </button>
      </div>
    </div>
  );
};

const styles = {
  loginContainer: {
    padding: '40px 20px',
    maxWidth: '400px',
    margin: '0 auto',
    textAlign: 'center',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  },
  loginTitle: {
    fontSize: '1.8rem',
    marginBottom: '30px',
    color: '#333'
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  loginInput: {
    padding: '12px 16px',
    fontSize: '1rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    width: '100%',
    boxSizing: 'border-box'
  },
  loginButton: {
    padding: '12px',
    background: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  backButton: {
    padding: '12px',
    background: 'transparent',
    color: '#666',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  errorMessage: {
    color: '#ff4d4d',
    fontSize: '0.9rem',
    padding: '8px',
    backgroundColor: '#ffebee',
    borderRadius: '4px'
  },
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    fontFamily: 'sans-serif',
    width: '100%',
    boxSizing: 'border-box'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    borderBottom: '1px solid #eee',
    paddingBottom: '20px'
  },
  title: {
    fontSize: '1.8rem',
    color: '#333',
    margin: 0
  },
  logoutButton: {
    padding: '8px 20px',
    background: '#ff4d4d',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    padding: '20px',
    background: '#f9f9f9',
    borderRadius: '10px',
    textAlign: 'center'
  },
  statTitle: {
    margin: '0 0 10px 0',
    fontSize: '0.9rem',
    color: '#666'
  },
  statValue: {
    fontSize: '2rem',
    margin: 0,
    color: '#FF6347',
    fontWeight: 'bold'
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '1.3rem',
    marginBottom: '20px',
    color: '#333'
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '10px',
    border: '1px solid #eee'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px'
  },
  tableHeader: {
    background: '#f5f5f5'
  },
  tableHeaderCell: {
    padding: '15px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#333'
  },
  tableRow: {
    borderBottom: '1px solid #eee'
  },
  tableRowCurrent: {
    borderBottom: '1px solid #ddd',
    background: '#eef'
  },
  tableCell: {
    padding: '15px',
    verticalAlign: 'top'
  },
  userEmail: {
    fontSize: '0.8rem',
    color: '#666',
    marginTop: '4px'
  },
  userId: {
    fontSize: '0.7rem',
    color: '#999',
    marginTop: '2px'
  },
  statusActive: {
    color: '#4CAF50',
    fontWeight: '600',
    padding: '4px 8px',
    background: '#E8F5E9',
    borderRadius: '4px',
    display: 'inline-block'
  },
  statusBanned: {
    color: '#ff4d4d',
    fontWeight: '600',
    padding: '4px 8px',
    background: '#ffebee',
    borderRadius: '4px',
    display: 'inline-block'
  },
  actionGroup: {
    display: 'flex',
    gap: '5px',
    flexWrap: 'wrap'
  },
  actionButtonWarning: {
    padding: '5px 10px',
    background: '#ffa500',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  actionButtonDanger: {
    padding: '5px 10px',
    background: '#ff4d4d',
    color: 'white',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  actionButtonPremium: {
    padding: '5px 10px',
    background: '#FFD700',
    color: '#333',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  actionButtonSecondary: {
    padding: '5px 10px',
    background: '#ccc',
    color: '#333',
    border: 'none',
    borderRadius: '3px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  actionButtonDisabled: {
    padding: '5px 10px',
    background: '#ccc',
    color: '#666',
    border: 'none',
    borderRadius: '3px',
    cursor: 'not-allowed',
    fontSize: '0.8rem'
  },
  backSection: {
    marginTop: '40px',
    textAlign: 'center'
  },
  backButtonLarge: {
    padding: '12px 30px',
    background: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '1rem'
  }
};

export default AdminDashboard;