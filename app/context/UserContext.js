"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { devService, DEV_MODE, MOCK_USERS } from '../services/devService';

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

  // Load user session
  useEffect(() => {
    const initSession = async () => {
      // Check for dev session first
      if (DEV_MODE) {
        let devSession = devService.getStoredSession();

        // EXTRA CREDIT: Auto-login in dev mode if no session exists
        if (!devSession) {
          console.log('DEV_MODE: Auto-creating guest session');
          devSession = devService.createGuestSession();
        }

        if (devSession) {
          setCurrentUser(devSession.user);
          setUserProfile(devSession.profile);
          setOnboardingComplete(devSession.profile.onboarding_complete);
          setPotentialMatches(MOCK_USERS);
          setLoading(false);
          return;
        }
      }

      // Supabase session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUser(session.user);
        await fetchUserProfile(session.user.id);
      }
      setLoading(false);
    };

    initSession();

    const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setCurrentUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          // Only clear if not in dev guest mode
          if (!devService.getStoredSession()) {
            setCurrentUser(null);
            setUserProfile(null);
          }
        }
      }
    );

    return () => {
      authListener.unsubscribe();
    };
  }, []);

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

        await fetchUserMatches(userId);
        await fetchUserRipened(userId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserMatches = async (userId) => {
    if (currentUser?.is_guest || currentUser?.is_demo) return;
    const { data } = await supabase
      .from('matches')
      .select('*, profiles!matches_user_id_2_fkey(*)')
      .eq('user_id_1', userId);

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
      allMatches.forEach(match => {
        subscribeToChat(match.id);
        fetchMessages(match.id);
      });
    }
  };

  const fetchUserRipened = async (userId) => {
    if (currentUser?.is_guest || currentUser?.is_demo) return;
    const { data } = await supabase
      .from('ripened_users')
      .select('target_user_id')
      .eq('user_id', userId);

    if (data) {
      setRipenedUsers(data.map(r => r.target_user_id));
    }
  };

  const fetchMessages = async (matchId) => {
    if (currentUser?.is_guest || currentUser?.is_demo) return;
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
    if (currentUser?.is_guest || currentUser?.is_demo) return;
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

  const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  };

  const signupUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    if (data.user) {
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        is_premium: false,
        onboarding_complete: false
      });
    }
    return data.user;
  };

  const logoutUser = async () => {
    if (currentUser?.is_guest || currentUser?.is_demo) {
      devService.clearSession();
      setCurrentUser(null);
      setUserProfile(null);
    } else {
      await supabase.auth.signOut();
    }
    setMatches([]);
    setChats({});
    setRipenedUsers([]);
  };

  const updateUserProfile = async (profileData) => {
    if (!currentUser) return;
    if (currentUser.is_guest || currentUser.is_demo) {
      const newProfile = { ...userProfile, ...profileData, updated_at: new Date().toISOString() };
      setUserProfile(newProfile);
      localStorage.setItem('peach_guest_session', JSON.stringify({ user: currentUser, profile: newProfile }));
      return newProfile;
    }

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

  const ripenMatch = async (targetUserId) => {
    if (!currentUser) return false;
    if (currentUser.is_guest || currentUser.is_demo) {
      setRipenedUsers(prev => [...prev, targetUserId]);
      return true;
    }

    const { error } = await supabase
      .from('ripened_users')
      .insert({ user_id: currentUser.id, target_user_id: targetUserId });

    if (error) return false;
    setRipenedUsers(prev => [...prev, targetUserId]);

    const { data: mutual } = await supabase
      .from('ripened_users')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('target_user_id', currentUser.id)
      .single();

    if (mutual) {
      const { data: match } = await supabase
        .from('matches')
        .insert({ user_id_1: currentUser.id, user_id_2: targetUserId })
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
    if (currentUser.is_guest || currentUser.is_demo) {
       const newMessage = {
         id: Date.now(),
         text,
         sender: 'me',
         timestamp: new Date().toISOString()
       };
       setChats(prev => ({
         ...prev,
         [matchId]: [...(prev[matchId] || []), newMessage]
       }));
       return newMessage;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert({ match_id: matchId, sender_id: currentUser.id, content: text })
      .select()
      .single();

    if (error) throw error;
    return data;
  };

  const fetchAllProfiles = async () => {
    if (DEV_MODE) {
      setPotentialMatches(MOCK_USERS);
      return;
    }
    const { data } = await supabase.from('profiles').select('*');
    if (data) setPotentialMatches(data);
  };

  const loginAsGuest = () => {
    const { user, profile } = devService.createGuestSession();
    setCurrentUser(user);
    setUserProfile(profile);
    setOnboardingComplete(false);
    setPotentialMatches(MOCK_USERS);
  };

  const loginAsDemo = (type) => {
    const { user, profile } = devService.loginAsDemo(type);
    setCurrentUser(user);
    setUserProfile(profile);
    setOnboardingComplete(profile.onboarding_complete);
    setPotentialMatches(MOCK_USERS);
  };

  const value = {
    currentUser,
    userProfile,
    onboardingComplete,
    subscription,
    matches,
    chats,
    loading,
    loginUser,
    signupUser,
    logoutUser,
    updateUserProfile,
    setOnboardingComplete: completeOnboarding,
    ripenMatch,
    sendMessage,
    potentialMatches,
    fetchAllProfiles,
    loginAsGuest,
    loginAsDemo,
    kycStatus,
    updateKYC: (s) => setKycStatus(s),
    upgradeToPremium: () => Promise.resolve(true),
    deleteUser: () => Promise.resolve(true),
    banUser: () => Promise.resolve(true)
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};
