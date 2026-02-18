// components/Discover.js
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useUser } from '../context/UserContext';
import { supabase } from '../services/supabase';
import { profilesService, ripenService, chatService } from '../services/supabaseService';
import AdBanner from './AdBanner';

const Discover = ({ onNavigateToStore, onNavigateToSettings, onNavigateToChats }) => {
  const { userProfile, subscription, ripenMatch, incrementAdsSeen, matches, setMatches } = useUser();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [notification, setNotification] = useState(null);
  const [actionsSinceAd, setActionsSinceAd] = useState(0);
  const [showAd, setShowAd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [rotateAngle, setRotateAngle] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [ripenHistory, setRipenHistory] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const cardRef = useRef(null);

  // Fetch user's current location
  useEffect(() => {
    const fetchLocation = async () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setUserLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            console.error('Geolocation error:', error);
            // Fallback to default location (Delta State)
            setUserLocation({ latitude: 5.5380, longitude: 5.7600 });
          },
          { timeout: 10000, enableHighAccuracy: false }
        );
      } else {
        setUserLocation({ latitude: 5.5380, longitude: 5.7600 });
      }
    };
    
    fetchLocation();
  }, []);

  // Fetch user's ripen history
  useEffect(() => {
    const fetchRipenHistory = async () => {
      if (!userProfile?.id) return;
      
      try {
        const history = await ripenService.getRipenHistory(userProfile.id);
        setRipenHistory(history || []);
      } catch (err) {
        console.error('Error fetching ripen history:', err);
        setRipenHistory([]);
      }
    };

    fetchRipenHistory();
  }, [userProfile?.id]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return Math.round(distance * 10) / 10;
  }, []);

  // Calculate compatibility score
  const calculateCompatibility = useCallback((user, match) => {
    if (!user || !match) return 0;
    
    const userBasics = user.basics || { fun: [], media: [] };
    const userRelationships = user.relationships || { values: [], lookingFor: '' };
    const userLife = user.life || { based: '' };

    const matchBasics = match.basics || { fun: [], media: [] };
    const matchRelationships = match.relationships || { values: [], lookingFor: '' };
    const matchLife = match.life || { based: '' };

    const userFun = userBasics.fun || [];
    const userMedia = userBasics.media || [];
    const userValues = userRelationships.values || [];

    const matchFun = matchBasics.fun || [];
    const matchMedia = matchBasics.media || [];
    const matchValues = matchRelationships.values || [];

    const commonFun = userFun.filter(f => matchFun.includes(f));
    const commonMedia = userMedia.filter(m => matchMedia.includes(m));
    const commonValues = userValues.filter(v => matchValues.includes(v));

    let score = 0;
    score += Math.min(commonFun.length * 7, 20);
    score += Math.min(commonMedia.length * 7, 20);
    score += Math.min(commonValues.length * 10, 30);

    if (userLife.based && matchLife.based && userLife.based === matchLife.based) score += 20;
    if (userRelationships.lookingFor && matchRelationships.lookingFor && 
        userRelationships.lookingFor === matchRelationships.lookingFor) score += 10;

    return Math.min(Math.round(score), 100);
  }, []);

  // Fetch potential matches from Supabase - only once
  const fetchPotentialMatches = useCallback(async () => {
    if (!userProfile?.id || hasFetched) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all profiles except current user
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userProfile.id)
        .eq('onboarding_complete', true)
        .eq('banned', false);

      if (error) throw error;

      if (!profiles || profiles.length === 0) {
        setPotentialMatches([]);
        setHasFetched(true);
        setLoading(false);
        return;
      }

      // Filter out already ripened users
      const filteredProfiles = profiles.filter(profile => 
        !ripenHistory.includes(profile.id)
      );

      // Enrich matches with distance and compatibility
      const enrichedMatches = filteredProfiles.map(profile => {
        let distance = null;
        
        if (userLocation && profile.location) {
          distance = calculateDistance(
            userLocation.latitude,
            userLocation.longitude,
            profile.location.latitude || 5.5380,
            profile.location.longitude || 5.7600
          );
        }

        return {
          id: profile.id,
          alias: profile.alias || profile.name || 'Anonymous',
          realName: profile.name || 'Anonymous',
          level: profile.level || 'Nurse',
          photoUrl: profile.photo_url,
          distance,
          basics: profile.basics || { fun: [], media: [] },
          life: profile.life || { based: 'Delta', upbringing: '' },
          work: { job: profile.job || 'Nurse' },
          relationships: profile.relationships || { values: [], lookingFor: '' },
          vision: profile.vision || '',
          special: profile.special || ''
        };
      });

      // Sort by compatibility score
      const sortedMatches = enrichedMatches.sort((a, b) => {
        const scoreA = calculateCompatibility(userProfile, a);
        const scoreB = calculateCompatibility(userProfile, b);
        return scoreB - scoreA;
      });

      console.log('Loaded matches:', sortedMatches.length);
      setPotentialMatches(sortedMatches);
      setHasFetched(true);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load potential matches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userProfile, userLocation, calculateCompatibility, ripenHistory, hasFetched]);

  // Load matches when component mounts
  useEffect(() => {
    if (userProfile && !hasFetched) {
      fetchPotentialMatches();
    }
  }, [userProfile, fetchPotentialMatches, hasFetched]);

  // Set up real-time subscription for new matches
  useEffect(() => {
    if (!userProfile?.id) return;

    const subscription = supabase
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
            const isMutual = await ripenService.checkMutualMatch(
              userProfile.id,
              payload.new.user_id
            );

            if (isMutual) {
              const room = await chatService.getOrCreateChatRoom(
                userProfile.id,
                payload.new.user_id
              );

              const profile = await profilesService.getProfile(payload.new.user_id);

              const newMatch = {
                id: room.id,
                userId: payload.new.user_id,
                alias: profile?.alias || 'Anonymous',
                name: profile?.name || 'Anonymous',
                photoUrl: profile?.photo_url,
                matchedAt: new Date().toISOString(),
                life: profile?.life || {},
                basics: profile?.basics || {}
              };

              setMatches(prev => [newMatch, ...prev]);
              
              setNotification(`🎉 It's a match with ${profile?.alias || 'someone'}!`);
              setTimeout(() => setNotification(null), 3000);
            }
          } catch (matchError) {
            console.error('Error processing new match:', matchError);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [userProfile?.id, setMatches]);

  // Show instructions after loading
  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenDiscoverInstructions');
    if (!hasSeenInstructions && !loading && potentialMatches.length > 0 && userProfile) {
      const timer = setTimeout(() => {
        setShowInstructions(true);
        localStorage.setItem('hasSeenDiscoverInstructions', 'true');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [loading, potentialMatches.length, userProfile]);

  // Filter deck
  const deck = useMemo(() => {
    return potentialMatches.filter(u => !u.banned);
  }, [potentialMatches]);

  const currentMatch = deck[currentIndex];
  const matchScore = currentMatch && userProfile ? calculateCompatibility(userProfile, currentMatch) : 0;

  // Swipe handlers
  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setIsDragging(true);
      const { deltaX, deltaY } = eventData;
      setDragOffset({ x: deltaX, y: deltaY });
      const rotation = deltaX * 0.1;
      setRotateAngle(rotation);
    },
    onSwipedLeft: () => handleSwipeComplete('left'),
    onSwipedRight: () => handleSwipeComplete('right'),
    onSwiped: () => {
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });
      setRotateAngle(0);
    },
    preventDefaultTouchmoveEvent: true,
    trackMouse: true,
    delta: 10,
  });

  const handleRipenMatch = async (targetUserId) => {
    try {
      if (!userProfile?.id) return false;

      const success = await ripenMatch(targetUserId);
      
      if (!success) {
        const dailyLimit = subscription?.isPremium ? 999 : 25;
        alert(`Daily Limit Reached! You've used all ${dailyLimit} ripens. Upgrade to Premium for unlimited ripens!`);
        if (onNavigateToStore) onNavigateToStore();
        return false;
      }

      // Remove from potential matches
      setPotentialMatches(prev => prev.filter(m => m.id !== targetUserId));
      
      // Reset index if needed
      if (currentIndex >= deck.length - 1) {
        setCurrentIndex(0);
      }

      return true;
    } catch (err) {
      console.error('Error ripening match:', err);
      return false;
    }
  };

  const handleSwipeComplete = async (direction) => {
    const newCount = actionsSinceAd + 1;
    setActionsSinceAd(newCount);
    const shouldShowAds = !subscription?.isPremium || (userProfile?.preferences?.allowAds);
    
    if (shouldShowAds && newCount >= 5) {
      setTimeout(() => setShowAd(true), 500);
      setActionsSinceAd(0);
    }

    if (direction === 'right' && currentMatch) {
      const success = await handleRipenMatch(currentMatch.id);
      if (!success) {
        return;
      }
    }

    setTimeout(() => {
      setDragOffset({ x: 0, y: 0 });
      setRotateAngle(0);
      
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setCurrentIndex(0);
      }
    }, 300);
  };

  const handleManualSwipe = (direction) => {
    const swipeDistance = direction === 'right' ? 500 : -500;
    setDragOffset({ x: swipeDistance, y: 0 });
    setRotateAngle(direction === 'right' ? 20 : -20);
    
    setTimeout(() => {
      handleSwipeComplete(direction);
    }, 100);
  };

  const handleAdComplete = () => {
    setShowAd(false);
    if (incrementAdsSeen) incrementAdsSeen();
  };

  const getImageUrl = (match) => {
    return match?.photoUrl || null;
  };

  // Safe image URL handler
  const getSafeImageUrl = (url) => {
    if (!url) return null;
    if (url.includes('supabase.co') || url.startsWith('http')) {
      return url;
    }
    return null;
  };

  // Show loading state
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingIcon}>🍑</div>
        <h2 style={styles.loadingTitle}>Finding Peaches Nearby...</h2>
        <p style={styles.loadingText}>Looking for nurses in your area</p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h2 style={styles.errorTitle}>Error Loading Matches</h2>
        <p style={styles.errorText}>{error}</p>
        <button 
          onClick={() => {
            setHasFetched(false);
            fetchPotentialMatches();
          }}
          style={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Show ad if needed
  if (showAd) {
    return <AdBanner onAdComplete={handleAdComplete} />;
  }

  // Show empty state if no matches
  if (deck.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🍑</div>
        <h2 style={styles.emptyTitle}>No more peaches nearby!</h2>
        <p style={styles.emptyText}>
          We've run out of potential matches in your area. Check back later or adjust your preferences.
        </p>
        <div style={styles.emptyButtons}>
          <button 
            onClick={() => {
              setHasFetched(false);
              fetchPotentialMatches();
            }}
            style={styles.refreshButton}
          >
            Refresh
          </button>
          <button 
            onClick={onNavigateToSettings}
            style={styles.settingsButton}
          >
            Adjust Settings
          </button>
        </div>
      </div>
    );
  }

  // Main Discover view
  return (
    <div style={styles.container}>
      {notification && (
        <div style={styles.notification}>
          {notification}
        </div>
      )}

      {showInstructions && (
        <div style={styles.instructionsOverlay}>
          <div style={styles.instructionsBox}>
            <h2 style={styles.instructionsTitle}>Welcome to Discover! 👋</h2>
            <p style={styles.instructionsText}>
              Swipe <strong style={{ color: '#4CAF50' }}>right</strong> to "ripen" (like) or <strong style={{ color: '#FF6B6B' }}>left</strong> to pass.
            </p>
            <p style={styles.instructionsSubtext}>
              You can also use the buttons below. Match with others to start chatting!
            </p>
            <button
              onClick={() => setShowInstructions(false)}
              style={styles.gotItButton}
            >
              Got it!
            </button>
          </div>
        </div>
      )}

      {/* Swipe Area */}
      <div 
        {...handlers}
        style={styles.swipeArea}
      >
        {isDragging && (
          <>
            {dragOffset.x < -50 && (
              <div style={styles.nopeIndicator}>
                NOPE
              </div>
            )}
            {dragOffset.x > 50 && (
              <div style={styles.gotchaIndicator}>
                GOTCHA
              </div>
            )}
          </>
        )}

        <div style={styles.cardStack}>
          {deck[currentIndex + 1] && (
            <div style={styles.nextCard} />
          )}

          <div
            ref={cardRef}
            style={{
              ...styles.currentCard,
              backgroundImage: `url(${getSafeImageUrl(getImageUrl(currentMatch))})`,
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotateAngle}deg)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease'
            }}
          >
            <div style={styles.cardOverlay}>
              <div style={styles.cardHeader}>
                <div>
                  <h1 style={styles.cardName}>{currentMatch.alias}</h1>
                  <div style={styles.cardInfo}>
                    {currentMatch.level} • {currentMatch.distance ? `${currentMatch.distance}km away` : 'Location hidden'}
                  </div>
                </div>
                <div style={styles.scoreBadge}>
                  {matchScore}%
                </div>
              </div>
              
              <div style={styles.cardContent}>
                <div style={styles.tags}>
                  {currentMatch.basics.fun?.slice(0, 3).map(t => (
                    <span key={t} style={styles.tag}>
                      {t}
                    </span>
                  ))}
                </div>
                <div style={styles.location}>
                  📍 {currentMatch.life?.based || 'Delta'} • {currentMatch.relationships?.lookingFor || 'Looking to connect'}
                </div>
                <div style={styles.additionalInfo}>
                  <p style={styles.vision}>✨ {currentMatch.special || 'Ready to connect'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      
      {/* Bottom Navigation */}
      <div style={styles.bottomNav}>
        <div style={{...styles.navItem, ...styles.navItemActive}}>
          <div style={styles.navIcon}>🍑</div>
          <div style={styles.navLabel}>Discover</div>
        </div>
        <div style={styles.navItem} onClick={onNavigateToChats}>
          <div style={styles.navIcon}>💬</div>
          <div style={styles.navLabel}>Chats</div>
          {matches?.length > 0 && (
            <span style={styles.matchBadge}>{matches.length}</span>
          )}
        </div>
        <div style={styles.navItem} onClick={onNavigateToStore}>
          <div style={styles.navIcon}>🛒</div>
          <div style={styles.navLabel}>Store</div>
        </div>
        <div style={styles.navItem} onClick={onNavigateToSettings}>
          <div style={styles.navIcon}>⚙️</div>
          <div style={styles.navLabel}>Settings</div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#f8f9fa',
    position: 'relative',
    paddingBottom: '80px'
  },
  swipeArea: {
    flex: 1,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '20px',
    position: 'relative'
  },
  nopeIndicator: {
    position: 'absolute',
    top: '50px',
    left: '30px',
    zIndex: 200,
    transform: 'rotate(-20deg)',
    padding: '10px 20px',
    border: '3px solid #FF6B6B',
    borderRadius: '10px',
    color: '#FF6B6B',
    fontWeight: 'bold',
    fontSize: '1.5rem'
  },
  gotchaIndicator: {
    position: 'absolute',
    top: '50px',
    right: '30px',
    zIndex: 200,
    transform: 'rotate(20deg)',
    padding: '10px 20px',
    border: '3px solid #4CAF50',
    borderRadius: '10px',
    color: '#4CAF50',
    fontWeight: 'bold',
    fontSize: '1.5rem'
  },
  cardStack: {
    width: '100%',
    maxWidth: '360px',
    height: '500px',
    position: 'relative'
  },
  nextCard: {
    position: 'absolute',
    width: '95%',
    height: '95%',
    backgroundColor: 'white',
    borderRadius: '20px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.1)',
    top: '2.5%',
    left: '2.5%',
    zIndex: 1
  },
  currentCard: {
    width: '100%',
    height: '100%',
    borderRadius: '20px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
    overflow: 'hidden',
    cursor: 'grab'
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    background: 'linear-gradient(transparent, rgba(0,0,0,0.8))',
    padding: '25px',
    color: 'white'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: '10px'
  },
  cardName: {
    fontSize: '2rem',
    margin: 0,
    fontWeight: 'bold',
    textShadow: '0 2px 4px rgba(0,0,0,0.5)'
  },
  cardInfo: {
    fontSize: '1rem',
    opacity: 0.9
  },
  scoreBadge: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    padding: '5px 15px',
    borderRadius: '20px',
    color: '#333',
    fontWeight: 'bold',
    fontSize: '1rem'
  },
  cardContent: {
    marginTop: '15px'
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '10px'
  },
  tag: {
    fontSize: '0.8rem',
    background: 'rgba(255,255,255,0.2)',
    padding: '5px 12px',
    borderRadius: '15px',
    backdropFilter: 'blur(10px)'
  },
  location: {
    fontSize: '0.95rem',
    opacity: 0.9,
    marginBottom: '15px'
  },
  additionalInfo: {
    fontSize: '0.85rem',
    opacity: 0.8,
    lineHeight: '1.4'
  },
  vision: {
    margin: '5px 0',
    fontStyle: 'italic'
  },
  actions: {
    padding: '20px',
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    backgroundColor: 'transparent',
    position: 'relative',
    zIndex: 100,
    marginBottom: '20px'
  },
  nopeButton: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    border: '2px solid #FF6B6B',
    background: 'white',
    color: '#FF6B6B',
    fontSize: '2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 5px 15px rgba(255, 107, 107, 0.2)',
    transition: 'all 0.2s'
  },
  ripenButton: {
    width: '70px',
    height: '70px',
    borderRadius: '50%',
    border: '2px solid #4CAF50',
    background: 'white',
    color: '#4CAF50',
    fontSize: '2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 5px 15px rgba(76, 175, 80, 0.2)',
    transition: 'all 0.2s'
  },
  bottomNav: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70px',
    backgroundColor: 'white',
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
    zIndex: 1000,
    padding: '0 10px'
  },
  navItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    cursor: 'pointer',
    color: '#666',
    transition: 'all 0.2s',
    padding: '8px 0',
    position: 'relative'
  },
  navItemActive: {
    color: '#FF6347'
  },
  navIcon: {
    fontSize: '1.5rem',
    marginBottom: '4px'
  },
  navLabel: {
    fontSize: '0.7rem',
    fontWeight: '500'
  },
  matchBadge: {
    position: 'absolute',
    top: '8px',
    right: '20px',
    backgroundColor: '#FF6347',
    color: 'white',
    fontSize: '0.7rem',
    padding: '2px 6px',
    borderRadius: '10px',
    minWidth: '18px',
    textAlign: 'center'
  },
  loadingContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
  },
  loadingIcon: {
    fontSize: '4rem',
    marginBottom: '20px',
    animation: 'pulse 1.5s infinite'
  },
  loadingTitle: {
    fontSize: '1.5rem',
    marginBottom: '10px',
    color: '#333'
  },
  loadingText: {
    color: '#666',
    marginBottom: '30px'
  },
  errorContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
  },
  errorIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  errorTitle: {
    fontSize: '1.5rem',
    marginBottom: '10px',
    color: '#333'
  },
  errorText: {
    color: '#666',
    marginBottom: '30px',
    maxWidth: '300px'
  },
  retryButton: {
    padding: '15px 30px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  emptyContainer: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    textAlign: 'center',
    backgroundColor: '#f8f9fa'
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '20px'
  },
  emptyTitle: {
    fontSize: '1.5rem',
    marginBottom: '10px',
    color: '#333'
  },
  emptyText: {
    color: '#666',
    marginBottom: '30px',
    maxWidth: '300px'
  },
  emptyButtons: {
    display: 'flex',
    gap: '15px',
    flexWrap: 'wrap',
    justifyContent: 'center'
  },
  refreshButton: {
    padding: '15px 30px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  settingsButton: {
    padding: '15px 30px',
    background: '#f0f0f0',
    color: '#333',
    border: 'none',
    borderRadius: '30px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600'
  },
  notification: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#4CAF50',
    color: 'white',
    padding: '15px 30px',
    borderRadius: '10px',
    boxShadow: '0 5px 20px rgba(76, 175, 80, 0.3)',
    zIndex: 2000,
    animation: 'slideDown 0.3s ease',
    maxWidth: '90%',
    textAlign: 'center'
  },
  instructionsOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  instructionsBox: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    maxWidth: '400px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
  },
  instructionsTitle: {
    marginBottom: '15px',
    color: '#FF6347',
    fontSize: '1.8rem'
  },
  instructionsText: {
    marginBottom: '20px',
    color: '#666',
    fontSize: '1.1rem',
    lineHeight: '1.5'
  },
  instructionsSubtext: {
    marginBottom: '25px',
    color: '#666',
    fontSize: '0.95rem',
    opacity: 0.8
  },
  gotItButton: {
    padding: '12px 30px',
    backgroundColor: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '600',
    width: '100%'
  }
};

// Add global styles for animations
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.8; transform: scale(1.05); }
      100% { opacity: 1; transform: scale(1); }
    }
    @keyframes slideDown {
      0% { transform: translate(-50%, -100%); opacity: 0; }
      100% { transform: translate(-50%, 0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

export default Discover;