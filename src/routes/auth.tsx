import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ ref: typeof s.ref === "string" ? s.ref : undefined }),
  head: () => ({
    meta: [
      { title: "Sign in · UTAMU PORI" },
      { name: "description", content: "Ingia au fungua account yako ya UTAMU PORI." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { ref } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  useEffect(() => {
    if (ref) setMode("signup");
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/profile", replace: true });
    });
  }, [navigate, ref]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { username: username || email.split("@")[0], referral_code: ref ?? null },
          },
        });
        if (error) throw error;
        if (ref && typeof window !== "undefined") sessionStorage.setItem("pending_ref", ref);
        setInfo("Account imefunguliwa. Ukiona ukurasa wa email confirmation, angalia inbox yako. Ukiwa umeingia, elekea Profile.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/profile", replace: true });
      }
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Imeshindikana");
    } finally {
      setLoading(false);
    }
  };

  const onGoogle = async () => {
    setErr(null);
    if (ref && typeof window !== "undefined") sessionStorage.setItem("pending_ref", ref);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) setErr(result.error.message ?? "Google sign-in imeshindikana");
    if (!result.error && !result.redirected) {
      navigate({ to: "/profile", replace: true });
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft size={14} /> Rudi Home
      </Link>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
          <LogIn size={28} className="text-primary-foreground" />
        </div>
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black text-transparent">
          UTAMU PORI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Ingia kwenye account yako" : "Fungua account mpya"}
        </p>
      </div>

      <button
        onClick={onGoogle}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 font-semibold text-foreground hover:bg-muted"
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.8 32.4 29.3 35.5 24 35.5c-6.4 0-11.5-5.1-11.5-11.5S17.6 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.1 29.1 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.3-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.7 19 12.5 24 12.5c2.9 0 5.6 1.1 7.6 2.9l5.7-5.7C33.7 6.1 29.1 4 24 4 16.3 4 9.7 8.4 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44c5 0 9.6-1.9 13.1-5l-6.1-5c-1.9 1.4-4.3 2.3-7 2.3-5.3 0-9.8-3.6-11.3-8.4l-6.5 5C9.5 39.6 16.1 44 24 44z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.1 5C41.6 34.3 44 29.6 44 24c0-1.2-.1-2.3-.4-3.5z"/>
        </svg>
        Endelea na Google
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> AU <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={onSubmit} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Jina lako"
              className="w-full rounded-xl border border-border bg-input px-3 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Email</label>
          <div className="relative">
            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-border bg-input py-3 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Password</label>
          <div className="relative">
            <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-input py-3 pl-9 pr-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        {err && (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>
        )}
        {info && (
          <p className="rounded-xl bg-secondary/10 px-3 py-2 text-xs text-secondary">{info}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-60"
        >
          {loading ? "Inaendelea..." : mode === "signin" ? "Sign in" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "signin" ? "Huna account?" : "Una account tayari?"}{" "}
        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="font-semibold text-secondary"
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}