import { supabase } from '@/integrations/supabase/client';

export async function POST(req: Request) {
  const { payment_intent_id, user_id, video_id, amount_sq, status } = await req.json();

  if (status === 'succeeded') {
    // Add coins to user
    await supabase.rpc('add_coins', { _user_id: user_id, _amount: amount_sq });

    // Record payment
    await supabase.from('payments').insert({
      user_id,
      video_id,
      amount_sq,
      status: 'completed',
      payment_intent_id,
    });

    // Check if first payment (for referral)
    const { count } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id);

    if (count === 1) {
      // First payment - give referral bonuses
      const { data: profile } = await supabase
        .from('profiles')
        .select('referred_by')
        .eq('id', user_id)
        .single();

      if (profile?.referred_by) {
        // Give 2 SQ to referrer
        await supabase.rpc('add_coins', { _user_id: profile.referred_by, _amount: 2 });
        // Give 8 SQ to invitee
        await supabase.rpc('add_coins', { _user_id: user_id, _amount: 8 });

        await supabase
          .from('referrals')
          .update({ status: 'rewarded' })
          .eq('invitee_id', user_id);
      }
    }
  }

  return new Response('OK', { status: 200 });
}