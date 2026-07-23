import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Video, Users, UserCheck, 
  Gift, Settings, Plus, Trash2, Menu, X, 
  CheckCircle, Save, Search, TrendingUp, 
  Globe, Coins, ShieldCheck 
} from "lucide-react";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) throw redirect({ to: "/" });
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
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl text-primary">
          <Menu size={24} />
        </button>
        <span className="font-black italic tracking-tighter text-primary uppercase">Admin Hub</span>
        <button onClick={() => navigate({ to: "/" })} className="text-xs text-muted-foreground">Exit</button>
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/90 z-[60]" onClick={() => setIsSidebarOpen(false)}>
          <aside className="w-72 h-full bg-[#111] p-6 animate-in slide-in-from-left duration-300" onClick={e => e.stopPropagation()}>
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
          <h1 className="text-2xl font-black italic text-primary">ADMIN</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-primary text-white shadow-neon" : "text-muted-foreground hover:bg-white/5"}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-10 mt-16 md:mt-0 overflow-y-auto">
        {activeTab === "dashboard" && <DashboardStats />}
        {activeTab === "users" && <UsersManager />}
        {activeTab === "videos" && <VideosManager />}
        {activeTab === "dadaz" && <DadazManager />}
        {activeTab === "groups" && <GroupsManager />}
        {activeTab === "redeem" && <RedeemManager />}
        {activeTab === "settings" && <SettingsManager />}
      </main>
    </div>
  );
}

