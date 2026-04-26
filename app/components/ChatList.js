import React from 'react';
import { useUser } from '../context/UserContext';

const ChatList = ({ onSelectChat }) => {
  const { matches, chats } = useUser();

  const getLastMessage = (matchId) => {
    const matchChats = chats[matchId] || [];
    if (matchChats.length === 0) return 'Start a conversation...';
    const lastMsg = matchChats[matchChats.length - 1];
    return lastMsg.text;
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h2 style={styles.title}>Conversations</h2>
      </header>

      <div style={styles.list}>
        {matches.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>💬</div>
            <h3>No conversations yet</h3>
            <p>Your mutual matches will appear here once you both express interest.</p>
          </div>
        ) : (
          matches.map(match => (
            <div
              key={match.id}
              className="glass-card"
              style={styles.chatItem}
              onClick={() => onSelectChat(match.id)}
            >
              <img
                src={match.matchedUser.photo_url || match.matchedUser.photoUrl}
                alt={match.matchedUser.alias}
                style={styles.avatar}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="25" fill="%23F4B6A6"/><text x="25" y="32" font-size="20" text-anchor="middle" fill="black">🍑</text></svg>';
                }}
              />
              <div style={styles.chatInfo}>
                <div style={styles.chatHeader}>
                  <span style={styles.name}>{match.matchedUser.alias}</span>
                  <span style={styles.time}>{formatTime(chats[match.id]?.slice(-1)[0]?.timestamp)}</span>
                </div>
                <div style={styles.lastMessage}>{getLastMessage(match.id)}</div>
              </div>
            </div>
          ))
        )}
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
    marginBottom: '20px'
  },
  title: {
    fontSize: '1.5rem'
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  chatItem: {
    display: 'flex',
    padding: '15px',
    alignItems: 'center',
    gap: '15px',
    cursor: 'pointer',
    border: '1px solid var(--glass-border)'
  },
  avatar: {
    width: '55px',
    height: '55px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid var(--soft-peach)'
  },
  chatInfo: {
    flex: 1,
    minWidth: 0
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  },
  name: {
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  time: {
    fontSize: '0.75rem',
    color: 'var(--text-dim)'
  },
  lastMessage: {
    fontSize: '0.9rem',
    color: 'var(--text-dim)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  emptyState: {
    textAlign: 'center',
    padding: '50px 20px',
    color: 'var(--text-dim)'
  },
  emptyIcon: {
    fontSize: '3rem',
    marginBottom: '20px',
    opacity: 0.3
  }
};

export default ChatList;
