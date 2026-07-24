import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { useEffect, useState } from "react";

const ADMIN_PASSWORD = "STANY#MINES";

// ============================================================
// 1. SERVER FUNCTIONS (bypass RLS)
// ============================================================

// Fetch stats
export const fetchStatsFn = createServerFn({
  type: "query",
  handler: async () => {
    const { count: users } = await supabaseAdmin.from("profiles").select("*", { count: "exact", head: true });
    const { count: videos } = await supabaseAdmin.from("videos").select("*", { count: "exact", head: true });
    const { count: groups } = await supabaseAdmin.from("groups").select("*", { count: "exact", head: true });
    const { count: dadaz } = await supabaseAdmin.from("dadaz_profiles").select("*", { count: "exact", head: true });
    return { users: users || 0, videos: videos || 0, groups: groups || 0, dadaz: dadaz || 0 };
  },
});

// Videos
export const getVideosFn = createServerFn({
  type: "query",
  handler: async () => {
    const { data } = await supabaseAdmin.from("videos").select("*, categories(id, name)").order("created_at", { ascending: false });
    return data || [];
  },
});

export const addVideoFn = createServerFn({
  type: "mutation",
  handler: async (payload: any) => {
    const { error } = await supabaseAdmin.from("videos").insert([payload]);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

export const deleteVideoFn = createServerFn({
  type: "mutation",
  handler: async (id: string) => {
    const { error } = await supabaseAdmin.from("videos").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

// Groups
export const getGroupsFn = createServerFn({
  type: "query",
  handler: async () => {
    const { data } = await supabaseAdmin.from("groups").select("*").order("created_at", { ascending: false });
    return data || [];
  },
});

export const addGroupFn = createServerFn({
  type: "mutation",
  handler: async (payload: any) => {
    const { error } = await supabaseAdmin.from("groups").insert([payload]);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

export const deleteGroupFn = createServerFn({
  type: "mutation",
  handler: async (id: string) => {
    const { error } = await supabaseAdmin.from("groups").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

// Dadaz
export const getDadazFn = createServerFn({
  type: "query",
  handler: async () => {
    const { data } = await supabaseAdmin.from("dadaz_profiles").select("*").order("created_at", { ascending: false });
    return data || [];
  },
});

export const toggleDadazApprovalFn = createServerFn({
  type: "mutation",
  handler: async ({ id, current }: { id: string; current: boolean }) => {
    const { error } = await supabaseAdmin.from("dadaz_profiles").update({ is_admin_approved: !current }).eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

export const deleteDadazFn = createServerFn({
  type: "mutation",
  handler: async (id: string) => {
    const { error } = await supabaseAdmin.from("dadaz_profiles").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

// Redeem
export const getRedeemFn = createServerFn({
  type: "query",
  handler: async () => {
    const { data } = await supabaseAdmin.from("redeem_links").select("*").order("created_at", { ascending: false });
    return data || [];
  },
});

export const addRedeemFn = createServerFn({
  type: "mutation",
  handler: async (payload: any) => {
    const { error } = await supabaseAdmin.from("redeem_links").insert([payload]);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

export const deleteRedeemFn = createServerFn({
  type: "mutation",
  handler: async (id: string) => {
    const { error } = await supabaseAdmin.from("redeem_links").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

// Categories
export const getCategoriesFn = createServerFn({
  type: "query",
  handler: async () => {
    const { data } = await supabaseAdmin.from("categories").select("id, name").order("created_at");
    return data || [];
  },
});

// Settings
export const getSettingsFn = createServerFn({
  type: "query",
  handler: async () => {
    const { data } = await supabaseAdmin.from("app_settings").select("*");
    const settings: Record<string, string> = {};
    data?.forEach((item) => (settings[item.key] = item.value));
    return settings;
  },
});

export const updateSettingFn = createServerFn({
  type: "mutation",
  handler: async ({ key, value }: { key: string; value: any }) => {
    const { error } = await supabaseAdmin.from("app_settings").upsert({ key, value });
    if (error) throw new Error(error.message);
    return { success: true };
  },
});

// ============================================================
// 2. ROUTE – Client-side only (no SSR)
// ============================================================
export const Route = createFileRoute("/admin")({
  ssr: false,
  component: AdminDashboard,
});

// ============================================================
// 3. ADMIN DASHBOARD (UI)
// ============================================================
function AdminDashboard() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ users: 0, videos: 0, groups: 0, dadaz: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_authenticated") === "true";
    setAuthenticated(isAuth);
    if (isAuth) fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const result = await fetchStatsFn();
      setStats(result);
    } catch (e) {
      console.error("Stats error:", e);
    } finally {
      setLoadingStats(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      localStorage.setItem("admin_authenticated", "true");
      setAuthenticated(true);
      setError("");
      fetchStats();
    } else {
      setError("Incorrect password.");
    }
  };

  const signOut = () => {
    localStorage.removeItem("admin_authenticated");
    setAuthenticated(false);
    navigate({ to: "/" });
  };

  if (!authenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#050505] px-4">
        <div className="max-w-md w-full bg-[#111] rounded-3xl border border-white/5 p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
              <i className="fas fa-lock text-2xl text-primary-foreground"></i>
            </div>
            <h1 className="text-2xl font-black bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
              Admin Access
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the admin password</p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-black/50 p-4 text-white outline-none focus:border-primary"
              autoFocus
            />
            {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground shadow-[var(--shadow-neon)] hover:opacity-90 transition"
            >
              Unlock
            </button>
          </form>
        </div>
      </div>
    );
  }

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

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/80 z-40 md:hidden" onClick={toggleSidebar} />
      )}

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
          <button onClick={signOut} className="flex items-center gap-3 w-full px-4 py-3 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-2xl transition-all">
            <i className="fas fa-sign-out-alt"></i> Lock Screen
          </button>
        </div>
      </aside>

      <main className="flex-1 w-full p-4 md:p-10 mt-16 md:mt-0 overflow-x-hidden">
        <header className="mb-8 hidden md:block">
          <h2 className="text-3xl font-black">{menuItems.find(m => m.id === activeTab)?.label}</h2>
          <p className="text-muted-foreground text-sm">Welcome back, Admin.</p>
        </header>

        {loadingStats ? (
          <div className="flex justify-center items-center h-40">
            <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && <DashboardContent stats={stats} />}
            {activeTab === "videos" && <VideosContent />}
            {activeTab === "dadaz" && <DadazContent />}
            {activeTab === "groups" && <GroupsContent />}
            {activeTab === "redeem" && <RedeemContent />}
            {activeTab === "settings" && <SettingsContent />}
          </>
        )}
      </main>
    </div>
  );
}

// ============================================================
// 4. UI COMPONENTS
// ============================================================

function DashboardContent({ stats }: { stats: any }) {
  const cards = [
    { label: "Total Users", value: stats.users, icon: "fa-users", color: "text-blue-400" },
    { label: "Total Videos", value: stats.videos, icon: "fa-video", color: "text-primary" },
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

function VideosContent() {
  const [vids, setVids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    title: "",
    video_url: "",
    thumbnail: "",
    price_sq: 0,
    category_id: "",
    status: "available",
    duration: "",
  });
  const [categories, setCategories] = useState<any[]>([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [videosData, categoriesData] = await Promise.all([getVideosFn(), getCategoriesFn()]);
      setVids(videosData);
      setCategories(categoriesData);
    } catch (e) {
      console.error(e);
      alert("Failed to load videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        video_url: form.video_url,
        thumbnail: form.thumbnail || null,
        price_sq: Number(form.price_sq),
        status: form.status || "available",
        is_published: true,
        category_id: form.category_id || null,
        duration: form.duration || null,
      };
      await addVideoFn({ data: payload });
      alert("Video Added!");
      setShowAdd(false);
      setForm({ title: "", video_url: "", thumbnail: "", price_sq: 0, category_id: "", status: "available", duration: "" });
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      await deleteVideoFn({ data: id });
      alert("Deleted");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="w-full md:w-auto bg-primary py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-2 shadow-neon transition-transform active:scale-95">
        {showAdd ? <i className="fas fa-times"></i> : <i className="fas fa-plus"></i>} {showAdd ? "CANCEL" : "ADD NEW VIDEO"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-3xl border border-primary/20 space-y-4 max-w-2xl">
          <input placeholder="Title" required className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Video URL" required className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail URL (optional)" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, thumbnail: e.target.value})} />
          <input type="number" placeholder="Price SQ (0 for Free)" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          <input placeholder="Duration (e.g. 3:45)" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, duration: e.target.value})} />
          <select className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
            <option value="">Select Category</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="available">Available</option>
            <option value="pending">Pending</option>
          </select>
          <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-tighter">Publish Now</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden group">
            <div className="relative aspect-video">
              <img src={v.thumbnail || "https://via.placeholder.com/300x200"} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold">{v.price_sq} SQ</div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{v.title}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{v.views || 0} Views</p>
                <p className="text-[10px] text-primary">{v.categories?.name || "No category"}</p>
              </div>
              <button onClick={() => deleteVideo(v.id)} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition-colors">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DadazContent() {
  const [dadaz, setDadaz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getDadazFn();
      setDadaz(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load dadaz");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleApproval = async (id: string, current: boolean) => {
    try {
      await toggleDadazApprovalFn({ data: { id, current } });
      alert(!current ? "Approved!" : "Unapproved");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteDadaz = async (id: string) => {
    if (!confirm("Delete this profile?")) return;
    try {
      await deleteDadazFn({ data: id });
      alert("Deleted");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;

  return (
    <div>
      <p className="text-muted-foreground mb-4">Total: {dadaz.length} profiles</p>
      <div className="space-y-3">
        {dadaz.map(d => (
          <div key={d.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col sm:flex-row gap-4 items-center">
            <img src={d.avatar_url || "https://via.placeholder.com/100"} className="w-16 h-16 rounded-full border-2 border-primary object-cover" />
            <div className="flex-1 text-center sm:text-left min-w-0">
              <h4 className="font-black text-lg italic">@{d.username}</h4>
              <p className="text-xs text-muted-foreground truncate">{d.bio || "No bio set"}</p>
              <div className="mt-2 flex flex-wrap justify-center sm:justify-start gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${d.is_admin_approved ? "bg-green-500/20 text-green-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                  {d.is_admin_approved ? "Verified" : "Pending"}
                </span>
                <span className="bg-white/5 px-2 py-0.5 rounded-full text-[9px] font-bold text-muted-foreground uppercase">{d.location || "TZ"}</span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={() => toggleApproval(d.id, d.is_admin_approved)} className={`flex-1 sm:flex-initial p-3 rounded-2xl transition-all ${d.is_admin_approved ? "bg-red-500/10 text-red-400" : "bg-green-500/20 text-green-400"}`}>
                {d.is_admin_approved ? <i className="fas fa-times"></i> : <i className="fas fa-check"></i>}
              </button>
              <button onClick={() => deleteDadaz(d.id)} className="flex-1 sm:flex-initial p-3 bg-red-500/10 text-red-500 rounded-2xl">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupsContent() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", link: "", description: "", logo_url: "", price_sq: 0 });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getGroupsFn();
      setGroups(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        name: form.name,
        link: form.link,
        description: form.description || null,
        logo_url: form.logo_url || null,
        price_sq: Number(form.price_sq),
        is_published: true,
      };
      await addGroupFn({ data: payload });
      alert("Group Added!");
      setShowAdd(false);
      setForm({ name: "", link: "", description: "", logo_url: "", price_sq: 0 });
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Delete this group?")) return;
    try {
      await deleteGroupFn({ data: id });
      alert("Deleted");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="w-full md:w-auto bg-secondary text-black py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-all">
        {showAdd ? <i className="fas fa-times"></i> : <i className="fas fa-plus"></i>} {showAdd ? "CANCEL" : "ADD NEW GROUP"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-3xl border border-secondary/20 space-y-4 max-w-2xl">
          <input placeholder="Group Name" required className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="WhatsApp/Telegram Link" required className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, link: e.target.value})} />
          <input placeholder="Description" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, description: e.target.value})} />
          <input placeholder="Logo URL" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, logo_url: e.target.value})} />
          <input type="number" placeholder="Price SQ (0 for Free)" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-tighter">Save Group</button>
        </form>
      )}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold truncate">{g.name}</h4>
              <p className="text-[10px] text-secondary font-black truncate uppercase">{g.link}</p>
              <p className="text-[10px] text-muted-foreground">Price: {g.price_sq === 0 ? "Free" : `${g.price_sq} SQ`}</p>
            </div>
            <button onClick={() => deleteGroup(g.id)} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function RedeemContent() {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [amt, setAmt] = useState(10);
  const [uses, setUses] = useState(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getRedeemFn();
      setCodes(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load redeem codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const generate = async () => {
    try {
      const code = "UTAMU-" + Math.random().toString(36).substring(2, 7).toUpperCase();
      const payload = {
        code,
        coins_sq: amt,
        max_uses: uses,
        is_active: true,
        used: 0,
        uses_count: 0,
      };
      await addRedeemFn({ data: payload });
      alert("Code Created!");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    try {
      await deleteRedeemFn({ data: id });
      alert("Deleted");
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;

  return (
    <div className="space-y-6">
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4 max-w-xl">
        <h3 className="font-black text-lg">Generate Voucher</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Coins (SQ)</label>
            <input type="number" value={amt} onChange={e => setAmt(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl mt-1" />
          </div>
          <div>
            <label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Max Uses</label>
            <input type="number" value={uses} onChange={e => setUses(Number(e.target.value))} className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl mt-1" />
          </div>
        </div>
        <button onClick={generate} className="w-full bg-primary py-4 rounded-2xl font-black shadow-neon">GENERATE CODE</button>
      </div>

      <div className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-white/5">
            <tr><th className="p-4">CODE</th><th className="p-4">SQ</th><th className="p-4">USES</th><th className="p-4"></th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {codes.map(c => (
              <tr key={c.id}>
                <td className="p-4 font-mono text-primary font-bold">{c.code}</td>
                <td className="p-4 font-black">{c.coins_sq}</td>
                <td className="p-4 text-muted-foreground">{c.used || 0} / {c.max_uses}</td>
                <td className="p-4 text-right">
                  <button onClick={() => deleteCode(c.id)} className="text-red-500"><i className="fas fa-trash"></i></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SettingsContent() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await getSettingsFn();
      setSettings(data);
    } catch (e) {
      console.error(e);
      alert("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const save = async (key: string, value: any) => {
    try {
      await updateSettingFn({ data: { key, value } });
      alert(`Updated ${key}!`);
      fetchData();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-40"><i className="fas fa-spinner fa-spin text-2xl text-primary"></i></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-6">
        <div>
          <label className="text-[10px] font-black uppercase text-primary ml-1 tracking-widest">SQ to TSh Rate (1 SQ = ? TSh)</label>
          <div className="flex gap-2 mt-2">
            <input value={settings.sq_to_tsh || "100"} onChange={e => setSettings({...settings, sq_to_tsh: e.target.value})} className="flex-1 bg-black/50 border border-white/10 p-4 rounded-2xl" />
            <button onClick={() => save("sq_to_tsh", settings.sq_to_tsh)} className="bg-white text-black px-6 rounded-2xl font-bold"><i className="fas fa-save"></i></button>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-secondary ml-1 tracking-widest">Support WhatsApp Number</label>
          <div className="flex gap-2 mt-2">
            <input value={settings.support_whatsapp || ""} onChange={e => setSettings({...settings, support_whatsapp: e.target.value})} placeholder="+255..." className="flex-1 bg-black/50 border border-white/10 p-4 rounded-2xl" />
            <button onClick={() => save("support_whatsapp", settings.support_whatsapp)} className="bg-white text-black px-6 rounded-2xl font-bold"><i className="fas fa-save"></i></button>
          </div>
        </div>
        
        <div>
          <label className="text-[10px] font-black uppercase text-purple-400 ml-1 tracking-widest">WhatsApp Channel Link</label>
          <div className="flex gap-2 mt-2">
            <input value={settings.whatsapp_channel || ""} onChange={e => setSettings({...settings, whatsapp_channel: e.target.value})} placeholder="https://chat.whatsapp..." className="flex-1 bg-black/50 border border-white/10 p-4 rounded-2xl" />
            <button onClick={() => save("whatsapp_channel", settings.whatsapp_channel)} className="bg-white text-black px-6 rounded-2xl font-bold"><i className="fas fa-save"></i></button>
          </div>
        </div>
      </div>
    </div>
  );
}