import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Phone, LogOut, Save, Coins } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ReferralCard } from "@/components/ReferralCard";
import { CoinBadge } from "@/components/CoinBadge";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile · UTAMU PORI" },
      { name: "description", content: "Simamia account yako — jina, namba ya simu, na settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("username, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username ?? "");
        setPhone(data.phone ?? "");
      }
      // Apply pending referral captured before signup, if any.
      if (typeof window !== "undefined") {
        const pending = sessionStorage.getItem("pending_ref");
        if (pending) {
          const { data: inviter } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", pending)
            .maybeSingle();
          if (inviter && inviter.id !== user.id) {
            await supabase.from("profiles").update({ referred_by: inviter.id }).eq("id", user.id);
            await supabase.from("referrals").insert({
              inviter_id: inviter.id,
              invitee_id: user.id,
              status: "pending",
            });
          }
          sessionStorage.removeItem("pending_ref");
        }
      }
    })();
  }, []);

  const save = async () => {
    if (!userId) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ username, phone })
      .eq("id", userId);
    setSaving(false);
    setMsg(error ? `Hitilafu: ${error.message}` : "Imehifadhiwa.");
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="border-b border-border/60 bg-background/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black">My Profile</h1>
          <CoinBadge />
        </div>
      </header>

      <section className="flex flex-col items-center p-6">
        <div className="rounded-full bg-[image:var(--gradient-primary)] p-1 shadow-[var(--shadow-neon)]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
            <User size={40} className="text-muted-foreground" />
          </div>
        </div>
        <p className="mt-3 text-lg font-bold">{username || "Mgeni"}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </section>

      <section className="space-y-3 px-4">
        <Link
          to="/wallet"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex items-center gap-2 text-sm font-bold"><Coins size={16} className="text-primary" /> SQ Wallet</span>
          <span className="text-xs text-muted-foreground">Top up · historia · redeem →</span>
        </Link>

        <ReferralCard />

        <div className="rounded-2xl border border-border bg-card p-4">
          <h2 className="mb-3 text-sm font-bold">Account details</h2>

          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mb-3 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Namba ya simu</label>
          <div className="relative mb-3">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+255700000000"
              className="w-full rounded-xl border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            onClick={save}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-60"
          >
            <Save size={14} /> {saving ? "Inahifadhi..." : "Hifadhi"}
          </button>
          {msg && <p className="mt-2 text-center text-xs text-muted-foreground">{msg}</p>}
        </div>

        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground"
        >
          <LogOut size={14} /> Sign out
        </button>
      </section>
    </div>
  );
}