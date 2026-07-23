import { createFileRoute, redirect, Link } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';
import { AdminSidebar } from '@/components/AdminSidebar';
import { useEffect, useState } from 'react';

export const Route = createFileRoute('/admin')({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: '/auth' });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') throw redirect({ to: '/' });
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const [stats, setStats] = useState({
    videos: 0,
    users: 0,
    payments: 0,
    coins: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: videos }, { count: users }, { count: payments }, { data: coins }] = await Promise.all([
        supabase.from('videos').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('*', { count: 'exact', head: true }),
        supabase.from('coin_wallets').select('balance_sq'),
      ]);

      setStats({
        videos: videos || 0,
        users: users || 0,
        payments: payments || 0,
        coins: coins?.reduce((acc, w) => acc + (w.balance_sq || 0), 0) || 0,
      });
    };
    fetchStats();
  }, []);

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <div className="flex-1 p-6">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Videos" value={stats.videos} icon="🎬" />
          <StatCard title="Users" value={stats.users} icon="👤" />
          <StatCard title="Payments" value={stats.payments} icon="💰" />
          <StatCard title="Total Coins" value={stats.coins} icon="🪙" />
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string; value: number; icon: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <div className="text-2xl">{icon}</div>
      <div className="text-2xl font-bold mt-2">{value.toLocaleString()}</div>
      <div className="text-gray-500 text-sm">{title}</div>
    </div>
  );
}