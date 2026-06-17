'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Package, FolderTree, Save, Trash2, Plus, X, RotateCcw, Loader2, CheckCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminDashboard() {
  const { logout } = useAdmin();
  const [activeTab, setActiveTab] = useState('products');
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Single Product Form States
  const [formData, setFormData] = useState({
    productId: '',
    category: '',
    subCategory: '',
    title: '',
    material: '',
    color: '',
    size: '',
    description: '',
    price: '',
    costPrice: '',
    imageUrl: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewURL, setPreviewURL] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formMessage, setFormMessage] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Category Manager States
  const [editingCategory, setEditingCategory] = useState(null);
  const [catForm, setCatForm] = useState({ id: '', label: '', icon: 'grid', order: 0, subCategories: [] });
  const [catMessage, setCatMessage] = useState('');
  const [catLoading, setCatLoading] = useState(false);

  // Load categories
  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const res = await fetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    
    // Check if there's a product to edit from Details Sheet redirect
    const savedProduct = localStorage.getItem('editing_product');
    if (savedProduct) {
      try {
        const product = JSON.parse(savedProduct);
        setFormData({
          productId: product.id,
          category: product.category_id || '',
          subCategory: product.subcategory_id || '',
          title: product.title || '',
          material: product.material || '',
          color: product.color || '',
          size: product.size || '',
          description: product.description || '',
          price: product.price || '',
          costPrice: product.cost_price || '',
          imageUrl: product.image_url || '',
        });
        setPreviewURL(product.image_url || '');
        localStorage.removeItem('editing_product');
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  // Derived category configurations
  const selectedCategory = useMemo(() => 
    categories.find(c => c.id === formData.category),
    [categories, formData.category]
  );

  const subcategories = selectedCategory?.subCategories || [];

  // Image Selection & Compression
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewURL(URL.createObjectURL(file));
  };

  // Product Form Reset
  const resetProductForm = () => {
    setFormData({
      productId: '',
      category: '',
      subCategory: '',
      title: '',
      material: '',
      color: '',
      size: '',
      description: '',
      price: '',
      costPrice: '',
      imageUrl: '',
    });
    setSelectedFile(null);
    if (previewURL && previewURL.startsWith('blob:')) {
      URL.revokeObjectURL(previewURL);
    }
    setPreviewURL('');
  };

  // Product Form Submission
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedFile && !formData.imageUrl) {
      setFormMessage('Error: Please select a product image.');
      return;
    }

    setFormLoading(true);
    setFormMessage('Compressing image...');
    
    try {
      let finalImageUrl = formData.imageUrl;

      // 1. Upload new image if selected
      if (selectedFile) {
        // Compress image client side
        let compressedFile = selectedFile;
        try {
          const options = {
            maxSizeMB: 0.3, // under 300KB
            maxWidthOrHeight: 1200,
            useWebWorker: true,
          };
          compressedFile = await imageCompression(selectedFile, options);
        } catch (err) {
          console.warn('Compression failed, uploading original:', err);
        }

        setFormMessage('Uploading image...');
        const uploadData = new FormData();
        uploadData.append('file', compressedFile);
        uploadData.append('categoryId', formData.category);
        uploadData.append('title', formData.title || 'Product Image');

        const uploadRes = await fetch('/api/admin/upload', {
          method: 'POST',
          body: uploadData,
        });

        if (!uploadRes.ok) {
          throw new Error('Image upload failed.');
        }

        const resData = await uploadRes.json();
        finalImageUrl = resData.product.image_url;
      }

      // 2. Save metadata (insert or update)
      setFormMessage('Saving product data...');
      const saveRes = await fetch('/api/admin/product/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: formData.productId || null,
          categoryId: formData.category,
          subcategoryId: formData.subCategory,
          imageUrl: finalImageUrl,
          title: formData.title,
          material: formData.material,
          color: formData.color,
          size: formData.size,
          description: formData.description,
          price: formData.price,
          costPrice: formData.costPrice,
        }),
      });

      if (!saveRes.ok) {
        throw new Error('Failed to save product details.');
      }

      setFormMessage(formData.productId ? 'Product updated successfully!' : 'Product added successfully!');
      resetProductForm();
    } catch (err) {
      setFormMessage('Error: ' + err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Category Form Actions
  const handleEditCategory = (cat) => {
    setEditingCategory(cat.id);
    setCatForm({
      id: cat.id,
      label: cat.name || cat.label,
      icon: cat.icon || 'grid',
      order: cat.display_order || cat.order || 0,
      subCategories: cat.subCategories || [],
    });
  };

  const handleCancelCategory = () => {
    setEditingCategory(null);
    setCatForm({ id: '', label: '', icon: 'grid', order: categories.length, subCategories: [] });
  };

  const saveCategory = async () => {
    if (!catForm.id || !catForm.label) {
      setCatMessage('Error: ID and Label are required.');
      return;
    }

    setCatLoading(true);
    setCatMessage('Saving category...');

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'saveCategory',
          category: catForm,
        }),
      });

      if (res.ok) {
        setCatMessage('Category saved successfully!');
        handleCancelCategory();
        await fetchCategories();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err) {
      setCatMessage('Error: ' + err.message);
    } finally {
      setCatLoading(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? All subcategories and products inside will be affected.')) return;
    setCatLoading(true);
    setCatMessage('Deleting category...');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteCategory',
          categoryId: id,
        }),
      });

      if (res.ok) {
        setCatMessage('Category deleted.');
        await fetchCategories();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err) {
      setCatMessage('Error: ' + err.message);
    } finally {
      setCatLoading(false);
    }
  };

  const addSub = () => {
    setCatForm(prev => ({
      ...prev,
      subCategories: [...prev.subCategories, { id: '', label: '', display_order: prev.subCategories.length + 1 }],
    }));
  };

  const updateSub = (index, field, value) => {
    const updated = [...catForm.subCategories];
    updated[index][field] = value;
    setCatForm(prev => ({ ...prev, subCategories: updated }));
  };

  const deleteSub = (index) => {
    setCatForm(prev => ({
      ...prev,
      subCategories: prev.subCategories.filter((_, i) => i !== index),
    }));
  };

  // Reset Categories to hardcoded default
  const handleResetCategories = async () => {
    const INITIAL_CATEGORIES = [
      {
        id: 'almari',
        label: 'Almirahs',
        subCategories: [
          { id: 'sd-lw', label: 'SD Almari (LW)' },
          { id: 'sd-mh', label: 'SD Almari (MH)' },
          { id: 'sd-h', label: 'SD Almari (H)' },
          { id: 'dd-lw', label: 'DD Almari (LW)' },
          { id: 'dd-mh', label: 'DD Almari (MH)' },
          { id: 'dd-h', label: 'DD Almari (H)' },
          { id: 'td-lw', label: 'TD Almari (LW)' },
          { id: 'td-mh', label: 'TD Almari (MH)' },
          { id: 'td-h', label: 'TD Almari (H)' },
          { id: 'office', label: 'Office Almari' },
          { id: 'wall-doors', label: 'Wall Doors' },
        ]
      },
      {
        id: 'cots',
        label: 'Cots & Beds',
        subCategories: [
          { id: 'up-down', label: 'Up & Down Cots' },
          { id: 'bail-patti', label: 'Bail patti cots' },
          { id: 'nawar', label: 'Nawar Cots' },
          { id: 'single-rm', label: 'Single Cots (RM)' },
          { id: 'single-h', label: 'Single Cots (H)' },
          { id: 'double-rm', label: 'Double cots (RM)' },
          { id: 'double-mh', label: 'Double cots (MH)' },
          { id: 'four-and-half', label: "4½'×6'.2\" cots (H)" },
          { id: 'five-by-six', label: "5'×6½' cots (H)" },
        ]
      },
      { id: 'sofa', label: 'Sofa', subCategories: [{ id: 'sofa-diwan', label: 'Sofa & Diwan cot' }] },
      { id: 'dressing-table', label: 'Dressing Table', subCategories: [{ id: 'dressing-table-sub', label: 'Dressing Table' }] },
      { id: 'chairs', label: 'Chairs', subCategories: [{ id: 'metal-chairs', label: 'Metal Chair' }, { id: 'steel-chairs', label: 'Steel Chair' }, { id: 'plastic-chairs', label: 'Plastic Chair' }] },
      { id: 'stools-ladders', label: 'Stools & Ladders', subCategories: [{ id: 'plastic-stools', label: 'Plastic Stools' }, { id: 'ladders-stools', label: 'Ladders & Stools' }] },
      { id: 'racks', label: 'Racks', subCategories: [{ id: 'racks-sub', label: 'Racks' }] },
      { id: 'tables', label: 'Tables', subCategories: [{ id: 'office-table', label: 'Office Table' }, { id: 'dining-table', label: 'Dining Table' }] },
      { id: 'lockers', label: 'Lockers', subCategories: [{ id: 'lockers-sub', label: 'Lockers' }] },
      { id: 'trunks', label: 'Trunks', subCategories: [{ id: 'trunks-sub', label: 'Trunks' }] }
    ];

    if (!window.confirm('Resetting will clear ALL current categories in the database and overwrite them with defaults. Proceed?')) return;
    setCatLoading(true);
    setCatMessage('Resetting to defaults...');
    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resetCategories',
          defaultCategories: INITIAL_CATEGORIES,
        }),
      });

      if (res.ok) {
        setCatMessage('Successfully reset categories to standard structure!');
        await fetchCategories();
      } else {
        const err = await res.json();
        throw new Error(err.error);
      }
    } catch (err) {
      setCatMessage('Error resetting: ' + err.message);
    } finally {
      setCatLoading(false);
    }
  };

  const marginVal = formData.price && formData.costPrice ? Number(formData.price) - Number(formData.costPrice) : null;

  return (
    <div className="min-h-screen bg-surface-secondary dark:bg-dark-primary pb-24">
      {/* Top Navigation Tab Selector */}
      <div className="bg-surface-primary dark:bg-dark-secondary border-b border-surface-border dark:border-dark-border sticky top-[56px] z-30">
        <div className="flex max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-4 text-xs font-extrabold uppercase tracking-wider transition-colors duration-200 border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'products'
                ? 'border-brand-500 text-brand-650 dark:text-brand-400 bg-brand-50/10 dark:bg-brand-950/5'
                : 'border-transparent text-ink-secondary dark:text-gray-400 hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <Package size={14} />
            Products Manager
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-4 text-xs font-extrabold uppercase tracking-wider transition-colors duration-200 border-b-2 flex items-center justify-center gap-2 ${
              activeTab === 'categories'
                ? 'border-brand-500 text-brand-650 dark:text-brand-400 bg-brand-50/10 dark:bg-brand-950/5'
                : 'border-transparent text-ink-secondary dark:text-gray-400 hover:text-ink-primary dark:hover:text-white'
            }`}
          >
            <FolderTree size={14} />
            Categories Editor
          </button>
        </div>
      </div>

      {/* Products Manager Panel */}
      {activeTab === 'products' && (
        <div className="p-4 max-w-lg mx-auto">
          <div className="bg-surface-primary dark:bg-dark-secondary rounded-2xl border border-surface-border dark:border-dark-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading font-extrabold text-xl text-ink-primary dark:text-white">
                {formData.productId ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button 
                onClick={logout} 
                className="text-xs font-bold px-3 py-1.5 bg-surface-secondary dark:bg-dark-tertiary text-ink-secondary hover:text-red-500 rounded-lg transition-colors border border-surface-border dark:border-dark-border"
              >
                Logout
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="space-y-4">
              {/* Product Form Inputs */}
              <div>
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value, subCategory: '' }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.name || c.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Subcategory</label>
                <select
                  required
                  disabled={!formData.category}
                  value={formData.subCategory}
                  onChange={(e) => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50"
                >
                  <option value="">Select Subcategory</option>
                  {subcategories.map(s => (
                    <option key={s.id} value={s.id}>{s.name || s.label}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Image upload preview */}
                <div className="relative aspect-square bg-surface-secondary dark:bg-dark-tertiary rounded-xl border border-dashed border-surface-border dark:border-dark-border flex items-center justify-center overflow-hidden">
                  {previewURL ? (
                    <img src={previewURL} alt="Preview" className="w-full h-full object-contain" />
                  ) : (
                    <span className="text-[10px] font-bold text-ink-muted text-center px-2">No Image Selected</span>
                  )}
                </div>
                
                <div className="flex flex-col justify-center">
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Select Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="text-xs text-ink-secondary file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
                  />
                  {formData.imageUrl && (
                    <p className="text-[10px] text-ink-muted mt-2 truncate max-w-[180px]">Existing: {formData.imageUrl.split('/').pop()}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Product Title</label>
                <input
                  type="text"
                  placeholder="e.g. 6-Door Standard Cupboard"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Material</label>
                  <input
                    type="text"
                    placeholder="Steel (20 Gauge)"
                    value={formData.material}
                    onChange={(e) => setFormData(prev => ({ ...prev, material: e.target.value }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Color / Finish</label>
                  <input
                    type="text"
                    placeholder="Grey / Royal Blue"
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Dimensions (Size)</label>
                  <input
                    type="text"
                    placeholder="e.g. 78''x36''x18''"
                    value={formData.size}
                    onChange={(e) => setFormData(prev => ({ ...prev, size: e.target.value }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Selling Price (Rs)</label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Cost Price (Rs)</label>
                  <input
                    type="number"
                    placeholder="11000"
                    value={formData.costPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div className="flex flex-col justify-end">
                  {marginVal !== null && (
                    <div className="px-3.5 py-2.5 bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 rounded-xl text-xs font-bold flex items-center justify-between border border-brand-200/50 dark:border-brand-900/30">
                      <span>Profit Margin:</span>
                      <span className="font-mono">{formatPrice(marginVal)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  placeholder="Optional details, extra compartments, lock configurations, etc."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all resize-none"
                />
              </div>

              {formMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  formMessage.startsWith('Error') 
                    ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-200/50 dark:border-red-900/30' 
                    : 'bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border border-brand-200/50 dark:border-brand-900/30'
                }`}>
                  {formLoading && <Loader2 className="animate-spin text-brand-500 shrink-0" size={14} />}
                  {!formLoading && !formMessage.startsWith('Error') && <CheckCircle className="text-brand-500 shrink-0" size={14} />}
                  <span>{formMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-ink-primary dark:bg-brand-650 hover:bg-black dark:hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 disabled:opacity-50"
                >
                  <Save size={16} />
                  {formData.productId ? 'Update Product Details' : 'Save & Publish Product'}
                </button>
                {formData.productId && (
                  <button
                    type="button"
                    onClick={resetProductForm}
                    className="px-4 bg-surface-secondary dark:bg-dark-tertiary text-ink-primary dark:text-white font-extrabold rounded-xl text-xs active:scale-95 transition-colors border border-surface-border dark:border-dark-border"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Categories Editor Panel */}
      {activeTab === 'categories' && (
        <div className="p-4 max-w-lg mx-auto space-y-6">
          <div className="bg-surface-primary dark:bg-dark-secondary rounded-2xl border border-surface-border dark:border-dark-border p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-heading font-extrabold text-xl text-ink-primary dark:text-white">
                {editingCategory ? 'Edit Category' : 'Create Category'}
              </h2>
              <button
                onClick={handleResetCategories}
                disabled={catLoading}
                className="flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1.5 bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/10 text-orange-600 dark:text-orange-400 border border-orange-200/50 dark:border-orange-900/30 rounded-lg transition-colors disabled:opacity-50"
              >
                <RotateCcw size={12} />
                Reset Defaults
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Category ID (Unique)</label>
                  <input
                    type="text"
                    disabled={!!editingCategory}
                    placeholder="e.g. wardrobes"
                    value={catForm.id}
                    onChange={(e) => setCatForm(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Category Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Wardrobes"
                    value={catForm.label}
                    onChange={(e) => setCatForm(prev => ({ ...prev, label: e.target.value }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Display Order</label>
                  <input
                    type="number"
                    placeholder="1"
                    value={catForm.order}
                    onChange={(e) => setCatForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider mb-1.5">Icon Key</label>
                  <input
                    type="text"
                    placeholder="grid"
                    value={catForm.icon}
                    onChange={(e) => setCatForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3.5 py-2.5 text-sm text-ink-primary dark:text-white outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  />
                </div>
              </div>

              {/* Subcategories Subsection */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 uppercase tracking-wider">Subcategories</label>
                  <button 
                    onClick={addSub} 
                    className="text-[10px] font-extrabold uppercase text-brand-600 dark:text-brand-400 flex items-center gap-0.5 hover:underline"
                  >
                    <Plus size={12} /> Add Subcategory
                  </button>
                </div>
                
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
                  {catForm.subCategories.map((sub, index) => (
                    <div key={index} className="flex gap-2 items-center bg-surface-secondary dark:bg-dark-tertiary p-2 rounded-xl border border-surface-border dark:border-dark-border">
                      <input
                        type="text"
                        placeholder="Subcategory ID"
                        disabled={editingCategory && sub.created_at}
                        value={sub.id}
                        onChange={(e) => updateSub(index, 'id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                        className="flex-1 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-ink-primary dark:text-white outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Subcategory Label"
                        value={sub.label || sub.name}
                        onChange={(e) => updateSub(index, 'label', e.target.value)}
                        className="flex-1 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-lg px-2.5 py-1.5 text-xs text-ink-primary dark:text-white outline-none"
                      />
                      <input
                        type="number"
                        placeholder="Order"
                        value={sub.display_order || sub.order || 0}
                        onChange={(e) => updateSub(index, 'display_order', Number(e.target.value))}
                        className="w-14 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-lg px-2 py-1.5 text-xs text-ink-primary dark:text-white text-center outline-none"
                      />
                      <button 
                        onClick={() => deleteSub(index)} 
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg active:scale-90"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                  {catForm.subCategories.length === 0 && (
                    <p className="text-[10px] text-ink-muted text-center py-4">No subcategories defined yet.</p>
                  )}
                </div>
              </div>

              {catMessage && (
                <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  catMessage.startsWith('Error') 
                    ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border border-red-200/50 dark:border-red-900/30' 
                    : 'bg-brand-50 dark:bg-brand-950/20 text-brand-700 dark:text-brand-400 border border-brand-200/50 dark:border-brand-900/30'
                }`}>
                  {catLoading && <Loader2 className="animate-spin text-brand-500 shrink-0" size={14} />}
                  {!catLoading && !catMessage.startsWith('Error') && <CheckCircle className="text-brand-500 shrink-0" size={14} />}
                  <span>{catMessage}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={saveCategory}
                  disabled={catLoading}
                  className="flex-1 bg-ink-primary dark:bg-brand-650 hover:bg-black dark:hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-xl active:scale-95 transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-brand-500/10 disabled:opacity-50"
                >
                  <Save size={16} />
                  {editingCategory ? 'Update Category' : 'Save Category'}
                </button>
                {editingCategory && (
                  <button
                    onClick={handleCancelCategory}
                    className="px-4 bg-surface-secondary dark:bg-dark-tertiary text-ink-primary dark:text-white font-extrabold rounded-xl text-xs active:scale-95 transition-colors border border-surface-border dark:border-dark-border"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* List of existing Categories */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold text-ink-secondary dark:text-gray-400 uppercase tracking-wider px-1">
              Active Categories ({categories.length})
            </h3>
            {categoriesLoading ? (
              <div className="flex justify-center items-center py-12 bg-surface-primary dark:bg-dark-secondary rounded-2xl border border-surface-border dark:border-dark-border">
                <Loader2 className="animate-spin text-brand-500" size={24} />
              </div>
            ) : categories.length === 0 ? (
              <p className="text-xs text-ink-muted">No categories in database. Click Reset Defaults above to initialize.</p>
            ) : (
              categories.map(cat => (
                <div 
                  key={cat.id} 
                  className="bg-surface-primary dark:bg-dark-secondary p-4 rounded-xl border border-surface-border dark:border-dark-border flex items-center justify-between shadow-sm"
                >
                  <div>
                    <h4 className="font-heading font-extrabold text-base text-ink-primary dark:text-white">
                      {cat.name || cat.label}
                      <span className="text-[10px] text-brand-500 font-mono ml-2">order: {cat.display_order || cat.order}</span>
                    </h4>
                    <p className="text-xs text-ink-secondary dark:text-gray-400 mt-0.5">
                      {cat.subCategories?.length || 0} subcategories
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditCategory(cat)} 
                      className="p-2 bg-surface-secondary dark:bg-dark-tertiary rounded-lg text-ink-secondary hover:text-brand-500 active:scale-95"
                    >
                      <Plus size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteCategory(cat.id)} 
                      className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 hover:text-red-700 rounded-lg active:scale-95"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
