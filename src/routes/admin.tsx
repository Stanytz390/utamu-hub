import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Video, Users, UserCheck, 
  Gift, Settings, Plus, Trash2, Menu, X, 
  CheckCircle, Save, Search, Coins, Globe, Shield, Smartphone
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ============================================================
// ADMIN SECURITY CHECK
// ============================================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth" });

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", session.user.id)
      .maybeSingle();

    if (roleData?.role !== "admin") {
      throw redirect({ to: "/" });
    }
    return { user: session.user };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menu = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "videos", label: "Utamu Videos", icon: Video },
    { id: "dadaz", label: "Dadaz Profiles", icon: UserCheck },
    { id: "groups", label: "Manage Groups", icon: Globe },
    { id: "redeem", label: "Redeem Codes", icon: Gift },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white font-sans selection:bg-primary/30">
      <Toaster position="top-center" richColors />
      
      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111]/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl text-primary border border-white/5">
          <Menu size={22} />
        </button>
        <span className="font-black italic tracking-tighter text-lg bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">ADMIN HUB</span>
        <Link to="/" className="p-2 bg-white/5 rounded-xl text-muted-foreground"><X size={18}/></Link>
      </div>

      {/* SIDEBAR (RESPONSIVE) */}
      <aside className={`fixed md:relative z-[70] w-64 h-full bg-[#111] border-r border-white/5 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 shadow-2xl`}>
        <div className="p-8 border-b border-white/5 hidden md:block">
          <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">UTAMU PORI</h1>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Super Admin</p>
        </div>
        <nav className="p-4 space-y-1.5 mt-20 md:mt-0">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-primary text-white shadow-[0_0_20px_rgba(254,44,85,0.3)]" : "text-muted-foreground hover:bg-white/5"}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
        <div className="absolute bottom-6 left-6 right-6">
          <button onClick={() => supabase.auth.signOut().then(() => navigate({to: '/auth'}))} className="w-full py-3 rounded-2xl bg-red-500/10 text-red-500 font-black text-xs uppercase border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Sign Out</button>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE SIDEBAR */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-[60] md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-10 mt-16 md:mt-0 overflow-y-auto">
         <div className="max-w-5xl mx-auto">
            {activeTab === "dashboard" && <OverviewTab />}
            {activeTab === "users" && <UsersTab />}
            {activeTab === "videos" && <VideosTab />}
            {activeTab === "dadaz" && <DadazTab />}
            {activeTab === "groups" && <GroupsTab />}
            {activeTab === "redeem" && <RedeemTab />}
            {activeTab === "settings" && <SettingsTab />}
         </div>
      </main>
    </div>
  );
}

