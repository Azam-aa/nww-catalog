import { useState, useMemo } from 'react';
import imageCompression from 'browser-image-compression';
import { CATEGORIES } from '../../data/categories';
import { uploadProductImage } from '../../firebase/storage';
import { addProduct, updateProduct } from '../../firebase/products';
import { Upload, X, CheckCircle, Loader2 } from 'lucide-react';

export function AdminForm({ editingProduct }) {
  const [file, setFile] = useState(null);
  const [previewURL, setPreviewURL] = useState(editingProduct?.imageUrl || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    category: editingProduct?.category || '',
    subCategory: editingProduct?.subCategory || '',
    typeCode: editingProduct?.typeCode || '',
    weightType: editingProduct?.weightType || '',
    name: editingProduct?.name || '',
    material: editingProduct?.material || '',
    color: editingProduct?.color || '',
    size: editingProduct?.size || '',
    description: editingProduct?.description || '',
    price: editingProduct?.price || '',
    costPrice: editingProduct?.costPrice || '',
  });

  const selectedCategory = useMemo(() => 
    CATEGORIES.find(c => c.id === formData.category), 
  [formData.category]);

  const selectedSubCategory = useMemo(() => 
    selectedCategory?.subCategories.find(s => s.id === formData.subCategory),
  [selectedCategory, formData.subCategory]);

  const weightTypes = selectedSubCategory?.weightTypes || [];

  const handleCategoryChange = (e) => {
    setFormData(prev => ({ 
      ...prev, 
      category: e.target.value, 
      subCategory: '', 
      typeCode: '', 
      weightType: '' 
    }));
  };

  const handleSubCategoryChange = (e) => {
    const sub = selectedCategory?.subCategories.find(s => s.id === e.target.value);
    setFormData(prev => ({ 
      ...prev, 
      subCategory: e.target.value,
      typeCode: sub?.typeCode || '',
      weightType: ''
    }));
  };

  const handleFileLocal = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setPreviewURL(URL.createObjectURL(f));
    }
  };

  const removeFile = () => {
    setFile(null);
    if (previewURL) {
      URL.revokeObjectURL(previewURL);
      setPreviewURL(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file && !editingProduct?.imageUrl) {
      setMessage('Please upload an image.');
      return;
    }
    
    setIsSubmitting(true);
    setMessage('');
    
    try {
      let imageUrl = editingProduct?.imageUrl;

      if (file) {
        // Compress
        const compressedFile = await imageCompression(file, { 
          maxSizeMB: 0.5, 
          maxWidthOrHeight: 1024 
        });
        
        // Upload
        imageUrl = await uploadProductImage(compressedFile, formData.category, (prog) => {
          setUploadProgress(prog);
        });
      }
      
      // Save doc
      const margin = (Number(formData.price || 0) - Number(formData.costPrice || 0));
      const docData = {
        ...formData,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        margin,
        imageUrl,
        thumbnailUrl: imageUrl // use same as per prompt
      };
      
      if (editingProduct) {
        await updateProduct(editingProduct.id, docData);
        setMessage('Product updated successfully!');
      } else {
        await addProduct(docData);
        setMessage('Product added successfully!');
        setFormData({
          category: '', subCategory: '', typeCode: '', weightType: '',
          name: '', material: '', color: '', size: '', description: '',
          price: '', costPrice: ''
        });
        removeFile();
      }
      setUploadProgress(0);
    } catch (err) {
      console.error(err);
      setMessage('Error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseInput = "w-full bg-surface-secondary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-lg px-4 py-2 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4";
  const baseLabel = "block text-sm font-medium text-ink-secondary dark:text-gray-400 mb-1";

  const margin = (Number(formData.price || 0) - Number(formData.costPrice || 0));

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 pb-24">
      {message && (
        <div className={`p-4 mb-6 rounded-lg ${message.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-brand-100 text-brand-800'} flex items-center gap-2`}>
          {!message.includes('Error') && <CheckCircle size={20} />}
          {message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="bg-surface-primary dark:bg-dark-secondary p-6 rounded-2xl shadow-sm border border-surface-border dark:border-dark-border">
        <h2 className="font-heading font-bold text-2xl text-ink-primary dark:text-white mb-6">
          {editingProduct ? 'Edit Product' : 'Add Product'}
        </h2>
        
        {/* Image Upload */}
        <label className={baseLabel}>Product Image</label>
        <div className="mb-6 relative h-48 rounded-xl border-2 border-dashed border-surface-border dark:border-dark-border flex items-center justify-center bg-surface-tertiary dark:bg-dark-tertiary overflow-hidden">
          {previewURL ? (
            <>
              <img src={previewURL} alt="Preview" className="w-full h-full object-contain" />
              <button 
                type="button" 
                onClick={removeFile}
                className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70"
              >
                <X size={20} />
              </button>
            </>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-full cursor-pointer text-ink-secondary dark:text-gray-400">
              <Upload size={32} className="mb-2" />
              <span>Tap to upload image</span>
              <input type="file" accept="image/*" onChange={handleFileLocal} className="hidden" />
            </label>
          )}
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={baseLabel}>Category</label>
            <select required value={formData.category} onChange={handleCategoryChange} className={baseInput}>
              <option value="" disabled>Select...</option>
              {CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className={baseLabel}>Subcategory</label>
            <select required value={formData.subCategory} onChange={handleSubCategoryChange} disabled={!selectedCategory} className={baseInput}>
              <option value="" disabled>Select...</option>
              {selectedCategory?.subCategories.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={baseLabel}>Type Code</label>
            <input type="text" readOnly value={formData.typeCode} className={`${baseInput} opacity-70 bg-surface-tertiary dark:bg-dark-tertiary`} />
          </div>
          <div>
            <label className={baseLabel}>Weight Type</label>
            <select required={weightTypes.length > 0} value={formData.weightType} onChange={e => setFormData({...formData, weightType: e.target.value})} disabled={weightTypes.length === 0} className={baseInput}>
              <option value="" disabled>None</option>
              {weightTypes.map(w => <option key={w} value={w}>{w}</option>)}
              {weightTypes.length === 0 && <option value="">N/A</option>}
            </select>
          </div>
        </div>

        {/* Details text */}
        <label className={baseLabel}>Product Name</label>
        <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={baseInput} />

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={baseLabel}>Material</label>
            <input type="text" value={formData.material} onChange={e => setFormData({...formData, material: e.target.value})} className={baseInput} />
          </div>
          <div>
            <label className={baseLabel}>Color</label>
            <input type="text" value={formData.color} onChange={e => setFormData({...formData, color: e.target.value})} className={baseInput} />
          </div>
        </div>

        <label className={baseLabel}>Size</label>
        <input type="text" value={formData.size} onChange={e => setFormData({...formData, size: e.target.value})} className={baseInput} placeholder="e.g. 6ft × 3ft" />

        <label className={baseLabel}>Description</label>
        <textarea rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className={baseInput}></textarea>

        {/* Pricing */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-surface-border dark:border-dark-border pt-4 mt-2">
          <div>
            <label className={baseLabel}>Selling Price (₹)</label>
            <input required type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className={baseInput} />
          </div>
          <div>
            <label className={baseLabel}>Cost Price (₹)</label>
            <input required type="number" value={formData.costPrice} onChange={e => setFormData({...formData, costPrice: e.target.value})} className={baseInput} />
          </div>
          <div>
            <label className={baseLabel}>Margin</label>
            <input type="text" readOnly value={`₹${margin}`} className={`${baseInput} font-bold opacity-80 ${margin >= 0 ? 'text-brand-600' : 'text-red-500'}`} />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full mt-6 bg-ink-primary dark:bg-brand-600 hover:bg-black dark:hover:bg-brand-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin" size={20} />
              Saving... {uploadProgress > 0 ? uploadProgress + '%' : ''}
            </>
          ) : (
            editingProduct ? 'Update Product' : 'Save Product'
          )}
        </button>
      </form>
    </div>
  );
}
