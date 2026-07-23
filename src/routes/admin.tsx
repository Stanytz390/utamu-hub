import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminDashboard,
});

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
        <div className="max-w-sm w-full bg-card rounded-2xl shadow-xl border border-border p-5">
          <div className="text-center mb-5">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
              <i className="fas fa-lock text-xl text-primary-foreground"></i>
            </div>
            <h1 className="text-xl font-black bg-[image:var(--gradient-primary)] bg-clip-text text-transparent">
              Admin Access
            </h1>
            <p className="text-xs text-muted-foreground mt-1">Enter password</p>
          </div>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-input px-4 py-2.5 text-sm outline-none focus:border-primary transition"
              autoFocus
            />
            {error && <p className="text-xs text-destructive mt-2">{error}</p>}
            <button
              type="submit"
              className="mt-3 w-full rounded-xl bg-primary py-2.5 font-bold text-sm text-primary-foreground shadow-[var(--shadow-neon)] hover:opacity-90 transition"
            >
              Unlock
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
      {/* Sidebar - mobile: hidden by default, shown via toggle */}
      <aside className="w-56 bg-card border-r border-border shadow-sm flex flex-col fixed inset-y-0 left-0 z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out md:relative md:flex">
        <div className="p-4 border-b border-border bg-[image:var(--gradient-primary)] text-primary-foreground">
          <h1 className="text-base font-black">Admin</h1>
          <p className="text-[10px] opacity-80 mt-0.5">Welcome back</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center w-full gap-2 px-3 py-2 rounded-lg text-xs font-medium transition ${
                activeTab === tab.id
                  ? "bg-primary/10 text-primary shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <i className={`fas ${tab.icon} w-4 text-center text-sm`}></i>
              <span className="truncate">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <button
            onClick={signOut}
            className="flex items-center w-full gap-2 px-3 py-2 text-xs text-destructive hover:bg-destructive/10 rounded-lg transition"
          >
            <i className="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile header with menu toggle */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border p-3 flex items-center justify-between">
        <button
          onClick={() => {
            const sidebar = document.querySelector("aside");
            if (sidebar) {
              sidebar.classList.toggle("-translate-x-full");
            }
          }}
          className="text-foreground"
        >
          <i className="fas fa-bars text-lg"></i>
        </button>
        <h1 className="text-sm font-bold">Admin Panel</h1>
        <button onClick={signOut} className="text-destructive text-sm">
          <i className="fas fa-sign-out-alt"></i>
        </button>
      </div>

      {/* Main content - with padding for mobile header */}
      <main className="flex-1 p-3 md:p-5 overflow-y-auto mt-14 md:mt-0">
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
// DASHBOARD – Small cards
// ============================================================
function DashboardContent() {
  const [stats, setStats] = useState({ users: 0, videos: 0, groups: 0, coins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [
        { count: users },
        { count: videos },
        { count: groups },
        { data: wallets }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase.from("coin_wallets").select("balance_sq"),
      ]);
      const totalCoins = wallets?.reduce((acc, w) => acc + (w.balance_sq || 0), 0) || 0;
      setStats({
        users: users || 0,
        videos: videos || 0,
        groups: groups || 0,
        coins: totalCoins,
      });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 gap-2">
        <SmallStatCard title="Users" value={stats.users} icon="fa-users" color="blue" />
        <SmallStatCard title="Videos" value={stats.videos} icon="fa-video" color="purple" />
        <SmallStatCard title="Groups" value={stats.groups} icon="fa-users-cog" color="green" />
        <SmallStatCard title="Coins" value={stats.coins} icon="fa-coins" color="gold" />
      </div>
      <div className="mt-3 bg-card p-3 rounded-xl border border-border">
        <p className="text-xs text-muted-foreground">
          <i className="fas fa-info-circle mr-1"></i>
          Add data to see it here.
        </p>
      </div>
    </div>
  );
}

function SmallStatCard({ title, value, icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    gold: "bg-yellow-50 text-yellow-600",
  };
  return (
    <div className="bg-card p-3 rounded-xl shadow-sm border border-border">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${colors[color]} mb-1`}>
        <i className={`fas ${icon} text-sm`}></i>
      </div>
      <p className="text-xl font-bold">{value.toLocaleString()}</p>
      <p className="text-[10px] text-muted-foreground">{title}</p>
    </div>
  );
}

// ============================================================
// USERS
// ============================================================
function UsersContent() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const updateRole = async (id, role) => {
    await supabase.from("profiles").update({ role }).eq("id", id);
    fetchUsers();
    toast.success("Role updated");
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    fetchUsers();
    toast.success("Deleted");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Users</h2>
        <span className="text-xs text-muted-foreground">{users.length}</span>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Role</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30 transition">
                  <td className="px-2 py-2">{u.full_name || u.username || "—"}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{u.email}</td>
                  <td className="px-2 py-2">
                    <select
                      value={u.role || "user"}
                      onChange={(e) => updateRole(u.id, e.target.value)}
                      className="border border-border rounded-lg px-1 py-0.5 text-[10px] focus:ring-1 focus:ring-primary outline-none"
                    >
                      <option value="user">User</option>
                      <option value="business">Business</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => deleteUser(u.id)} className="text-destructive/70 hover:text-destructive">
                      <i className="fas fa-trash-alt text-xs"></i>
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
// VIDEOS
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

  useEffect(() => { fetchVideos(); fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let videoUrl = form.video_url || "";
    let thumbUrl = form.thumbnail || "";

    if (form.videoFile) {
      const file = form.videoFile;
      const filePath = `videos/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("utamu_videos").upload(filePath, file);
      if (error) {
        toast.error("Upload failed: " + error.message);
        setUploading(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("utamu_videos").getPublicUrl(filePath);
      videoUrl = urlData.publicUrl;
    }

    if (form.thumbnailFile) {
      const file = form.thumbnailFile;
      const filePath = `thumbnails/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from("utamu_thumbnails").upload(filePath, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("utamu_thumbnails").getPublicUrl(filePath);
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
    if (!confirm("Delete?")) return;
    await supabase.from("videos").delete().eq("id", id);
    fetchVideos();
    toast.success("Deleted");
  };

  const toggleStatus = async (id, current) => {
    const newStatus = current === "available" ? "pending" : "available";
    await supabase.from("videos").update({ status: newStatus }).eq("id", id);
    fetchVideos();
    toast.success(`Status: ${newStatus}`);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Videos</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", description: "", category: "", price_sq: 0, status: "pending", videoFile: null, thumbnailFile: null }); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-1 text-xs"
        >
          <i className="fas fa-plus text-xs"></i> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-3 rounded-xl shadow-sm border border-border mb-3">
          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 gap-2">
              <input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Title"
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs focus:ring-1 focus:ring-primary outline-none"
                required
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs focus:ring-1 focus:ring-primary outline-none"
              />
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs"
                >
                  <option value="">Category</option>
                  {categories.map((c) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
                <input
                  type="number"
                  value={form.price_sq}
                  onChange={(e) => setForm({ ...form, price_sq: Number(e.target.value) })}
                  placeholder="Price SQ"
                  className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs"
                />
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs col-span-2"
                >
                  <option value="pending">Pending</option>
                  <option value="available">Available</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-muted-foreground">Video File</label>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setForm({ ...form, videoFile: e.target.files?.[0] || null })}
                    className="w-full border border-border rounded-lg px-2 py-1 bg-input text-xs file:mr-1 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:bg-primary file:text-primary-foreground"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-muted-foreground">Thumbnail</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setForm({ ...form, thumbnailFile: e.target.files?.[0] || null })}
                    className="w-full border border-border rounded-lg px-2 py-1 bg-input text-xs file:mr-1 file:py-0.5 file:px-2 file:rounded-full file:border-0 file:text-[10px] file:bg-primary file:text-primary-foreground"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={uploading}
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition"
              >
                {uploading ? <i className="fas fa-spinner fa-spin"></i> : (editing ? "Update" : "Save")}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="border border-border px-4 py-1.5 rounded-lg text-xs hover:bg-muted transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Title</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Category</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Price</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {videos.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30 transition">
                  <td className="px-2 py-2 max-w-[80px] truncate">{v.title}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{v.category || "—"}</td>
                  <td className="px-2 py-2">{v.price_sq}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => toggleStatus(v.id, v.status)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        v.status === "available" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {v.status === "available" ? "✓" : "⏳"}
                    </button>
                  </td>
                  <td className="px-2 py-2 flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(v);
                        setForm({ ...v, videoFile: null, thumbnailFile: null });
                        setShowForm(true);
                      }}
                      className="text-primary hover:opacity-80"
                    >
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button onClick={() => deleteVideo(v.id)} className="text-destructive/70 hover:text-destructive">
                      <i className="fas fa-trash-alt text-xs"></i>
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
// CATEGORIES
// ============================================================
function CategoriesContent() {
  const [categories, setCategories] = useState([]);
  const [newName, setNewName] = useState("");
  const [editing, setEditing] = useState(null);

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("name");
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, []);

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
    toast.success("Updated");
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
    toast.success("Deleted");
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Categories</h2>
      <div className="flex gap-2 mb-3">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="New category"
          className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-input text-xs focus:ring-1 focus:ring-primary outline-none"
        />
        <button onClick={addCategory} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition">
          <i className="fas fa-plus"></i>
        </button>
      </div>
      <ul className="bg-card rounded-xl shadow-sm border border-border divide-y divide-border">
        {categories.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-3 py-2">
            {editing === c.id ? (
              <div className="flex gap-2 flex-1">
                <input
                  defaultValue={c.name}
                  onBlur={(e) => updateCategory(c.id, e.target.value)}
                  className="flex-1 border border-border rounded-lg px-2 py-1 bg-input text-xs"
                  autoFocus
                />
                <button onClick={() => setEditing(null)} className="text-muted-foreground text-xs">Cancel</button>
              </div>
            ) : (
              <>
                <span className="text-sm">{c.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => setEditing(c.id)} className="text-primary">
                    <i className="fas fa-edit text-xs"></i>
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className="text-destructive/70">
                    <i className="fas fa-trash-alt text-xs"></i>
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
// GROUPS
// ============================================================
function GroupsContent() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "", logo_url: "", link: "", price_sq: 0 });

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

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
    setShowForm(false);
    setEditing(null);
    setForm({ name: "", description: "", logo_url: "", link: "", price_sq: 0 });
    fetchGroups();
  };

  const deleteGroup = async (id) => {
    if (!confirm("Delete?")) return;
    await supabase.from("groups").delete().eq("id", id);
    fetchGroups();
    toast.success("Deleted");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Groups</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", logo_url: "", link: "", price_sq: 0 }); }}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-1"
        >
          <i className="fas fa-plus"></i> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-3 rounded-xl shadow-sm border border-border mb-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Name"
              className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
              required
            />
            <input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Description"
              className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
            />
            <input
              value={form.logo_url}
              onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
              placeholder="Logo URL"
              className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
            />
            <input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="Group Link"
              className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
              required
            />
            <input
              type="number"
              value={form.price_sq}
              onChange={(e) => setForm({ ...form, price_sq: Number(e.target.value) })}
              placeholder="Price SQ (0=free)"
              className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition">
                {editing ? "Update" : "Save"}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border px-4 py-1.5 rounded-lg text-xs hover:bg-muted transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Price</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Link</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30 transition">
                  <td className="px-2 py-2">{g.name}</td>
                  <td className="px-2 py-2">{g.price_sq === 0 ? "Free" : `${g.price_sq} SQ`}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">
                    <a href={g.link} target="_blank" rel="noreferrer" className="text-primary hover:underline text-[10px]">Link</a>
                  </td>
                  <td className="px-2 py-2 flex gap-1">
                    <button onClick={() => { setEditing(g); setForm(g); setShowForm(true); }} className="text-primary">
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                    <button onClick={() => deleteGroup(g.id)} className="text-destructive/70">
                      <i className="fas fa-trash-alt text-xs"></i>
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
// BUSINESS – Full CRUD with modal
// ============================================================
function BusinessContent() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    whatsapp: "",
    phone: "",
    location: "",
    services: "",
    contact_price: 0,
    service_prices: "{}",
    is_confirmed: false,
    is_approved: true,
  });

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

  useEffect(() => { fetchBusinesses(); }, []);

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

    toast.success("Business updated");
    closeEditModal();
    fetchBusinesses();
  };

  const toggleApproval = async (id, current) => {
    await supabase.from("profiles").update({ is_approved: !current }).eq("id", id);
    fetchBusinesses();
    toast.success(`Business ${!current ? "approved" : "deactivated"}`);
  };

  const deleteBusinessContact = async (id) => {
    if (!confirm("Delete?")) return;
    await supabase.from("business_contacts").delete().eq("business_id", id);
    fetchBusinesses();
    toast.success("Deleted");
  };

  if (loading && !showEditModal) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Business</h2>
        <span className="text-xs text-muted-foreground">{businesses.length}</span>
      </div>

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Name</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Balance</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businesses.map((b) => {
                const contact = b.business_contacts?.[0];
                return (
                  <tr key={b.id} className="hover:bg-muted/30 transition">
                    <td className="px-2 py-2 flex items-center gap-1">
                      <img
                        src={b.avatar_url || "/default-avatar.png"}
                        alt={b.full_name}
                        className="w-5 h-5 rounded-full object-cover"
                      />
                      <span className="truncate max-w-[60px]">{b.full_name || b.username || "—"}</span>
                    </td>
                    <td className="px-2 py-2 hidden sm:table-cell">{b.email}</td>
                    <td className="px-2 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.is_approved !== false ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                        {b.is_approved !== false ? "✓" : "✗"}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-semibold">{b.coin_wallets?.[0]?.balance_sq || 0}</td>
                    <td className="px-2 py-2 flex gap-1">
                      <button onClick={() => openEditModal(b)} className="text-primary">
                        <i className="fas fa-edit text-xs"></i>
                      </button>
                      {contact && (
                        <button onClick={() => deleteBusinessContact(b.id)} className="text-destructive/70">
                          <i className="fas fa-trash-alt text-xs"></i>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal - mobile friendly */}
      {showEditModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-10">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Edit: {editing.full_name}</h2>
              <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSaveBusiness} className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground">WhatsApp</label>
                  <input
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    placeholder="2557XXXXXXXX"
                    className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="2557XXXXXXXX"
                    className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground">Location</label>
                  <input
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="Location"
                    className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-muted-foreground">Services</label>
                  <textarea
                    value={form.services}
                    onChange={(e) => setForm({ ...form, services: e.target.value })}
                    placeholder="Services"
                    rows={2}
                    className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground">Price (SQ)</label>
                    <input
                      type="number"
                      value={form.contact_price}
                      onChange={(e) => setForm({ ...form, contact_price: Number(e.target.value) })}
                      placeholder="10"
                      className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground">Approved</label>
                    <select
                      value={form.is_approved ? "true" : "false"}
                      onChange={(e) => setForm({ ...form, is_approved: e.target.value === "true" })}
                      className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground">Confirmed</label>
                    <select
                      value={form.is_confirmed ? "true" : "false"}
                      onChange={(e) => setForm({ ...form, is_confirmed: e.target.value === "true" })}
                      className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                    >
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-muted-foreground">Service Prices (JSON)</label>
                    <input
                      value={form.service_prices}
                      onChange={(e) => setForm({ ...form, service_prices: e.target.value })}
                      placeholder='{"massage":10}'
                      className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition">
                  <i className="fas fa-save mr-1"></i> Save
                </button>
                <button type="button" onClick={closeEditModal} className="border border-border px-4 py-1.5 rounded-lg text-xs hover:bg-muted transition">
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
// STORIES
// ============================================================
function StoriesContent() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchStories = async () => {
    setLoading(true);
    const { data } = await supabase.from("stories").select("*, profiles(full_name)").order("created_at", { ascending: false });
    setStories(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchStories(); }, []);

  const updateStatus = async (id, status) => {
    await supabase.from("stories").update({ status }).eq("id", id);
    fetchStories();
    toast.success(`Story ${status}`);
  };

  const deleteStory = async (id) => {
    if (!confirm("Delete?")) return;
    await supabase.from("stories").delete().eq("id", id);
    fetchStories();
    toast.success("Deleted");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Stories</h2>
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">User</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Expires</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stories.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30 transition">
                  <td className="px-2 py-2">{s.profiles?.full_name || "—"}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      s.status === "approved" ? "bg-green-100 text-green-700" :
                      s.status === "rejected" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-700"
                    }`}>
                      {s.status === "approved" ? "✓" : s.status === "rejected" ? "✗" : "⏳"}
                    </span>
                  </td>
                  <td className="px-2 py-2 hidden sm:table-cell">{s.expires_at ? new Date(s.expires_at).toLocaleDateString() : "—"}</td>
                  <td className="px-2 py-2 flex gap-1">
                    {s.status !== "approved" && (
                      <button onClick={() => updateStatus(s.id, "approved")} className="text-green-500">
                        <i className="fas fa-check text-xs"></i>
                      </button>
                    )}
                    {s.status !== "rejected" && (
                      <button onClick={() => updateStatus(s.id, "rejected")} className="text-red-500">
                        <i className="fas fa-times text-xs"></i>
                      </button>
                    )}
                    <button onClick={() => deleteStory(s.id)} className="text-destructive/70">
                      <i className="fas fa-trash-alt text-xs"></i>
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
// REDEEM
// ============================================================
function RedeemContent() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", coins: 10, max_uses: 1, expires_at: "" });

  const fetchLinks = async () => {
    setLoading(true);
    const { data } = await supabase.from("redeem_links").select("*").order("created_at", { ascending: false });
    setLinks(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchLinks(); }, []);

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
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
    if (!confirm("Delete?")) return;
    await supabase.from("redeem_links").delete().eq("id", id);
    fetchLinks();
    toast.success("Deleted");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Redeem</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-1"
        >
          <i className="fas fa-plus"></i> Create
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-3 rounded-xl shadow-sm border border-border mb-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2">
            <input
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              placeholder="Code (auto if blank)"
              className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={form.coins}
                onChange={(e) => setForm({ ...form, coins: Number(e.target.value) })}
                placeholder="Coins"
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                required
              />
              <input
                type="number"
                value={form.max_uses}
                onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })}
                placeholder="Max uses"
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                required
              />
            </div>
            <input
              type="datetime-local"
              value={form.expires_at}
              onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
              className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
              required
            />
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition">
                Save
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border px-4 py-1.5 rounded-lg text-xs hover:bg-muted transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Code</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Coins</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground hidden sm:table-cell">Used</th>
                <th className="px-2 py-2 text-left font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30 transition">
                  <td className="px-2 py-2 font-mono text-[10px]">{l.code}</td>
                  <td className="px-2 py-2">{l.coins}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{l.used || 0} / {l.max_uses}</td>
                  <td className="px-2 py-2">
                    <button onClick={() => deleteLink(l.id)} className="text-destructive/70">
                      <i className="fas fa-trash-alt text-xs"></i>
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
// SETTINGS
// ============================================================
function SettingsContent() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("*");
    const obj = {};
    data?.forEach((item) => (obj[item.key] = item.value));
    setSettings(obj);
    setLoading(false);
  };

  useEffect(() => { fetchSettings(); }, []);

  const updateSetting = async (key, value) => {
    await supabase.from("app_settings").upsert({ key, value }, { onConflict: "key" });
    setSettings((prev) => ({ ...prev, [key]: value }));
    toast.success("Setting updated");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Settings</h2>
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-3">
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">SQ to TSh</label>
          <input
            type="number"
            value={settings.sq_to_tsh || "100"}
            onChange={(e) => updateSetting("sq_to_tsh", e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-24"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">Support WhatsApp</label>
          <input
            type="text"
            value={settings.support_whatsapp || ""}
            onChange={(e) => updateSetting("support_whatsapp", e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-full"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">WhatsApp Channel</label>
          <input
            type="text"
            value={settings.whatsapp_channel || ""}
            onChange={(e) => updateSetting("whatsapp_channel", e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-full"
          />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">Support Email</label>
          <input
            type="email"
            value={settings.support_email || ""}
            onChange={(e) => updateSetting("support_email", e.target.value)}
            className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-full"
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LOADING
// ============================================================
function Loading() {
  return (
    <div className="flex justify-center items-center h-32">
      <i className="fas fa-spinner fa-spin text-2xl text-primary"></i>
    </div>
  );
}