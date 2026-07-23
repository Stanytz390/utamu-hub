import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import type { VideoItem } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { shareContent } from "@/lib/share";

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
        setErr("Not enough coins. Top up SQ.");
      } else {
        setErr(error.message);
      }
      return;
    }
    setUnlocked(true);
  };

  const handlePlay = () => {
    if (isFree || unlocked) {
      window.open(video.video_url, '_blank');
    } else {
      handleUnlock();
    }
  };

  const handleDownload = () => {
    if (isFree || unlocked) {
      const link = document.createElement('a');
      link.href = video.video_url;
      link.download = `${video.title}.mp4`;
      link.click();
    } else {
      handleUnlock();
    }
  };

  const handleShare = () => {
    shareContent('video', video.id, video.title, video.description);
  };

  const canPlay = isFree || unlocked;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg transition-all hover:shadow-xl hover:-translate-y-1">
      {/* Thumbnail */}
      <div className="relative aspect-[9/14] w-full overflow-hidden">
        <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
        
        {/* Badges */}
        {!isFree && !unlocked && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-lg">
            <i className="fas fa-coins mr-1"></i> {video.price_sq} SQ
          </div>
        )}
        {unlocked && !isFree && (
          <div className="absolute right-3 top-3 rounded-full bg-green-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-lg">
            <i className="fas fa-check-circle mr-1"></i> UNLOCKED
          </div>
        )}
        {isFree && (
          <div className="absolute right-3 top-3 rounded-full bg-green-500/90 px-3 py-1 text-xs font-bold text-white backdrop-blur shadow-lg">
            <i className="fas fa-gift mr-1"></i> FREE
          </div>
        )}

        {/* Duration */}
        <div className="absolute left-3 top-3 rounded-md bg-black/60 px-2 py-0.5 text-xs text-white backdrop-blur">
          {video.duration}
        </div>

        {/* Share button (floating) */}
        <button
          onClick={handleShare}
          className="absolute left-3 bottom-16 text-white bg-black/40 rounded-full p-1.5 hover:bg-black/60 transition"
          aria-label="Share"
        >
          <i className="fas fa-share-alt text-sm"></i>
        </button>

        {/* Video info */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
          <p className="text-xs opacity-80">{video.creator}</p>
          <h3 className="mt-0.5 text-base font-bold leading-tight line-clamp-2">{video.title}</h3>
          <p className="mt-1 line-clamp-2 text-xs opacity-80">{video.description}</p>
          <div className="mt-1 flex items-center gap-3 text-[11px] opacity-70">
            <span className="flex items-center gap-1">
              <i className="fas fa-eye text-xs"></i> {video.views}
            </span>
            <span className="flex items-center gap-1">
              <i className="fas fa-clock text-xs"></i> {video.duration}
            </span>
          </div>
        </div>
      </div>

      {/* Buttons - New Design */}
      <div className="p-3 space-y-2">
        {err && <p className="text-center text-xs text-red-500">{err}</p>}
        
        {canPlay ? (
          // Unlocked or Free: Play, Download, Share
          <>
            <button
              onClick={handlePlay}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02] active:scale-95"
            >
              <i className="fas fa-play text-sm"></i> Play
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleDownload}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all hover:scale-[1.02] active:scale-95"
              >
                <i className="fas fa-download text-sm"></i> Download
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted/50 py-2.5 text-sm font-semibold text-foreground hover:bg-muted transition-all hover:scale-[1.02] active:scale-95"
              >
                <i className="fas fa-share-alt text-sm"></i> Share
              </button>
            </div>
          </>
        ) : (
          // Locked: Unlock button + Top up
          <div className="flex gap-2">
            <button
              onClick={handleUnlock}
              disabled={busy}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 py-3 text-sm font-bold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            >
              {busy ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className="fas fa-unlock-alt"></i> Unlock ({video.price_sq} SQ)
                </>
              )}
            </button>
            <Link
              to="/wallet"
              className="flex items-center justify-center px-4 rounded-xl border border-border bg-muted/50 text-sm font-semibold text-foreground hover:bg-muted transition-all hover:scale-[1.02] active:scale-95"
            >
              <i className="fas fa-plus-circle"></i>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}