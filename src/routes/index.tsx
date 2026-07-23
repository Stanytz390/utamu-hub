import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoCard } from "@/components/VideoCard";
import { PromoBanners } from "@/components/PromoBanners";
import { CoinBadge } from "@/components/CoinBadge";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home · UTAMU PORI" },
      { name: "description", content: "Everything in one feed — videos, dadaz, na groups moto zaidi." },
    ],
  }),
  component: Home,
});

const filters = [
  { id: "all", label: "All" },
  { id: "utamu", label: "Utamu" },
  { id: "dadaz", label: "Dadaz" },
  { id: "groups", label: "Groups" },
] as const;

type FilterType = "all" | "utamu" | "dadaz" | "groups";

function Home() {
  const [active, setActive] = useState<FilterType>("all");
  const [q, setQ] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [dadazProfiles, setDadazProfiles] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const showVideos = active === "all" || active === "utamu";
  const showProfiles = active === "all" || active === "dadaz";
  const showGroups = active === "all" || active === "groups";

  // Fetch all data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch videos (only available)
      let videosQuery = supabase
        .from("videos")
        .select(`
          *,
          profiles:creator_id ( full_name, avatar_url )
        `)
        .eq("status", "available")
        .order("created_at", { ascending: false });

      // Apply search if query exists
      if (q.trim()) {
        const search = `%${q.trim()}%`;
        videosQuery = videosQuery.or(`title.ilike.${search}, description.ilike.${search}, creator.ilike.${search}`);
      }

      const { data: videosData, error: videosError } = await videosQuery;
      if (!videosError) {
        setVideos(videosData || []);
      }

      // Fetch Dadaz (business profiles)
      let profilesQuery = supabase
        .from("profiles")
        .select("*")
        .eq("role", "business")
        .eq("is_approved", true);

      if (q.trim()) {
        const search = `%${q.trim()}%`;
        profilesQuery = profilesQuery.or(
          `full_name.ilike.${search}, username.ilike.${search}, bio.ilike.${search}, location.ilike.${search}`
        );
      }

      const { data: profilesData, error: profilesError } = await profilesQuery;
      if (!profilesError) {
        setDadazProfiles(profilesData || []);
      }

      // Fetch groups
      let groupsQuery = supabase
        .from("groups")
        .select("*")
        .order("created_at", { ascending: false });

      if (q.trim()) {
        const search = `%${q.trim()}%`;
        groupsQuery = groupsQuery.or(`name.ilike.${search}, description.ilike.${search}`);
      }

      const { data: groupsData, error: groupsError } = await groupsQuery;
      if (!groupsError) {
        // Get member counts for each group
        const groupsWithCount = await Promise.all(
          (groupsData || []).map(async (g) => {
            const { count } = await supabase
              .from("group_memberships")
              .select("*", { count: "exact", head: true })
              .eq("group_id", g.id);
            return { ...g, member_count: count || 0 };
          })
        );
        setGroups(groupsWithCount);
      }

      // Fetch stories (approved, not expired)
      const { data: storiesData, error: storiesError } = await supabase
        .from("stories")
        .select(`
          *,
          profiles:user_id ( full_name, avatar_url )
        `)
        .eq("status", "approved")
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (!storiesError) {
        setStories(storiesData || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [q]);

  // Filter based on active category (client-side)
  const filteredVideos = useMemo(() => {
    if (!showVideos) return [];
    return videos;
  }, [videos, showVideos]);

  const filteredProfiles = useMemo(() => {
    if (!showProfiles) return [];
    return dadazProfiles;
  }, [dadazProfiles, showProfiles]);

  const filteredGroups = useMemo(() => {
    if (!showGroups) return [];
    return groups;
  }, [groups, showGroups]);

  const hasResults = filteredVideos.length > 0 || filteredProfiles.length > 0 || filteredGroups.length > 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <i className="fas fa-spinner fa-spin text-4xl text-purple-500"></i>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center justify-between">
          <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black tracking-tight text-transparent">
            UTAMU PORI
          </h1>
          <div className="flex items-center gap-2">
            <CoinBadge />
            <Link to="/auth" className="rounded-full bg-muted p-2 text-muted-foreground">
              <i className="fas fa-bell text-sm"></i>
            </Link>
          </div>
        </div>
        <div className="relative mt-3">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tafuta videos, dadaz, groups..."
            className="w-full rounded-full border border-border bg-muted py-2 pl-9 pr-9 text-sm outline-none focus:border-primary"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:text-foreground"
            >
              <i className="fas fa-times text-sm"></i>
            </button>
          )}
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActive(f.id)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition-all ${
                active === f.id
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-neon)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      {/* Stories row - only if no search query */}
      {!q.trim() && stories.length > 0 && (
        <section className="px-4 py-4">
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {stories.map((story) => (
              <Link
                key={story.id}
                to="/story/$id"
                params={{ id: story.id }}
                className="flex flex-col items-center gap-1"
              >
                <div className="rounded-full bg-[image:var(--gradient-primary)] p-[2px]">
                  <div className="rounded-full bg-background p-[2px]">
                    <img
                      src={story.profiles?.avatar_url || 'https://via.placeholder.com/64'}
                      alt={story.profiles?.full_name || 'Story'}
                      className="h-16 w-16 rounded-full object-cover"
                      loading="lazy"
                    />
                  </div>
                </div>
                <span className="max-w-[70px] truncate text-[11px] text-muted-foreground">
                  {story.profiles?.full_name?.split(" ")[0] || 'Story'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Trending Videos */}
      {showVideos && filteredVideos.length > 0 && (
        <section className="px-4 pb-4">
          <div className="mb-3 flex items-center gap-2">
            <i className="fas fa-fire text-primary text-sm"></i>
            <h2 className="text-lg font-bold">Utamu Trending</h2>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {filteredVideos.slice(0, 10).map((v) => (
              <div key={v.id} className="w-64 flex-shrink-0">
                <VideoCard video={v} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dadaz preview */}
      {showProfiles && filteredProfiles.length > 0 && (
        <section className="px-4 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Dadaz Poa</h2>
            <Link to="/dadaz" className="text-xs font-semibold text-secondary">
              Ona zote <i className="fas fa-arrow-right ml-1 text-xs"></i>
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {filteredProfiles.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/dadaz/$id"
                params={{ id: p.id }}
                className="relative overflow-hidden rounded-2xl border border-border"
              >
                <img
                  src={p.cover_url || p.avatar_url || 'https://via.placeholder.com/300x400'}
                  alt={p.full_name}
                  className="aspect-[3/4] w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-sm font-bold">{p.full_name}</p>
                  <p className="text-[11px] opacity-80">{p.location || 'Tanzania'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Groups preview */}
      {showGroups && filteredGroups.length > 0 && (
        <section className="px-4 pb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Groups Motomoto</h2>
            <Link to="/groups" className="text-xs font-semibold text-secondary">
              Ona zote <i className="fas fa-arrow-right ml-1 text-xs"></i>
            </Link>
          </div>
          <div className="space-y-2">
            {filteredGroups.slice(0, 3).map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <img
                  src={g.logo_url || 'https://via.placeholder.com/48'}
                  alt={g.name}
                  className="h-12 w-12 rounded-xl object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    <i className="fas fa-users mr-1 text-xs"></i> {g.member_count || 0} members
                  </p>
                </div>
                <a
                  href={g.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-secondary-foreground"
                >
                  <i className="fas fa-door-open mr-1"></i> Join
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {!hasResults && q.trim() && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Hakuna kilichopatikana kwa "{q}".
        </p>
      )}
    </div>
  );
}