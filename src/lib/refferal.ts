import { supabase } from '@/integrations/supabase/client';

export async function generateReferralCode(userId: string) {
  const code = Math.random().toString(36).substring(2, 8).toUpperCase();
  await supabase
    .from('profiles')
    .update({ referral_code: code })
    .eq('id', userId);
  return code;
}

export async function applyReferral(newUserId: string, code: string) {
  const { data: referrer } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .single();

  if (referrer) {
    await supabase
      .from('profiles')
      .update({ referred_by: referrer.id })
      .eq('id', newUserId);

    await supabase.from('referrals').insert({
      referrer_id: referrer.id,
      invitee_id: newUserId,
      status: 'pending',
    });

    // Give 2 SQ to referrer immediately
    await supabase.rpc('add_coins', {
      _user_id: referrer.id,
      _amount: 2,
      _kind: 'referral',
      _ref_id: `ref-${newUserId}`,
      _note: 'Referral bonus',
    });
  }
}