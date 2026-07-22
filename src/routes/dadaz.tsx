import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, Users, MapPin, Search } from "lucide-react";
import { profiles } from "@/lib/mock-data";

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

function Dadaz() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "free" | "work" | "service">("all");

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return profiles.filter((p) => {
      if (status !== "all" && p.status !== status) return false;
      if (!needle) return true;
      return (
        p.username.toLowerCase().includes(needle) ||
        p.location.toLowerCase().includes(needle) ||
        p.bio.toLowerCase().includes(needle)
      );
    });
  }, [q, status]);

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-black">Dadaz</h1>
        <p className="text-xs text-muted-foreground">Scroll na chagua dada wa kupenda</p>
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
        {list.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Hakuna dada aliyepatikana.</p>
        )}
        {list.map((p) => (
          <Link
            key={p.id}
            to="/dadaz/$id"
            params={{ id: p.id }}
            className="relative block overflow-hidden rounded-3xl border border-border bg-card shadow-xl"
          >
            <div className="relative aspect-[3/4] w-full">
              <img src={p.cover} alt={p.username} className="h-full w-full object-cover" loading="lazy" />
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
                {p.status}
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <h2 className="text-2xl font-black">{p.username}</h2>
                <p className="mt-1 flex items-center gap-1 text-xs opacity-80">
                  <MapPin size={12} /> {p.location}
                </p>
                <p className="mt-2 line-clamp-2 text-sm opacity-90">{p.bio}</p>
                <div className="mt-3 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Users size={13} /> <strong>{p.followers.toLocaleString()}</strong> followers
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart size={13} className="text-primary" fill="currentColor" />{" "}
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