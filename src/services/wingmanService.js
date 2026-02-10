export const wingmanService = {
  // Now accepts an optional context object { lastMessage: string }
  generateLine: (user, match, context = {}) => {
    const { basics: uBasics, life: uLife } = user;
    const { basics: mBasics, life: mLife, work: mWork, relationships: mRel, alias } = match;

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
                `Hi there! Ready to trade war stories from the ward?`,
                `Hey! I was just thinking about message you.`
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

    // --- OPENER MODE (Original Logic) ---

    // 1. Shared Fun / Media (Strongest Openers - Return immediately if found)
    const commonFun = uBasics.fun.filter(f => mBasics.fun.includes(f));
    if (commonFun.length > 0) {
      const activity = getRandom(commonFun);
      const openers = [
        `So, be honest... who's better at ${activity}, you or me? 😉`,
        `I see we both enjoy ${activity}. Is there a good spot in ${mLife.based} for that?`,
        `Okay, ${alias}, scale of 1-10, how obsessed are you with ${activity}? because I'm at an 11.`
      ];
      return getRandom(openers);
    }

    const commonMedia = uBasics.media.filter(m => mBasics.media.includes(m));
    if (commonMedia.length > 0) {
      const media = getRandom(commonMedia);
      const openers = [
        `You like ${media} too? Please tell me you have good taste in characters!`,
        `Thoughts on the latest from ${media}? I need a debate partner.`,
        `If we were in a ${media} movie, who would be the villain? 😂`
      ];
      return getRandom(openers);
    }

    // Collect other potential openers
    const potentialOpeners = [];

    // 2. Work / Nursing Context (Relatable Struggle)
    if (mWork.job.toLowerCase().includes('nurse') || mWork.job.toLowerCase().includes('student')) {
      potentialOpeners.push(
        `So ${mWork.job}... surviving the ward or barely hanging on? 😅`,
        `What's the craziest thing you've seen on shift this week? I have stories.`,
        `Night shifts or early mornings? Don't break my heart with the wrong answer.`
      );
    }

    // 3. Location / Based (Playful Rivalry)
    if (uLife.based !== mLife.based) {
      potentialOpeners.push(`So, is the Suya better in ${mLife.based} or should I bring some from ${uLife.based}? 🍖`);
    } else {
      potentialOpeners.push(`Since we're both in ${mLife.based}, you must know the best spot to hide from responsibilities?`);
    }

    // 4. Values / Deep (If looking for long-term)
    if (mRel.lookingFor === 'Long-term' || mRel.lookingFor === 'Marriage') {
      const value = getRandom(mRel.values);
      potentialOpeners.push(`I saw you value ${value}. That's rare these days. What does that look like for you?`);
    }

    // 5. Fallback / General (Always add)
    potentialOpeners.push(
      `Okay ${alias}, your profile is a vibe. What's the story behind your alias?`,
      `If you could be anywhere but ${mLife.based} right now, where would you go?`,
      `Hi! I'm terrible at starting conversations, so... pretend I said something charming? 😎`
    );

    return getRandom(potentialOpeners);
  }
};
