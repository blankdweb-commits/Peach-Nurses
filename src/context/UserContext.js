// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

export const UserContext = createContext();

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
    dailyLimit: 25,
    plan: 'free',
    expiresAt: null,
    paymentHistory: []
  });
  const [adsSeen, setAdsSeen] = useState(0);
  const [ripenedUsers, setRipenedUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState({});
  const [kycStatus, setKycStatus] = useState('not_verified');
  const [business, setBusiness] = useState({ isBusiness: false, ads: [] });
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user session from Supabase
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setCurrentUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setCurrentUser(null);
          setUserProfile(null);
        }
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (data) {
        setUserProfile(data);
        setOnboardingComplete(data.onboarding_complete);
        setSubscription({
          isPremium: data.is_premium,
          dailyUnripes: data.daily_unripes,
          dailyLimit: data.is_premium ? 999 : 25,
          plan: data.is_premium ? 'premium' : 'free',
          expiresAt: data.expires_at,
          paymentHistory: data.payment_history || []
        });
        setKycStatus(data.kyc_status || 'not_verified');
        setBusiness({
          isBusiness: data.is_business || false,
          ads: data.ads || []
        });

        // Fetch additional data
        await fetchUserMatches(userId);
        await fetchUserRipened(userId);
      } else if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet, probably new signup
        console.log('Profile not found, user might need onboarding');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserMatches = async (userId) => {
    const { data } = await supabase
      .from('matches')
      .select('*, profiles!matches_user_id_2_fkey(*)')
      .eq('user_id_1', userId);

    // Also fetch where user is user_id_2
    const { data: data2 } = await supabase
      .from('matches')
      .select('*, profiles!matches_user_id_1_fkey(*)')
      .eq('user_id_2', userId);

    if (data || data2) {
      const allMatches = [
        ...(data || []).map(m => ({ ...m, matchedUser: m.profiles })),
        ...(data2 || []).map(m => ({ ...m, matchedUser: m.profiles }))
      ];
      setMatches(allMatches);

      // Setup real-time for each match chat
      allMatches.forEach(match => {
        subscribeToChat(match.id);
        fetchMessages(match.id);
      });
    }
  };

  const fetchUserRipened = async (userId) => {
    const { data } = await supabase
      .from('ripened_users')
      .select('target_user_id')
      .eq('user_id', userId);

    if (data) {
      setRipenedUsers(data.map(r => r.target_user_id));
    }
  };

  const fetchMessages = async (matchId) => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('match_id', matchId)
      .order('created_at', { ascending: true });

    if (data) {
      setChats(prev => ({
        ...prev,
        [matchId]: data.map(m => ({
          id: m.id,
          text: m.content,
          sender: m.sender_id === currentUser.id ? 'me' : 'them',
          timestamp: m.created_at,
          read: m.read
        }))
      }));
    }
  };

  const subscribeToChat = (matchId) => {
    supabase
      .channel(`chat:${matchId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, payload => {
        const newMessage = payload.new;
        setChats(prev => {
          const matchChats = prev[matchId] || [];
          if (matchChats.find(m => m.id === newMessage.id)) return prev;
          return {
            ...prev,
            [matchId]: [...matchChats, {
              id: newMessage.id,
              text: newMessage.content,
              sender: newMessage.sender_id === currentUser.id ? 'me' : 'them',
              timestamp: newMessage.created_at,
              read: newMessage.read
            }]
          };
        });
      })
      .subscribe();
  };

  // Check subscription expiry
  useEffect(() => {
    if (subscription.expiresAt && new Date(subscription.expiresAt) < new Date()) {
      // Subscription expired
      setSubscription(prev => ({
        ...prev,
        isPremium: false,
        plan: 'free',
        dailyLimit: 25,
        dailyUnripes: 25
      }));
    }
  }, [subscription.expiresAt]);

  const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  };

  const signupUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    if (data.user) {
      // Create a default profile if not handled by trigger
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        is_premium: false,
        daily_unripes: 25,
        onboarding_complete: false
      });
    }

    return data.user;
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setMatches([]);
    setChats({});
    setRipenedUsers([]);
  };

  const updateUserProfile = async (profileData) => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        id: currentUser.id,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    setUserProfile(data);
    return data;
  };

  const completeOnboarding = async () => {
    await updateUserProfile({ onboarding_complete: true });
    setOnboardingComplete(true);
  };

  const updateKYC = async (status) => {
    await updateUserProfile({ kyc_status: status });
    setKycStatus(status);
  };

  const createBusinessAccount = async () => {
    if (!subscription.isPremium) return false;
    await updateUserProfile({ is_business: true });
    setBusiness(prev => ({ ...prev, isBusiness: true }));
    return true;
  };

  const postAd = async (adData, reference) => {
    // In real app, verify payment reference first
    const newAds = [...business.ads, { ...adData, id: Date.now(), reference }];
    await updateUserProfile({ ads: newAds });
    setBusiness(prev => ({ ...prev, ads: newAds }));
    return true;
  };

  const submitFeedback = async (feedback) => {
    console.log("Feedback submitted:", feedback);
    // In real app, save to Supabase 'feedback' table
    return true;
  };

  // Upgrade to premium
  const upgradeToPremium = async (paymentDetails) => {
    try {
      const history = [...(subscription.paymentHistory || []), {
        ...paymentDetails,
        date: new Date().toISOString()
      }];

      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_premium: true,
          daily_unripes: 999,
          expires_at: paymentDetails.expiresAt,
          payment_history: history,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      setSubscription({
        isPremium: true,
        dailyUnripes: 999,
        dailyLimit: 999,
        plan: 'premium',
        expiresAt: data.expires_at,
        paymentHistory: data.payment_history
      });
      
      return true;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      return false;
    }
  };

  // Cancel premium subscription
  const cancelPremium = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          is_premium: false,
          daily_unripes: 25,
          expires_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;

      setUserProfile(data);
      setSubscription({
        isPremium: false,
        dailyUnripes: 25,
        dailyLimit: 25,
        plan: 'free',
        expiresAt: null,
        paymentHistory: data.payment_history
      });
    } catch (error) {
      console.error('Error cancelling premium:', error);
    }
  };

  const ripenMatch = async (targetUserId) => {
    if (!currentUser) return false;

    // Check daily limit
    const dailyLimit = subscription.isPremium ? 999 : 25;
    const { count } = await supabase
      .from('ripened_users')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', currentUser.id)
      .gte('created_at', new Date().toISOString().split('T')[0]);

    if (count >= dailyLimit) return false;

    // Save ripened user
    const { error } = await supabase
      .from('ripened_users')
      .insert({
        user_id: currentUser.id,
        target_user_id: targetUserId
      });

    if (error) return false;

    setRipenedUsers(prev => [...prev, targetUserId]);

    // Check for mutual match
    const { data: mutual } = await supabase
      .from('ripened_users')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('target_user_id', currentUser.id)
      .single();

    if (mutual) {
      const { data: match } = await supabase
        .from('matches')
        .insert({
          user_id_1: currentUser.id,
          user_id_2: targetUserId
        })
        .select()
        .single();
      
      if (match) {
        await fetchUserMatches(currentUser.id);
        return 'match';
      }
    }

    return true;
  };

  const sendMessage = async (matchId, text) => {
    if (!currentUser) return;

    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: currentUser.id,
        content: text
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const isRipped = (userId) => {
    return ripenedUsers.includes(userId);
  };

  const incrementAdsSeen = async () => {
    setAdsSeen(prev => prev + 1);
    if (currentUser) {
      await supabase
        .from('profiles')
        .update({ ads_seen: adsSeen + 1 })
        .eq('id', currentUser.id);
    }
  };

  const grantPremium = async (userId) => {
    if (userId === 'current_user' || (currentUser && userId === currentUser.id)) {
      await upgradeToPremium({
        paymentMethod: 'admin_grant',
        reference: 'admin_' + Date.now(),
        amount: 0,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
      });
    }
  };

  const revokePremium = async (userId) => {
    if (userId === 'current_user' || (currentUser && userId === currentUser.id)) {
      await cancelPremium();
    }
  };

  const deleteUser = async (userId) => {
    const { error } = await supabase.from('profiles').delete().eq('id', userId);
    if (!error) setPotentialMatches(prev => prev.filter(u => u.id !== userId));
    return !error;
  };

  const banUser = async (userId) => {
    const { error } = await supabase.from('profiles').update({ banned: true }).eq('id', userId);
    if (!error) setPotentialMatches(prev => prev.map(u => u.id === userId ? { ...u, banned: true } : u));
    return !error;
  };

  const fetchAllProfiles = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*');
    if (data) setPotentialMatches(data);
  };

  const value = {
    currentUser,
    userProfile,
    onboardingComplete,
    subscription,
    adsSeen,
    ripenedUsers,
    rippedMatches: ripenedUsers, // Alias for ChatList.js
    matches,
    chats,
    loading,
    loginUser,
    signupUser,
    logoutUser,
    updateUserProfile,
    setOnboardingComplete: completeOnboarding,
    upgradeToPremium,
    cancelPremium,
    grantPremium,
    revokePremium,
    deleteUser,
    banUser,
    kycStatus,
    updateKYC,
    business,
    createBusinessAccount,
    postAd,
    submitFeedback,
    ripenMatch,
    sendMessage,
    isRipped,
    incrementAdsSeen,
    potentialMatches,
    setPotentialMatches,
    fetchAllProfiles
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};