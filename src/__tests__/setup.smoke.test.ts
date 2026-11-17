import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { supabase, getSupabase } from '@/src/lib/supabaseClient';
import {
  localStorageMock,
  seedSupabaseTable,
  getSupabaseTableRows,
  mockStripeClient,
  createMockStripeSignature,
  TEST_STRIPE_WEBHOOK_SECRET,
} from '@/src/__tests__/mocks';

describe('Offline Test Harness & Deterministic Mocks', () => {
  it('provides a deterministic in-memory localStorage that resets between tests', () => {
    expect(localStorage.getItem('nexus_core_user_profile')).toBeNull();

    localStorage.setItem(
      'nexus_core_user_profile',
      JSON.stringify({ id: 'user-1', handle: 'bdmCEO' })
    );

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'nexus_core_user_profile',
      JSON.stringify({ id: 'user-1', handle: 'bdmCEO' })
    );
    expect(JSON.parse(localStorage.getItem('nexus_core_user_profile') || '{}')).toEqual({
      id: 'user-1',
      handle: 'bdmCEO',
    });
  });

  it('starts with a clean localStorage store on subsequent tests', () => {
    expect(localStorage.length).toBe(0);
    expect(localStorage.getItem('nexus_core_user_profile')).toBeNull();
  });

  it('mocks canonical supabaseClient CRUD and storage operations completely offline', async () => {
    seedSupabaseTable('bands', [
      { id: 'band-1', name: 'Disavowed', genre: 'Brutal Death Metal' },
    ]);

    const client = getSupabase() || supabase;
    const { data: initialBands, error: selectErr } = await client
      .from('bands')
      .select('*')
      .eq('id', 'band-1')
      .single();

    expect(selectErr).toBeNull();
    expect(initialBands).toMatchObject({
      id: 'band-1',
      name: 'Disavowed',
    });

    await client.from('bands').insert({
      id: 'band-2',
      name: 'Defeated Sanity',
      genre: 'Technical Brutal Death Metal',
    });

    expect(getSupabaseTableRows('bands')).toHaveLength(2);

    const { data: urlData } = client.storage
      .from('band-logos')
      .getPublicUrl('disavowed.webp');
    expect(urlData.publicUrl).toContain('band-logos/disavowed.webp');
  });

  it('verifies Stripe webhook signatures deterministically via Supertest without network calls', async () => {
    const app = express();
    app.post(
      '/api/webhooks/stripe',
      express.raw({ type: 'application/json' }),
      (req, res) => {
        const sig = req.headers['stripe-signature'] as string;
        try {
          const event = mockStripeClient.webhooks.constructEvent(
            req.body,
            sig,
            TEST_STRIPE_WEBHOOK_SECRET
          );
          return res.status(200).json({ received: true, type: event.type });
        } catch (err: any) {
          return res.status(400).json({ error: err.message });
        }
      }
    );

    const eventPayload = JSON.stringify({
      id: 'evt_test_001',
      type: 'checkout.session.completed',
      data: { object: { id: 'cs_test_001' } },
    });

    const validSignature = createMockStripeSignature(
      eventPayload,
      TEST_STRIPE_WEBHOOK_SECRET
    );

    const okRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', validSignature)
      .send(eventPayload);

    expect(okRes.status).toBe(200);
    expect(okRes.body).toEqual({
      received: true,
      type: 'checkout.session.completed',
    });

    const badRes = await request(app)
      .post('/api/webhooks/stripe')
      .set('Content-Type', 'application/json')
      .set('stripe-signature', 't=1770000000,v1=invalid_signature_hex')
      .send(eventPayload);

    expect(badRes.status).toBe(400);
    expect(badRes.body.error).toContain('No signatures found');
  });
});
