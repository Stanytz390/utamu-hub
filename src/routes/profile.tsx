import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { User, Phone, LogIn, Edit3, Check } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile · UTAMU PORI" },
      { name: "description", content: "Simamia account yako — jina, namba ya simu, na settings." },
    ],
  }),
  component: Profile,
});

function Profile() {
  const [signedIn, setSignedIn] = useState(false);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("Mgeni");
  const [phone, setPhone] = useState("+255700000000");

  if (!signedIn) {
    return (
      <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-6 text-center">
        <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] shadow-[var(--shadow-neon)]">
          <User size={48} className="text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-black">Karibu UTAMU PORI</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in ili u-save videos zako, follow dadaz, na jiunge groups za VIP.
        </p>
        <button
          onClick={() => setSignedIn(true)}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)]"
        >
          <LogIn size={18} /> Sign in / Sign up
        </button>
        <p className="mt-4 text-[11px] text-muted-foreground">
          Kwa kuendelea unakubali terms & privacy policy.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg">
      <header className="border-b border-border/60 bg-background/80 px-4 py-3">
        <h1 className="text-xl font-black">My Profile</h1>
      </header>

      <section className="flex flex-col items-center p-6">
        <div className="rounded-full bg-[image:var(--gradient-primary)] p-1 shadow-[var(--shadow-neon)]">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-background">
            <User size={40} className="text-muted-foreground" />
          </div>
        </div>
        <p className="mt-3 text-lg font-bold">{name}</p>
        <p className="text-xs text-muted-foreground">{phone}</p>
      </section>

      <section className="space-y-3 px-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold">Account details</h2>
            <button
              onClick={() => setEditing((v) => !v)}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-semibold text-foreground"
            >
              {editing ? <Check size={12} /> : <Edit3 size={12} />}
              {editing ? "Save" : "Edit"}
            </button>
          </div>

          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Jina</label>
          <input
            disabled={!editing}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mb-3 w-full rounded-xl border border-border bg-input px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-70"
          />
          <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Namba ya simu</label>
          <div className="relative">
            <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              disabled={!editing}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-input py-2 pl-9 pr-3 text-sm outline-none focus:border-primary disabled:opacity-70"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            { label: "Downloads", value: 12 },
            { label: "Following", value: 8 },
            { label: "Groups", value: 3 },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-border bg-card p-3">
              <p className="text-lg font-black">{s.value}</p>
              <p className="text-[10px] uppercase text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <button
          onClick={() => setSignedIn(false)}
          className="mt-2 w-full rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground"
        >
          Sign out
        </button>
      </section>
    </div>
  );
}