import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ArrowLeft, Heart, Users, MapPin, MessageCircle, Phone } from "lucide-react";
import { profiles, type ProfileItem } from "@/lib/mock-data";

export const Route = createFileRoute("/dadaz/$id")({
  head: ({ params }) => {
    const p = profiles.find((x) => x.id === params.id);
    return {
      meta: [
        { title: p ? `${p.username} · Dadaz` : "Profile · Dadaz" },
        { name: "description", content: p?.bio ?? "Profile page" },
      ],
    };
  },
  loader: ({ params }): ProfileItem => {
    const p = profiles.find((x) => x.id === params.id);
    if (!p) throw notFound();
    return p;
  },
  component: DadazDetail,
  notFoundComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Profile haipatikani.</div>
  ),
  errorComponent: () => (
    <div className="p-8 text-center text-muted-foreground">Hitilafu imetokea.</div>
  ),
});

function DadazDetail() {
  const p = Route.useLoaderData();

  return (
    <div className="mx-auto max-w-lg">
      <div className="relative">
        <img src={p.cover} alt={p.username} className="aspect-[4/5] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <Link
          to="/dadaz"
          className="absolute left-4 top-4 rounded-full bg-black/50 p-2 text-white backdrop-blur"
        >
          <ArrowLeft size={20} />
        </Link>
      </div>

      <div className="relative -mt-24 px-4 pb-6">
        <h1 className="text-3xl font-black">{p.username}</h1>
        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin size={14} /> {p.location}
        </p>

        <div className="mt-4 flex items-center gap-6">
          <div>
            <p className="text-xl font-black">{p.followers.toLocaleString()}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Users size={12} /> Followers
            </p>
          </div>
          <div>
            <p className="text-xl font-black">{p.likes.toLocaleString()}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Heart size={12} /> Likes
            </p>
          </div>
          <span
            className={`ml-auto rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
              p.status === "service"
                ? "bg-primary/20 text-primary"
                : p.status === "work"
                ? "bg-secondary/20 text-secondary"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {p.status}
          </span>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-foreground/90">{p.bio}</p>
        {p.price && (
          <p className="mt-3 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary">
            {p.price}
          </p>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a
            href={`https://wa.me/${p.whatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-3 text-sm font-bold text-secondary-foreground"
          >
            <MessageCircle size={16} /> WhatsApp
          </a>
          <a
            href={`tel:${p.phone}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-neon)]"
          >
            <Phone size={16} /> Call
          </a>
        </div>

        <h2 className="mb-3 mt-8 text-lg font-bold">Photos</h2>
        <div className="grid grid-cols-2 gap-2">
          {p.photos.map((src: string, i: number) => (
            <img
              key={i}
              src={src}
              alt={`${p.username} ${i + 1}`}
              className="aspect-square w-full rounded-xl object-cover"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </div>
  );
}