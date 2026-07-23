
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";

// ============================================================
// ROUTE – Password protected
// ============================================================
export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

// ============================================================
// MAIN COMPONENT
// ============================================================
function AdminDashboard() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");

  useEffect(() => {
    const isAuth = localStorage.getItem("admin_authenticated") === "true";
    setAuthenticated(isAuth);
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "STANY#MINES") {
      localStorage.setItem("admin_authenticated", "true");
      setAuthenticated(true);
      setError("");
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
      <div className="flex items-center justify-center min-h-screen bg-muted/30 px-4">
        <div className="max-w-md w-full bg-card rounded-2xl shadow-xl border border-border p-6">
          <div className="text-center mb-6">
            <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
              <i className="fas fa-lock text-2xl text-primary-foreground"></i>
            </div>
            <h1 className="text-2xl font-black bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
              Admin Access
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Enter the secure password</p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-input px-4 py-3 text-sm outline-none focus:border-primary transition"
              autoFocus
            />
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            <button
              type="submit"
              className="mt-4 w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] hover:opacity-90 transition"
            >
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: "fa-chart-line" },
    { id: "users", label: "Users", icon: "fa-users" },
    { id: "videos", label: "Videos", icon: "fa-video" },
    { id: "categories", label: "Categories", icon: "fa-tags" },
    { id: "groups", label: "Groups", icon: "fa-users-cog" },
    { id: "business", label: "Business", icon: "fa-store" },
    { id: "stories", label: "Stories", icon: "fa-images" },
    { id: "redeem", label: "Redeem", icon: "fa-gift" },
    { id: "settings", label: "Settings", icon: "fa-cog" },
  ];

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border shadow-sm flex flex-col">
        <div className="p-5 border-b border-border bg-[image:var(--gradient-primary)] text-primary-foreground">
          <h1 className="text-xl font-black">Admin Panel</h1>
          <p className="text-xs opacity-80 mt-1">Welcome back, Admin</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <i className={`fas ${tab.icon} w-5 text-center`}></i>
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-border">
          <button
            onClick={signOut}
            className="flex items-center w-full gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 rounded-xl transition"
          >
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-y-auto">
        {activeTab === "dashboard" && <DashboardContent />}
        {activeTab === "users" && <UsersContent />}
        {activeTab === "videos" && <VideosContent />}
        {activeTab === "categories" && <CategoriesContent />}
        {activeTab === "groups" && <GroupsContent />}
        {activeTab === "business" && <BusinessContent />}
        {activeTab === "stories" && <StoriesContent />}
        {activeTab === "redeem" && <RedeemContent />}
        {activeTab === "settings" && <SettingsContent />}
      </main>
    </div>
  );
}

