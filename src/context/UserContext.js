// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

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
    dailyLimit: 25,
    plan: 'free',
    expiresAt: null,
    paymentHistory: []
  });
  const [adsSeen, setAdsSeen] = useState(0);
  const [ripenedUsers, setRipenedUsers] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load user data from localStorage
  useEffect(() => {
    const loadUserData = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        const savedProfile = localStorage.getItem('userProfile');
        const savedOnboarding = localStorage.getItem('onboardingComplete');
        const savedSubscription = localStorage.getItem('subscription');
        const savedRipenedUsers = localStorage.getItem('ripenedUsers');
        const savedMatches = localStorage.getItem('matches');

        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
        if (savedOnboarding) setOnboardingComplete(JSON.parse(savedOnboarding));
        if (savedSubscription) setSubscription(JSON.parse(savedSubscription));
        if (savedRipenedUsers) setRipenedUsers(JSON.parse(savedRipenedUsers));
        if (savedMatches) setMatches(JSON.parse(savedMatches));
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

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

  // Login function (what Auth.js expects)
  const login = (email, password) => {
    try {
      // Mock user database - in real app, this would be an API call
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // For demo purposes, accept test credentials
      if (email === 'test@peach.com' && password === 'password') {
        const userData = {
          id: 'test_user_1',
          email: 'test@peach.com',
          username: 'testuser',
          createdAt: new Date().toISOString()
        };
        setCurrentUser(userData);
        localStorage.setItem('currentUser', JSON.stringify(userData));
        return true;
      }

      // Check if user exists
      const user = users.find(u => u.email === email && u.password === password);
      if (user) {
        const { password: _, ...userWithoutPassword } = user;
        setCurrentUser(userWithoutPassword);
        localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  // Alias for Auth.js
  const loginUser = login;

  // Signup function (what Auth.js expects)
  const signup = (email, password) => {
    try {
      // Get existing users
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      // Check if email already exists
      if (users.some(u => u.email === email)) {
        return false;
      }

      // Create new user
      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password, // In real app, hash this!
        username: email.split('@')[0],
        createdAt: new Date().toISOString()
      };

      // Save to users list (without password in currentUser)
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      // Log user in
      const { password: _, ...userWithoutPassword } = newUser;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

  // Alias for Auth.js
  const signupUser = signup;

  const logout = () => {
    setCurrentUser(null);
    setUserProfile(null);
    setOnboardingComplete(false);
    setSubscription({
      isPremium: false,
      dailyUnripes: 25,
      dailyLimit: 25,
      plan: 'free',
      expiresAt: null,
      paymentHistory: []
    });
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('subscription');
  };

  const updateUserProfile = (profileData) => {
    const updatedProfile = { ...userProfile, ...profileData };
    setUserProfile(updatedProfile);
    localStorage.setItem('userProfile', JSON.stringify(updatedProfile));
    return updatedProfile;
  };

  const completeOnboarding = () => {
    setOnboardingComplete(true);
    localStorage.setItem('onboardingComplete', JSON.stringify(true));
  };

  // Upgrade to premium
  const upgradeToPremium = async (paymentDetails) => {
    try {
      const newSubscription = {
        isPremium: true,
        dailyUnripes: 999,
        dailyLimit: 999,
        plan: 'premium',
        paymentMethod: paymentDetails.paymentMethod,
        reference: paymentDetails.reference,
        amount: paymentDetails.amount,
        upgradedAt: new Date().toISOString(),
        expiresAt: paymentDetails.expiresAt,
        paymentHistory: [
          ...subscription.paymentHistory,
          {
            ...paymentDetails,
            date: new Date().toISOString()
          }
        ]
      };

      setSubscription(newSubscription);
      localStorage.setItem('subscription', JSON.stringify(newSubscription));
      
      return true;
    } catch (error) {
      console.error('Error upgrading to premium:', error);
      return false;
    }
  };

  // Cancel premium subscription
  const cancelPremium = () => {
    const updatedSubscription = {
      ...subscription,
      isPremium: false,
      plan: 'free',
      dailyLimit: 25,
      dailyUnripes: 25
    };
    
    setSubscription(updatedSubscription);
    localStorage.setItem('subscription', JSON.stringify(updatedSubscription));
  };

  const ripenMatch = async (targetUserId) => {
    // Check daily limit
    const today = new Date().toISOString().split('T')[0];
    const dailyRipens = JSON.parse(localStorage.getItem('dailyRipens') || '[]');
    const todayRipens = dailyRipens.filter(date => date === today);
    
    const dailyLimit = subscription.isPremium ? 999 : 25;
    if (todayRipens.length >= dailyLimit) {
      return false;
    }

    if (ripenedUsers.includes(targetUserId)) {
      return false;
    }

    // Save ripened user
    const newRipenedUsers = [...ripenedUsers, targetUserId];
    setRipenedUsers(newRipenedUsers);
    localStorage.setItem('ripenedUsers', JSON.stringify(newRipenedUsers));
    
    // Save daily count
    dailyRipens.push(today);
    localStorage.setItem('dailyRipens', JSON.stringify(dailyRipens));

    // Update daily unripes counter
    if (!subscription.isPremium) {
      const remaining = Math.max(0, dailyLimit - (todayRipens.length + 1));
      setSubscription(prev => ({ 
        ...prev, 
        dailyUnripes: remaining 
      }));
    }

    // Check for mutual match (30% chance)
    const mutualMatch = Math.random() > 0.7;
    
    if (mutualMatch) {
      // Get match details from potential matches
      const matchUser = JSON.parse(localStorage.getItem('potentialMatches') || '[]')
        .find(u => u.id === targetUserId);
      
      if (matchUser) {
        const newMatch = {
          id: targetUserId,
          userId: targetUserId,
          alias: matchUser.alias,
          photoUrl: matchUser.photoUrl,
          matchedAt: new Date().toISOString(),
          lastMessage: null,
          lastMessageTime: null
        };
        const updatedMatches = [...matches, newMatch];
        setMatches(updatedMatches);
        localStorage.setItem('matches', JSON.stringify(updatedMatches));
      }
    }

    return true;
  };

  const isRipped = (userId) => {
    return ripenedUsers.includes(userId);
  };

  const incrementAdsSeen = () => {
    setAdsSeen(prev => prev + 1);
    localStorage.setItem('adsSeen', JSON.stringify(adsSeen + 1));
  };

  const value = {
    currentUser,
    userProfile,
    onboardingComplete,
    subscription,
    adsSeen,
    ripenedUsers,
    matches,
    loading,
    login,
    loginUser, // Add for Auth.js
    signup,
    signupUser, // Add for Auth.js
    logout,
    updateUserProfile,
    setOnboardingComplete: completeOnboarding,
    upgradeToPremium,
    cancelPremium,
    ripenMatch,
    isRipped,
    incrementAdsSeen,
    potentialMatches: []
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};