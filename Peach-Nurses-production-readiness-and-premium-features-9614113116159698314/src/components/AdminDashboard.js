import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { useAdmin } from '../context/AdminContext';

const AdminDashboard = ({ onBack }) => {
  const { potentialMatches, fetchAllProfiles } = useUser();
  const { isAdmin, loginAdmin, banUser, deleteUser } = useAdmin();
  const [profiles, setProfiles] = useState([]);
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (isAdmin) {
      fetchAllProfiles();
    }
  }, [isAdmin, fetchAllProfiles]);

  useEffect(() => {
    setProfiles(potentialMatches);
  }, [potentialMatches]);

  if (!isAdmin) {
    return (
      <div style={styles.container}>
        <div className="glass-card" style={styles.card}>
          <h2 style={{textAlign: 'center', marginBottom: '20px'}}>Admin Login</h2>
          <input
            type="password"
            placeholder="Enter Admin Password"
            style={styles.input}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button className="primary" style={{width: '100%'}} onClick={() => loginAdmin(password)}>Login</button>
          <button className="secondary" style={{width: '100%', marginTop: '10px'}} onClick={onBack}>Cancel</button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>←</button>
        <h2 style={styles.title}>Admin Console</h2>
      </header>

      <div className="glass-card" style={styles.card}>
        <h3 style={styles.cardTitle}>User Management</h3>
        <div className="responsive-table-container">
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>Username</th>
                <th style={styles.th}>Email</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map(user => (
                <tr key={user.id} style={styles.tr}>
                  <td style={styles.td}>{user.username || 'N/A'}</td>
                  <td style={styles.td}>{user.email}</td>
                  <td style={styles.td}>{user.banned ? 'Banned' : 'Active'}</td>
                  <td style={styles.td}>
                    <button
                      style={{...styles.actionBtn, color: '#FF6347'}}
                      onClick={() => banUser(user.id)}
                      disabled={user.banned}
                    >
                      Ban
                    </button>
                    <button
                      style={{...styles.actionBtn, color: '#999'}}
                      onClick={() => deleteUser(user.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '30px'
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--soft-peach)',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  title: {
    margin: 0
  },
  card: {
    padding: '20px'
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
    color: 'white'
  },
  cardTitle: {
    marginBottom: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  tableHeader: {
    borderBottom: '1px solid var(--glass-border)',
    textAlign: 'left'
  },
  th: {
    padding: '12px',
    color: 'var(--text-dim)',
    fontSize: '0.9rem'
  },
  tr: {
    borderBottom: '1px solid var(--glass-border)'
  },
  td: {
    padding: '12px',
    fontSize: '0.9rem'
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    marginRight: '10px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  }
};

export default AdminDashboard;
