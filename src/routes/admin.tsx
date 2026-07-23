import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Video, Users, UserCheck, 
  Gift, Settings, Plus, Trash2, ShieldAlert,
  Menu, X, CheckCircle, Save, Star, Search,
  TrendingUp, Globe, MoreVertical, Smartphone
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ============================================================
// ROUTE PROTECTION
// ============================================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Log in required");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw new Error("Admin only area");
    return { user };
  },
  component: AdminDashboard,
});

// ============================================================
// MAIN COMPONENT
// ============================================================
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
      
      {/* Mobile Nav Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/5 p-4 flex items-center justify-between backdrop-blur-md">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl text-primary shadow-lg">
          <Menu size={24} />
        </button>
        <span className="font-black italic tracking-tighter text-lg bg-clip-text text-transparent bg-[image:var(--gradient-primary)]">ADMIN HUB</span>
        <button onClick={() => navigate({ to: "/" })} className="p-2 bg-white/5 rounded-xl text-muted-foreground"><X size={20}/></button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/90 z-[60] animate-in fade-in duration-300" onClick={() => setIsSidebarOpen(false)}>
          <aside className="w-72 h-full bg-[#111] border-r border-white/5 p-6 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-xl font-black text-primary italic">UTAMU PORI</h1>
              <button onClick={() => setIsSidebarOpen(false)}><X size={24}/></button>
            </div>
            <nav className="space-y-2">
              {menuItems.map(item => (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
                  className={`flex items-center w-full gap-4 px-4 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-primary text-white shadow-neon" : "text-muted-foreground hover:bg-white/5"}`}
                >
                  <item.icon size={20} /> {item.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-[#111] border-r border-white/5">
        <div className="p-8 border-b border-white/5 text-center">
          <h1 className="text-2xl font-black italic text-primary tracking-tighter">ADMIN</h1>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest mt-1">Management Console</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-primary text-white shadow-neon" : "text-muted-foreground hover:bg-white/10"}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="p-6 border-t border-white/5">
          <button onClick={() => supabase.auth.signOut().then(() => navigate({to: '/auth'}))} className="flex items-center gap-3 w-full p-4 rounded-2xl bg-red-500/10 text-red-400 font-bold hover:bg-red-500 hover:text-white transition-all">
            <X size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-4 md:p-10 mt-16 md:mt-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === "dashboard" && <DashboardContent />}
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
// 1. DASHBOARD CONTENT
// ============================================================
function DashboardContent() {
  const [stats, setStats] = useState({ users: 0, vids: 0, groups: 0, sales: 0 });

  useEffect(() => {
    const fetch = async () => {
      const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
      const { count: g } = await supabase.from("groups").select("*", { count: "exact", head: true });
      setStats({ users: u||0, vids: v||0, groups: g||0, sales: 0 });
    };
    fetch();
  }, []);

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, color: "bg-blue-500" },
    { label: "Videos Live", value: stats.vids, icon: Video, color: "bg-primary" },
    { label: "Global Groups", value: stats.groups, icon: Globe, color: "bg-secondary" },
    { label: "Coin Revenue", value: "TSh 0", icon: TrendingUp, color: "bg-orange-500" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {cards.map((c, i) => (
        <div key={i} className="bg-[#111] p-6 rounded-[2rem] border border-white/5 shadow-xl">
          <div className={`${c.color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}>
            <c.icon size={20} className="text-white" />
          </div>
          <p className="text-3xl font-black">{c.value}</p>
          <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 2. USERS MANAGER (PROMOTE TO DADAZ)
// ============================================================
function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select(`id, username, email, user_roles(role)` ).order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchUsers(); }, []);

  const promote = async (uid: string, username: string) => {
    const { error } = await supabase.from("user_roles").upsert({ user_id: uid, role: "business" }, { onConflict: 'user_id' });
    if (error) toast.error(error.message);
    else {
      // Automatic profile creation in dadaz_profiles
      await supabase.from("dadaz_profiles").upsert({ id: uid, owner_id: uid, username: username || "anonymous", status: "work", is_published: true });
      toast.success("Promoted to Dadaz!");
      fetchUsers();
    }
  };

  const filtered = users.filter(u => u.email?.toLowerCase().includes(q.toLowerCase()) || u.username?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input 
          placeholder="Search by email or name..." 
          className="w-full bg-[#111] border border-white/5 p-4 pl-12 rounded-2xl focus:border-primary outline-none transition-all"
          onChange={e => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-3">
        {filtered.map(u => {
          const role = u.user_roles?.[0]?.role || 'user';
          return (
            <div key={u.id} className="bg-[#111] p-5 rounded-[2rem] border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/10 transition-all">
              <div className="flex items-center gap-4 w-full">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-black text-xl text-primary">{u.username?.[0] || "?"}</div>
                <div className="min-w-0">
                  <p className="font-black text-lg truncate">@{u.username || "guest"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {role === 'user' ? (
                  <button onClick={() => promote(u.id, u.username)} className="flex-1 md:flex-initial bg-secondary text-black font-black text-[10px] px-6 py-3 rounded-xl uppercase hover:scale-105 transition-transform">Promote to Dada</button>
                ) : (
                  <span className="bg-primary/10 text-primary border border-primary/20 px-4 py-2 rounded-xl text-[10px] font-black uppercase">{role}</span>
                )}
                <button className="bg-red-500/10 text-red-500 p-3 rounded-xl"><Trash2 size={18}/></button>
              </div>
            </div>
          )
        })}
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

  const save = async (e: any) => {
    e.preventDefault();
    // Fixed: Sending price_tsh to avoid DB error
    const { error } = await supabase.from("videos").insert([{ 
      ...form, 
      status: "available", 
      price_tsh: form.price_sq * 100,
      is_published: true 
    }]);
    
    if (error) toast.error(error.message);
    else { toast.success("Utamu Live!"); setShowAdd(false); fetchVids(); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="w-full md:w-auto bg-primary py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-3 shadow-neon transition-transform active:scale-95">
        {showAdd ? <X size={20}/> : <Plus size={20}/>} {showAdd ? "CANCEL" : "UPLOAD NEW VIDEO"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-[2rem] border border-primary/20 space-y-4 max-w-2xl animate-in slide-in-from-top duration-300">
          <input placeholder="Title" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Video Direct Link (.mp4)" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail Link" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <div className="flex items-center gap-3 bg-black border border-white/10 p-4 rounded-2xl">
            <Coins size={20} className="text-yellow-500" />
            <input type="number" placeholder="Price SQ" className="flex-1 bg-transparent outline-none" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          </div>
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase">Publish Video</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden group">
            <div className="aspect-video relative">
              <img src={v.thumbnail_url || "https://via.placeholder.com/300"} className="w-full h-full object-cover" />
              <div className="absolute top-4 right-4 bg-primary px-3 py-1 rounded-full text-[10px] font-black shadow-lg">{v.price_sq} SQ</div>
            </div>
            <div className="p-5 flex justify-between items-center">
              <p className="font-bold text-sm truncate pr-4">{v.title}</p>
              <button onClick={async () => { if(confirm("Futa video?")) { await supabase.from("videos").delete().eq("id", v.id); fetchVids(); }}} className="text-red-500"><Trash2 size={20}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 4. DADAZ MANAGER (BUSINESS)
// ============================================================
function DadazManager() {
  const [dadaz, setDadaz] = useState<any[]>([]);

  const fetch = async () => {
    const { data } = await supabase.from("dadaz_profiles").select("*").order("created_at", { ascending: false });
    setDadaz(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const verify = async (id: string, status: boolean) => {
    await supabase.from("dadaz_profiles").update({ is_admin_approved: !status }).eq("id", id);
    toast.success("Status updated!");
    fetch();
  };

  return (
    <div className="space-y-4">
      {dadaz.map(d => (
        <div key={d.id} className="bg-[#111] p-5 rounded-[2rem] border border-white/5 flex items-center gap-4">
          <img src={d.avatar_url || "https://via.placeholder.com/100"} className="w-16 h-16 rounded-full border-2 border-primary object-cover" />
          <div className="flex-1 min-w-0">
            <h4 className="font-black italic text-lg tracking-tighter">@{d.username}</h4>
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{d.location || "Dar es Salaam"}</p>
          </div>
          <button 
            onClick={() => verify(d.id, d.is_admin_approved)}
            className={`p-4 rounded-2xl transition-all ${d.is_admin_approved ? "bg-green-500 text-white shadow-[0_0_15px_rgba(34,197,94,0.4)]" : "bg-white/5 text-muted-foreground"}`}
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
        {showAdd ? <X size={20}/> : <Smartphone size={20}/>} {showAdd ? "CANCEL" : "ADD NEW GROUP"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-[2rem] border border-secondary/20 space-y-4 max-w-xl animate-in slide-in-from-top">
          <input placeholder="Group Name" required className="w-full bg-black border border-white/10 p-4 rounded-2xl" onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Join Link (WhatsApp/Telegram)" required className="w-full bg-black border border-white/10 p-4 rounded-2xl" onChange={e => setForm({...form, link: e.target.value})} />
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase">Create Group</button>
        </form>
      )}

      <div className="space-y-3">
        {groups.map(g => (
          <div key={g.id} className="bg-[#111] p-4 pl-6 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm">{g.name}</h4>
              <p className="text-[9px] text-secondary font-black truncate uppercase">{g.link}</p>
            </div>
            <button onClick={async () => { await supabase.from("groups").delete().eq("id", g.id); fetch(); }} className="text-red-500 p-2"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 6. REDEEM CODES
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
    // Fixed: Using coins_sq to match DB
    const { error } = await supabase.from("redeem_links").insert({
        code, coins_sq: amt, max_uses: 1, is_active: true
    });
    if (error) toast.error(error.message);
    else { toast.success("Redeem Link Live!"); fetch(); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-primary/5 p-8 rounded-[2rem] border border-primary/10 text-center max-w-xl mx-auto">
        <h3 className="font-black text-xl mb-4">Create Free Coin Voucher</h3>
        <div className="flex items-center gap-3 mb-6 bg-black p-4 rounded-2xl border border-white/5">
           <Coins className="text-primary" />
           <input type="number" value={amt} onChange={e => setAmt(Number(e.target.value))} className="bg-transparent flex-1 outline-none text-xl font-black" />
           <span className="text-xs font-bold text-muted-foreground uppercase pr-2">SQ</span>
        </div>
        <button onClick={generate} className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-neon">GENERATE UNIQUE CODE</button>
      </div>

      <div className="bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-white/5 font-black uppercase text-muted-foreground">
            <tr><th className="p-5">Code</th><th className="p-5 text-center">Value</th><th className="p-5 text-right">Action</th></tr>
          </thead>
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
      <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8">
        <div>
           <label className="text-[10px] font-black uppercase text-primary ml-2 tracking-widest">SQ Value (TSh per 1 SQ)</label>
           <div className="flex gap-3 mt-2">
             <input value={settings.sq_to_tsh || "100"} onChange={e => setSettings({...settings, sq_to_tsh: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl font-black text-xl" />
             <button onClick={() => save("sq_to_tsh", settings.sq_to_tsh)} className="bg-white text-black px-8 rounded-2xl font-black"><Save/></button>
           </div>
        </div>

        <div>
           <label className="text-[10px] font-black uppercase text-secondary ml-2 tracking-widest">Support WhatsApp Number</label>
           <div className="flex gap-3 mt-2">
             <input value={settings.support_whatsapp || ""} onChange={e => setSettings({...settings, support_whatsapp: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl font-bold" />
             <button onClick={() => save("support_whatsapp", settings.support_whatsapp)} className="bg-white text-black px-8 rounded-2xl font-black"><Save/></button>
           </div>
        </div>

        <div>
           <label className="text-[10px] font-black uppercase text-purple-400 ml-2 tracking-widest">Join Telegram/WA Channel</label>
           <div className="flex gap-3 mt-2">
             <input value={settings.whatsapp_channel || ""} onChange={e => setSettings({...settings, whatsapp_channel: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl" />
             <button onClick={() => save("whatsapp_channel", settings.whatsapp_channel)} className="bg-white text-black px-8 rounded-2xl font-black"><Save/></button>
           </div>
        </div>
      </div>
    </div>
  );
}