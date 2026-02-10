import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useUser } from '../context/UserContext';

const ChatList = ({ onSelectChat }) => {
  const { rippedMatches, potentialMatches, chats } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [touchTimeout, setTouchTimeout] = useState(null);

  // Filter potential matches to find only those who are ripped - useMemo to prevent recalculations
  const matches = useMemo(() => 
    potentialMatches.filter(user => rippedMatches.includes(user.id)), 
    [potentialMatches, rippedMatches]
  );

  // Filter matches based on search query - useMemo to prevent recalculations
  const filteredMatches = useMemo(() => {
    if (searchQuery.trim() === '') {
      return matches;
    } else {
      const query = searchQuery.toLowerCase();
      return matches.filter(match =>
        match.realName?.toLowerCase().includes(query) ||
        match.alias?.toLowerCase().includes(query) ||
        (chats[match.id]?.some(msg => 
          msg.text?.toLowerCase().includes(query)
        ))
      );
    }
  }, [searchQuery, matches, chats]);

  const getLastMessageTime = useCallback((matchId) => {
    const matchChats = chats[matchId];
    if (!matchChats || matchChats.length === 0) return null;
    return matchChats[matchChats.length - 1].timestamp;
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
    if (!matchChats) return 0;
    return matchChats.filter(msg => msg.sender === 'them' && !msg.read).length;
  }, [chats]);

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

  if (matches.length === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        minBlockSize: '60dvh'
      }}>
        <div style={{
          inlineSize: '100px',
          blockSize: '100px',
          borderRadius: '50%',
          backgroundColor: '#FFF0E6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '3rem',
          marginBlockEnd: '20px'
        }}>
          🍑
        </div>
        <h3 style={{ color: '#FF6347', marginBlockEnd: '12px' }}>
          No Chats Yet
        </h3>
        <p style={{ color: '#666', marginBlockEnd: '24px', maxInlineSize: '300px' }}>
          Go to Discover and ripen some matches to start chatting!
        </p>
        <button
          onClick={() => window.location.href = '/discover'}
          style={{
            padding: '12px 24px',
            background: '#FF6347',
            color: 'white',
            border: 'none',
            borderRadius: '25px',
            cursor: 'pointer',
            fontSize: '1rem',
            fontWeight: '600'
          }}
        >
          Go to Discover
        </button>
      </div>
    );
  }

  return (
    <div style={{
      maxInlineSize: '600px',
      margin: '0 auto',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      blockSize: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#fff'
    }}>
      {/* Header */}
      <header style={{
        padding: '16px',
        borderBlockEnd: '1px solid #eee',
        backgroundColor: '#fff',
        position: 'sticky',
        insetBlockStart: 0,
        zIndex: 10
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#FF6347',
          marginBlockEnd: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span>Your Peaches</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            inlineSize: '24px',
            blockSize: '24px',
            borderRadius: '50%',
            backgroundColor: '#FF6347',
            color: 'white',
            fontSize: '0.8rem'
          }}>
            {matches.length}
          </span>
        </h1>
        
        {/* Search Bar */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              inlineSize: '100%',
              padding: '12px 16px 12px 44px',
              borderRadius: '24px',
              border: '1px solid #ddd',
              fontSize: '1rem',
              backgroundColor: '#f9f9f9',
              outline: 'none'
            }}
          />
          <div style={{
            position: 'absolute',
            insetBlockStart: '50%',
            insetInlineStart: '16px',
            transform: 'translateY(-50%)',
            color: '#999'
          }}>
            🔍
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                insetBlockStart: '50%',
                insetInlineEnd: '16px',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: '1.2rem',
                cursor: 'pointer',
                color: '#999'
              }}
              aria-label="Clear search"
            >
              ×
            </button>
          )}
        </div>
      </header>

      {/* Chat List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '8px'
      }}>
        {searchQuery && filteredMatches.length === 0 ? (
          <div style={{
            padding: '40px 20px',
            textAlign: 'center',
            color: '#666'
          }}>
            <div style={{ fontSize: '2rem', marginBlockEnd: '16px' }}>🔍</div>
            <p>No chats found matching "{searchQuery}"</p>
          </div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {(searchQuery ? filteredMatches : matches).map(match => {
              const lastMessage = chats[match.id] && chats[match.id].length > 0
                ? chats[match.id][chats[match.id].length - 1].text
                : "Say hello! 👋";
              
              const lastMessageTime = getLastMessageTime(match.id);
              const unreadCount = getUnreadCount(match.id);
              const isOnline = match.isOnline || false;

              return (
                <li
                  key={match.id}
                  onClick={() => onSelectChat(match.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px',
                    borderBlockEnd: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    position: 'relative',
                    gap: '12px',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    if (e.currentTarget) {
                      e.currentTarget.style.background = '#f9f9f9';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (e.currentTarget) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  {/* Avatar with Online Indicator */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={match.photoUrl}
                      alt={match.alias || 'User'}
                      style={{
                        inlineSize: '56px',
                        blockSize: '56px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="28" fill="%23FF6347"/><text x="28" y="35" font-size="24" text-anchor="middle" fill="white">🍑</text></svg>';
                      }}
                    />
                    {isOnline && (
                      <div style={{
                        position: 'absolute',
                        insetBlockEnd: '0',
                        insetInlineEnd: '0',
                        inlineSize: '14px',
                        blockSize: '14px',
                        borderRadius: '50%',
                        backgroundColor: '#4CAF50',
                        border: '2px solid #fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                      }} />
                    )}
                  </div>

                  {/* Chat Info */}
                  <div style={{ flex: 1, minInlineSize: 0 }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBlockEnd: '4px'
                    }}>
                      <span style={{
                        fontWeight: '600',
                        fontSize: '1rem',
                        color: '#333',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {match.realName || 'Anonymous'}
                      </span>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexShrink: 0
                      }}>
                        {match.level && (
                          <span style={{
                            fontSize: '0.75rem',
                            color: '#666',
                            backgroundColor: '#f0f0f0',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            {match.level}
                          </span>
                        )}
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#999'
                        }}>
                          {formatLastSeen(lastMessageTime)}
                        </span>
                      </div>
                    </div>
                    
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBlockEnd: '4px'
                    }}>
                      <div style={{
                        fontSize: '0.9rem',
                        color: unreadCount > 0 ? '#333' : '#666',
                        fontWeight: unreadCount > 0 ? '500' : '400',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        flex: 1
                      }}>
                        {lastMessage}
                      </div>
                    </div>
                    
                    {/* Common Interests */}
                    {match.basics?.fun?.[0] && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        marginBlockStart: '4px'
                      }}>
                        <span style={{
                          fontSize: '0.75rem',
                          color: '#FF6347',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          ❤️
                          <span style={{ color: '#999' }}>
                            Likes {match.basics.fun[0]}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Unread Badge */}
                  {unreadCount > 0 && (
                    <div style={{
                      inlineSize: '20px',
                      blockSize: '20px',
                      borderRadius: '50%',
                      backgroundColor: '#FF6347',
                      color: 'white',
                      fontSize: '0.7rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '600',
                      flexShrink: 0
                    }}>
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* CSS for Responsive Design */}
      <style jsx="true">{`
        @media (max-width: 480px) {
          .chat-list-container {
            max-inline-size: 100% !important;
          }
          
          header {
            padding: 12px !important;
          }
          
          h1 {
            font-size: 1.3rem !important;
          }
          
          .chat-item {
            padding: 10px !important;
          }
          
          .avatar {
            inline-size: 48px !important;
            block-size: 48px !important;
          }
          
          .last-message {
            font-size: 0.85rem !important;
          }
        }

        @media (max-width: 768px) {
          .chat-list-container {
            max-inline-size: 100% !important;
          }
        }

        /* Improve touch targets */
        li {
          min-block-size: 72px !important;
        }
        
        /* Better scroll on mobile */
        .chat-list {
          -webkit-overflow-scrolling: touch;
        }

        /* Remove tap highlight */
        button, li {
          -webkit-tap-highlight-color: transparent;
        }
      `}</style>
    </div>
  );
};

export default ChatList;
