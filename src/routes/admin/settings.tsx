import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin/settings')({
  component: SettingsPage,
});

function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('app_settings').select('key, value');
    const obj: Record<string, string> = {};
    data?.forEach(item => { obj[item.key] = item.value; });
    setSettings(obj);
    setLoading(false);
  };

  const handleChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    for (const [key, value] of Object.entries(settings)) {
      await supabase
        .from('app_settings')
        .upsert({ key, value }, { onConflict: 'key' });
    }
    alert('Settings saved!');
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">App Settings</h1>
        <div className="max-w-2xl space-y-4">
          <div>
            <label className="block text-sm font-medium">SQ to TSh Rate</label>
            <input
              type="number"
              value={settings.sq_to_tsh || '100'}
              onChange={(e) => handleChange('sq_to_tsh', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Support WhatsApp Number</label>
            <input
              type="text"
              value={settings.support_whatsapp || ''}
              onChange={(e) => handleChange('support_whatsapp', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">WhatsApp Channel Link</label>
            <input
              type="text"
              value={settings.whatsapp_channel || ''}
              onChange={(e) => handleChange('whatsapp_channel', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Support Email</label>
            <input
              type="email"
              value={settings.support_email || ''}
              onChange={(e) => handleChange('support_email', e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <button onClick={handleSave} className="bg-blue-500 text-white px-6 py-2 rounded">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}