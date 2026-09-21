import { getSupabase, uploadBase64ToStorage } from '../supabase';

export interface ShopMerchItem {
  id: string;
  name: string;
  price: number;
  category?: string;
  condition?: string;
  description?: string;
  sizes?: string[];
  thumbnail: string;
  images?: string[];
  stock?: number;
  is_timed?: boolean;
  expires_at?: string;
  duration_hours?: number;
  seller_id?: string;
  seller_name?: string;
  allow_negotiation?: boolean;
  created_at?: string;
}

const TABLE_NAME = 'shop_merch';
const BUCKET_NAME = 'shop-merch';

/**
 * Uploads a merch item image (base64 or data URI) directly to the Supabase storage bucket `shop-merch`.
 */
export async function uploadMerchImageToBucket(
  imageDataUri: string,
  userId: string = 'global_seller'
): Promise<string> {
  if (!imageDataUri || !imageDataUri.startsWith('data:')) {
    return imageDataUri; // Return existing URL
  }
  try {
    const token = `merch_${Date.now()}`;
    const uploadedUrl = await uploadBase64ToStorage(
      imageDataUri,
      userId,
      BUCKET_NAME,
      token
    );
    return uploadedUrl || imageDataUri;
  } catch (err) {
    console.warn('Failed to upload image to shop-merch bucket:', err);
    return imageDataUri;
  }
}

/**
 * Fetches all merchandise items from Supabase `shop_merch` table (or fallback tables).
 */
export async function fetchShopMerchItems(): Promise<ShopMerchItem[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    // Attempt primary table fetch from shop_merch
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((item: any) => ({
        id: String(item.id),
        name: item.name || item.title || 'Untitled Merch',
        price: Number(item.price) || 0,
        category: item.category || 'OFFICIAL MERCH DROP',
        condition: item.condition || 'New',
        description: item.description || '',
        sizes: Array.isArray(item.sizes) 
          ? item.sizes 
          : (typeof item.sizes === 'string' ? item.sizes.split(',').map((s: string) => s.trim()) : ['S', 'M', 'L', 'XL', '2XL']),
        thumbnail: item.thumbnail || item.image_url || 'https://images.unsplash.com/photo-1572913017567-02f06497f1f9?w=500',
        images: Array.isArray(item.images) ? item.images : [],
        stock: item.stock !== undefined ? Number(item.stock) : 25,
        is_timed: !!item.is_timed,
        expires_at: item.expires_at || undefined,
        duration_hours: item.duration_hours ? Number(item.duration_hours) : undefined,
        seller_id: item.seller_id || item.user_id || '',
        seller_name: item.seller_name || item.seller || 'Nexus Merchant',
        allow_negotiation: item.allow_negotiation !== false,
        created_at: item.created_at || new Date().toISOString()
      }));
    }

    // Try fallback table names if shop_merch is empty or table doesn't exist yet
    const fallbackTables = ['merch_items', 'nexus_shop_items', 'user_marketplace_items'];
    for (const fbTable of fallbackTables) {
      const { data: fbData } = await supabase
        .from(fbTable)
        .select('*')
        .order('created_at', { ascending: false });

      if (fbData && fbData.length > 0) {
        return fbData.map((item: any) => ({
          id: String(item.id),
          name: item.name || item.title || 'Untitled Merch',
          price: Number(item.price) || 0,
          category: item.category || 'OFFICIAL MERCH DROP',
          condition: item.condition || 'New',
          description: item.description || '',
          sizes: Array.isArray(item.sizes) ? item.sizes : ['S', 'M', 'L', 'XL', '2XL'],
          thumbnail: item.thumbnail || item.fallback_thumbnail || item.image_url || 'https://images.unsplash.com/photo-1572913017567-02f06497f1f9?w=500',
          images: Array.isArray(item.images) ? item.images : [],
          stock: item.stock !== undefined ? Number(item.stock) : 20,
          is_timed: !!item.is_timed,
          expires_at: item.expires_at || undefined,
          duration_hours: item.duration_hours ? Number(item.duration_hours) : undefined,
          seller_id: item.seller_id || item.profile_id || '',
          seller_name: item.seller_name || item.seller || 'Nexus Merchant',
          allow_negotiation: item.allow_negotiation !== false,
          created_at: item.created_at || new Date().toISOString()
        }));
      }
    }
  } catch (err) {
    console.error('Error fetching shop merch items from Supabase:', err);
  }

  return [];
}

/**
 * Inserts a new merchandise item into Supabase `shop_merch` table and uploads its image to `shop-merch` bucket.
 */
export async function createShopMerchItem(
  item: Omit<ShopMerchItem, 'id' | 'created_at'> & { id?: string },
  userId: string = 'global_seller'
): Promise<ShopMerchItem> {
  const supabase = getSupabase();

  // Upload image to shop-merch bucket first
  let thumbnailUrl = item.thumbnail;
  if (thumbnailUrl && thumbnailUrl.startsWith('data:')) {
    thumbnailUrl = await uploadMerchImageToBucket(thumbnailUrl, userId);
  }

  const newRecord: ShopMerchItem = {
    id: item.id || `merch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: item.name,
    price: item.price,
    category: item.category || 'OFFICIAL MERCH DROP',
    condition: item.condition || 'New',
    description: item.description || '',
    sizes: item.sizes || ['S', 'M', 'L', 'XL', '2XL'],
    thumbnail: thumbnailUrl,
    images: item.images || [thumbnailUrl],
    stock: item.stock ?? 30,
    is_timed: !!item.is_timed,
    expires_at: item.expires_at,
    duration_hours: item.duration_hours,
    seller_id: userId,
    seller_name: item.seller_name || 'Nexus Merchant',
    allow_negotiation: item.allow_negotiation !== false,
    created_at: new Date().toISOString()
  };

  if (!supabase) {
    console.warn('Supabase client unavailable, returning local record:', newRecord);
    return newRecord;
  }

  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        id: newRecord.id,
        name: newRecord.name,
        price: newRecord.price,
        category: newRecord.category,
        condition: newRecord.condition,
        description: newRecord.description,
        sizes: newRecord.sizes,
        thumbnail: newRecord.thumbnail,
        images: newRecord.images,
        stock: newRecord.stock,
        is_timed: newRecord.is_timed,
        expires_at: newRecord.expires_at,
        duration_hours: newRecord.duration_hours,
        seller_id: newRecord.seller_id,
        seller_name: newRecord.seller_name,
        allow_negotiation: newRecord.allow_negotiation,
        created_at: newRecord.created_at
      }])
      .select()
      .single();

    if (error) {
      console.warn(`Insert into ${TABLE_NAME} failed (${error.message}). Attempting fallback table...`);
      // Try fallback insertion into nexus_shop_items
      await supabase.from('nexus_shop_items').insert([{
        id: newRecord.id,
        name: newRecord.name,
        price: newRecord.price,
        category: newRecord.category,
        condition: newRecord.condition,
        description: newRecord.description,
        seller: newRecord.seller_name,
        fallback_thumbnail: newRecord.thumbnail,
        created_at: newRecord.created_at
      }]);
    }

    if (data) {
      return {
        ...newRecord,
        id: String(data.id || newRecord.id)
      };
    }
  } catch (err) {
    console.error('Exception creating shop merch item in Supabase:', err);
  }

  return newRecord;
}
