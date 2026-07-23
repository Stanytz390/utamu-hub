import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        navigate({ to: "/", replace: true });
      }
    });
  }, [navigate]);

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          setError("Email au password sio sahihi.");
        } else {
          setError(error.message);
        }
        return;
      }

      // Auto‑promote admin if email matches
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (adminEmail && data.user?.email === adminEmail) {
        await supabase
          .from("profiles")
          .upsert({ id: data.user.id, role: "admin" }, { onConflict: "id" });
      }

      // Success – redirect to home
      navigate({ to: "/", replace: true });
    } catch (err: any) {
      setError("Tatizo la mtandao. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username || email.split("@")[0],
          },
        },
      });

      if (error) {
        if (error.message.includes("User already registered")) {
          setError("Email hii tayari imesajiliwa. Tafadhali ingia.");
        } else {
          setError(error.message);
        }
        return;
      }

      // If email confirmation is OFF, user gets a session immediately
      if (data.session) {
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        if (adminEmail && data.user?.email === adminEmail) {
          await supabase
            .from("profiles")
            .upsert({ id: data.user.id, role: "admin" }, { onConflict: "id" });
        }
        // Success – redirect to home
        navigate({ to: "/", replace: true });
      } else {
        // If email confirmation is ON, show a message
        setSuccess("Account imeundwa! Angalia email yako kwa link ya kuthibitisha.");
        setMode("signin");
      }
    } catch (err: any) {
      setError("Tatizo la mtandao. Jaribu tena.");
    } finally {
      setLoading(false);
    }
  };

  // GitHub OAuth
  const handleGitHub = async () => {
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      if (error) setError(error.message);
    } catch (err: any) {
      setError("Tatizo la mtandao. Jaribu tena.");
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <i className="fas fa-arrow-left text-xs mr-1"></i> Rudi Nyumbani
      </Link>

      <div className="mb-6 text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
          <i className="fas fa-sign-in-alt text-2xl text-primary-foreground"></i>
        </div>
        <h1 className="bg-[image:var(--gradient-primary)] bg-clip-text text-2xl font-black text-transparent">
          UTAMU PORI
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signin" ? "Ingia kwenye akaunti yako" : "Fungua akaunti mpya"}
        </p>
      </div>

      {/* GitHub Button */}
      <button
        onClick={handleGitHub}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 font-semibold text-foreground hover:bg-muted"
      >
        <i className="fab fa-github text-xl"></i> Endelea na GitHub
      </button>

      <div className="mb-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> AU <span className="h-px flex-1 bg-border" />
      </div>

      <form
        onSubmit={mode === "signin" ? handleSignIn : handleSignUp}
        className="space-y-3"
      >
        {mode === "signup" && (
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Jina la Mtumiaji</label>
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
          <label className="mb-1 block text-xs text-muted-foreground">Barua Pepe</label>
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
          <label className="mb-1 block text-xs text-muted-foreground">Nenosiri</label>
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

        {error && (
          <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
            <i className="fas fa-exclamation-circle mr-1"></i> {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl bg-secondary/10 px-3 py-2 text-xs text-secondary">
            <i className="fas fa-check-circle mr-1"></i> {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-60"
        >
          {loading ? (
            <i className="fas fa-spinner fa-spin mr-2"></i>
          ) : null}
          {mode === "signin" ? "Ingia" : "Jisajili"}
        </button>
      </form>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => {
            setMode("signin");
            setError(null);
            setSuccess(null);
          }}
          className="font-semibold text-secondary hover:underline"
        >
          Ingia
        </button>
        <button
          onClick={() => {
            setMode("signup");
            setError(null);
            setSuccess(null);
          }}
          className="font-semibold text-secondary hover:underline"
        >
          Jisajili
        </button>
      </div>
    </div>
  );
}