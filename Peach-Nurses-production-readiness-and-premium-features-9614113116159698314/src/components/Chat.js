import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useUser } from '../context/UserContext';
import { peachAIService } from '../services/peachAIService';

const Chat = ({ matchId, onBack }) => {
  const { chats, sendMessage, userProfile, matches, subscription } = useUser();
  const [inputText, setInputText] = useState('');
  const [wingmanSuggestion, setWingmanSuggestion] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const matchRecord = matches.find(m => m.id === matchId);
  const match = matchRecord?.matchedUser;
  
  const messages = useMemo(() => {
    return chats[matchId] || [];
  }, [chats, matchId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(matchId, inputText);
      setInputText('');
      setWingmanSuggestion(null);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleWingman = () => {
    if (!subscription.isPremium) {
      alert("Peach Coaching is a Premium feature! Upgrade to get AI-powered conversation help.");
      return;
    }

    let lastMsgText = '';
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender === 'them') {
        lastMsgText = lastMsg.text;
      }
    }

    const line = peachAIService.generateReply(lastMsgText);
    setWingmanSuggestion(line);
    setInputText(line);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!match) {
    return (
      <div style={styles.notFoundContainer}>
        <div style={styles.notFoundIcon}>🍑</div>
        <h2 style={{color: 'var(--text-white)'}}>Match not found</h2>
        <p style={{color: 'var(--text-dim)'}}>This chat may have been removed or the user is no longer available.</p>
        <button
          onClick={onBack}
          className="primary"
          style={{marginTop: '20px'}}
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <button
          onClick={onBack}
          style={styles.backArrow}
          aria-label="Go back"
        >
          ←
        </button>
        
        <div style={styles.headerContent}>
          <img
            src={match.photo_url || match.photoUrl}
            alt={match.alias || match.realName}
            style={styles.avatar}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23F4B6A6"/><text x="22" y="28" font-size="18" text-anchor="middle" fill="black">🍑</text></svg>';
            }}
          />
          <div style={styles.headerInfo}>
            <div style={styles.name}>{match.alias || match.realName}</div>
            <div style={styles.status}>
              <span style={styles.statusDot}></span>
              Online
            </div>
          </div>
        </div>
      </header>

      <div style={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            <div style={styles.welcomeIcon}>👋</div>
            <h3 style={styles.welcomeTitle}>Say hello to {match.alias || match.realName}!</h3>
            <p style={styles.welcomeText}>
              Start a conversation and get to know each other.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            style={{
              ...styles.messageContainer,
              alignItems: msg.sender === 'me' ? 'flex-end' : 'flex-start'
            }}
          >
            <div style={{
              ...styles.messageBubble,
              backgroundColor: msg.sender === 'me' ? 'var(--soft-peach)' : 'var(--secondary-bg)',
              color: msg.sender === 'me' ? 'var(--base-bg)' : 'var(--text-white)',
              border: 'none'
            }}>
              {msg.text}
              <div style={{
                ...styles.messageTime,
                color: msg.sender === 'me' ? 'rgba(0,0,0,0.5)' : 'var(--text-dim)',
                textAlign: msg.sender === 'me' ? 'end' : 'start'
              }}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {wingmanSuggestion && (
        <div style={styles.suggestionBanner}>
          <div style={styles.suggestionIcon}>🍑</div>
          <div style={styles.suggestionContent}>
            <div style={styles.suggestionTitle}>Peach Coaching</div>
            <div style={styles.suggestionText}>"{wingmanSuggestion}"</div>
          </div>
          <button
            onClick={() => setWingmanSuggestion(null)}
            style={styles.dismissButton}
            aria-label="Dismiss suggestion"
          >
            ×
          </button>
        </div>
      )}

      <div style={styles.inputArea}>
        <form onSubmit={handleSend} style={styles.inputForm}>
          <button
            type="button"
            onClick={handleWingman}
            title="Get Peach coaching"
            style={{
              ...styles.wingmanButton,
              background: subscription.isPremium ? 'var(--gold)' : 'var(--glass-bg)',
              cursor: subscription.isPremium ? 'pointer' : 'not-allowed'
            }}
          >
            🍑
          </button>

          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            style={styles.messageInput}
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            style={{
              ...styles.sendButton,
              background: inputText.trim() ? 'var(--soft-peach)' : 'var(--glass-bg)',
              color: inputText.trim() ? 'var(--base-bg)' : 'var(--text-dim)',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    backgroundColor: 'var(--base-bg)',
    position: 'relative'
  },
  notFoundContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100dvh',
    padding: '20px',
    textAlign: 'center'
  },
  notFoundIcon: {
    fontSize: '3rem',
    marginBottom: '20px'
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--secondary-bg)',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  backArrow: {
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    cursor: 'pointer',
    padding: '8px',
    marginRight: '12px',
    color: 'var(--soft-peach)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '44px',
    minHeight: '44px'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: 0
  },
  avatar: {
    width: '44px',
    height: '44px',
    borderRadius: '50%',
    marginRight: '12px',
    objectFit: 'cover',
    border: '2px solid var(--soft-peach)'
  },
  headerInfo: {
    minWidth: 0,
    flex: 1
  },
  name: {
    fontWeight: '600',
    fontSize: '1.1rem',
    color: 'var(--text-white)',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  status: {
    fontSize: '0.85rem',
    color: '#4CAF50',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  statusDot: {
    display: 'inline-block',
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#4CAF50'
  },
  messagesArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    backgroundColor: 'var(--base-bg)'
  },
  welcomeMessage: {
    textAlign: 'center',
    color: 'var(--text-dim)',
    marginTop: '40px',
    padding: '20px'
  },
  welcomeIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--glass-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '2.5rem'
  },
  welcomeTitle: {
    color: 'var(--soft-peach)',
    marginBottom: '8px'
  },
  welcomeText: {
    fontSize: '0.95rem',
    marginBottom: '4px'
  },
  messageContainer: {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '16px'
  },
  messageBubble: {
    maxWidth: '85%',
    padding: '12px 16px',
    borderRadius: '18px',
    position: 'relative',
    wordBreak: 'break-word',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  messageTime: {
    fontSize: '0.75rem',
    marginTop: '4px'
  },
  suggestionBanner: {
    padding: '12px 16px',
    backgroundColor: 'var(--secondary-bg)',
    borderTop: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  suggestionIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: 'var(--gold)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--base-bg)',
    fontSize: '1.2rem'
  },
  suggestionContent: {
    flex: 1
  },
  suggestionTitle: {
    fontWeight: '600',
    color: 'var(--gold)',
    fontSize: '0.9rem'
  },
  suggestionText: {
    color: 'var(--text-white)',
    fontSize: '0.95rem'
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: 'var(--text-dim)',
    padding: '4px'
  },
  inputArea: {
    padding: '12px 16px',
    borderTop: '1px solid var(--glass-border)',
    backgroundColor: 'var(--secondary-bg)',
    position: 'sticky',
    bottom: 0
  },
  inputForm: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  wingmanButton: {
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    fontSize: '1.3rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    flexShrink: 0,
    minWidth: '44px',
    minHeight: '44px'
  },
  messageInput: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '24px',
    border: '1px solid var(--glass-border)',
    fontSize: '1rem',
    backgroundColor: 'var(--base-bg)',
    color: 'var(--text-white)',
    outline: 'none',
    minWidth: '0'
  },
  sendButton: {
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    flexShrink: 0,
    minWidth: '44px',
    minHeight: '44px'
  }
};

export default Chat;
