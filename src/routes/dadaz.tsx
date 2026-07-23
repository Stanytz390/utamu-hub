import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/dadaz")({
  head: () => ({
    meta: [
      { title: "Dadaz · Profiles" },
      { name: "description", content: "Gundua dadaz — profile, huduma, followers na photos." },
      { property: "og:title", content: "Dadaz · UTAMU PORI" },
      { property: "og:description", content: "Scroll profiles poa za UTAMU PORI." },
    ],
  }),
  component: Dadaz,
});

type DadazProfile = {
  id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  cover_url?: string;
  location?: string;
  bio?: string;
  status?: "free" | "work" | "service";
  followers: number;
  likes: number;
  business_contacts?: {
    services?: string;
    location?: string;
    is_confirmed?: boolean;
  };
};

function Dadaz() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "free" | "work" | "service">("all");
  const [profiles, setProfiles] = useState<DadazProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Dadaz (users with role = 'business')
  useEffect(() => {
    const fetchDadaz = async () => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select(`
          id,
          full_name,
          username,
          avatar_url,
          cover_url,
          location,
          bio,
          status,
          business_contacts ( services, location, is_confirmed )
        `)
        .eq("role", "business")
        .eq("is_approved", true); // optional: only approved businesses

      // Search filter
      if (q.trim()) {
        const search = `%${q.trim()}%`;
        query = query.or(
          `full_name.ilike.${search}, username.ilike.${search}, bio.ilike.${search}, location.ilike.${search}`
        );
        // also search in business_contacts services? We'll add a separate filter later.
      }

      // Status filter (from profiles.status)
      if (status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching dadaz:", error);
        setProfiles([]);
      } else {
        // Map data and compute followers/likes (if needed)
        // For now, we'll use placeholder or count from other tables.
        // We'll fetch follower counts separately if needed.
        const mapped = (data || []).map((p: any) => ({
          ...p,
          followers: p._followers_count || Math.floor(Math.random() * 1000) + 100, // placeholder
          likes: p._likes_count || Math.floor(Math.random() * 500) + 50,
        }));
        setProfiles(mapped);
      }
      setLoading(false);
    };

    fetchDadaz();
  }, [q, status]);

  // Filtered list (additional client-side filtering for services if needed)
  const filteredList = useMemo(() => {
    if (!q.trim()) return profiles;
    const searchLower = q.trim().toLowerCase();
    return profiles.filter((p) => {
      const services = p.business_contacts?.services?.toLowerCase() || "";
      return (
        p.full_name?.toLowerCase().includes(searchLower) ||
        p.username?.toLowerCase().includes(searchLower) ||
        p.bio?.toLowerCase().includes(searchLower) ||
        p.location?.toLowerCase().includes(searchLower) ||
        services.includes(searchLower)
      );
    });
  }, [profiles, q]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <i className="fas fa-spinner fa-spin text-4xl text-purple-500"></i>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-black">Dadaz</h1>
        <p className="text-xs text-muted-foreground">Scroll na chagua dada wa kupenda</p>
        <div className="relative mt-3">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tafuta jina, location au huduma..."
            className="w-full rounded-full border border-border bg-muted py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {(["all", "free", "work", "service"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`whitespace-nowrap rounded-full px-3 py-1 text-xs font-semibold ${
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
      </header>

      <section className="space-y-4 p-4">
        {filteredList.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Hakuna dada aliyepatikana.</p>
        )}
        {filteredList.map((p) => (
          <Link
            key={p.id}
            to="/dadaz/$id"
            params={{ id: p.id }}
            className="relative block overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
          >
            <div className="relative aspect-[3/4] w-full">
              <img
                src={p.cover_url || p.avatar_url || "https://via.placeholder.com/400x600"}
                alt={p.full_name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent" />
              <span
                className={`absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase backdrop-blur ${
                  p.status === "service"
                    ? "bg-primary/90 text-primary-foreground"
                    : p.status === "work"
                    ? "bg-secondary/90 text-secondary-foreground"
                    : "bg-muted/80 text-foreground"
                }`}
              >
                {p.status || "free"}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h2 className="text-2xl font-black">{p.full_name}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
                  <i className="fas fa-map-pin text-xs"></i> {p.location || "Location not set"}
                </p>
                <p className="mt-2 line-clamp-2 text-sm opacity-90">{p.bio}</p>
                {p.business_contacts?.services && (
                  <div className="mt-2 text-xs opacity-80">
                    <i className="fas fa-concierge-bell mr-1"></i> {p.business_contacts.services}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <i className="fas fa-users text-xs"></i> <strong>{p.followers.toLocaleString()}</strong> followers
                  </span>
                  <span className="flex items-center gap-1">
                    <i className="fas fa-heart text-primary text-xs"></i>{" "}
                    <strong>{p.likes.toLocaleString()}</strong>
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}