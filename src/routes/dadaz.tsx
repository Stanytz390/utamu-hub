import { createFileRoute, Link } from "@tanstack/react-router";
import { Heart, Users, MapPin } from "lucide-react";
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
  return (
    <div className="mx-auto max-w-lg">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <h1 className="text-xl font-black">Dadaz</h1>
        <p className="text-xs text-muted-foreground">Scroll na chagua dada wa kupenda</p>
      </header>

      <section className="space-y-4 p-4">
        {profiles.map((p) => (
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