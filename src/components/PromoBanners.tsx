import { useEffect, useState } from "react";
import { ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Banner = {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  link_url: string | null;
};

export function PromoBanners() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    supabase
      .from("promo_banners")
      .select("id, title, description, image_url, link_url")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => setBanners((data ?? []) as Banner[]));
  }, []);

  useEffect(() => {
    if (banners.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % banners.length), 5000);
    return () => clearInterval(t);
  }, [banners.length]);

  if (banners.length === 0) return null;
  const b = banners[idx];

  const inner = (
    <div className="relative overflow-hidden rounded-2xl border border-border">
      <img src={b.image_url} alt={b.title} className="h-32 w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 text-white">
        <div className="absolute bottom-3 left-3 right-3">
          <p className="text-xs font-bold">{b.title}</p>
          {b.description && <p className="line-clamp-1 text-[11px] opacity-90">{b.description}</p>}
        </div>
        {b.link_url && <ExternalLink size={14} className="absolute right-3 top-3 text-white/80" />}
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-2 right-3 flex gap-1">
          {banners.map((_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-white" : "bg-white/40"}`} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="px-4 pt-3">
      {b.link_url ? (
        <a href={b.link_url} target="_blank" rel="noopener noreferrer">{inner}</a>
      ) : inner}
    </div>
  );
}