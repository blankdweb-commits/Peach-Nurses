import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useSwipeable } from 'react-swipeable';
import { useUser } from '../context/UserContext';
import AdBanner from './AdBanner';
import { wingmanService } from '../services/wingmanService';
import { supabase } from '../services/supabase';
import { mockBackend } from '../services/mockBackend';
import { MOCK_USERS, FUN_OPTIONS, MUSIC_MOVIES_OPTIONS, VALUES_OPTIONS, RELATIONSHIP_TYPES } from './mockData';
import BottomNav from './BottomNav';

const Discover = ({ onNavigateToStore, onNavigateToSettings, onNavigateToChats }) => {
  const { userProfile, incrementAdsSeen, subscription, updateUserProfile } = useUser();
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
  const [ripenCount, setRipenCount] = useState(0);
  const [userLocation, setUserLocation] = useState(null);
  const cardRef = useRef(null);

  // Mock user data for testing
  const mockCurrentUser = {
    id: 1,
    alias: "CurrentUser",
    level: "Year 2",
    basics: {
      fun: ["Eating Boli", "Watching Nollywood", "Swimming"],
      media: ["Afrobeats", "Davido", "K-Dramas"]
    },
    life: {
      based: "Sapele"
    },
    relationships: {
      values: ["Honesty", "God-fearing", "Family"],
      lookingFor: "Long-term"
    }
  };

  // Use actual userProfile or fallback to mock data
  const currentUser = userProfile || mockCurrentUser;

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
          () => {
            // Fallback to default location
            setUserLocation({ latitude: 5.5380, longitude: 5.7600 });
          }
        );
      } else {
        setUserLocation({ latitude: 5.5380, longitude: 5.7600 });
      }
    };
    
    fetchLocation();
  }, []);

  // Calculate distance between two coordinates
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Math.round(R * c * 10) / 10;
  };

  // Fetch potential matches - using mock data
  const fetchPotentialMatches = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Filter out current user if they exist in mock data
      const filteredMatches = MOCK_USERS.filter(user => 
        user.id !== currentUser.id
      );
      
      // Calculate distances if we have user location
      const enrichedMatches = filteredMatches.map(match => {
        let distance = null;
        
        // Generate random distances for mock data
        if (userLocation) {
          // Add some randomness to distances for variety
          const baseDistance = Math.random() * 50 + 1; // 1-51 km
          distance = Math.round(baseDistance * 10) / 10;
        }
        
        return {
          ...match,
          id: match.id.toString(), // Ensure ID is string for consistency
          distance,
          basics: match.basics || { fun: [], media: [] },
          relationships: match.relationships || { values: [], lookingFor: '' },
          life: match.life || { based: 'Delta' }
        };
      });

      // Sort by distance (closest first)
      const sortedMatches = enrichedMatches.sort((a, b) => {
        if (a.distance && b.distance) {
          return a.distance - b.distance;
        }
        const scoreA = calculateCompatibility(currentUser, a);
        const scoreB = calculateCompatibility(currentUser, b);
        return scoreB - scoreA;
      });

      setPotentialMatches(sortedMatches);
    } catch (err) {
      console.error('Error fetching matches:', err);
      setError('Failed to load potential matches');
      // Fallback to mock data even on error
      setPotentialMatches(MOCK_USERS.filter(user => user.id !== currentUser.id));
    } finally {
      setLoading(false);
    }
  }, [currentUser.id, userLocation]); // Fixed dependency

  useEffect(() => {
    fetchPotentialMatches();
  }, [fetchPotentialMatches]);

  useEffect(() => {
    const hasSeenInstructions = localStorage.getItem('hasSeenDiscoverInstructions');
    if (!hasSeenInstructions && !loading && potentialMatches.length > 0) {
      setTimeout(() => {
        setShowInstructions(true);
        localStorage.setItem('hasSeenDiscoverInstructions', 'true');
      }, 1000);
    }
  }, [loading, potentialMatches.length]);

  const deck = useMemo(() => {
    return potentialMatches.filter(u => !u.banned);
  }, [potentialMatches]);

  const currentMatch = deck[currentIndex];

  const calculateCompatibility = (user, match) => {
    if (!user?.basics || !match?.basics || !match?.relationships || !match?.life) return 0;
    
    const userFun = user.basics?.fun || [];
    const userMedia = user.basics?.media || [];
    const userValues = user.relationships?.values || [];

    const matchFun = match.basics.fun || [];
    const matchMedia = match.basics.media || [];
    const matchValues = match.relationships.values || [];

    const commonFun = userFun.filter(f => matchFun.includes(f));
    const commonMedia = userMedia.filter(m => matchMedia.includes(m));
    const commonValues = userValues.filter(v => matchValues.includes(v));

    let score = 0;
    score += Math.min(commonFun.length * 7, 20);
    score += Math.min(commonMedia.length * 7, 20);
    score += Math.min(commonValues.length * 10, 30);

    if (user.life?.based === match.life?.based) score += 20;
    if (user.relationships?.lookingFor === match.relationships?.lookingFor) score += 10;

    return Math.min(Math.round(score), 100);
  };

  const matchScore = currentMatch ? calculateCompatibility(currentUser, currentMatch) : 0;

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
      // Mock implementation - simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if already ripened
      const ripenedUsers = JSON.parse(localStorage.getItem('ripenedUsers') || '[]');
      if (ripenedUsers.includes(targetUserId)) {
        console.log('Already ripened this user');
        return false;
      }

      // Check daily limit
      const today = new Date().toISOString().split('T')[0];
      const dailyRipens = JSON.parse(localStorage.getItem('dailyRipens') || '[]');
      const todayRipens = dailyRipens.filter(date => date === today);
      
      const dailyLimit = subscription?.isPremium ? 999 : 25;
      if (todayRipens.length >= dailyLimit) {
        return false;
      }

      // Save ripened user
      ripenedUsers.push(targetUserId);
      localStorage.setItem('ripenedUsers', JSON.stringify(ripenedUsers));
      
      // Save daily count
      dailyRipens.push(today);
      localStorage.setItem('dailyRipens', JSON.stringify(dailyRipens));

      // Check for mutual match (simulated)
      const mutualMatch = Math.random() > 0.7; // 30% chance of match
      
      if (mutualMatch && currentMatch) {
        // Save match to localStorage
        const matches = JSON.parse(localStorage.getItem('matches') || '[]');
        matches.push({
          userId: targetUserId,
          alias: currentMatch.alias,
          matchedAt: new Date().toISOString()
        });
        localStorage.setItem('matches', JSON.stringify(matches));
        
        setNotification(`🎉 It's a match with ${currentMatch.alias}!`);
        setTimeout(() => setNotification(null), 3000);
      }

      setRipenCount(prev => prev + 1);
      
      if (!subscription?.isPremium) {
        const remaining = dailyLimit - todayRipens.length - 1;
        if (updateUserProfile) {
          updateUserProfile({ 
            subscription: { 
              ...subscription, 
              dailyUnripes: Math.max(0, remaining) 
            } 
          });
        }
      }

      return true;
    } catch (err) {
      console.error('Error ripen match:', err);
      return false;
    }
  };

  const handleSwipeComplete = async (direction) => {
    const newCount = actionsSinceAd + 1;
    setActionsSinceAd(newCount);
    const shouldShowAds = !subscription?.isPremium || (subscription?.isPremium && currentUser?.preferences?.allowAds);
    if (shouldShowAds && newCount >= 5) {
      setTimeout(() => setShowAd(true), 500);
      setActionsSinceAd(0);
    }

    if (direction === 'right' && currentMatch) {
      const success = await handleRipenMatch(currentMatch.id);
      if (!success) {
        alert("Daily Limit Reached! Upgrade to Premium to continue ripening.");
        if (onNavigateToStore) onNavigateToStore();
        return;
      }
    }

    setTimeout(() => {
      setDragOffset({ x: 0, y: 0 });
      setRotateAngle(0);
      
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        fetchPotentialMatches();
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
    if (match?.photoUrl) {
      return match.photoUrl;
    }
    // Generate consistent random image based on user ID
    const randomSeed = match?.id || Math.random();
    return `https://picsum.photos/400/600?random=${randomSeed}&grayscale`;
  };

  if (showAd) {
    return <AdBanner onAdComplete={handleAdComplete} />;
  }

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingIcon}>🍑</div>
        <h2 style={styles.loadingTitle}>Finding Peaches Nearby...</h2>
        <p style={styles.loadingText}>Looking for nurses in your area</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.errorIcon}>⚠️</div>
        <h2 style={styles.errorTitle}>Error Loading Matches</h2>
        <p style={styles.errorText}>{error}</p>
        <button 
          onClick={fetchPotentialMatches}
          style={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (deck.length === 0 || !currentMatch) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIcon}>🍑</div>
        <h2 style={styles.emptyTitle}>No more peaches nearby!</h2>
        <p style={styles.emptyText}>
          We've run out of potential matches in your area. Check back later or adjust your preferences.
        </p>
        <div style={styles.emptyButtons}>
          <button 
            onClick={fetchPotentialMatches}
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

      <div style={styles.header}>
        <div style={styles.logo}>🍑</div>
        <div 
          onClick={onNavigateToStore}
          style={{
            ...styles.ripenCounter,
            backgroundColor: subscription?.isPremium ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 99, 71, 0.1)',
            color: subscription?.isPremium ? '#FFD700' : '#FF6347'
          }}
        >
          {subscription?.isPremium ? "👑" : `${ripenCount}/25`}
        </div>
      </div>

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
              backgroundImage: `url(${getImageUrl(currentMatch)})`,
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
                  📍 {currentMatch.life.based} • {currentMatch.relationships.lookingFor || 'Looking to connect'}
                </div>
                <div style={styles.additionalInfo}>
                  <p style={styles.vision}>{currentMatch.vision}</p>
                  <p style={styles.special}>✨ {currentMatch.special}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button 
          onClick={() => handleManualSwipe('left')}
          style={styles.nopeButton}
        >
          ✖
        </button>
        <button 
          onClick={() => handleManualSwipe('right')}
          style={styles.ripenButton}
        >
          🍑
        </button>
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
    position: 'relative'
  },
  header: {
    padding: '15px 20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    zIndex: 100
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#FF6347'
  },
  ripenCounter: {
    fontSize: '0.9rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    padding: '8px 12px',
    borderRadius: '15px'
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
    color: 'white',
    maxHeight: '70%',
    overflowY: 'auto'
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
  special: {
    margin: '5px 0'
  },
  actions: {
    padding: '20px',
    paddingBottom: '30px',
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    backgroundColor: 'white',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.05)'
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

export default Discover;