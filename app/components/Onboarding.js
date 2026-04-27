"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useUser } from '../context/UserContext';
import { peachAIService } from '../services/peachAIService';

const Onboarding = () => {
  const { updateUserProfile, setOnboardingComplete } = useUser();
  const [mode, setMode] = useState('basics'); // 'basics' or 'chat'
  const [currentStep, setCurrentStep] = useState(0);
  const [chatHistory, setChatHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [basics, setBasics] = useState({
    username: '',
    age: '',
    gender: '',
    based: 'Lagos',
    lookingFor: ''
  });

  const LOCATIONS = ['Lagos', 'Abuja', 'Port Harcourt', 'Asaba', 'Warri', 'Accra'];
  const GENDERS = ['Man', 'Woman', 'Non-binary'];
  const LOOKING_FOR = ['Serious Relationship', 'Casual Dating', 'Friendship', 'Networking'];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (mode === 'chat') {
      scrollToBottom();
    }
  }, [chatHistory, mode]);

  useEffect(() => {
    if (mode === 'chat' && chatHistory.length === 0) {
      sendPeachMessage(0);
    }
  }, [mode]);

  const sendPeachMessage = (step) => {
    setIsTyping(true);
    setTimeout(() => {
      const question = peachAIService.getOnboardingQuestion(step, basics);
      setChatHistory(prev => [...prev, { sender: 'peach', text: question.text, field: question.field }]);
      setIsTyping(false);
    }, 1500);
  };

  const handleBasicsSubmit = (e) => {
    e.preventDefault();
    if (basics.username && basics.age && basics.gender && basics.lookingFor) {
      setMode('chat');
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentQuestion = chatHistory.filter(m => m.sender === 'peach').slice(-1)[0];
    const newHistory = [...chatHistory, { sender: 'user', text: inputText }];
    setChatHistory(newHistory);

    // Update profile with answer
    if (currentQuestion && currentQuestion.field) {
      setBasics(prev => ({ ...prev, [currentQuestion.field]: inputText }));
    }

    setInputText('');

    if (currentStep < 4) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      sendPeachMessage(nextStep);
    } else {
      // Finalize
      setTimeout(() => {
        setChatHistory(prev => [...prev, { sender: 'peach', text: "Perfect. I've built your profile. Let's find your person." }]);
        setTimeout(finishOnboarding, 2000);
      }, 1000);
    }
  };

  const finishOnboarding = async () => {
    const completeProfile = {
      ...basics,
      onboarding_complete: true,
      photo_url: `https://picsum.photos/400/600?random=${Math.random()}`,
      values: basics.values ? basics.values.split(',').map(v => v.trim()) : [],
      lifestyle: basics.lifestyle || '',
      readinessScore: parseInt(basics.readinessScore) || 5,
      dealbreakers: basics.dealbreakers || ''
    };

    try {
      await updateUserProfile(completeProfile);
      await setOnboardingComplete();
    } catch (error) {
      alert("Error saving profile: " + error.message);
    }
  };

  if (mode === 'basics') {
    return (
      <div style={styles.container}>
        <div className="glass-card" style={styles.card}>
          <h2 style={styles.title}><span className="peach-text">Peach</span> Basics</h2>
          <p style={styles.subtitle}>Let's start with the essentials.</p>

          <form onSubmit={handleBasicsSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Username</label>
              <input
                type="text"
                style={styles.input}
                value={basics.username}
                onChange={e => setBasics({...basics, username: e.target.value})}
                placeholder="How should we call you?"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Age</label>
              <input
                type="number"
                style={styles.input}
                value={basics.age}
                onChange={e => setBasics({...basics, age: e.target.value})}
                placeholder="Your age"
                required
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Gender</label>
              <div style={styles.optionsGrid}>
                {GENDERS.map(g => (
                  <button
                    key={g}
                    type="button"
                    style={{...styles.optionBtn, ...(basics.gender === g ? styles.selectedOption : {})}}
                    onClick={() => setBasics({...basics, gender: g})}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Location</label>
              <select
                style={styles.select}
                value={basics.based}
                onChange={e => setBasics({...basics, based: e.target.value})}
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>What are you looking for?</label>
              <select
                style={styles.select}
                value={basics.lookingFor}
                onChange={e => setBasics({...basics, lookingFor: e.target.value})}
                required
              >
                <option value="">Select...</option>
                {LOOKING_FOR.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>

            <button type="submit" className="primary" style={styles.submitBtn}>
              Talk to Peach →
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.chatContainer}>
      <header style={styles.chatHeader}>
        <div style={styles.peachAvatar}>🍑</div>
        <div>
          <div style={styles.peachName}>Peach</div>
          <div style={styles.peachStatus}>{isTyping ? 'Typing...' : 'Online'}</div>
        </div>
      </header>

      <div style={styles.messagesArea}>
        {chatHistory.map((msg, i) => (
          <div key={i} style={{
            ...styles.messageWrapper,
            justifyContent: msg.sender === 'peach' ? 'flex-start' : 'flex-end'
          }}>
            <div style={{
              ...styles.bubble,
              backgroundColor: msg.sender === 'peach' ? 'var(--secondary-bg)' : 'var(--soft-peach)',
              color: msg.sender === 'peach' ? 'white' : 'var(--base-bg)',
              borderBottomLeftRadius: msg.sender === 'peach' ? '4px' : '18px',
              borderBottomRightRadius: msg.sender === 'user' ? '4px' : '18px',
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={styles.messageWrapper}>
            <div style={{...styles.bubble, backgroundColor: 'var(--secondary-bg)', color: 'var(--text-dim)'}}>
              ...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <form onSubmit={handleChatSubmit} style={styles.inputForm}>
          <input
            type="text"
            style={styles.chatInput}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Reply to Peach..."
            disabled={isTyping}
          />
          <button type="submit" className="primary" style={styles.sendBtn} disabled={isTyping || !inputText.trim()}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--base-bg)'
  },
  card: {
    width: '100%',
    maxWidth: '450px',
    padding: '30px',
  },
  title: {
    fontSize: '2rem',
    margin: '0 0 10px 0',
    textAlign: 'center'
  },
  subtitle: {
    color: 'var(--text-dim)',
    textAlign: 'center',
    marginBottom: '30px'
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    color: 'var(--text-dim)',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
    color: 'white',
    outline: 'none'
  },
  select: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--secondary-bg)',
    color: 'white',
    outline: 'none'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '10px'
  },
  optionBtn: {
    padding: '10px',
    borderRadius: '8px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--glass-bg)',
    color: 'var(--text-dim)',
    cursor: 'pointer',
    fontSize: '0.85rem'
  },
  selectedOption: {
    borderColor: 'var(--soft-peach)',
    color: 'var(--soft-peach)',
    backgroundColor: 'rgba(244, 182, 166, 0.1)'
  },
  submitBtn: {
    width: '100%',
    marginTop: '20px',
    fontSize: '1.1rem',
    border: 'none',
    fontWeight: 'bold'
  },
  chatContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    backgroundColor: 'var(--base-bg)'
  },
  chatHeader: {
    padding: '15px 20px',
    borderBottom: '1px solid var(--glass-border)',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    backgroundColor: 'var(--secondary-bg)'
  },
  peachAvatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    backgroundColor: 'var(--glass-bg)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    border: '1px solid var(--soft-peach)'
  },
  peachName: {
    fontWeight: 'bold',
    fontSize: '1.1rem'
  },
  peachStatus: {
    fontSize: '0.8rem',
    color: '#4CAF50'
  },
  messagesArea: {
    flex: 1,
    padding: '20px',
    overflowY: 'auto'
  },
  messageWrapper: {
    display: 'flex',
    marginBottom: '15px'
  },
  bubble: {
    maxWidth: '80%',
    padding: '12px 18px',
    borderRadius: '18px',
    fontSize: '1rem',
    lineHeight: '1.4'
  },
  inputArea: {
    padding: '20px',
    borderTop: '1px solid var(--glass-border)',
    backgroundColor: 'var(--secondary-bg)'
  },
  inputForm: {
    display: 'flex',
    gap: '10px'
  },
  chatInput: {
    flex: 1,
    padding: '12px 18px',
    borderRadius: '25px',
    border: '1px solid var(--glass-border)',
    backgroundColor: 'var(--base-bg)',
    color: 'white',
    outline: 'none'
  },
  sendBtn: {
    borderRadius: '50%',
    width: '45px',
    height: '45px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    border: 'none'
  }
};

export default Onboarding;
