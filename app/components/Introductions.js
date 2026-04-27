"use client";
import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { peachAIService } from '../services/peachAIService';
import { DEV_MODE, MOCK_USERS } from '../services/devService';

const Introductions = ({ onBack }) => {
  const { potentialMatches, ripenMatch, fetchAllProfiles } = useUser();
  const [revealed, setRevealed] = useState([]);

  useEffect(() => {
    fetchAllProfiles();
  }, [fetchAllProfiles]);

  // Use MOCK_USERS if in dev mode and no profiles loaded
  const displayMatches = potentialMatches.length > 0 ? potentialMatches.slice(0, 3) : (DEV_MODE ? MOCK_USERS.slice(0, 3) : []);

  const handleInterest = async (matchId) => {
    await ripenMatch(matchId);
    setRevealed(prev => [...prev, matchId]);
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>←</button>
        <h2 style={styles.title}>Introductions</h2>
      </header>

      {displayMatches.length === 0 ? (
        <div style={{textAlign: 'center', padding: '50px', color: 'var(--text-dim)'}}>
           <p>Searching for compatible souls...</p>
        </div>
      ) : (
        <div style={styles.list}>
          {displayMatches.map(match => (
            <div key={match.id} className="glass-card" style={styles.card}>
              {!revealed.includes(match.id) ? (
                <div style={styles.summaryView}>
                  <div style={styles.matchIcon}>👤</div>
                  <h3 style={styles.summaryTitle}>A potential match in {match.based}</h3>
                  <p style={styles.summaryText}>{peachAIService.generateIntro(match)}</p>
                  <div style={styles.actions}>
                    <button className="secondary" onClick={() => {}}>Not for me</button>
                    <button className="primary" onClick={() => handleInterest(match.id)}>Interested</button>
                  </div>
                </div>
              ) : (
                <div style={styles.revealView}>
                  <div style={styles.revealHeader}>
                     <img
                      src={match.photo_url || `https://picsum.photos/200/200?random=${match.id}`}
                      alt={match.alias}
                      style={styles.revealPhoto}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
                    />
                    <div>
                      <h3 style={styles.revealName}>{match.alias}, {match.age}</h3>
                      <div style={styles.revealStatus}>Waiting for mutual interest...</div>
                    </div>
                  </div>
                  <p style={styles.revealText}>I've let them know you're interested. If they feel the same, I'll open a chat for you both.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  card: {
    padding: '25px',
    border: '1px solid var(--glass-border)'
  },
  summaryView: {
    textAlign: 'center'
  },
  matchIcon: {
    fontSize: '3rem',
    marginBottom: '15px',
    opacity: 0.5
  },
  summaryTitle: {
    fontSize: '1.2rem',
    marginBottom: '10px'
  },
  summaryText: {
    color: 'var(--text-dim)',
    lineHeight: '1.6',
    marginBottom: '20px'
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center'
  },
  revealView: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
  revealHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  revealPhoto: {
    width: '60px',
    height: '60px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--gold)'
  },
  revealName: {
    margin: 0
  },
  revealStatus: {
    fontSize: '0.8rem',
    color: 'var(--gold)'
  },
  revealText: {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    lineHeight: '1.5',
    margin: 0
  }
};

export default Introductions;
