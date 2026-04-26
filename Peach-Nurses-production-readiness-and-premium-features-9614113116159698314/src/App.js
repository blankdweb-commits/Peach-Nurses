import React, { useState } from 'react';
import { UserProvider, useUser } from './context/UserContext';
import { AdminProvider } from './context/AdminContext';
import Home from './components/Home';
import Introductions from './components/Introductions';
import Insights from './components/Insights';
import Membership from './components/Membership';
import AdminDashboard from './components/AdminDashboard';
import Settings from './components/Settings';
import ChatList from './components/ChatList';
import Chat from './components/Chat';
import Onboarding from './components/Onboarding';
import { Login, Signup } from './components/Auth';
import BottomNav from './components/BottomNav';
import './components/Navigation.css';

function AppContent() {
  const { currentUser, onboardingComplete } = useUser();
  const [currentView, setCurrentView] = useState('home');
  const [authView, setAuthView] = useState('login');
  const [selectedChatId, setSelectedChatId] = useState(null);

  // Auth Flow
  if (!currentUser) {
      return (
        <div style={{ padding: '20px' }}>
            {authView === 'login'
                ? <Login onLoginSuccess={() => setCurrentView('home')} onSwitchToSignup={() => setAuthView('signup')} />
                : <Signup onSignupSuccess={() => setCurrentView('home')} onSwitchToLogin={() => setAuthView('login')} />
            }
        </div>
      );
  }

  // Onboarding Flow
  if (!onboardingComplete) {
    return <Onboarding />;
  }

  const navigateToHome = () => setCurrentView('home');
  const navigateToIntros = () => setCurrentView('introductions');
  const navigateToInsights = () => setCurrentView('insights');
  const navigateToChatList = () => setCurrentView('chatList');
  const navigateToSettings = () => setCurrentView('settings');
  const navigateToMembership = () => setCurrentView('membership');
  const navigateToAdmin = () => setCurrentView('admin');

  const handleSelectChat = (matchId) => {
    setSelectedChatId(matchId);
    setCurrentView('chatConversation');
  };

  const handleBackToChatList = () => {
    setSelectedChatId(null);
    setCurrentView('chatList');
  };

  const showNav = ['home', 'chatList', 'introductions', 'insights', 'membership', 'settings'].includes(currentView);

  return (
    <div className="app-container">
      <div className="app-content">
        {currentView === 'home' && (
          <Home
            onNavigateToChat={navigateToChatList}
            onNavigateToIntroductions={navigateToIntros}
            onNavigateToInsights={navigateToInsights}
          />
        )}

        {currentView === 'introductions' && (
          <Introductions onBack={navigateToHome} />
        )}

        {currentView === 'insights' && (
          <Insights onBack={navigateToHome} />
        )}

        {currentView === 'chatList' && (
          <ChatList onSelectChat={handleSelectChat} />
        )}

        {currentView === 'chatConversation' && selectedChatId && (
          <Chat matchId={selectedChatId} onBack={handleBackToChatList} />
        )}

        {currentView === 'membership' && (
          <Membership onBack={navigateToHome} />
        )}

        {currentView === 'admin' && (
          <AdminDashboard onBack={navigateToHome} />
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
