import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, 
  MessageCircle, 
  MapPin, 
  Heart, 
  Users, 
  ArrowLeft, 
  Lock, 
  Coins, 
  ShieldCheck,
  Star,
  Image as ImageIcon
} from "lucide-react";
import { CoinBadge } from "@/components/CoinBadge";
import { toast, Toaster } from "sonner";

export const Route = createFileRoute("/dadaz/$id")({
  component: DadazProfilePage,
});

function DadazProfilePage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  
  const [profile, setProfile] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      setLoading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const currentUid = userRes.user?.id || null;
      setUserId(currentUid);

      // 1. Fetch Profile Details
      const { data: profileData, error: profileError } = await supabase
        .from("dadaz_profiles")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (profileError || !profileData) {
        toast.error("Profile not found");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      // 2. Fetch Gallery Photos
      const { data: photosData } = await supabase
        .from("dadaz_photos")
        .select("*")
        .eq("dadaz_id", id)
        .order("sort_order", { ascending: true });
      
      setPhotos(photosData || []);

      // 3. Check if contact is already unlocked
      if (currentUid) {
        const { data: unlock } = await supabase
          .from("dadaz_contact_unlocks")
          .select("id")
          .eq("dadaz_id", id)
          .eq("user_id", currentUid)
          .maybeSingle();
        
        if (unlock) setUnlocked(true);
      }
      
      setLoading(false);
    };

    fetchProfileData();
  }, [id]);

  const handleUnlock = async () => {
    if (!userId) {
      toast.error("Please login to unlock contacts");
      navigate({ to: "/auth" });
      return;
    }
    
    if (unlocked || busy) return;

    setBusy(true);
    const cost = profile.contact_reveal_cost_sq || 10;

    try {
      // Execute the RPC to spend coins
      const { error: rpcError } = await supabase.rpc("spend_coins", {
        _user_id: userId,
        _amount: cost,
        _kind: "purchase",
        _ref_id: profile.id,
        _note: `Unlocked contact for ${profile.username}`,
      });

      if (rpcError) {
        if (rpcError.message.includes("insufficient")) {
          toast.error("Insufficient coins. Please top up your wallet.");
        } else {
          toast.error(rpcError.message);
        }
        setBusy(false);
        return;
      }

      // Record the unlock in the database
      await supabase.from("dadaz_contact_unlocks").insert({
        user_id: userId,
        dadaz_id: profile.id,
        cost_sq: cost
      });

      setUnlocked(true);
      toast.success("Contact information unlocked!");
    } catch (err) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-bold text-muted-foreground animate-pulse">Loading Profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold">Profile Not Found</h2>
        <Link to="/dadaz" className="mt-4 text-primary font-bold underline">Go Back</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background text-foreground">
      <Toaster position="top-center" richColors />
      
      {/* Dynamic Header */}
      <header className="fixed top-0 z-50 flex w-full max-w-lg items-center justify-between border-b border-white/10 bg-background/60 px-4 py-3 backdrop-blur-xl">
        <Link to="/dadaz" className="rounded-full bg-white/5 p-2 text-foreground transition-all active:scale-90">
          <ArrowLeft size={20} />
        </Link>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Verified Profile</p>
          <h1 className="text-sm font-black italic">@{profile.username}</h1>
        </div>
        <CoinBadge />
      </header>

      <div className="pt-14 pb-32">
        {/* Hero Section */}
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img 
            src={profile.avatar_url || profile.cover_url || "https://via.placeholder.com/600x800"} 
            alt={profile.username} 
            className="h-full w-full object-cover" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
             <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-black uppercase shadow-lg backdrop-blur-md ${
               profile.status === 'service' ? 'bg-primary text-white' : 'bg-secondary text-black'
             }`}>
               <ShieldCheck size={12} /> {profile.status || 'Free'}
             </span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="relative -mt-20 px-4">
          <div className="rounded-3xl border border-white/10 bg-card/80 p-6 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <h2 className="text-3xl font-black italic tracking-tight text-white">{profile.username}</h2>
              <div className="mt-2 flex items-center gap-4 text-xs font-bold text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin size={14} className="text-secondary" /> {profile.location || "Tanzania"}</span>
                <span className="h-1 w-1 rounded-full bg-white/20" />
                <span className="flex items-center gap-1 text-primary"><Star size={14} fill="currentColor" /> Verified</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-6 flex justify-around border-y border-white/5 py-4">
              <div className="text-center">
                <p className="text-lg font-black text-white">{profile.followers_count?.toLocaleString() || "1.2K"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Followers</p>
              </div>
              <div className="text-center border-x border-white/5 px-8">
                <p className="text-lg font-black text-white">{profile.likes_count?.toLocaleString() || "8.4K"}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Likes</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black text-white">{photos.length}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Photos</p>
              </div>
            </div>

            {/* About & Services */}
            <div className="mt-6 space-y-6">
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">About Me</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-300">
                  {profile.bio || "No biography provided."}
                </p>
              </div>

              {profile.services && (
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-secondary">My Services</h3>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {profile.services.split(',').map((s: string, i: number) => (
                      <span key={i} className="rounded-lg bg-white/5 px-3 py-1.5 text-[11px] font-medium text-white border border-white/5">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Photo Gallery */}
          {photos.length > 0 && (
            <div className="mt-8">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black italic text-white uppercase tracking-wider">
                <ImageIcon size={16} className="text-primary" /> Private Gallery
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {photos.map((p) => (
                  <div key={p.id} className="group relative aspect-square overflow-hidden rounded-2xl border border-white/5 bg-muted">
                    <img 
                      src={p.image_url} 
                      alt="Gallery" 
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" 
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Bottom Contact Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg border-t border-white/10 bg-background/80 p-4 backdrop-blur-2xl">
        {unlocked ? (
          <div className="flex gap-3">
            <a 
              href={`tel:${profile.phone}`} 
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-secondary py-4 text-sm font-black text-black transition-transform active:scale-95 shadow-[var(--shadow-cyan)]"
            >
              <Phone size={18} fill="currentColor" /> CALL NOW
            </a>
            <a 
              href={`https://wa.me/${profile.whatsapp?.replace(/[^0-9]/g, '')}`} 
              target="_blank" 
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-green-500 py-4 text-sm font-black text-white transition-transform active:scale-95 shadow-lg shadow-green-500/20"
            >
              <MessageCircle size={18} fill="currentColor" /> WHATSAPP
            </a>
          </div>
        ) : (
          <button 
            onClick={handleUnlock}
            disabled={busy}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-primary py-4 font-black text-white shadow-[var(--shadow-neon)] transition-all active:scale-95 disabled:opacity-70"
          >
            {busy ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <>
                <Lock size={18} className="transition-transform group-hover:-translate-y-1" />
                UNLOCK CONTACT INFO ({profile.contact_reveal_cost_sq || 10} SQ)
              </>
            )}
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent group-hover:animate-[shimmer_1.5s_infinite]" />
          </button>
        )}
        <p className="mt-2 text-center text-[9px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">
          Discreet Billing & Verified Profiles
        </p>
      </div>
    </div>
  );
}