import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");
    const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
    if (adminEmail && user.email === adminEmail) {
      await supabase.from("profiles").upsert({ id: user.id, role: "admin" }, { onConflict: "id" });
    }
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Admin access required");
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r p-4">
        <h1 className="text-xl font-bold text-purple-600">Admin</h1>
        <p className="text-xs text-gray-500">{user?.email}</p>
        <nav className="mt-4 space-y-1">
          {["dashboard", "users", "videos", "groups", "business"].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`w-full text-left px-3 py-2 rounded ${activeTab === tab ? "bg-purple-100" : "hover:bg-gray-100"}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>
        <button onClick={signOut} className="mt-4 text-red-500">Sign Out</button>
      </aside>
      <main className="flex-1 p-6">
        {activeTab === "dashboard" && <Dashboard />}
        {activeTab === "users" && <Users />}
        {activeTab === "videos" && <Videos />}
        {activeTab === "groups" && <Groups />}
        {activeTab === "business" && <Business />}
      </main>
    </div>
  );
}

function Dashboard() {
  const [stats, setStats] = useState({ users: 0, videos: 0 });
  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("videos").select("*", { count: "exact", head: true }),
    ]).then(([users, videos]) => setStats({ users: users.count || 0, videos: videos.count || 0 }));
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold">Dashboard</h2>
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white p-4 rounded shadow"><p className="text-2xl font-bold">{stats.users}</p><p>Users</p></div>
        <div className="bg-white p-4 rounded shadow"><p className="text-2xl font-bold">{stats.videos}</p><p>Videos</p></div>
      </div>
    </div>
  );
}

function Users() {
  const [users, setUsers] = useState([]);
  useEffect(() => {
    supabase.from("profiles").select("*").then(({ data }) => setUsers(data || []));
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold">Users</h2>
      <table className="w-full mt-4 bg-white rounded shadow">
        <thead><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Role</th></tr></thead>
        <tbody>
          {users.map(u => (
            <tr key={u.id} className="border-t"><td className="p-2">{u.full_name || u.username}</td><td className="p-2">{u.email}</td><td className="p-2">{u.role}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Videos() {
  const [videos, setVideos] = useState([]);
  useEffect(() => {
    supabase.from("videos").select("*").then(({ data }) => setVideos(data || []));
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold">Videos</h2>
      <table className="w-full mt-4 bg-white rounded shadow">
        <thead><tr><th className="p-2">Title</th><th className="p-2">Price (SQ)</th><th className="p-2">Status</th></tr></thead>
        <tbody>
          {videos.map(v => (
            <tr key={v.id} className="border-t"><td className="p-2">{v.title}</td><td className="p-2">{v.price_sq}</td><td className="p-2">{v.status}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Groups() {
  const [groups, setGroups] = useState([]);
  useEffect(() => {
    supabase.from("groups").select("*").then(({ data }) => setGroups(data || []));
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold">Groups</h2>
      <table className="w-full mt-4 bg-white rounded shadow">
        <thead><tr><th className="p-2">Name</th><th className="p-2">Price (SQ)</th><th className="p-2">Members</th></tr></thead>
        <tbody>
          {groups.map(g => (
            <tr key={g.id} className="border-t"><td className="p-2">{g.name}</td><td className="p-2">{g.price_sq}</td><td className="p-2">{g.members}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Business() {
  const [businesses, setBusinesses] = useState([]);
  useEffect(() => {
    supabase.from("profiles").select("*").eq("role", "business").then(({ data }) => setBusinesses(data || []));
  }, []);
  return (
    <div>
      <h2 className="text-2xl font-bold">Business (Dadaz)</h2>
      <table className="w-full mt-4 bg-white rounded shadow">
        <thead><tr><th className="p-2">Name</th><th className="p-2">Email</th><th className="p-2">Status</th></tr></thead>
        <tbody>
          {businesses.map(b => (
            <tr key={b.id} className="border-t"><td className="p-2">{b.full_name}</td><td className="p-2">{b.email}</td><td className="p-2">{b.is_approved ? "✅" : "⏳"}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}