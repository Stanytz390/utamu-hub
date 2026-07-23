import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  Phone, MessageCircle, MapPin, ArrowLeft, 
  Lock, Coins, Star, ShieldCheck, User 
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
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes.user?.id || null;
      setUserId(uid);

      const { data } = await supabase.from("dadaz_profiles").select("*").eq("id", id).maybeSingle();
      if (data) {
        setProfile(data);
        if (uid) {
          const { data: unlock } = await supabase.from("dadaz_contact_unlocks").select("id").eq("dadaz_id", id).eq("user_id", uid).maybeSingle();
          if (unlock) setUnlocked(true);
        }
      }
      setLoading(false);
    };
    fetch();
  }, [id]);

  const handleUnlock = async () => {
    if (!userId) return navigate({ to: "/auth" });
    const cost = profile.contact_reveal_cost_sq || 10;

    const { error } = await supabase.rpc("spend_coins", {
      _user_id: userId,
      _amount: cost,
      _kind: "purchase",
      _ref_id: profile.id,
      _note: `Unlocked contact for ${profile.username}`,
    });

    if (error) {
      toast.error("Insufficient coins. Please top up.");
      return;
    }

    await supabase.from("dadaz_contact_unlocks").insert({ user_id: userId, dadaz_id: profile.id, cost_sq: cost });
    setUnlocked(true);
    toast.success("Contact Unlocked!");
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-background"><div className="h-10 w-10 animate-spin border-4 border-primary rounded-full border-t-transparent"></div></div>;
  if (!profile) return <div className="p-20 text-center">Profile not found.</div>;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-background text-white">
      <Toaster position="top-center" richColors />
      <header className="fixed top-0 z-50 flex w-full max-w-lg items-center justify-between border-b border-white/5 bg-background/60 p-4 backdrop-blur-xl">
        <Link to="/dadaz" className="p-2 bg-white/5 rounded-full"><ArrowLeft size={20}/></Link>
        <span className="font-black italic uppercase text-xs tracking-widest">Profile Detail</span>
        <CoinBadge />
      </header>

      <div className="pt-16 pb-32">
        <div className="relative aspect-[3/4] w-full overflow-hidden">
          <img src={profile.avatar_url || "https://via.placeholder.com/600x800"} className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6">
            <h2 className="text-4xl font-black italic tracking-tighter uppercase">{profile.username}</h2>
            <p className="flex items-center gap-2 text-sm text-secondary font-bold mt-1 uppercase"><MapPin size={16}/> {profile.location || "Tanzania"}</p>
          </div>
        </div>

        <div className="px-6 space-y-8 mt-6">
          <div className="flex justify-around bg-[#111] p-6 rounded-[2rem] border border-white/5">
            <div className="text-center"><p className="text-xl font-black">{profile.followers_count || "1.2K"}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Followers</p></div>
            <div className="text-center border-x border-white/10 px-8"><p className="text-xl font-black">{profile.likes_count || "8.4K"}</p><p className="text-[10px] text-muted-foreground uppercase font-bold">Likes</p></div>
            <div className="text-center"><p className="text-xl font-black text-primary"><Star size={16} fill="currentColor"/></p><p className="text-[10px] text-muted-foreground uppercase font-bold">Verified</p></div>
          </div>

          <div>
            <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2 ml-1">About Me</h3>
            <p className="text-sm leading-relaxed text-gray-300 bg-[#111] p-5 rounded-2xl border border-white/5">{profile.bio || "No biography provided."}</p>
          </div>

          {profile.services && (
            <div>
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mb-2 ml-1">Services</h3>
              <div className="flex flex-wrap gap-2">
                {profile.services.split(',').map((s: any, i: any) => (
                  <span key={i} className="bg-white/5 px-4 py-2 rounded-xl text-xs font-bold border border-white/5">{s.trim()}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 mx-auto max-w-lg bg-[#050505]/80 p-4 backdrop-blur-2xl border-t border-white/5">
        {unlocked ? (
          <div className="flex gap-3">
            <a href={`tel:${profile.phone}`} className="flex-1 bg-secondary text-black py-4 rounded-2xl font-black flex justify-center items-center gap-2"><Phone size={20}/> CALL NOW</a>
            <a href={`https://wa.me/${profile.whatsapp?.replace(/[^0-9]/g, '')}`} className="flex-1 bg-green-500 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2"><MessageCircle size={20}/> WHATSAPP</a>
          </div>
        ) : (
          <button onClick={handleUnlock} className="w-full bg-primary py-5 rounded-2xl font-black flex justify-center items-center gap-3 shadow-neon">
            <Lock size={20}/> UNLOCK CONTACTS ({profile.contact_reveal_cost_sq || 10} SQ)
          </button>
        )}
      </div>
    </div>
  );
}