import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../services/supabase';

const Likes = ({ onBack, onNavigateToStore }) => {
  const { currentUser, subscription, ripenMatch } = useUser();
  const [likes, setLikes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLikes = async () => {
      if (!currentUser) return;

      try {
        // Fetch users who ripened the current user but aren't matched yet
        const { data } = await supabase
          .from('ripened_users')
          .select('user_id, profiles!ripened_users_user_id_fkey(*)')
          .eq('target_user_id', currentUser.id);

        if (data) {
          // Filter out those who are already matched
          const { data: matches } = await supabase
            .from('matches')
            .select('user_id_1, user_id_2')
            .or(`user_id_1.eq.${currentUser.id},user_id_2.eq.${currentUser.id}`);

          const matchedUserIds = (matches || []).map(m =>
            m.user_id_1 === currentUser.id ? m.user_id_2 : m.user_id_1
          );

          const filteredLikes = data
            .map(item => item.profiles)
            .filter(profile => !matchedUserIds.includes(profile.id));

          setLikes(filteredLikes);
        }
      } catch (error) {
        console.error('Error fetching likes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLikes();
  }, [currentUser]);

  const handleRipenBack = async (userId) => {
    const result = await ripenMatch(userId);
    if (result === 'match') {
      alert("It's a Match! 🎉");
      setLikes(prev => prev.filter(u => u.id !== userId));
    } else if (result === true) {
      setLikes(prev => prev.filter(u => u.id !== userId));
    }
  };

  if (!subscription.isPremium) {
    return (
      <div style={styles.premiumLockContainer}>
        <header style={styles.header}>
          <button onClick={onBack} style={styles.backButton}>←</button>
          <h2 style={styles.headerTitle}>Who Likes You</h2>
        </header>
        <div style={styles.lockContent}>
          <div style={styles.lockIcon}>🔒</div>
          <h3 style={styles.lockTitle}>See Who Likes You</h3>
          <p style={styles.lockText}>
            Upgrade to Peach Premium to see everyone who's already ripened your profile!
          </p>
          <button onClick={onNavigateToStore} style={styles.upgradeButton}>
            Get Peach Premium 👑
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backButton}>←</button>
        <h2 style={styles.headerTitle}>Who Likes You ({likes.length})</h2>
      </header>

      {loading ? (
        <div style={styles.loading}>Loading likes...</div>
      ) : likes.length === 0 ? (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>🍑</div>
          <h3>No likes yet</h3>
          <p>Keep swiping in Discover to get noticed!</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {likes.map(user => (
            <div key={user.id} style={styles.card}>
              <div
                style={{
                  ...styles.avatar,
                  backgroundImage: `url(${user.photo_url || 'https://via.placeholder.com/150'})`
                }}
              />
              <div style={styles.cardInfo}>
                <div style={styles.name}>{user.alias}</div>
                <div style={styles.level}>{user.level}</div>
                <button
                  onClick={() => handleRipenBack(user.id)}
                  style={styles.ripenButton}
                >
                  Ripen Back 🍑
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    paddingBottom: '80px'
  },
  premiumLockContainer: {
    minHeight: '100vh',
    backgroundColor: '#fff'
  },
  header: {
    padding: '20px',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    position: 'sticky',
    top: 0,
    zIndex: 100
  },
  backButton: {
    marginRight: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer'
  },
  headerTitle: {
    fontSize: '1.2rem',
    margin: 0
  },
  lockContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    height: '70vh'
  },
  lockIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  lockTitle: {
    fontSize: '1.5rem',
    marginBottom: '15px'
  },
  lockText: {
    color: '#666',
    marginBottom: '30px',
    maxWidth: '300px'
  },
  upgradeButton: {
    padding: '15px 30px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  },
  loading: {
    textAlign: 'center',
    padding: '40px'
  },
  empty: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
    padding: '15px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '15px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
  },
  avatar: {
    height: '180px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(4px)' // Blur for non-premium? No, if they are premium they see it.
    // Wait, if they are premium, no blur.
  },
  cardInfo: {
    padding: '12px',
    textAlign: 'center'
  },
  name: {
    fontWeight: 'bold',
    marginBottom: '4px'
  },
  level: {
    fontSize: '0.8rem',
    color: '#666',
    marginBottom: '10px'
  },
  ripenButton: {
    width: '100%',
    padding: '8px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer'
  }
};

export default Likes;
