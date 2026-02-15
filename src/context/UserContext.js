// context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

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
        setCurrentUser(null);
        setUserProfile(null);
        setOnboardingComplete(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle user session - load profile
  const handleUserSession = async (user) => {
    setCurrentUser(user);
    
    // Load user profile from profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUserProfile(profile);
      setOnboardingComplete(true);
      setSubscription({
        isPremium: profile.is_premium || false,
        dailyUnripes: profile.daily_unripes || 25,
        dailyLimit: 25
      });
      
      // Load ripened users
      await loadRipenedUsers(user.id);
      // Load matches
      await loadMatches(user.id);
      // Load potential matches
      await loadPotentialMatches(user.id, profile);
    } else {
      // New user - needs onboarding
      setUserProfile(null);
      setOnboardingComplete(false);
    }
    
    setLoading(false);
  };

  // Load ripened users
  const loadRipenedUsers = async (userId) => {
    const { data, error } = await supabase
      .from('ripens')
      .select('target_user_id')
      .eq('user_id', userId);

    if (data) {
      setRipenedUsers(data.map(r => r.target_user_id));
    }
  };

  // Load mutual matches
  const loadMatches = async (userId) => {
    // Find mutual ripens where both users ripened each other
    const { data, error } = await supabase
      .from('ripens')
      .select(`
        id,
        target_user_id,
        profiles!ripens_target_user_id_fkey (
          alias,
          photo_url
        )
      `)
      .eq('user_id', userId)
      .eq('is_mutual', true);

    if (data) {
      const matchList = data.map(r => ({
        id: r.id,
        userId: r.target_user_id,
        alias: r.profiles?.alias,
        photoUrl: r.profiles?.photo_url,
        lastMessage: null,
        lastMessageTime: null
      }));
      setMatches(matchList);
    }
  };

  // Load potential matches (excluding ripened and current user)
  const loadPotentialMatches = async (userId, profile) => {
    // Get all users except current user
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId);

    if (data) {
      // Filter out ripened users
      const ripenedIds = ripenedUsers;
      const filtered = data.filter(u => !ripenedIds.includes(u.id));
      
      // Calculate compatibility scores
      const withScores = filtered.map(match => ({
        ...match,
        compatibility: calculateCompatibility(profile, match)
      }));
      
      // Sort by compatibility
      withScores.sort((a, b) => b.compatibility - a.compatibility);
      
      setPotentialMatches(withScores);
    }
  };

  // Calculate compatibility score
  const calculateCompatibility = (user, match) => {
    if (!user?.fun || !match?.fun || !match?.values || !match?.based) return 0;
    
    const userFun = user.fun || [];
    const userMedia = user.media || [];
    const userValues = user.values || [];

    const matchFun = match.fun || [];
    const matchMedia = match.media || [];
    const matchValues = match.values || [];

    const commonFun = userFun.filter(f => matchFun.includes(f));
    const commonMedia = userMedia.filter(m => matchMedia.includes(m));
    const commonValues = userValues.filter(v => matchValues.includes(v));

    let score = 0;
    score += Math.min(commonFun.length * 7, 20);
    score += Math.min(commonMedia.length * 7, 20);
    score += Math.min(commonValues.length * 10, 30);

    if (user.based === match.based) score += 20;
    if (user.looking_for === match.looking_for) score += 10;

    return Math.min(Math.round(score), 100);
  };

  // Login function
  const loginUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Signup function
  const signupUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: email.split('@')[0] // Temporary username
          }
        }
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  // Logout function
  const logoutUser = async () => {
    await supabase.auth.signOut();
  };

  // Update user profile (after onboarding)
  const updateUserProfile = async (profileData) => {
    if (!currentUser) return null;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (data) {
      setUserProfile(data);
      return data;
    }
    return null;
  };

  // Complete onboarding
  const completeOnboarding = () => {
    setOnboardingComplete(true);
  };

  // Ripen a match
  const ripenMatch = async (targetUserId) => {
    if (!currentUser) return false;

    try {
      // Check daily limit
      const today = new Date().toISOString().split('T')[0];
      const { data: dailyData } = await supabase
        .from('daily_ripens')
        .select('count')
        .eq('user_id', currentUser.id)
        .eq('ripened_date', today)
        .maybeSingle();

      const dailyCount = dailyData?.count || 0;
      const dailyLimit = subscription.isPremium ? 999 : 25;

      if (dailyCount >= dailyLimit) {
        return false;
      }

      // Check if already ripened
      const { data: existing } = await supabase
        .from('ripens')
        .select('id')
        .eq('user_id', currentUser.id)
        .eq('target_user_id', targetUserId)
        .maybeSingle();

      if (existing) {
        return false;
      }

      // Insert ripen
      const { data: ripenData, error: ripenError } = await supabase
        .from('ripens')
        .insert({
          user_id: currentUser.id,
          target_user_id: targetUserId
        })
        .select()
        .single();

      if (ripenError) throw ripenError;

      // Update daily count
      if (dailyData) {
        await supabase
          .from('daily_ripens')
          .update({ count: dailyCount + 1 })
          .eq('user_id', currentUser.id)
          .eq('ripened_date', today);
      } else {
        await supabase
          .from('daily_ripens')
          .insert({
            user_id: currentUser.id,
            ripened_date: today,
            count: 1
          });
      }

      // Check for mutual match
      const { data: mutualCheck } = await supabase
        .from('ripens')
        .select('id')
        .eq('user_id', targetUserId)
        .eq('target_user_id', currentUser.id)
        .maybeSingle();

      if (mutualCheck) {
        // Update both ripens as mutual
        await supabase
          .from('ripens')
          .update({ is_mutual: true })
          .eq('id', ripenData.id);

        await supabase
          .from('ripens')
          .update({ is_mutual: true })
          .eq('id', mutualCheck.id);

        // Refresh matches
        await loadMatches(currentUser.id);
      }

      // Update local state
      setRipenedUsers(prev => [...prev, targetUserId]);

      // Update daily unripes count
      if (!subscription.isPremium) {
        const remaining = dailyLimit - (dailyCount + 1);
        setSubscription(prev => ({ ...prev, dailyUnripes: remaining }));
      }

      return true;
    } catch (error) {
      console.error('Error ripening match:', error);
      return false;
    }
  };

  // Check if user is ripped
  const isRipped = (userId) => {
    return ripenedUsers.includes(userId);
  };

  // Send message
  const sendMessage = async (matchId, content) => {
    if (!currentUser) return;

    // Find the ripen record for this match
    const { data: ripen } = await supabase
      .from('ripens')
      .select('id, user_id, target_user_id')
      .eq('id', matchId)
      .single();

    if (!ripen) return;

    const receiverId = ripen.user_id === currentUser.id 
      ? ripen.target_user_id 
      : ripen.user_id;

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUser.id,
        receiver_id: receiverId,
        content
      });

    if (!error) {
      // Refresh messages (you'll need to implement this in Chat component)
    }
  };

  // Grant premium (admin only)
  const grantPremium = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: true })
      .eq('id', userId);

    if (!error && userId === currentUser?.id) {
      setSubscription(prev => ({ ...prev, isPremium: true }));
    }
  };

  // Revoke premium (admin only)
  const revokePremium = async (userId) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_premium: false })
      .eq('id', userId);

    if (!error && userId === currentUser?.id) {
      setSubscription(prev => ({ ...prev, isPremium: false }));
    }
  };

  // Ban user (admin only)
  const banUser = async (userId) => {
    // You might want to add a 'banned' column to profiles
    // This is a placeholder
    console.log('Ban user:', userId);
  };

  // Delete user (admin only)
  const deleteUser = async (userId) => {
    // This requires admin privileges in Supabase
    // You might want to use a server-side function
    console.log('Delete user:', userId);
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
    incrementAdsSeen
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};