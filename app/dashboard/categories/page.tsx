"use client";

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

type Category = {
  id: number;
  name: string;
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  // Custom Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories');
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const method = editingId ? 'PUT' : 'POST';
      const url = editingId ? `/api/categories/${editingId}` : '/api/categories';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to save category');
      }

      toast.success(editingId ? 'Category updated.' : 'Category created.');
      setName('');
      setEditingId(null);
      fetchCategories();
    } catch (error) {
      console.error('Failed to save category', error);
      toast.error('Could not save category.');
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/categories/${deletingId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category and linked products deleted.');
        fetchCategories();
        setShowDeleteModal(false);
        setDeletingId(null);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Failed to delete category.');
      }
    } catch (error) {
      console.error('Failed to delete category', error);
      toast.error('Network error while deleting category.');
    }
  };

  const handleDeleteTrigger = (id: number) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const handleEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    toast.info(`Editing ${category.name}`);
  };

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h2>Manage Categories</h2>
      </div>

      <div className="admin-grid-layout">
        {/* FORM SECTION */}
        <div className="admin-form-card">
          <h3>{editingId ? 'Edit Category' : 'Add New Category'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Category Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                placeholder="e.g. LUXURY PRET"
              />
            </div>
            <div className="form-actions">
              {editingId && (
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => { setEditingId(null); setName(''); }}
                >
                  Cancel
                </button>
              )}
              <button type="submit" className="btn-primary">
                {editingId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </form>
        </div>

        {/* LIST SECTION */}
        <div className="admin-list-card">
          <h3>Existing Categories</h3>
          {loading ? (
            <p>Loading...</p>
          ) : categories.length === 0 ? (
            <p>No categories found.</p>
          ) : (
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th className="action-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((cat) => (
                    <tr key={cat.id}>
                      <td>#{cat.id}</td>
                      <td><strong>{cat.name}</strong></td>
                      <td className="action-col">
                        <div className="action-buttons-wrap">
                          <button type="button" className="btn-icon edit" onClick={() => handleEdit(cat)}>
                            <i className="fas fa-edit"></i>
                          </button>
                          <button type="button" className="btn-icon delete" onClick={() => handleDeleteTrigger(cat.id)}>
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
            <p>Are you sure you want to delete this category? This will also affect products associated with it.</p>
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
