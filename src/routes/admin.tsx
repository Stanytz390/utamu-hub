import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

// ============================================================
// ROUTE – Disable SSR to avoid server-side auth issues
// ============================================================
export const Route = createFileRoute("/admin")({
  // ✅ ssr: false ensures the page only renders on the client
  ssr: false,
  component: AdminDashboard,
});

// ============================================================
// ADMIN DASHBOARD – Full client-side
// ============================================================
function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ users: 0, videos: 0, groups: 0, dadaz: 0 });

  // Check auth and admin role on client
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate({ to: "/auth" });
          return;
        }

        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", user.id)
          .eq("role", "admin")
          .maybeSingle();

        if (!roleData) {
          alert("You are not an admin.");
          navigate({ to: "/" });
          return;
        }

        setIsAdmin(true);
        // Fetch stats
        const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
        const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
        const { count: g } = await supabase.from("groups").select("*", { count: "exact", head: true });
        const { count: d } = await supabase.from("dadaz_profiles").select("*", { count: "exact", head: true });
        setStats({ users: u || 0, videos: v || 0, groups: g || 0, dadaz: d || 0 });
      } catch (error) {
        console.error("Auth check error:", error);
        alert("An error occurred. Please try again.");
        navigate({ to: "/" });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "fa-chart-line" },
    { id: "videos", label: "Manage Videos", icon: "fa-video" },
    { id: "dadaz", label: "Manage Dadaz", icon: "fa-user-check" },
    { id: "groups", label: "Manage Groups", icon: "fa-users" },
    { id: "redeem", label: "Redeem Codes", icon: "fa-gift" },
    { id: "settings", label: "App Settings", icon: "fa-cog" },
  ];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#050505] text-white">
        <div className="text-center">
          <i className="fas fa-spinner fa-spin text-4xl text-primary"></i>
          <p className="mt-4 text-muted-foreground">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#050505] text-white">
        <div className="text-center">
          <i className="fas fa-exclamation-triangle text-4xl text-red-500"></i>
          <p className="mt-4 text-xl font-bold">Access Denied</p>
          <p className="text-muted-foreground">You are not authorized to view this page.</p>
          <button onClick={() => navigate({ to: "/" })} className="mt-4 bg-primary px-6 py-2 rounded-lg">
            Go Home
          </button>
        </div>
      </div>
    );
  }

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

        <>
          {activeTab === "dashboard" && <DashboardContent stats={stats} />}
          {activeTab === "videos" && <VideosContent />}
          {activeTab === "dadaz" && <DadazContent />}
          {activeTab === "groups" && <GroupsContent />}
          {activeTab === "redeem" && <RedeemContent />}
          {activeTab === "settings" && <SettingsContent />}
        </>
      </main>
    </div>
  );
}

// ============================================================
// 1. DASHBOARD
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

