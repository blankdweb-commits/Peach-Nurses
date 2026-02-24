import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { useUser } from '../context/UserContext';

const AdminDashboard = ({ onBack }) => {
  const { isAdmin, loginAdmin, logoutAdmin, deleteUser, banUser } = useAdmin();
  const { potentialMatches, subscription, grantPremium, revokePremium, fetchAllProfiles } = useUser();

  useEffect(() => {
    if (isAdmin) {
      fetchAllProfiles();
    }
  }, [isAdmin, fetchAllProfiles]);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (loginAdmin(password)) {
      setPassword('');
      setError('');
    } else {
      setError('Invalid password');
    }
  };

  if (!isAdmin) {
    return (
      <div style={{ padding: '40px', maxWidth: '400px', margin: '0 auto', textAlign: 'center', width: '100%', boxSizing: 'border-box' }}>
        <h2>Admin Login</h2>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input
            type="password"
            placeholder="Enter Admin Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '10px', fontSize: '1rem', borderRadius: '5px', border: '1px solid #ccc', width: '100%', boxSizing: 'border-box' }}
          />
          {error && <div style={{ color: 'red' }}>{error}</div>}
          <button type="submit" style={{ padding: '10px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>Login</button>
          <button onClick={onBack} type="button" style={{ padding: '10px', background: 'transparent', color: '#666', border: 'none', cursor: 'pointer' }}>Back to App</button>
        </form>
      </div>
    );
  }

  // Count premium users (mock logic: check potentialMatches flags or subscription)
  // For 'Me' user:
  const myPremium = subscription.isPremium;
  // For others (mocked in potentialMatches):
  const otherPremiums = potentialMatches.filter(u => u.isPremium).length;
  const premiumCount = (myPremium ? 1 : 0) + otherPremiums;

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif', width: '100%', boxSizing: 'border-box' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '20px' }}>
        <h2>Admin Dashboard 🛠️</h2>
        <button onClick={logoutAdmin} style={{ padding: '5px 15px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '40px' }}>
        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '10px' }}>
          <h3>Total Users</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{potentialMatches.length + 1}</p>
        </div>
        <div style={{ padding: '20px', background: '#f9f9f9', borderRadius: '10px' }}>
          <h3>Premium Members</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{premiumCount}</p>
        </div>
      </div>

      <h3>User Management</h3>
      <div className="responsive-table-container">
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px', minWidth: '600px' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: '#eee' }}>
              <th style={{ padding: '10px' }}>User</th>
              <th style={{ padding: '10px' }}>Status</th>
              <th style={{ padding: '10px' }}>Premium</th>
              <th style={{ padding: '10px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Current User Row */}
            <tr style={{ borderBottom: '1px solid #ddd', background: '#eef' }}>
              <td style={{ padding: '10px' }}><strong>You (Current User)</strong></td>
              <td style={{ padding: '10px' }}><span style={{ color: 'green' }}>Active</span></td>
              <td style={{ padding: '10px' }}>{subscription.isPremium ? '👑 YES' : 'NO'}</td>
              <td style={{ padding: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                {subscription.isPremium ? (
                    <button onClick={() => revokePremium('current_user')} style={{ padding: '5px 10px', background: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Revoke Premium</button>
                ) : (
                    <button onClick={() => grantPremium('current_user')} style={{ padding: '5px 10px', background: '#FFD700', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Grant Premium</button>
                )}
              </td>
            </tr>

            {/* Other Users */}
            {potentialMatches.map(user => (
              <tr key={user.id} style={{ borderBottom: '1px solid #ddd' }}>
                <td style={{ padding: '10px' }}>
                  <div><strong>{user.alias}</strong></div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{user.real_name || user.realName}</div>
                </td>
                <td style={{ padding: '10px' }}>
                  {user.banned ? <span style={{ color: 'red', fontWeight: 'bold' }}>BANNED</span> : <span style={{ color: 'green' }}>Active</span>}
                </td>
                <td style={{ padding: '10px' }}>
                   {user.isPremium ? '👑 YES' : 'NO'}
                </td>
                <td style={{ padding: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => banUser(user.id)}
                    style={{ padding: '5px 10px', background: user.banned ? '#ccc' : '#ffa500', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                    disabled={user.banned}
                  >
                    {user.banned ? 'Banned' : 'Ban'}
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    style={{ padding: '5px 10px', background: '#ff4d4d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}
                  >
                    Delete
                  </button>
                  {user.isPremium ? (
                      <button onClick={() => revokePremium(user.id)} style={{ padding: '5px 10px', background: '#ccc', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Revoke</button>
                  ) : (
                      <button onClick={() => grantPremium(user.id)} style={{ padding: '5px 10px', background: '#FFD700', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>Grant</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <button onClick={onBack} style={{ padding: '10px 20px', background: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%', maxWidth: '200px' }}>Back to App</button>
      </div>
    </div>
  );
};

export default AdminDashboard;