// ============================================================
// DASHBOARD (font normal, cards clean)
// ============================================================
function DashboardContent() {
  const [stats, setStats] = useState({ users: 0, videos: 0, groups: 0, coins: 0 });
  useEffect(() => {
    const fetchStats = async () => {
      const [{ count: users }, { count: videos }, { count: groups }, { data: wallets }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("coin_wallets").select("balance_sq"),
      ]);
      const totalCoins = wallets?.reduce((acc, w) => acc + (w.balance_sq || 0), 0) || 0;
      setStats({ users: users || 0, videos: videos || 0, groups: groups || 0, coins: totalCoins });
    };
    fetchStats();
  }, []);
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Dashboard</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Users" value={stats.users} icon="fa-users" color="blue" />
        <StatCard title="Videos" value={stats.videos} icon="fa-video" color="purple" />
        <StatCard title="Groups" value={stats.groups} icon="fa-users-cog" color="green" />
        <StatCard title="Total Coins" value={stats.coins} icon="fa-coins" color="gold" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    gold: "bg-yellow-50 text-yellow-600",
  };
  return (
    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border hover:shadow-md transition">
      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${colors[color]} mb-3`}>
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <p className="text-3xl font-bold">{value.toLocaleString()}</p>
      <p className="text-sm text-muted-foreground">{title}</p>
    </div>
  );
}

// ============================================================
// USERS (normal font, small actions)
// ============================================================
function UsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchUsers(); }, []);
  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };
  const updateRole = async (id, role) => {
    await supabase.from("profiles").update({ role }).eq("id", id);
    fetchUsers();
    toast.success("User role updated");
  };
  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    fetchUsers();
    toast.success("User deleted");
  };
  if (loading) return <Loading />;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Users</h2>
        <span className="text-sm text-muted-foreground">{users.length} total</span>
      </div>
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Phone</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2">{u.full_name || u.username || "—"}</td>
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">
                    <select
                      value={u.role || "user"}
                      onChange={e => updateRole(u.id, e.target.value)}
                      className="border border-border rounded-lg px-2 py-1 text-xs focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <option value="user">User</option>
                      <option value="business">Business</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-4 py-2">{u.phone || "—"}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => deleteUser(u.id)} className="text-destructive/70 hover:text-destructive transition">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// VIDEOS – Upload video from FILES (mobile/desktop)
// ============================================================
function VideosContent() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    price_sq: 0,
    status: "pending",
    videoFile: null,
    thumbnailFile: null,
  });
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);

  useEffect(() => { fetchVideos(); fetchCategories(); }, []);
  const fetchVideos = async () => {
    setLoading(true);
    const { data } = await supabase.from("videos").select("*, profiles(full_name)").order("created_at", { ascending: false });
    setVideos(data || []);
    setLoading(false);
  };
  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*");
    setCategories(data || []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let videoUrl = form.video_url || "";
    let thumbUrl = form.thumbnail || "";

    // Upload video file to Supabase Storage
    if (form.videoFile) {
      const file = form.videoFile;
      const filePath = `videos/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from("utamu_videos")
        .upload(filePath, file);
      if (error) {
        toast.error("Video upload failed: " + error.message);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage
        .from("utamu_videos")
        .getPublicUrl(filePath);
      videoUrl = urlData.publicUrl;
    }

    // Upload thumbnail if present
    if (form.thumbnailFile) {
      const file = form.thumbnailFile;
      const filePath = `thumbnails/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage
        .from("utamu_thumbnails")
        .upload(filePath, file);
      if (!error) {
        const { data: urlData } = supabase.storage
          .from("utamu_thumbnails")
          .getPublicUrl(filePath);
        thumbUrl = urlData.publicUrl;
      }
    }

    const payload = {
      title: form.title,
      description: form.description,
      video_url: videoUrl,
      thumbnail: thumbUrl,
      price_sq: Number(form.price_sq),
      status: form.status,
      category: form.category || null,
    };

    if (editing) {
      await supabase.from("videos").update(payload).eq("id", editing.id);
      toast.success("Video updated");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.creator_id = user.id;
      await supabase.from("videos").insert(payload);
      toast.success("Video created");
    }

    setShowForm(false);
    setEditing(null);
    setForm({ title: "", description: "", category: "", price_sq: 0, status: "pending", videoFile: null, thumbnailFile: null });
    fetchVideos();
    setUploading(false);
  };

  const deleteVideo = async (id) => {
    if (!confirm("Delete this video?")) return;
    await supabase.from("videos").delete().eq("id", id);
    fetchVideos();
    toast.success("Video deleted");
  };

  const toggleStatus = async (id, current) => {
    const newStatus = current === "available" ? "pending" : "available";
    await supabase.from("videos").update({ status: newStatus }).eq("id", id);
    fetchVideos();
    toast.success(`Status changed to ${newStatus}`);
  };

  if (loading) return <Loading />;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Videos</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", description: "", category: "", price_sq: 0, status: "pending", videoFile: null, thumbnailFile: null }); }}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-2 text-sm"
        >
          <i className="fas fa-plus"></i> Add Video
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="border border-border rounded-xl px-4 py-2 bg-input text-sm focus:ring-2 focus:ring-primary outline-none"
                required
              />
              <textarea
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="border border-border rounded-xl px-4 py-2 bg-input text-sm focus:ring-2 focus:ring-primary outline-none col-span-2"
              />
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="border border-border rounded-xl px-4 py-2 bg-input text-sm"
              >
                <option value="">Select Category</option>
                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
              <input
                type="number"
                value={form.price_sq}
                onChange={e => setForm({ ...form, price_sq: Number(e.target.value) })}
                placeholder="Price in SQ"
                className="border border-border rounded-xl px-4 py-2 bg-input text-sm"
              />
              <select
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
                className="border border-border rounded-xl px-4 py-2 bg-input text-sm"
              >
                <option value="pending">Pending</option>
                <option value="available">Available</option>
              </select>

              {/* File upload inputs (mobile friendly) */}
              <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={e => setForm({ ...form, videoFile: e.target.files?.[0] || null })}
                    className="w-full border border-border rounded-xl px-4 py-2 bg-input text-sm file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Tap to choose video from device</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Thumbnail (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => setForm({ ...form, thumbnailFile: e.target.files?.[0] || null })}
                    className="w-full border border-border rounded-xl px-4 py-2 bg-input text-sm file:mr-2 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Optional image</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={uploading}
                className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition text-sm"
              >
                {uploading ? <i className="fas fa-spinner fa-spin mr-1"></i> : null}
                {editing ? "Update" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-border px-6 py-2 rounded-xl hover:bg-muted transition text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Title</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Category</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {videos.map(v => (
                <tr key={v.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2">{v.title}</td>
                  <td className="px-4 py-2">{v.category || "—"}</td>
                  <td className="px-4 py-2">{v.price_sq} SQ</td>
                  <td className="px-4 py-2">
                    <button onClick={() => toggleStatus(v.id, v.status)} className={`px-3 py-1 rounded-full text-xs font-semibold ${v.status === "available" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {v.status}
                    </button>
                  </td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => { setEditing(v); setForm({ ...v, videoFile: null, thumbnailFile: null }); setShowForm(true); }} className="text-primary hover:opacity-80 transition">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => deleteVideo(v.id)} className="text-destructive/70 hover:text-destructive transition">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CATEGORIES (compact)
// ============================================================
function CategoriesContent() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);

  useEffect(() => { fetchCategories(); }, []);
  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };
  const addCategory = async () => {
    if (!newName.trim()) return;
    await supabase.from("categories").insert({ name: newName.trim() });
    setNewName("");
    fetchCategories();
    toast.success("Category added");
  };
  const updateCategory = async (id, name) => {
    await supabase.from("categories").update({ name }).eq("id", id);
    setEditing(null);
    fetchCategories();
    toast.success("Category updated");
  };
  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
    toast.success("Category deleted");
  };
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Categories</h2>
      <div className="flex gap-3 mb-4">
        <input
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="New category name"
          className="flex-1 border border-border rounded-xl px-4 py-2 bg-input text-sm focus:ring-2 focus:ring-primary outline-none"
        />
        <button onClick={addCategory} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition text-sm">
          <i className="fas fa-plus mr-1"></i> Add
        </button>
      </div>
      <ul className="bg-card rounded-2xl shadow-sm border border-border divide-y divide-border">
        {categories.map(c => (
          <li key={c.id} className="flex items-center justify-between px-5 py-3">
            {editing === c.id ? (
              <div className="flex gap-2 flex-1">
                <input defaultValue={c.name} onBlur={e => updateCategory(c.id, e.target.value)} className="flex-1 border border-border rounded-lg px-3 py-1 bg-input text-sm" autoFocus />
                <button onClick={() => setEditing(null)} className="text-muted-foreground hover:text-foreground text-sm">Cancel</button>
              </div>
            ) : (
              <>
                <span>{c.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(c.id)} className="text-primary hover:opacity-80 transition">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className="text-destructive/70 hover:text-destructive transition">
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ============================================================
// GROUPS (compact)
// ============================================================
function GroupsContent() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", logo_url: "", link: "", price_sq: 0 });

  useEffect(() => { fetchGroups(); }, []);
  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, price_sq: Number(form.price_sq) };
    if (editing) {
      await supabase.from("groups").update(payload).eq("id", editing.id);
      toast.success("Group updated");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.created_by = user.id;
      await supabase.from("groups").insert(payload);
      toast.success("Group created");
    }
    setShowForm(false); setEditing(null); setForm({ name: "", description: "", logo_url: "", link: "", price_sq: 0 });
    fetchGroups();
  };
  const deleteGroup = async (id) => {
    if (!confirm("Delete this group?")) return;
    await supabase.from("groups").delete().eq("id", id);
    fetchGroups();
    toast.success("Group deleted");
  };
  if (loading) return <Loading />;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Groups</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", logo_url: "", link: "", price_sq: 0 }); }} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-2 text-sm">
          <i className="fas fa-plus"></i> Add Group
        </button>
      </div>
      {showForm && (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" required />
            <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" />
            <input value={form.logo_url} onChange={e => setForm({ ...form, logo_url: e.target.value })} placeholder="Logo URL" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" />
            <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="Group Link" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" required />
            <input type="number" value={form.price_sq} onChange={e => setForm({ ...form, price_sq: Number(e.target.value) })} placeholder="Price in SQ (0=free)" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" />
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition text-sm">
                {editing ? "Update" : "Save"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border px-6 py-2 rounded-xl hover:bg-muted transition text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Members</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Link</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map(g => (
                <tr key={g.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2">{g.name}</td>
                  <td className="px-4 py-2">{g.members || 0}</td>
                  <td className="px-4 py-2">{g.price_sq === 0 ? "Free" : `${g.price_sq} SQ`}</td>
                  <td className="px-4 py-2"><a href={g.link} target="_blank" rel="noreferrer" className="text-primary hover:underline">Link</a></td>
                  <td className="px-4 py-2 flex gap-2">
                    <button onClick={() => { setEditing(g); setForm(g); setShowForm(true); }} className="text-primary hover:opacity-80 transition">
                      <i className="fas fa-edit"></i>
                    </button>
                    <button onClick={() => deleteGroup(g.id)} className="text-destructive/70 hover:text-destructive transition">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// BUSINESS (compact)
// ============================================================
function BusinessContent() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    whatsapp: "", phone: "", location: "", services: "",
    contact_price: 0, service_prices: "{}",
    is_confirmed: false, is_approved: true,
  });

  useEffect(() => { fetchBusinesses(); }, []);
  const fetchBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select(`
        id, full_name, email, username, phone, avatar_url, location, bio, status, is_approved, role,
        business_contacts ( id, whatsapp, phone, location, services, contact_price, service_prices, is_confirmed ),
        coin_wallets ( balance_sq )
      `)
      .eq("role", "business")
      .order("created_at", { ascending: false });
    setBusinesses(data || []);
    setLoading(false);
  };

  const openEditModal = (biz) => {
    const contact = biz.business_contacts?.[0] || {};
    setEditing(biz);
    setForm({
      whatsapp: contact.whatsapp || "",
      phone: contact.phone || biz.phone || "",
      location: contact.location || biz.location || "",
      services: contact.services || "",
      contact_price: contact.contact_price || 0,
      service_prices: contact.service_prices ? JSON.stringify(contact.service_prices, null, 2) : "{}",
      is_confirmed: contact.is_confirmed || false,
      is_approved: biz.is_approved !== undefined ? biz.is_approved : true,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => { setShowEditModal(false); setEditing(null); };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);
    await supabase
      .from("profiles")
      .update({ is_approved: form.is_approved, phone: form.phone, location: form.location })
      .eq("id", editing.id);
    const contact = editing.business_contacts?.[0];
    const payload = {
      business_id: editing.id,
      whatsapp: form.whatsapp,
      phone: form.phone,
      location: form.location,
      services: form.services,
      contact_price: Number(form.contact_price),
      service_prices: form.service_prices ? JSON.parse(form.service_prices) : {},
      is_confirmed: form.is_confirmed,
    };
    if (contact) {
      await supabase.from("business_contacts").update(payload).eq("id", contact.id);
    } else {
      await supabase.from("business_contacts").insert(payload);
    }
    toast.success("Business updated successfully");
    closeEditModal();
    fetchBusinesses();
  };

  const toggleApproval = async (id, current) => {
    await supabase.from("profiles").update({ is_approved: !current }).eq("id", id);
    fetchBusinesses();
    toast.success(`Business ${!current ? "approved" : "deactivated"}`);
  };

  const deleteBusinessContact = async (id) => {
    if (!confirm("Delete this business contact?")) return;
    await supabase.from("business_contacts").delete().eq("business_id", id);
    fetchBusinesses();
    toast.success("Business contact deleted");
  };

  if (loading && !showEditModal) return <Loading />;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Business (Dadaz) Accounts</h2>
        <span className="text-sm text-muted-foreground">{businesses.length} total</span>
      </div>
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">WhatsApp</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Services</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Price</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Approved</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Balance</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businesses.map(b => {
                const contact = b.business_contacts?.[0];
                return (
                  <tr key={b.id} className="hover:bg-muted/30 transition">
                    <td className="px-4 py-2 flex items-center gap-2">
                      <img src={b.avatar_url || "/default-avatar.png"} alt={b.full_name} className="w-6 h-6 rounded-full object-cover" />
                      {b.full_name || b.username || "—"}
                    </td>
                    <td className="px-4 py-2">{b.email}</td>
                    <td className="px-4 py-2">{contact?.whatsapp ? <a href={`https://wa.me/${contact.whatsapp}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">{contact.whatsapp}</a> : "—"}</td>
                    <td className="px-4 py-2 text-xs truncate max-w-[120px]">{contact?.services || "—"}</td>
                    <td className="px-4 py-2">{contact?.contact_price || 0} SQ</td>
                    <td className="px-4 py-2">
                      <button onClick={() => toggleApproval(b.id, b.is_approved)} className={`px-2 py-1 rounded-full text-xs font-semibold ${b.is_approved !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {b.is_approved !== false ? "Approved" : "Pending"}
                      </button>
                    </td>
                    <td className="px-4 py-2">{contact?.is_confirmed ? <i className="fas fa-check-circle text-green-500"></i> : <i className="fas fa-times-circle text-red-500"></i>}</td>
                    <td className="px-4 py-2 font-semibold">{b.coin_wallets?.[0]?.balance_sq || 0} SQ</td>
                    <td className="px-4 py-2 flex gap-2">
                      <button onClick={() => openEditModal(b)} className="text-primary hover:opacity-80 transition">
                        <i className="fas fa-edit"></i>
                      </button>
                      {contact && <button onClick={() => deleteBusinessContact(b.id)} className="text-destructive/70 hover:text-destructive transition">
                        <i className="fas fa-trash-alt"></i>
                      </button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Edit Business: {editing.full_name}</h2>
              <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                <i className="fas fa-times text-xl"></i>
              </button>
            </div>
            <form onSubmit={handleSaveBusiness} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">WhatsApp Number</label>
                  <input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} placeholder="2557XXXXXXXX" className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Phone Number</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="2557XXXXXXXX" className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground">Location</label>
                  <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. Dar es Salaam" className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-muted-foreground">Services Description</label>
                  <textarea value={form.services} onChange={e => setForm({ ...form, services: e.target.value })} placeholder="e.g. Massage, Consultation, Delivery" rows={2} className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Contact Price (SQ)</label>
                  <input type="number" value={form.contact_price} onChange={e => setForm({ ...form, contact_price: Number(e.target.value) })} placeholder="10" className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Approved</label>
                  <select value={form.is_approved ? "true" : "false"} onChange={e => setForm({ ...form, is_approved: e.target.value === "true" })} className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm">
                    <option value="true">Yes</option><option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Contact Confirmed</label>
                  <select value={form.is_confirmed ? "true" : "false"} onChange={e => setForm({ ...form, is_confirmed: e.target.value === "true" })} className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm">
                    <option value="true">Yes</option><option value="false">No</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">Service Prices (JSON)</label>
                  <input value={form.service_prices} onChange={e => setForm({ ...form, service_prices: e.target.value })} placeholder='{"massage": 10, "consultation": 5}' className="w-full border border-border rounded-xl px-3 py-2 bg-input text-sm font-mono" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition text-sm">
                  <i className="fas fa-save mr-1"></i> Save Changes
                </button>
                <button type="button" onClick={closeEditModal} className="border border-border px-6 py-2 rounded-xl hover:bg-muted transition text-sm">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// STORIES (compact)
// ============================================================
function StoriesContent() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchStories(); }, []);
  const fetchStories = async () => {
    setLoading(true);
    const { data } = await supabase.from("stories").select("*, profiles(full_name)").order("created_at", { ascending: false });
    setStories(data || []);
    setLoading(false);
  };
  const updateStatus = async (id, status) => {
    await supabase.from("stories").update({ status }).eq("id", id);
    fetchStories();
    toast.success(`Story ${status}`);
  };
  const deleteStory = async (id) => {
    if (!confirm("Delete this story?")) return;
    await supabase.from("stories").delete().eq("id", id);
    fetchStories();
    toast.success("Deleted");
  };
  if (loading) return <Loading />;
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">Stories</h2>
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Expires</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stories.map(s => (
                <tr key={s.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2">{s.profiles?.full_name || "—"}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${s.status === "approved" ? "bg-green-100 text-green-700" : s.status === "rejected" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-2 flex gap-2">
                    {s.status !== "approved" && <button onClick={() => updateStatus(s.id, "approved")} className="text-green-500 hover:opacity-80"><i className="fas fa-check"></i></button>}
                    {s.status !== "rejected" && <button onClick={() => updateStatus(s.id, "rejected")} className="text-red-500 hover:opacity-80"><i className="fas fa-times"></i></button>}
                    <button onClick={() => deleteStory(s.id)} className="text-destructive/70 hover:text-destructive"><i className="fas fa-trash-alt"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// REDEEM (compact)
// ============================================================
function RedeemContent() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", coins: 10, max_uses: 1, expires_at: "" });
  useEffect(() => { fetchLinks(); }, []);
  const fetchLinks = async () => {
    setLoading(true);
    const { data } = await supabase.from("redeem_links").select("*").order("created_at", { ascending: false });
    setLinks(data || []);
    setLoading(false);
  };
  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i=0; i<8; i++) code += chars[Math.floor(Math.random()*chars.length)];
    return code;
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, coins: Number(form.coins), max_uses: Number(form.max_uses) };
    if (!payload.code) payload.code = generateCode();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) payload.created_by = user.id;
    await supabase.from("redeem_links").insert(payload);
    toast.success("Redeem link created");
    setShowForm(false);
    setForm({ code: "", coins: 10, max_uses: 1, expires_at: "" });
    fetchLinks();
  };
  const deleteLink = async (id) => {
    if (!confirm("Delete this link?")) return;
    await supabase.from("redeem_links").delete().eq("id", id);
    fetchLinks();
    toast.success("Deleted");
  };
  if (loading) return <Loading />;
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Redeem Links</h2>
        <button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground px-4 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-2 text-sm">
          <i className="fas fa-plus"></i> Create Link
        </button>
      </div>
      {showForm && (
        <div className="bg-card p-6 rounded-2xl shadow-sm border border-border mb-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="Code (leave blank to auto-generate)" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" />
            <input type="number" value={form.coins} onChange={e => setForm({ ...form, coins: Number(e.target.value) })} placeholder="Coins" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" required />
            <input type="number" value={form.max_uses} onChange={e => setForm({ ...form, max_uses: Number(e.target.value) })} placeholder="Max uses" className="border border-border rounded-xl px-4 py-2 bg-input text-sm" required />
            <input type="datetime-local" value={form.expires_at} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="border border-border rounded-xl px-4 py-2 bg-input text-sm" required />
            <div className="flex gap-3 md:col-span-2">
              <button type="submit" className="bg-primary text-primary-foreground px-6 py-2 rounded-xl font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition text-sm">
                Save
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border px-6 py-2 rounded-xl hover:bg-muted transition text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Code</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Coins</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Used / Max</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Expires</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map(l => (
                <tr key={l.id} className="hover:bg-muted/30 transition">
                  <td className="px-4 py-2 font-mono text-xs">{l.code}</td>
                  <td className="px-4 py-2">{l.coins}</td>
                  <td className="px-4 py-2">{l.used || 0} / {l.max_uses}</td>
                  <td className="px-4 py-2">{l.expires_at ? new Date(l.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-2">
                    <button onClick={() => deleteLink(l.id)} className="text-destructive/70 hover:text-destructive transition">
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SETTINGS (compact)
// ============================================================
function SettingsContent() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => { fetchSettings(); }, []);
  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("*");
    const obj = {};
    data?.forEach(item => obj[item.key] = item.value);
    setSettings(obj);
    setLoading(false);
  };
  const updateSetting = async (key, value) => {
    await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    setSettings(prev => ({ ...prev, [key]: value }));
    toast.success("Setting updated");
  };
  if (loading) return <Loading />;
  return (
    <div>
      <h2 className="text-xl font-bold mb-6">App Settings</h2>
      <div className="bg-card p-6 rounded-2xl shadow-sm border border-border space-y-4">
        <div>
          <label className="block text-sm font-medium text-muted-foreground">SQ to TSh Rate</label>
          <input type="number" value={settings.sq_to_tsh || "100"} onChange={e => updateSetting("sq_to_tsh", e.target.value)} className="border border-border rounded-xl px-4 py-2 bg-input text-sm w-48" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Support WhatsApp Number</label>
          <input type="text" value={settings.support_whatsapp || ""} onChange={e => updateSetting("support_whatsapp", e.target.value)} className="border border-border rounded-xl px-4 py-2 bg-input text-sm w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">WhatsApp Channel Link</label>
          <input type="text" value={settings.whatsapp_channel || ""} onChange={e => updateSetting("whatsapp_channel", e.target.value)} className="border border-border rounded-xl px-4 py-2 bg-input text-sm w-full" />
        </div>
        <div>
          <label className="block text-sm font-medium text-muted-foreground">Support Email</label>
          <input type="email" value={settings.support_email || ""} onChange={e => updateSetting("support_email", e.target.value)} className="border border-border rounded-xl px-4 py-2 bg-input text-sm w-full" />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOADING SPINNER
// ============================================================
function Loading() {
  return (
    <div className="flex justify-center items-center h-40">
      <i className="fas fa-spinner fa-spin text-3xl text-primary"></i>
    </div>
  );
}