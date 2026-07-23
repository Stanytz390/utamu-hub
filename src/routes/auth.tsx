import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      ref: (search.ref as string) || undefined,
    };
  },
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const ADMIN_EMAIL = "officialstanlee143@gmail.com";

  useEffect(() => {
    if (search.ref) sessionStorage.setItem("pending_ref", search.ref);
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/", replace: true });
    };
    checkSession();
  }, [navigate, search.ref]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // FIX HAPA: Tunachukua .message pekee ili kuzuia {}
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (data.user?.email === ADMIN_EMAIL) {
        await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "admin" }, { onConflict: 'user_id,role' });
      }
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      setError("Network error. Jaribu tena.");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { username: username || email.split("@")[0] } },
      });

      if (authError) {
        // FIX HAPA: Tunageuza kuwa String
        setError(String(authError.message));
        setLoading(false);
        return;
      }

      if (data.session) {
        if (data.user?.email === ADMIN_EMAIL) {
          await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "admin" }, { onConflict: 'user_id,role' });
        }
        navigate({ to: "/", replace: true });
      } else {
        setSuccess("Imekubali! Kagua email yako kuthibitisha akaunti.");
        setMode("signin");
      }
    } catch (err: any) {
      setError("Imeshindwa kusajili.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-10 bg-background min-h-screen text-foreground">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition">
        <i className="fas fa-arrow-left text-xs mr-2"></i> Rudi Nyumbani
      </Link>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)] animate-pulse">
          <i className="fas fa-user-shield text-3xl text-primary-foreground"></i>
        </div>
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-3xl font-black tracking-tighter text-transparent">
          UTAMU PORI
        </h1>
        <p className="mt-2 text-sm text-muted-foreground font-semibold uppercase tracking-widest">
          {mode === "signin" ? "Ingia Sasa" : "Jiunge na Sisi"}
        </p>
      </div>

      <div className="space-y-4">
        <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-1.5 block text-xs font-black uppercase text-muted-foreground ml-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="mfano: mjanja_01"
                className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                required
              />
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-black uppercase text-muted-foreground ml-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="barua@pepe.com"
              className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-black uppercase text-muted-foreground ml-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-2xl border border-border bg-card px-4 py-4 text-sm outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              required
            />
          </div>

          {/* ERROR BOX FIX: String check is here */}
          {error && (
            <div className="rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-xs text-destructive font-bold flex items-center gap-3">
              <i className="fas fa-exclamation-triangle text-lg"></i>
              <span>{typeof error === 'object' ? "Hitilafu ya kiufundi, jaribu tena." : error}</span>
            </div>
          )}

          {success && (
            <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-xs text-green-500 font-bold flex items-center gap-3">
              <i className="fas fa-check-circle text-lg"></i>
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-primary py-4 font-black text-white shadow-[var(--shadow-neon)] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center gap-3"
          >
            {loading ? <i className="fas fa-spinner fa-spin text-xl"></i> : <i className="fas fa-sign-in-alt"></i>}
            {mode === "signin" ? "INGIA" : "TENGENEZA AKAUNTI"}
          </button>
        </form>

        <div className="pt-4 text-center">
          <button
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError(null);
            }}
            className="text-sm font-bold text-secondary hover:text-primary transition"
          >
            {mode === "signin" ? "Huna akaunti? Jisajili" : "Tayari unayo akaunti? Ingia"}
          </button>
        </div>
      </div>
    </div>
  );
}