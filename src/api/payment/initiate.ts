// src/routes/api/payment/initiate.ts
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { initiatePayin } from '@/lib/speedpesa';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const APIRoute = createAPIFileRoute('/api/payment/initiate')({
  POST: async ({ request }) => {
    try {
      const body = await request.json();
      const { userId, phone, sqAmount, tzsAmount } = body;

      if (!userId || !phone || !sqAmount || !tzsAmount) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 1. Create a pending top-up record
      const { data: topup, error: insertError } = await supabaseAdmin
        .from('coin_topups')
        .insert({
          user_id: userId,
          sq_amount: sqAmount,
          tzs_amount: tzsAmount,
          status: 'pending',
          gateway: 'speedpesa',
        })
        .select()
        .single();

      if (insertError || !topup) {
        throw new Error('Failed to create top-up record');
      }

      // 2. Initiate SpeedPesa payment
      const result = await initiatePayin(phone, tzsAmount);

      // 3. Update the top-up record with the SpeedPesa reference
      await supabaseAdmin
        .from('coin_topups')
        .update({ payment_reference: result.reference })
        .eq('id', topup.id);

      return new Response(
        JSON.stringify({
          success: true,
          reference: result.reference,
          status: result.status,
          topupId: topup.id,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error('Payment initiation error:', error);
      return new Response(
        JSON.stringify({ error: error.message || 'Payment initiation failed' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  },
});