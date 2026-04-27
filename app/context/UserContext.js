"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, hasSupabase } from '../services/supabase';
import { devService, MOCK_USERS } from '../services/devService';
import { localAuth } from '../services/local-auth';

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
  const [matches, setMatches] = useState([]);
  const [chats, setChats] = useState({});
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user session
  useEffect(() => {
    const initSession = async () => {
      // 1. Check for Local/Dev session
      const localSession = localAuth.getSession();
      if (localSession) {
        setCurrentUser(localSession);
        setUserProfile(localSession);
        setOnboardingComplete(localSession.onboarding_complete || false);
        setPotentialMatches(MOCK_USERS);
        setLoading(false);
        return;
      }

      // 2. Check for Supabase session if available
      if (hasSupabase && supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setCurrentUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      }

      setLoading(false);
    };

    initSession();

    if (hasSupabase && supabase) {
      const { data: { subscription: authListener } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (session) {
            setCurrentUser(session.user);
            await fetchUserProfile(session.user.id);
          } else {
            if (!localAuth.getSession()) {
              setCurrentUser(null);
              setUserProfile(null);
            }
          }
        }
      );
      return () => authListener.unsubscribe();
    }
  }, []);

  const fetchUserProfile = async (userId) => {
    if (!hasSupabase || !supabase) return;
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

        await fetchUserMatches(userId);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchUserMatches = async (userId) => {
    if (!hasSupabase || !supabase) return;
    const { data } = await supabase.from('matches').select('*, profiles!matches_user_id_2_fkey(*)').eq('user_id_1', userId);
    const { data: data2 } = await supabase.from('matches').select('*, profiles!matches_user_id_1_fkey(*)').eq('user_id_2', userId);

    if (data || data2) {
      const allMatches = [
        ...(data || []).map(m => ({ ...m, matchedUser: m.profiles })),
        ...(data2 || []).map(m => ({ ...m, matchedUser: m.profiles }))
      ];
      setMatches(allMatches);
    }
  };

  const loginUser = async (email, password) => {
    if (hasSupabase && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return data.user;
    }
    const { data, error } = await localAuth.signIn(email, password);
    if (error) throw error;
    setCurrentUser(data.user);
    setUserProfile(data.user);
    return data.user;
  };

  const signupUser = async (email, password, username) => {
    if (hasSupabase && supabase) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
      if (error) throw error;
      return data.user;
    }
    const { data, error } = await localAuth.signUp(email, password, username);
    setCurrentUser(data.user);
    setUserProfile(data.user);
    return data.user;
  };

  const logoutUser = async () => {
    if (hasSupabase && supabase) {
      await supabase.auth.signOut();
    }
    await localAuth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    setMatches([]);
    setChats({});
  };

  const updateUserProfile = async (profileData) => {
    if (!currentUser) return;
    const isLocal = currentUser.is_guest || currentUser.is_demo || !hasSupabase;

    if (isLocal) {
      const newProfile = { ...userProfile, ...profileData, updated_at: new Date().toISOString() };
      setUserProfile(newProfile);
      localStorage.setItem('peach_local_session', JSON.stringify(newProfile));
      return newProfile;
    }

    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: currentUser.id, ...profileData, updated_at: new Date().toISOString() })
      .select().single();

    if (error) throw error;
    setUserProfile(data);
    return data;
  };

  const loginAsGuest = () => {
    const user = localAuth.createGuestUser();
    setCurrentUser(user);
    setUserProfile(user);
    setOnboardingComplete(false);
    setPotentialMatches(MOCK_USERS);
  };

  const loginAsDemo = (type) => {
    const { user, profile } = devService.loginAsDemo(type);
    const sessionUser = { ...user, ...profile };
    localStorage.setItem('peach_local_session', JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    setUserProfile(sessionUser);
    setOnboardingComplete(sessionUser.onboarding_complete);
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
    setOnboardingComplete: () => {
        updateUserProfile({ onboarding_complete: true });
        setOnboardingComplete(true);
    },
    potentialMatches,
    fetchAllProfiles: async () => {
      if (!hasSupabase) { setPotentialMatches(MOCK_USERS); return; }
      const { data } = await supabase.from('profiles').select('*');
      if (data) setPotentialMatches(data);
    },
    ripenMatch: async (id) => { console.log('ripen match', id); return true; },
    sendMessage: async (id, text) => { console.log('send message', text); return true; },
    loginAsGuest,
    loginAsDemo,
    hasSupabase,
    kycStatus: 'not_verified',
    updateKYC: () => {},
    upgradeToPremium: () => Promise.resolve(true),
    deleteUser: () => Promise.resolve(true),
    banUser: () => Promise.resolve(true)
  };

  return (
    <UserContext.Provider value={value}>
      {!hasSupabase && (
        <div style={{
            background: 'var(--gold)',
            color: 'var(--base-bg)',
            padding: '8px',
            textAlign: 'center',
            fontSize: '0.8rem',
            fontWeight: 'bold',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 10000
        }}>
            Demo Mode Active — Using local accounts for testing.
        </div>
      )}
      <div style={{ marginTop: !hasSupabase ? '35px' : '0' }}>
        {children}
      </div>
    </UserContext.Provider>
  );
};
