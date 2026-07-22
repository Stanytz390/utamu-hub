import { useState } from "react";
import { Download, Play, Lock, Eye } from "lucide-react";
import type { VideoItem } from "@/lib/mock-data";
import { PayModal } from "./PayModal";

export function VideoCard({ video }: { video: VideoItem }) {
  const [showPay, setShowPay] = useState(false);
  const isFree = video.price === 0;

  const handleAction = () => {
    if (isFree) return;
    setShowPay(true);
  };

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-lg">
        <div className="relative aspect-[9/14] w-full overflow-hidden">
          <img src={video.thumbnail} alt={video.title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
          {!isFree && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-xs font-bold text-primary-foreground backdrop-blur">
              <Lock size={12} /> TSh {video.price.toLocaleString()}
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
        <div className="grid grid-cols-2 gap-2 p-3">
          <button
            onClick={handleAction}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-neon)] active:scale-95"
          >
            <Play size={16} fill="currentColor" /> {isFree ? "Play" : "Unlock"}
          </button>
          <button
            onClick={handleAction}
            className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-muted py-2.5 text-sm font-semibold text-foreground active:scale-95"
          >
            <Download size={16} /> Download
          </button>
        </div>
      </div>
      {showPay && <PayModal video={video} onClose={() => setShowPay(false)} />}
    </>
  );
}