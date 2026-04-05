import { useState, useMemo } from 'react';
import imageCompression from 'browser-image-compression';
import { useCategories } from '../../context/CategoryContext';
import { uploadProductImage } from '../../firebase/storage';
import { addProduct, updateProduct } from '../../firebase/products';
import { Upload, X, CheckCircle, Loader2, Plus, Layers } from 'lucide-react';

export function AdminForm({ editingProduct }) {
  const { categories, loading: categoriesLoading } = useCategories();
  const [files, setFiles] = useState([]);
  const [previewURLs, setPreviewURLs] = useState(
    editingProduct?.imageUrls?.length > 0
      ? editingProduct.imageUrls
      : editingProduct?.imageUrl
        ? [editingProduct.imageUrl]
        : []
  );
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
    categories.find(c => c.id === formData.category), 
  [categories, formData.category]);

  const selectedSubCategory = useMemo(() => 
    selectedCategory?.subCategories?.find(s => s.id === formData.subCategory),
  [selectedCategory, formData.subCategory]);

  const weightTypes = selectedSubCategory?.weightTypes || [];

  if (categoriesLoading) {
    return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-brand-500" /></div>;
  }

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

  const handleFilesLocal = (e) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;

    // Limit to 5 images total
    const totalAllowed = 5 - files.length - previewURLs.filter(u => u.startsWith('http')).length;
    const filesToAdd = newFiles.slice(0, Math.max(0, totalAllowed));

    if (filesToAdd.length < newFiles.length) {
      setMessage('Maximum 5 images per product. Some images were skipped.');
    }

    setFiles(prev => [...prev, ...filesToAdd]);
    const newPreviews = filesToAdd.map(f => URL.createObjectURL(f));
    setPreviewURLs(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index) => {
    const preview = previewURLs[index];
    
    // If it's a blob URL (new file), also remove from files array
    if (preview.startsWith('blob:')) {
      const blobIndex = previewURLs.slice(0, index + 1).filter(u => u.startsWith('blob:')).length - 1;
      setFiles(prev => prev.filter((_, i) => i !== blobIndex));
      URL.revokeObjectURL(preview);
    }

    setPreviewURLs(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const existingUrls = previewURLs.filter(u => u.startsWith('http'));
    if (files.length === 0 && existingUrls.length === 0) {
      setMessage('Please upload at least one image.');
      return;
    }
    
    setIsSubmitting(true);
    setMessage('Status: Starting...');
    
    try {
      // Upload new files
      const newImageUrls = [];
      for (let i = 0; i < files.length; i++) {
        setMessage(`Status: Compressing image ${i + 1}/${files.length}...`);
        const compressedFile = await imageCompression(files[i], { 
          maxSizeMB: 0.5, 
          maxWidthOrHeight: 1024 
        });
        
        setMessage(`Status: Uploading image ${i + 1}/${files.length}...`);
        const url = await uploadProductImage(compressedFile, formData.category, (prog) => {
          setUploadProgress(Math.round(((i + prog / 100) / files.length) * 100));
        });
        newImageUrls.push(url);
      }

      // Combine existing URLs with new uploads
      const allImageUrls = [...existingUrls, ...newImageUrls];
      
      setMessage('Status: Saving to Database...');
      const margin = (Number(formData.price || 0) - Number(formData.costPrice || 0));
      const docData = {
        ...formData,
        price: Number(formData.price),
        costPrice: Number(formData.costPrice),
        margin,
        imageUrl: allImageUrls[0],           // Backward compatible
        thumbnailUrl: allImageUrls[0],       // Thumbnail = first image
        imageUrls: allImageUrls,             // Full array of images
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
        // Cleanup blob URLs
        previewURLs.forEach(u => { if (u.startsWith('blob:')) URL.revokeObjectURL(u); });
        setFiles([]);
        setPreviewURLs([]);
      }
      setUploadProgress(0);
    } catch (err) {
      console.error("Form Submission Error:", err);
      setMessage('Error: ' + (err.message || 'Unknown error occurred.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const baseInput = "w-full bg-surface-secondary dark:bg-dark-secondary border border-surface-border dark:border-dark-border rounded-lg px-4 py-2 text-ink-primary dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 mb-4";
  const baseLabel = "block text-sm font-medium text-ink-secondary dark:text-gray-400 mb-1";

  const margin = (Number(formData.price || 0) - Number(formData.costPrice || 0));
  const totalImages = previewURLs.length;

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
        
        {/* Image Upload — Multi-image grid */}
        <label className={baseLabel}>
          Product Images 
          <span className="text-ink-muted dark:text-gray-500 text-xs ml-1">({totalImages}/5)</span>
        </label>
        <div className="mb-6 grid grid-cols-3 gap-2">
          {/* Preview images */}
          {previewURLs.map((url, i) => (
            <div key={i} className="relative aspect-square rounded-xl border-2 border-surface-border dark:border-dark-border overflow-hidden bg-surface-tertiary dark:bg-dark-tertiary">
              <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              <button 
                type="button" 
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
              >
                <X size={14} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-brand-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  MAIN
                </span>
              )}
            </div>
          ))}
          
          {/* Add more button */}
          {totalImages < 5 && (
            <label className="aspect-square rounded-xl border-2 border-dashed border-surface-border dark:border-dark-border flex flex-col items-center justify-center cursor-pointer bg-surface-tertiary dark:bg-dark-tertiary text-ink-secondary dark:text-gray-400 hover:border-brand-500 hover:text-brand-500 transition-colors">
              <Plus size={24} className="mb-1" />
              <span className="text-[10px]">Add Image</span>
              <input type="file" accept="image/*" multiple onChange={handleFilesLocal} className="hidden" />
            </label>
          )}
        </div>

        {/* Categories */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={baseLabel}>Category</label>
            <select required value={formData.category} onChange={handleCategoryChange} className={baseInput}>
              <option value="" disabled>Select...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
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
