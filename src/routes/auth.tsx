--- utamu-hub-main/src/routes/auth.tsx ---
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

  // New Admin Email
  const ADMIN_EMAIL = "officialstanlee143@gmail.com";

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        // Auto-promote admin if email matches
        if (data.session.user?.email === ADMIN_EMAIL) {
          const { data: roleData } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.session.user.id)
            .eq("role", "admin")
            .maybeSingle();
          if (!roleData) {
            await supabase
              .from("user_roles")
              .insert({ user_id: data.session.user.id, role: "admin" });
          }
        }
        navigate({ to: "/", replace: true });
      }
    };
    checkSession();
  }, [navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        setLoading(false);
        return;
      }

      if (data.user?.email === ADMIN_EMAIL) {
        await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "admin" }, { onConflict: 'user_id,role' });
      }

      navigate({ to: "/", replace: true });
    } catch (err: any) {
      // Fix: Ensure we set a string, not an object
      setError(err?.message || "An unexpected error occurred");
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username: username || email.split("@")[0] },
        },
      });

      if (signUpError) {
        // Fix: Force convert to string to avoid {} rendering bug
        setError(String(signUpError.message));
        setLoading(false);
        return;
      }

      if (data.session) {
        if (data.user?.email === ADMIN_EMAIL) {
          await supabase.from("user_roles").upsert({ user_id: data.user.id, role: "admin" }, { onConflict: 'user_id,role' });
        }
        navigate({ to: "/", replace: true });
      } else {
        setSuccess("Check your email to confirm your account!");
        setMode("signin");
      }
    } catch (err: any) {
      setError(err?.message || "Sign up failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ... (rest of component)
  // Inside the return, ensure the error display is robust:
  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      {/* ... */}
      <form onSubmit={mode === "signin" ? handleSignIn : handleSignUp} className="space-y-3">
        {/* ... inputs */}
        
        {error && (
          <div className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive border border-destructive/20">
            <i className="fas fa-exclamation-circle mr-1"></i> 
            {typeof error === 'object' ? JSON.stringify(error) : error}
          </div>
        )}
        
        {/* ... button */}
      </form>
      {/* ... */}
    </div>
  );
}