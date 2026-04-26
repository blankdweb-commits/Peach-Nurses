// Peach AI Service - The intelligence behind the personal matchmaker

export const peachAIService = {
  // --- ONBOARDING INTERVIEWER ---
  getOnboardingQuestion: (step, userProfile) => {
    const questions = [
      {
        id: 'intro',
        text: "Hi, I’m Peach. I help serious people meet the right match. To get started, tell me what you’re looking for in a partner?",
        field: 'lookingForGoal'
      },
      {
        id: 'values',
        text: "That's a great start. What are three values you hold most dear in a relationship? (e.g., Peace, Ambition, Family, Honesty)",
        field: 'values'
      },
      {
        id: 'lifestyle',
        text: "I hear you. Now, tell me about your typical weekend. How do you recharge?",
        field: 'lifestyle'
      },
      {
        id: 'dealbreakers',
        text: "Good to know. What's one thing that is an absolute deal-breaker for you?",
        field: 'dealbreakers'
      },
      {
        id: 'readiness',
        text: "Final question: On a scale of 1-10, how ready do you feel to commit to a serious long-term relationship right now?",
        field: 'readinessScore'
      },
      {
        id: 'complete',
        text: "Thank you! I'm now scanning for someone who aligns with your soul. I'll show you my findings soon.",
        field: null
      }
    ];
    return questions[step] || questions[questions.length - 1];
  },

  // --- COMPATIBILITY SCORER ---
  calculateCompatibility: (user1, user2) => {
    // Phase 1: Rule-based scoring
    let score = 0;

    // Age compatibility (simple range)
    const ageDiff = Math.abs((user1.age || 25) - (user2.age || 25));
    if (ageDiff <= 5) score += 20;
    else if (ageDiff <= 10) score += 10;

    // Value alignment
    const commonValues = (user1.values || []).filter(v => (user2.values || []).includes(v));
    score += commonValues.length * 15;

    // Location alignment (Lagos is premium)
    if (user1.based === user2.based) score += 20;

    // Readiness score alignment
    const readinessDiff = Math.abs((user1.readinessScore || 5) - (user2.readinessScore || 5));
    if (readinessDiff <= 2) score += 15;

    return Math.min(score, 100);
  },

  // --- INTRO GENERATOR ---
  generateIntro: (match) => {
    const { alias, age, based, job, values, lifestyle } = match;
    const summaries = [
      `I found a ${age}-year-old ${job} in ${based}. They value ${(values || []).join(', ')}. They enjoy ${lifestyle}.`,
      `Meet someone who matches your energy: a ${job} from ${based} who deeply values ${(values || [0])}. `,
      `I think you'd connect with ${alias}. They're in ${based} and share your focus on ${values?.[0] || 'growth'}.`
    ];
    return summaries[Math.floor(Math.random() * summaries.length)];
  },

  // --- COACHING & READINESS ---
  getReadinessInsight: (profile) => {
    const score = profile.readinessScore || 5;
    if (score >= 8) return "You are in a prime state for a serious commitment. Your clarity on values is your greatest strength.";
    if (score >= 5) return "You're open to love, but perhaps still refining your vision. Focus on what 'peace' looks like for you.";
    return "You're in a period of self-discovery. This is a great time to observe your patterns before diving deep.";
  },

  // --- CONVERSATION HELPERS ---
  generateReply: (lastMessage) => {
    // Placeholder for AI chat logic
    return "That's an interesting perspective. How does that manifest in your daily life?";
  }
};
