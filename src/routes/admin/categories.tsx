import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin/categories')({
  component: CategoriesPage,
});

function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('name');
    setCategories(data || []);
  };

  const handleAdd = async () => {
    if (!newCategory.trim()) return;
    await supabase.from('categories').insert({ name: newCategory.trim() });
    setNewCategory('');
    fetchCategories();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await supabase.from('categories').delete().eq('id', id);
    fetchCategories();
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    await supabase.from('categories').update({ name: editName.trim() }).eq('id', id);
    setEditingId(null);
    fetchCategories();
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Categories</h1>
        <div className="flex gap-2 mb-4">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name"
            className="flex-1 border rounded px-3 py-2"
          />
          <button onClick={handleAdd} className="bg-blue-500 text-white px-4 py-2 rounded">
            Add
          </button>
        </div>
        <ul className="space-y-2">
          {categories.map((cat) => (
            <li key={cat.id} className="flex items-center justify-between border-b py-2">
              {editingId === cat.id ? (
                <div className="flex gap-2">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="border rounded px-2 py-1"
                  />
                  <button onClick={() => handleUpdate(cat.id)} className="text-green-500">Save</button>
                  <button onClick={() => setEditingId(null)} className="text-gray-500">Cancel</button>
                </div>
              ) : (
                <>
                  <span>{cat.name}</span>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(cat.id); setEditName(cat.name); }} className="text-blue-500">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(cat.id)} className="text-red-500">
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}