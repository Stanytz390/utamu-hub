import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Video, Users, UserCheck, 
  Gift, Settings, Plus, Trash2, Menu, X, 
  CheckCircle, Save, Search, Coins, Globe, ShieldAlert
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ============================================================
// SECURITY CHECK (Stanlee Access)
// ============================================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });

    // Hii ndio kinga yako - Email yako inapita moja kwa moja
    if (user.email?.toLowerCase() === 'officialstanlee143@gmail.com') return { user };

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    if (roleData?.role !== "admin") throw redirect({ to: "/" });
    return { user };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menu = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "users", label: "Manage Users", icon: Users },
    { id: "videos", label: "Utamu Videos", icon: Video },
    { id: "dadaz", label: "Dadaz (Profiles)", icon: UserCheck },
    { id: "groups", label: "Groups", icon: Globe },
    { id: "redeem", label: "Redeem Codes", icon: Gift },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white selection:bg-primary/30 font-sans">
      <Toaster position="top-center" richColors />
      
      {/* MOBILE NAVBAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111]/90 backdrop-blur-md border-b border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl text-primary border border-white/5">
          <Menu size={22} />
        </button>
        <span className="font-black italic tracking-tighter text-lg bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent uppercase">ADMIN HUB</span>
        <Link to="/" className="p-2 bg-white/5 rounded-xl text-muted-foreground"><X size={18}/></Link>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed md:relative z-[70] w-64 h-full bg-[#111] border-r border-white/5 transition-transform duration-300 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 shadow-2xl`}>
        <div className="p-8 border-b border-white/5 hidden md:block">
          <h1 className="text-2xl font-black italic tracking-tighter bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">UTAMU ADMIN</h1>
          <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.3em] mt-1">Super Administrator</p>
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
          <button onClick={() => supabase.auth.signOut().then(() => navigate({to: '/auth'}))} className="w-full py-3 rounded-2xl bg-red-500/10 text-red-500 font-black text-xs uppercase border border-red-500/20 hover:bg-red-500 hover:text-white transition-all">Log Out</button>
        </div>
      </aside>

      {/* MOBILE OVERLAY */}
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
  const [stats, setStats] = useState({ users: 0, vids: 0, dadaz: 0 });
  useEffect(() => {
    const fetch = async () => {
      const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
      const { count: d } = await supabase.from("dadaz_profiles").select("*", { count: "exact", head: true });
      setStats({ users: u||0, vids: v||0, dadaz: d||0 });
    };
    fetch();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-bottom-2 duration-500">
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl">
        <Users className="text-blue-400 mb-2" />
        <p className="text-2xl font-black">{stats.users}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">Total Users</p>
      </div>
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl">
        <Video className="text-primary mb-2" />
        <p className="text-2xl font-black">{stats.vids}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">Videos</p>
      </div>
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl">
        <UserCheck className="text-secondary mb-2" />
        <p className="text-2xl font-black">{stats.dadaz}</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">Dadaz</p>
      </div>
      <div className="bg-[#111] p-6 rounded-3xl border border-white/5 shadow-xl">
        <Coins className="text-yellow-500 mb-2" />
        <p className="text-2xl font-black">0</p>
        <p className="text-[10px] text-muted-foreground uppercase font-bold">Revenue</p>
      </div>
    </div>
  );
}

