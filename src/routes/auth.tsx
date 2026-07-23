import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect, Component } from "react";
import { supabase } from "@/integrations/supabase/client";

// Error Boundary to catch crashes
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean; error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 text-center text-red-600 bg-red-50 rounded-xl max-w-lg mx-auto mt-10">
          <p className="font-bold">Something went wrong.</p>
          <pre className="text-xs mt-2 whitespace-pre-wrap bg-white p-4 rounded border">
            {this.state.error?.message || "Unknown error"}
          </pre>
          <p className="text-sm mt-4">Check environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_KEY).</p>
        </div>
      );
    }
    return this.props.children;
  }
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({
    ref: typeof s.ref === "string" ? s.ref : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · UTAMU PORI" },
      { name: "description", content: "Sign in or create your account." },
    ],
  }),
  component: () => (
    <ErrorBoundary>
      <AuthPage />
    </ErrorBoundary>
  ),
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

  // Check session & auto‑promote admin (env var, never displayed)
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
          if (adminEmail && data.session.user.email === adminEmail) {
            await supabase
              .from("profiles")
              .upsert(
                { id: data.session.user.id, role: "admin", email: data.session.user.email },
                { onConflict: "id" }
              );
          }
          navigate({ to: "/", replace: true });
        }
      } catch (e) {
        setErr("Session check failed: " + (e as Error).message);
      }
    };
    checkSession();
  }, [navigate]);

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (adminEmail && data.user.email === adminEmail) {
        await supabase.from("profiles").upsert({ id: data.user.id, role: "admin" }, { onConflict: "id" });
      }
      navigate({ to: "/", replace: true });
    } catch (e: any) {
      setErr(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // Sign Up – no verification
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split("@")[0],
            referral_code: ref ?? null,
          },
        },
      });
      if (error) throw error;
      if (ref) sessionStorage.setItem("pending_ref", ref);
      
      if (data.session) {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        if (adminEmail && data.user?.email === adminEmail) {
          await supabase.from("profiles").upsert({ id: data.user.id, role: "admin" }, { onConflict: "id" });
        }
        navigate({ to: "/", replace: true });
      } else {
        setInfo("Account created! Please sign in.");
        setMode("signin");
      }
    } catch (e: any) {
      setErr(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth
  const handleGitHub = async () => {
    setErr(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (e: any) {
      setErr(e.message || "GitHub login failed");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <i className="fas fa-arrow-left text-xs mr-1"></i> Back to Home
      </Link>
      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
          <i className="fas fa-sign-in-alt text-2xl text-primary-foreground"></i>
        </div>
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black text-transparent">UTAMU PORI</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Sign in to your account" : "Create a new account"}
        </p>
      </div>

      <button
        onClick={handleGitHub}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 font-semibold text-foreground hover:bg-muted"
      >
        <i className="fab fa-github text-xl"></i> Continue with GitHub
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-xl border border-border bg-input px-3 py-3 text-sm outline-none focus:border-primary"
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-xs text-muted-foreground">Email</label>
          <div className="relative">
            <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
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
            <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
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
        {err && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
        {info && <p className="rounded-xl bg-secondary/10 px-3 py-2 text-xs text-secondary">{info}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-60"
        >
          {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
          {mode === "signin" ? "Sign In" : "Sign Up"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setMode("signin")} className="font-semibold text-secondary hover:underline">Sign In</button>
        <button onClick={() => setMode("signup")} className="font-semibold text-secondary hover:underline">Sign Up</button>
      </div>
    </div>
  );
}