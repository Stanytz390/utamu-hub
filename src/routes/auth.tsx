import { createFileRoute, useNavigate, Link, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  // Capture the referral code from the URL (?ref=CODE)
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

  // Updated Admin Email
  const ADMIN_EMAIL = "officialstanlee143@gmail.com";

  // Handle referral logic and session checking
  useEffect(() => {
    // 1. Store referral code in sessionStorage if present in URL
    if (search.ref) {
      sessionStorage.setItem("pending_ref", search.ref);
    }

    // 2. Redirect if already logged in
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Auto-promote to admin if email matches
        if (data.session.user?.email === ADMIN_EMAIL) {
          await supabase.from("user_roles").upsert(
            { user_id: data.session.user.id, role: "admin" },
            { onConflict: "user_id,role" }
          );
        }
        navigate({ to: "/", replace: true });
      }
    };
    checkSession();
  }, [navigate, search.ref]);

  // Sign In Logic
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
        // BUG FIX: Access .message to avoid rendering an object {}
        setError(authError.message);
        setLoading(false);
        return;
      }

      // Check admin status on login
      if (data.user?.email === ADMIN_EMAIL) {
        await supabase.from("user_roles").upsert(
          { user_id: data.user.id, role: "admin" },
          { onConflict: "user_id,role" }
        );
      }

      navigate({ to: "/", replace: true });
    } catch (err: any) {
      setError("An unexpected network error occurred.");
      setLoading(false);
    }
  };

  // Sign Up Logic
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split("@")[0],
          },
        },
      });

      if (authError) {
        // BUG FIX: Force convert to string to avoid the red {} brackets
        setError(String(authError.message));
        setLoading(false);
        return;
      }

      if (data.session) {
        // If sign up is instant (email confirm off)
        if (data.user?.email === ADMIN_EMAIL) {
          await supabase.from("user_roles").upsert(
            { user_id: data.user.id, role: "admin" },
            { onConflict: "user_id,role" }
          );
        }
        navigate({ to: "/", replace: true });
      } else {
        setSuccess("Karibu! Tafadhali kagua email yako kuthibitisha akaunti.");
        setMode("signin");
      }
    } catch (err: any) {
      setError("Signup failed. Check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = async () => {
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (authError) setError(authError.message);
    } catch (err: any) {
      setError("OAuth failed.");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <i className="fas fa-arrow-left text-xs mr-1"></i> Back to Home
      </Link>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
          <i className="fas fa-user-lock text-2xl text-primary-foreground"></i>
        </div>
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black text-transparent">
          UTAMU PORI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          {mode === "signin" ? "Ingia kwenye akaunti yako" : "Jisajili sasa upate Utamu"}
        </p>
      </div>

      <button
        onClick={handleGitHub}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 font-semibold text-foreground hover:bg-muted transition-all active:scale-95"
      >
        <i className="fab fa-github text-xl"></i> Continue with GitHub
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground uppercase tracking-widest">
        <span className="h-px flex-1 bg-border" /> AU <span className="h-px flex-1 bg-border" />
      </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground font-bold">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Jina lako la utani"
              className="w-full rounded-xl border border-border bg-input px-3 py-3 text-sm outline-none focus:border-primary transition-all"
            />
          </div>
        )}

        <div>
          <label className="mb-1 block text-xs text-muted-foreground font-bold">Barua Pepe (Email)</label>
          <div className="relative">
            <i className="fas fa-envelope absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="mfano@gmail.com"
              className="w-full rounded-xl border border-border bg-input py-3 pl-9 pr-3 text-sm outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs text-muted-foreground font-bold">Nenosiri (Password)</label>
          <div className="relative">
            <i className="fas fa-lock absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs"></i>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-input py-3 pl-9 pr-3 text-sm outline-none focus:border-primary transition-all"
            />
          </div>
        </div>

        {/* ERROR BOX FIX: Ensuring only strings are rendered */}
        {error && (
          <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20 animate-shake">
            <i className="fas fa-exclamation-triangle mr-1"></i> 
            {typeof error === 'object' ? "Hitilafu imetokea. Jaribu tena." : error}
          </div>
        )}

        {success && (
          <div className="rounded-xl bg-green-500/10 px-3 py-2 text-xs text-green-500 border border-green-500/20">
            <i className="fas fa-check-circle mr-1"></i> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] hover:opacity-90 transition-all active:scale-95 disabled:opacity-60 flex justify-center items-center gap-2"
        >
          {loading && <i className="fas fa-spinner fa-spin"></i>}
          {mode === "signin" ? "Ingia Sasa" : "Tengeneza Akaunti"}
        </button>
      </form>

      <div className="mt-8 flex flex-col items-center gap-4 text-sm">
        <p className="text-muted-foreground">
          {mode === "signin" ? "Huna akaunti bado?" : "Tayari unayo akaunti?"}
        </p>
        <button
          onClick={() => {
            setMode(mode === "signin" ? "signup" : "signin");
            setError(null);
            setSuccess(null);
          }}
          className="font-black text-secondary hover:text-primary transition-colors text-lg"
        >
          {mode === "signin" ? "Sign Up" : "Sign In"}
        </button>
      </div>
    </div>
  );
}