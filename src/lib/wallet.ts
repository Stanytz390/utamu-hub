import { supabase } from "@/integrations/supabase/client";

export type Wallet = {
  user_id: string;
  balance_sq: number;
  total_earned_sq: number;
  total_spent_sq: number;
};

export async function fetchWallet(userId: string): Promise<Wallet | null> {
  const { data } = await supabase
    .from("coin_wallets")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data as Wallet | null;
}

export type CoinTx = {
  id: string;
  delta_sq: number;
  kind: string;
  status: string;
  ref_id: string | null;
  note: string | null;
  created_at: string;
};

export async function fetchTransactions(userId: string, limit = 50): Promise<CoinTx[]> {
  const { data } = await supabase
    .from("coin_transactions")
    .select("id, delta_sq, kind, status, ref_id, note, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as CoinTx[];
}

export async function fetchSetting<T = unknown>(key: string): Promise<T | null> {
  const { data } = await supabase.from("app_settings").select("value").eq("key", key).maybeSingle();
  return (data?.value ?? null) as T | null;
}

export async function requestManualTopUp(userId: string, sqAmount: number, network: string, phone: string) {
  // Wave 4: this becomes SpeedaPesa STK push. For now record a pending transaction.
  const { error } = await supabase.from("coin_transactions").insert({
    user_id: userId,
    delta_sq: sqAmount,
    kind: "topup",
    status: "pending",
    ref_id: `manual-${Date.now()}`,
    note: `Top-up ombi: ${network} ${phone} — subiri admin/kilo cha malipo`,
  });
  if (error) throw error;
}