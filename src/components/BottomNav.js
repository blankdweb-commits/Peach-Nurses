// components/BottomNav.js
import React from 'react';
import './Navigation.css';

const BottomNav = ({ currentView, onChangeView }) => {
  const navItems = [
    { id: 'discover', icon: '🍑', label: 'Discover' },
    { id: 'chatList', icon: '💬', label: 'Chats' },
    { id: 'membership', icon: '👑', label: 'Premium' },
    { id: 'settings', icon: '⚙️', label: 'Settings' }
  ];

  const handleNavigation = (itemId) => {
    // Special handling for membership/premium
    if (itemId === 'membership') {
      // You might want to navigate to membership page instead of directly to Paystack
      onChangeView('membership');
    } else {
      onChangeView(itemId);
    }
  };

  return (
    <div className="bottom-nav">
      {navItems.map(item => (
        <button
          key={item.id}
          className={`nav-item ${currentView === item.id || (item.id === 'chatList' && currentView === 'chatConversation') ? 'active' : ''}`}
          onClick={() => handleNavigation(item.id)}
          aria-label={item.label}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNav;