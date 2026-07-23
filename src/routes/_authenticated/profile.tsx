import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { User, Phone, LogOut, Save, Coins, Edit, X } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { ReferralCard } from "@/components/ReferralCard";
import { CoinBadge } from "@/components/CoinBadge";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({
    meta: [
      { title: "Profile · UTAMU PORI" },
      { name: "description", content: "Manage your account — name, phone number, and settings." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");

  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes.user;
      if (!user) return;
      setUserId(user.id);
      setEmail(user.email ?? "");
      const { data } = await supabase
        .from("profiles")
        .select("username, phone")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setUsername(data.username ?? "");
        setPhone(data.phone ?? "");
      }
      // Apply pending referral captured before signup, if any.
      if (typeof window !== "undefined") {
        const pending = sessionStorage.getItem("pending_ref");
        if (pending) {
          const { data: inviter } = await supabase
            .from("profiles")
            .select("id")
            .eq("referral_code", pending)
            .maybeSingle();
          if (inviter && inviter.id !== user.id) {
            await supabase.from("profiles").update({ referred_by: inviter.id }).eq("id", user.id);
            await supabase.from("referrals").insert({
              inviter_id: inviter.id,
              invitee_id: user.id,
              status: "pending",
            });
          }
          sessionStorage.removeItem("pending_ref");
        }
      }
    })();
  }, []);

  // Open modal with current values
  const openEditModal = () => {
    setEditUsername(username);
    setEditPhone(phone);
    setMsg(null);
    setShowEditModal(true);
  };

  // Close modal without saving
  const closeEditModal = () => {
    setShowEditModal(false);
    setMsg(null);
  };

  // Save changes from modal
  const saveChanges = async () => {
    if (!userId) return;
    setSaving(true);
    setMsg(null);
    const { error } = await supabase
      .from("profiles")
      .update({ username: editUsername, phone: editPhone })
      .eq("id", userId);
    setSaving(false);
    if (error) {
      setMsg(`Error: ${error.message}`);
    } else {
      // Update displayed values
      setUsername(editUsername);
      setPhone(editPhone);
      setMsg("Profile updated successfully.");
      // Close modal after a short delay so user sees success message
      setTimeout(() => {
        closeEditModal();
      }, 1000);
    }
  };

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="mx-auto max-w-lg">
      <header className="border-b border-border/60 bg-background/80 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-black">My Profile</h1>
          <CoinBadge />
        </div>
      </header>

      <section className="flex flex-col items-center p-6">
        <div className="rounded-full bg-[image:var(--gradient-primary)] p-1 shadow-[var(--shadow-neon)]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
            <User size={40} className="text-muted-foreground" />
          </div>
        </div>
        <p className="mt-3 text-lg font-bold">{username || "Guest"}</p>
        <p className="text-xs text-muted-foreground">{email}</p>
      </section>

      <section className="space-y-3 px-4">
        <Link
          to="/wallet"
          className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
        >
          <span className="flex items-center gap-2 text-sm font-bold">
            <Coins size={16} className="text-primary" /> SQ Wallet
          </span>
          <span className="text-xs text-muted-foreground">Top up · history · redeem →</span>
        </Link>

        <ReferralCard />

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">Account Details</h2>
            <button
              onClick={openEditModal}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition"
            >
              <Edit size={16} /> Edit
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Username:</span>
              <span className="ml-2 font-medium">{username || "Not set"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Phone:</span>
              <span className="ml-2 font-medium">{phone || "Not set"}</span>
            </div>
          </div>
        </div>

        <button
          onClick={signOut}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground"
        >
          <LogOut size={14} /> Sign out
        </button>
      </section>

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-card border border-border shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Edit Profile</h2>
              <button
                onClick={closeEditModal}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Username</label>
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">Phone Number</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+255700000000"
                  className="w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary"
                />
              </div>

              {msg && (
                <p className={`text-center text-sm ${msg.includes('Error') ? 'text-destructive' : 'text-secondary'}`}>
                  {msg}
                </p>
              )}

              <button
                onClick={saveChanges}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-60"
              >
                <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}