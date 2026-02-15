// context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const UserContext = createContext();

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [subscription, setSubscription] = useState({
    isPremium: false,
    dailyUnripes: 25,
    dailyLimit: 25
  });
  const [adsSeen, setAdsSeen] = useState(0);
  const [ripenedUsers, setRipenedUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [error, setError] = useState(null);

  // Listen to auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        resetUserState();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const resetUserState = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setOnboardingComplete(false);
    setRipenedUsers([]);
    setMatches([]);
    setPotentialMatches([]);
    setLoading(false);
  };

  // Handle user session - load profile
  const handleUserSession = async (user) => {
    setCurrentUser(user);
    setError(null);
    
    try {
      // Load user profile from profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        setError('Failed to load profile');
      }

      if (profile) {
        setUserProfile(profile);
        setOnboardingComplete(profile.onboarding_complete || false);
        
        if (profile.subscription) {
          setSubscription({
            isPremium: profile.subscription.isPremium || false,
            dailyUnripes: profile.subscription.dailyUnripes || 25,
            dailyLimit: 25
          });
        }
        
        if (profile.sweet_peaches) {
          setRipenedUsers(profile.sweet_peaches);
        }
        
        await loadMatches(user.id);
        await loadPotentialMatches(user.id, profile);
      } else {
        setUserProfile(null);
        setOnboardingComplete(false);
      }
    } catch (err) {
      console.error('Error in handleUserSession:', err);
      setError('Authentication error');
    } finally {
      setLoading(false);
    }
  };

  // Load chat rooms (matches)
  const loadMatches = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('chat_rooms')
        .select(`
          id,
          participants,
          last_message,
          last_message_at
        `)
        .contains('participants', [userId]);

      if (error) throw error;

      if (data) {
        const matchPromises = data.map(async (room) => {
          const otherUserId = room.participants.find(id => id !== userId);
          const { data: otherUser } = await supabase
            .from('profiles')
            .select('alias, photo_url')
            .eq('id', otherUserId)
            .single();
          
          return {
            id: room.id,
            userId: otherUserId,
            alias: otherUser?.alias || 'Anonymous',
            photoUrl: otherUser?.photo_url,
            lastMessage: room.last_message,
            lastMessageTime: room.last_message_at
          };
        });

        const matchList = await Promise.all(matchPromises);
        setMatches(matchList);
      }
    } catch (err) {
      console.error('Error loading matches:', err);
    }
  };

  // Load potential matches
  const loadPotentialMatches = async (userId, profile) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', userId)
        .eq('onboarding_complete', true);

      if (error) throw error;

      if (data) {
        const ripenedIds = profile?.sweet_peaches || [];
        const filtered = data.filter(u => !ripenedIds.includes(u.id) && !u.banned);
        
        const withScores = filtered.map(match => ({
          ...match,
          compatibility: calculateCompatibility(profile, match)
        }));
        
        withScores.sort((a, b) => b.compatibility - a.compatibility);
        setPotentialMatches(withScores);
      }
    } catch (err) {
      console.error('Error loading potential matches:', err);
    }
  };

  // Calculate compatibility score
  const calculateCompatibility = (user, match) => {
    if (!user || !match) return 0;
    
    const userBasics = user.basics || { fun: [], media: [] };
    const userRelationships = user.relationships || { values: [], lookingFor: '' };
    const userLife = user.life || { based: '' };

    const matchBasics = match.basics || { fun: [], media: [] };
    const matchRelationships = match.relationships || { values: [], lookingFor: '' };
    const matchLife = match.life || { based: '' };

    const commonFun = (userBasics.fun || []).filter(f => (matchBasics.fun || []).includes(f));
    const commonMedia = (userBasics.media || []).filter(m => (matchBasics.media || []).includes(m));
    const commonValues = (userRelationships.values || []).filter(v => (matchRelationships.values || []).includes(v));

    let score = 0;
    score += Math.min(commonFun.length * 7, 20);
    score += Math.min(commonMedia.length * 7, 20);
    score += Math.min(commonValues.length * 10, 30);

    if (userLife.based === matchLife.based) score += 20;
    if (userRelationships.lookingFor === matchRelationships.lookingFor) score += 10;

    return Math.min(Math.round(score), 100);
  };

  // Login function
  const loginUser = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setError(error.message);
      return false;
    }
  };

  // Signup function
  const signupUser = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: email.split('@')[0]
          }
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.message);
      return false;
    }
  };

  // Logout function
  const logoutUser = async () => {
    await supabase.auth.signOut();
  };

  // Update user profile
  const updateUserProfile = async (profileData) => {
    if (!currentUser) {
      setError('No current user');
      return null;
    }

    try {
      const dbProfile = {
        id: currentUser.id,
        email: currentUser.email,
        name: profileData.alias || profileData.username,
        alias: profileData.alias || profileData.username,
        level: profileData.level || '',
        location: {
          based: profileData.based || 'Delta',
          latitude: 5.5380,
          longitude: 5.7600
        },
        basics: {
          fun: profileData.fun || [],
          media: profileData.media || []
        },
        relationships: {
          values: profileData.values || [],
          lookingFor: profileData.lookingFor || 'Friendship'
        },
        life: {
          based: profileData.based || 'Delta',
          upbringing: profileData.upbringing || ''
        },
        job: profileData.job || '',
        sweet_peaches: [],
        bruised_peaches: [],
        photo_url: profileData.photo_url || `https://picsum.photos/400/600?random=${Math.random()}`,
        onboarding_complete: true,
        preferences: {
          allowAds: true,
          gender_preference: null,
          max_distance: 50
        },
        subscription: {
          isPremium: false,
          dailyUnripes: 25,
          expiresAt: null
        },
        business: {
          isBusiness: false,
          ads: []
        },
        kyc_status: 'pending',
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(dbProfile, { onConflict: 'id' })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        setError(error.message);
        return null;
      }

      if (data) {
        setUserProfile(data);
        setOnboardingComplete(true);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Exception in updateUserProfile:', err);
      setError(err.message);
      return null;
    }
  };

  // Complete onboarding
  const completeOnboarding = () => {
    setOnboardingComplete(true);
  };

  // Ripen a match
  const ripenMatch = async (targetUserId) => {
    if (!currentUser) return false;

    try {
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('sweet_peaches')
        .eq('id', currentUser.id)
        .single();

      const sweetPeaches = currentProfile?.sweet_peaches || [];
      const dailyLimit = subscription.isPremium ? 999 : 25;
      
      if (sweetPeaches.length >= dailyLimit) return false;
      if (sweetPeaches.includes(targetUserId)) return false;

      const newSweetPeaches = [...sweetPeaches, targetUserId];
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ sweet_peaches: newSweetPeaches })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('ripen_history')
        .insert({
          user_id: currentUser.id,
          target_user_id: targetUserId
        });

      if (historyError) throw historyError;

      setRipenedUsers(newSweetPeaches);

      if (!subscription.isPremium) {
        const remaining = dailyLimit - newSweetPeaches.length;
        setSubscription(prev => ({ ...prev, dailyUnripes: remaining }));
      }

      return true;
    } catch (error) {
      console.error('Error ripening match:', error);
      setError(error.message);
      return false;
    }
  };

  // Check if user is ripped
  const isRipped = (userId) => {
    return ripenedUsers.includes(userId);
  };

  // Send message
  const sendMessage = async (chatRoomId, content) => {
    if (!currentUser) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_room_id: chatRoomId,
          sender_id: currentUser.id,
          content
        })
        .select()
        .single();

      if (error) throw error;

      await supabase
        .from('chat_rooms')
        .update({
          last_message: content,
          last_message_at: new Date().toISOString()
        })
        .eq('id', chatRoomId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error.message);
    }
  };

  // Grant premium
  const grantPremium = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription: {
            isPremium: true,
            dailyUnripes: 999,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
          }
        })
        .eq('id', userId);

      if (!error && userId === currentUser?.id) {
        setSubscription(prev => ({ ...prev, isPremium: true, dailyUnripes: 999 }));
      }
    } catch (error) {
      console.error('Error granting premium:', error);
    }
  };

  // Revoke premium
  const revokePremium = async (userId) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          subscription: {
            isPremium: false,
            dailyUnripes: 25,
            expiresAt: null
          }
        })
        .eq('id', userId);

      if (!error && userId === currentUser?.id) {
        setSubscription(prev => ({ ...prev, isPremium: false, dailyUnripes: 25 }));
      }
    } catch (error) {
      console.error('Error revoking premium:', error);
    }
  };

  // Ban user
  const banUser = async (userId) => {
    try {
      await supabase
        .from('profiles')
        .update({ banned: true })
        .eq('id', userId);
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  // Delete user
  const deleteUser = async (userId) => {
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Increment ads seen
  const incrementAdsSeen = () => {
    setAdsSeen(prev => prev + 1);
  };

  const value = {
    currentUser,
    userProfile,
    onboardingComplete,
    subscription,
    adsSeen,
    ripenedUsers,
    matches,
    potentialMatches,
    loading,
    error,
    loginUser,
    signupUser,
    logoutUser,
    updateUserProfile,
    completeOnboarding,
    ripenMatch,
    isRipped,
    sendMessage,
    grantPremium,
    revokePremium,
    banUser,
    deleteUser,
    incrementAdsSeen,
    setError
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};