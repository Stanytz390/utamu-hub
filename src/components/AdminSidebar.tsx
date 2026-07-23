import { Link, useRouter } from '@tanstack/react-router';
import { supabase } from '@/integrations/supabase/client';

export function AdminSidebar() {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: '/' });
  };

  return (
    <div className="w-64 border-r p-4 bg-white min-h-screen">
      <h2 className="text-xl font-bold mb-6">Admin Panel</h2>
      <nav className="flex flex-col space-y-2">
        <Link to="/admin" className="p-2 rounded hover:bg-gray-100">Dashboard</Link>
        <Link to="/admin/categories" className="p-2 rounded hover:bg-gray-100">Categories</Link>
        <Link to="/admin/upload" className="p-2 rounded hover:bg-gray-100">Upload Video</Link>
        <Link to="/admin/groups" className="p-2 rounded hover:bg-gray-100">Groups</Link>
        <Link to="/admin/business" className="p-2 rounded hover:bg-gray-100">Business Accounts</Link>
        <Link to="/admin/settings" className="p-2 rounded hover:bg-gray-100">Settings</Link>
        <button onClick={handleLogout} className="p-2 rounded hover:bg-gray-100 text-red-500 text-left">
          Logout
        </button>
      </nav>
    </div>
  );
}