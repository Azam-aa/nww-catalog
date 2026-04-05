import { useState } from 'react';
import { useCategories } from '../../context/CategoryContext';
import { addCategory, updateCategory, deleteCategory, seedCategories } from '../../firebase/categories';
import { CATEGORIES as INITIAL_CATEGORIES } from '../../data/categories';
import { Plus, Trash2, ChevronDown, ChevronUp, Save, Edit2, Archive, Bed, Armchair, Grid, X, RotateCcw } from 'lucide-react';

const ICONS = ['cabinet', 'bed', 'armchair', 'grid'];

export function AdminCategories() {
  const { categories, refreshCategories } = useCategories();
  const [loading, setLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // the id of the category being edited
  const [message, setMessage] = useState('');

  // Form states for adding/editing a category
  const [catForm, setCatForm] = useState({ id: '', label: '', icon: 'grid', order: 0, subCategories: [] });

  const handleReset = async () => {
    if (!window.confirm('WARNING: This will overwrite ALL current categories with the default curated list. Proceed?')) return;
    setLoading(true);
    setMessage('Applying defaults...');
    try {
      await seedCategories(INITIAL_CATEGORIES);
      setMessage('Successfully reset to default categories.');
      await refreshCategories();
    } catch (err) {
      setMessage('Error resetting: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (cat) => {
    setEditingCategory(cat.id);
    setCatForm({ ...cat });
  };

  const handleCancel = () => {
    setEditingCategory(null);
    setCatForm({ id: '', label: '', icon: 'grid', order: categories.length, subCategories: [] });
  };

  const saveCategory = async () => {
    if (!catForm.id || !catForm.label) {
      setMessage('ID and Label are required.');
      return;
    }
    
    setLoading(true);
    try {
      if (editingCategory) {
        await updateCategory(catForm.id, catForm);
        setMessage('Category updated successfully.');
      } else {
        await addCategory(catForm.id, catForm);
        setMessage('Category added successfully.');
      }
      await refreshCategories();
      handleCancel();
    } catch (err) {
      setMessage('Error saving category: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category? This might break products assigned to it.')) return;
    setLoading(true);
    try {
      await deleteCategory(id);
      setMessage('Category deleted.');
      await refreshCategories();
    } catch (err) {
      setMessage('Error deleting: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const addSub = () => {
    setCatForm({
      ...catForm,
      subCategories: [...catForm.subCategories, { id: '', label: '', typeCode: '', weightTypes: [] }]
    });
  };

  const updateSub = (index, field, value) => {
    const updated = [...catForm.subCategories];
    updated[index][field] = value;
    setCatForm({ ...catForm, subCategories: updated });
  };

  const deleteSub = (index) => {
    setCatForm({
      ...catForm,
      subCategories: catForm.subCategories.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 pb-24">
      {message && <div className="p-4 mb-4 rounded-lg bg-surface-tertiary dark:bg-dark-tertiary text-ink-primary dark:text-white border border-surface-border dark:border-dark-border">{message}</div>}

      {editingCategory || !editingCategory && catForm.id ? (
        <div className="bg-surface-primary dark:bg-dark-secondary p-6 rounded-2xl shadow-sm border border-surface-border dark:border-dark-border mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading font-bold text-xl dark:text-white">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
            <button onClick={handleCancel} className="p-2 text-ink-secondary hover:text-ink-primary dark:text-gray-400 dark:hover:text-white"><X size={20} /></button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-ink-secondary dark:text-gray-400 mb-1">ID (short, lowercase)</label>
              <input type="text" value={catForm.id} onChange={e => setCatForm({...catForm, id: e.target.value})} disabled={!!editingCategory} className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-lg px-4 py-2 dark:text-white disabled:opacity-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary dark:text-gray-400 mb-1">Label</label>
              <input type="text" value={catForm.label} onChange={e => setCatForm({...catForm, label: e.target.value})} className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-lg px-4 py-2 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary dark:text-gray-400 mb-1">Icon</label>
              <select value={catForm.icon} onChange={e => setCatForm({...catForm, icon: e.target.value})} className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-lg px-4 py-2 dark:text-white">
                {ICONS.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-secondary dark:text-gray-400 mb-1">Sort Order</label>
              <input type="number" value={catForm.order} onChange={e => setCatForm({...catForm, order: Number(e.target.value)})} className="w-full bg-surface-secondary dark:bg-dark-tertiary border border-surface-border dark:border-dark-border rounded-lg px-4 py-2 dark:text-white" />
            </div>
          </div>

          <h3 className="font-heading font-medium text-lg mb-2 dark:text-white mt-6 border-b border-surface-border dark:border-dark-border pb-2">Subcategories</h3>
          <div className="space-y-4 mb-4">
            {catForm.subCategories.map((sub, i) => (
              <div key={i} className="flex flex-col gap-2 p-3 bg-surface-secondary dark:bg-dark-tertiary rounded-lg border border-surface-border dark:border-dark-border relative">
                <button onClick={() => deleteSub(i)} className="absolute top-2 right-2 text-red-500 hover:text-red-700 bg-red-100 dark:bg-red-900/30 p-1 rounded-md"><Trash2 size={16} /></button>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <input placeholder="ID (e.g. bed)" value={sub.id} onChange={e => updateSub(i, 'id', e.target.value)} className="bg-surface-primary dark:bg-dark-secondary px-3 py-1.5 rounded-md dark:text-white border dark:border-dark-border text-sm" />
                  <input placeholder="Label (e.g. Iron Beds)" value={sub.label} onChange={e => updateSub(i, 'label', e.target.value)} className="bg-surface-primary dark:bg-dark-secondary px-3 py-1.5 rounded-md dark:text-white border dark:border-dark-border text-sm" />
                  <input placeholder="Type Code (e.g. b)" value={sub.typeCode} onChange={e => updateSub(i, 'typeCode', e.target.value)} className="bg-surface-primary dark:bg-dark-secondary px-3 py-1.5 rounded-md dark:text-white border dark:border-dark-border text-sm" />
                  <input placeholder="Weight Types (comma sep)" value={sub.weightTypes?.join(', ') || ''} onChange={e => updateSub(i, 'weightTypes', e.target.value.split(',').map(s=>s.trim()).filter(Boolean))} className="bg-surface-primary dark:bg-dark-secondary px-3 py-1.5 rounded-md dark:text-white border dark:border-dark-border text-sm" title="e.g. Light, Medium, Heavy" />
                </div>
              </div>
            ))}
          </div>
          <button onClick={addSub} className="flex justify-center w-full py-2 border-2 border-dashed border-surface-border dark:border-dark-border rounded-lg text-ink-secondary hover:text-brand-500 hover:border-brand-500 text-sm mb-6"><Plus size={16} className="mr-1"/> Add Subcategory</button>

          <button onClick={saveCategory} disabled={loading} className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 rounded-xl flex justify-center items-center gap-2">
            <Save size={18} /> {loading ? 'Saving...' : 'Save Category'}
          </button>
        </div>
      ) : (
        <div className="flex gap-4 mb-6">
          <button onClick={() => setCatForm({ id: '', label: '', icon: 'grid', order: categories.length, subCategories: [] })} className="flex-1 bg-surface-secondary dark:bg-dark-tertiary border-2 border-dashed border-surface-border dark:border-dark-border text-ink-primary dark:text-white hover:text-brand-500 hover:border-brand-500 py-4 rounded-2xl flex items-center justify-center font-medium transition-colors">
            <Plus size={20} className="mr-2" /> Create New Category
          </button>
          
          <button onClick={handleReset} disabled={loading} className="px-6 bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20 text-red-500 dark:text-red-400 border border-red-200 dark:border-red-900/50 py-4 rounded-2xl flex flex-col items-center justify-center font-medium transition-colors">
            <RotateCcw size={20} className="mb-1" />
            <span className="text-xs">Reset All</span>
          </button>
        </div>
      )}

      {/* Category List */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-surface-primary dark:bg-dark-secondary p-4 rounded-xl border border-surface-border dark:border-dark-border flex items-center justify-between">
            <div>
              <h3 className="font-heading font-bold text-lg dark:text-white">{cat.label} <span className="text-xs text-brand-500 ml-2 font-mono">order: {cat.order}</span></h3>
              <p className="text-sm text-ink-secondary dark:text-gray-400 mt-1">{cat.subCategories?.length || 0} subcategories</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(cat)} className="p-2 bg-surface-secondary dark:bg-dark-tertiary rounded-lg text-ink-primary dark:text-white hover:text-brand-500"><Edit2 size={18} /></button>
              <button onClick={() => handleDelete(cat.id)} className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-500 hover:text-red-700"><Trash2 size={18} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
