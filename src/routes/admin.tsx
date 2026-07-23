import React from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// ERROR BOUNDARY
// ============================================================
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-10 text-center bg-[#050505] text-white min-h-screen">
          <h1 className="text-2xl font-bold text-red-500">Something went wrong</h1>
          <p className="text-muted-foreground mt-2">{this.state.error?.message || "Unknown error"}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-primary text-white px-6 py-2 rounded-lg"
          >
            Refresh
          </button>
          <button 
            onClick={() => window.location.href = "/"} 
            className="mt-4 ml-3 bg-gray-700 text-white px-6 py-2 rounded-lg"
          >
            Go Home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================
// ROUTE PROTECTION
// ============================================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Please login first");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Unauthorized Access");
    return { user };
  },
  component: () => (
    <ErrorBoundary>
      <AdminDashboard />
    </ErrorBoundary>
  ),
});

// ============================================================
// MAIN DASHBOARD
// ============================================================
function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "fa-chart-line" },
    { id: "videos", label: "Manage Videos", icon: "fa-video" },
    { id: "dadaz", label: "Manage Dadaz", icon: "fa-user-check" },
    { id: "groups", label: "Manage Groups", icon: "fa-users" },
    { id: "redeem", label: "Redeem Codes", icon: "fa-gift" },
    { id: "settings", label: "App Settings", icon: "fa-cog" },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans">
      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/5 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={toggleSidebar} className="p-2 bg-white/5 rounded-lg text-primary">
            <i className={`fas ${isSidebarOpen ? "fa-times" : "fa-bars"} text-lg`}></i>
          </button>
          <span className="font-black italic text-sm tracking-tighter uppercase">Admin Panel</span>
        </div>
        <button onClick={() => navigate({ to: "/" })} className="text-xs font-bold text-muted-foreground">
          <i className="fas fa-times"></i>
        </button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-50 w-64 h-full bg-[#111] border-r border-white/5 transform transition-transform duration-300
        ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
      `}>
        <div className="p-6 border-b border-white/5 hidden md:block">
          <h1 className="text-xl font-black italic tracking-tighter text-transparent bg-clip-text bg-[image:var(--gradient-primary)]">UTAMU PORI</h1>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Super Administrator</p>
        </div>
        
        <nav className="p-4 space-y-1.5 mt-16 md:mt-0">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all
                ${activeTab === item.id ? "bg-primary text-white shadow-[0_0_20px_rgba(254,44,85,0.3)]" : "text-muted-foreground hover:bg-white/5"}
              `}
            >
              <i className={`fas ${item.icon} text-lg`}></i>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
          <button 
            onClick={() => supabase.auth.signOut().then(() => navigate({to: '/auth'}))} 
            className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all"
          >
            <i className="fas fa-sign-out-alt"></i> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 w-full p-4 md:p-10 mt-16 md:mt-0 overflow-x-hidden">
        <header className="mb-8 hidden md:block">
          <h2 className="text-3xl font-black">{menuItems.find(m => m.id === activeTab)?.label}</h2>
          <p className="text-muted-foreground text-sm">Welcome back, Admin.</p>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {activeTab === "dashboard" && <DashboardContent />}
          {activeTab === "videos" && <VideosContent />}
          {activeTab === "dadaz" && <DadazContent />}
          {activeTab === "groups" && <GroupsContent />}
          {activeTab === "redeem" && <RedeemContent />}
          {activeTab === "settings" && <SettingsContent />}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// 1. DASHBOARD
