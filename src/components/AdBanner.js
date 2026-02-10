import React, { useEffect } from 'react';
import { useUser } from '../context/UserContext';

const AdBanner = ({ onAdComplete }) => {
  // Use last posted ad from business logic or random mock ad
  const { business } = useUser();

  // Logic to pick an ad:
  // In a real app, this would fetch from an ad server.
  // Here, we can look at the mocked business ads or fallback.
  // Since we are viewing as a user, we should see OTHER people's ads.
  // For demo, let's use a mock ad with the new structure.

  const ad = {
      title: "Sapele Scrub Shop",
      headline: "50% Off All Scrubs!",
      description: "Best quality scrubs for nurses. Located at Market Road.",
      price: "₦5,000",
      image: "https://via.placeholder.com/300x200?text=Scrubs+Sale"
  };

  useEffect(() => {
    // Simulate ad duration
    // Allow user to close manually for better UX
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0,0,0,0.85)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      color: 'white',
      padding: '20px',
      boxSizing: 'border-box'
    }}>
      <div style={{
          background: 'white',
          borderRadius: '20px',
          maxWidth: '350px',
          width: '100%',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          color: '#333',
          animation: 'popIn 0.3s ease-out'
      }}>
        <div style={{ position: 'relative', height: '200px' }}>
            <img src={ad.image} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(0,0,0,0.6)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', textTransform: 'uppercase' }}>Sponsored</div>
        </div>

        <div style={{ padding: '20px', textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.2rem' }}>{ad.headline}</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', margin: '0 0 15px 0' }}>{ad.title}</p>
            <p style={{ fontSize: '1rem', lineHeight: '1.4' }}>{ad.description}</p>
            <div style={{ margin: '15px 0', fontSize: '1.5rem', color: '#FF6347', fontWeight: 'bold' }}>{ad.price}</div>

            <button
                onClick={() => alert("Redirecting to offer...")}
                style={{ width: '100%', padding: '15px', background: '#FF6347', color: 'white', border: 'none', borderRadius: '30px', fontSize: '1rem', fontWeight: 'bold', cursor: 'pointer', marginBottom: '10px' }}
            >
                View Offer
            </button>
            <button
                onClick={onAdComplete}
                style={{ background: 'none', border: 'none', color: '#999', fontSize: '0.9rem', cursor: 'pointer', textDecoration: 'underline' }}
            >
                Dismiss
            </button>
        </div>
      </div>
    </div>
  );
};

export default AdBanner;
