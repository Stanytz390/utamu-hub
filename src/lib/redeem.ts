import { supabase } from '@/integrations/supabase/client';

export async function redeemCode(code: string, userId: string) {
  // Get redeem link
  const { data: link, error } = await supabase
    .from('redeem_links')
    .select('*')
    .eq('code', code)
    .single();

  if (error || !link) throw new Error('Invalid code');
  if (link.used >= link.max_uses) throw new Error('Code already used');
  if (new Date(link.expires_at) < new Date()) throw new Error('Code expired');

  // Add coins
  await supabase.rpc('add_coins', {
    _user_id: userId,
    _amount: link.coins,
    _kind: 'redeem',
    _ref_id: link.id,
    _note: `Redeemed code: ${code}`,
  });

  // Increment used count
  await supabase
    .from('redeem_links')
    .update({ used: link.used + 1 })
    .eq('id', link.id);

  return { coins: link.coins };
}

export async function createRedeemLink(adminId: string, coins: number, maxUses: number, expiresAt: Date) {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const { data, error } = await supabase
    .from('redeem_links')
    .insert({
      code,
      coins,
      max_uses: maxUses,
      expires_at: expiresAt.toISOString(),
      created_by: adminId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}