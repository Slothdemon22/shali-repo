"use client";

import React, { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';

type Category = { id: number; name: string };
type Product = {
  id: number;
  name: string;
  price: string;
  badge: string | null;
  description: string | null;
  image: string;
  gallery: string[];
  sku: string | null;
  fabric: string | null;
  color: string | null;
  sizes: string[];
  categoryId: number;
  category: Category;
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Custom Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Form State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [badge, setBadge] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [fabric, setFabric] = useState('');
  const [color, setColor] = useState('');
  const [sizes, setSizes] = useState<string[]>(["XS", "S", "M", "L", "XL"]);
  const [categoryId, setCategoryId] = useState('');
  
  // Images State
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mainPreviewUrl, setMainPreviewUrl] = useState<string | null>(null);
  
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [existingGalleryUrls, setExistingGalleryUrls] = useState<string[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/categories')
      ]);
      setProducts(await prodRes.json());
      setCategories(await catRes.json());
    } catch (error) {
      console.error('Failed to fetch data');
    }
    setLoading(false);
  };

  const handleMainImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImageFile(file);
      setMainPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setGalleryFiles(prev => [...prev, ...files]);
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setGalleryPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeGalleryItem = (index: number, isExisting: boolean) => {
    if (isExisting) {
      setExistingGalleryUrls(prev => prev.filter((_, i) => i !== index));
    } else {
      setGalleryFiles(prev => prev.filter((_, i) => i !== index));
      setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
    }
  };

  const toggleSize = (size: string) => {
    setSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const uploadImage = async (file: File) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    const { error } = await supabase.storage
      .from('shali-bucket')
      .upload(filePath, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('shali-bucket')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price || !categoryId || (!mainPreviewUrl && !mainImageFile)) {
      alert('Missing required fields or Showcase Image');
      return;
    }

    setUploading(true);

    try {
      let mainImageUrl = mainPreviewUrl; // Default to existing if no new file
      if (mainImageFile) {
        mainImageUrl = await uploadImage(mainImageFile);
      }

      const uploadedGalleryUrls = await Promise.all(
        galleryFiles.map(file => uploadImage(file))
      );

      const finalGallery = [...existingGalleryUrls, ...uploadedGalleryUrls];

      const payload = { 
        name, 
        price, 
        badge: badge || null, 
        description: description || null,
        sku: sku || null,
        fabric: fabric || null,
        color: color || null,
        sizes,
        categoryId: parseInt(categoryId),
        image: mainImageUrl,
        gallery: finalGallery
      };

      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/products/${editingId}` : '/api/products';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Failed to save');

      resetForm();
      fetchData();
      alert('Product saved successfully!');
    } catch (error) {
      console.error('Failed to save product', error);
      alert('Error saving product.');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/products/${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Product deleted successfully');
        fetchData();
        setShowDeleteModal(false);
        setDeletingId(null);
      } else {
        const err = await res.json();
        alert(`Failed to delete: ${err.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to delete product', error);
      alert('Network error while deleting product');
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setName(product.name);
    setPrice(product.price);
    setBadge(product.badge || '');
    setDescription(product.description || '');
    setSku(product.sku || '');
    setFabric(product.fabric || '');
    setColor(product.color || '');
    setSizes(product.sizes || []);
    setCategoryId(product.categoryId.toString());
    setMainPreviewUrl(product.image);
    setExistingGalleryUrls(product.gallery || []);
    setGalleryFiles([]);
    setGalleryPreviews([]);
    
    // Jump to top of form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
    setBadge('');
    setDescription('');
    setSku('');
    setFabric('');
    setColor('');
    setSizes(["XS", "S", "M", "L", "XL"]);
    setCategoryId('');
    setMainImageFile(null);
    setMainPreviewUrl(null);
    setGalleryFiles([]);
    setExistingGalleryUrls([]);
    setGalleryPreviews([]);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h2>Manage Products</h2>
      </div>

      <div className="admin-grid-layout">
        {/* FORM SECTION */}
        <div className="admin-form-card">
          <h3>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g. 3 PIECE - EMBROIDERED SUIT"
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Price String</label>
                <input 
                  type="text" 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required 
                  placeholder="e.g. Rs. 22,900"
                />
              </div>
              <div className="form-group">
                <label>SKU</label>
                <input 
                  type="text" 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value)} 
                  placeholder="e.g. SK-123"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div className="form-group">
                <label>Fabric</label>
                <input 
                  type="text" 
                  value={fabric} 
                  onChange={(e) => setFabric(e.target.value)} 
                  placeholder="e.g. Lawn, Silk"
                />
              </div>
              <div className="form-group">
                <label>Color</label>
                <input 
                  type="text" 
                  value={color} 
                  onChange={(e) => setColor(e.target.value)} 
                  placeholder="e.g. Midnight Black"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                placeholder="Product description and details..."
                rows={4}
                style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', background: '#f8fafc' }}
              />
            </div>

            <div className="form-group">
              <label>Badge (Optional)</label>
              <input 
                type="text" 
                value={badge} 
                onChange={(e) => setBadge(e.target.value)} 
                placeholder="e.g. NEW IN"
              />
            </div>

            <div className="form-group">
              <label>Category</label>
              <select 
                value={categoryId} 
                onChange={(e) => setCategoryId(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Available Sizes</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' }}>
                {["XS", "S", "M", "L", "XL"].map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      background: sizes.includes(size) ? '#0f172a' : 'white',
                      color: sizes.includes(size) ? 'white' : '#64748b',
                      fontSize: '0.8rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Showcase Image (Required)</label>
              <div className="dropzone-container">
                <i className="fas fa-cloud-upload-alt"></i>
                <p>{mainImageFile ? mainImageFile.name : 'Click or Drag Showcase Image'}</p>
                <input type="file" accept="image/*" onChange={handleMainImageChange} />
              </div>
              {mainPreviewUrl && (
                <div className="image-preview">
                  <img src={mainPreviewUrl} alt="Main Preview" className="main-image-preview" />
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Gallery Images (Optional)</label>
              <div className="dropzone-container">
                <i className="fas fa-images"></i>
                <p>Add Gallery Images</p>
                <input type="file" accept="image/*" multiple onChange={handleGalleryChange} />
              </div>
              
              <div className="gallery-grid">
                {/* Existing Images */}
                {existingGalleryUrls.map((url, i) => (
                  <div key={`existing-${i}`} className="gallery-item">
                    <img src={url} alt={`Gallery ${i}`} />
                    <button type="button" className="remove-img-btn" onClick={() => removeGalleryItem(i, true)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
                
                {/* New Image Previews */}
                {galleryPreviews.map((url, i) => (
                  <div key={`new-${i}`} className="gallery-item">
                    <img src={url} alt={`Preview ${i}`} />
                    <button type="button" className="remove-img-btn" onClick={() => removeGalleryItem(i, false)}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              {editingId && (
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? 'Processing...' : (editingId ? 'Update Product' : 'Create Product')}
              </button>
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className="admin-list-card">
          <h3>Existing Products</h3>
          {loading ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <p>No products found.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Image</th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th className="action-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <img src={prod.image} alt={prod.name} style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '4px' }} />
                      </td>
                      <td>
                        <strong>{prod.name}</strong>
                        {prod.badge && <span className="small-badge">{prod.badge}</span>}
                        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '4px' }}>
                          {prod.sku && <span>SKU: {prod.sku}</span>}
                          {prod.gallery?.length > 0 && <span style={{ marginLeft: '8px' }}><i className="fas fa-images"></i> {prod.gallery.length} images</span>}
                        </div>
                      </td>
                      <td>{prod.category?.name}</td>
                      <td>{prod.price}</td>
                      <td className="action-col">
                        <div className="action-buttons-wrap">
                          <button className="btn-icon edit" onClick={() => handleEdit(prod)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button className="btn-icon delete" onClick={() => handleDeleteTrigger(prod.id)}>
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-icon-warning">
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <h4>Confirm Deletion</h4>
            <p>Are you sure you want to delete this product? This action cannot be undone and will remove it from the store.</p>
            <div className="modal-actions">
              <button 
                className="btn-modal-cancel" 
                onClick={() => { setShowDeleteModal(false); setDeletingId(null); }}
              >
                No, Keep it
              </button>
              <button 
                className="btn-modal-confirm" 
                onClick={confirmDelete}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
