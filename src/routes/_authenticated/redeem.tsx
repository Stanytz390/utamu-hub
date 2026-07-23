import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Gift, Loader2, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/redeem")({
  validateSearch: (s: Record<string, unknown>) => ({ code: typeof s.code === "string" ? s.code : undefined }),
  head: () => ({
    meta: [
      { title: "Redeem SQ · UTAMU PORI" },
      { name: "description", content: "Enter a redeem code and get free SQ coins." },
    ],
  }),
  component: RedeemPage,
});

function RedeemPage() {
  const { code: incoming } = useSearch({ from: "/_authenticated/redeem" });
  const navigate = useNavigate();
  const [code, setCode] = useState(incoming ?? "");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; msg: string; coins?: number } | null>(null);

  const submit = async () => {
    if (!code.trim()) return;
    setBusy(true);
    setResult(null);

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      setBusy(false);
      return navigate({ to: "/auth" });
    }

    const { data, error } = await supabase.rpc("claim_redeem_link", {
      _code: code.trim().toUpperCase(),
      _user_id: userRes.user.id,
    });

    setBusy(false);

    if (error) {
      setResult({ ok: false, msg: error.message });
      return;
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      setResult({ ok: false, msg: "No response from server." });
      return;
    }

    setResult({
      ok: row.coins_credited > 0,
      msg: row.message,
      coins: row.coins_credited,
    });
  };

  useEffect(() => {
    if (incoming) submit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incoming]);

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link to="/wallet" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft size={14} /> Back to Wallet
      </Link>

      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
          <Gift size={26} className="text-primary-foreground" />
        </div>

        <h1 className="text-lg font-black">Redeem SQ Code</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Enter the code you received from the admin or friends.
        </p>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. FREE-100"
          className="mt-4 w-full rounded-xl border border-border bg-input px-3 py-3 text-center text-lg font-mono uppercase outline-none focus:border-primary"
        />

        <button
          onClick={submit}
          disabled={busy || !code.trim()}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-60"
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
          Claim
        </button>

        {result && (
          <div
            className={`mt-4 rounded-xl px-3 py-2 text-sm ${
              result.ok
                ? "bg-secondary/10 text-secondary"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {result.ok && result.coins ? `+${result.coins} SQ received! ` : ""}
            {result.msg}
          </div>
        )}
      </div>
    </div>
  );
}