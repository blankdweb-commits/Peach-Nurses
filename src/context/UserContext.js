// src/context/UserContext.js
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

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
  const [chats, setChats] = useState({});
  const [loading, setLoading] = useState(true);
  const [potentialMatches, setPotentialMatches] = useState([]);

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
        const savedChats = localStorage.getItem('chats');

        if (savedUser) setCurrentUser(JSON.parse(savedUser));
        if (savedProfile) setUserProfile(JSON.parse(savedProfile));
        if (savedOnboarding) setOnboardingComplete(JSON.parse(savedOnboarding));
        if (savedSubscription) setSubscription(JSON.parse(savedSubscription));
        if (savedRipenedUsers) setRipenedUsers(JSON.parse(savedRipenedUsers));
        if (savedMatches) setMatches(JSON.parse(savedMatches));
        if (savedChats) setChats(JSON.parse(savedChats));

        // Load mock potential matches
        loadPotentialMatches();
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);
  

  // Load potential matches
  const loadPotentialMatches = () => {
    const MOCK_USERS = [
      {
        id: '1',
        alias: "Nurse_Peachy99",
        realName: "Nneka Okoro",
        level: "Year 2",
        based: "Sapele",
        distance: 1.2,
        photoUrl: `https://picsum.photos/400/600?random=1`,
        basics: {
          fun: ["Eating Boli", "Watching Nollywood", "Swimming"],
          media: ["Afrobeats", "Davido", "K-Dramas"]
        },
        life: {
          based: "Sapele",
          upbringing: "Strict but loving, raised by grandma."
        },
        work: {
          job: "Student Nurse",
          reason: "Always wanted to help people heal."
        },
        relationships: {
          values: ["Honesty", "God-fearing", "Family"],
          lookingFor: "Long-term"
        },
        vision: "A simple life with a small clinic of my own someday.",
        special: "Communication is key to everything.",
        isOnline: true
      },
      {
        id: '2',
        alias: "Delta_Doc_Crush",
        realName: "Emeka Efe",
        level: "Intern",
        based: "Warri",
        distance: 15.0,
        photoUrl: `https://picsum.photos/400/600?random=2`,
        basics: {
          fun: ["Gym", "Chopping Life", "Reading"],
          media: ["Burna Boy", "Action Movies", "Afrobeats"]
        },
        life: {
          based: "Warri",
          upbringing: "Busy city life, big family."
        },
        work: {
          job: "Medical Intern",
          reason: "Medicine is challenging and rewarding."
        },
        relationships: {
          values: ["Ambition", "Loyalty", "Respect"],
          lookingFor: "Casual"
        },
        vision: "Traveling the world and saving lives.",
        special: "Never go to bed angry.",
        isOnline: false
      },
      {
        id: '3',
        alias: "Asaba_Angel",
        realName: "Chidinma Obi",
        level: "Year 3",
        based: "Asaba",
        distance: 45.0,
        photoUrl: `https://picsum.photos/400/600?random=3`,
        basics: {
          fun: ["Cooking Egusi", "Church", "Reading"],
          media: ["Gospel", "RomComs", "K-Dramas"]
        },
        life: {
          based: "Asaba",
          upbringing: "Quiet, religious home."
        },
        work: {
          job: "Pediatric Nurse",
          reason: "I love children."
        },
        relationships: {
          values: ["God-fearing", "Family", "Honesty"],
          lookingFor: "Marriage"
        },
        vision: "A happy family and a peaceful home.",
        special: "Love is patient.",
        isOnline: true
      },
      {
        id: '4',
        alias: "Ughelli_Medic",
        realName: "Tega James",
        level: "Intern",
        based: "Ughelli",
        distance: 25.0,
        photoUrl: `https://picsum.photos/400/600?random=4`,
        basics: {
          fun: ["Playing Ludo", "Swimming", "Gym"],
          media: ["Wizkid", "Action Movies", "Afrobeats"]
        },
        life: {
          based: "Ughelli",
          upbringing: "Adventurous, lots of outdoor play."
        },
        work: {
          job: "Emergency Room Nurse",
          reason: "The adrenaline and saving lives."
        },
        relationships: {
          values: ["Humor", "Loyalty", "Ambition"],
          lookingFor: "Long-term"
        },
        vision: "Building a hospital in my hometown.",
        special: "Respect is earned, not given.",
        isOnline: false
      },
      {
        id: '5',
        alias: "Sapele_Siren",
        realName: "Blessing Keyamo",
        level: "Year 1",
        based: "Sapele",
        distance: 2.5,
        photoUrl: `https://picsum.photos/400/600?random=5`,
        basics: {
          fun: ["Sleeping", "Watching Nollywood", "Eating Boli"],
          media: ["Davido", "RomComs", "Afrobeats"]
        },
        life: {
          based: "Sapele",
          upbringing: "Fun, chaotic, full of love."
        },
        work: {
          job: "Student",
          reason: "Stable career path."
        },
        relationships: {
          values: ["Family", "Respect", "Honesty"],
          lookingFor: "Study Buddy"
        },
        vision: "Passing exams and getting a good job.",
        special: "Forgiveness heals the soul.",
        isOnline: true
      }
    ];
    
    setPotentialMatches(MOCK_USERS);
    localStorage.setItem('potentialMatches', JSON.stringify(MOCK_USERS));
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

  // Login function
  const login = (email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
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

  const loginUser = login;

  // Signup function
  const signup = (email, password) => {
    try {
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      
      if (users.some(u => u.email === email)) {
        return false;
      }

      const newUser = {
        id: `user_${Date.now()}`,
        email,
        password,
        username: email.split('@')[0],
        createdAt: new Date().toISOString()
      };

      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));

      const { password: _, ...userWithoutPassword } = newUser;
      setCurrentUser(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));
      
      return true;
    } catch (error) {
      console.error('Signup error:', error);
      return false;
    }
  };

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
    setRipenedUsers([]);
    setMatches([]);
    setChats({});
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userProfile');
    localStorage.removeItem('onboardingComplete');
    localStorage.removeItem('subscription');
    localStorage.removeItem('ripenedUsers');
    localStorage.removeItem('matches');
    localStorage.removeItem('chats');
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
        expiresAt: paymentDetails.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
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

  // Send a message
  const sendMessage = (matchId, text) => {
    const newMessage = {
      id: `msg_${Date.now()}_${Math.random()}`,
      text,
      sender: 'me',
      timestamp: new Date().toISOString(),
      read: false
    };

    setChats(prev => {
      const updatedChats = {
        ...prev,
        [matchId]: [...(prev[matchId] || []), newMessage]
      };
      localStorage.setItem('chats', JSON.stringify(updatedChats));
      return updatedChats;
    });
  };

  // Ripen a match
  const ripenMatch = async (targetUserId) => {
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

    const newRipenedUsers = [...ripenedUsers, targetUserId];
    setRipenedUsers(newRipenedUsers);
    localStorage.setItem('ripenedUsers', JSON.stringify(newRipenedUsers));
    
    dailyRipens.push(today);
    localStorage.setItem('dailyRipens', JSON.stringify(dailyRipens));

    if (!subscription.isPremium) {
      const remaining = Math.max(0, dailyLimit - (todayRipens.length + 1));
      setSubscription(prev => ({ 
        ...prev, 
        dailyUnripes: remaining 
      }));
      localStorage.setItem('subscription', JSON.stringify({
        ...subscription,
        dailyUnripes: remaining
      }));
    }

    // Check for mutual match (30% chance)
    const mutualMatch = Math.random() > 0.7;
    
    if (mutualMatch) {
      const matchUser = potentialMatches.find(u => u.id === targetUserId);
      
      if (matchUser) {
        const newMatch = {
          id: targetUserId,
          userId: targetUserId,
          alias: matchUser.alias,
          realName: matchUser.realName,
          photoUrl: matchUser.photoUrl,
          level: matchUser.level,
          basics: matchUser.basics,
          matchedAt: new Date().toISOString(),
          lastMessage: null,
          lastMessageTime: null,
          isOnline: matchUser.isOnline || false
        };
        
        const updatedMatches = [...matches, newMatch];
        setMatches(updatedMatches);
        localStorage.setItem('matches', JSON.stringify(updatedMatches));
        
        // Initialize chat for this match
        setChats(prev => {
          const updatedChats = { ...prev, [targetUserId]: [] };
          localStorage.setItem('chats', JSON.stringify(updatedChats));
          return updatedChats;
        });
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

  // Get ripped matches (for ChatList)
  const rippedMatches = useMemo(() => {
    return matches.filter(match => ripenedUsers.includes(match.id));
  }, [matches, ripenedUsers]);

  const value = {
    currentUser,
    userProfile,
    onboardingComplete,
    subscription,
    adsSeen,
    ripenedUsers,
    matches,
    chats,
    loading,
    potentialMatches,
    rippedMatches,
    login,
    loginUser,
    signup,
    signupUser,
    logout,
    updateUserProfile,
    setOnboardingComplete: completeOnboarding,
    upgradeToPremium,
    cancelPremium,
    ripenMatch,
    isRipped,
    incrementAdsSeen,
    sendMessage
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};