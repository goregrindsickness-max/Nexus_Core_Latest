import crypto from 'crypto';
import { vi } from 'vitest';

export const TEST_STRIPE_WEBHOOK_SECRET = 'whsec_test_deterministic_secret';
export const TEST_STRIPE_SECRET_KEY = 'sk_test_deterministic_key';

/**
 * Generates a deterministic Stripe-compatible `Stripe-Signature` header (`t=...,v1=...`)
 * for offline webhook testing.
 */
export function createMockStripeSignature(
  payload: string | Buffer,
  secret: string = TEST_STRIPE_WEBHOOK_SECRET,
  timestamp: number = 1770000000
): string {
  const payloadStr = Buffer.isBuffer(payload) ? payload.toString('utf8') : String(payload);
  const signedPayload = `${timestamp}.${payloadStr}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(signedPayload, 'utf8')
    .digest('hex');
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Deterministically verifies a Stripe webhook signature offline and returns the parsed event.
 * Throws a Stripe-compatible signature verification Error if the header or secret is invalid.
 */
export function verifyMockStripeWebhookConstructEvent(
  payload: string | Buffer | Record<string, any>,
  sigHeader: string,
  secret: string
): any {
  if (!sigHeader || typeof sigHeader !== 'string') {
    throw new Error('No stripe-signature header value was provided.');
  }
  if (!secret || typeof secret !== 'string') {
    throw new Error('No webhook secret was provided.');
  }

  const rawString = Buffer.isBuffer(payload)
    ? payload.toString('utf8')
    : typeof payload === 'string'
    ? payload
    : JSON.stringify(payload);

  const parts = sigHeader.split(',').reduce<Record<string, string>>((acc, item) => {
    const [k, v] = item.trim().split('=');
    if (k && v) acc[k] = v;
    return acc;
  }, {});

  const timestamp = parts.t;
  const v1Sig = parts.v1;

  if (!timestamp || !v1Sig) {
    throw new Error('Unable to extract timestamp and signatures from header');
  }

  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${rawString}`, 'utf8')
    .digest('hex');

  const isMatch =
    expectedSig.length === v1Sig.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(v1Sig));

  if (!isMatch) {
    throw new Error('No signatures found matching the expected signature for payload');
  }

  return JSON.parse(rawString);
}

export const mockStripeClient: any = {
  webhooks: {
    constructEvent: vi.fn(
      (payload: string | Buffer, sigHeader: string, secret: string) =>
        verifyMockStripeWebhookConstructEvent(payload, sigHeader, secret)
    ),
  },
  checkout: {
    sessions: {
      create: vi.fn(async (params: any) => ({
        id: 'cs_test_deterministic_session_001',
        url: 'https://checkout.stripe.mock/pay/cs_test_deterministic_session_001',
        payment_status: 'unpaid',
        status: 'open',
        metadata: params?.metadata || {},
        client_reference_id: params?.client_reference_id || null,
      })),
      retrieve: vi.fn(async (id: string) => ({
        id,
        payment_status: 'paid',
        status: 'complete',
      })),
    },
  },
  paymentIntents: {
    create: vi.fn(async (params: any) => ({
      id: 'pi_test_deterministic_001',
      client_secret: 'pi_test_deterministic_001_secret_mock',
      amount: params?.amount || 0,
      currency: params?.currency || 'usd',
      status: 'requires_payment_method',
      metadata: params?.metadata || {},
    })),
  },
  customers: {
    create: vi.fn(async (params: any) => ({
      id: 'cus_test_deterministic_001',
      email: params?.email || 'test@nexuscore.app',
    })),
  },
  subscriptions: {
    retrieve: vi.fn(async (id: string) => ({
      id,
      status: 'active',
      customer: 'cus_test_deterministic_001',
    })),
    update: vi.fn(async (id: string, params: any) => ({
      id,
      status: 'active',
      ...params,
    })),
    cancel: vi.fn(async (id: string) => ({
      id,
      status: 'canceled',
    })),
  },
};

export function resetStripeMock(): void {
  vi.mocked(mockStripeClient.webhooks.constructEvent).mockImplementation(
    (payload: string | Buffer, sigHeader: string, secret: string) =>
      verifyMockStripeWebhookConstructEvent(payload, sigHeader, secret)
  );
  vi.mocked(mockStripeClient.checkout.sessions.create).mockClear();
  vi.mocked(mockStripeClient.checkout.sessions.retrieve).mockClear();
  vi.mocked(mockStripeClient.paymentIntents.create).mockClear();
  vi.mocked(mockStripeClient.customers.create).mockClear();
  vi.mocked(mockStripeClient.subscriptions.retrieve).mockClear();
  vi.mocked(mockStripeClient.subscriptions.update).mockClear();
  vi.mocked(mockStripeClient.subscriptions.cancel).mockClear();
}