// --- DASHBOARD STATS ---
function DashboardStats() {
  const [stats, setStats] = useState({ users: 0, vids: 0, groups: 0 });
  useEffect(() => {
    const fetch = async () => {
      const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
      const { count: g } = await supabase.from("groups").select("*", { count: "exact", head: true });
      setStats({ users: u||0, vids: v||0, groups: g||0 });
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {[
        { label: "Users", val: stats.users, icon: Users, color: "bg-blue-500" },
        { label: "Videos", val: stats.vids, icon: Video, color: "bg-primary" },
        { label: "Groups", val: stats.groups, icon: Globe, color: "bg-secondary" },
        { label: "Coins Sold", val: "0", icon: Coins, color: "bg-yellow-500" }
      ].map((c, i) => (
        <div key={i} className="bg-[#111] p-5 rounded-[1.5rem] border border-white/5">
          <div className={`${c.color} w-10 h-10 rounded-xl flex items-center justify-center mb-3`}><c.icon size={20}/></div>
          <p className="text-2xl font-black">{c.val}</p>
          <p className="text-[10px] text-muted-foreground uppercase font-bold">{c.label}</p>
        </div>
      ))}
    </div>
  );
}

// --- USER MANAGEMENT (PROMOTE TO DADAZ) ---
function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select(`id, username, email, user_roles(role)` ).order("created_at", { ascending: false });
    setUsers(data || []);
  };
  useEffect(() => { fetchUsers(); }, []);

  const promote = async (uid: string, name: string) => {
    await supabase.from("user_roles").upsert({ user_id: uid, role: "business" }, { onConflict: 'user_id' });
    await supabase.from("dadaz_profiles").upsert({ id: uid, owner_id: uid, username: name || "dada", is_published: true });
    toast.success("User promoted to Dadaz!");
    fetchUsers();
  };

  const filtered = users.filter(u => u.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
        <input placeholder="Search users by email..." className="w-full bg-[#111] border border-white/10 p-4 pl-12 rounded-2xl outline-none focus:border-primary" onChange={e => setQ(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(u => (
          <div key={u.id} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
              <p className="font-black text-lg">@{u.username || "guest"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              <span className="text-[9px] font-black uppercase text-primary">{u.user_roles?.[0]?.role || 'user'}</span>
            </div>
            {u.user_roles?.[0]?.role !== 'business' && u.user_roles?.[0]?.role !== 'admin' && (
              <button onClick={() => promote(u.id, u.username)} className="bg-primary px-6 py-2 rounded-xl font-bold text-xs">PROMOTE TO DADAZ</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- VIDEOS MANAGER ---
function VideosManager() {
  const [vids, setVids] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", video_url: "", thumbnail_url: "", price_sq: 0 });

  const fetch = async () => {
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    setVids(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("videos").insert([{ 
      ...form, 
      status: "available", 
      price_tsh: form.price_sq * 100, // Important fix
      is_published: true 
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Video Published!"); setShowAdd(false); fetch(); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="bg-primary py-4 px-8 rounded-2xl font-black flex items-center gap-2 shadow-neon">
        {showAdd ? <X size={20}/> : <Plus size={20}/>} {showAdd ? "CANCEL" : "UPLOAD VIDEO"}
      </button>
      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-3xl border border-white/10 space-y-4 max-w-xl">
          <input placeholder="Title" required className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Video Link (.mp4)" required className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail Link" className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <input type="number" placeholder="Price SQ" className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          <button className="w-full bg-white text-black py-4 rounded-xl font-black">PUBLISH NOW</button>
        </form>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
            <img src={v.thumbnail_url || "https://via.placeholder.com/300"} className="aspect-video w-full object-cover" />
            <div className="p-4 flex justify-between items-center">
              <p className="font-bold text-sm truncate">{v.title}</p>
              <button onClick={async () => { await supabase.from("videos").delete().eq("id", v.id); fetch(); }}><Trash2 className="text-red-500" size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- DADAZ MANAGER ---
function DadazManager() {
  const [dadaz, setDadaz] = useState<any[]>([]);
  const fetch = async () => {
    const { data } = await supabase.from("dadaz_profiles").select("*").order("created_at", { ascending: false });
    setDadaz(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const verify = async (id: string, status: boolean) => {
    await supabase.from("dadaz_profiles").update({ is_admin_approved: !status }).eq("id", id);
    toast.success("Verification updated!");
    fetch();
  };

  return (
    <div className="space-y-3">
      {dadaz.map(d => (
        <div key={d.id} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={d.avatar_url || "https://via.placeholder.com/50"} className="w-10 h-10 rounded-full border border-primary object-cover" />
            <div>
              <p className="font-black text-sm">@{d.username}</p>
              <p className="text-[10px] text-muted-foreground uppercase">{d.location || "TZ"}</p>
            </div>
          </div>
          <button onClick={() => verify(d.id, d.is_admin_approved)} className={`p-2 rounded-xl ${d.is_admin_approved ? 'bg-green-500 text-white' : 'bg-white/10 text-muted-foreground'}`}>
            <CheckCircle size={20}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// --- GROUPS MANAGER ---
function GroupsManager() {
  const [groups, setGroups] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", link: "" });

  const fetch = async () => {
    const { data } = await supabase.from("groups").select("*");
    setGroups(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    await supabase.from("groups").insert([{ ...form, is_published: true }]);
    toast.success("Group added!");
    setShowAdd(false);
    fetch();
  };

  return (
    <div className="space-y-4">
      <button onClick={() => setShowAdd(!showAdd)} className="bg-secondary text-black px-6 py-3 rounded-xl font-black">ADD GROUP</button>
      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-5 rounded-2xl border border-white/10 space-y-3">
          <input placeholder="Group Name" className="w-full bg-black border border-white/10 p-3 rounded-lg" onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Invite Link" className="w-full bg-black border border-white/10 p-3 rounded-lg" onChange={e => setForm({...form, link: e.target.value})} />
          <button className="w-full bg-white text-black py-3 rounded-lg font-bold">SAVE GROUP</button>
        </form>
      )}
      {groups.map(g => (
        <div key={g.id} className="bg-[#111] p-4 rounded-xl border border-white/5 flex justify-between items-center">
          <span className="font-bold text-sm">{g.name}</span>
          <button onClick={async () => { await supabase.from("groups").delete().eq("id", g.id); fetch(); }}><Trash2 size={16} className="text-red-500"/></button>
        </div>
      ))}
    </div>
  );
}

// --- REDEEM MANAGER ---
function RedeemManager() {
  const [codes, setCodes] = useState<any[]>([]);
  const [amt, setAmt] = useState(10);

  const fetch = async () => {
    const { data } = await supabase.from("redeem_links").select("*").order("created_at", { ascending: false });
    setCodes(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const gen = async () => {
    const code = "UP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    await supabase.from("redeem_links").insert({ code, coins_sq: amt, max_uses: 1, is_active: true }); // Fix coins_sq
    toast.success("Voucher Created!");
    fetch();
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#111] p-6 rounded-3xl border border-white/10 text-center max-w-md mx-auto">
        <h3 className="font-black mb-4">Generate Voucher</h3>
        <input type="number" value={amt} onChange={e => setAmt(Number(e.target.value))} className="w-full bg-black p-4 rounded-xl text-center text-xl font-black mb-4 border border-white/5" />
        <button onClick={gen} className="w-full bg-primary py-4 rounded-xl font-black">GENERATE CODE</button>
      </div>
      <div className="bg-[#111] rounded-2xl overflow-hidden border border-white/5">
        <table className="w-full text-xs text-left">
          <thead className="bg-white/5 uppercase"><tr className="p-4">
            <th className="p-4">Code</th><th className="p-4 text-center">SQ</th><th className="p-4"></th>
          </tr></thead>
          <tbody className="divide-y divide-white/5">
            {codes.map(c => (
              <tr key={c.id}>
                <td className="p-4 font-mono text-primary font-bold">{c.code}</td>
                <td className="p-4 text-center font-black">{c.coins_sq}</td>
                <td className="p-4 text-right"><button onClick={async () => { await supabase.from("redeem_links").delete().eq("id", c.id); fetch(); }}><Trash2 size={14} className="text-red-500"/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- SETTINGS MANAGER ---
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
    await supabase.from("app_settings").upsert({ key, value });
    toast.success("Saved!");
  };

  return (
    <div className="bg-[#111] p-6 rounded-3xl border border-white/10 space-y-6 max-w-xl mx-auto">
      <div>
        <label className="text-[10px] font-black uppercase text-primary ml-1">SQ Value (TSh per 1 SQ)</label>
        <div className="flex gap-2 mt-1">
          <input value={settings.sq_to_tsh || "100"} onChange={e => setSettings({...settings, sq_to_tsh: e.target.value})} className="flex-1 bg-black border border-white/5 p-4 rounded-xl" />
          <button onClick={() => save("sq_to_tsh", settings.sq_to_tsh)} className="bg-white text-black px-6 rounded-xl font-bold"><Save size={18}/></button>
        </div>
      </div>
      <div>
        <label className="text-[10px] font-black uppercase text-secondary ml-1">Support WhatsApp</label>
        <div className="flex gap-2 mt-1">
          <input value={settings.support_whatsapp || ""} onChange={e => setSettings({...settings, support_whatsapp: e.target.value})} className="flex-1 bg-black border border-white/5 p-4 rounded-xl" />
          <button onClick={() => save("support_whatsapp", settings.support_whatsapp)} className="bg-white text-black px-6 rounded-xl font-bold"><Save size={18}/></button>
        </div>
      </div>
    </div>
  );
}