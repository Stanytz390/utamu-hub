import { useEffect, useState } from "react";
import { Download, Play, Lock, Eye, Coins, Share2, Loader2 } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { VideoItem } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";

export function VideoCard({ video }: { video: VideoItem }) {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isFree = video.price_sq === 0;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  useEffect(() => {
    if (!userId || isFree) return;
    supabase
      .from("coin_transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("ref_id", video.id)
      .eq("kind", "purchase")
      .maybeSingle()
      .then(({ data }) => data && setUnlocked(true));
  }, [userId, video.id, isFree]);

  const handleUnlock = async () => {
    if (isFree || unlocked) return;
    if (!userId) return navigate({ to: "/auth" });
    setBusy(true);
    setErr(null);
    const { error } = await supabase.rpc("spend_coins", {
      _user_id: userId,
      _amount: video.price_sq,
      _kind: "purchase",
      _ref_id: video.id,
      _note: `Unlock: ${video.title}`,
    });
    setBusy(false);
    if (error) {
      if (error.message.includes("insufficient")) {
        setErr("Coins hazitoshi. Nunua SQ zaidi.");
      } else {
        setErr(error.message);
      }
      return;
    }
    setUnlocked(true);
  };

  const share = async () => {
    const url = `${window.location.origin}/utamu#${video.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: video.title, text: video.description, url }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
    }
  };

  const canPlay = isFree || unlocked;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="relative aspect-[9/14] w-full overflow-hidden">
          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          {!isFree && !unlocked && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur">
              <Lock size={12} /> {video.price_sq} SQ
            </div>
          )}
          {unlocked && !isFree && (
            <div className="absolute right-3 top-3 rounded-full bg-secondary/90 px-3 py-1 text-xs font-bold text-secondary-foreground backdrop-blur">
              UNLOCKED
            </div>
          )}
          {isFree && (
            <div className="absolute right-3 top-3 rounded-full bg-secondary/90 px-3 py-1 text-xs font-bold text-secondary-foreground backdrop-blur">
              FREE
            </div>
          )}
          <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">
            {video.duration}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <p className="text-xs opacity-80">{video.creator}</p>
            <h3 className="mt-0.5 text-base font-bold leading-tight">{video.title}</h3>
            <p className="mt-1 line-clamp-2 text-xs opacity-80">{video.description}</p>
            <div className="mt-1 flex items-center gap-1 text-[11px] opacity-70">
              <Eye size={11} /> {video.views}
            </div>
          </div>
        </div>
        <div className="p-3">
          {err && <p className="mb-2 rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive">{err}</p>}
          {canPlay ? (
            <div className="grid grid-cols-3 gap-2">
              <button className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-neon)] active:scale-95">
                <Play size={16} fill="currentColor" /> Play
              </button>
              <button className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted py-2.5 text-sm font-semibold text-foreground active:scale-95">
                <Download size={16} /> Save
              </button>
              <button onClick={share} className="col-span-1 flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted py-2.5 text-sm font-semibold text-foreground active:scale-95">
                <Share2 size={16} /> Share
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleUnlock}
                disabled={busy}
                className="col-span-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-neon)] active:scale-95 disabled:opacity-60"
              >
                {busy ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
                Unlock {video.price_sq} SQ
              </button>
              <Link
                to="/wallet"
                className="col-span-1 flex items-center justify-center rounded-xl border border-border bg-muted py-2.5 text-xs font-semibold text-foreground active:scale-95"
              >
                Top up
              </Link>
            </div>
          )}
        </div>
    </div>
  );
}