import { Coins } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export function CoinBadge() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data: userRes } = await supabase.auth.getUser();
      if (!userRes.user) { if (mounted) setBalance(null); return; }
      const { data } = await supabase
        .from("coin_wallets")
        .select("balance_sq")
        .eq("user_id", userRes.user.id)
        .maybeSingle();
      if (mounted) setBalance(data?.balance_sq ?? 0);
    };
    load();
    const { data: sub } = supabase.auth.onAuthStateChange(() => load());
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  if (balance === null) return null;
  return (
    <Link
      to="/wallet"
      className="inline-flex items-center gap-1.5 rounded-full bg-[image:var(--gradient-primary)] px-3 py-1.5 text-xs font-black text-primary-foreground shadow-[var(--shadow-neon)]"
    >
      <Coins size={14} /> {balance} SQ
    </Link>
  );
}