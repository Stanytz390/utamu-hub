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

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/", replace: true });
    });
  }, [navigate]);

  const handleSignUp = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username: username || email.split("@")[0] } },
    });
    if (error) setError(error.message);
    else if (data.session) {
      // Auto-promote admin
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (adminEmail && data.user?.email === adminEmail) {
        await supabase.from("profiles").upsert({ id: data.user.id, role: "admin" }, { onConflict: "id" });
      }
      navigate({ to: "/", replace: true });
    }
    setLoading(false);
  };

  const handleSignIn = async () => {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    else {
      // Auto-promote admin
      const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
      if (adminEmail && data.user.email === adminEmail) {
        await supabase.from("profiles").upsert({ id: data.user.id, role: "admin" }, { onConflict: "id" });
      }
      navigate({ to: "/", replace: true });
    }
    setLoading(false);
  };

  const handleGitHub = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold text-center">UTAMU PORI</h1>
      <input className="w-full border p-2 my-2 rounded" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
      <input className="w-full border p-2 my-2 rounded" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
      <input className="w-full border p-2 my-2 rounded" type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <button className="w-full bg-blue-500 text-white p-2 my-1 rounded" onClick={handleSignIn} disabled={loading}>Sign In</button>
      <button className="w-full bg-green-500 text-white p-2 my-1 rounded" onClick={handleSignUp} disabled={loading}>Sign Up</button>
      <button className="w-full bg-gray-800 text-white p-2 my-1 rounded flex items-center justify-center gap-2" onClick={handleGitHub}>
        <i className="fab fa-github"></i> Continue with GitHub
      </button>
    </div>
  );
}