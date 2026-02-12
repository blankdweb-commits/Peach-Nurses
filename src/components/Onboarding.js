import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';

const Onboarding = () => {
  const { updateUserProfile, setOnboardingComplete } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    username: '',
    alias: '',
    level: '',
    based: '',
    upbringing: '',
    job: '',
    fun: [],
    media: [],
    values: [],
    lookingFor: '',
    vision: '',
    special: ''
  });
  
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');

  const LOCATIONS = ['Asaba', 'Warri', 'Ughelli', 'Sapele', 'Agbor', 'Okpanam', 'Abraka', 'Patani'];
  const LEVELS = ['100L', '200L', '300L', '400L', '500L', 'Intern', 'Staff Nurse', 'Senior Nurse'];

  // Function to check username availability (simulated API call)
  const checkUsernameAvailability = async (username) => {
    if (!username || username.length < 3) {
      setUsernameAvailable(null);
      setUsernameMessage('');
      return;
    }

    setCheckingUsername(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // In a real app, this would be an API call to your backend
    const takenUsernames = ['peachlover', 'deltaqueen', 'goldennurse', 'nursejohn', 'medstudent'];
    
    if (takenUsernames.includes(username.toLowerCase())) {
      setUsernameAvailable(false);
      setUsernameMessage('Username is already taken');
    } else if (username.length < 3) {
      setUsernameAvailable(false);
      setUsernameMessage('Username must be at least 3 characters');
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameAvailable(false);
      setUsernameMessage('Only letters, numbers, and underscores allowed');
    } else if (username.length > 20) {
      setUsernameAvailable(false);
      setUsernameMessage('Username must be 20 characters or less');
    } else {
      setUsernameAvailable(true);
      setUsernameMessage('Username is available!');
    }
    
    setCheckingUsername(false);
  };

  // Debounced username check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.username) {
        checkUsernameAvailability(formData.username);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'username') {
      setUsernameAvailable(null);
      setUsernameMessage('');
    }
  };

  const handleMultiSelect = (field, value) => {
    setFormData(prev => {
      const current = prev[field];
      if (current.includes(value)) {
        return { ...prev, [field]: current.filter(item => item !== value) };
      } else {
        return { ...prev, [field]: [...current, value] };
      }
    });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else {
      // FIXED: Save all profile data and complete onboarding
      const completeProfile = {
        ...formData,
        id: `user_${Date.now()}`,
        createdAt: new Date().toISOString(),
        photoUrl: `https://picsum.photos/400/600?random=${Math.random()}`,
        distance: 0
      };
      
      // Save to context
      updateUserProfile(completeProfile);
      
      // Mark onboarding as complete - this will trigger navigation to Discover
      setOnboardingComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStep1 = () => {
    return (
      <div style={styles.stepContainer}>
        <h2>Welcome to Peach 🍑</h2>
        <p style={styles.subtitle}>Let's create your profile to find your perfect match</p>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Choose your username *
            <span style={styles.requirement}> (3-20 characters, letters/numbers only)</span>
          </label>
          <div style={styles.usernameInputContainer}>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              placeholder="e.g., peach_lover123"
              maxLength={20}
              style={{
                ...styles.input,
                ...(usernameAvailable === true ? styles.usernameAvailable : {}),
                ...(usernameAvailable === false ? styles.usernameTaken : {})
              }}
            />
            {checkingUsername && (
              <span style={styles.checkingIndicator}>Checking...</span>
            )}
          </div>
          
          {usernameMessage && (
            <div style={{
              ...styles.usernameMessage,
              ...(usernameAvailable ? styles.usernameSuccess : styles.usernameError)
            }}>
              {usernameMessage}
            </div>
          )}
          
          <small style={styles.small}>
            This will be your unique identifier on Peach. You can't change it later.
          </small>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Choose your display alias</label>
          <input
            type="text"
            value={formData.alias}
            onChange={(e) => handleInputChange('alias', e.target.value)}
            placeholder="e.g., Golden Nurse, Delta Queen"
            maxLength={20}
            style={styles.input}
          />
          <small style={styles.small}>This is how others will see you. You can change it anytime.</small>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Your level *</label>
          <div style={styles.optionsGrid}>
            {LEVELS.map(level => (
              <button
                key={level}
                type="button"
                style={{
                  ...styles.optionBtn,
                  ...(formData.level === level ? styles.selectedOption : {})
                }}
                onClick={() => handleInputChange('level', level)}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep2 = () => {
    return (
      <div style={styles.stepContainer}>
        <h2>Tell us about your life</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>Where are you based? *</label>
          <div style={styles.optionsGrid}>
            {LOCATIONS.map(location => (
              <button
                key={location}
                type="button"
                style={{
                  ...styles.optionBtn,
                  ...(formData.based === location ? styles.selectedOption : {})
                }}
                onClick={() => handleInputChange('based', location)}
              >
                {location}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Tell us about your upbringing</label>
          <textarea
            value={formData.upbringing}
            onChange={(e) => handleInputChange('upbringing', e.target.value)}
            placeholder="Share about your family, background, culture..."
            rows={4}
            style={styles.textarea}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>What do you do? *</label>
          <input
            type="text"
            value={formData.job}
            onChange={(e) => handleInputChange('job', e.target.value)}
            placeholder="e.g., Nurse, Student, Entrepreneur"
            style={styles.input}
          />
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    return (
      <div style={styles.stepContainer}>
        <h2>Your interests & values</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>What do you do for fun? (Select up to 5)</label>
          <div style={styles.optionsGrid}>
            {['Movies', 'Music', 'Sports', 'Reading', 'Travel', 'Cooking', 'Dancing', 'Gaming', 'Art', 'Fashion'].map(item => (
              <button
                key={item}
                type="button"
                style={{
                  ...styles.optionBtn,
                  ...(formData.fun.includes(item) ? styles.selectedOption : {}),
                  ...(formData.fun.length >= 5 && !formData.fun.includes(item) ? styles.disabledOption : {})
                }}
                onClick={() => handleMultiSelect('fun', item)}
                disabled={formData.fun.length >= 5 && !formData.fun.includes(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <small style={styles.small}>{formData.fun.length}/5 selected</small>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Favorite media (movies, books, shows)</label>
          <div style={styles.optionsGrid}>
            {['Nollywood', 'Hollywood', 'Bollywood', 'Netflix', 'Anime', 'Documentaries', 'Novels', 'Comics'].map(item => (
              <button
                key={item}
                type="button"
                style={{
                  ...styles.optionBtn,
                  ...(formData.media.includes(item) ? styles.selectedOption : {})
                }}
                onClick={() => handleMultiSelect('media', item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Relationship values (What matters most?)</label>
          <div style={styles.optionsGrid}>
            {['Honesty', 'Loyalty', 'Communication', 'Independence', 'Family', 'Career', 'Faith', 'Adventure'].map(item => (
              <button
                key={item}
                type="button"
                style={{
                  ...styles.optionBtn,
                  ...(formData.values.includes(item) ? styles.selectedOption : {})
                }}
                onClick={() => handleMultiSelect('values', item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderStep4 = () => {
    return (
      <div style={styles.stepContainer}>
        <h2>Final touches</h2>
        
        <div style={styles.formGroup}>
          <label style={styles.label}>What are you looking for? *</label>
          <select
            value={formData.lookingFor}
            onChange={(e) => handleInputChange('lookingFor', e.target.value)}
            style={styles.select}
          >
            <option value="">Select one...</option>
            <option value="Serious Relationship">Serious Relationship</option>
            <option value="Casual Dating">Casual Dating</option>
            <option value="Friendship">Friendship</option>
            <option value="Networking">Networking</option>
            <option value="Not sure yet">Not sure yet</option>
          </select>
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>Your vision for the future</label>
          <textarea
            value={formData.vision}
            onChange={(e) => handleInputChange('vision', e.target.value)}
            placeholder="Where do you see yourself in 5 years? What are your dreams?"
            rows={4}
            style={styles.textarea}
          />
        </div>

        <div style={styles.formGroup}>
          <label style={styles.label}>What makes you special?</label>
          <textarea
            value={formData.special}
            onChange={(e) => handleInputChange('special', e.target.value)}
            placeholder="Share something unique about yourself..."
            rows={4}
            style={styles.textarea}
          />
        </div>
      </div>
    );
  };

  const progressPercentage = ((currentStep - 1) / 3) * 100;

  const isStep1Valid = () => {
    return formData.username && 
           formData.username.length >= 3 && 
           formData.level && 
           usernameAvailable === true;
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.progressBar}>
          <div 
            style={{ ...styles.progressFill, width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div style={styles.stepIndicator}>Step {currentStep} of 4</div>
      </div>

      <div style={styles.content}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </div>

      <div style={styles.footer}>
        <div style={styles.buttonGroup}>
          {currentStep > 1 && (
            <button 
              type="button" 
              style={styles.backButton}
              onClick={handleBack}
            >
              ← Back
            </button>
          )}
          
          <button 
            type="button" 
            style={{
              ...styles.continueButton,
              ...((currentStep === 1 && !isStep1Valid()) ||
                  (currentStep === 2 && (!formData.based || !formData.job)) ||
                  (currentStep === 4 && !formData.lookingFor)) ? styles.disabledButton : {}
            }}
            onClick={handleNext}
            disabled={
              (currentStep === 1 && !isStep1Valid()) ||
              (currentStep === 2 && (!formData.based || !formData.job)) ||
              (currentStep === 4 && !formData.lookingFor)
            }
          >
            {currentStep === 4 ? 'Complete Profile' : 'Continue →'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '600px',
    margin: '0 auto',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    minHeight: '100vh',
    backgroundColor: 'white'
  },
  header: {
    marginBottom: '30px'
  },
  progressBar: {
    height: '8px',
    backgroundColor: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '10px'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6347',
    transition: 'width 0.3s ease'
  },
  stepIndicator: {
    textAlign: 'center',
    color: '#666',
    fontSize: '0.9rem'
  },
  content: {
    marginBottom: '100px'
  },
  stepContainer: {
    padding: '20px 0'
  },
  subtitle: {
    color: '#666',
    marginBottom: '30px',
    textAlign: 'center'
  },
  formGroup: {
    marginBottom: '25px'
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333'
  },
  requirement: {
    fontWeight: 'normal',
    fontSize: '0.9em',
    color: '#666'
  },
  usernameInputContainer: {
    position: 'relative'
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    boxSizing: 'border-box'
  },
  usernameAvailable: {
    borderColor: '#4CAF50',
    backgroundColor: '#F0FFF4'
  },
  usernameTaken: {
    borderColor: '#FF6347',
    backgroundColor: '#FFF0E6'
  },
  checkingIndicator: {
    position: 'absolute',
    right: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#666',
    fontSize: '0.9em'
  },
  usernameMessage: {
    marginTop: '5px',
    padding: '8px 12px',
    borderRadius: '4px',
    fontSize: '0.9em'
  },
  usernameSuccess: {
    backgroundColor: '#E8F5E9',
    color: '#2E7D32',
    border: '1px solid #C8E6C9'
  },
  usernameError: {
    backgroundColor: '#FFEBEE',
    color: '#C62828',
    border: '1px solid #FFCDD2'
  },
  textarea: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  select: {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '16px',
    backgroundColor: 'white',
    boxSizing: 'border-box'
  },
  small: {
    display: 'block',
    marginTop: '5px',
    color: '#666',
    fontSize: '0.85rem'
  },
  optionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '10px',
    marginBottom: '10px'
  },
  optionBtn: {
    padding: '12px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  selectedOption: {
    borderColor: '#FF6347',
    backgroundColor: '#FFF0E6',
    color: '#FF6347',
    fontWeight: '600'
  },
  disabledOption: {
    opacity: 0.5,
    cursor: 'not-allowed'
  },
  footer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    padding: '20px',
    boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
  },
  buttonGroup: {
    display: 'flex',
    gap: '15px'
  },
  backButton: {
    flex: 1,
    padding: '15px',
    border: '2px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: 'white',
    fontSize: '16px',
    cursor: 'pointer'
  },
  continueButton: {
    flex: 2,
    padding: '15px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#FF6347',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  disabledButton: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
};

export default Onboarding;