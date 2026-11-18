import { describe, it, expect, beforeEach } from 'vitest';
import {
  savePayoutRoute,
  resolvePayoutRouteForItem,
  recordOrderPayoutSettlements,
  getPayoutLedger,
  PAYOUT_ROUTES_STORAGE_KEY,
  PAYOUT_LEDGER_STORAGE_KEY,
} from '../services/payoutRoutingService';

describe('Multi-Method Seller & Band Payout Routing', () => {
  beforeEach(() => {
    localStorage.removeItem(PAYOUT_ROUTES_STORAGE_KEY);
    localStorage.removeItem(PAYOUT_LEDGER_STORAGE_KEY);
    localStorage.removeItem('nexus_bands_v1');
  });

  it('routes payouts for band merch posted by an Industry Pro (bdmCEO) directly to the band preferred Google Wallet card or bank account', () => {
    savePayoutRoute(
      {
        entityType: 'band',
        entityId: 'band-virulent-excision',
        entityName: 'Virulent Excision',
        preferredMethod: 'google_wallet',
        walletProvider: 'google',
        walletCardId: 'gcard_bank_1',
        cardBrand: 'Chase Checking',
        cardLast4: '8812',
        fundingType: 'bank',
        destinationLabel: 'Google Wallet • Chase Checking •••• 8812 (Bank Account)',
      },
      { syncBackend: false }
    );

    // Item posted by bdmCEO with title "Virulent Excision - Xenomorph TS"
    const item = {
      id: 'drop-ve-xeno',
      name: 'Virulent Excision - Xenomorph TS',
      seller: 'bdmCEO',
      authorName: 'bdmCEO',
      price: 25,
    };

    const resolved = resolvePayoutRouteForItem(item);
    expect(resolved.entityType).toBe('band');
    expect(resolved.entityName).toBe('Virulent Excision');
    expect(resolved.preferredMethod).toBe('google_wallet');
    expect(resolved.cardLast4).toBe('8812');
    expect(resolved.destinationLabel).toContain('Google Wallet');
  });

  it('supports PayPal, Apple Wallet, Stripe Connect, and Direct Bank/Card payout routes per seller or band', () => {
    savePayoutRoute(
      {
        entityType: 'profile',
        entityId: 'user-bdm-ceo',
        entityName: 'bdmCEO',
        preferredMethod: 'paypal',
        paypalEmail: 'ceo@brutaldeath.org',
        destinationLabel: 'PayPal (ceo@brutaldeath.org) • Wells Fargo •••• 9940 (Bank)',
      },
      { syncBackend: false }
    );

    savePayoutRoute(
      {
        entityType: 'band',
        entityId: 'band-dying-fetus',
        entityName: 'Dying Fetus',
        preferredMethod: 'apple_wallet',
        walletProvider: 'apple',
        cardBrand: 'Apple Cash Debit',
        cardLast4: '9012',
        fundingType: 'debit',
        destinationLabel: 'Apple Wallet • Apple Cash Debit •••• 9012 (Apple Cash / Debit)',
      },
      { syncBackend: false }
    );

    const proGearItem = {
      id: 'gear-1',
      name: 'Mesa Boogie Dual Rectifier',
      sellerName: 'bdmCEO',
      price: 1200,
    };
    const resolvedPro = resolvePayoutRouteForItem(proGearItem);
    expect(resolvedPro.preferredMethod).toBe('paypal');
    expect(resolvedPro.paypalEmail).toBe('ceo@brutaldeath.org');

    const bandTicketItem = {
      id: 'show-df-1',
      name: 'Dying Fetus Fall Tour Pass',
      bandName: 'Dying Fetus',
      price: 35,
    };
    const resolvedBand = resolvePayoutRouteForItem(bandTicketItem);
    expect(resolvedBand.preferredMethod).toBe('apple_wallet');
    expect(resolvedBand.destinationLabel).toContain('Apple Wallet');
  });

  it('records itemized 95%/5% payout settlements + 100% shipping pass-through per band in the ledger', () => {
    savePayoutRoute(
      {
        entityType: 'band',
        entityName: 'Virulent Excision',
        preferredMethod: 'stripe',
        stripeAccountId: 'acct_1VirulentExcision',
        destinationLabel: 'Stripe Connect (acct_1Vir...sion)',
      },
      { syncBackend: false }
    );

    savePayoutRoute(
      {
        entityType: 'band',
        entityName: 'PeelingFlesh',
        preferredMethod: 'bank_card',
        bankName: 'Chase Business',
        cardLast4: '4419',
        fundingType: 'bank',
        destinationLabel: 'Chase Business •••• 4419 (ACH Bank Account)',
      },
      { syncBackend: false }
    );

    const settlements = recordOrderPayoutSettlements({
      orderId: 'ORD-TEST-900',
      transactionId: 'TXN-TEST-900',
      buyerPaymentMethod: 'Google Wallet (Visa •••• 4242)',
      shippingTotal: 13.98,
      items: [
        {
          id: 'item-1',
          name: 'Virulent Excision - Xenomorph TS',
          bandName: 'Virulent Excision',
          price: 25,
          quantity: 2, // $50.00 gross -> $2.50 fee -> $47.50 + $6.99 shipping = $54.49 net
        },
        {
          id: 'item-2',
          name: 'PeelingFlesh - Slam Crew Hoodie',
          bandName: 'PeelingFlesh',
          price: 60,
          quantity: 1, // $60.00 gross -> $3.00 fee -> $57.00 + $6.99 shipping = $63.99 net
        },
      ],
    });

    expect(settlements).toHaveLength(2);

    const veRecord = settlements.find((s) => s.recipientName === 'Virulent Excision')!;
    expect(veRecord).toBeDefined();
    expect(veRecord.payoutMethod).toBe('stripe');
    expect(veRecord.grossAmount).toBe(50);
    expect(veRecord.platformFee).toBe(2.5);
    expect(veRecord.shippingCredit).toBe(6.99);
    expect(veRecord.netPayout).toBe(54.49);
    expect(veRecord.status).toBe('stripe_transfer_queued');

    const pfRecord = settlements.find((s) => s.recipientName === 'PeelingFlesh')!;
    expect(pfRecord).toBeDefined();
    expect(pfRecord.payoutMethod).toBe('bank_card');
    expect(pfRecord.grossAmount).toBe(60);
    expect(pfRecord.platformFee).toBe(3);
    expect(pfRecord.shippingCredit).toBe(6.99);
    expect(pfRecord.netPayout).toBe(63.99);
    expect(pfRecord.status).toBe('settled_instant');

    const ledgerForVe = getPayoutLedger('Virulent Excision');
    expect(ledgerForVe).toHaveLength(1);
    expect(ledgerForVe[0].netPayout).toBe(54.49);
  });
});
