import { describe, it, expect, beforeEach } from 'vitest';
import {
  deduplicateStorefrontItems,
  decrementPurchasedInventory,
  getItemAvailableStock,
} from '../services/shopCommerceService';

describe('Storefront Deduplication & Linked Band Inventory Sync', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('collapses 3x duplicate items across shop_merch, feed merch_drop, and nexus_shop_items into 1 card', () => {
    const supabaseDropItem = {
      id: 'merch_1731880000_abc12',
      name: 'Virulent Excision - Xenomorph TS',
      price: 25,
      category: 'apparel',
      subcategory: 't-shirts',
      seller: 'bdmCEO',
      brand: 'bdmCEO',
      artist: 'bdmCEO',
      thumbnail: '',
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      stock: 50,
      is_real_account: true,
    };

    const feedDropItem = {
      id: 'drop_post_uuid_999',
      name: 'Virulent Excision - Xenomorph TS',
      price: 25,
      category: 'apparel',
      subcategory: 'Apparel',
      seller: 'bdmCEO',
      brand: 'bdmCEO',
      artist: 'bdmCEO',
      thumbnail: 'https://example.com/xenomorph-shirt.jpg',
      images: ['https://example.com/xenomorph-shirt.jpg'],
      sizes: ['S', 'M', 'L', 'XL'],
      stock: 50,
      is_real_account: true,
    };

    const baseNexusShopItem = {
      id: 'nexus_shop_row_777',
      name: 'Virulent Excision - Xenomorph TS',
      price: 25,
      category: 'OFFICIAL MERCH DROP',
      subcategory: 'OFFICIAL MERCH DROP',
      seller: 'bdmCEO',
      brand: 'Generic',
      thumbnail: 'https://example.com/xenomorph-shirt.jpg',
      is_real_account: true,
    };

    const deduped = deduplicateStorefrontItems<any>([
      supabaseDropItem,
      feedDropItem,
      baseNexusShopItem,
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].name).toBe('Virulent Excision - Xenomorph TS');
    expect(deduped[0].thumbnail).toBe('https://example.com/xenomorph-shirt.jpg');
    expect(deduped[0].images).toEqual(['https://example.com/xenomorph-shirt.jpg']);
  });

  it('merges an Industry Pro merch drop with a linked Band Inventory SKU into a single card', () => {
    const bandInventoryItem = {
      id: 'inv_ve_xeno_01',
      name: 'Virulent Excision - Xenomorph TS',
      price: 25,
      category: 'apparel',
      subcategory: 't-shirts',
      seller: 'Virulent Excision',
      artist: 'Virulent Excision',
      brand: 'Virulent Excision',
      band_id: 'band_ve_1',
      stock: 30,
      sizes: ['M', 'L', 'XL'],
      variantStocks: { M: 10, L: 10, XL: 10 },
      is_real_account: true,
    };

    const proFeedDropLinked = {
      id: 'merch_1731880555_xyz',
      dropId: 'merch_1731880555_xyz',
      inventory_id: 'inv_ve_xeno_01',
      band_id: 'band_ve_1',
      bandName: 'Virulent Excision',
      name: 'Virulent Excision - Xenomorph TS',
      price: 25,
      category: 'apparel',
      subcategory: 't-shirts',
      seller: 'bdmCEO',
      artist: 'Virulent Excision',
      brand: 'Virulent Excision',
      is_real_account: true,
    };

    const deduped = deduplicateStorefrontItems<any>([bandInventoryItem, proFeedDropLinked]);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe('inv_ve_xeno_01');
    expect(deduped[0].dropId).toBe('merch_1731880555_xyz');
    expect(deduped[0].variantStocks).toEqual({ M: 10, L: 10, XL: 10 });
  });

  it('keeps distinct items with different names or prices separate', () => {
    const items = [
      {
        id: 'merch_1',
        name: 'Virulent Excision - Xenomorph TS',
        price: 25,
        category: 'apparel',
        seller: 'bdmCEO',
      },
      {
        id: 'merch_2',
        name: 'Virulent Excision - Promo Tour Hoodie',
        price: 55,
        category: 'apparel',
        seller: 'bdmCEO',
      },
    ];

    const deduped = deduplicateStorefrontItems(items);
    expect(deduped).toHaveLength(2);
  });

  it('decrements linked Band Inventory SKU when a pro-posted merch drop is purchased', async () => {
    const initialInventory = [
      {
        id: 'inv_ve_xeno_01',
        band_id: 'band_ve_1',
        artist: 'Virulent Excision',
        name: 'Virulent Excision - Xenomorph TS',
        price: 25,
        table_stock: 10,
        van_stock: 15,
        stock: 25,
        variants: [
          { size: 'L', stock: '12' },
          { size: 'XL', stock: '13' },
        ],
        status: 'Healthy',
      },
    ];
    localStorage.setItem('nexus_master_inventory', JSON.stringify(initialInventory));

    await decrementPurchasedInventory([
      {
        id: 'merch_drop_999',
        productId: 'merch_drop_999',
        inventoryId: 'inv_ve_xeno_01',
        bandId: 'band_ve_1',
        name: 'Virulent Excision - Xenomorph TS (Feed Drop)',
        size: 'L',
        quantity: 3,
        stock: 25,
      },
    ]);

    const updatedInv = JSON.parse(localStorage.getItem('nexus_master_inventory') || '[]');
    expect(updatedInv).toHaveLength(1);
    expect(updatedInv[0].stock).toBe(22);
    expect(updatedInv[0].table_stock).toBe(7);
    expect(updatedInv[0].van_stock).toBe(15);
    const sizeL = updatedInv[0].variants.find((v: any) => v.size === 'L');
    expect(sizeL.stock).toBe('9');

    // Also verify override applies to both drop ID and inventory SKU ID
    const stockCheckDrop = getItemAvailableStock({ id: 'merch_drop_999', stock: 25 }, 'L');
    expect(stockCheckDrop.totalStock).toBe(22);
    expect(stockCheckDrop.variantStock).toBe(9);
  });
});
