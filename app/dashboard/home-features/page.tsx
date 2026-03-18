"use client";

import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

type Category = { id: number; name: string };
type HomeFeature = {
  id: number;
  title: string;
  image: string;
  order: number;
  categoryId: number | null;
  category: Category | null;
};

export default function HomeFeaturesAdmin() {
  const [features, setFeatures] = useState<HomeFeature[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [order, setOrder] = useState('0');
  const [categoryId, setCategoryId] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchFeatures();
    fetchCategories();
  }, []);

  const fetchFeatures = async () => {
    const res = await fetch('/api/home-features');
    const data = await res.json();
    setFeatures(data);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(data);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'home-features');

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (res.ok) {
        setImageUrl(data.url);
        toast.success('Image uploaded.');
      } else {
        toast.error(data.error || 'Upload failed');
      }
    } catch (err) {
      toast.error('Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error('Please upload an image first.');
      return;
    }

    setSaving(true);
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/home-features/${editingId}` : '/api/home-features';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          image: imageUrl,
          order,
          categoryId: categoryId || null,
        }),
      });

      if (res.ok) {
        setShowModal(false);
        resetForm();
        fetchFeatures();
        toast.success(editingId ? 'Feature updated.' : 'Feature created.');
      } else {
        const err = await res.json();
        toast.error(err.error || 'Something went wrong');
      }
    } catch {
      toast.error('Unable to save feature right now.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setImageUrl('');
    setOrder('0');
    setCategoryId('');
    setEditingId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openAdd = () => {
    resetForm();
    setShowModal(true);
  };

  const handleEdit = (feature: HomeFeature) => {
    setEditingId(feature.id);
    setTitle(feature.title);
    setImageUrl(feature.image);
    setOrder(feature.order.toString());
    setCategoryId(feature.categoryId?.toString() || '');
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Are you sure you want to delete this feature?')) {
      const res = await fetch(`/api/home-features/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Feature deleted.');
        fetchFeatures();
      } else {
        toast.error('Failed to delete feature.');
      }
    }
  };

  if (loading) return <div style={{ padding: '60px', textAlign: 'center', color: '#999' }}>Loading Features...</div>;

  return (
    <div>
      <div className="admin-page-header">
        <h2>Home Features</h2>
        {features.length < 3 && (
          <button onClick={openAdd} className="btn-primary">
            <i className="fas fa-plus" style={{ marginRight: '8px' }}></i>Add Feature
          </button>
        )}
      </div>

      <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '30px', marginTop: '-20px' }}>
        Manage the three featured blocks on the homepage. Each links to a category via SHOP NOW.
      </p>

      {features.length === 0 ? (
        <div style={{
          textAlign: 'center', padding: '80px 20px', background: '#f8fafc',
          border: '2px dashed #e2e8f0', borderRadius: '16px'
        }}>
          <i className="fas fa-images" style={{ fontSize: '3rem', color: '#cbd5e1', marginBottom: '16px', display: 'block' }}></i>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>No features yet. Add up to 3 showcase blocks for the homepage.</p>
        </div>
      ) : (
        <div className="hf-grid">
          {features.map((feature) => (
            <div key={feature.id} className="hf-card">
              <div className="hf-card-img">
                <img src={feature.image} alt={feature.title} />
                <div className="hf-card-overlay">
                  <button onClick={() => handleEdit(feature)} className="hf-action-btn edit">
                    <i className="fas fa-pen"></i>
                  </button>
                  <button onClick={() => handleDelete(feature.id)} className="hf-action-btn delete">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
              <div className="hf-card-info">
                <h3>{feature.title}</h3>
                <div className="hf-card-meta">
                  <span className="hf-order-badge">Order: {feature.order}</span>
                  {feature.category ? (
                    <span className="hf-category-badge">
                      <i className="fas fa-tag" style={{ marginRight: '4px', fontSize: '0.6rem' }}></i>
                      {feature.category.name}
                    </span>
                  ) : (
                    <span className="hf-category-badge unlinked">No category linked</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'left' }}>
            <h4 style={{ marginBottom: '6px' }}>
              {editingId ? 'Edit Feature' : 'Add New Feature'}
            </h4>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '25px' }}>
              {editingId ? 'Update feature details and image.' : 'Create a new showcase block for the homepage.'}
            </p>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title (e.g., READY TO WEAR)</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="READY TO WEAR"
                />
              </div>

              <div className="form-group">
                <label>Feature Image</label>
                <div className="dropzone-container" onClick={() => fileInputRef.current?.click()} style={{ cursor: 'pointer' }}>
                  {uploading ? (
                    <>
                      <div className="shali-spinner"></div>
                      <p>Uploading...</p>
                    </>
                  ) : imageUrl ? (
                    <>
                      <img src={imageUrl} alt="Preview" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'cover', width: '100%' }} />
                      <p style={{ marginTop: '8px', fontSize: '0.78rem', color: '#64748b' }}>Click to replace image</p>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-cloud-upload-alt"></i>
                      <p>Click to upload image</p>
                      <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PNG, JPG, WebP up to 5MB</p>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label>Display Order</label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Linked Category</label>
                  <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                    <option value="">— None —</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn-cancel">Cancel</button>
                <button type="submit" className="btn-primary" disabled={uploading || saving}>
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Create Feature'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
