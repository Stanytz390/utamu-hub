import { createFileRoute } from "@tanstack/react-router";
import { Users, ExternalLink } from "lucide-react";
import { groups } from "@/lib/mock-data";

export const Route = createFileRoute("/groups")({
  head: () => ({
    meta: [
      { title: "Groups · UTAMU PORI" },
      { name: "description", content: "Jiunge groups za VIP, free na business. Links zote hapa." },
      { property: "og:title", content: "Groups · UTAMU PORI" },
      { property: "og:description", content: "Group links, descriptions, na join buttons." },
    ],
  }),
  component: Groups,
});

function Groups() {
  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-black">Groups</h1>
        <p className="text-xs text-muted-foreground">Jiunge na communities poa</p>
      </header>

      <section className="space-y-3 p-4">
        {groups.map((g) => (
          <div key={g.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex gap-3 p-4">
              <img
                src={g.logo}
                alt={g.name}
                className="h-16 w-16 flex-shrink-0 rounded-2xl object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-base font-bold">{g.name}</h3>
                </div>
                <span className="mt-0.5 inline-block rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                  {g.category}
                </span>
                <p className="mt-1.5 line-clamp-2 text-xs text-muted-foreground">{g.description}</p>
                <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Users size={11} /> {g.members.toLocaleString()} members
                </p>
              </div>
            </div>
            <a
              href={g.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 border-t border-border bg-[image:var(--gradient-primary)] py-3 text-sm font-bold text-primary-foreground"
            >
              Join Group <ExternalLink size={14} />
            </a>
          </div>
        ))}
      </section>
    </div>
  );
}