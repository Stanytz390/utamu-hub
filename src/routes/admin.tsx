import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Video, Users, UserCheck, 
  Gift, Settings, Plus, Trash2, Menu, X, 
  CheckCircle, Save, Search, Coins, Globe, Shield
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ============================================================
// ROUTE GUARD
// ============================================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      console.warn("Access denied to non-admin");
      throw redirect({ to: "/" });
    }
    return { user };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "videos", label: "Utamu Videos", icon: Video },
    { id: "dadaz", label: "Dadaz Profiles", icon: UserCheck },
    { id: "groups", label: "Manage Groups", icon: Globe },
    { id: "redeem", label: "Redeem Codes", icon: Gift },
    { id: "settings", label: "App Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Toaster position="top-center" richColors />
      
      {/* Mobile Navbar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl text-primary shadow-lg">
          <Menu size={24} />
        </button>
        <span className="font-black italic tracking-tighter text-lg uppercase text-primary">ADMIN HUB</span>
        <div className="w-10" />
      </div>

      {/* Sidebar Responsive */}
      <aside className={`fixed md:relative z-[70] w-64 h-full bg-[#111] border-r border-white/5 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-8 border-b border-white/5 hidden md:block">
          <h1 className="text-2xl font-black italic text-primary tracking-tighter">UTAMU ADMIN</h1>
        </div>
        <nav className="p-4 space-y-1 mt-16 md:mt-0">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-primary text-white shadow-neon" : "text-muted-foreground hover:bg-white/5"}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 mt-16 md:mt-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === "dashboard" && <DashboardOverview />}
          {activeTab === "users" && <UsersManager />}
          {activeTab === "videos" && <VideosManager />}
          {activeTab === "dadaz" && <DadazManager />}
          {activeTab === "groups" && <GroupsManager />}
          {activeTab === "redeem" && <RedeemManager />}
          {activeTab === "settings" && <SettingsManager />}
        </div>
      </main>
    </div>
  );
}

// ============================================================
// 1. DASHBOARD OVERVIEW
// ============================================================
function DashboardOverview() {
  const [stats, setStats] = useState({ users: 0, vids: 0, groups: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
      const { count: g } = await supabase.from("groups").select("*", { count: "exact", head: true });
      setStats({ users: u || 0, vids: v || 0, groups: g || 0 });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Users", val: stats.users, icon: Users, color: "bg-blue-500" },
    { label: "Videos Live", val: stats.vids, icon: Video, color: "bg-primary" },
    { label: "Active Groups", val: stats.groups, icon: Globe, color: "bg-secondary" },
    { label: "Sales (SQ)", val: "0", icon: Coins, color: "bg-yellow-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c, i) => (
        <div key={i} className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl">
          <div className={`${c.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}><c.icon size={20}/></div>
          <p className="text-3xl font-black">{c.val}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 2. MANAGE USERS (Promote functionality)
// ============================================================
function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select(`id, username, email, user_roles(role)` ).order("created_at", { ascending: false });
    setUsers(data || []);
  };
  useEffect(() => { fetchUsers(); }, []);

  const promote = async (uid: string, name: string) => {
    const { error } = await supabase.from("user_roles").upsert({ user_id: uid, role: "business" }, { onConflict: 'user_id' });
    if (!error) {
      await supabase.from("dadaz_profiles").upsert({ id: uid, owner_id: uid, username: name || "dada_user", is_published: true });
      toast.success("User promoted to Dadaz!");
      fetchUsers();
    } else toast.error(error.message);
  };

  const filtered = users.filter(u => u.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          placeholder="Search by email..." 
          className="w-full bg-[#111] border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-primary"
          onChange={e => setQ(e.target.value)}
        />
      </div>
      <div className="space-y-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full">
              <p className="font-black text-lg">@{u.username || "guest"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              <span className="text-[10px] font-black uppercase text-primary mt-1 block">{u.user_roles?.[0]?.role || 'user'}</span>
            </div>
            {u.user_roles?.[0]?.role === 'user' && (
              <button onClick={() => promote(u.id, u.username)} className="w-full md:w-auto bg-primary px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-neon transition-transform active:scale-95">PROMOTE TO DADA</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 3. VIDEOS MANAGER
// ============================================================
function VideosManager() {
  const [vids, setVids] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", video_url: "", thumbnail_url: "", price_sq: 0 });

  const fetchVids = async () => {
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    setVids(data || []);
  };
  useEffect(() => { fetchVids(); }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("videos").insert([{ 
      ...form, 
      status: 'available', 
      price_tsh: form.price_sq * 100, // Sync TSh
      is_published: true 
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Video Published!"); setShowAdd(false); fetchVids(); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="w-full md:w-auto bg-primary py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-3 shadow-neon transition-transform active:scale-95">
        {showAdd ? <X size={20}/> : <Plus size={20}/>} {showAdd ? "CANCEL" : "UPLOAD NEW VIDEO"}
      </button>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-[#111] p-6 rounded-[2rem] border border-primary/20 space-y-4 max-w-2xl animate-in slide-in-from-top duration-300">
          <input placeholder="Video Title" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="MP4 Link (e.g. https://...video.mp4)" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail Link" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <div className="bg-black border border-white/10 p-4 rounded-2xl flex items-center gap-3">
             <Coins size={18} className="text-yellow-500" />
             <input type="number" placeholder="Price in SQ" className="flex-1 bg-transparent outline-none" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          </div>
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-tighter">Publish Now</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden group">
            <div className="aspect-video relative">
              <img src={v.thumbnail_url || "https://via.placeholder.com/300"} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-primary/90 px-3 py-1 rounded-full text-[10px] font-black shadow-lg backdrop-blur-md">{v.price_sq} SQ</div>
            </div>
            <div className="p-5 flex justify-between items-center gap-3">
              <p className="font-bold text-sm truncate">{v.title}</p>
              <button onClick={async () => { if(confirm("Futa?")) { await supabase.from("videos").delete().eq("id", v.id); fetchVids(); }}} className="text-red-500"><Trash2 size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 4. DADAZ MANAGER
// ============================================================
function DadazManager() {
  const [dadaz, setDadaz] = useState<any[]>([]);

  const fetch = async () => {
    const { data } = await supabase.from("dadaz_profiles").select("*").order("created_at", { ascending: false });
    setDadaz(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const toggleVerify = async (id: string, current: boolean) => {
    await supabase.from("dadaz_profiles").update({ is_admin_approved: !current }).eq("id", id);
    toast.success("Verification updated!");
    fetch();
  };

  return (
    <div className="space-y-3">
      {dadaz.map(d => (
        <div key={d.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex items-center gap-4">
          <img src={d.avatar_url || "https://via.placeholder.com/100"} className="w-14 h-14 rounded-full border-2 border-primary object-cover" />
          <div className="flex-1 min-w-0">
             <h4 className="font-black italic text-lg tracking-tighter">@{d.username}</h4>
             <p className="text-[10px] text-muted-foreground uppercase font-bold">{d.location || "Dar es Salaam"}</p>
          </div>
          <button 
            onClick={() => toggleVerify(d.id, d.is_admin_approved)}
            className={`p-3 rounded-2xl transition-all ${d.is_admin_approved ? "bg-green-500 text-white shadow-lg" : "bg-white/5 text-muted-foreground"}`}
          >
            <CheckCircle size={24} />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 5. GROUPS MANAGER
// ============================================================
function GroupsManager() {
  const [groups, setGroups] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", link: "" });

  const fetch = async () => {
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    setGroups(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    await supabase.from("groups").insert([{ ...form, is_published: true }]);
    toast.success("Group Added!");
    setShowAdd(false);
    fetch();
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="w-full md:w-auto bg-secondary text-black py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all">
        {showAdd ? <X size={20}/> : <Globe size={20}/>} {showAdd ? "CANCEL" : "ADD NEW GROUP"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-4 max-w-xl animate-in slide-in-from-top">
          <input placeholder="Group Name" required className="w-full bg-black border border-white/10 p-4 rounded-2xl" onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Link (WhatsApp/Telegram)" required className="w-full bg-black border border-white/10 p-4 rounded-2xl" onChange={e => setForm({...form, link: e.target.value})} />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase">Create Group</button>
        </form>
      )}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm">{g.name}</h4>
              <p className="text-[10px] text-secondary font-black truncate">{g.link}</p>
            </div>
            <button onClick={async () => { await supabase.from("groups").delete().eq("id", g.id); fetch(); }} className="text-red-500 p-2"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 6. REDEEM MANAGER
// ============================================================
function RedeemManager() {
  const [codes, setCodes] = useState<any[]>([]);
  const [amt, setAmt] = useState(10);

  const fetch = async () => {
    const { data } = await supabase.from("redeem_links").select("*").order("created_at", { ascending: false });
    setCodes(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const generate = async () => {
    const code = "UP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    const { error } = await supabase.from("redeem_links").insert({
        code, coins_sq: amt, max_uses: 1, is_active: true
    });
    if (error) toast.error(error.message);
    else { toast.success("Code Created!"); fetch(); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 text-center max-w-xl mx-auto">
        <h3 className="font-black text-xl mb-4">Redeem Voucher</h3>
        <div className="flex items-center gap-3 mb-6 bg-black p-4 rounded-2xl border border-white/5">
           <Coins className="text-primary" />
           <input type="number" value={amt} onChange={e => setAmt(Number(e.target.value))} className="bg-transparent flex-1 outline-none text-xl font-black" />
           <span className="text-xs font-bold text-muted-foreground uppercase pr-2">SQ</span>
        </div>
        <button onClick={generate} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-neon transition-transform active:scale-95">GENERATE UNIQUE CODE</button>
      </div>

      <div className="bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-white/5 font-black uppercase text-muted-foreground"><tr className="p-5">
            <th className="p-5">Code</th><th className="p-5 text-center">SQ</th><th className="p-5 text-right">Action</th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {codes.map(c => (
              <tr key={c.id}>
                <td className="p-5 font-mono text-primary font-black">{c.code}</td>
                <td className="p-5 text-center font-black text-lg">{c.coins_sq} SQ</td>
                <td className="p-5 text-right"><button onClick={async () => { await supabase.from("redeem_links").delete().eq("id", c.id); fetch(); }} className="text-red-500"><Trash2 size={16}/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// 7. SETTINGS MANAGER
// ============================================================
function SettingsManager() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("app_settings").select("*");
      const s: any = {};
      data?.forEach(item => s[item.key] = item.value);
      setSettings(s);
    };
    fetch();
  }, []);

  const save = async (key: string, value: any) => {
    const { error } = await supabase.from("app_settings").upsert({ key, value });
    if (error) toast.error(error.message);
    else toast.success(`Saved ${key}`);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8 shadow-2xl">
        <div>
           <label className="text-[10px] font-black uppercase text-primary ml-2 tracking-widest">SQ Value (TSh per 1 SQ)</label>
           <div className="flex gap-3 mt-2">
             <input value={settings.sq_to_tsh || "100"} onChange={e => setSettings({...settings, sq_to_tsh: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl font-black text-xl" />
             <button onClick={() => save("sq_to_tsh", settings.sq_to_tsh)} className="bg-white text-black px-8 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all"><Save/></button>
           </div>
        </div>

        <div>
           <label className="text-[10px] font-black uppercase text-secondary ml-2 tracking-widest">Support WhatsApp Number</label>
           <div className="flex gap-3 mt-2">
             <input value={settings.support_whatsapp || ""} onChange={e => setSettings({...settings, support_whatsapp: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl font-bold" />
             <button onClick={() => save("support_whatsapp", settings.support_whatsapp)} className="bg-white text-black px-8 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all"><Save/></button>
           </div>
        </div>

        <div>
           <label className="text-[10px] font-black uppercase text-purple-400 ml-2 tracking-widest">Join Telegram/WA Channel</label>
           <div className="flex gap-3 mt-2">
             <input value={settings.whatsapp_channel || ""} onChange={e => setSettings({...settings, whatsapp_channel: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl" />
             <button onClick={() => save("whatsapp_channel", settings.whatsapp_channel)} className="bg-white text-black px-8 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all"><Save/></button>
           </div>
        </div>
      </div>
    </div>
  );
}