// components/Chat.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { chatService, realtimeService, profilesService } from '../services/supabaseService';
import { wingmanService } from '../services/wingmanService';
import LoadingSpinner from './LoadingSpinner';

const Chat = ({ matchId, onBack }) => {
  const { userProfile, matches, setMatches, chats, setChats, subscription } = useUser();
  const [inputText, setInputText] = useState('');
  const [wingmanSuggestion, setWingmanSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [matchProfile, setMatchProfile] = useState(null);
  const [chatRoom, setChatRoom] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Find match from context or fetch if not available
  useEffect(() => {
    const loadMatchProfile = async () => {
      if (!matchId) return;
      
      // Try to find in existing matches
      const existingMatch = matches?.find(u => u.userId === matchId || u.id === matchId);
      
      if (existingMatch) {
        setMatchProfile(existingMatch);
      } else {
        // Fetch profile from Supabase
        try {
          const profile = await profilesService.getProfile(matchId);
          setMatchProfile({
            id: matchId,
            userId: matchId,
            alias: profile?.alias || 'Anonymous',
            name: profile?.name || 'Anonymous',
            photoUrl: profile?.photo_url,
            basics: profile?.basics || {},
            life: profile?.life || {}
          });
        } catch (err) {
          console.error('Error fetching match profile:', err);
        }
      }
    };

    loadMatchProfile();
  }, [matchId, matches]);

  // Load messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!userProfile?.id || !matchId) return;
      
      try {
        setLoading(true);
        
        // Get or create chat room
        const room = await chatService.getOrCreateChatRoom(userProfile.id, matchId);
        setChatRoom(room);
        
        // Load messages
        const loadedMessages = await chatService.getMessages(room.id);
        setMessages(loadedMessages);
        
        // Update global chats state
        setChats(prev => ({
          ...prev,
          [room.id]: loadedMessages
        }));
        
        // Mark messages as read
        await chatService.markMessagesAsRead(room.id, userProfile.id);
        
        // Subscribe to new messages
        const subscription = realtimeService.subscribeToMessages(room.id, (newMessage) => {
          setMessages(prev => [...prev, newMessage]);
          
          // Update global chats
          setChats(prev => ({
            ...prev,
            [room.id]: [...(prev[room.id] || []), newMessage]
          }));
          
          // Mark as read immediately if we're in the chat and it's from the other user
          if (newMessage.sender_id !== userProfile.id) {
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
  }, [userProfile?.id, matchId, setChats]);

  // Subscribe to typing indicators or presence (optional)
  useEffect(() => {
    if (!chatRoom?.id || !userProfile?.id) return;

    // You could implement typing indicators here
    // This is a placeholder for future enhancement

    return () => {};
  }, [chatRoom?.id, userProfile?.id]);

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
    if (!inputText.trim() || !userProfile?.id || !matchId || !chatRoom) return;

    const messageText = inputText.trim();
    setInputText(''); // Clear immediately for better UX

    try {
      // Send message
      const newMessage = await chatService.sendMessage(
        chatRoom.id,
        userProfile.id,
        messageText
      );
      
      // Update local state
      setMessages(prev => [...prev, newMessage]);
      
      // Update global chats
      setChats(prev => ({
        ...prev,
        [chatRoom.id]: [...(prev[chatRoom.id] || []), newMessage]
      }));
      
      setWingmanSuggestion(null);
      
      // Update matches with last message
      setMatches(prev => prev.map(m => 
        (m.id === chatRoom.id || m.userId === matchId)
          ? { ...m, lastMessage: messageText, lastMessageTime: newMessage.created_at }
          : m
      ));
      
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
      setInputText(messageText); // Restore text on error
    }
  };

  const handleWingman = () => {
    if (!subscription?.isPremium) {
      alert("✨ Wingman is a Premium feature! Upgrade to get AI-powered conversation suggestions, unlimited ripens, and more!");
      return;
    }

    const context = {};
    if (messages.length > 0) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.sender_id !== userProfile?.id) {
        context.lastMessage = lastMsg.content;
      }
    }

    const line = wingmanService.generateLine(userProfile, matchProfile, context);
    setWingmanSuggestion(line);
    setInputText(line);
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Group messages by date
  const groupedMessages = useCallback(() => {
    const groups = [];
    let currentDate = null;

    messages.forEach(msg => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ type: 'date', date: msgDate });
      }
      groups.push({ type: 'message', data: msg });
    });

    return groups;
  }, [messages]);

  if (loading) {
    return <LoadingSpinner message="Loading conversation..." />;
  }

  if (!matchProfile) {
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
        
        <div style={styles.headerContent} onClick={() => {/* Navigate to profile */}}>
          <img
            src={matchProfile.photo_url || matchProfile.photoUrl}
            alt={matchProfile.name || matchProfile.realName}
            style={styles.avatar}
            onError={(e) => {
              e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><circle cx="22" cy="22" r="22" fill="%23FF6347"/><text x="22" y="28" font-size="18" text-anchor="middle" fill="white">🍑</text></svg>';
            }}
          />
          <div style={styles.headerInfo}>
            <div style={styles.name}>{matchProfile.name || matchProfile.realName || matchProfile.alias}</div>
            <div style={styles.status}>
              <span style={styles.statusDot}></span>
              Online
            </div>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div style={styles.messagesArea} ref={messagesAreaRef}>
        {messages.length === 0 && (
          <div style={styles.welcomeMessage}>
            <div style={styles.welcomeIcon}>👋</div>
            <h3 style={styles.welcomeTitle}>
              Say hello to {matchProfile.name || matchProfile.realName || matchProfile.alias}!
            </h3>
            <p style={styles.welcomeText}>
              You matched because you both like{' '}
              <strong>{matchProfile.basics?.fun?.[0] || 'similar things'}</strong>.
            </p>
            {matchProfile.basics?.fun?.[1] && (
              <p style={styles.welcomeSubtext}>
                You also share interest in {matchProfile.basics.fun[1]}!
              </p>
            )}
          </div>
        )}

        {groupedMessages().map((item, index) => {
          if (item.type === 'date') {
            return (
              <div key={`date-${index}`} style={styles.dateDivider}>
                <span style={styles.dateText}>{item.date}</span>
              </div>
            );
          }

          const msg = item.data;
          const isMe = msg.sender_id === userProfile?.id;
          
          return (
            <div
              key={msg.id}
              style={{
                ...styles.messageContainer,
                alignItems: isMe ? 'flex-end' : 'flex-start'
              }}
            >
              {!isMe && (
                <img
                  src={matchProfile.photo_url || matchProfile.photoUrl}
                  alt="avatar"
                  style={styles.messageAvatar}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30"><circle cx="15" cy="15" r="15" fill="%23FF6347"/><text x="15" y="20" font-size="12" text-anchor="middle" fill="white">🍑</text></svg>';
                  }}
                />
              )}
              <div style={{
                ...styles.messageBubble,
                backgroundColor: isMe ? '#FF6347' : '#fff',
                color: isMe ? 'white' : '#333',
                border: isMe ? 'none' : '1px solid #e0e0e0',
                marginLeft: !isMe ? '8px' : '0',
                marginRight: isMe ? '8px' : '0'
              }}>
                {msg.content}
                <div style={{
                  ...styles.messageTime,
                  color: isMe ? 'rgba(255,255,255,0.7)' : '#888',
                  textAlign: isMe ? 'end' : 'start'
                }}>
                  {formatTime(msg.created_at)}
                  {isMe && msg.read && (
                    <span style={styles.readReceipt}> ✓✓</span>
                  )}
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
            placeholder={`Message ${matchProfile.name || matchProfile.alias}...`}
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

const messagesAreaRef = React.createRef();

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
    minWidth: 0,
    cursor: 'pointer'
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
  dateDivider: {
    textAlign: 'center',
    margin: '20px 0',
    position: 'relative'
  },
  dateText: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    color: '#666'
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
    marginBottom: '16px',
    position: 'relative'
  },
  messageAvatar: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    alignSelf: 'flex-end'
  },
  messageBubble: {
    maxWidth: '70%',
    padding: '10px 14px',
    borderRadius: '18px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
    position: 'relative',
    wordBreak: 'break-word',
    fontSize: '0.95rem',
    lineHeight: '1.4'
  },
  messageTime: {
    fontSize: '0.7rem',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    gap: '2px'
  },
  readReceipt: {
    fontSize: '0.7rem',
    marginLeft: '2px'
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
    gap: '8px',
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
    padding: '12px 16px',
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