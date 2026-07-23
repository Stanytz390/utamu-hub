import { supabase } from '../client';

export type Wallet = {
  balance_sq: number;
  total_earned_sq: number;
  total_spent_sq: number;
};

export type CoinTx = {
  id: string;
  delta_sq: number;
  balance_after: number;
  kind: string;
  ref_id: string;
  note: string;
  status: string;
  created_at: string;
};

export async function fetchWallet(userId: string): Promise<Wallet | null> {
  const { data } = await supabase
    .from('coin_wallets')
    .select('balance_sq, total_earned_sq, total_spent_sq')
    .eq('user_id', userId)
    .maybeSingle();
  return data;
}

export async function fetchTransactions(userId: string): Promise<CoinTx[]> {
  const { data } = await supabase
    .from('coin_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  return data || [];
}

export async function fetchSetting<T = string>(key: string): Promise<T | null> {
  const { data } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle();
  return data?.value as T ?? null;
}

export async function requestManualTopUp(
  userId: string,
  sqAmount: number,
  gateway: string,
  phone: string
): Promise<void> {
  const { error } = await supabase
    .from('coin_topups')
    .insert({
      user_id: userId,
      sq_amount: sqAmount,
      tzs_amount: sqAmount * 100, // assuming 1 SQ = 100 TSh
      gateway,
      status: 'pending',
    });
  if (error) throw new Error(error.message);
}