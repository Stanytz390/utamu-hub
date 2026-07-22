import { useState } from "react";
import { X, Check } from "lucide-react";
import type { VideoItem } from "@/lib/mock-data";

const networks = [
  { id: "halopesa", name: "HaloPesa", color: "from-orange-500 to-red-500" },
  { id: "mixx", name: "MixxByYas", color: "from-yellow-400 to-amber-600" },
  { id: "mpesa", name: "M-Pesa", color: "from-green-500 to-emerald-600" },
  { id: "airtel", name: "Airtel Money", color: "from-red-500 to-rose-600" },
];

type Props = { video: VideoItem; onClose: () => void };

export function PayModal({ video, onClose }: Props) {
  const [step, setStep] = useState<"pick" | "number" | "done">("pick");
  const [network, setNetwork] = useState<(typeof networks)[number] | null>(null);
  const [phone, setPhone] = useState("");

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-t-3xl bg-card p-6 sm:rounded-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-bold">
            {step === "done" ? "Malipo yamefanikiwa" : `Lipa TSh ${video.price.toLocaleString()}`}
          </h3>
          <button onClick={onClose} className="rounded-full p-1 text-muted-foreground hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        {step === "pick" && (
          <>
            <p className="mb-4 text-sm text-muted-foreground">Chagua mtandao wa malipo</p>
            <div className="grid grid-cols-2 gap-3">
              {networks.map((n) => (
                <button
                  key={n.id}
                  onClick={() => {
                    setNetwork(n);
                    setStep("number");
                  }}
                  className="group flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/40 p-4 transition-all hover:border-primary"
                >
                  <div className={`h-14 w-14 rounded-full bg-gradient-to-br ${n.color} shadow-lg`} />
                  <span className="text-sm font-semibold">{n.name}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === "number" && network && (
          <>
            <div className="mb-4 flex items-center gap-3 rounded-2xl bg-muted/40 p-3">
              <div className={`h-10 w-10 rounded-full bg-gradient-to-br ${network.color}`} />
              <div>
                <p className="text-sm font-semibold">{network.name}</p>
                <p className="text-xs text-muted-foreground">TSh {video.price.toLocaleString()}</p>
              </div>
            </div>
            <label className="mb-2 block text-xs font-medium text-muted-foreground">Namba ya simu</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="07XX XXX XXX"
              className="mb-4 w-full rounded-xl border border-border bg-input px-4 py-3 text-foreground outline-none focus:border-primary"
            />
            <button
              disabled={phone.length < 9}
              onClick={() => setStep("done")}
              className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground shadow-[var(--shadow-neon)] disabled:opacity-50"
            >
              Lipa TSh {video.price.toLocaleString()} kwa {network.name}
            </button>
          </>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
              <Check size={32} strokeWidth={3} />
            </div>
            <p className="text-sm text-muted-foreground">
              Sasa unaweza ku-download na ku-watch video hii wakati wowote.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground"
            >
              Endelea
            </button>
          </div>
        )}
      </div>
    </div>
  );
}