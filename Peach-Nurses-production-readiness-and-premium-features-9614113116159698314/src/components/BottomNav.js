import React from 'react';
import './Navigation.css';

const BottomNav = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'chatList', icon: '💬', label: 'Chats' },
    { id: 'introductions', icon: '✨', label: 'Intros' },
    { id: 'insights', icon: '📊', label: 'Insights' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  return (
    <div className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${currentView === item.id || (item.id === 'chatList' && currentView === 'chatConversation') ? 'active' : ''}`}
          onClick={() => onChangeView(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;
