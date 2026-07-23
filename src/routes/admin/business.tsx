import { createFileRoute } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useState, useEffect } from 'react';

export const Route = createFileRoute('/admin/business')({
  component: BusinessPage,
});

function BusinessPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'business');
    setBusinesses(data || []);
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    await supabase.from('profiles').update({ status: newStatus }).eq('id', id);
    fetchBusinesses();
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Business Accounts</h1>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {businesses.map((biz) => (
                <tr key={biz.id} className="border-b">
                  <td className="py-2">{biz.full_name || 'N/A'}</td>
                  <td className="py-2">{biz.email}</td>
                  <td className="py-2">
                    <span className={`px-2 py-1 rounded text-xs ${biz.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {biz.status || 'pending'}
                    </span>
                  </td>
                  <td className="py-2 flex gap-2">
                    <button
                      onClick={() => handleToggleStatus(biz.id, biz.status)}
                      className={`px-3 py-1 rounded text-white text-sm ${biz.status === 'active' ? 'bg-yellow-500' : 'bg-green-500'}`}
                    >
                      {biz.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}