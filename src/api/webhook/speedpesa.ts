// src/routes/api/webhooks/speedpesa.ts
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { supabaseAdmin } from '@/integrations/supabase/client.server';

export const APIRoute = createAPIFileRoute('/api/webhooks/speedpesa')({
  POST: async ({ request }) => {
    try {
      const payload = await request.json();

      // SpeedPesa webhook payload format (based on docs)
      const { reference, event, status, phoneNumber, completedAt } = payload;

      if (event === 'PAYIN' && status === 'SUCCESS') {
        // Find the pending top-up
        const { data: topup, error: findError } = await supabaseAdmin
          .from('coin_topups')
          .select('user_id, sq_amount')
          .eq('payment_reference', reference)
          .eq('status', 'pending')
          .single();

        if (findError || !topup) {
          console.error('Top-up not found for reference:', reference);
          return new Response('Top-up not found', { status: 404 });
        }

        // Credit the user's wallet
        const { error: creditError } = await supabaseAdmin.rpc('add_coins', {
          _user_id: topup.user_id,
          _amount: topup.sq_amount,
          _kind: 'topup',
          _ref_id: reference,
          _note: `SpeedPesa top-up completed at ${completedAt}`,
        });

        if (creditError) {
          console.error('Failed to credit coins:', creditError);
          return new Response('Failed to credit coins', { status: 500 });
        }

        // Update the top-up status
        await supabaseAdmin
          .from('coin_topups')
          .update({
            status: 'completed',
            completed_at: completedAt || new Date().toISOString(),
          })
          .eq('payment_reference', reference);

        console.log(`✅ Coins credited for reference ${reference}`);
      } else if (status === 'FAILED') {
        // Mark top-up as failed
        await supabaseAdmin
          .from('coin_topups')
          .update({ status: 'failed' })
          .eq('payment_reference', reference);
        console.log(`❌ Payment failed for reference ${reference}`);
      }

      return new Response('OK', { status: 200 });
    } catch (error: any) {
      console.error('Webhook error:', error);
      return new Response('Webhook error', { status: 500 });
    }
  },
});