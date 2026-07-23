import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VideoCard } from "@/components/VideoCard";

export const Route = createFileRoute("/utamu")({
  head: () => ({
    meta: [
      { title: "Utamu · Videos" },
      { name: "description", content: "Videos zote — filter kwa All, New, Old, Free au Premium." },
      { property: "og:title", content: "Utamu Videos · UTAMU PORI" },
      { property: "og:description", content: "Download au play videos moto za UTAMU PORI." },
    ],
  }),
  component: Utamu,
});

const filters = ["All", "New", "Old", "Free", "Premium"] as const;

function Utamu() {
  const [f, setF] = useState<(typeof filters)[number]>("All");
  const [q, setQ] = useState("");
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch videos from Supabase
  useEffect(() => {
    const fetchVideos = async () => {
      setLoading(true);
      let query = supabase
        .from("videos")
        .select(`
          *,
          profiles:creator_id ( full_name, avatar_url )
        `)
        .eq("status", "available"); // Only show available videos

      // Search filter (client-side after fetch for simplicity, but we can do ilike)
      // We'll fetch all and filter client-side for search as well
      // Better to apply server-side ilike to reduce data
      if (q.trim()) {
        const search = `%${q.trim()}%`;
        query = query.or(
          `title.ilike.${search}, description.ilike.${search}, creator.ilike.${search}`
        );
      }

      // Sorting
      if (f === "New") {
        query = query.order("created_at", { ascending: false });
      } else if (f === "Old") {
        query = query.order("created_at", { ascending: true });
      } else {
        query = query.order("created_at", { ascending: false }); // default newest
      }

      const { data, error } = await query;
      if (error) {
        console.error("Error fetching videos:", error);
        setVideos([]);
      } else {
        // Map to match expected VideoCard props (price_sq, etc.)
        const mapped = (data || []).map((v: any) => ({
          ...v,
          creator: v.profiles?.full_name || v.creator || "Unknown",
          avatar_url: v.profiles?.avatar_url || "",
        }));
        setVideos(mapped);
      }
      setLoading(false);
    };

    fetchVideos();
  }, [f, q]); // refetch when filter or search changes

  // Additional client-side filtering for Free/Premium (since price_sq is 0 or >0)
  const filteredVideos = useMemo(() => {
    let out = videos;
    if (f === "Free") {
      out = out.filter((v) => v.price_sq === 0);
    } else if (f === "Premium") {
      out = out.filter((v) => v.price_sq > 0);
    }
    return out;
  }, [videos, f]);

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
        <h1 className="text-xl font-black">Utamu Videos</h1>
        <div className="relative mt-3">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm"></i>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tafuta video, creator, description..."
            className="w-full rounded-full border border-border bg-muted py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {filters.map((label) => (
            <button
              key={label}
              onClick={() => setF(label)}
              className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold ${
                f === label
                  ? "bg-primary text-primary-foreground shadow-[var(--shadow-neon)]"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 p-4">
        {filteredVideos.length === 0 && (
          <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
            Hakuna video iliyopatikana.
          </p>
        )}
        {filteredVideos.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </section>
    </div>
  );
}