'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../../context/AdminContext';
import { Lock, Package, FolderTree, Save, Trash2, Plus, X, RotateCcw, Loader2, CheckCircle } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { formatPrice } from '../../utils/formatPrice';

export default function AdminPage() {
  const { isAdmin, loading: adminLoading, login, logout } = useAdmin();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
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
    if (isAdmin) {
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
    }
  }, [isAdmin]);

  // Derived category configurations
  const selectedCategory = useMemo(() => 
    categories.find(c => c.id === formData.category),
    [categories, formData.category]
  );

  const subcategories = selectedCategory?.subCategories || [];

  // Handle password submission
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(false);
    const success = await login(password);
    if (!success) {
      setLoginError(true);
    }
  };

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

  if (adminLoading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-500" size={36} />
      </div>
    );
  }

  // 1. Password Protection Gate
  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] px-4 flex items-center justify-center bg-surface-secondary dark:bg-dark-primary">
        <div className="w-full max-w-sm bg-surface-primary dark:bg-dark-secondary p-8 rounded-2xl shadow-sm border border-surface-border dark:border-dark-border text-center">
          <div className="w-16 h-16 bg-surface-secondary dark:bg-dark-tertiary rounded-full flex items-center justify-center mx-auto mb-6 text-ink-secondary dark:text-gray-400">
            <Lock size={32} />
          </div>
          <h2 className="font-heading font-extrabold text-2xl text-ink-primary dark:text-white mb-2">
            Admin Access
          </h2>
          <p className="text-ink-secondary dark:text-gray-400 text-xs mb-6">
            Enter password to manage products and categories.
          </p>
          
          <form onSubmit={handleLoginSubmit} className="space-y-6">
            <div>
              <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-4 py-3.5 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 text-center tracking-[0.2em] font-bold text-lg"
              />
              {loginError && (
                <p className="text-red-500 text-xs font-bold mt-2">Incorrect password. Please try again.</p>
              )}
            </div>
            <button 
              type="submit" 
              className="w-full bg-ink-primary dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-xl active:scale-95 transition-transform text-sm"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // 2. Admin Dashboard Layout
  return (
    <div className="min-h-screen bg-surface-secondary dark:bg-dark-primary pb-24">
      {/* Top Navigation Tab Selector */}
      <div className="bg-surface-primary dark:bg-dark-secondary border-b border-surface-border dark:border-dark-border sticky top-[56px] z-30">
        <div className="flex max-w-lg mx-auto">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-4 text-xs font-extrabold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'products' 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10' 
                : 'border-transparent text-ink-muted dark:text-gray-500 hover:text-ink-primary dark:hover:text-gray-300'
            }`}
          >
            <Package size={16} /> Add / Edit Product
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`flex-1 py-4 text-xs font-extrabold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'categories' 
                ? 'border-brand-500 text-brand-600 dark:text-brand-400 bg-brand-50/50 dark:bg-brand-900/10' 
                : 'border-transparent text-ink-muted dark:text-gray-500 hover:text-ink-primary dark:hover:text-gray-300'
            }`}
          >
            <FolderTree size={16} /> Manage Categories
          </button>
        </div>
      </div>

      {/* Tab 1: Manage Products */}
      {activeTab === 'products' && (
        <div className="max-w-xl mx-auto p-4 pt-6">
          {formMessage && (
            <div className={`p-4 mb-4 rounded-xl text-xs font-bold flex items-center gap-2 ${
              formMessage.includes('Error') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-brand-50 text-brand-600 border border-brand-200'
            }`}>
              {!formMessage.includes('Error') && <CheckCircle size={16} />}
              {formMessage}
            </div>
          )}

          <form onSubmit={handleProductSubmit} className="bg-surface-primary dark:bg-dark-secondary p-5 sm:p-6 rounded-2xl shadow-sm border border-surface-border dark:border-dark-border space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-surface-border dark:border-dark-border">
              <h2 className="font-heading font-extrabold text-xl text-ink-primary dark:text-white">
                {formData.productId ? 'Edit Product Design' : 'Add Product Design'}
              </h2>
              {formData.productId && (
                <button 
                  type="button" 
                  onClick={resetProductForm}
                  className="px-2.5 py-1 text-xs bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-lg text-ink-secondary dark:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {/* Image Upload Area */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1.5">Product Photo</label>
              {previewURL ? (
                <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-surface-border dark:border-dark-border bg-surface-tertiary dark:bg-dark-tertiary">
                  <img src={previewURL} alt="Preview" className="w-full h-full object-contain" />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewURL('');
                    }}
                    className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label className="w-full aspect-video rounded-xl border-2 border-dashed border-surface-border dark:border-dark-border flex flex-col items-center justify-center cursor-pointer bg-surface-tertiary dark:bg-dark-tertiary hover:border-brand-500 hover:text-brand-500 transition-colors py-8">
                  <Plus size={28} className="text-ink-muted mb-1" />
                  <span className="text-xs font-bold">Select design photo</span>
                  <span className="text-[10px] text-ink-muted mt-0.5">Compresses to under 300KB</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            {/* Category selection */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Category</label>
                <select 
                  required 
                  value={formData.category} 
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value, subCategory: '' }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                >
                  <option value="">Select Category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Subcategory</label>
                <select 
                  value={formData.subCategory} 
                  onChange={e => setFormData(prev => ({ ...prev, subCategory: e.target.value }))}
                  disabled={!formData.category}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none disabled:opacity-50"
                >
                  <option value="">Leave Uncategorized</option>
                  {subcategories.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Design Text Inputs */}
            <div>
              <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Product Title</label>
              <input 
                required 
                type="text" 
                value={formData.title} 
                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                placeholder="e.g. Single Door Almari MH"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-1">
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Material</label>
                <input 
                  type="text" 
                  value={formData.material} 
                  onChange={e => setFormData(prev => ({ ...prev, material: e.target.value }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                  placeholder="e.g. MS Steel"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Color</label>
                <input 
                  type="text" 
                  value={formData.color} 
                  onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                  placeholder="e.g. Grey"
                />
              </div>
              <div className="col-span-1">
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Size</label>
                <input 
                  type="text" 
                  value={formData.size} 
                  onChange={e => setFormData(prev => ({ ...prev, size: e.target.value }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                  placeholder="e.g. 6ft x 3ft"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Description</label>
              <textarea 
                rows="2" 
                value={formData.description} 
                onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                placeholder="Product description..."
              />
            </div>

            {/* Pricing Section */}
            <div className="grid grid-cols-3 gap-3 pt-2 border-t border-surface-border dark:border-dark-border">
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary dark:text-gray-400 mb-1">Selling Price (₹)</label>
                <input 
                  type="number" 
                  value={formData.price} 
                  onChange={e => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary dark:text-gray-400 mb-1">Cost Price (₹)</label>
                <input 
                  type="number" 
                  value={formData.costPrice} 
                  onChange={e => setFormData(prev => ({ ...prev, costPrice: e.target.value }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm text-ink-primary dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-ink-secondary dark:text-gray-400 mb-1">Calculated Margin</label>
                <div className={`w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm font-bold flex items-center h-[38px] ${
                  marginVal !== null && marginVal >= 0 ? 'text-brand-650' : (marginVal === null ? 'text-ink-muted' : 'text-red-500')
                }`}>
                  {marginVal !== null ? formatPrice(marginVal) : '-'}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full bg-ink-primary dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-extrabold py-3.5 rounded-xl text-sm active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {formLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving Product...
                </>
              ) : (
                formData.productId ? 'Update Furniture Design' : 'Save Furniture Design'
              )}
            </button>
          </form>

          {/* Secure Logout Button */}
          <button
            onClick={logout}
            className="w-full mt-6 py-3 border border-red-200 dark:border-red-950/40 text-red-500 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/10 font-bold active:scale-95 transition-all text-xs"
          >
            Sign Out of Admin panel
          </button>
        </div>
      )}

      {/* Tab 2: Manage Categories */}
      {activeTab === 'categories' && (
        <div className="max-w-xl mx-auto p-4 pt-6 space-y-6">
          {catMessage && (
            <div className={`p-4 rounded-xl text-xs font-bold ${
              catMessage.includes('Error') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-brand-50 text-brand-600 border border-brand-200'
            }`}>
              {catMessage}
            </div>
          )}

          {/* Edit or Create Category Card */}
          {editingCategory || catForm.id ? (
            <div className="bg-surface-primary dark:bg-dark-secondary p-5 rounded-2xl shadow-sm border border-surface-border dark:border-dark-border space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-heading font-extrabold text-lg text-ink-primary dark:text-white">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <button onClick={handleCancelCategory} className="text-ink-muted hover:text-ink-primary"><X size={18} /></button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">ID (Short lowercase)</label>
                  <input 
                    type="text" 
                    value={catForm.id} 
                    onChange={e => setCatForm(prev => ({ ...prev, id: e.target.value.toLowerCase().replace(/\s+/g, '-') }))}
                    disabled={!!editingCategory}
                    placeholder="e.g. chairs"
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm dark:text-white disabled:opacity-50" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Category Name</label>
                  <input 
                    type="text" 
                    value={catForm.label} 
                    onChange={e => setCatForm(prev => ({ ...prev, label: e.target.value }))}
                    placeholder="e.g. Chairs"
                    className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm dark:text-white" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink-secondary dark:text-gray-400 mb-1">Display Sort Order</label>
                <input 
                  type="number" 
                  value={catForm.order} 
                  onChange={e => setCatForm(prev => ({ ...prev, order: Number(e.target.value) }))}
                  className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl px-3 py-2 text-sm dark:text-white" 
                />
              </div>

              {/* Subcategories list editor */}
              <div>
                <h4 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white pb-1 border-b border-surface-border dark:border-dark-border mb-3">
                  Subcategories
                </h4>
                <div className="space-y-3">
                  {catForm.subCategories.map((sub, index) => (
                    <div key={index} className="relative p-3 bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-xl flex flex-col gap-2">
                      <button 
                        type="button" 
                        onClick={() => deleteSub(index)} 
                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-red-50 dark:bg-red-950/20 p-1 rounded-md active:scale-95"
                      >
                        <Trash2 size={14} />
                      </button>
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <input 
                          placeholder="Subcategory ID (e.g. steel-chairs)" 
                          value={sub.id} 
                          onChange={e => updateSub(index, 'id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                          className="bg-surface-primary dark:bg-dark-secondary px-3 py-2 rounded-lg text-xs border border-surface-border dark:border-dark-border text-ink-primary dark:text-white focus:outline-none" 
                        />
                        <input 
                          placeholder="Subcategory Name (e.g. Steel Chair)" 
                          value={sub.label || sub.name || ''} 
                          onChange={e => updateSub(index, 'label', e.target.value)}
                          className="bg-surface-primary dark:bg-dark-secondary px-3 py-2 rounded-lg text-xs border border-surface-border dark:border-dark-border text-ink-primary dark:text-white focus:outline-none" 
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button 
                  type="button"
                  onClick={addSub}
                  className="flex justify-center items-center w-full py-2.5 border border-dashed border-surface-border dark:border-dark-border rounded-xl text-ink-secondary hover:text-brand-500 text-xs font-bold mt-3"
                >
                  <Plus size={14} className="mr-1" /> Add Subcategory
                </button>
              </div>

              <button 
                onClick={saveCategory} 
                disabled={catLoading}
                className="w-full bg-brand-500 hover:bg-brand-600 text-white font-extrabold py-3 rounded-xl flex justify-center items-center gap-2 text-sm active:scale-95"
              >
                <Save size={16} /> {catLoading ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          ) : (
            <div className="flex gap-3">
              <button 
                onClick={() => setCatForm({ id: '', label: '', icon: 'grid', order: categories.length + 1, subCategories: [] })} 
                className="flex-1 bg-surface-primary dark:bg-dark-secondary border border-surface-border dark:border-dark-border text-ink-primary dark:text-white hover:text-brand-500 py-4 rounded-2xl flex items-center justify-center font-bold active:scale-95 transition-all text-xs"
              >
                <Plus size={16} className="mr-1.5" /> New Category
              </button>
              
              <button 
                onClick={handleResetCategories} 
                disabled={catLoading} 
                className="px-6 bg-red-50 hover:bg-red-105 dark:bg-red-950/10 text-red-500 dark:text-red-400 border border-red-100 dark:border-red-950/30 py-4 rounded-2xl flex flex-col items-center justify-center font-bold active:scale-95 transition-all text-xs"
              >
                <RotateCcw size={16} className="mb-0.5" />
                Reset Defaults
              </button>
            </div>
          )}

          {/* Current Categories List */}
          <div className="space-y-2">
            <h3 className="font-heading font-extrabold text-sm text-ink-primary dark:text-white">
              Current Categories List
            </h3>
            {categoriesLoading ? (
              <div className="flex justify-center p-6"><Loader2 className="animate-spin text-brand-500" /></div>
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
