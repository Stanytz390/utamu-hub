import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search, Bell, Flame, X } from "lucide-react";
import { videos, profiles, groups, type Category } from "@/lib/mock-data";
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

const filters: { id: Category; label: string }[] = [
  { id: "all", label: "All" },
  { id: "utamu", label: "Utamu" },
  { id: "dadaz", label: "Dadaz" },
  { id: "groups", label: "Groups" },
];

function Home() {
  const [active, setActive] = useState<Category>("all");
  const [q, setQ] = useState("");
  const showVideos = active === "all" || active === "utamu";
  const showProfiles = active === "all" || active === "dadaz";
  const showGroups = active === "all" || active === "groups";

  const needle = q.trim().toLowerCase();
  const fVideos = useMemo(
    () =>
      !needle
        ? videos
        : videos.filter(
            (v) =>
              v.title.toLowerCase().includes(needle) ||
              v.description.toLowerCase().includes(needle) ||
              v.creator.toLowerCase().includes(needle),
          ),
    [needle],
  );
  const fProfiles = useMemo(
    () =>
      !needle
        ? profiles
        : profiles.filter(
            (p) =>
              p.username.toLowerCase().includes(needle) ||
              p.location.toLowerCase().includes(needle) ||
              p.bio.toLowerCase().includes(needle),
          ),
    [needle],
  );
  const fGroups = useMemo(
    () =>
      !needle
        ? groups
        : groups.filter(
            (g) =>
              g.name.toLowerCase().includes(needle) ||
              g.description.toLowerCase().includes(needle) ||
              g.category.toLowerCase().includes(needle),
          ),
    [needle],
  );

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
              <Bell size={18} />
            </Link>
          </div>
        </div>
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
              <X size={14} />
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

      {/* Hero stories row */}
      {!needle && (
      <section className="px-4 py-4">
        <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {profiles.map((p) => (
            <Link
              key={p.id}
              to="/dadaz/$id"
              params={{ id: p.id }}
              className="flex flex-col items-center gap-1"
            >
              <div className="rounded-full bg-[image:var(--gradient-primary)] p-[2px]">
                <div className="rounded-full bg-background p-[2px]">
                  <img
                    src={p.avatar}
                    alt={p.username}
                    className="h-16 w-16 rounded-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>
              <span className="max-w-[70px] truncate text-[11px] text-muted-foreground">
                {p.username.split(" ")[0]}
              </span>
            </Link>
          ))}
        </div>
      </section>
      )}

      {/* Trending sliding */}
      {showVideos && fVideos.length > 0 && (
        <section className="px-4 pb-4">
          <div className="mb-3 flex items-center gap-2">
            <Flame className="text-primary" size={18} />
            <h2 className="text-lg font-bold">Utamu Trending</h2>
          </div>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {fVideos.map((v) => (
              <div key={v.id} className="w-64 flex-shrink-0">
                <VideoCard video={v} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Dadaz preview */}
      {showProfiles && fProfiles.length > 0 && (
        <section className="px-4 pb-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Dadaz Poa</h2>
            <Link to="/dadaz" className="text-xs font-semibold text-secondary">
              Ona zote →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {fProfiles.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/dadaz/$id"
                params={{ id: p.id }}
                className="relative overflow-hidden rounded-2xl border border-border"
              >
                <img src={p.avatar} alt={p.username} className="aspect-[3/4] w-full object-cover" loading="lazy" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                <div className="absolute bottom-2 left-2 right-2 text-white">
                  <p className="text-sm font-bold">{p.username}</p>
                  <p className="text-[11px] opacity-80">{p.location}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Groups preview */}
      {showGroups && fGroups.length > 0 && (
        <section className="px-4 pb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Groups Motomoto</h2>
            <Link to="/groups" className="text-xs font-semibold text-secondary">
              Ona zote →
            </Link>
          </div>
          <div className="space-y-2">
            {fGroups.slice(0, 3).map((g) => (
              <div key={g.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                <img src={g.logo} alt={g.name} className="h-12 w-12 rounded-xl object-cover" loading="lazy" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{g.name}</p>
                  <p className="text-[11px] text-muted-foreground">{g.members.toLocaleString()} members</p>
                </div>
                <a
                  href={g.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full bg-secondary px-4 py-1.5 text-xs font-bold text-secondary-foreground"
                >
                  Join
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {needle && fVideos.length === 0 && fProfiles.length === 0 && fGroups.length === 0 && (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Hakuna kilichopatikana kwa "{q}".
        </p>
      )}
    </div>
  );
}
