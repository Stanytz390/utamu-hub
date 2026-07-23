// src/lib/speedpesa.ts

const SPEEDPESA_API_URL = process.env.SPEEDPESA_API_URL || 'https://speedpesa.com/api/v1';
const SPEEDPESA_API_KEY = process.env.SPEEDPESA_API_KEY;

if (!SPEEDPESA_API_KEY) {
  throw new Error('Missing SPEEDPESA_API_KEY environment variable');
}

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': SPEEDPESA_API_KEY,
};

/**
 * Initiate a mobile payment (Payin)
 * @param phoneNumber - Format: 2557XXXXXXXX (Tanzanian number)
 * @param amountTZS - Amount in Tanzanian Shillings (TZS)
 * @returns { reference, status }
 */
export async function initiatePayin(phoneNumber: string, amountTZS: number): Promise<{ reference: string; status: string }> {
  const response = await fetch(`${SPEEDPESA_API_URL}/mobilepayin`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      phonenumber: phoneNumber.replace(/^0+/, '255'), // Ensure 255 format
      amount: amountTZS.toString(),
    }),
  });

  const data = await response.json();

  if (data.type === 'success') {
    return {
      reference: data.data.reference,
      status: data.data.status,
    };
  } else {
    throw new Error(data.message || 'SpeedPesa payment initiation failed');
  }
}

/**
 * Check transaction status
 * @param reference - The transaction reference from initiatePayin
 */
export async function checkTransactionStatus(reference: string): Promise<any> {
  const response = await fetch(`${SPEEDPESA_API_URL}/status`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ reference }),
  });
  const data = await response.json();
  return data;
}