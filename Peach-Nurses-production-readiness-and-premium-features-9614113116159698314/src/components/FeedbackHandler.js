import React, { useState } from 'react';

const FeedbackHandler = ({ onClose, onSubmit }) => {
  const [type, setType] = useState('bug'); // bug, feature, feedback
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (content.trim()) {
      onSubmit({ type, content, timestamp: new Date().toISOString() });
      onClose();
      alert("Thanks for your feedback! We're listening. 👂");
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, width: '100%', height: '100%',
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{ background: 'white', padding: '20px', borderRadius: '10px', width: '90%', maxWidth: '400px', boxSizing: 'border-box' }}>
        <h3>Share Feedback 🍑</h3>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ width: '100%', padding: '8px' }}
            >
              <option value="bug">Report a Bug 🐛</option>
              <option value="feature">Request Feature ✨</option>
              <option value="feedback">General Feedback 📝</option>
            </select>
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Message</label>
            <textarea
              rows="4"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tell us what's on your mind..."
              style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
             <button type="button" onClick={onClose} style={{ padding: '10px 20px', background: '#ccc', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
             <button type="submit" style={{ padding: '10px 20px', background: '#FF6347', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Submit</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FeedbackHandler;
