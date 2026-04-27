// Developer Service for Mock Data and Easy Access Mode

export const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE === 'true';

export const MOCK_USERS = [
  { id: 'mock1', alias: 'Aisha', age: 27, based: 'Lagos', job: 'Architect', values: ['Peace', 'Growth'], lifestyle: 'Quiet weekends with books', photo_url: 'https://picsum.photos/400/600?random=1' },
  { id: 'mock2', alias: 'Tunde', age: 31, based: 'Lagos', job: 'Software Engineer', values: ['Ambition', 'Loyalty'], lifestyle: 'Tech meetups and gym', photo_url: 'https://picsum.photos/400/600?random=2' },
  { id: 'mock3', alias: 'Chioma', age: 29, based: 'Lagos', job: 'Doctor', values: ['Family', 'Honesty'], lifestyle: 'Cooking and traveling', photo_url: 'https://picsum.photos/400/600?random=3' },
  { id: 'mock4', alias: 'Femi', age: 34, based: 'Abuja', job: 'Entrepreneur', values: ['Freedom', 'Impact'], lifestyle: 'Golf and networking', photo_url: 'https://picsum.photos/400/600?random=4' },
  { id: 'mock5', alias: 'Zainab', age: 25, based: 'Lagos', job: 'Fashion Designer', values: ['Creativity', 'Peace'], lifestyle: 'Art galleries and brunch', photo_url: 'https://picsum.photos/400/600?random=5' }
];

export const DEMO_PROFILES = {
  male: {
    id: 'demo_male',
    username: 'DemoMale',
    alias: 'Olu',
    age: 30,
    gender: 'Man',
    based: 'Lagos',
    job: 'Product Manager',
    is_premium: false,
    onboarding_complete: true,
    readinessScore: 8
  },
  female: {
    id: 'demo_female',
    username: 'DemoFemale',
    alias: 'Ngozi',
    age: 28,
    gender: 'Woman',
    based: 'Lagos',
    job: 'Legal Counsel',
    is_premium: false,
    onboarding_complete: true,
    readinessScore: 9
  },
  premium: {
    id: 'demo_premium',
    username: 'PremiumUser',
    alias: 'GoldMember',
    age: 32,
    gender: 'Woman',
    based: 'Lagos',
    job: 'Fintech Founder',
    is_premium: true,
    onboarding_complete: true,
    readinessScore: 10
  },
  admin: {
    id: 'demo_admin',
    username: 'AdminTester',
    alias: 'PeachAdmin',
    is_admin: true,
    onboarding_complete: true
  }
};

export const devService = {
  createGuestSession: () => {
    const guestId = 'guest_' + Math.random().toString(36).substr(2, 9);
    const guestUser = {
      id: guestId,
      email: 'guest@example.com',
      is_guest: true
    };
    const guestProfile = {
      id: guestId,
      username: 'GuestUser',
      alias: 'Guest User',
      based: 'Lagos',
      onboarding_complete: false,
      is_guest: true
    };

    localStorage.setItem('peach_guest_session', JSON.stringify({ user: guestUser, profile: guestProfile }));
    return { user: guestUser, profile: guestProfile };
  },

  getStoredSession: () => {
    const session = localStorage.getItem('peach_guest_session');
    return session ? JSON.parse(session) : null;
  },

  clearSession: () => {
    localStorage.removeItem('peach_guest_session');
  },

  loginAsDemo: (type) => {
    const profile = DEMO_PROFILES[type];
    const user = { id: profile.id, email: `${type}@demo.com`, is_demo: true };
    localStorage.setItem('peach_guest_session', JSON.stringify({ user, profile }));
    return { user, profile };
  }
};
