// components/Chat.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { chatService, realtimeService } from '../services/supabaseService';
import { wingmanService } from '../services/wingmanService';
import LoadingSpinner from './LoadingSpinner';

const Chat = ({ matchId, onBack }) => {
  const { userProfile, matches, chats, setChats, subscription } = useUser();
  const [inputText, setInputText] = useState('');
  const [wingmanSuggestion, setWingmanSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const match = matches?.find(u => u.id === matchId);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!userProfile?.id || !matchId) return;
      
      try {
        setLoading(true);
        
        // Get or create chat room
        const room = await chatService.getOrCreateChatRoom(userProfile.id, matchId);
        
        // Load messages
        const loadedMessages = await chatService.getMessages(room.id);
        setMessages(loadedMessages);
        
        // Mark messages as read
        await chatService.markMessagesAsRead(room.id, userProfile.id);
        
        // Subscribe to new messages
        const subscription = realtimeService.subscribeToMessages(room.id, (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
          if (newMessage.sender_id !== userProfile.id) {
            // Mark as read immediately if we're in the chat
            chatService.markMessagesAsRead(room.id, userProfile.id);
          }
        });
        
        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadMessages();
  }, [userProfile?.id, matchId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !userProfile?.id || !matchId) return;

    try {
      const roomId = [userProfile.id, matchId].sort().join('_');
      
      // Send message
      const newMessage = await chatService.sendMessage(
        roomId,
        userProfile.id,
        inputText.trim()
      );
      
      // Update local state
      setMessages(prev => [...prev, newMessage]);
      setInputText('');
      setWingmanSuggestion(null);
      
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    }
  };

  const handleWingman = () => {
    if (!subscription?.isPremium) {
      alert("Wingman is a Premium feature! Upgrade to get AI-powered conversation help.");
      return;
    }

    const context = {};
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_id !== userProfile?.id) {
        context.lastMessage = lastMsg.content;
      }
    }

    const line = wingmanService.generateLine(userProfile, match, context);
    setWingmanSuggestion(line);
    setInputText(line);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return <LoadingSpinner message="Loading conversation..." />;
  }

  if (!match) {
    return (
      <div style={styles.notFoundContainer}>
        <div style={styles.notFoundIcon}>🍑</div>
        <h2>Match not found</h2>
        <p>This chat may have been removed or the user is no longer available.</p>
        <button onClick={onBack} style={styles.backButton}>
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
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
            alt={match.name || match.realName}
            style={styles.avatar}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23FF6347"/><text x="22" y="28" font-size="18" text-anchor="middle" fill="white">🍑</text></svg>';
            }}
          />
          <div style={styles.headerInfo}>
            <div style={styles.name}>{match.name || match.realName}</div>
            <div style={styles.status}>
              <span style={styles.statusDot}></span>
              Online
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div style={styles.messagesArea}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            <div style={styles.welcomeIcon}>👋</div>
            <h3 style={styles.welcomeTitle}>
              Say hello to {match.name || match.realName}!
            </h3>
            <p style={styles.welcomeText}>
              You matched because you both like{' '}
              <strong>{match.basics?.fun?.[0] || 'similar things'}</strong>.
            </p>
            {match.basics?.fun?.[1] && (
              <p style={styles.welcomeSubtext}>
                You also share interest in {match.basics.fun[1]}!
              </p>
            )}
          </div>
        )}

        {messages.map((msg) => {
          const isMe = msg.sender_id === userProfile?.id;
          
          return (
            <div
              key={msg.id}
              style={{
                ...styles.messageContainer,
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              <div style={{
                ...styles.messageBubble,
                backgroundColor: isMe ? '#FF6347' : '#fff',
                color: isMe ? 'white' : '#333',
                border: isMe ? 'none' : '1px solid #e0e0e0'
              }}>
                {msg.content}
                <div style={{
                  ...styles.messageTime,
                  color: isMe ? 'rgba(255,255,255,0.7)' : '#888',
                  textAlign: isMe ? 'end' : 'start'
                }}>
                  {formatTime(msg.created_at)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Wingman Suggestion */}
      {wingmanSuggestion && (
        <div style={styles.suggestionBanner}>
          <div style={styles.suggestionIcon}>🦜</div>
          <div style={styles.suggestionContent}>
            <div style={styles.suggestionTitle}>Wingman Suggestion</div>
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

      {/* Input Area */}
      <div style={styles.inputArea}>
        <form onSubmit={handleSend} style={styles.inputForm}>
          <button
            type="button"
            onClick={handleWingman}
            title="Get Wingman suggestion"
            style={{
              ...styles.wingmanButton,
              background: subscription?.isPremium ? '#0288D1' : '#e0e0e0',
              cursor: subscription?.isPremium ? 'pointer' : 'not-allowed'
            }}
          >
            🦜
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
              background: inputText.trim() ? '#FF6347' : '#e0e0e0',
              cursor: inputText.trim() ? 'pointer' : 'not-allowed'
            }}
          >
            ➤
          </button>
        </form>
      </div>

      <style jsx="true">{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.5; }
          100% { opacity: 1; }
        }
        
        @media (max-width: 480px) {
          .avatar { width: 36px !important; height: 36px !important; }
          .message-bubble { max-width: 85% !important; }
          .back-arrow { font-size: 1.5rem !important; }
        }
      `}</style>
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
    backgroundColor: '#fff',
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
  backButton: {
    marginTop: '20px',
    padding: '12px 24px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  header: {
    padding: '12px 16px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10,
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)'
  },
  backArrow: {
    background: 'none',
    border: 'none',
    fontSize: '1.8rem',
    cursor: 'pointer',
    padding: '8px',
    marginRight: '12px',
    color: '#FF6347',
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
    border: '2px solid #FF6347'
  },
  headerInfo: {
    minWidth: 0,
    flex: 1
  },
  name: {
    fontWeight: '600',
    fontSize: '1.1rem',
    color: '#333',
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
    backgroundColor: '#4CAF50',
    animation: 'pulse 2s infinite'
  },
  messagesArea: {
    flex: 1,
    padding: '16px',
    overflowY: 'auto',
    backgroundColor: '#f8f8f8',
    backgroundImage: 'linear-gradient(rgba(255, 99, 71, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 99, 71, 0.03) 1px, transparent 1px)',
    backgroundSize: '20px 20px'
  },
  welcomeMessage: {
    textAlign: 'center',
    color: '#666',
    marginTop: '40px',
    padding: '20px'
  },
  welcomeIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#FFF0E6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px',
    fontSize: '2.5rem'
  },
  welcomeTitle: {
    color: '#FF6347',
    marginBottom: '8px'
  },
  welcomeText: {
    fontSize: '0.95rem',
    marginBottom: '4px'
  },
  welcomeSubtext: {
    fontSize: '0.9rem',
    color: '#888'
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
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'relative',
    wordBreak: 'break-word'
  },
  messageTime: {
    fontSize: '0.75rem',
    marginTop: '4px'
  },
  suggestionBanner: {
    padding: '12px 16px',
    backgroundColor: '#E1F5FE',
    borderTop: '1px solid #B3E5FC',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  suggestionIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#0288D1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '1.2rem'
  },
  suggestionContent: {
    flex: 1
  },
  suggestionTitle: {
    fontWeight: '600',
    color: '#01579B',
    fontSize: '0.9rem'
  },
  suggestionText: {
    color: '#0277BD',
    fontSize: '0.95rem'
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    color: '#0288D1',
    padding: '4px'
  },
  inputArea: {
    padding: '12px 16px',
    borderTop: '1px solid #eee',
    backgroundColor: '#fff',
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
    transition: 'transform 0.2s',
    minWidth: '44px',
    minHeight: '44px'
  },
  messageInput: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '24px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    backgroundColor: '#f9f9f9',
    outline: 'none',
    minWidth: '0'
  },
  sendButton: {
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '44px',
    height: '44px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.3rem',
    flexShrink: 0,
    transition: 'background 0.2s, transform 0.2s',
    minWidth: '44px',
    minHeight: '44px'
  }
};

export default Chat;