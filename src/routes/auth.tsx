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

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: "/", replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  // Handle magic link callback
  useEffect(() => {
    if (magic === "true") {
      const check = async () => {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          navigate({ to: "/", replace: true });
        } else {
          setErr("Magic link verification failed. Please try again.");
        }
      };
      check();
    }
  }, [magic, navigate]);

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
    } catch (e: any) {
      setErr(e.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email + password (sends confirmation email)
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
            referral_code: ref ?? null,
          },
        },
      });
      if (error) throw error;
      if (ref) sessionStorage.setItem("pending_ref", ref);
      setInfo("Account created! Check your email for a confirmation link.");
    } catch (e: any) {
      setErr(e.message || "Sign up failed");
    } finally {
      setLoading(false);
    }
  };

  // Magic link (passwordless)
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
    } catch (e: any) {
      setErr(e.message || "Failed to send magic link");
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
        options: {
          redirectTo: `${window.location.origin}/auth?magic=true`,
        },
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
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black text-transparent">
          UTAMU PORI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" && "Sign in to your account"}
          {mode === "signup" && "Create a new account"}
          {mode === "magic" && "Sign in with a magic link"}
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

      <form
        onSubmit={mode === "signin" ? handleSignIn : mode === "signup" ? handleSignUp : handleMagicLink}
        className="space-y-3"
      >
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

        {err && <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">{err}</p>}
        {info && <p className="rounded-xl bg-secondary/10 px-3 py-2 text-xs text-secondary">{info}</p>}

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

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => setMode("signin")} className="font-semibold text-secondary hover:underline">
          Sign In
        </button>
        <button onClick={() => setMode("signup")} className="font-semibold text-secondary hover:underline">
          Sign Up
        </button>
        <button onClick={() => setMode("magic")} className="font-semibold text-secondary hover:underline">
          Magic Link
        </button>
      </div>
    </div>
  );
}