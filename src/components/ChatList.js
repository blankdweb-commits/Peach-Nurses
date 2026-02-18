// components/ChatList.js
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { supabase } from '../services/supabase';
import { chatService, realtimeService, profilesService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';

const ChatList = ({ onSelectChat }) => {
  const { userProfile, matches, setMatches, chats, setChats } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [touchTimeout, setTouchTimeout] = useState(null);
  const [connectionError, setConnectionError] = useState(false);
  const subscriptionsRef = useRef([]);

  // Load chat rooms and messages
  useEffect(() => {
    const loadChats = async () => {
      if (!userProfile?.id) return;
      
      try {
        setLoading(true);
        setConnectionError(false);
        
        // Get user's chat rooms with error handling
        let rooms = [];
        try {
          rooms = await chatService.getUserChatRooms(userProfile.id) || [];
        } catch (roomError) {
          console.error('Error fetching chat rooms:', roomError);
          setConnectionError(true);
          setLoading(false);
          return;
        }
        
        // Load messages for each room and fetch match profiles
        const allMessages = {};
        const profiles = {};
        
        // Process rooms in parallel for better performance
        const roomPromises = rooms.map(async (room) => {
          try {
            // Get messages
            const messages = await chatService.getMessages(room.id) || [];
            allMessages[room.id] = messages;
            
            // Get the other participant's ID
            const otherUserId = room.participants.find(id => id !== userProfile.id);
            
            // Fetch their profile if not already loaded
            if (otherUserId && !profiles[otherUserId]) {
              try {
                const profile = await profilesService.getProfile(otherUserId);
                profiles[otherUserId] = profile;
              } catch (profileError) {
                console.error('Error fetching profile:', profileError);
                profiles[otherUserId] = {
                  alias: 'User',
                  name: 'Anonymous',
                  photo_url: null,
                  life: {},
                  basics: {}
                };
              }
            }
          } catch (roomError) {
            console.error('Error processing room:', roomError);
          }
        });
        
        await Promise.all(roomPromises);
        
        setChats(allMessages);
        
        // Update matches array if not already set
        if (!matches || matches.length === 0) {
          const matchList = rooms.map(room => {
            const otherUserId = room.participants.find(id => id !== userProfile.id);
            const profile = profiles[otherUserId] || {};
            return {
              id: room.id,
              userId: otherUserId,
              alias: profile?.alias || 'Anonymous',
              name: profile?.name || 'Anonymous',
              photoUrl: profile?.photo_url,
              lastMessage: room.last_message,
              lastMessageTime: room.last_message_at,
              life: profile?.life || {},
              basics: profile?.basics || {}
            };
          });
          setMatches(matchList);
        }
        
        // Subscribe to new messages for all rooms
        const newSubscriptions = rooms.map(room => {
          if (!room?.id) return null;
          
          try {
            return realtimeService.subscribeToMessages(room.id, (newMessage) => {
              // Update messages
              setChats(prev => {
                const existingMessages = prev[room.id] || [];
                // Avoid duplicates
                if (existingMessages.some(msg => msg.id === newMessage.id)) {
                  return prev;
                }
                return {
                  ...prev,
                  [room.id]: [...existingMessages, newMessage]
                };
              });
              
              // Update last message in matches
              setMatches(prev => prev.map(match => 
                match.id === room.id 
                  ? { ...match, lastMessage: newMessage.content, lastMessageTime: newMessage.created_at }
                  : match
              ));
            });
          } catch (subError) {
            console.error('Error subscribing to messages:', subError);
            return null;
          }
        }).filter(Boolean);
        
        // Store subscriptions for cleanup
        subscriptionsRef.current = newSubscriptions;
        
      } catch (error) {
        console.error('Error loading chats:', error);
        setConnectionError(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadChats();
    
    // Cleanup function
    return () => {
      subscriptionsRef.current.forEach(sub => {
        if (sub && sub.unsubscribe) {
          try {
            sub.unsubscribe();
          } catch (unsubError) {
            console.error('Error unsubscribing:', unsubError);
          }
        }
      });
      subscriptionsRef.current = [];
    };
  }, [userProfile?.id, setChats, setMatches, matches]);

  // Subscribe to new matches (ripen_history)
  useEffect(() => {
    if (!userProfile?.id) return;

    let subscription;
    
    try {
      subscription = supabase
        .channel('new_matches')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'ripen_history',
            filter: `target_user_id=eq.${userProfile.id}`
          },
          async (payload) => {
            try {
              // Check if it's a mutual match
              const isMutual = await chatService.checkMutualMatch(
                userProfile.id,
                payload.new.user_id
              );

              if (isMutual) {
                // Get or create chat room
                const room = await chatService.getOrCreateChatRoom(
                  userProfile.id,
                  payload.new.user_id
                );

                // Fetch matched user's profile
                let profile = { alias: 'Anonymous', name: 'Anonymous', photo_url: null, life: {}, basics: {} };
                try {
                  profile = await profilesService.getProfile(payload.new.user_id) || profile;
                } catch (profileError) {
                  console.error('Error fetching new match profile:', profileError);
                }

                // Add to matches
                const newMatch = {
                  id: room.id,
                  userId: payload.new.user_id,
                  alias: profile?.alias || 'Anonymous',
                  name: profile?.name || 'Anonymous',
                  photoUrl: profile?.photo_url,
                  lastMessage: null,
                  lastMessageTime: null,
                  matchedAt: new Date().toISOString(),
                  life: profile?.life || {},
                  basics: profile?.basics || {}
                };

                setMatches(prev => [newMatch, ...prev]);
              }
            } catch (matchError) {
              console.error('Error processing new match:', matchError);
            }
          }
        )
        .subscribe();
    } catch (subError) {
      console.error('Error subscribing to matches:', subError);
    }

    return () => {
      if (subscription) {
        try {
          subscription.unsubscribe();
        } catch (unsubError) {
          console.error('Error unsubscribing from matches:', unsubError);
        }
      }
    };
  }, [userProfile?.id, setMatches]);

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
    
    try {
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
    } catch (e) {
      return 'New match';
    }
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
      // Find the match to get the userId
      const match = matches.find(m => m.id === matchId);
      if (!match) return;
      
      // Mark messages as read when opening chat
      const roomId = [userProfile.id, match.userId].sort().join('_');
      await chatService.markMessagesAsRead(roomId, userProfile.id);
      onSelectChat(match.userId);
    } catch (error) {
      console.error('Error marking messages as read:', error);
      onSelectChat(matchId);
    }
  };

  // Safe image URL handler with fallback
  const getSafeImageUrl = (url) => {
    if (!url) return null;
    // Only allow specific domains to prevent CORS issues
    if (url.includes('supabase.co')) {
      return url;
    }
    // For external URLs, return null to use fallback avatar
    return null;
  };

  if (loading) {
    return <LoadingSpinner message="Loading your chats..." />;
  }

  if (connectionError) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h3 style={styles.errorTitle}>Connection Error</h3>
        <p style={styles.errorText}>
          Unable to load your chats. Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
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
              const imageUrl = getSafeImageUrl(match.photo_url || match.photoUrl);

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
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={match.alias || 'User'}
                        style={styles.avatar}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                          // Show fallback text avatar
                          const parent = e.target.parentElement;
                          if (parent) {
                            const fallback = document.createElement('div');
                            fallback.style.cssText = `
                              width: 56px;
                              height: 56px;
                              border-radius: 50%;
                              background-color: #FF6347;
                              display: flex;
                              align-items: center;
                              justify-content: center;
                              color: white;
                              font-size: 1.5rem;
                            `;
                            fallback.textContent = match.alias?.charAt(0).toUpperCase() || '🍑';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                    ) : (
                      <div style={{
                        ...styles.avatar,
                        backgroundColor: '#FF6347',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '1.5rem'
                      }}>
                        {match.alias?.charAt(0).toUpperCase() || '🍑'}
                      </div>
                    )}
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
  errorContainer: {
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
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  emptyTitle: {
    color: '#FF6347',
    marginBottom: '12px'
  },
  errorTitle: {
    color: '#ff4444',
    marginBottom: '12px'
  },
  emptyText: {
    color: '#666',
    marginBottom: '24px',
    maxWidth: '300px'
  },
  errorText: {
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
  retryButton: {
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
    flexShrink: 0,
    width: '56px',
    height: '56px'
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