// ============================================================
function DashboardContent() {
  const [stats, setStats] = useState({ users: 0, vids: 0, groups: 0, dadaz: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError("");
        const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
        const { count: g } = await supabase.from("groups").select("*", { count: "exact", head: true });
        const { count: d } = await supabase.from("dadaz_profiles").select("*", { count: "exact", head: true });
        setStats({ users: u || 0, vids: v || 0, groups: g || 0, dadaz: d || 0 });
      } catch (err: any) {
        setError(err.message || "Failed to load stats");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  const cards = [
    { label: "Total Users", value: stats.users, icon: "fa-users", color: "text-blue-400" },
    { label: "Total Videos", value: stats.vids, icon: "fa-video", color: "text-primary" },
    { label: "Total Groups", value: stats.groups, icon: "fa-users", color: "text-secondary" },
    { label: "Total Dadaz", value: stats.dadaz, icon: "fa-user-check", color: "text-purple-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
      {cards.map((c, i) => (
        <div key={i} className="bg-[#111] p-5 rounded-3xl border border-white/5 shadow-xl">
          <i className={`fas ${c.icon} ${c.color} text-2xl mb-3`}></i>
          <p className="text-2xl font-black">{c.value}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 2. MANAGE VIDEOS (simplified, no CRUD yet)
// ============================================================
function VideosContent() {
  const [vids, setVids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchVids = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await supabase
        .from("videos")
        .select("*")
        .order("created_at", { ascending: false });
      setVids(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVids(); }, []);

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div>
      <p className="text-muted-foreground mb-4">Total: {vids.length} videos</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] rounded-3xl border border-white/5 p-4">
            <h4 className="font-bold truncate">{v.title}</h4>
            <p className="text-xs text-muted-foreground">{v.views_count} views</p>
            <p className="text-xs text-primary">{v.price_tsh / 100} SQ</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 3. MANAGE DADAZ
// ============================================================
function DadazContent() {
  const [dadaz, setDadaz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDadaz = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await supabase.from("dadaz_profiles").select("*").order("created_at", { ascending: false });
      setDadaz(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDadaz(); }, []);

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div>
      <p className="text-muted-foreground mb-4">Total: {dadaz.length} profiles</p>
      <div className="space-y-3">
        {dadaz.map(d => (
          <div key={d.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center gap-4">
            <img src={d.avatar_url || "https://via.placeholder.com/100"} className="w-12 h-12 rounded-full object-cover" />
            <div>
              <h4 className="font-bold">@{d.username}</h4>
              <p className="text-xs text-muted-foreground">{d.location || "TZ"}</p>
            </div>
            <span className={`px-2 py-1 rounded-full text-[10px] ${d.is_admin_approved ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              {d.is_admin_approved ? "Verified" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 4. MANAGE GROUPS
// ============================================================
function GroupsContent() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
      setGroups(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div>
      <p className="text-muted-foreground mb-4">Total: {groups.length} groups</p>
      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
            <div>
              <h4 className="font-bold">{g.name}</h4>
              <p className="text-xs text-muted-foreground truncate">{g.link}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 5. REDEEM CODES
// ============================================================
function RedeemContent() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchCodes = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await supabase.from("redeem_links").select("*").order("created_at", { ascending: false });
      setCodes(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div>
      <p className="text-muted-foreground mb-4">Total: {codes.length} codes</p>
      <div className="space-y-2">
        {codes.map(c => (
          <div key={c.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
            <span className="font-mono text-primary font-bold">{c.code}</span>
            <span>{c.coins_sq} SQ</span>
            <span className="text-xs text-muted-foreground">{c.uses_count}/{c.max_uses}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 6. APP SETTINGS
// ============================================================
function SettingsContent() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError("");
        const { data } = await supabase.from("app_settings").select("*");
        const s: any = {};
        data?.forEach(item => s[item.key] = item.value);
        setSettings(s);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;
  if (error) return <div className="text-red-500 p-4">Error: {error}</div>;

  return (
    <div className="bg-[#111] p-6 rounded-3xl border border-white/5 max-w-2xl space-y-4">
      <div>
        <label className="block text-xs text-muted-foreground">SQ to TSh Rate</label>
        <div className="flex gap-2 mt-1">
          <input 
            value={settings.sq_to_tsh || "100"} 
            onChange={(e) => setSettings({...settings, sq_to_tsh: e.target.value})} 
            className="flex-1 bg-black/50 border border-white/10 p-3 rounded-2xl"
          />
          <button 
            onClick={async () => {
              const { error } = await supabase.from("app_settings").upsert({ key: "sq_to_tsh", value: settings.sq_to_tsh });
              if (error) alert(error.message);
              else alert("Updated!");
            }} 
            className="bg-white text-black px-4 rounded-2xl font-bold"
          >
            Save
          </button>
        </div>
      </div>
      {/* Add other settings similarly */}
    </div>
  );
}