// ============================================================
// 2. MANAGE USERS (MAKE DADAZ)
// ============================================================
function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const fetch = async () => {
    const { data } = await supabase.from("profiles").select("id, username, email, user_roles(role)").order("created_at", { ascending: false });
    setUsers(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const promote = async (uid: string, name: string) => {
    // 1. Promote to Role Business
    await supabase.from("user_roles").upsert({ user_id: uid, role: "business" }, { onConflict: 'user_id' });
    // 2. Create profile in dadaz_profiles
    await supabase.from("dadaz_profiles").upsert({ 
        id: uid, 
        owner_id: uid, 
        username: name || "new_dada", 
        status: "work", 
        is_published: true 
    });
    toast.success("Account converted to DADAZ!"); fetch();
  };

  const filtered = users.filter(u => u.email?.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <input 
        placeholder="Search users by email..." 
        className="w-full bg-[#111] border border-white/10 p-4 rounded-2xl outline-none focus:border-primary transition-all shadow-lg"
        onChange={e => setQ(e.target.value)} 
      />
      <div className="space-y-3">
        {filtered.map(u => {
          const role = u.user_roles?.[0]?.role || 'user';
          return (
            <div key={u.id} className="bg-[#111] p-5 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="w-full">
                  <p className="font-black text-lg">@{u.username || "guest"}</p>
                  <p className="text-[11px] text-muted-foreground">{u.email}</p>
                  <span className={`text-[9px] font-black uppercase mt-1 inline-block px-2 py-0.5 rounded-full ${role === 'admin' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>{role}</span>
               </div>
               {role === 'user' && (
                 <button onClick={() => promote(u.id, u.username)} className="w-full md:w-auto bg-primary px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-neon active:scale-95 transition-all">Promote to Dadaz</button>
               )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// 3. VIDEOS (UPLOADING)
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
    // Nimeongeza price_tsh hapa kwa ajili ya database error
    const { error } = await supabase.from("videos").insert([{ 
        ...form, 
        status: 'available', 
        price_tsh: form.price_sq * 100, 
        is_published: true 
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Video is LIVE!"); setShowAdd(false); fetch(); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="bg-primary py-4 px-8 rounded-2xl font-black shadow-neon flex items-center gap-2">
        {showAdd ? <X size={20}/> : <Plus size={20}/>} {showAdd ? "CANCEL" : "UPLOAD VIDEO"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-3xl border border-primary/20 space-y-4 max-w-xl animate-in slide-in-from-top">
          <input placeholder="Title" required className="w-full bg-black border border-white/10 p-4 rounded-xl outline-none" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Video Link (.mp4)" required className="w-full bg-black border border-white/10 p-4 rounded-xl outline-none" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail Link" className="w-full bg-black border border-white/10 p-4 rounded-xl outline-none" onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <input type="number" placeholder="Price SQ" className="w-full bg-black border border-white/10 p-4 rounded-xl outline-none" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          <button className="w-full bg-white text-black py-4 rounded-xl font-black uppercase">Publish Now</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] rounded-2xl border border-white/5 overflow-hidden">
            <img src={v.thumbnail_url || "https://via.placeholder.com/300"} className="aspect-video w-full object-cover" />
            <div className="p-4 flex justify-between items-center">
              <span className="font-bold truncate text-sm">{v.title}</span>
              <button onClick={async () => { await supabase.from("videos").delete().eq("id", v.id); fetch(); }}><Trash2 className="text-red-500" size={18}/></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 4. DADAZ MANAGER (VERIFICATION)
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
    toast.success("Updated Verification!"); fetch();
  };

  return (
    <div className="space-y-3">
      {dadaz.map(d => (
        <div key={d.id} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={d.avatar_url || "https://via.placeholder.com/50"} className="w-10 h-10 rounded-full border border-primary object-cover" />
            <p className="font-black text-sm">@{d.username}</p>
          </div>
          <button onClick={() => verify(d.id, d.is_admin_approved)} className={`p-3 rounded-xl transition-all ${d.is_admin_approved ? "bg-green-500 text-white shadow-lg" : "bg-white/5 text-muted-foreground"}`}>
            <CheckCircle size={20}/>
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 5. REDEEM & SETTINGS
// ============================================================
function RedeemTab() {
  const [codes, setCodes] = useState<any[]>([]);
  const fetch = async () => {
    const { data } = await supabase.from("redeem_links").select("*");
    setCodes(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const generate = async () => {
    const code = "UP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    await supabase.from("redeem_links").insert({ code, coins_sq: 10, max_uses: 1, is_active: true });
    toast.success("Voucher Created!"); fetch();
  };

  return (
    <div className="space-y-4">
      <button onClick={generate} className="w-full bg-primary py-4 rounded-xl font-black shadow-neon">GENERATE 10 SQ CODE</button>
      {codes.map(c => (
        <div key={c.id} className="p-4 bg-[#111] rounded-xl border border-white/5 flex justify-between items-center font-mono">
           <span className="text-primary font-bold">{c.code}</span>
           <span className="text-xs">{c.coins_sq} SQ</span>
        </div>
      ))}
    </div>
  );
}

function SettingsTab() {
  const [rate, setRate] = useState("100");
  const save = async () => {
    await supabase.from("app_settings").upsert({ key: "sq_to_tsh", value: rate });
    toast.success("Settings Saved!");
  };
  return (
    <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4 max-w-sm">
      <label className="text-xs font-black uppercase text-muted-foreground">SQ to TSh Exchange Rate</label>
      <input value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl font-bold" />
      <button onClick={save} className="w-full bg-white text-black py-4 rounded-xl font-black shadow-lg">SAVE SETTINGS</button>
    </div>
  );
}

function GroupsTab() {
  const [groups, setGroups] = useState<any[]>([]);
  const fetch = async () => {
    const { data } = await supabase.from("groups").select("*");
    setGroups(data || []);
  };
  useEffect(() => { fetch(); }, []);
  return (
    <div className="space-y-3">
      {groups.map(g => (
        <div key={g.id} className="p-4 bg-[#111] rounded-xl border border-white/5 flex justify-between items-center">
          <span className="font-bold">{g.name}</span>
          <button className="text-red-500"><Trash2 size={18}/></button>
        </div>
      ))}
    </div>
  );
}