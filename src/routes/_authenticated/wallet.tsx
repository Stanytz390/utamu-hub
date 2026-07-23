import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Coins, ArrowUpRight, ArrowDownLeft, Loader2, Gift, Plus, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { fetchWallet, fetchTransactions, fetchSetting, type Wallet, type CoinTx } from "@/lib/wallet";
import { ReferralCard } from "@/components/ReferralCard";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({
    meta: [
      { title: "SQ Coins Wallet · UTAMU PORI" },
      { name: "description", content: "Manage your SQ coins, top-up, and transaction history." },
    ],
  }),
  component: WalletPage,
});

// Network logos with fallback handling
const networks = [
  { id: "halopesa", name: "HaloPesa", logo: "https://url.bmbxmd.workers.dev/halotel.png" },
  { id: "mixx", name: "MixxByYas", logo: "https://url.bmbxmd.workers.dev/7Y16IK.jpg" },
  { id: "mpesa", name: "M-Pesa", logo: "https://url.bmbxmd.workers.dev/mpesa.png" },
  { id: "airtel", name: "Airtel Money", logo: "https://url.bmbxmd.workers.dev/airtel.jpeg" },
];

// Quick select packs (optional, but useful)
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
  const [paymentRef, setPaymentRef] = useState<string | null>(null);

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
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("id", data.user.id)
        .maybeSingle();
      setPhone(profile?.phone ?? "");
      await reload(data.user.id);
    })();
  }, []);

  // Adjust amount with min=5, max=10000, step=5
  const handleAmountChange = (value: number) => {
    const newAmount = Math.max(5, Math.min(10000, value));
    setAmount(newAmount);
  };

  // 🔄 Updated topup function using the SpeedPesa API endpoint
  const topup = async () => {
    if (!userId || !amount || phone.length < 9) return;
    setBusy(true);
    setMsg(null);
    setPaymentRef(null);

    try {
      const tzsAmount = amount * sqRate;
      const response = await fetch('/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          phone,
          sqAmount: amount,
          tzsAmount,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      setPaymentRef(data.reference);
      setMsg(
        `✅ Payment request sent to ${phone}. Check your phone and complete the payment.\n` +
        `Reference: ${data.reference}\n` +
        `After confirmation, your wallet will be updated automatically.`
      );

      // Refresh wallet after a short delay to reflect webhook credit
      setTimeout(() => {
        reload(userId);
      }, 15000); // 15 seconds – adjust as needed
    } catch (e: any) {
      setMsg(`❌ ${e.message || 'Something went wrong'}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-4">
      {/* Header */}
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-black">SQ Wallet</h1>
        <Link to="/profile" className="text-xs text-muted-foreground hover:underline">
          Back to Profile
        </Link>
      </header>

      {/* Balance Card */}
      <section className="mb-4 rounded-2xl border border-border bg-[image:var(--gradient-primary)] p-5 text-primary-foreground shadow-[var(--shadow-neon)]">
        <div className="flex items-center gap-2 text-xs opacity-90">
          <Coins size={14} /> Balance
        </div>
        <p className="mt-1 text-4xl font-black">
          {wallet?.balance_sq ?? 0} <span className="text-lg font-bold opacity-80">SQ</span>
        </p>
        <p className="mt-1 text-xs opacity-80">
          ≈ TSh {((wallet?.balance_sq ?? 0) * sqRate).toLocaleString()}
        </p>
        <div className="mt-3 flex gap-4 text-[11px] opacity-90">
          <span>Earned: {wallet?.total_earned_sq ?? 0} SQ</span>
          <span>Spent: {wallet?.total_spent_sq ?? 0} SQ</span>
        </div>
      </section>

      {/* Top Up Section */}
      <section className="mb-4 rounded-2xl border border-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold">Top Up SQ</h2>

        {/* Quick Select Packs */}
        <div className="mb-3 grid grid-cols-3 gap-2">
          {packs.map((p) => (
            <button
              key={p}
              onClick={() => handleAmountChange(p)}
              className={`rounded-xl border py-2 text-sm font-bold ${
                amount === p
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-foreground"
              }`}
            >
              {p} SQ
              <span className="ml-1 text-[10px] opacity-70">
                TSh {(p * sqRate).toLocaleString()}
              </span>
            </button>
          ))}
        </div>

        {/* Manual Amount with + and - buttons */}
        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            onClick={() => handleAmountChange(amount - 5)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
            disabled={amount <= 5}
          >
            <Minus size={16} />
          </button>
          <div className="flex flex-1 flex-col items-center">
            <span className="text-2xl font-bold">{amount} SQ</span>
            <span className="text-xs text-muted-foreground">
              TSh {(amount * sqRate).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => handleAmountChange(amount + 5)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-foreground hover:bg-muted/80"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Network Selection with Logos */}
        <label className="mb-1 block text-[11px] text-muted-foreground">Payment Network</label>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {networks.map((n) => (
            <button
              key={n.id}
              onClick={() => setNet(n)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-2 ${
                net.id === n.id ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="h-10 w-10 overflow-hidden rounded-full">
                <img
                  src={n.logo}
                  alt={n.name}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = "none";
                    const parent = target.parentElement;
                    if (parent) {
                      const fallback = document.createElement("div");
                      fallback.className =
                        "flex h-full w-full items-center justify-center bg-gray-200 text-xs font-bold text-gray-600";
                      fallback.textContent = n.name.charAt(0);
                      parent.appendChild(fallback);
                    }
                  }}
                />
              </div>
              <span className="text-[9px] font-semibold">{n.name}</span>
            </button>
          ))}
        </div>

        {/* Phone Input */}
        <label className="mb-1 block text-[11px] text-muted-foreground">Phone Number</label>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="07XX XXX XXX"
          className="mb-3 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
        />

        {/* Top Up Button */}
        <button
          onClick={topup}
          disabled={busy || !amount || phone.length < 9}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-50"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Coins size={16} />}
          Pay TSh {(amount * sqRate).toLocaleString()} via {net.name}
        </button>

        {msg && (
          <div className="mt-3 whitespace-pre-wrap rounded-xl bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
            {msg}
          </div>
        )}
        {paymentRef && (
          <div className="mt-2 text-[10px] text-muted-foreground">
            Reference: {paymentRef}
          </div>
        )}
      </section>

      {/* Referral Section */}
      <div className="mb-4">
        <ReferralCard />
      </div>

      {/* Transaction History */}
      <section className="mb-4 rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-bold">Transaction History</h2>
          <Link
            to="/redeem"
            className="inline-flex items-center gap-1 rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold text-secondary hover:bg-secondary/20"
          >
            <Gift size={12} /> Redeem Code
          </Link>
        </div>
        {txs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {txs.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    t.delta_sq > 0
                      ? "bg-secondary/20 text-secondary"
                      : "bg-primary/20 text-primary"
                  }`}
                >
                  {t.delta_sq > 0 ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{t.note ?? t.kind}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {new Date(t.created_at).toLocaleString()} · {t.status}
                  </p>
                </div>
                <span
                  className={`text-sm font-bold ${
                    t.delta_sq > 0 ? "text-secondary" : "text-primary"
                  }`}
                >
                  {t.delta_sq > 0 ? "+" : ""}
                  {t.delta_sq} SQ
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}