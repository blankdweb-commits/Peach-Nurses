import React, { useState } from 'react';
import { useUser } from '../context/UserContext';
// Remove unused import
// import { mockBackend } from '../services/mockBackend';
import FeedbackHandler from './FeedbackHandler';
import KYCVerification from './KYCVerification';

const Settings = ({ onNavigateToMembership, onNavigateToAdmin }) => {
  const { userProfile, updateUserProfile, subscription, business, createBusinessAccount, postAd, setOnboardingComplete, submitFeedback, logoutUser, kycStatus } = useUser();
  const [activeTab, setActiveTab] = useState('profile');
  const [adForm, setAdForm] = useState({
    title: '',
    content: '',
    price: '',
    image: null,
    headline: ''
  });
  const [processingAd, setProcessingAd] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showKYC, setShowKYC] = useState(false);

  const handleProfileChange = (field, value) => {
    updateUserProfile({ [field]: value });
  };

  const handleNestedProfileChange = (section, field, value) => {
    updateUserProfile({
      [section]: {
        ...userProfile[section],
        [field]: value
      }
    });
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      updateUserProfile({ photoUrl: fakeUrl });
    }
  };

  const handlePreferenceChange = (key, value) => {
    updateUserProfile({
      preferences: {
        [key]: value
      }
    });
  };

  const handleAdImageUpload = (e) => {
      const file = e.target.files[0];
      if (file) {
          setAdForm({ ...adForm, image: URL.createObjectURL(file) });
      }
  };

  const handleCreateBusiness = () => {
    if (kycStatus !== 'verified') {
        setShowKYC(true);
        return;
    }

    if (createBusinessAccount()) {
      alert("Business Account Created! You can now post ads.");
    } else {
      alert("Error: Ensure you are a Premium member.");
    }
  };

  const handlePostAd = async (e) => {
    e.preventDefault();
    if (!adForm.image) {
        alert("Please upload an image for your ad.");
        return;
    }
    setProcessingAd(true);

    setTimeout(async () => {
      const fakeRef = "ad_ref_" + Date.now();
      const success = await postAd(adForm, fakeRef);

      setProcessingAd(false);
      if (success) {
        setAdForm({ title: '', content: '', price: '', image: null, headline: '' });
        alert("Ad Posted Successfully! (₦1,200 deducted)");
      } else {
        alert("Payment Failed.");
      }
    }, 2000);
  };

  const handleRestartTutorial = () => {
    if (window.confirm("Restart the tutorial? This will take you back to onboarding.")) {
      setOnboardingComplete(false);
    }
  };

  if (showKYC) {
      return <KYCVerification onBack={() => setShowKYC(false)} />;
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Settings ⚙️</h2>

      <div style={styles.tabs}>
        <div 
          style={{
            ...styles.tab,
            ...(activeTab === 'profile' ? styles.activeTab : {})
          }} 
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </div>
        <div 
          style={{
            ...styles.tab,
            ...(activeTab === 'preferences' ? styles.activeTab : {})
          }} 
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </div>
        <div 
          style={{
            ...styles.tab,
            ...(activeTab === 'business' ? styles.activeTab : {})
          }} 
          onClick={() => setActiveTab('business')}
        >
          Business
        </div>
      </div>

      {activeTab === 'profile' && (
        <div style={styles.tabContent}>
          <h3>Edit Profile</h3>

          <div style={styles.avatarSection}>
            <div style={styles.avatarPreview}>
              {userProfile.photoUrl ? (
                <img src={userProfile.photoUrl} alt="Avatar" style={styles.avatarImage} />
              ) : (
                <span style={styles.avatarPlaceholder}>👤</span>
              )}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={styles.fileInput} />
          </div>

          <div style={styles.readOnlySection}>
            <label style={styles.label}>Name (Read-only)</label>
            <input style={styles.disabledInput} value={userProfile.name} disabled />
            <label style={styles.label}>Email (Read-only)</label>
            <input style={styles.disabledInput} value={userProfile.email} disabled />
          </div>

          <label style={styles.label}>Alias</label>
          <input 
            style={styles.input} 
            value={userProfile.alias} 
            onChange={(e) => handleProfileChange('alias', e.target.value)} 
          />

          <label style={styles.label}>Level</label>
          <input 
            style={styles.input} 
            value={userProfile.level} 
            onChange={(e) => handleProfileChange('level', e.target.value)} 
          />

          <hr style={styles.divider} />

          <h4>Life</h4>
          <label style={styles.label}>Based In</label>
          <input 
            style={styles.input} 
            value={userProfile.life.based} 
            onChange={(e) => handleNestedProfileChange('life', 'based', e.target.value)} 
          />

          <label style={styles.label}>Upbringing</label>
          <textarea 
            style={styles.textarea} 
            value={userProfile.life.upbringing} 
            onChange={(e) => handleNestedProfileChange('life', 'upbringing', e.target.value)} 
          />

          <h4>Work</h4>
          <label style={styles.label}>Job</label>
          <input 
            style={styles.input} 
            value={userProfile.work.job} 
            onChange={(e) => handleNestedProfileChange('work', 'job', e.target.value)} 
          />

          <h4>Vision</h4>
          <textarea 
            style={styles.textarea} 
            value={userProfile.vision} 
            onChange={(e) => handleProfileChange('vision', e.target.value)} 
          />

          <h4>Special</h4>
          <textarea 
            style={styles.textarea} 
            value={userProfile.special} 
            onChange={(e) => handleProfileChange('special', e.target.value)} 
          />
        </div>
      )}

      {activeTab === 'preferences' && (
        <div style={styles.tabContent}>
          <h3>App Preferences</h3>

          <div style={styles.preferenceCard}>
            <div style={styles.preferenceText}>
              <strong style={styles.preferenceTitle}>Show Targeted Ads</strong>
              <span style={styles.preferenceDescription}>
                {subscription.isPremium
                  ? "Opt-in to support local businesses."
                  : "Ads are required for Free plans."}
              </span>
            </div>

            <label style={styles.toggleSwitch}>
              <input
                type="checkbox"
                checked={!subscription.isPremium ? true : userProfile.preferences.allowAds}
                disabled={!subscription.isPremium}
                onChange={(e) => handlePreferenceChange('allowAds', e.target.checked)}
              />
              <span style={{
                ...styles.toggleSlider,
                backgroundColor: (!subscription.isPremium || userProfile.preferences.allowAds) ? '#FF6347' : '#ccc',
                cursor: !subscription.isPremium ? 'not-allowed' : 'pointer',
                opacity: !subscription.isPremium ? 0.6 : 1
              }}></span>
              <span style={{
                ...styles.toggleKnob,
                left: (!subscription.isPremium || userProfile.preferences.allowAds) ? '26px' : '4px'
              }}></span>
            </label>
          </div>

          <div style={styles.section}>
            <h4>Identity Verification</h4>
            <div
                onClick={() => setShowKYC(true)}
                style={styles.verificationCard}
            >
                <span>Status:
                    {kycStatus === 'verified' && <strong style={{ color: 'green' }}> Verified ✅</strong>}
                    {kycStatus === 'pending' && <strong style={{ color: 'orange' }}> Pending ⏳</strong>}
                    {kycStatus === 'rejected' && <strong style={{ color: 'red' }}> Rejected ❌</strong>}
                </span>
                <button style={styles.verifyButton}>
                  {kycStatus === 'verified' ? 'View' : 'Verify Now'}
                </button>
            </div>

            <h4>Help & Support</h4>
            <div style={styles.helpButtons}>
                <button
                  onClick={handleRestartTutorial}
                  style={styles.helpButton}
                >
                  📚 Restart Tutorial
                </button>
                <button
                  onClick={() => setShowFeedback(true)}
                  style={styles.helpButton}
                >
                  💬 Send Feedback / Report Bug
                </button>
                <button
                  onClick={onNavigateToAdmin}
                  style={styles.helpButton}
                >
                  🔒 Admin Dashboard
                </button>
                <button
                  onClick={logoutUser}
                  style={{
                    ...styles.helpButton,
                    background: '#ffebee',
                    border: '1px solid #ffcdd2',
                    color: '#d32f2f'
                  }}
                >
                  🚪 Logout
                </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'business' && (
        <div style={styles.tabContent}>
          <h3>Business Account</h3>

          {!subscription.isPremium ? (
            <div style={styles.premiumRequired}>
              <p>🔒 Business Accounts are for Premium Members only.</p>
              <button onClick={onNavigateToMembership} style={styles.upgradeButton}>
                Upgrade to Premium
              </button>
            </div>
          ) : (
            <>
              {!business.isBusiness ? (
                <div style={styles.createBusiness}>
                  <p>Create a business profile to start posting ads.</p>
                  {kycStatus !== 'verified' && <p style={styles.verificationWarning}>⚠️ Identity Verification Required</p>}
                  <button onClick={handleCreateBusiness} style={styles.createButton}>
                    Create Business Account
                  </button>
                </div>
              ) : (
                <div>
                  <div style={styles.adFormSection}>
                    <h4>Post a New Ad (₦1,200)</h4>
                    <form onSubmit={handlePostAd}>
                      <input
                        placeholder="Ad Title (e.g. Clinic Discount)"
                        style={styles.input}
                        value={adForm.title}
                        onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Catchy Headline (Capture)"
                        style={styles.input}
                        value={adForm.headline}
                        onChange={(e) => setAdForm({ ...adForm, headline: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Price / Offer (e.g. 50% Off)"
                        style={styles.input}
                        value={adForm.price}
                        onChange={(e) => setAdForm({ ...adForm, price: e.target.value })}
                        required
                      />
                      <textarea
                        placeholder="Description"
                        style={styles.textarea}
                        value={adForm.content}
                        onChange={(e) => setAdForm({ ...adForm, content: e.target.value })}
                        required
                      />
                      <div style={styles.imageUpload}>
                          <label style={styles.label}>Ad Image</label>
                          <input type="file" accept="image/*" onChange={handleAdImageUpload} />
                          {adForm.image && <img src={adForm.image} alt="Preview" style={styles.imagePreview} />}
                      </div>

                      <button
                        type="submit"
                        style={{
                          ...styles.submitButton,
                          opacity: processingAd ? 0.7 : 1
                        }}
                        disabled={processingAd}
                      >
                        {processingAd ? 'Processing...' : 'Pay & Post Ad'}
                      </button>
                    </form>
                  </div>

                  <h4>Your Active Ads</h4>
                  {business.ads.length === 0 ? (
                    <p style={styles.noAds}>No ads posted yet.</p>
                  ) : (
                    <ul style={styles.adsList}>
                      {business.ads.map(ad => (
                        <li key={ad.id} style={styles.adItem}>
                          <img src={ad.image || 'https://via.placeholder.com/80'} alt="Ad" style={styles.adImage} />
                          <div>
                              <strong>{ad.title}</strong>
                              <div style={styles.adHeadline}>{ad.headline}</div>
                              <div style={styles.adPrice}>{ad.price}</div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showFeedback && <FeedbackHandler onClose={() => setShowFeedback(false)} onSubmit={submitFeedback} />}
    </div>
  );
};

const styles = {
  container: { 
    padding: '20px', 
    maxWidth: '600px', 
    margin: '0 auto', 
    fontFamily: 'sans-serif', 
    width: '100%', 
    boxSizing: 'border-box' 
  },
  title: { 
    marginBottom: '20px' 
  },
  tabs: { 
    display: 'flex', 
    marginBottom: '20px' 
  },
  tab: {
    flex: 1,
    textAlign: 'center',
    padding: '15px 10px',
    cursor: 'pointer',
    borderBottom: '1px solid #eee',
    fontWeight: 'normal',
    color: '#888',
    backgroundColor: '#f9f9f9'
  },
  activeTab: {
    borderBottom: '3px solid #FF6347',
    fontWeight: 'bold',
    color: '#333',
    backgroundColor: '#fff'
  },
  tabContent: {
    padding: '0 5px'
  },
  avatarSection: {
    marginBottom: '20px',
    textAlign: 'center'
  },
  avatarPreview: {
    width: '100px',
    height: '100px',
    borderRadius: '50%',
    background: '#eee',
    margin: '0 auto 10px',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarPlaceholder: {
    fontSize: '30px'
  },
  fileInput: {
    maxWidth: '100%'
  },
  readOnlySection: {
    marginBottom: '20px',
    padding: '15px',
    background: '#f5f5f5',
    borderRadius: '5px'
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box'
  },
  disabledInput: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    background: '#e0e0e0'
  },
  textarea: {
    width: '100%',
    padding: '10px',
    marginBottom: '10px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    minHeight: '80px',
    resize: 'vertical'
  },
  divider: {
    margin: '20px 0',
    border: 'none',
    borderTop: '1px solid #eee'
  },
  preferenceCard: {
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '10px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  preferenceText: {
    flex: 1
  },
  preferenceTitle: {
    fontSize: '1rem',
    display: 'block'
  },
  preferenceDescription: {
    fontSize: '0.8rem',
    color: '#666'
  },
  toggleSwitch: {
    position: 'relative',
    display: 'inline-block',
    width: '50px',
    height: '28px'
  },
  toggleSlider: {
    position: 'absolute',
    inset: 0,
    transition: '.4s',
    borderRadius: '34px'
  },
  toggleKnob: {
    position: 'absolute',
    height: '20px',
    width: '20px',
    bottom: '4px',
    backgroundColor: 'white',
    transition: '.4s',
    borderRadius: '50%'
  },
  section: {
    marginTop: '30px'
  },
  verificationCard: {
    padding: '15px',
    border: '1px solid #eee',
    borderRadius: '10px',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  },
  verifyButton: {
    border: 'none',
    background: 'none',
    color: '#FF6347'
  },
  helpButtons: {
    display: 'flex',
    gap: '10px',
    flexDirection: 'column'
  },
  helpButton: {
    padding: '10px',
    background: '#f0f0f0',
    border: '1px solid #ccc',
    borderRadius: '5px',
    cursor: 'pointer',
    textAlign: 'start'
  },
  premiumRequired: {
    textAlign: 'center',
    padding: '40px',
    background: '#fff3e0',
    borderRadius: '10px'
  },
  upgradeButton: {
    padding: '12px 20px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '200px'
  },
  createBusiness: {
    textAlign: 'center',
    padding: '40px'
  },
  verificationWarning: {
    color: 'red',
    fontSize: '0.9rem'
  },
  createButton: {
    padding: '12px 20px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '200px'
  },
  adFormSection: {
    marginBottom: '30px',
    padding: '20px',
    border: '1px solid #eee',
    borderRadius: '10px'
  },
  imageUpload: {
    marginBottom: '15px'
  },
  imagePreview: {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    marginTop: '10px',
    borderRadius: '5px'
  },
  submitButton: {
    padding: '12px 20px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '200px'
  },
  noAds: {
    color: '#888'
  },
  adsList: {
    listStyle: 'none',
    padding: 0
  },
  adItem: {
    padding: '15px',
    borderBottom: '1px solid #eee',
    display: 'flex',
    gap: '15px'
  },
  adImage: {
    width: '80px',
    height: '80px',
    objectFit: 'cover',
    borderRadius: '5px'
  },
  adHeadline: {
    fontSize: '0.9rem',
    color: '#666'
  },
  adPrice: {
    color: '#FF6347',
    fontWeight: 'bold'
  }
};

export default Settings;