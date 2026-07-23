import { useEffect, useState } from "react";
import { Copy, Gift, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function ReferralCard() {
  const [code, setCode] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [rewarded, setRewarded] = useState(0);
  const [copied, setCopied] = useState(false);
  const [inviterReward, setInviterReward] = useState(2);
  const [inviteeReward, setInviteeReward] = useState(8);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) return;
      const [{ data: prof }, { data: refs }, { data: s1 }, { data: s2 }] = await Promise.all([
        supabase.from("profiles").select("referral_code").eq("id", userRes.user.id).maybeSingle(),
        supabase.from("referrals").select("id, status").eq("inviter_id", userRes.user.id),
        supabase.from("app_settings").select("value").eq("key", "referral_inviter_reward").maybeSingle(),
        supabase.from("app_settings").select("value").eq("key", "referral_invitee_reward").maybeSingle(),
      ]);
      setCode(prof?.referral_code ?? null);
      setCount(refs?.length ?? 0);
      setRewarded((refs ?? []).filter((r) => r.status === "rewarded").length);
      if (s1?.value != null) setInviterReward(Number(s1.value));
      if (s2?.value != null) setInviteeReward(Number(s2.value));
    })();
  }, []);

  if (!code) return null;
  const link = `${typeof window !== "undefined" ? window.location.origin : ""}/auth?ref=${code}`;

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-border bg-[image:var(--gradient-primary)] p-4 text-primary-foreground shadow-[var(--shadow-neon)]">
      <div className="mb-2 flex items-center gap-2 text-sm font-black">
        <Gift size={16} /> Alika marafiki, pata coins
      </div>
      <p className="text-xs opacity-90">
        Wewe unapata <b>{inviterReward} SQ</b>, rafiki yako anapata <b>{inviteeReward} SQ</b> akianza kununua coins.
      </p>
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-black/25 px-3 py-2 text-xs">
        <span className="flex-1 truncate">{link}</span>
        <button onClick={copy} className="rounded-md bg-white/20 px-2 py-1 text-[11px] font-bold">
          <Copy size={12} className="inline" /> {copied ? "OK" : "Copy"}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1"><Users size={12} /> {count} walioalikwa</span>
        <span>· {rewarded} wamelipwa</span>
        <span className="ml-auto rounded bg-black/25 px-2 py-0.5 font-mono text-[11px]">{code}</span>
      </div>
    </div>
  );
}