"use client";

export const LOCAL_AUTH_KEY = 'peach_local_session';
export const LOCAL_USERS_KEY = 'peach_local_users';

const getLocalUsers = () => {
  if (typeof window === 'undefined') return [];
  const users = localStorage.getItem(LOCAL_USERS_KEY);
  return users ? JSON.parse(users) : [];
};

const saveLocalUser = (user) => {
  const users = getLocalUsers();
  users.push(user);
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
};

export const localAuth = {
  signUp: async (email, password, username) => {
    // Check if user already exists
    const users = getLocalUsers();
    if (users.find(u => u.email === email)) {
        return { data: null, error: { message: 'User already exists in local mode' } };
    }
    const id = 'user_' + Math.random().toString(36).substr(2, 9);
    const user = { id, email, username, onboarding_complete: false };
    saveLocalUser(user);
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return { data: { user }, error: null };
  },

  signIn: async (email, password) => {
    const users = getLocalUsers();
    const user = users.find(u => u.email === email);
    if (user) {
      localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
      return { data: { user }, error: null };
    }
    return { data: null, error: { message: 'User not found in local mode. Please sign up.' } };
  },

  signOut: async () => {
    localStorage.removeItem(LOCAL_AUTH_KEY);
    return { error: null };
  },

  getSession: () => {
    if (typeof window === 'undefined') return null;
    const session = localStorage.getItem(LOCAL_AUTH_KEY);
    return session ? JSON.parse(session) : null;
  },

  createGuestUser: () => {
    const id = 'guest_' + Math.random().toString(36).substr(2, 9);
    const user = {
      id,
      email: 'guest@peach.ai',
      username: 'GuestUser',
      name: 'Guest User',
      based: 'Lagos',
      is_guest: true,
      onboarding_complete: false
    };
    localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
    return user;
  }
};
