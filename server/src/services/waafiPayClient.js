import { randomUUID } from 'node:crypto';

// WaafiPay charges Somali mobile wallets (EVC Plus, Zaad, Sahal). The call
// blocks while the customer approves the charge with their PIN on their
// phone, so it needs a much longer timeout than a normal API request.
const DEFAULT_API_URL = 'https://api.waafipay.net/asm';
const REQUEST_TIMEOUT_MS = 120 * 1000;
const SUCCESS_CODE = '2001';

export function isPaymentConfigured() {
  return Boolean(
    process.env.WAAFIPAY_MERCHANT_UID && process.env.WAAFIPAY_API_USER_ID && process.env.WAAFIPAY_API_KEY
  );
}

// Accepts the ways people actually type a Somali number ("61 5551234",
// "0615551234", "+252615551234") and returns the 252XXXXXXXXX form WaafiPay
// expects, or null if it isn't a valid mobile number.
export function normalizeSomaliPhone(input) {
  let digits = String(input || '').replace(/\D/g, '');
  if (digits.startsWith('00252')) digits = digits.slice(2);
  if (digits.startsWith('252')) digits = digits.slice(3);
  if (digits.startsWith('0')) digits = digits.slice(1);
  return /^\d{9}$/.test(digits) ? `252${digits}` : null;
}

export async function chargeWallet({ phone, amount, currency, referenceId, description }) {
  const res = await fetch(process.env.WAAFIPAY_API_URL || DEFAULT_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    body: JSON.stringify({
      schemaVersion: '1.0',
      requestId: randomUUID(),
      timestamp: new Date().toISOString(),
      channelName: 'WEB',
      serviceName: 'API_PURCHASE',
      serviceParams: {
        merchantUid: process.env.WAAFIPAY_MERCHANT_UID,
        apiUserId: process.env.WAAFIPAY_API_USER_ID,
        apiKey: process.env.WAAFIPAY_API_KEY,
        paymentMethod: 'MWALLET_ACCOUNT',
        payerInfo: { accountNo: phone },
        transactionInfo: {
          referenceId,
          invoiceId: referenceId,
          amount: String(amount),
          currency,
          description,
        },
      },
    }),
  });

  if (!res.ok) {
    throw new Error(`WaafiPay responded with HTTP ${res.status}`);
  }

  const body = await res.json();
  const approved = body.responseCode === SUCCESS_CODE && body.params?.state === 'APPROVED';
  return {
    approved,
    transactionId: body.params?.transactionId || null,
    message: body.responseMsg || null,
  };
}
