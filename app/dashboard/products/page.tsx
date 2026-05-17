"use client";

import React, { useState, useEffect } from 'react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

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

  // AI Generation State
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

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

  const handleAiGenerate = async () => {
    if (!aiInputText.trim()) {
      toast.error('Please enter or upload some text first.');
      return;
    }
    
    setIsGenerating(true);
    try {
      const res = await fetch('/api/products/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: aiInputText,
          availableCategories: categories.map((c: any) => c.name)
        })
      });
      
      if (!res.ok) {
        throw new Error('Failed to generate product details');
      }
      
      const data = await res.json();
      
      // Auto-fill form
      setName(data.name || '');
      setPrice(data.price || '');
      setSku(data.sku || '');
      setFabric(data.fabric || '');
      setColor(data.color || '');
      setDescription(data.description || '');
      setBadge(data.badge || '');
      
      if (data.sizes && Array.isArray(data.sizes)) {
        setSizes(data.sizes);
      }
      
      // Match category
      if (data.categoryName && categories.length > 0) {
        const matchedCat = categories.find(c => 
          c.name.toLowerCase().includes(data.categoryName.toLowerCase()) || 
          data.categoryName.toLowerCase().includes(c.name.toLowerCase())
        );
        if (matchedCat) {
          setCategoryId(matchedCat.id.toString());
        }
      }
      
      toast.success('Product details generated successfully!');
      setShowAiModal(false);
      setAiInputText('');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error(error);
      toast.error('Error generating product details.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result;
        if (typeof text === 'string') {
          setAiInputText(prev => prev ? prev + '\\n\\n' + text : text);
        }
      };
      reader.readAsText(file);
    }
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
      toast.error('Please fill required fields and upload a showcase image.');
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
      toast.success(editingId ? 'Product updated successfully.' : 'Product created successfully.');
    } catch (error) {
      console.error('Failed to save product', error);
      toast.error('Could not save product. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/products/${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Product deleted successfully.');
        fetchData();
        setShowDeleteModal(false);
        setDeletingId(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete product.');
      }
    } catch (error) {
      console.error('Failed to delete product', error);
      toast.error('Network error while deleting product.');
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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ margin: 0 }}>{editingId ? 'Edit Product' : 'Add New Product'}</h3>
            <button 
              type="button" 
              onClick={() => setShowAiModal(true)}
              style={{
                background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <i className="fas fa-magic"></i> AI Generate
            </button>
          </div>
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
                          <button type="button" className="btn-icon edit" onClick={() => handleEdit(prod)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button type="button" className="btn-icon delete" onClick={() => handleDeleteTrigger(prod.id)}>
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

      {/* AI Generation Modal */}
      {showAiModal && (
        <div className="modal-backdrop" style={{ zIndex: 10000 }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            padding: '40px',
            borderRadius: '24px',
            maxWidth: '650px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0,0,0,0.05)',
            animation: 'modal-pop 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            textAlign: 'left',
            position: 'relative'
          }}>
            <button 
              onClick={() => setShowAiModal(false)}
              style={{ position: 'absolute', top: '24px', right: '24px', background: '#f1f5f9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b', transition: 'all 0.2s' }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              <i className="fas fa-times"></i>
            </button>

            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ margin: 0, fontSize: '1.75rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '700', letterSpacing: '-0.5px' }}>
                <i className="fas fa-magic" style={{ color: '#0f172a', fontSize: '1.4rem' }}></i> 
                <span>AI Generator</span>
              </h3>
              <p style={{ fontSize: '0.95rem', color: '#64748b', marginTop: '8px', lineHeight: '1.5' }}>
                Instantly extract and format product details from unstructured text. Paste your content or upload a text file below.
              </p>
            </div>
            
            <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <i className="fas fa-info-circle" style={{ color: '#64748b', marginTop: '4px' }}></i>
                <div>
                  <strong style={{ fontSize: '0.85rem', color: '#334155', textTransform: 'uppercase', letterSpacing: '1px' }}>Example Format</strong>
                  <p style={{ fontSize: '0.9rem', color: '#475569', margin: '8px 0 0', fontStyle: 'italic', lineHeight: '1.6' }}>
                    "We are launching a new Midnight Black Lawn suit for Rs. 22,900. It's a 3 piece embroidered suit. SKU is SK-123. It comes in XS, S, M. Category is Luxury."
                  </p>
                </div>
              </div>
            </div>
            
            <div style={{ display: 'grid', gap: '24px' }}>
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                  <span><i className="fas fa-file-alt" style={{ marginRight: '8px', color: '#64748b' }}></i> Upload Text File</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#94a3b8', background: '#f1f5f9', padding: '2px 8px', borderRadius: '12px' }}>Optional</span>
                </label>
                <div style={{ position: 'relative', overflow: 'hidden', display: 'inline-block', width: '100%' }}>
                  <button type="button" style={{ width: '100%', padding: '16px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', color: '#64748b', fontSize: '0.95rem', fontWeight: '500', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#334155'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#64748b'; }}>
                    <i className="fas fa-file-upload"></i> Select a .txt file
                  </button>
                  <input 
                    type="file" 
                    accept=".txt" 
                    onChange={handleFileUpload}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                  />
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '5px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>OR PASTE TEXT</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#1e293b', marginBottom: '12px' }}>
                  <i className="fas fa-align-left" style={{ marginRight: '8px', color: '#64748b' }}></i> Product Description
                </label>
                <textarea 
                  value={aiInputText}
                  onChange={(e) => setAiInputText(e.target.value)}
                  placeholder="Paste your product details here..."
                  rows={6}
                  style={{ 
                    width: '100%', 
                    padding: '16px', 
                    borderRadius: '16px', 
                    border: '2px solid #e2e8f0', 
                    background: '#ffffff',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    fontSize: '0.95rem',
                    color: '#334155',
                    lineHeight: '1.6',
                    transition: 'all 0.2s',
                    outline: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#94a3b8';
                    e.target.style.boxShadow = '0 0 0 4px rgba(148, 163, 184, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)';
                  }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', margin: '10px 0 5px' }}>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>IMAGES (OPTIONAL)</span>
                  <div style={{ flex: 1, height: '1px', background: '#e2e8f0' }}></div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    <span><i className="fas fa-image" style={{ marginRight: '6px', color: '#64748b' }}></i> Showcase Image</span>
                  </label>
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f1f5f9'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}>
                    <i className="fas fa-cloud-upload-alt" style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '6px' }}></i>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{mainImageFile ? 'Change Image' : 'Select Image'}</span>
                    <input type="file" accept="image/*" onChange={handleMainImageChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  </div>
                  {mainPreviewUrl && (
                    <div style={{ marginTop: '10px', borderRadius: '8px', overflow: 'hidden', height: '60px', width: '60px', border: '1px solid #e2e8f0' }}>
                      <img src={mainPreviewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                </div>
                
                <div>
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', fontWeight: '600', color: '#1e293b', marginBottom: '8px' }}>
                    <span><i className="fas fa-images" style={{ marginRight: '6px', color: '#64748b' }}></i> Gallery Images</span>
                  </label>
                  <div style={{ position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100px', background: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', transition: 'all 0.2s', cursor: 'pointer' }} onMouseOver={(e) => { e.currentTarget.style.borderColor = '#94a3b8'; e.currentTarget.style.background = '#f1f5f9'; }} onMouseOut={(e) => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.background = '#f8fafc'; }}>
                    <i className="fas fa-images" style={{ fontSize: '1.2rem', color: '#94a3b8', marginBottom: '6px' }}></i>
                    <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>{galleryFiles.length > 0 ? 'Add More' : 'Select Images'}</span>
                    <input type="file" accept="image/*" multiple onChange={handleGalleryChange} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
                  </div>
                  {galleryPreviews.length > 0 && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                      {galleryPreviews.slice(0, 3).map((url, idx) => (
                        <div key={idx} style={{ flexShrink: 0, borderRadius: '8px', overflow: 'hidden', height: '40px', width: '40px', border: '1px solid #e2e8f0' }}>
                          <img src={url} alt="Gallery Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      ))}
                      {galleryPreviews.length > 3 && (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px', width: '40px', background: '#f1f5f9', borderRadius: '8px', fontSize: '0.75rem', color: '#64748b', fontWeight: 'bold' }}>
                          +{galleryPreviews.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginTop: '40px' }}>
              <button 
                onClick={() => setShowAiModal(false)}
                disabled={isGenerating}
                style={{
                  background: 'transparent',
                  color: '#64748b',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { if (!isGenerating) e.currentTarget.style.color = '#0f172a'; }}
                onMouseOut={(e) => { if (!isGenerating) e.currentTarget.style.color = '#64748b'; }}
              >
                Cancel
              </button>
              <button 
                onClick={handleAiGenerate}
                disabled={isGenerating || !aiInputText.trim()}
                style={{
                  background: isGenerating || !aiInputText.trim() ? '#cbd5e1' : '#0f172a',
                  color: 'white',
                  border: 'none',
                  padding: '12px 28px',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: isGenerating || !aiInputText.trim() ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: isGenerating || !aiInputText.trim() ? 'none' : '0 10px 15px -3px rgba(15, 23, 42, 0.2), 0 4px 6px -2px rgba(15, 23, 42, 0.1)',
                  transition: 'all 0.2s',
                  transform: isGenerating || !aiInputText.trim() ? 'none' : 'translateY(0)'
                }}
                onMouseOver={(e) => {
                  if(!isGenerating && aiInputText.trim()) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 20px 25px -5px rgba(15, 23, 42, 0.3), 0 10px 10px -5px rgba(15, 23, 42, 0.15)';
                  }
                }}
                onMouseOut={(e) => {
                  if(!isGenerating && aiInputText.trim()) {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(15, 23, 42, 0.2), 0 4px 6px -2px rgba(15, 23, 42, 0.1)';
                  }
                }}
              >
                {isGenerating ? (
                  <><i className="fas fa-spinner fa-spin"></i> Extracting...</>
                ) : (
                  <><i className="fas fa-check-circle"></i> Auto-Fill Details</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
