import { supabase } from '@/integrations/supabase/client';

export async function createCheckoutSession(userId: string, sqAmount: number) {
  const { data: rate } = await supabase
    .from('app_settings')
    .select('value')
    .eq('key', 'sq_to_tsh')
    .single();

  const tshAmount = sqAmount * Number(rate?.value || 100);

  // Call your payment gateway API (Stripe/SpeedPesa)
  const response = await fetch('/api/create-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, sqAmount, tshAmount }),
  });

  return response.json();
}

export async function spendCoins(userId: string, amount: number, kind: string, refId: string, note: string) {
  const { data, error } = await supabase.rpc('spend_coins', {
    _user_id: userId,
    _amount: amount,
    _kind: kind,
    _ref_id: refId,
    _note: note,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function addCoins(userId: string, amount: number, kind: string, refId: string, note: string) {
  const { data, error } = await supabase.rpc('add_coins', {
    _user_id: userId,
    _amount: amount,
    _kind: kind,
    _ref_id: refId,
    _note: note,
  });
  if (error) throw new Error(error.message);
  return data;
}