// ============================================================
// 2. MANAGE VIDEOS
// ============================================================
function VideosContent() {
  const [vids, setVids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", video_url: "", thumbnail_url: "", price_sq: 0 });

  const fetchVids = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
      setVids(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVids(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    try {
      const payload = {
        title: form.title,
        video_url: form.video_url,
        thumbnail_url: form.thumbnail_url || null,
        price_tsh: form.price_sq * 100,
        is_published: true,
        category_slug: "utamu",
      };
      const { error } = await supabase.from("videos").insert([payload]);
      if (error) throw error;
      alert("Video Added!");
      setShowAdd(false);
      setForm({ title: "", video_url: "", thumbnail_url: "", price_sq: 0 });
      fetchVids();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteVideo = async (id: string) => {
    if (!confirm("Delete this video?")) return;
    try {
      await supabase.from("videos").delete().eq("id", id);
      alert("Video deleted");
      fetchVids();
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
          <input placeholder="Video MP4 Link" required className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail Image Link" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <input type="number" placeholder="Price SQ (0 for Free)" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-tighter">Publish Now</button>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] rounded-3xl border border-white/5 overflow-hidden group">
            <div className="relative aspect-video">
              <img src={v.thumbnail_url || "https://via.placeholder.com/300x200"} className="w-full h-full object-cover" />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg text-[10px] font-bold">{v.price_tsh / 100} SQ</div>
            </div>
            <div className="p-4 flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-sm truncate">{v.title}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{v.views_count || 0} Views</p>
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

// ============================================================
// 3. MANAGE DADAZ
// ============================================================
function DadazContent() {
  const [dadaz, setDadaz] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDadaz = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("dadaz_profiles").select("*").order("created_at", { ascending: false });
      setDadaz(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDadaz(); }, []);

  const toggleApproval = async (id: string, current: boolean) => {
    try {
      await supabase.from("dadaz_profiles").update({ is_admin_approved: !current }).eq("id", id);
      alert(!current ? "Approved!" : "Unapproved");
      fetchDadaz();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteDadaz = async (id: string) => {
    if (!confirm("Delete this profile?")) return;
    try {
      await supabase.from("dadaz_profiles").delete().eq("id", id);
      alert("Deleted");
      fetchDadaz();
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

// ============================================================
// 4. MANAGE GROUPS
// ============================================================
function GroupsContent() {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", link: "", description: "" });

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
      setGroups(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchGroups(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("groups").insert([{ 
        name: form.name, 
        link: form.link, 
        description: form.description, 
        is_published: true,
        price_sq: 0 
      }]);
      if (error) throw error;
      alert("Group Added!");
      setShowAdd(false);
      setForm({ name: "", link: "", description: "" });
      fetchGroups();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Delete this group?")) return;
    try {
      await supabase.from("groups").delete().eq("id", id);
      alert("Deleted");
      fetchGroups();
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
          <textarea placeholder="Description" className="w-full bg-black/50 border border-white/10 p-4 rounded-2xl text-sm" onChange={e => setForm({...form, description: e.target.value})} />
          <button type="submit" className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-tighter">Save Group</button>
        </form>
      )}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold truncate">{g.name}</h4>
              <p className="text-[10px] text-secondary font-black truncate uppercase">{g.link}</p>
            </div>
            <button onClick={() => deleteGroup(g.id)} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
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
  const [amt, setAmt] = useState(10);
  const [uses, setUses] = useState(1);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const { data } = await supabase.from("redeem_links").select("*").order("created_at", { ascending: false });
      setCodes(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCodes(); }, []);

  const generate = async () => {
    try {
      const code = "UTAMU-" + Math.random().toString(36).substring(2, 7).toUpperCase();
      const { error } = await supabase.from("redeem_links").insert({
        code, coins_sq: amt, max_uses: uses, is_active: true
      });
      if (error) throw error;
      alert("Code Created!");
      fetchCodes();
    } catch (err: any) {
      alert("Error: " + err.message);
    }
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    try {
      await supabase.from("redeem_links").delete().eq("id", id);
      alert("Deleted");
      fetchCodes();
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
            <tr>
              <th className="p-4">CODE</th>
              <th className="p-4">SQ</th>
              <th className="p-4">USES</th>
              <th className="p-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {codes.map(c => (
              <tr key={c.id}>
                <td className="p-4 font-mono text-primary font-bold">{c.code}</td>
                <td className="p-4 font-black">{c.coins_sq}</td>
                <td className="p-4 text-muted-foreground">{c.uses_count}/{c.max_uses}</td>
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

// ============================================================
// 6. APP SETTINGS
// ============================================================
function SettingsContent() {
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        const { data } = await supabase.from("app_settings").select("*");
        const s: any = {};
        data?.forEach(item => s[item.key] = item.value);
        setSettings(s);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const save = async (key: string, value: any) => {
    try {
      const { error } = await supabase.from("app_settings").upsert({ key, value });
      if (error) throw error;
      alert(`Updated ${key}!`);
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