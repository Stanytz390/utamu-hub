import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin/groups')({
  component: GroupsPage,
});

function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([]);
  const [newGroup, setNewGroup] = useState('');
  const [videos, setVideos] = useState<any[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
    fetchVideos();
  }, []);

  const fetchGroups = async () => {
    const { data } = await supabase.from('groups').select('*').order('name');
    setGroups(data || []);
  };

  const fetchVideos = async () => {
    const { data } = await supabase.from('videos').select('id, title');
    setVideos(data || []);
  };

  const handleCreateGroup = async () => {
    if (!newGroup.trim()) return;
    const { data } = await supabase
      .from('groups')
      .insert({ name: newGroup.trim() })
      .select()
      .single();
    if (data) {
      // Add selected videos to group
      if (selectedVideos.length) {
        await supabase.from('group_videos').insert(
          selectedVideos.map(video_id => ({ group_id: data.id, video_id }))
        );
      }
      setNewGroup('');
      setSelectedVideos([]);
      fetchGroups();
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (!confirm('Delete this group?')) return;
    await supabase.from('groups').delete().eq('id', id);
    await supabase.from('group_videos').delete().eq('group_id', id);
    fetchGroups();
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Groups</h1>
        <div className="space-y-4 max-w-2xl">
          <div className="flex gap-2">
            <input
              value={newGroup}
              onChange={(e) => setNewGroup(e.target.value)}
              placeholder="New group name"
              className="flex-1 border rounded px-3 py-2"
            />
            <select
              multiple
              value={selectedVideos}
              onChange={(e) => setSelectedVideos(Array.from(e.target.selectedOptions, o => o.value))}
              className="border rounded px-3 py-2 w-48"
            >
              {videos.map(v => (
                <option key={v.id} value={v.id}>{v.title}</option>
              ))}
            </select>
            <button onClick={handleCreateGroup} className="bg-blue-500 text-white px-4 py-2 rounded">
              Create
            </button>
          </div>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li key={group.id} className="flex items-center justify-between border-b py-2">
                <span>{group.name}</span>
                <button onClick={() => handleDeleteGroup(group.id)} className="text-red-500">
                  Delete
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}