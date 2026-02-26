export const wingmanService = {
  // Now accepts an optional context object { lastMessage: string }
  generateLine: (user, match, context = {}) => {
    const { basics: uBasics, life: uLife } = user;
    const { basics: mBasics, life: mLife, work: mWork, relationships: mRel, alias, profession: mProf } = match;

    // Helper to get random item
    const getRandom = (arr) => arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : null;

    // --- CONVERSATION REPLY MODE ---
    if (context.lastMessage) {
        const lastMsg = context.lastMessage.toLowerCase();
        const replies = [];

        // Generic reply templates based on keywords
        if (lastMsg.includes('shift') || lastMsg.includes('work') || lastMsg.includes('hospital')) {
            replies.push(
                `Tell me about it! I'm dragging myself through this week. 😩`,
                `Omo, don't remind me. Is it at least quiet on your end?`,
                `You're working hard! Remember to hydrate. 💧`
            );
        } else if (lastMsg.includes('lol') || lastMsg.includes('haha') || lastMsg.includes('funny')) {
            replies.push(
                `Glad I could make you laugh! 😉`,
                `I try my best! So what else makes you smile?`,
                `See? We're vibe-ing already.`
            );
        } else if (lastMsg.includes('hello') || lastMsg.includes('hi') || lastMsg.includes('hey')) {
             replies.push(
                `Hey! How's your day going?`,
                `Hi there! Ready to trade war stories?`,
                `Hey! I was just thinking about messaging you.`
             );
        } else if (lastMsg.includes('?')) {
             // If they asked a question
             replies.push(
                `That's a good question! Honestly? I'd have to think about it. What about you?`,
                `Hmm, let me get back to you on that one. 😉`,
                `You're diving deep! I like it.`
             );
        } else {
             // Default replies
             replies.push(
                `That's interesting! Tell me more.`,
                `No way! Really?`,
                `I feel that. So what are you up to now?`
             );
        }

        return getRandom(replies);
    }

    // --- OPENER MODE ---
    const potentialOpeners = [];

    // 1. Corny Lines (Highly requested)
    const cornyLines = [
      `Do you have a map? Because I just got lost in your profile description. 🗺️`,
      `Are you a professional? Because you've definitely mastered the art of looking good. 😉`,
      `I'm not a photographer, but I can definitely picture us having a great conversation. 📸`,
      `Is your name Google? Because you have everything I’m searching for in a match. 🔍`,
      `Are we at the airport? Because my heart is taking off seeing your profile. ✈️`,
      `If being beautiful was a crime, you’d be serving a life sentence without parole. ⚖️`,
      `Are you a magician? Because whenever I look at your photos, everyone else disappears. ✨`
    ];

    // 2. Shared Fun / Media
    const commonFun = uBasics?.fun?.filter(f => mBasics?.fun?.includes(f)) || [];
    if (commonFun.length > 0) {
      const activity = getRandom(commonFun);
      potentialOpeners.push(
        `So, be honest... who's better at ${activity}, you or me? 😉`,
        `I see we both enjoy ${activity}. Is there a good spot in ${mLife.based} for that?`,
        `Okay, ${alias}, scale of 1-10, how obsessed are you with ${activity}? because I'm at an 11.`
      );
    }

    const commonMedia = uBasics?.media?.filter(m => mBasics?.media?.includes(m)) || [];
    if (commonMedia.length > 0) {
      const media = getRandom(commonMedia);
      potentialOpeners.push(
        `You like ${media} too? Please tell me you have good taste in characters!`,
        `Thoughts on the latest from ${media}? I need a debate partner.`,
        `If we were in a ${media} movie, who would be the villain? 😂`
      );
    }

    // 3. Work / Profession Context
    if (mProf === 'Nursing' || mWork?.job?.toLowerCase().includes('nurse')) {
      potentialOpeners.push(
        `So ${mWork?.job || 'Nursing'}... surviving the ward or barely hanging on? 😅`,
        `What's the craziest thing you've seen on shift this week? I have stories.`,
        `Night shifts or early mornings? Don't break my heart with the wrong answer.`,
        `Are you a nurse? Because you just cured my bad day. 🏥❤️`
      );
    } else if (mProf === 'Tech' || mWork?.job?.toLowerCase().includes('dev')) {
      potentialOpeners.push(
        `I see you're in tech. Are we a match or is this just a bug in the algorithm? 💻`,
        `If you were a line of code, you'd be the one that finally makes my project work. 🚀`,
        `Python, JavaScript, or just good vibes? what's your preferred language?`
      );
    } else if (mProf === 'Law' || mWork?.job?.toLowerCase().includes('lawyer')) {
      potentialOpeners.push(
        `I'd like to object! Your profile is way too interesting to ignore. ⚖️`,
        `Are you a lawyer? Because you've definitely made a convincing case for us to talk.`
      );
    } else if (mProf === 'Business' || mWork?.job?.toLowerCase().includes('biz')) {
      potentialOpeners.push(
        `Let's talk business. What's the ROI on me sending this message? 📈`,
        `I see you're into business. Are you looking for a partner or just a good connection?`
      );
    }

    // 4. Location / Based (Playful Rivalry)
    if (uLife?.based !== mLife?.based) {
      potentialOpeners.push(`So, is the Suya better in ${mLife?.based} or should I bring some from ${uLife?.based}? 🍖`);
    } else {
      potentialOpeners.push(`Since we're both in ${mLife?.based}, you must know the best spot to hide from responsibilities?`);
    }

    // 5. Values / Deep (If looking for long-term)
    if (mRel?.lookingFor === 'Long-term' || mRel?.lookingFor === 'Marriage' || mRel?.lookingFor === 'Serious Relationship') {
      const value = getRandom(mRel?.values || []);
      if (value) {
        potentialOpeners.push(`I saw you value ${value}. That's rare these days. What does that look like for you?`);
      }
    }

    // 6. Fallback / General (Always add)
    potentialOpeners.push(
      `Okay ${alias}, your profile is a vibe. What's the story behind your alias?`,
      `If you could be anywhere but ${mLife?.based} right now, where would you go?`,
      `Hi! I'm terrible at starting conversations, so... pretend I said something charming? 😎`,
      ...cornyLines
    );

    return getRandom(potentialOpeners);
  }
};