// ============================================================
// 1. OVERVIEW
// ============================================================
function OverviewTab() {
  const [stats, setStats] = useState({ users: 0, vids: 0, active_dadaz: 0 });
  useEffect(() => {
    const fetch = async () => {
      const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
      const { count: d } = await supabase.from("dadaz_profiles").select("*", { count: "exact", head: true, is_published: true });
      setStats({ users: u||0, vids: v||0, active_dadaz: d||0 });
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 animate-in slide-in-from-bottom-2 duration-500">
      <StatCard label="Total Users" val={stats.users} icon={Users} color="bg-blue-500" />
      <StatCard label="Live Videos" val={stats.vids} icon={Video} color="bg-primary" />
      <StatCard label="Verified Dadaz" val={stats.active_dadaz} icon={UserCheck} color="bg-secondary" />
    </div>
  );
}

function StatCard({ label, val, icon: Icon, color }: any) {
  return (
    <div className="bg-[#111] p-6 rounded-[2rem] border border-white/5 shadow-xl">
      <div className={`${color} w-10 h-10 rounded-2xl flex items-center justify-center mb-4`}><Icon size={20} /></div>
      <p className="text-3xl font-black">{val}</p>
      <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">{label}</p>
    </div>
  );
}

// ============================================================
// 2. USERS (Promote functionality)
// ============================================================
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("id, username, email, user_roles(role)").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };
  useEffect(() => { fetch(); }, []);

  const promote = async (uid: string, name: string) => {
    const { error } = await supabase.from("user_roles").upsert({ user_id: uid, role: "business" }, { onConflict: 'user_id' });
    if (!error) {
      await supabase.from("dadaz_profiles").upsert({ id: uid, owner_id: uid, username: name || "dada_user", is_published: true });
      toast.success("User promoted to Dadaz!");
      fetch();
    } else toast.error(error.message);
  };

  const filtered = users.filter(u => u.email?.toLowerCase().includes(q.toLowerCase()) || u.username?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h2 className="text-2xl font-black">User Management</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input placeholder="Search users..." className="bg-[#111] border border-white/10 p-3 pl-10 rounded-2xl text-sm outline-none focus:border-primary w-full md:w-64" onChange={e => setQ(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(u => {
          const role = u.user_roles?.[0]?.role || 'user';
          return (
            <div key={u.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-white/10 transition-all">
               <div className="flex items-center gap-4 w-full">
                  <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center font-black text-primary text-xl uppercase">{u.username?.[0] || "?"}</div>
                  <div className="min-w-0">
                    <p className="font-black text-lg">@{u.username || "guest"}</p>
                    <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  </div>
               </div>
               <div className="flex gap-2 w-full md:w-auto">
                 {role === 'user' ? (
                   <button onClick={() => promote(u.id, u.username)} className="flex-1 bg-secondary text-black font-black text-[10px] px-6 py-3 rounded-xl uppercase tracking-tighter">Promote to Dadaz</button>
                 ) : (
                   <span className="px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-[10px] font-black uppercase">{role}</span>
                 )}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 3. VIDEOS (Pure Working)
// ============================================================
function VideosTab() {
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
      status: 'available', 
      price_tsh: form.price_sq * 100, 
      is_published: true 
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Utamu Live!"); setShowAdd(false); fetch(); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="w-full md:w-auto bg-primary py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-3 shadow-neon transition-transform active:scale-95">
        {showAdd ? <X size={20}/> : <Plus size={20}/>} {showAdd ? "CANCEL" : "UPLOAD NEW VIDEO"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-[2rem] border border-primary/20 space-y-4 max-w-xl">
          <input placeholder="Title" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Video Link (.mp4)" required className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail Link" className="w-full bg-black border border-white/10 p-4 rounded-2xl outline-none focus:border-primary" onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <div className="bg-black border border-white/10 p-4 rounded-2xl flex items-center gap-3">
             <Coins size={18} className="text-yellow-500" />
             <input type="number" placeholder="Price in SQ" className="flex-1 bg-transparent outline-none" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          </div>
          <button className="w-full bg-white text-black py-4 rounded-2xl font-black uppercase tracking-tighter">Publish Now</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex gap-4 items-center">
            <img src={v.thumbnail_url || "https://via.placeholder.com/150"} className="w-20 h-20 rounded-2xl object-cover" />
            <div className="flex-1 min-w-0">
               <p className="font-bold text-sm truncate">{v.title}</p>
               <p className="text-[10px] text-muted-foreground uppercase font-black">{v.price_sq} SQ · Available</p>
            </div>
            <button onClick={async () => { if(confirm("Futa?")) { await supabase.from("videos").delete().eq("id", v.id); fetch(); }}} className="text-red-500 p-2"><Trash2 size={20}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 4. DADAZ MANAGER
// ============================================================
function DadazTab() {
  const [dadaz, setDadaz] = useState<any[]>([]);
  const fetch = async () => {
    const { data } = await supabase.from("dadaz_profiles").select("*").order("created_at", { ascending: false });
    setDadaz(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const verify = async (id: string, status: boolean) => {
    await supabase.from("dadaz_profiles").update({ is_admin_approved: !status }).eq("id", id);
    toast.success("Status updated!"); fetch();
  };

  return (
    <div className="space-y-4">
      {dadaz.map(d => (
        <div key={d.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex items-center gap-4">
           <img src={d.avatar_url || "https://via.placeholder.com/100"} className="w-14 h-14 rounded-full border-2 border-primary object-cover shadow-lg" />
           <div className="flex-1 min-w-0">
              <h4 className="font-black italic text-lg tracking-tighter">@{d.username}</h4>
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{d.location || "Dar es Salaam"}</p>
           </div>
           <button onClick={() => verify(d.id, d.is_admin_approved)} className={`p-4 rounded-2xl transition-all ${d.is_admin_approved ? "bg-green-500 text-white shadow-lg" : "bg-white/5 text-muted-foreground"}`}>
              <CheckCircle size={24} />
           </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 5. GROUPS
// ============================================================
function GroupsTab() {
  const [groups, setGroups] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", link: "" });
  const fetch = async () => {
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    setGroups(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const save = async (e: any) => {
    e.preventDefault();
    await supabase.from("groups").insert([{ ...form, is_published: true }]);
    toast.success("Group Added!"); fetch();
  };

  return (
    <div className="space-y-6">
       <form onSubmit={save} className="bg-[#111] p-6 rounded-[2rem] border border-white/5 space-y-4 max-w-xl">
          <input placeholder="Group Name" required className="w-full bg-black border border-white/10 p-4 rounded-2xl" onChange={e => setForm({...form, name: e.target.value})} />
          <input placeholder="Join Link" required className="w-full bg-black border border-white/10 p-4 rounded-2xl" onChange={e => setForm({...form, link: e.target.value})} />
          <button className="w-full bg-secondary text-black py-4 rounded-2xl font-black uppercase">Add Group Link</button>
       </form>
       <div className="space-y-3">
         {groups.map(g => (
           <div key={g.id} className="bg-[#111] p-4 pl-6 rounded-3xl border border-white/5 flex items-center justify-between">
              <span className="font-bold">{g.name}</span>
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
function RedeemTab() {
  const [codes, setCodes] = useState<any[]>([]);
  const [amt, setAmt] = useState(10);
  const fetch = async () => {
    const { data } = await supabase.from("redeem_links").select("*").order("created_at", { ascending: false });
    setCodes(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const generate = async () => {
    const code = "UP-" + Math.random().toString(36).substring(2, 8).toUpperCase();
    await supabase.from("redeem_links").insert({ code, coins_sq: amt, max_uses: 1, is_active: true });
    toast.success("Voucher Live!"); fetch();
  };

  return (
    <div className="space-y-6">
       <div className="bg-primary/10 p-8 rounded-[2rem] border border-primary/20 text-center max-w-xl mx-auto">
          <h3 className="font-black text-xl mb-4 text-primary">Generate Free SQ Voucher</h3>
          <input type="number" value={amt} onChange={e => setAmt(Number(e.target.value))} className="bg-black border border-white/10 p-5 rounded-3xl text-center text-3xl font-black w-full mb-6" />
          <button onClick={generate} className="w-full bg-primary py-4 rounded-2xl font-black shadow-neon">CREATE UNIQUE CODE</button>
       </div>
       <div className="bg-[#111] rounded-[2rem] border border-white/5 overflow-hidden">
          <table className="w-full text-xs text-left">
             <thead className="bg-white/5 font-black uppercase text-muted-foreground"><tr className="p-5"><th className="p-5">Code</th><th className="p-5 text-center">Value</th><th className="p-5"></th></tr></thead>
             <tbody className="divide-y divide-white/5">
                {codes.map(c => (
                  <tr key={c.id}>
                    <td className="p-5 font-mono text-primary font-black tracking-widest">{c.code}</td>
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
// 7. SETTINGS
// ============================================================
function SettingsTab() {
  const [s, setS] = useState<any>({});
  useEffect(() => {
    supabase.from("app_settings").select("*").then(({ data }) => {
      const obj: any = {}; data?.forEach(i => obj[i.key] = i.value); setS(obj);
    });
  }, []);

  const save = async (key: string, value: any) => {
    await supabase.from("app_settings").upsert({ key, value });
    toast.success(`Updated ${key}`);
  };

  return (
    <div className="bg-[#111] p-8 rounded-[2rem] border border-white/5 space-y-8 max-w-2xl mx-auto shadow-2xl">
       <div>
          <label className="text-[10px] font-black uppercase text-primary ml-2 tracking-widest">SQ Value (TSh per 1 SQ)</label>
          <div className="flex gap-3 mt-2">
             <input value={s.sq_to_tsh || "100"} onChange={e => setS({...s, sq_to_tsh: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl font-black text-xl" />
             <button onClick={() => save("sq_to_tsh", s.sq_to_tsh)} className="bg-white text-black px-8 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all"><Save/></button>
          </div>
       </div>
       <div>
          <label className="text-[10px] font-black uppercase text-secondary ml-2 tracking-widest">Support WhatsApp</label>
          <div className="flex gap-3 mt-2">
             <input value={s.support_whatsapp || ""} onChange={e => setS({...s, support_whatsapp: e.target.value})} className="flex-1 bg-black border border-white/10 p-5 rounded-2xl font-bold" />
             <button onClick={() => save("support_whatsapp", s.support_whatsapp)} className="bg-white text-black px-8 rounded-2xl font-black hover:scale-105 active:scale-95 transition-all"><Save/></button>
          </div>
       </div>
    </div>
  );
}