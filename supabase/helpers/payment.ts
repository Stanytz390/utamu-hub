import { supabase } from '../client';

export async function spendCoins(
  userId: string,
  amount: number,
  kind: string,
  refId: string,
  note: string
): Promise<boolean> {
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

export async function addCoins(
  userId: string,
  amount: number,
  kind: string,
  refId: string,
  note: string
): Promise<boolean> {
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