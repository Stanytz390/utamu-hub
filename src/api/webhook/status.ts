// src/routes/api/payment/status.ts
import { createAPIFileRoute } from '@tanstack/react-start/api';
import { checkTransactionStatus } from '@/lib/speedpesa';

export const APIRoute = createAPIFileRoute('/api/payment/status')({
  GET: async ({ request }) => {
    const url = new URL(request.url);
    const reference = url.searchParams.get('reference');
    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference' }), { status: 400 });
    }
    try {
      const status = await checkTransactionStatus(reference);
      return new Response(JSON.stringify(status), { status: 200 });
    } catch (error: any) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
  },
});