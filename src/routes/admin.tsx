import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  LayoutDashboard, Video, Users, UserCheck, 
  Gift, Settings, Plus, Trash2, Menu, X, 
  CheckCircle, Save, Search, Coins, Globe 
} from "lucide-react";
import { toast, Toaster } from "sonner";

// ============================================================
// SIMPLE SECURITY CHECK
// ============================================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw redirect({ to: "/auth" });

    // Hard-coded bypass kwa email yako kuzuia redirect zisizo na lazima
    if (user.email === 'officialstanlee143@gmail.com') return { user };

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
  const [activeTab, setActiveTab] = useState("users"); // Default iwe kwenye Users unayotaka
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const menu = [
    { id: "users", label: "Manage Users", icon: Users },
    { id: "videos", label: "Manage Videos", icon: Video },
    { id: "dadaz", label: "Verify Dadaz", icon: UserCheck },
    { id: "redeem", label: "SQ Codes", icon: Gift },
    { id: "settings", label: "App Settings", icon: Settings },
  ];

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      <Toaster position="top-center" richColors />
      
      {/* MOBILE TOP NAV */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#111] border-b border-white/5 p-4 flex items-center justify-between">
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 bg-white/5 rounded-xl text-primary"><Menu /></button>
        <span className="font-black italic text-primary">ADMIN PANEL</span>
        <button onClick={() => navigate({ to: "/" })} className="p-2"><X size={20}/></button>
      </div>

      {/* SIDEBAR */}
      <aside className={`fixed md:relative z-[60] w-64 h-full bg-[#111] border-r border-white/5 transition-transform ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-8 border-b border-white/5">
          <h1 className="text-xl font-black text-primary italic">UTAMU PORI</h1>
        </div>
        <nav className="p-4 space-y-1">
          {menu.map(item => (
            <button
              key={item.id}
              onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }}
              className={`flex items-center w-full gap-3 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all ${activeTab === item.id ? "bg-primary text-white" : "text-muted-foreground hover:bg-white/5"}`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* OVERLAY FOR MOBILE */}
      {isSidebarOpen && <div className="fixed inset-0 bg-black/80 z-50 md:hidden" onClick={() => setIsSidebarOpen(false)} />}

      {/* CONTENT */}
      <main className="flex-1 p-4 md:p-10 mt-16 md:mt-0 overflow-y-auto">
        {activeTab === "users" && <UsersManager />}
        {activeTab === "videos" && <VideosManager />}
        {activeTab === "dadaz" && <DadazManager />}
        {activeTab === "redeem" && <RedeemManager />}
        {activeTab === "settings" && <SettingsManager />}
      </main>
    </div>
  );
}

// ============================================================
// 1. MANAGE USERS (KUBADILI ACCOUNT KUWA DADAZ)
// ============================================================
function UsersManager() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    const { data } = await supabase.from("profiles").select(`id, username, email, user_roles(role)` ).order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };
  useEffect(() => { fetchUsers(); }, []);

  const promote = async (uid: string, name: string) => {
    // 1. Mpe role ya business
    await supabase.from("user_roles").upsert({ user_id: uid, role: "business" }, { onConflict: 'user_id' });
    // 2. Mtengenezee profile ya kazi
    await supabase.from("dadaz_profiles").upsert({ 
        id: uid, 
        owner_id: uid, 
        username: name || "new_dada", 
        status: "work", 
        is_published: true 
    });
    toast.success("Account changed to DADAZ!");
    fetchUsers();
  };

  if (loading) return <p className="p-10 text-center animate-pulse">Loading users...</p>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-black mb-6">User Management</h2>
      {users.map(u => {
        const role = u.user_roles?.[0]?.role || 'user';
        return (
          <div key={u.id} className="bg-[#111] p-4 rounded-3xl border border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full">
              <p className="font-bold text-lg">@{u.username || "guest"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
              <span className="text-[10px] font-black uppercase text-secondary mt-1 block">{role}</span>
            </div>
            {role === 'user' && (
              <button onClick={() => promote(u.id, u.username)} className="w-full md:w-auto bg-primary px-6 py-2.5 rounded-xl font-black text-[10px] uppercase shadow-neon transition-transform active:scale-95">Make Dadaz Account</button>
            )}
          </div>
        )
      })}
    </div>
  );
}

// ============================================================
// 2. MANAGE VIDEOS (UPLOADING)
// ============================================================
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
    // Nimeongeza price_tsh hapa ili kuzuia database error
    const { error } = await supabase.from("videos").insert([{ 
      ...form, 
      status: 'available', 
      price_tsh: form.price_sq * 100, 
      is_published: true 
    }]);
    if (error) toast.error(error.message);
    else { toast.success("Live!"); setShowAdd(false); fetch(); }
  };

  return (
    <div className="space-y-6">
      <button onClick={() => setShowAdd(!showAdd)} className="w-full md:w-auto bg-primary py-4 px-8 rounded-2xl font-black flex items-center justify-center gap-3 shadow-neon">
        {showAdd ? "CANCEL" : "+ UPLOAD NEW VIDEO"}
      </button>

      {showAdd && (
        <form onSubmit={save} className="bg-[#111] p-6 rounded-3xl border border-primary/20 space-y-4 max-w-xl">
          <input placeholder="Title" required className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, title: e.target.value})} />
          <input placeholder="Video Link (.mp4)" required className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, video_url: e.target.value})} />
          <input placeholder="Thumbnail Link" className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <input type="number" placeholder="Price SQ" className="w-full bg-black border border-white/10 p-4 rounded-xl" onChange={e => setForm({...form, price_sq: Number(e.target.value)})} />
          <button className="w-full bg-white text-black py-4 rounded-xl font-black">PUBLISH NOW</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {vids.map(v => (
          <div key={v.id} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
            <span className="font-bold truncate pr-4">{v.title}</span>
            <button onClick={async () => { await supabase.from("videos").delete().eq("id", v.id); fetch(); }} className="text-red-500"><Trash2 size={18}/></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// 3. DADAZ MANAGER (VERIFICATION)
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
    toast.success("Updated!"); fetch();
  };

  return (
    <div className="space-y-3">
      {dadaz.map(d => (
        <div key={d.id} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex justify-between items-center">
          <div><p className="font-black">@{d.username}</p><p className="text-[10px] text-muted-foreground uppercase">{d.location}</p></div>
          <button onClick={() => verify(d.id, d.is_admin_approved)} className={`p-3 rounded-xl ${d.is_admin_approved ? "bg-green-500" : "bg-white/5"}`}><CheckCircle size={20}/></button>
        </div>
      ))}
    </div>
  );
}

// ============================================================
// 4. REDEEM & SETTINGS (SIMPLE)
// ============================================================
function RedeemManager() {
  const [codes, setCodes] = useState<any[]>([]);
  const fetch = async () => {
    const { data } = await supabase.from("redeem_links").select("*");
    setCodes(data || []);
  };
  useEffect(() => { fetch(); }, []);

  const generate = async () => {
    const code = "UP-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    await supabase.from("redeem_links").insert({ code, coins_sq: 10, max_uses: 1, is_active: true });
    toast.success("Code Created!"); fetch();
  };

  return (
    <div className="space-y-4">
      <button onClick={generate} className="w-full bg-primary py-4 rounded-xl font-black">GENERATE 10 SQ CODE</button>
      {codes.map(c => (
        <div key={c.id} className="p-4 bg-[#111] rounded-xl border border-white/5 flex justify-between font-mono">
          <span className="text-primary">{c.code}</span>
          <span>{c.coins_sq} SQ</span>
        </div>
      ))}
    </div>
  );
}

function SettingsManager() {
  const [rate, setRate] = useState("100");
  const save = async () => {
    await supabase.from("app_settings").upsert({ key: "sq_to_tsh", value: rate });
    toast.success("Saved!");
  };
  return (
    <div className="bg-[#111] p-6 rounded-3xl border border-white/5 space-y-4 max-w-sm">
      <label className="text-xs font-bold uppercase text-muted-foreground">SQ to TSh Rate</label>
      <input value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-black border border-white/10 p-4 rounded-xl" />
      <button onClick={save} className="w-full bg-white text-black py-4 rounded-xl font-bold">SAVE</button>
    </div>
  );
}