"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export default function SettingsPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('admin@shali.com');
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [isSavingHero, setIsSavingHero] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'admin_email' && value) {
            setEmail(decodeURIComponent(value));
          }
        }
      }

      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) {
          return;
        }
        const data = await res.json();
        if (data?.heroImage) {
          setHeroImageUrl(data.heroImage);
        }
      } catch {
        // Keep page usable even if this fetch fails.
      }
    };

    loadSettings();
  }, []);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword })
      });
      const data = await res.json();
      
      if (res.ok) {
        toast.success('Password changed successfully');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        toast.error(data.message || 'Failed to update password');
      }
    } catch {
      toast.error('An error occurred while communicating with the server');
    }
  };

  const handleHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSavingHero(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'hero');

      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData?.url) {
        toast.error(uploadData?.error || 'Failed to upload image');
        return;
      }

      const saveRes = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ heroImage: uploadData.url }),
      });
      const saveData = await saveRes.json();

      if (!saveRes.ok) {
        toast.error(saveData?.message || 'Failed to save hero image');
        return;
      }

      setHeroImageUrl(saveData.heroImage || uploadData.url);
      toast.success('Hero image updated successfully');
    } catch {
      toast.error('An error occurred while updating hero image');
    } finally {
      setIsSavingHero(false);
      e.target.value = '';
    }
  };

  return (
    <div className="admin-page-container" style={{ padding: '20px' }}>
      <div style={{ maxWidth: '700px', backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', padding: '30px' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '5px' }}>Homepage Hero Image</h2>
        <p style={{ color: '#666', marginBottom: '8px', fontSize: '0.9rem' }}>
          Upload a new hero banner image for the homepage.
        </p>
        <p style={{ color: '#334155', marginBottom: '16px', fontSize: '0.85rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 12px' }}>
          Recommended dimensions: <strong>1920 x 1080 px</strong> (minimum 1600 x 900), landscape, JPG/PNG.
        </p>

        {heroImageUrl && (
          <div style={{ marginBottom: '16px' }}>
            <p style={{ marginBottom: '8px', fontSize: '0.85rem', color: '#475569', fontWeight: 500 }}>Current hero image preview:</p>
            <img
              src={heroImageUrl}
              alt="Current hero"
              style={{ width: '100%', maxHeight: '280px', objectFit: 'cover', borderRadius: '10px', border: '1px solid #e2e8f0' }}
            />
          </div>
        )}

        <label style={{ display: 'inline-block', marginBottom: '30px', padding: '12px 16px', backgroundColor: isSavingHero ? '#94a3b8' : '#0c1222', color: 'white', borderRadius: '8px', cursor: isSavingHero ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
          {isSavingHero ? 'Uploading...' : 'Upload New Hero Image'}
          <input
            type="file"
            accept="image/*"
            onChange={handleHeroImageUpload}
            disabled={isSavingHero}
            style={{ display: 'none' }}
          />
        </label>

        <hr style={{ border: 0, borderTop: '1px solid #e2e8f0', marginBottom: '24px' }} />

        <h2 style={{ fontSize: '1.6rem', marginBottom: '5px' }}>Account Settings</h2>
        <p style={{ color: '#666', marginBottom: '25px', fontSize: '0.9rem' }}>Change your administrative password below.</p>
        
        <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Email Account</label>
            <input type="email" value={email} disabled style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#f8fafc', color: '#64748b', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500, fontSize: '0.9rem' }}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }} />
          </div>
          <button type="submit" style={{ marginTop: '10px', padding: '14px', backgroundColor: '#0c1222', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', transition: 'background-color 0.2s' }}>
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}
