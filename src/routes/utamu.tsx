import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { videos } from "@/lib/mock-data";
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

  const list = useMemo(() => {
    const sorted = [...videos];
    if (f === "New") sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (f === "Old") sorted.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    let out = sorted;
    if (f === "Free") out = out.filter((v) => v.price_sq === 0);
    if (f === "Premium") out = out.filter((v) => v.price_sq > 0);
    const needle = q.trim().toLowerCase();
    if (needle) {
      out = out.filter(
        (v) =>
          v.title.toLowerCase().includes(needle) ||
          v.description.toLowerCase().includes(needle) ||
          v.creator.toLowerCase().includes(needle),
      );
    }
    return out;
  }, [f, q]);

  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-black">Utamu Videos</h1>
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
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
        {list.length === 0 && (
          <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
            Hakuna video iliyopatikana.
          </p>
        )}
        {list.map((v) => (
          <VideoCard key={v.id} video={v} />
        ))}
      </section>
    </div>
  );
}