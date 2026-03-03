import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AdBanner = ({ onAdComplete }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRandomAd = async () => {
      try {
        const { data, error } = await supabase.from('ads').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          const randomAd = data[Math.floor(Math.random() * data.length)];
          setAd({
            title: randomAd.title,
            headline: randomAd.headline,
            description: randomAd.content,
            price: randomAd.price,
            image: randomAd.image_url
          });
        } else {
            // Fallback
            setAd({
                title: "Peach Premium",
                headline: "Go Ad-Free Today!",
                description: "Get unlimited ripens and see who likes you.",
                price: "₦2,500/mo",
                image: "https://via.placeholder.com/300x200?text=Peach+Premium"
            });
        }
      } catch (err) {
        console.error('Error fetching ad:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRandomAd();
  }, []);

  if (loading || !ad) return null;

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
