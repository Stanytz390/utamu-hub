import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ 
    ref: typeof s.ref === "string" ? s.ref : undefined,
    magic: typeof s.magic === "string" ? s.magic : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in · UTAMU PORI" },
      { name: "description", content: "Sign in or create your account." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { ref, magic } = useSearch({ from: "/auth" });
  const [mode, setMode] = useState<"signin" | "signup" | "magic">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // Handle magic link verification on page load
  useEffect(() => {
    if (magic) {
      // Magic link callback – Supabase handles this automatically if redirectTo is set
      // We'll just show a success message and redirect
      setInfo("Magic link verified! You are now signed in.");
      setTimeout(() => navigate({ to: "/" }), 2000);
    }
  }, [magic, navigate]);

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  // Sign in with email + password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/", replace: true });
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email + password
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?magic=true`,
          data: { 
            username: username || email.split("@")[0],
            referral_code: ref ?? null 
          },
        },
      });
      if (error) throw error;
      if (ref && typeof window !== "undefined") sessionStorage.setItem("pending_ref", ref);
      setInfo("Account created! Check your email for a magic link to verify and sign in.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  // Send magic link (passwordless)
  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setInfo(null);
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth?magic=true`,
        },
      });
      if (error) throw error;
      setInfo("Magic link sent! Check your email to sign in.");
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to send magic link");
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth (no card required)
  const handleGitHub = async () => {
    setErr(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${window.location.origin}/auth?magic=true`,
      },
    });
    if (error) setErr(error.message);
  };

  // Switch mode and clear messages
  const switchMode = (newMode: "signin" | "signup" | "magic") => {
    setMode(newMode);
    setErr(null);
    setInfo(null);
    setPassword("");
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
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black text-transparent">
          UTAMU PORI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" && "Sign in to your account"}
          {mode === "signup" && "Create a new account"}
          {mode === "magic" && "Sign in with a magic link"}
        </p>
      </div>

      {/* GitHub OAuth Button */}
      <button
        onClick={handleGitHub}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 font-semibold text-foreground hover:bg-muted"
      >
        <i className="fab fa-github text-xl"></i> Continue with GitHub
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> OR <span className="h-px flex-1 bg-border" />
      </div>

      {/* Auth Form */}
      <form onSubmit={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleMagicLink} className="space-y-3">
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

        {mode !== "magic" && (
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
        )}

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
          {loading ? <i className="fas fa-spinner fa-spin mr-2"></i> : null}
          {mode === "signin" && "Sign In"}
          {mode === "signup" && "Sign Up"}
          {mode === "magic" && "Send Magic Link"}
        </button>
      </form>

      {/* Mode Switcher */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        {mode !== "signin" && (
          <button onClick={() => switchMode("signin")} className="font-semibold text-secondary hover:underline">
            Sign In
          </button>
        )}
        {mode !== "signup" && (
          <button onClick={() => switchMode("signup")} className="font-semibold text-secondary hover:underline">
            Sign Up
          </button>
        )}
        {mode !== "magic" && (
          <button onClick={() => switchMode("magic")} className="font-semibold text-secondary hover:underline">
            Magic Link
          </button>
        )}
      </div>

      {/* Help Text */}
      <div className="mt-4 text-center text-xs text-muted-foreground">
        {mode === "magic" && (
          <p>We'll email you a secure link to sign in instantly.</p>
        )}
        {mode === "signin" && (
          <p>Don't have an account? <button onClick={() => switchMode("signup")} className="font-semibold text-secondary">Sign Up</button></p>
        )}
        {mode === "signup" && (
          <p>Already have an account? <button onClick={() => switchMode("signin")} className="font-semibold text-secondary">Sign In</button></p>
        )}
      </div>
    </div>
  );
}