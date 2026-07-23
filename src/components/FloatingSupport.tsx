import { useEffect, useState } from "react";
import { MessageCircle, Phone, X, Radio } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export function FloatingSupport() {
  const [open, setOpen] = useState(false);
  const [waNumber, setWaNumber] = useState<string>("+255700000000");
  const [waChannel, setWaChannel] = useState<string>("");
  const [supportEmail, setSupportEmail] = useState<string>("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["support_whatsapp", "whatsapp_channel", "support_email"]);
      for (const row of data ?? []) {
        const v = typeof row.value === "string" ? row.value : JSON.stringify(row.value).replace(/^"|"$/g, "");
        if (row.key === "support_whatsapp") setWaNumber(v);
        if (row.key === "whatsapp_channel") setWaChannel(v);
        if (row.key === "support_email") setSupportEmail(v);
      }
    })();
  }, []);

  const waLink = `https://wa.me/${waNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Habari UTAMU PORI, nahitaji msaada.")}`;

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-[90] w-64 rounded-2xl border border-border bg-card p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-black">Msaada</p>
            <button onClick={() => setOpen(false)}><X size={14} /></button>
          </div>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            className="mb-2 flex items-center gap-2 rounded-xl bg-secondary/20 px-3 py-2 text-xs font-semibold text-secondary">
            <MessageCircle size={14} /> WhatsApp Support
          </a>
          {waChannel && (
            <a href={waChannel} target="_blank" rel="noopener noreferrer"
              className="mb-2 flex items-center gap-2 rounded-xl bg-primary/15 px-3 py-2 text-xs font-semibold text-primary">
              <Radio size={14} /> Follow WhatsApp Channel
            </a>
          )}
          {supportEmail && (
            <a href={`mailto:${supportEmail}`}
              className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold">
              <Phone size={14} /> {supportEmail}
            </a>
          )}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-4 z-[80] flex h-14 w-14 items-center justify-center rounded-full bg-[image:var(--gradient-primary)] text-primary-foreground shadow-[var(--shadow-neon)]"
        aria-label="Support"
      >
        <MessageCircle size={24} />
      </button>
    </>
  );
}