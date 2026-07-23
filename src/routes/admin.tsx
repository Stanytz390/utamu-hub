import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast, Toaster } from "sonner";

// ============================================================
// Route – checks admin role via user_roles
// ============================================================
export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized – Please log in.");

    // Check if user has admin role in user_roles
    const { data: roleData, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (error || !roleData) {
      throw new Error("Admin access required.");
    }

    return { user };
  },
  component: AdminDashboard,
});

// ============================================================
// Main Component
// ============================================================
function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

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

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  return (
    <div className="flex min-h-screen bg-muted/30">
      <Toaster position="top-right" richColors />
      {/* Sidebar */}
      <aside className="w-56 bg-card border-r border-border shadow-sm flex flex-col fixed inset-y-0 left-0 z-50 transform -translate-x-full md:translate-x-0 transition-transform duration-200 ease-in-out md:relative md:flex">
        <div className="p-4 border-b border-border bg-[image:var(--gradient-primary)] text-primary-foreground">
          <h1 className="text-base font-black">Admin</h1>
          <p className="text-[10px] opacity-80 mt-0.5">UTAMU PORI</p>
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

      {/* Mobile header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-card border-b border-border p-3 flex items-center justify-between">
        <button
          onClick={() => {
            const sidebar = document.querySelector("aside");
            if (sidebar) sidebar.classList.toggle("-translate-x-full");
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

      {/* Main content */}
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
// DASHBOARD
// ============================================================
function DashboardContent() {
  const [stats, setStats] = useState({ users: 0, videos: 0, groups: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const [{ count: users }, { count: videos }, { count: groups }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("videos").select("*", { count: "exact", head: true }),
        supabase.from("groups").select("*", { count: "exact", head: true }),
      ]);
      setStats({ users: users || 0, videos: videos || 0, groups: groups || 0 });
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) return <Loading />;

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 gap-2">
        <StatCard title="Users" value={stats.users} icon="fa-users" color="blue" />
        <StatCard title="Videos" value={stats.videos} icon="fa-video" color="purple" />
        <StatCard title="Groups" value={stats.groups} icon="fa-users-cog" color="green" />
        <StatCard title="Active" value="✓" icon="fa-check-circle" color="gold" />
      </div>
      <div className="mt-3 bg-card p-3 rounded-xl border border-border">
        <p className="text-xs text-muted-foreground">
          <i className="fas fa-info-circle mr-1"></i>
          Add data via the tabs above. Click <strong className="text-primary">Add</strong> to create new records.
        </p>
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
    const { data } = await supabase
      .from("profiles")
      .select("id, username, phone, avatar_url, created_at")
      .order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    await supabase.from("profiles").delete().eq("id", id);
    fetchUsers();
    toast.success("User deleted");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Users</h2>
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium">Username</th>
                <th className="px-2 py-2 text-left font-medium hidden sm:table-cell">Phone</th>
                <th className="px-2 py-2 text-left font-medium">Joined</th>
                <th className="px-2 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-muted/30">
                  <td className="px-2 py-2">{u.username || "—"}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{u.phone || "—"}</td>
                  <td className="px-2 py-2">{new Date(u.created_at).toLocaleDateString()}</td>
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
    video_url: "",
    thumbnail_url: "",
    price_tsh: 0,
    is_published: true,
    category_slug: "",
    creator: "",
    duration: "",
  });
  const [categories, setCategories] = useState([]);

  const fetchVideos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("videos")
      .select("*, categories!video_category_id_fkey (slug, label)")
      .order("created_at", { ascending: false });
    setVideos(data || []);
    setLoading(false);
  };

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("slug, label").order("sort_order");
    setCategories(data || []);
  };

  useEffect(() => { fetchVideos(); fetchCategories(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      video_url: form.video_url,
      thumbnail_url: form.thumbnail_url,
      price_tsh: Number(form.price_tsh),
      is_published: form.is_published,
      category_slug: form.category_slug || null,
      creator: form.creator || null,
      duration: form.duration || null,
    };

    if (editing) {
      await supabase.from("videos").update(payload).eq("id", editing.id);
      toast.success("Video updated");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.uploaded_by = user.id;
      await supabase.from("videos").insert(payload);
      toast.success("Video created");
    }

    setShowForm(false);
    setEditing(null);
    setForm({ title: "", description: "", video_url: "", thumbnail_url: "", price_tsh: 0, is_published: true, category_slug: "", creator: "", duration: "" });
    fetchVideos();
  };

  const deleteVideo = async (id) => {
    if (!confirm("Delete this video?")) return;
    await supabase.from("videos").delete().eq("id", id);
    fetchVideos();
    toast.success("Video deleted");
  };

  const togglePublish = async (id, current) => {
    await supabase.from("videos").update({ is_published: !current }).eq("id", id);
    fetchVideos();
    toast.success(`Video ${!current ? "published" : "unpublished"}`);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Videos</h2>
        <button
          onClick={() => { setShowForm(true); setEditing(null); setForm({ title: "", description: "", video_url: "", thumbnail_url: "", price_tsh: 0, is_published: true, category_slug: "", creator: "", duration: "" }); }}
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
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                required
              />
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                rows={2}
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
              />
              <input
                value={form.video_url}
                onChange={(e) => setForm({ ...form, video_url: e.target.value })}
                placeholder="Video URL"
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
                required
              />
              <input
                value={form.thumbnail_url}
                onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                placeholder="Thumbnail URL"
                className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  value={form.price_tsh}
                  onChange={(e) => setForm({ ...form, price_tsh: Number(e.target.value) })}
                  placeholder="Price (TSh)"
                  className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs"
                />
                <input
                  value={form.duration}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                  placeholder="Duration (e.g. 3:45)"
                  className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs"
                />
                <input
                  value={form.creator}
                  onChange={(e) => setForm({ ...form, creator: e.target.value })}
                  placeholder="Creator name"
                  className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs"
                />
                <select
                  value={form.category_slug}
                  onChange={(e) => setForm({ ...form, category_slug: e.target.value })}
                  className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs"
                >
                  <option value="">No category</option>
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs text-muted-foreground">Published:</label>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="rounded border-border"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition"
              >
                {editing ? "Update" : "Save"}
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
                <th className="px-2 py-2 text-left font-medium">Title</th>
                <th className="px-2 py-2 text-left font-medium hidden sm:table-cell">Category</th>
                <th className="px-2 py-2 text-left font-medium">Price</th>
                <th className="px-2 py-2 text-left font-medium">Status</th>
                <th className="px-2 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {videos.map((v) => (
                <tr key={v.id} className="hover:bg-muted/30">
                  <td className="px-2 py-2 max-w-[80px] truncate">{v.title}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{v.categories?.label || "—"}</td>
                  <td className="px-2 py-2">TSh {v.price_tsh}</td>
                  <td className="px-2 py-2">
                    <button
                      onClick={() => togglePublish(v.id, v.is_published)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        v.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {v.is_published ? "✓" : "⏳"}
                    </button>
                  </td>
                  <td className="px-2 py-2 flex gap-1">
                    <button
                      onClick={() => {
                        setEditing(v);
                        setForm({
                          title: v.title,
                          description: v.description || "",
                          video_url: v.video_url,
                          thumbnail_url: v.thumbnail_url || "",
                          price_tsh: v.price_tsh,
                          is_published: v.is_published,
                          category_slug: v.category_slug || "",
                          creator: v.creator || "",
                          duration: v.duration || "",
                        });
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
  const [newSlug, setNewSlug] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editing, setEditing] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const fetchCategories = async () => {
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories(data || []);
  };

  useEffect(() => { fetchCategories(); }, []);

  const addCategory = async () => {
    if (!newSlug.trim() || !newLabel.trim()) return toast.error("Slug and label required");
    await supabase.from("categories").insert({ slug: newSlug.trim(), label: newLabel.trim() });
    setNewSlug(""); setNewLabel("");
    fetchCategories();
    toast.success("Category added");
  };

  const updateCategory = async (id, label) => {
    await supabase.from("categories").update({ label }).eq("id", id);
    setEditing(null);
    fetchCategories();
    toast.success("Updated");
  };

  const deleteCategory = async (id) => {
    if (!confirm("Delete this category?")) return;
    await supabase.from("categories").delete().eq("id", id);
    fetchCategories();
    toast.success("Deleted");
  };

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">Categories</h2>
      <div className="flex flex-wrap gap-2 mb-3">
        <input
          value={newSlug}
          onChange={(e) => setNewSlug(e.target.value)}
          placeholder="Slug (e.g. music)"
          className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-input text-xs min-w-[100px]"
        />
        <input
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label (e.g. Music)"
          className="flex-1 border border-border rounded-lg px-3 py-1.5 bg-input text-xs min-w-[100px]"
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
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  className="flex-1 border border-border rounded-lg px-2 py-1 bg-input text-xs"
                  autoFocus
                />
                <button onClick={() => updateCategory(c.id, editLabel)} className="text-primary text-xs">Save</button>
                <button onClick={() => setEditing(null)} className="text-muted-foreground text-xs">Cancel</button>
              </div>
            ) : (
              <>
                <span className="text-sm">{c.label} <span className="text-muted-foreground text-[10px]">({c.slug})</span></span>
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(c.id); setEditLabel(c.label); }} className="text-primary">
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
  const [form, setForm] = useState({ name: "", description: "", logo_url: "", link: "", members: 0, category: "", is_published: true });

  const fetchGroups = async () => {
    setLoading(true);
    const { data } = await supabase.from("groups").select("*").order("created_at", { ascending: false });
    setGroups(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchGroups(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = { ...form, members: Number(form.members) };
    if (editing) {
      await supabase.from("groups").update(payload).eq("id", editing.id);
      toast.success("Group updated");
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) payload.created_by = user.id;
      await supabase.from("groups").insert(payload);
      toast.success("Group created");
    }
    setShowForm(false); setEditing(null); setForm({ name: "", description: "", logo_url: "", link: "", members: 0, category: "", is_published: true });
    fetchGroups();
  };

  const deleteGroup = async (id) => {
    if (!confirm("Delete this group?")) return;
    await supabase.from("groups").delete().eq("id", id);
    fetchGroups();
    toast.success("Deleted");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Groups</h2>
        <button onClick={() => { setShowForm(true); setEditing(null); setForm({ name: "", description: "", logo_url: "", link: "", members: 0, category: "", is_published: true }); }} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-1 text-xs">
          <i className="fas fa-plus"></i> Add
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-3 rounded-xl shadow-sm border border-border mb-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" required />
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
            <input value={form.logo_url} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} placeholder="Logo URL" className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
            <input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Link" className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" required />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.members} onChange={(e) => setForm({ ...form, members: Number(e.target.value) })} placeholder="Members" className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs" />
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Category" className="border border-border rounded-lg px-2 py-1.5 bg-input text-xs" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Published:</label>
              <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="rounded border-border" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition">{editing ? "Update" : "Save"}</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border px-4 py-1.5 rounded-lg text-xs hover:bg-muted transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr><th className="px-2 py-2 text-left font-medium">Name</th><th className="px-2 py-2 text-left font-medium hidden sm:table-cell">Members</th><th className="px-2 py-2 text-left font-medium">Status</th><th className="px-2 py-2 text-left font-medium">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-border">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-muted/30">
                  <td className="px-2 py-2">{g.name}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{g.members}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${g.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {g.is_published ? "✓" : "⏳"}
                    </span>
                  </td>
                  <td className="px-2 py-2 flex gap-1">
                    <button onClick={() => { setEditing(g); setForm(g); setShowForm(true); }} className="text-primary"><i className="fas fa-edit text-xs"></i></button>
                    <button onClick={() => deleteGroup(g.id)} className="text-destructive/70"><i className="fas fa-trash-alt text-xs"></i></button>
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
// BUSINESS (Dadaz) – using dadaz_profiles table
// ============================================================
function BusinessContent() {
  const [businesses, setBusinesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [form, setForm] = useState({
    username: "",
    location: "",
    status: "free",
    bio: "",
    services: "",
    price_tsh: 0,
    price_label: "",
    whatsapp: "",
    phone: "",
    avatar_url: "",
    cover_url: "",
    is_published: false,
  });

  const fetchBusinesses = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("dadaz_profiles")
      .select("*, profiles!dadaz_profiles_owner_id_fkey (username)")
      .order("created_at", { ascending: false });
    setBusinesses(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchBusinesses(); }, []);

  const openEditModal = (biz) => {
    setEditing(biz);
    setForm({
      username: biz.username,
      location: biz.location || "",
      status: biz.status || "free",
      bio: biz.bio || "",
      services: biz.services || "",
      price_tsh: biz.price_tsh || 0,
      price_label: biz.price_label || "",
      whatsapp: biz.whatsapp || "",
      phone: biz.phone || "",
      avatar_url: biz.avatar_url || "",
      cover_url: biz.cover_url || "",
      is_published: biz.is_published || false,
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => { setShowEditModal(false); setEditing(null); };

  const handleSaveBusiness = async (e) => {
    e.preventDefault();
    if (!editing) return;
    setLoading(true);

    const payload = {
      username: form.username,
      location: form.location,
      status: form.status,
      bio: form.bio,
      services: form.services,
      price_tsh: Number(form.price_tsh),
      price_label: form.price_label,
      whatsapp: form.whatsapp,
      phone: form.phone,
      avatar_url: form.avatar_url,
      cover_url: form.cover_url,
      is_published: form.is_published,
    };

    await supabase.from("dadaz_profiles").update(payload).eq("id", editing.id);
    toast.success("Business updated");
    closeEditModal();
    fetchBusinesses();
  };

  const togglePublish = async (id, current) => {
    await supabase.from("dadaz_profiles").update({ is_published: !current }).eq("id", id);
    fetchBusinesses();
    toast.success(`Business ${!current ? "published" : "unpublished"}`);
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Business (Dadaz)</h2>
        <span className="text-xs text-muted-foreground">{businesses.length} total</span>
      </div>
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium">Username</th>
                <th className="px-2 py-2 text-left font-medium hidden sm:table-cell">Location</th>
                <th className="px-2 py-2 text-left font-medium">Status</th>
                <th className="px-2 py-2 text-left font-medium">Published</th>
                <th className="px-2 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {businesses.map((b) => (
                <tr key={b.id} className="hover:bg-muted/30">
                  <td className="px-2 py-2">{b.username}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{b.location || "—"}</td>
                  <td className="px-2 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                      b.status === "service" ? "bg-purple-100 text-purple-700" :
                      b.status === "work" ? "bg-blue-100 text-blue-700" :
                      "bg-gray-100 text-gray-700"
                    }`}>
                      {b.status}
                    </span>
                  </td>
                  <td className="px-2 py-2">
                    <button onClick={() => togglePublish(b.id, b.is_published)} className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${b.is_published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                      {b.is_published ? "✓" : "⏳"}
                    </button>
                  </td>
                  <td className="px-2 py-2 flex gap-1">
                    <button onClick={() => openEditModal(b)} className="text-primary">
                      <i className="fas fa-edit text-xs"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 py-10">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold">Edit Business: {editing.username}</h2>
              <button onClick={closeEditModal} className="text-muted-foreground hover:text-foreground">
                <i className="fas fa-times text-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSaveBusiness} className="space-y-3">
              <div className="grid grid-cols-1 gap-3">
                <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Username" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" required />
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Location" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                <input value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="Bio" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                <input value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Services" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <input type="number" value={form.price_tsh} onChange={(e) => setForm({ ...form, price_tsh: Number(e.target.value) })} placeholder="Price (TSh)" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                  <input value={form.price_label} onChange={(e) => setForm({ ...form, price_label: e.target.value })} placeholder="Price Label" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                  <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="WhatsApp" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="w-full border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                  <input value={form.avatar_url} onChange={(e) => setForm({ ...form, avatar_url: e.target.value })} placeholder="Avatar URL" className="col-span-2 border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                  <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="Cover URL" className="col-span-2 border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs">
                    <option value="free">Free</option>
                    <option value="work">Work</option>
                    <option value="service">Service</option>
                  </select>
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground">Published:</label>
                    <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="rounded border-border" />
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
    const { data } = await supabase
      .from("stories")
      .select("*, profiles!stories_user_id_fkey (username)")
      .order("created_at", { ascending: false });
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
    if (!confirm("Delete this story?")) return;
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
                <th className="px-2 py-2 text-left font-medium">User</th>
                <th className="px-2 py-2 text-left font-medium">Status</th>
                <th className="px-2 py-2 text-left font-medium hidden sm:table-cell">Expires</th>
                <th className="px-2 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stories.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="px-2 py-2">{s.profiles?.username || "—"}</td>
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
                    {s.status !== "approved" && <button onClick={() => updateStatus(s.id, "approved")} className="text-green-500"><i className="fas fa-check text-xs"></i></button>}
                    {s.status !== "rejected" && <button onClick={() => updateStatus(s.id, "rejected")} className="text-red-500"><i className="fas fa-times text-xs"></i></button>}
                    <button onClick={() => deleteStory(s.id)} className="text-destructive/70"><i className="fas fa-trash-alt text-xs"></i></button>
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
  const [form, setForm] = useState({ code: "", coins_sq: 10, max_uses: 1, expires_at: "", is_active: true });

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
    const payload = { ...form, coins_sq: Number(form.coins_sq), max_uses: Number(form.max_uses) };
    if (!payload.code) payload.code = generateCode();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) payload.created_by = user.id;
    await supabase.from("redeem_links").insert(payload);
    toast.success("Redeem link created");
    setShowForm(false);
    setForm({ code: "", coins_sq: 10, max_uses: 1, expires_at: "", is_active: true });
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
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-bold">Redeem Links</h2>
        <button onClick={() => setShowForm(true)} className="bg-primary text-primary-foreground px-3 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition flex items-center gap-1">
          <i className="fas fa-plus"></i> Create
        </button>
      </div>

      {showForm && (
        <div className="bg-card p-3 rounded-xl shadow-sm border border-border mb-3">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-2">
            <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="Code (auto if blank)" className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={form.coins_sq} onChange={(e) => setForm({ ...form, coins_sq: Number(e.target.value) })} placeholder="Coins SQ" className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" required />
              <input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} placeholder="Max uses" className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" required />
            </div>
            <input type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs" />
            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Active:</label>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="rounded border-border" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="bg-primary text-primary-foreground px-4 py-1.5 rounded-lg font-semibold text-xs shadow-[var(--shadow-neon)] hover:opacity-90 transition">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="border border-border px-4 py-1.5 rounded-lg text-xs hover:bg-muted transition">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-2 py-2 text-left font-medium">Code</th>
                <th className="px-2 py-2 text-left font-medium">Coins</th>
                <th className="px-2 py-2 text-left font-medium hidden sm:table-cell">Used</th>
                <th className="px-2 py-2 text-left font-medium">Active</th>
                <th className="px-2 py-2 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {links.map((l) => (
                <tr key={l.id} className="hover:bg-muted/30">
                  <td className="px-2 py-2 font-mono text-[10px]">{l.code}</td>
                  <td className="px-2 py-2">{l.coins_sq}</td>
                  <td className="px-2 py-2 hidden sm:table-cell">{l.uses_count} / {l.max_uses}</td>
                  <td className="px-2 py-2">{l.is_active ? "✓" : "✗"}</td>
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
      <h2 className="text-lg font-bold mb-3">App Settings</h2>
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border space-y-3">
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">SQ to TSh Rate</label>
          <input type="number" value={settings.sq_to_tsh || "100"} onChange={(e) => updateSetting("sq_to_tsh", e.target.value)} className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-24" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">Support WhatsApp</label>
          <input type="text" value={settings.support_whatsapp || ""} onChange={(e) => updateSetting("support_whatsapp", e.target.value)} className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-full" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">WhatsApp Channel</label>
          <input type="text" value={settings.whatsapp_channel || ""} onChange={(e) => updateSetting("whatsapp_channel", e.target.value)} className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-full" />
        </div>
        <div>
          <label className="block text-[10px] font-medium text-muted-foreground">Support Email</label>
          <input type="email" value={settings.support_email || ""} onChange={(e) => updateSetting("support_email", e.target.value)} className="border border-border rounded-lg px-3 py-1.5 bg-input text-xs w-full" />
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