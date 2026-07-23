import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Log in kwanza mkuu.");

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      throw new Error("Wewe siyo Admin!");
    }
    return { user };
  },
  component: AdminDashboard,
});

function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "Overview", icon: "fa-chart-line" },
    { id: "videos", label: "Manage Videos", icon: "fa-video" },
    { id: "groups", label: "Manage Groups", icon: "fa-users-cog" },
    { id: "business", label: "Dadaz (Profiles)", icon: "fa-female" },
    { id: "redeem", label: "Redeem Codes", icon: "fa-gift" },
    { id: "settings", label: "App Settings", icon: "fa-cogs" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white">
      <Toaster position="top-right" richColors />
      
      {/* Sidebar */}
      <aside className="w-64 bg-[#141414] border-r border-white/10 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/10 bg-gradient-to-r from-pink-600 to-purple-600">
          <h1 className="text-xl font-black italic tracking-tighter">UTAMU ADMIN</h1>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id ? "bg-primary text-white shadow-neon" : "text-muted-foreground hover:bg-white/5"
              }`}
            >
              <i className={`fas ${tab.icon} w-5 text-center`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {activeTab === "dashboard" && <DashboardOverview />}
        {activeTab === "videos" && <ManageVideos />}
        {activeTab === "groups" && <ManageGroups />}
        {activeTab === "business" && <ManageDadaz />}
        {activeTab === "settings" && <AppSettings />}
        {activeTab === "redeem" && <ManageRedeem />}
      </main>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function DashboardOverview() {
  const [stats, setStats] = useState({ users: 0, videos: 0, sales: 0 });

  useEffect(() => {
    const load = async () => {
      const { count: u } = await supabase.from("profiles").select("*", { count: "exact", head: true });
      const { count: v } = await supabase.from("videos").select("*", { count: "exact", head: true });
      setStats({ users: u || 0, videos: v || 0, sales: 0 });
    };
    load();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      <div className="bg-card p-6 rounded-3xl border border-white/10 shadow-xl">
        <i className="fas fa-users text-primary text-3xl mb-4"></i>
        <h3 className="text-muted-foreground text-xs font-bold uppercase">Total Users</h3>
        <p className="text-4xl font-black">{stats.users}</p>
      </div>
      <div className="bg-card p-6 rounded-3xl border border-white/10 shadow-xl">
        <i className="fas fa-play-circle text-secondary text-3xl mb-4"></i>
        <h3 className="text-muted-foreground text-xs font-bold uppercase">Videos Live</h3>
        <p className="text-4xl font-black">{stats.videos}</p>
      </div>
      <div className="bg-card p-6 rounded-3xl border border-white/10 shadow-xl">
        <i className="fas fa-coins text-yellow-500 text-3xl mb-4"></i>
        <h3 className="text-muted-foreground text-xs font-bold uppercase">SQ Sales</h3>
        <p className="text-4xl font-black">0</p>
      </div>
    </div>
  );
}

function ManageVideos() {
  const [videos, setVideos] = useState<any[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", video_url: "", price_sq: 0, thumbnail_url: "" });

  const fetchVids = async () => {
    const { data } = await supabase.from("videos").select("*").order("created_at", { ascending: false });
    setVideos(data || []);
  };

  useEffect(() => { fetchVids(); }, []);

  const handleAdd = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("videos").insert([{ 
        ...form, 
        status: "available",
        price_tsh: form.price_sq * 100 // 1 SQ = 100 TSh logic
    }]);
    if (error) toast.error(error.message);
    else {
        toast.success("Video imeongezwa!");
        setShowAdd(false);
        fetchVids();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black">Videos</h2>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-primary px-6 py-2 rounded-full font-bold text-sm shadow-neon">
          {showAdd ? "Funga" : "+ Add Video"}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="bg-card p-6 rounded-3xl border border-white/10 space-y-4 max-w-xl">
          <input placeholder="Video Title" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-sm" 
            onChange={e => setForm({...form, title: e.target.value})} required />
          <input placeholder="Video URL (Direct link .mp4)" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-sm" 
            onChange={e => setForm({...form, video_url: e.target.value})} required />
          <input placeholder="Thumbnail URL" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-sm" 
            onChange={e => setForm({...form, thumbnail_url: e.target.value})} />
          <input type="number" placeholder="Price in SQ (0 for Free)" className="w-full bg-black/50 border border-white/10 p-3 rounded-xl text-sm" 
            onChange={e => setForm({...form, price_sq: Number(e.target.value)})} required />
          <button className="w-full bg-secondary text-black font-black py-3 rounded-xl uppercase tracking-tighter">Publish Video</button>
        </form>
      )}

      <div className="grid grid-cols-1 gap-3">
        {videos.map(v => (
          <div key={v.id} className="bg-card p-4 rounded-2xl border border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={v.thumbnail_url || "https://via.placeholder.com/50"} className="w-12 h-12 rounded-lg object-cover" />
              <div>
                <p className="font-bold text-sm">{v.title}</p>
                <p className="text-[10px] text-muted-foreground uppercase">{v.price_sq} SQ · {v.status}</p>
              </div>
            </div>
            <button onClick={async () => { 
                await supabase.from("videos").delete().eq("id", v.id);
                fetchVids();
                toast.error("Imeondolewa");
            }} className="text-red-500 p-2"><i className="fas fa-trash"></i></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function ManageDadaz() {
    return <div className="p-10 text-center text-muted-foreground italic">Sehemu ya Dadaz inakuja hapa...</div>;
}

function AppSettings() {
    const [rate, setRate] = useState("100");

    const save = async () => {
        await supabase.from("app_settings").upsert({ key: "sq_to_tsh", value: rate });
        toast.success("Settings zimehifadhiwa!");
    };

    return (
        <div className="max-w-md space-y-6">
            <h2 className="text-2xl font-black">Settings</h2>
            <div className="bg-card p-6 rounded-3xl border border-white/10 space-y-4">
                <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase ml-1">SQ to TSh Exchange Rate</label>
                    <input value={rate} onChange={e => setRate(e.target.value)} className="w-full bg-black/50 border border-white/10 p-3 rounded-xl mt-1" />
                </div>
                <button onClick={save} className="w-full bg-primary font-black py-3 rounded-xl shadow-neon">SAVE SETTINGS</button>
            </div>
        </div>
    );
}

function ManageRedeem() { return null; }

function Loading() {
  return (
    <div className="flex justify-center items-center h-32">
      <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
    </div>
  );
}