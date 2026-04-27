import React from 'react';
import { useUser } from '../context/UserContext';
import { peachAIService } from '../services/peachAIService';

const Insights = ({ onBack }) => {
  const { userProfile } = useUser();
  const score = userProfile?.readinessScore || 7;

  const percentage = (score / 10) * 100;

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button onClick={onBack} style={styles.backBtn}>←</button>
        <h2 style={styles.title}>Your Insights</h2>
      </header>

      <section className="glass-card" style={styles.scoreCard}>
        <h3 style={styles.scoreTitle}>Relationship Readiness</h3>
        <div style={styles.gaugeContainer}>
           <div style={styles.gauge}>
              <div style={{...styles.gaugeFill, width: `${percentage}%`}}></div>
           </div>
           <div style={styles.scoreLabel}>{score}/10</div>
        </div>
        <p style={styles.scoreDescription}>
          {peachAIService.getReadinessInsight(userProfile || {})}
        </p>
      </section>

      <div style={styles.statsGrid}>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statVal}>Calm</div>
          <div style={styles.statLabel}>Communication Style</div>
        </div>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statVal}>90%</div>
          <div style={styles.statLabel}>Profile Strength</div>
        </div>
      </div>

      <section style={styles.adviceSection}>
         <h3 style={styles.sectionTitle}>Peach's Advice</h3>
         <div style={styles.adviceItem}>
            <div style={styles.adviceIcon}>🌱</div>
            <div>
               <div style={styles.adviceTitle}>Focus on values</div>
               <p style={styles.adviceText}>You've shown a strong preference for 'Peace'. When talking to matches, ask about their morning routines.</p>
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
  scoreCard: {
    padding: '30px',
    textAlign: 'center',
    marginBottom: '20px'
  },
  scoreTitle: {
    fontSize: '1.1rem',
    textTransform: 'uppercase',
    letterSpacing: '1px',
    marginBottom: '20px',
    color: 'var(--text-dim)'
  },
  gaugeContainer: {
    marginBottom: '20px'
  },
  gauge: {
    height: '12px',
    backgroundColor: 'var(--glass-bg)',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: 'var(--soft-peach)',
    transition: 'width 1s ease-out'
  },
  scoreLabel: {
    fontSize: '2rem',
    fontWeight: 'bold',
    color: 'var(--gold)'
  },
  scoreDescription: {
    lineHeight: '1.6',
    color: 'var(--text-dim)',
    margin: 0
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '15px',
    marginBottom: '30px'
  },
  statCard: {
    padding: '20px',
    textAlign: 'center'
  },
  statVal: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '5px',
    color: 'var(--soft-peach)'
  },
  statLabel: {
    fontSize: '0.8rem',
    color: 'var(--text-dim)'
  },
  adviceSection: {
    marginTop: '20px'
  },
  sectionTitle: {
    fontSize: '1.1rem',
    marginBottom: '15px',
    color: 'var(--text-dim)'
  },
  adviceItem: {
    display: 'flex',
    gap: '15px',
    marginBottom: '20px',
    alignItems: 'flex-start'
  },
  adviceIcon: {
    fontSize: '1.5rem',
    padding: '10px',
    backgroundColor: 'var(--glass-bg)',
    borderRadius: '12px'
  },
  adviceTitle: {
    fontWeight: 'bold',
    marginBottom: '5px'
  },
  adviceText: {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    lineHeight: '1.5',
    margin: 0
  }
};

export default Insights;
