// components/ChatList.js
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { chatService, realtimeService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';

const ChatList = ({ onSelectChat }) => {
  const { userProfile, matches, setMatches, chats, setChats } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [chatRooms, setChatRooms] = useState([]);
  const [touchTimeout, setTouchTimeout] = useState(null);

  // Load chat rooms and messages
  useEffect(() => {
    const loadChats = async () => {
      if (!userProfile?.id) return;
      
      try {
        setLoading(true);
        
        // Get user's chat rooms
        const rooms = await chatService.getUserChatRooms(userProfile.id);
        setChatRooms(rooms);
        
        // Load messages for each room
        const allMessages = {};
        for (const room of rooms) {
          const messages = await chatService.getMessages(room.id);
          allMessages[room.id] = messages;
        }
        
        setChats(allMessages);
        
        // Subscribe to new messages
        const subscriptions = rooms.map(room => 
          realtimeService.subscribeToMessages(room.id, (newMessage) => {
            setChats(prev => ({
              ...prev,
              [room.id]: [...(prev[room.id] || []), newMessage]
            }));
          })
        );
        
        return () => {
          subscriptions.forEach(sub => sub.unsubscribe());
        };
      } catch (error) {
        console.error('Error loading chats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
  }, [userProfile?.id, setChats]);

  // Filter matches based on search query
  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    
    if (searchQuery.trim() === '') {
      return matches;
    } else {
      const query = searchQuery.toLowerCase();
      return matches.filter(match =>
        match.name?.toLowerCase().includes(query) ||
        match.alias?.toLowerCase().includes(query) ||
        (chats[match.id]?.some(msg => 
          msg.content?.toLowerCase().includes(query)
        ))
      );
    }
  }, [searchQuery, matches, chats]);

  const getLastMessage = useCallback((matchId) => {
    const matchChats = chats[matchId];
    if (!matchChats || matchChats.length === 0) return null;
    return matchChats[matchChats.length - 1];
  }, [chats]);

  const formatLastSeen = useCallback((timestamp) => {
    if (!timestamp) return 'New match';
    
    const now = new Date();
    const lastMsgDate = new Date(timestamp);
    const diffMs = now - lastMsgDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return lastMsgDate.toLocaleDateString();
  }, []);

  const getUnreadCount = useCallback((matchId) => {
    const matchChats = chats[matchId];
    if (!matchChats || !userProfile?.id) return 0;
    return matchChats.filter(msg => 
      msg.sender_id !== userProfile.id && !msg.read
    ).length;
  }, [chats, userProfile?.id]);

  const handleTouchStart = useCallback((e) => {
    const target = e.currentTarget;
    if (target) {
      target.style.background = '#f0f0f0';
    }
  }, []);

  const handleTouchEnd = useCallback((e) => {
    if (touchTimeout) {
      clearTimeout(touchTimeout);
    }
    
    const newTimeout = setTimeout(() => {
      const target = e.currentTarget;
      if (target) {
        target.style.background = 'transparent';
      }
    }, 150);
    
    setTouchTimeout(newTimeout);
  }, [touchTimeout]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (touchTimeout) {
        clearTimeout(touchTimeout);
      }
    };
  }, [touchTimeout]);

  const handleSelectChat = async (matchId) => {
    try {
      // Mark messages as read when opening chat
      const roomId = [userProfile.id, matchId].sort().join('_');
      await chatService.markMessagesAsRead(roomId, userProfile.id);
      onSelectChat(matchId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      onSelectChat(matchId);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading your chats..." />;
  }

  if (!matches || matches.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🍑</div>
        <h3 style={styles.emptyTitle}>No Chats Yet</h3>
        <p style={styles.emptyText}>
          Go to Discover and ripen some matches to start chatting!
        </p>
        <button
          onClick={() => window.location.href = '/discover'}
          style={styles.discoverButton}
        >
          Go to Discover
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <h1 style={styles.headerTitle}>
          <span>Your Peaches</span>
          <span style={styles.matchCount}>
            {matches.length}
          </span>
        </h1>
        
        {/* Search Bar */}
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          <span style={styles.searchIcon}>🔍</span>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={styles.clearSearch}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {/* Chat List */}
      <div style={styles.chatList}>
        {searchQuery && filteredMatches.length === 0 ? (
          <div style={styles.noResults}>
            <div style={styles.noResultsIcon}>🔍</div>
            <p>No chats found matching "{searchQuery}"</p>
          </div>
        ) : (
          <ul style={styles.chatListUl}>
            {(searchQuery ? filteredMatches : matches).map(match => {
              const lastMessage = getLastMessage(match.id);
              const lastMessageContent = lastMessage?.content || "Say hello! 👋";
              const lastMessageTime = lastMessage?.created_at;
              const unreadCount = getUnreadCount(match.id);

              return (
                <li
                  key={match.id}
                  onClick={() => handleSelectChat(match.id)}
                  style={styles.chatItem}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#f9f9f9';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Avatar */}
                  <div style={styles.avatarContainer}>
                    <img
                      src={match.photo_url || match.photoUrl}
                      alt={match.alias || 'User'}
                      style={styles.avatar}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="%23FF6347"/><text x="28" y="35" font-size="24" text-anchor="middle" fill="white">🍑</text></svg>';
                      }}
                    />
                  </div>

                  {/* Chat Info */}
                  <div style={styles.chatInfo}>
                    <div style={styles.chatHeader}>
                      <span style={styles.chatName}>
                        {match.name || match.realName || 'Anonymous'}
                      </span>
                      <div style={styles.chatMeta}>
                        {match.life?.level && (
                          <span style={styles.levelBadge}>
                            {match.life.level}
                          </span>
                        )}
                        <span style={styles.chatTime}>
                          {formatLastSeen(lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    
                    <div style={styles.messagePreview}>
                      <span style={{
                        ...styles.messageText,
                        fontWeight: unreadCount > 0 ? 500 : 400,
                        color: unreadCount > 0 ? '#333' : '#666'
                      }}>
                        {lastMessageContent}
                      </span>
                    </div>
                    
                    {/* Common Interests */}
                    {match.basics?.fun?.[0] && (
                      <div style={styles.interests}>
                        <span style={styles.interestIcon}>❤️</span>
                        <span style={styles.interestText}>
                          Likes {match.basics.fun[0]}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {unreadCount > 0 && (
                    <div style={styles.unreadBadge}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <style jsx="true">{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @media (max-width: 480px) {
          h1 { font-size: 1.3rem !important; }
          .avatar { width: 48px !important; height: 48px !important; }
          .message-text { font-size: 0.85rem !important; }
          li { min-height: 72px !important; }
        }
        
        .chat-list {
          -webkit-overflow-scrolling: touch;
        }
        
        button, li {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    height: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#fff',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center',
    minHeight: '60dvh'
  },
  emptyIcon: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    backgroundColor: '#FFF0E6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3rem',
    marginBottom: '20px'
  },
  emptyTitle: {
    color: '#FF6347',
    marginBottom: '12px'
  },
  emptyText: {
    color: '#666',
    marginBottom: '24px',
    maxWidth: '300px'
  },
  discoverButton: {
    padding: '12px 24px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  header: {
    padding: '16px',
    borderBottom: '1px solid #eee',
    backgroundColor: '#fff',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerTitle: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#FF6347',
    marginBottom: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  matchCount: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    backgroundColor: '#FF6347',
    color: 'white',
    fontSize: '0.8rem'
  },
  searchContainer: {
    position: 'relative'
  },
  searchInput: {
    width: '100%',
    padding: '12px 16px 12px 44px',
    borderRadius: '24px',
    border: '1px solid #ddd',
    fontSize: '1rem',
    backgroundColor: '#f9f9f9',
    outline: 'none',
    boxSizing: 'border-box'
  },
  searchIcon: {
    position: 'absolute',
    top: '50%',
    left: '16px',
    transform: 'translateY(-50%)',
    color: '#999'
  },
  clearSearch: {
    position: 'absolute',
    top: '50%',
    right: '16px',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#999'
  },
  chatList: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px'
  },
  chatListUl: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  chatItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.2s',
    gap: '12px',
    minHeight: '72px'
  },
  avatarContainer: {
    position: 'relative',
    flexShrink: 0
  },
  avatar: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    objectFit: 'cover',
    border: '2px solid #fff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  chatInfo: {
    flex: 1,
    minWidth: 0
  },
  chatHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '4px'
  },
  chatName: {
    fontWeight: '600',
    fontSize: '1rem',
    color: '#333',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  chatMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0
  },
  levelBadge: {
    fontSize: '0.75rem',
    color: '#666',
    backgroundColor: '#f0f0f0',
    padding: '2px 8px',
    borderRadius: '12px'
  },
  chatTime: {
    fontSize: '0.75rem',
    color: '#999'
  },
  messagePreview: {
    marginBottom: '4px'
  },
  messageText: {
    fontSize: '0.9rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    display: 'block'
  },
  interests: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginTop: '4px'
  },
  interestIcon: {
    fontSize: '0.75rem',
    color: '#FF6347'
  },
  interestText: {
    fontSize: '0.75rem',
    color: '#999'
  },
  unreadBadge: {
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#FF6347',
    color: 'white',
    fontSize: '0.7rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '600',
    flexShrink: 0
  },
  noResults: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#666'
  },
  noResultsIcon: {
    fontSize: '2rem',
    marginBottom: '16px'
  }
};

export default ChatList;