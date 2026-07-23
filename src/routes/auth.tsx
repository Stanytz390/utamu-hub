import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: "/", replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  // Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split("@")[0] },
        },
      });
      if (error) throw error;
      console.log("Sign up response:", data);
      if (data.session) {
        // Auto-logged in – go home
        navigate({ to: "/", replace: true });
      } else if (data.user) {
        // User created but needs confirmation – redirect to sign in
        alert("Account created! Please sign in.");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log("Sign in response:", data);
      navigate({ to: "/", replace: true });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // GitHub
  const handleGitHub = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: { redirectTo: `${window.location.origin}/auth` },
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground">
        <i className="fas fa-arrow-left text-xs mr-1"></i> Back to Home
      </Link>

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black">UTAMU PORI</h1>
        <p className="text-sm text-muted-foreground">Sign in or create an account</p>
      </div>

      <button
        onClick={handleGitHub}
        className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl border py-3"
      >
        <i className="fab fa-github text-xl"></i> Continue with GitHub
      </button>

      <div className="mb-4 text-center text-xs text-muted-foreground">OR</div>

      <form className="space-y-3">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="w-full rounded-xl border border-border bg-input px-3 py-3 text-sm outline-none"
        />
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="w-full rounded-xl border border-border bg-input px-3 py-3 text-sm outline-none"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full rounded-xl border border-border bg-input px-3 py-3 text-sm outline-none"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={loading}
            className="flex-1 rounded-xl bg-primary py-3 font-bold text-primary-foreground"
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={handleSignUp}
            disabled={loading}
            className="flex-1 rounded-xl bg-secondary py-3 font-bold text-secondary-foreground"
          >
            Sign Up
          </button>
        </div>
      </form>
    </div>
  );
}