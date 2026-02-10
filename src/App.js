import React, { useState, useEffect } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { AdminProvider } from './context/AdminContext';
import Discover from './components/Discover';
import Membership from './components/Membership';
import AdminDashboard from './components/AdminDashboard';
import Settings from './components/Settings';
import ChatList from './components/ChatList';
import Chat from './components/Chat';
import Onboarding from './components/Onboarding';
import { Login, Signup } from './components/Auth';
import BottomNav from './components/BottomNav';
import './components/Navigation.css';
import { campaignService } from './services/campaignService';

function AppContent() {
  const { currentUser, onboardingComplete, userProfile } = useUser();
  const [currentView, setCurrentView] = useState('discover');
  const [authView, setAuthView] = useState('login');
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [campaign, setCampaign] = useState(null);

  // Check Campaigns on Mount/Auth
  useEffect(() => {
      if (currentUser && onboardingComplete) {
          const campaigns = campaignService.checkCampaigns(userProfile);
          if (campaigns.length > 0) {
              setCampaign(campaigns[0]);
          }
      }
  }, [currentUser, onboardingComplete, userProfile]);

  // Auth Flow
  if (!currentUser) {
      return (
        <div style={{ padding: '20px' }}>
            {authView === 'login'
                ? <Login onLoginSuccess={() => setCurrentView('discover')} onSwitchToSignup={() => setAuthView('signup')} />
                : <Signup onSignupSuccess={() => setCurrentView('discover')} onSwitchToLogin={() => setAuthView('login')} />
            }
        </div>
      );
  }

  // Onboarding Flow
  if (!onboardingComplete) {
    return <Onboarding onComplete={() => setCurrentView('discover')} />;
  }

  const navigateToMembership = () => setCurrentView('membership');
  const navigateToDiscover = () => setCurrentView('discover');
  const navigateToAdmin = () => setCurrentView('admin');
  const navigateToSettings = () => setCurrentView('settings');
  const navigateToChats = () => setCurrentView('chatList');

  const handleSelectChat = (matchId) => {
    setSelectedChatId(matchId);
    setCurrentView('chatConversation');
  };

  const handleBackToChatList = () => {
    setSelectedChatId(null);
    setCurrentView('chatList');
  };

  // Campaign Modal
  const renderCampaignModal = () => (
      <div style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 3000,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
          <div style={{ background: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', maxWidth: '300px' }}>
              <h2>{campaign.title}</h2>
              <p>{campaign.content}</p>
              <button
                  onClick={() => {
                      if (campaign.id === 'kyc_nudge') setCurrentView('settings'); // Navigate to settings for KYC
                      setCampaign(null);
                  }}
                  style={{ padding: '10px 20px', background: '#FF6347', color: 'white', border: 'none', borderRadius: '20px', marginTop: '10px', cursor: 'pointer' }}
              >
                  {campaign.action}
              </button>
              <br/>
              <button
                  onClick={() => setCampaign(null)}
                  style={{ marginTop: '10px', background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}
              >
                  Dismiss
              </button>
          </div>
      </div>
  );

  const showNav = ['discover', 'chatList', 'membership', 'settings'].includes(currentView);

  return (
    <div className="app-container">
      {campaign && renderCampaignModal()}
      <div className="app-content">
        {currentView === 'discover' && (
          <Discover
            onNavigateToStore={navigateToMembership}
            onNavigateToSettings={navigateToSettings}
            onNavigateToChats={navigateToChats}
          />
        )}

        {currentView === 'chatList' && (
          <ChatList onSelectChat={handleSelectChat} />
        )}

        {currentView === 'chatConversation' && selectedChatId && (
          <Chat matchId={selectedChatId} onBack={handleBackToChatList} />
        )}

        {currentView === 'membership' && (
          <Membership onBack={navigateToDiscover} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard onBack={navigateToDiscover} />
        )}

        {currentView === 'settings' && (
          <Settings
            onNavigateToMembership={navigateToMembership}
            onNavigateToAdmin={navigateToAdmin}
          />
        )}
      </div>

      {showNav && (
        <BottomNav currentView={currentView} onChangeView={setCurrentView} />
      )}
    </div>
  );
}

function App() {
  return (
    <UserProvider>
      <AdminProvider>
        <AppContent />
      </AdminProvider>
    </UserProvider>
  );
}

export default App;
