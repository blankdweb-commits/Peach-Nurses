// components/AdBanner.js
import React, { useState, useEffect } from 'react';
import { adsService } from '../services/supabaseService';
import LoadingSpinner from './LoadingSpinner';

const AdBanner = ({ onAdComplete, position = 'interstitial' }) => {
  const [ad, setAd] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const loadAd = async () => {
      try {
        setLoading(true);
        const ads = await adsService.getActiveAds();
        
        if (ads && ads.length > 0) {
          // Randomly select an ad
          const randomAd = ads[Math.floor(Math.random() * ads.length)];
          setAd(randomAd);
        } else {
          // Fallback to mock ad if no ads in database
          setAd({
            id: 'mock-1',
            title: 'Sapele Scrub Shop',
            headline: '50% Off All Scrubs!',
            description: 'Best quality scrubs for nurses. Located at Market Road.',
            price: '₦5,000',
            image_url: 'https://via.placeholder.com/300x200?text=Scrubs+Sale',
            business: {
              name: 'Sapele Scrub Shop',
              alias: 'ScrubMaster',
              photo_url: null
            }
          });
        }
      } catch (err) {
        console.error('Error loading ad:', err);
        setError('Failed to load advertisement');
      } finally {
        setLoading(false);
      }
    };

    loadAd();
  }, []);

  const handleViewOffer = () => {
    if (ad && ad.id !== 'mock-1') {
      // Track ad view/clicks in production
      console.log('Ad clicked:', ad.id);
    }
    
    // Simulate redirect
    alert(`Redirecting to ${ad?.title || 'offer'}...`);
    
    // Call onAdComplete after a delay
    setTimeout(() => {
      onAdComplete();
    }, 1500);
  };

  const handleDismiss = () => {
    setDismissed(true);
    onAdComplete();
  };

  if (dismissed || loading) {
    return loading ? <LoadingSpinner message="Loading ad..." /> : null;
  }

  if (error || !ad) {
    return null; // Don't show anything if no ad
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Ad Image */}
        <div style={styles.imageContainer}>
          <img 
            src={ad.image_url || 'https://via.placeholder.com/300x200?text=Special+Offer'} 
            alt={ad.headline}
            style={styles.image}
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/300x200?text=Special+Offer';
            }}
          />
          <div style={styles.sponsoredBadge}>
            Sponsored
          </div>
          {ad.business?.photo_url && (
            <div style={styles.businessAvatar}>
              <img 
                src={ad.business.photo_url} 
                alt={ad.business.name}
                style={styles.businessAvatarImage}
              />
            </div>
          )}
        </div>

        {/* Ad Content */}
        <div style={styles.content}>
          <h3 style={styles.headline}>{ad.headline}</h3>
          <p style={styles.title}>{ad.title}</p>
          <p style={styles.description}>{ad.description}</p>
          
          {ad.price && (
            <div style={styles.price}>{ad.price}</div>
          )}

          {/* Business Info */}
          {ad.business && (
            <div style={styles.businessInfo}>
              <span style={styles.businessName}>{ad.business.name}</span>
            </div>
          )}

          {/* Action Buttons */}
          <button 
            onClick={handleViewOffer}
            style={styles.primaryButton}
          >
            View Offer
          </button>
          
          <button 
            onClick={handleDismiss}
            style={styles.dismissButton}
          >
            Dismiss
          </button>
        </div>
      </div>

      <style jsx="true">{`
        @keyframes popIn {
          0% {
            opacity: 0;
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.85)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
    boxSizing: 'border-box'
  },
  modal: {
    background: 'white',
    borderRadius: '20px',
    maxWidth: '350px',
    width: '100%',
    overflow: 'hidden',
    boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
    animation: 'popIn 0.3s ease-out'
  },
  imageContainer: {
    position: 'relative',
    height: '200px'
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  sponsoredBadge: {
    position: 'absolute',
    top: '10px',
    left: '10px',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '0.7rem',
    textTransform: 'uppercase'
  },
  businessAvatar: {
    position: 'absolute',
    bottom: '-25px',
    right: '20px',
    width: '50px',
    height: '50px',
    borderRadius: '50%',
    border: '3px solid white',
    overflow: 'hidden',
    backgroundColor: '#FF6347'
  },
  businessAvatarImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  content: {
    padding: '30px 20px 20px',
    textAlign: 'center'
  },
  headline: {
    margin: '0 0 5px 0',
    fontSize: '1.2rem',
    color: '#333'
  },
  title: {
    color: '#666',
    fontSize: '0.9rem',
    margin: '0 0 15px 0'
  },
  description: {
    fontSize: '1rem',
    lineHeight: '1.4',
    color: '#333',
    margin: '0 0 15px 0'
  },
  price: {
    margin: '15px 0',
    fontSize: '1.5rem',
    color: '#FF6347',
    fontWeight: 'bold'
  },
  businessInfo: {
    margin: '15px 0',
    padding: '10px',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px'
  },
  businessName: {
    fontSize: '0.9rem',
    color: '#666'
  },
  primaryButton: {
    width: '100%',
    padding: '15px',
    background: '#FF6347',
    color: 'white',
    border: 'none',
    borderRadius: '30px',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    marginBottom: '10px',
    transition: 'background 0.2s'
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    color: '#999',
    fontSize: '0.9rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: '10px'
  }
};

export default AdBanner;