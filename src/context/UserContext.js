import React, { createContext, useState, useContext, useEffect } from 'react';
import { MOCK_USERS } from '../data/mockData';
import { mockBackend } from '../services/mockBackend';

export const UserContext = createContext();

export const useUser = () => useContext(UserContext);

export const UserProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // null = not logged in
  const [subscription, setSubscription] = useState({
    isPremium: false,
    dailyUnripes: 0,
    lastReset: new Date().toISOString().split('T')[0] // YYYY-MM-DD
  });
  const [rippedMatches, setRippedMatches] = useState([]);
  const [potentialMatches, setPotentialMatches] = useState(MOCK_USERS);
  const [adsSeen, setAdsSeen] = useState(0);
  const [business, setBusiness] = useState({ isBusiness: false, ads: [] });
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [kycStatus, setKycStatus] = useState('pending'); // pending, verified, rejected

  // Chat State
  const [chats, setChats] = useState({});
  const [feedback, setFeedback] = useState([]);

  // User Profile State
  const [userProfile, setUserProfile] = useState({
    name: "My Name",
    email: "myemail@peach.com",
    photoUrl: null,
    preferences: { allowAds: false },
    alias: "My_Alias",
    level: "Year 2",
    basics: { fun: [], media: [] },
    life: { based: "Sapele", upbringing: "" },
    work: { job: "Student Nurse", reason: "" },
    relationships: { values: [], lookingFor: "Long-term" },
    vision: "",
    special: ""
  });

  // Auth Functions
  const loginUser = (email, password) => {
    // Mock Logic
    if (email.includes('@') && password.length > 3) {
        setCurrentUser({ email, id: 'current_user' });
        // Restore profile if saved in mock backend?
        // For now, reset onboarding if new user simulation
        if (email === 'test@peach.com') {
            setOnboardingComplete(true);
            setSubscription(prev => ({ ...prev, isPremium: false }));
        }
        return true;
    }
    return false;
  };

  const signupUser = (email, password) => {
      // Mock Logic
      if (email.includes('@')) {
          setCurrentUser({ email, id: 'current_user' });
          setOnboardingComplete(false); // New user needs onboarding
          setSubscription(prev => ({ ...prev, isPremium: false }));
          // Reset Profile
          setUserProfile(prev => ({ ...prev, email }));
          return true;
      }
      return false;
  };

  const logoutUser = () => {
      setCurrentUser(null);
      setOnboardingComplete(false);
  };

  // Daily Reset Logic
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (subscription.lastReset !== today) {
      setSubscription(prev => ({
        ...prev,
        dailyUnripes: 0,
        lastReset: today
      }));
    }
  }, [subscription.lastReset]);

  const canRipen = () => {
    if (subscription.isPremium) return true;
    return subscription.dailyUnripes < 25;
  };

  const ripenMatch = async (matchId) => {
    if (rippedMatches.includes(matchId)) return true;

    if (canRipen()) {
      if (!subscription.isPremium) {
         setSubscription(prev => ({
           ...prev,
           dailyUnripes: prev.dailyUnripes + 1
         }));
      }
      setRippedMatches(prev => [...prev, matchId]);
      setChats(prev => ({ ...prev, [matchId]: [] }));
      return true;
    }
    return false;
  };

  const isRipped = (matchId) => rippedMatches.includes(matchId);

  // Chat Actions
  const sendMessage = (matchId, text) => {
    const newMessage = { id: Date.now(), text, sender: 'me', timestamp: new Date().toISOString() };
    setChats(prev => ({
      ...prev,
      [matchId]: [...(prev[matchId] || []), newMessage]
    }));
    setTimeout(() => {
        const reply = { id: Date.now() + 1, text: "That's interesting! Tell me more.", sender: 'them', timestamp: new Date().toISOString() };
        setChats(prev => ({ ...prev, [matchId]: [...(prev[matchId] || []), reply] }));
    }, 2000);
  };

  // Admin Actions
  const deleteUser = (userId) => {
    setPotentialMatches(prev => prev.filter(user => user.id !== userId));
  };

  const banUser = (userId) => {
    setPotentialMatches(prev => prev.map(user =>
      user.id === userId ? { ...user, banned: true } : user
    ));
  };

  const grantPremium = (userId) => {
      // In a real app, we'd update the specific user in DB.
      // Here, if userId is 'current_user' (us), update subscription.
      // If it's a match, we just update their mock object (maybe to show badge).
      if (userId === 'current_user' || !userId) {
          setSubscription(prev => ({ ...prev, isPremium: true }));
      } else {
          // Update mock user list to reflect status if we track it there
          setPotentialMatches(prev => prev.map(user =>
            user.id === userId ? { ...user, isPremium: true } : user
          ));
      }
  };

  const revokePremium = (userId) => {
      if (userId === 'current_user' || !userId) {
          setSubscription(prev => ({ ...prev, isPremium: false }));
      } else {
          setPotentialMatches(prev => prev.map(user =>
            user.id === userId ? { ...user, isPremium: false } : user
          ));
      }
  };

  const processUpgrade = async (paymentReference) => {
    const result = await mockBackend.verifyPayment(paymentReference);
    if (result.status) {
      setSubscription(prev => ({ ...prev, isPremium: true }));
      return true;
    }
    return false;
  };

  const incrementAdsSeen = () => setAdsSeen(prev => prev + 1);

  const updateUserProfile = (updates) => {
    setUserProfile(prev => {
      if (updates.preferences) {
        return { ...prev, ...updates, preferences: { ...prev.preferences, ...updates.preferences } };
      }
      return { ...prev, ...updates };
    });
  };

  const createBusinessAccount = () => {
    if (subscription.isPremium && kycStatus === 'verified') {
      setBusiness(prev => ({ ...prev, isBusiness: true }));
      return true;
    }
    return false;
  };

  const postAd = async (adData, paymentRef) => {
    const result = await mockBackend.verifyPayment(paymentRef);
    if (result.status) {
        setBusiness(prev => ({ ...prev, ads: [...prev.ads, { id: Date.now(), ...adData }] }));
        return true;
    }
    return false;
  };

  const submitFeedback = (data) => {
    setFeedback(prev => [...prev, data]);
    console.log("Feedback received:", data);
  };

  const updateKYC = (status) => {
      setKycStatus(status);
  };

  return (
    <UserContext.Provider value={{
      currentUser, loginUser, signupUser, logoutUser,
      subscription, ripenMatch, isRipped, rippedMatches, userProfile, potentialMatches,
      deleteUser, banUser, grantPremium, revokePremium,
      adsSeen, incrementAdsSeen, processUpgrade, canRipen, updateUserProfile,
      business, createBusinessAccount, postAd, chats, sendMessage,
      onboardingComplete, setOnboardingComplete, submitFeedback, feedback,
      kycStatus, updateKYC
    }}>
      {children}
    </UserContext.Provider>
  );
};
