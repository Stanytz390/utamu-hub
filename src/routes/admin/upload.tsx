import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin/upload')({
  component: UploadPage,
});

function UploadPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    price_sq: 0,
    status: 'pending',
    video_url: '',
    thumbnail: '',
    creator: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    supabase.from('categories').select('*').then(({ data }) => setCategories(data || []));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    const { error } = await supabase.from('videos').insert({
      ...form,
      price_sq: Number(form.price_sq),
      creator_id: (await supabase.auth.getUser()).data.user?.id,
    });
    if (error) alert('Error: ' + error.message);
    else {
      alert('Video uploaded successfully!');
      setForm({ title: '', description: '', category: '', price_sq: 0, status: 'pending', video_url: '', thumbnail: '', creator: '' });
    }
    setUploading(false);
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Upload Video</h1>
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          />
          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="w-full border rounded px-3 py-2"
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Price in SQ (0 for free)"
            value={form.price_sq}
            onChange={(e) => setForm({ ...form, price_sq: Number(e.target.value) })}
            className="w-full border rounded px-3 py-2"
          />
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full border rounded px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="available">Available</option>
          </select>
          <input
            placeholder="Video URL (YouTube or direct link)"
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <input
            placeholder="Thumbnail URL"
            value={form.thumbnail}
            onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <input
            placeholder="Creator Name"
            value={form.creator}
            onChange={(e) => setForm({ ...form, creator: e.target.value })}
            className="w-full border rounded px-3 py-2"
          />
          <button
            type="submit"
            disabled={uploading}
            className="bg-blue-500 text-white px-6 py-2 rounded disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </form>
      </div>
    </div>
  );
}