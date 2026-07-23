import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, Loader2, Gift } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchWallet, fetchTransactions, fetchSetting, requestManualTopUp, type Wallet, type CoinTx } from "@/lib/wallet";
import { ReferralCard } from "@/components/ReferralCard";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "SQ Coins Wallet · UTAMU PORI" },
      { name: "description", content: "Angalia coins zako, top-up SQ, na historia ya matumizi." },
    ],
  }),
  component: WalletPage,
});

const networks = [
  { id: "halopesa", name: "HaloPesa", color: "from-orange-500 to-red-500" },
  { id: "mixx", name: "MixxByYas", color: "from-yellow-400 to-amber-600" },
  { id: "mpesa", name: "M-Pesa", color: "from-green-500 to-emerald-600" },
  { id: "airtel", name: "Airtel Money", color: "from-red-500 to-rose-600" },
];

const packs = [10, 25, 50, 100, 250, 500];

function WalletPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [txs, setTxs] = useState<CoinTx[]>([]);
  const [sqRate, setSqRate] = useState(100);
  const [amount, setAmount] = useState<number>(25);
  const [net, setNet] = useState(networks[0]);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const reload = async (uid: string) => {
    const [w, t, r] = await Promise.all([
      fetchWallet(uid),
      fetchTransactions(uid),
      fetchSetting<number>("sq_to_tsh"),
    ]);
    setWallet(w);
    setTxs(t);
    if (r != null) setSqRate(Number(r));
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      setPhone((await supabase.from("profiles").select("phone").eq("id", data.user.id).maybeSingle()).data?.phone ?? "");
      await reload(data.user.id);
    })();
  }, []);

  const topup = async () => {
    if (!userId || !amount || phone.length < 9) return;
    setBusy(true); setMsg(null);
    try {
      await requestManualTopUp(userId, amount, net.name, phone);
      setMsg(`Ombi la ${amount} SQ (TSh ${(amount * sqRate).toLocaleString()}) limewekwa. Malipo halisi ya SpeedaPesa yatakuja Wave 4.`);
      await reload(userId);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Imeshindikana");
    } finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black">SQ Wallet</h1>
        <Link to="/profile" className="text-xs text-muted-foreground">Rudi Profile</Link>
      </header>

      <section className="mb-4 rounded-2xl border border-border bg-[image:var(--gradient-primary)] p-5 text-primary-foreground shadow-[var(--shadow-neon)]">
        <div className="flex items-center gap-2 text-xs opacity-90"><Coins size={14} /> Balance</div>
        <p className="mt-1 text-4xl font-black">{wallet?.balance_sq ?? 0} <span className="text-lg font-bold opacity-80">SQ</span></p>
        <p className="mt-1 text-xs opacity-80">≈ TSh {((wallet?.balance_sq ?? 0) * sqRate).toLocaleString()}</p>
        <div className="mt-3 flex gap-4 text-[11px] opacity-90">
          <span>Earned: {wallet?.total_earned_sq ?? 0} SQ</span>
          <span>Spent: {wallet?.total_spent_sq ?? 0} SQ</span>
        </div>
      </section>

      <section className="mb-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold">Top up SQ</h2>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {packs.map((p) => (
            <button
              key={p}
              onClick={() => setAmount(p)}
              className={`rounded-xl border py-2 text-sm font-bold ${amount === p ? "border-primary bg-primary/10 text-primary" : "border-border bg-muted text-foreground"}`}
            >
              {p} SQ<span className="ml-1 text-[10px] opacity-70">TSh {(p * sqRate).toLocaleString()}</span>
            </button>
          ))}
        </div>
        <label className="mb-1 block text-[11px] text-muted-foreground">Mtandao</label>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {networks.map((n) => (
            <button
              key={n.id}
              onClick={() => setNet(n)}
              className={`flex flex-col items-center gap-1 rounded-xl border py-2 ${net.id === n.id ? "border-primary" : "border-border"}`}
            >
              <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${n.color}`} />
              <span className="text-[9px] font-semibold">{n.name}</span>
            </button>
          ))}
        </div>
        <label className="mb-1 block text-[11px] text-muted-foreground">Namba ya simu</label>
        <input
          value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX"
          className="mb-3 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button onClick={topup} disabled={busy || !amount || phone.length < 9}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-50">
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
          Lipa TSh {(amount * sqRate).toLocaleString()} kwa {net.name}
        </button>
        {msg && <p className="mt-2 text-center text-xs text-muted-foreground">{msg}</p>}
      </section>

      <div className="mb-4">
        <ReferralCard />
      </div>

      <section className="mb-4 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Historia</h2>
          <Link to="/redeem" className="inline-flex items-center gap-1 text-xs text-secondary"><Gift size={12} /> Redeem code</Link>
        </div>
        {txs.length === 0 ? (
          <p className="text-xs text-muted-foreground">Bado hakuna muamala.</p>
        ) : (
          <ul className="divide-y divide-border">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full ${t.delta_sq > 0 ? "bg-secondary/20 text-secondary" : "bg-primary/20 text-primary"}`}>
                  {t.delta_sq > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{t.note ?? t.kind}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleString()} · {t.status}</p>
                </div>
                <span className={`text-sm font-bold ${t.delta_sq > 0 ? "text-secondary" : "text-primary"}`}>
                  {t.delta_sq > 0 ? "+" : ""}{t.delta_sq} SQ
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}