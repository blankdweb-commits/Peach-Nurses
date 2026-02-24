import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const KYCVerification = ({ onBack }) => {
  const { kycStatus, updateKYC } = useUser();
  const [formData, setFormData] = useState({
    fullName: '',
    idNumber: '',
    idImage: null
  });
  const [processing, setProcessing] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFormData({ ...formData, idImage: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setProcessing(true);
    // Simulate API call
    setTimeout(() => {
      updateKYC('verified'); // Auto-verify for prototype
      setProcessing(false);
      alert("Verification Successful! You can now create a business account.");
      onBack();
    }, 2000);
  };

  if (kycStatus === 'verified') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2 style={{ color: 'green' }}>Verified ✅</h2>
        <p>Your identity has been confirmed.</p>
        <button onClick={onBack} style={{ padding: '10px 20px', borderRadius: '20px', border: '1px solid #ccc' }}>Back</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto' }}>
      <header style={{ marginBottom: '20px', display: 'flex', alignItems: 'center' }}>
        <button onClick={onBack} style={{ marginRight: '10px', background: 'none', border: 'none', fontSize: '1.2rem' }}>←</button>
        <h2>Verify Identity 🛡️</h2>
      </header>

      <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '20px' }}>
        To ensure safety and enable business features, we need to verify your identity.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Legal Name</label>
          <input
            required
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>NIN / Driver's License</label>
          <input
            required
            type="text"
            value={formData.idNumber}
            onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
            style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Upload ID Photo</label>
          <div style={{ border: '2px dashed #ccc', padding: '20px', textAlign: 'center', borderRadius: '10px' }}>
            {formData.idImage ? (
              <img src={formData.idImage} alt="ID Preview" style={{ maxWidth: '100%', maxHeight: '200px' }} />
            ) : (
              <span style={{ color: '#999' }}>Tap to upload</span>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ opacity: 0, position: 'absolute', left: 0, right: 0, cursor: 'pointer' }}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={processing || !formData.idImage}
          style={{
            marginTop: '20px', padding: '15px', background: '#FF6347', color: 'white', border: 'none', borderRadius: '30px', fontWeight: 'bold', fontSize: '1rem',
            opacity: (processing || !formData.idImage) ? 0.6 : 1
          }}
        >
          {processing ? 'Verifying...' : 'Submit for Verification'}
        </button>
      </form>
    </div>
  );
};

export default KYCVerification;
