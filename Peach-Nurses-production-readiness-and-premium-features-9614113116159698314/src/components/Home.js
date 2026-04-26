import React from 'react';
import { useUser } from '../context/UserContext';
import { peachAIService } from '../services/peachAIService';

const Home = ({ onNavigateToChat, onNavigateToIntroductions, onNavigateToInsights }) => {
  const { userProfile, matches } = useUser();

  const readinessInsight = peachAIService.getReadinessInsight(userProfile || {});

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.greeting}>Good evening, <span className="peach-text">{userProfile?.username || 'there'}</span></h1>
        <p style={styles.status}>Peach is reviewing matches for you.</p>
      </header>

      <section className="glass-card" style={styles.queueCard} onClick={onNavigateToIntroductions}>
        <div style={styles.queueInfo}>
          <div style={styles.queueTitle}>Compatibility Queue</div>
          <div style={styles.queueCount}>3 promising introductions</div>
        </div>
        <div style={styles.queueArrow}>→</div>
      </section>

      <div style={styles.grid}>
        <button className="glass-card" style={styles.gridItem} onClick={onNavigateToChat}>
          <div style={styles.gridIcon}>💬</div>
          <div style={styles.gridLabel}>Chat with Peach</div>
        </button>
        <button className="glass-card" style={styles.gridItem} onClick={onNavigateToInsights}>
          <div style={styles.gridIcon}>📊</div>
          <div style={styles.gridLabel}>Readiness Score</div>
        </button>
      </div>

      <section style={styles.insightSection}>
        <h3 style={styles.sectionTitle}>Peach's Insight</h3>
        <div className="glass-card" style={styles.insightCard}>
          <p style={styles.insightText}>{readinessInsight}</p>
        </div>
      </section>

      <section style={styles.feedSection}>
        <h3 style={styles.sectionTitle}>Personalized Feed</h3>
        <div style={styles.feedItem}>
          <div style={styles.feedDot}></div>
          <div style={styles.feedContent}>
            <div style={styles.feedTitle}>New intro likely today</div>
            <div style={styles.feedTime}>Expected by 9:00 PM</div>
          </div>
        </div>
        <div style={styles.feedItem}>
          <div style={styles.feedDot}></div>
          <div style={styles.feedContent}>
            <div style={styles.feedTitle}>Best match window: evenings</div>
            <div style={styles.feedTime}>Based on your activity</div>
          </div>
        </div>
      </section>
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
    marginBottom: '30px',
    marginTop: '20px'
  },
  greeting: {
    fontSize: '1.8rem',
    margin: '0 0 5px 0'
  },
  status: {
    color: 'var(--text-dim)',
    margin: 0
  },
  queueCard: {
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    cursor: 'pointer',
    borderLeft: '4px solid var(--gold)'
  },
  queueTitle: {
    color: 'var(--gold)',
    fontWeight: 'bold',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  queueCount: {
    fontSize: '1.2rem',
    marginTop: '5px'
  },
  queueArrow: {
    fontSize: '1.5rem',
    color: 'var(--text-dim)'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '30px'
  },
  gridItem: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    cursor: 'pointer',
    border: '1px solid var(--glass-border)',
    background: 'none',
    color: 'white'
  },
  gridIcon: {
    fontSize: '2rem'
  },
  gridLabel: {
    fontSize: '0.9rem',
    fontWeight: '500'
  },
  insightSection: {
    marginBottom: '30px'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    marginBottom: '15px',
    color: 'var(--text-dim)'
  },
  insightCard: {
    padding: '20px',
    lineHeight: '1.5',
    color: 'var(--soft-peach)',
    fontStyle: 'italic'
  },
  insightText: {
    margin: 0
  },
  feedSection: {
    marginBottom: '20px'
  },
  feedItem: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px'
  },
  feedDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: 'var(--gold)',
    marginTop: '6px',
    flexShrink: 0
  },
  feedTitle: {
    fontWeight: '600',
    marginBottom: '2px'
  },
  feedTime: {
    fontSize: '0.85rem',
    color: 'var(--text-dim)'
  }
};

export default Home;
