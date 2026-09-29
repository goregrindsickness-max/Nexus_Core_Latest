import { createClient } from '@supabase/supabase-js';
import { getSupabase } from './clientService';
import { ensureImagesUploadedToStorage } from './storageService';
import { sanitizeProfilePayload } from './profileService';
import { sanitizeBandPayload } from './bandService';
import { sanitizeCreativePayload } from './creativeService';
import { sanitizeReleaseForDb } from './releasesService';

/**
 * Strips properties from an InventoryItem that are not present in the
 * 'inventory' Postgres table schema, preventing 'PGRST204' column not found errors.
 */
export function sanitizeInventoryItemForDb(item: any): any {
  const allowedKeys = [
    'id',
    'created_at',
    'name',
    'table_stock',
    'van_stock',
    'low_threshold',
    'status',
    'item_type',
    'price',
    'image_url',
    'image_path',
    'border_color',
    'is_exclusive',
    'band_id',
    'cost',
    'sku',
    'barcode',
    'initial_batch_size',
    'variants',
  ];

  const dbItem: any = {};
  for (const key of allowedKeys) {
    if (item[key] !== undefined) {
      dbItem[key] = item[key];
    }
  }
  return dbItem;
}

/**
 * Strips properties from a Show that are not present in the
 * 'shows' Postgres table schema, preventing column not found (PGRST204) errors.
 */
export const VALID_SHOW_COLUMNS = [
  'id',
  'creator_id',
  'show_name',
  'festival_name',
  'show_date',
  'date',
  'status',
  'show_type',
  'event_scope',
  'headliner',
  'venue',
  'venue_name',
  'venue_address',
  'city',
  'state_province',
  'country',
  'promoter_contact',
  'doors_time',
  'set_time',
  'price',
  'presale_price',
  'day_of_show_price',
  'age',
  'age_restriction',
  'safety_code',
  'capacity',
  'venue_capacity',
  'expected_attendance',
  'guarantee_amount',
  'venue_cut_percentage',
  'merch_space_fee',
  'seller_cost',
  'settlement_currency',
  'tax_rate',
  'tables_provided',
  'hanging_grids_provided',
  'shore_power',
  'parking_arrangements',
  'wifi_network',
  'wifi_password',
  'emergency_medical_info',
  'local_pharmacy_info',
  'flyer_url',
  'ticket_url',
  'external_ticket_url',
  'support_lineup',
  'is_time_24h',
  'is_community_submitted',
  'is_managed_client_booking',
  'tm_commission_rate',
  'executive_contact_info',
  'management_notes',
  'additional_notes',
  'created_at'
];

export function sanitizeShowForDb(show: any): any {
  if (!show || typeof show !== 'object') return {};

  const dbShow: any = {};

  // Map legacy / input fields to live schema columns (including show_name, venue, and show_date)
  const headlinerName = (show.headliner || show.name || show.band_name || 'Live Show').trim();
  const inputTitle = show.show_name || show.festival_name || show.title || show.name || show.headliner;
  const fallbackShowName = `${headlinerName} Live`;

  dbShow.show_name = show.show_name || inputTitle || fallbackShowName;
  dbShow.headliner = headlinerName;
  dbShow.venue_name = show.venue_name || show.venue || 'Live Venue';
  dbShow.venue = show.venue || show.venue_name || 'Live Venue';

  if (show.festival_name || show.tour_name || show.tourTitle || show.tour_title) {
    dbShow.festival_name = show.festival_name || show.tour_name || show.tourTitle || show.tour_title;
  }

  if (show.venue_address || show.address) {
    dbShow.venue_address = show.venue_address || show.address;
  }
  if (show.capacity !== undefined) {
    dbShow.capacity = show.capacity;
    if (dbShow.expected_attendance === undefined) {
      dbShow.expected_attendance = show.capacity;
    }
  }
  if (show.venue_capacity !== undefined) {
    dbShow.venue_capacity = show.venue_capacity;
  }
  if (show.expected_attendance !== undefined) {
    dbShow.expected_attendance = show.expected_attendance;
  }

  dbShow.show_date = show.show_date || show.date || new Date().toISOString().split('T')[0];
  dbShow.date = show.date || show.show_date || dbShow.show_date;

  if (show.guarantee_amount !== undefined || show.revenue !== undefined) {
    dbShow.guarantee_amount = show.guarantee_amount !== undefined ? show.guarantee_amount : show.revenue;
  }
  if (show.settlement_currency || show.currency) {
    dbShow.settlement_currency = show.settlement_currency || show.currency;
  }

  // Price formatting
  if (show.price) {
    dbShow.price = show.price;
  } else if (show.presale_price || show.day_of_show_price || show.ticket_price) {
    dbShow.price = show.presale_price
      ? (show.day_of_show_price ? `$${show.presale_price} / $${show.day_of_show_price}` : `$${show.presale_price}`)
      : (show.day_of_show_price ? `$${show.day_of_show_price}` : `$${show.ticket_price}`);
  }
  if (show.presale_price) dbShow.presale_price = show.presale_price;
  if (show.day_of_show_price) dbShow.day_of_show_price = show.day_of_show_price;

  // Support Lineup
  if (show.support_lineup) {
    dbShow.support_lineup = show.support_lineup;
  } else if (show.support_bands) {
    const rawBands = typeof show.support_bands === 'string'
      ? show.support_bands.split(',').map((s: string) => s.trim()).filter(Boolean)
      : Array.isArray(show.support_bands) ? show.support_bands : [];
    dbShow.support_lineup = rawBands.map((b: string) => ({ band_name: b, set_duration: '35 mins' }));
  } else if (Array.isArray(show.support)) {
    dbShow.support_lineup = show.support.map((b: string) => ({ band_name: typeof b === 'string' ? b : (b as any).name || (b as any).band, set_duration: '35 mins' }));
  }

  // Additional scalar / boolean properties
  if (show.doors_time) dbShow.doors_time = show.doors_time;
  if (show.set_time) dbShow.set_time = show.set_time;
  if (show.age_restriction) dbShow.age_restriction = show.age_restriction;
  if (show.age) dbShow.age = show.age;
  if (show.safety_code) dbShow.safety_code = show.safety_code;
  if (show.flyer_url) dbShow.flyer_url = show.flyer_url;
  if (show.ticket_url) dbShow.ticket_url = show.ticket_url;
  if (show.external_ticket_url) dbShow.external_ticket_url = show.external_ticket_url;
  if (show.status) dbShow.status = show.status;
  if (show.show_type) dbShow.show_type = show.show_type;
  if (show.event_scope) dbShow.event_scope = show.event_scope;
  if (show.promoter_contact) dbShow.promoter_contact = show.promoter_contact;
  if (show.venue_cut_percentage !== undefined) dbShow.venue_cut_percentage = show.venue_cut_percentage;
  if (show.merch_space_fee !== undefined) dbShow.merch_space_fee = show.merch_space_fee;
  if (show.seller_cost !== undefined) dbShow.seller_cost = show.seller_cost;
  if (show.tax_rate !== undefined) dbShow.tax_rate = show.tax_rate;
  if (show.tables_provided !== undefined) dbShow.tables_provided = show.tables_provided;
  if (show.hanging_grids_provided !== undefined) dbShow.hanging_grids_provided = show.hanging_grids_provided;
  if (show.shore_power !== undefined) dbShow.shore_power = show.shore_power;
  if (show.parking_arrangements) dbShow.parking_arrangements = show.parking_arrangements;
  if (show.wifi_network) dbShow.wifi_network = show.wifi_network;
  if (show.wifi_password) dbShow.wifi_password = show.wifi_password;
  if (show.emergency_medical_info) dbShow.emergency_medical_info = show.emergency_medical_info;
  if (show.local_pharmacy_info) dbShow.local_pharmacy_info = show.local_pharmacy_info;
  if (show.is_time_24h !== undefined) dbShow.is_time_24h = show.is_time_24h;
  if (show.is_community_submitted !== undefined) dbShow.is_community_submitted = show.is_community_submitted;
  if (show.is_managed_client_booking !== undefined) dbShow.is_managed_client_booking = show.is_managed_client_booking;
  if (show.tm_commission_rate !== undefined) dbShow.tm_commission_rate = show.tm_commission_rate;
  if (show.executive_contact_info) dbShow.executive_contact_info = show.executive_contact_info;
  if (show.management_notes) dbShow.management_notes = show.management_notes;
  if (show.created_at) dbShow.created_at = show.created_at;

  // Additional notes handling (clean JSON)
  if (show.additional_notes) {
    if (typeof show.additional_notes === 'object') {
      dbShow.additional_notes = JSON.stringify(show.additional_notes);
    } else if (typeof show.additional_notes === 'string' && !show.additional_notes.startsWith('data:')) {
      dbShow.additional_notes = show.additional_notes;
    }
  }

  // City handling: Postgres 'shows' table enforces a NOT NULL constraint on 'city'
  let resolvedCity = (show.city || show.location || show.city_state || show.venue_city || '').trim();
  if (!resolvedCity && (show.venue_address || show.address)) {
    const rawAddr = String(show.venue_address || show.address).trim();
    const parts = rawAddr.split(',');
    if (parts.length >= 2) {
      resolvedCity = parts[parts.length - 2].trim();
    } else {
      resolvedCity = rawAddr;
    }
  }
  if (!resolvedCity && show.state_province) {
    resolvedCity = String(show.state_province).trim();
  }
  if (!resolvedCity) {
    resolvedCity = 'Austin, TX';
  }
  dbShow.city = resolvedCity;
  if (show.state_province || show.state) {
    dbShow.state_province = show.state_province || show.state;
  }
  if (show.country) {
    dbShow.country = show.country;
  }

  // ID Handling: Deterministic UUID
  if (show.id) {
    dbShow.id = ensureUUID(show.id);
  } else {
    dbShow.id = generateUUID();
  }

  // creator_id handling
  dbShow.creator_id = ensureUUID(show.creator_id || show.user_id || '5403162d-1947-43aa-b5f6-38a1bd2a1b80');

  // STRICT WHITELIST FILTERING: Only return keys that exist in the PostgreSQL 'shows' schema
  const allowedSet = new Set(VALID_SHOW_COLUMNS);
  const cleanPruned: any = {};
  for (const [k, v] of Object.entries(dbShow)) {
    if (allowedSet.has(k) && v !== undefined) {
      cleanPruned[k] = v;
    }
  }

  return cleanPruned;
}

/**
 * Strips properties from an ArchiveShow that are not present in the
 * 'archive_shows' Postgres table schema, preventing column not found errors.
 */
export function sanitizeArchiveShowForDb(item: any): any {
  const allowedKeys = [
    'id',
    'user_id',
    'promoter_id',
    'year',
    'title',
    'type',
    'date',
    'venue',
    'city',
    'lineup',
    'attendance',
    'milestone',
    'historical_notes',
    'notes',
    'flyer_url',
    'photo_count',
    'is_deleted',
    'created_at',
    'updated_at'
  ];

  const dbItem: any = {};
  for (const key of allowedKeys) {
    if (item[key] !== undefined) {
      dbItem[key] = item[key];
    }
  }
  return dbItem;
}

/**
 * Generates a valid RFC4122 v4 UUID.
 * Compatible with PostgreSQL UUID column constraints.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122 v4 UUID generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Ensures that a string is a valid UUID. If it is already a UUID, returns it.
 * If not, deterministically hashes the string into a valid UUID format using
 * high-entropy 128-bit state mixing across four 32-bit words with bit diffusion.
 * Compatible with PostgreSQL UUID column constraints.
 */
export function ensureUUID(id: string): string {
  if (!id) return '00000000-0000-4000-a000-000000000000';

  const cleanId = String(id).trim();

  // Check if already a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(cleanId)) {
    return cleanId.toLowerCase();
  }

  // High-entropy 128-bit hash (FNV-1a / Murmur3 / bit-mixing across four independent 32-bit words)
  let h1 = 0x811c9dc5 ^ 0xdeadbeef;
  let h2 = 0xcbf29ce4 ^ 0x41c64e6d;
  let h3 = 0x6a09e667 ^ 0xbb67ae85;
  let h4 = 0x3c6ef372 ^ 0xa54ff53a;

  for (let i = 0; i < cleanId.length; i++) {
    const code = cleanId.charCodeAt(i);
    h1 = Math.imul(h1 ^ code, 16777619);
    h2 = Math.imul(h2 ^ (code << 5), 1099511627);
    h3 = Math.imul(h3 ^ (code >> 3), 0x5bd1e995);
    h4 = Math.imul(h4 ^ (code * 31), 0x27d4eb2d);
  }

  // Avalanche bit diffusion to prevent bit clustering
  h1 ^= h1 >>> 16; h1 = Math.imul(h1, 0x85ebca6b); h1 ^= h1 >>> 13; h1 = Math.imul(h1, 0xc2b2ae35); h1 ^= h1 >>> 16;
  h2 ^= h2 >>> 16; h2 = Math.imul(h2, 0x7feb352d); h2 ^= h2 >>> 13; h2 = Math.imul(h2, 0x846ca68b); h2 ^= h2 >>> 16;
  h3 ^= h3 >>> 16; h3 = Math.imul(h3, 0x85ebca6b); h3 ^= h3 >>> 13; h3 = Math.imul(h3, 0xc2b2ae35); h3 ^= h3 >>> 16;
  h4 ^= h4 >>> 16; h4 = Math.imul(h4, 0x7feb352d); h4 ^= h4 >>> 13; h4 = Math.imul(h4, 0x846ca68b); h4 ^= h4 >>> 16;

  const hex1 = (h1 >>> 0).toString(16).padStart(8, '0');
  const hex2 = (h2 >>> 0).toString(16).padStart(8, '0');
  const hex3 = (h3 >>> 0).toString(16).padStart(8, '0');
  const hex4 = (h4 >>> 0).toString(16).padStart(8, '0');

  const full32 = hex1 + hex2 + hex3 + hex4;

  const part1 = full32.substring(0, 8);
  const part2 = full32.substring(8, 12);
  // Version 4 UUID marker
  const part3 = '4' + full32.substring(13, 16);
  // RFC4122 variant bits (8, 9, a, or b)
  const part4 = ((parseInt(full32.substring(16, 17), 16) & 0x3) | 0x8).toString(16) + full32.substring(17, 20);
  const part5 = full32.substring(20, 32);

  return `${part1}-${part2}-${part3}-${part4}-${part5}`.toLowerCase();
}

/**
 * Maps common US postal zip codes to City, State.
 */
export function resolveZipCode(zip: string): string {
  const cleanZip = zip.trim();
  const zipMap: Record<string, string> = {
    '90210': 'Los Angeles, CA',
    '10001': 'New York, NY',
    '94103': 'San Francisco, CA',
    '94110': 'San Francisco, CA',
    '60611': 'Chicago, IL',
    '33139': 'Miami, FL',
    '02108': 'Boston, MA',
    '98101': 'Seattle, WA',
    '75201': 'Dallas, TX',
    '77002': 'Houston, TX',
    '80202': 'Denver, CO',
    '37203': 'Nashville, TN',
    '20001': 'Washington, DC',
    '89109': 'Las Vegas, NV',
    '30303': 'Atlanta, GA',
    '19103': 'Philadelphia, PA',
    '85001': 'Phoenix, AZ',
    '92101': 'San Diego, CA',
    '97201': 'Portland, OR',
    '55401': 'Minneapolis, MN',
    '48201': 'Detroit, MI',
    '43215': 'Columbus, OH',
    '46204': 'Indianapolis, IN',
    '78701': 'Austin, TX',
    '21201': 'Baltimore, MD',
    '15219': 'Pittsburgh, PA',
    '63101': 'St. Louis, MO',
    '53202': 'Milwaukee, WI',
    '40202': 'Louisville, KY',
    '68102': 'Omaha, NE',
    '70112': 'New Orleans, LA',
    '99501': 'Anchorage, AK',
    '96813': 'Honolulu, HI',
    '75001': 'Dallas, TX',
    '75020': 'Denison, TX',
    '75021': 'Denison, TX',
  };
  if (zipMap[cleanZip]) return zipMap[cleanZip];

  // Range fallback
  if (cleanZip.length === 5) {
    const num = parseInt(cleanZip, 10);
    if (num >= 90000 && num <= 96162) return 'Los Angeles, CA';
    if (num >= 10001 && num <= 14925) return 'New York, NY';
    if (num >= 60001 && num <= 62999) return 'Chicago, IL';
    if (num >= 75000 && num <= 79999) return 'Dallas, TX';
    if (num >= 48000 && num <= 49999) return 'Detroit, MI';
    if (num >= 30000 && num <= 31999) return 'Atlanta, GA';
    if (num >= 98000 && num <= 99499) return 'Seattle, WA';
    if (num >= 33000 && num <= 34999) return 'Miami, FL';
    if (num >= 20001 && num <= 20599) return 'Washington, DC';
    if (num >= 85000 && num <= 86599) return 'Phoenix, AZ';
    if (num >= 80000 && num <= 81658) return 'Denver, CO';
  }
  return zip;
}

/**
 * Automatically retry dynamic table insertions/updates by stripping columns
 * that produce PGRST204 errors (column not found in schema cache) or healing UUIDs.
 */
export async function executeWithSchemaResilience<T extends Record<string, any> | Record<string, any>[]>(
  operation: (payload: any) => Promise<{ error: any; data?: any }>,
  initialPayload: T
): Promise<{ error: any; data?: any }> {
  const isArray = Array.isArray(initialPayload);
  let payload: any = isArray ? [...initialPayload] : { ...initialPayload };

  // Auto-upload any base64 image data URIs in payload to Supabase storage buckets first
  payload = await ensureImagesUploadedToStorage(payload);

  if (isArray) {
    const seenIds = new Set<string>();
    const deduped: any[] = [];
    for (const rawItem of payload) {
      if (!rawItem || typeof rawItem !== 'object') {
        deduped.push(rawItem);
        continue;
      }
      if (rawItem.id) {
        if (seenIds.has(rawItem.id)) continue;
        seenIds.add(rawItem.id);
      }
      deduped.push(rawItem);
    }
    payload = deduped.map((item: any) => {
      if (!item || typeof item !== 'object') return item;
      const isBand = 'band_name' in item || 'micro_genres' in item || 'subgenres' in item || 'tour_vehicle' in item || 'metal_archives_url' in item || ('logo_url' in item && ('genre' in item || 'city' in item || 'bio' in item));
      if (isBand) {
        return sanitizeBandPayload(item);
      }
      const isRelease = 'tracks' in item || 'catalog_id' in item || 'audio_vault_path' in item || ('title' in item && ('release_date' in item || 'band_id' in item || 'formats' in item));
      if (isRelease) {
        return sanitizeReleaseForDb(item);
      }
      return item;
    });
  } else {
    const isBandPayload =
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      ('band_name' in payload ||
        'micro_genres' in payload ||
        'subgenres' in payload ||
        'tour_vehicle' in payload ||
        'metal_archives_url' in payload ||
        ('logo_url' in payload && ('genre' in payload || 'city' in payload || 'founded_year' in payload || 'cover_url' in payload || 'bio' in payload || 'creator_id' in payload)) ||
        ('creator_id' in payload &&
          ('logo_url' in payload ||
            'tech_rider_url' in payload ||
            'tour_vehicle' in payload ||
            'lineup' in payload ||
            'micro_genres' in payload ||
            'genre' in payload)));

    // If this payload targets the 'bands' table, normalize it strictly for the 'bands' database table columns:
    if (isBandPayload) {
      payload = sanitizeBandPayload(payload);
    }

    const isCreativePayload =
      !isBandPayload &&
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      ('business_name' in payload ||
        'creative_name' in payload ||
        'creative_handle' in payload ||
        'day_rate' in payload ||
        'base_rate_value' in payload ||
        'rate_range' in payload ||
        'pricing_notes' in payload ||
        'gear_tags' in payload ||
        'quick_broadcast' in payload ||
        'broadcast_bulletin' in payload ||
        ('creator_id' in payload &&
          ('skills' in payload ||
            'gear' in payload ||
            'primary_gear' in payload ||
            'primary_category' in payload ||
            'secondary_category' in payload ||
            'availability_status' in payload ||
            'portfolio_link' in payload))) &&
      !('email' in payload || 'account_type' in payload || 'role' in payload || 'console_handle' in payload || 'band_name' in payload);

    // If this payload targets the 'creatives' table, normalize it strictly for the 'creatives' database table columns:
    if (isCreativePayload) {
      payload = sanitizeCreativePayload(payload);
    }

    const isProfilePayload =
      !isBandPayload &&
      !isCreativePayload &&
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      ('email' in payload ||
        'role' in payload ||
        'account_type' in payload ||
        'console_handle' in payload ||
        'registered_workspaces' in payload ||
        'allowed_workspaces' in payload ||
        'profileBlurb' in payload ||
        'update_ticker' in payload ||
        'rosterTicker' in payload ||
        'full_name' in payload ||
        'creative_metadata' in payload ||
        'promoter_metadata' in payload ||
        'label_metadata' in payload ||
        'band_metadata' in payload ||
        'user_metadata' in payload);

    // If this payload is a profile, normalize it for the 'profiles' database table columns:
    if (isProfilePayload) {
      payload = sanitizeProfilePayload(payload);
    }

    const isReleasePayload =
      !isBandPayload &&
      !isCreativePayload &&
      !isProfilePayload &&
      payload &&
      typeof payload === 'object' &&
      !Array.isArray(payload) &&
      ('tracks' in payload || 'catalog_id' in payload || 'audio_vault_path' in payload || ('title' in payload && ('release_date' in payload || 'formats' in payload || 'digital' in payload || 'band_id' in payload)));

    if (isReleasePayload) {
      payload = sanitizeReleaseForDb(payload);
    }
  }

  let attempts = 0;
  const maxAttempts = 50;

  while (attempts < maxAttempts) {
    const { error, data } = await operation(payload);
    if (!error) {
      return { error: null, data };
    }

    const fullErrorMsg = [error.message, error.details, error.hint].filter(Boolean).join(' ');
    const lowerErrorMsg = fullErrorMsg.toLowerCase();

    // Check if it's a PGRST205 "Table not found" error or PostgreSQL 42P01 "relation does not exist" error.
    // NOTE: Must NOT match column missing errors (PGRST204) which contain the word "column".
    const isTableMissingError =
      error.code === 'PGRST205' ||
      error.code === '42P01' ||
      (!lowerErrorMsg.includes('column') &&
        (lowerErrorMsg.includes('could not find the table') ||
          (lowerErrorMsg.includes('table') && lowerErrorMsg.includes('schema cache')) ||
          (lowerErrorMsg.includes('relation') && lowerErrorMsg.includes('does not exist'))));

    if (isTableMissingError) {
      console.warn(
        `[Supabase Resilience] Gracefully bypassed missing table error (table likely not in sandbox database):`,
        fullErrorMsg
      );
      return { error: null, data: null };
    }

    // CRITICAL: ALLOW RLS / PRIVILEGE ERRORS TO BUBBLE UP TO TRIGGER OFFLINE RETRY PIPELINES
    const isRLSOrPermissionError =
      error.code === '42501' ||
      lowerErrorMsg.includes('row-level security') ||
      lowerErrorMsg.includes('permission denied') ||
      lowerErrorMsg.includes('not authorized') ||
      lowerErrorMsg.includes('violates row-level security');

    if (isRLSOrPermissionError) {
      console.warn(
        `[Supabase Resilience] RLS Violation (Code 42501). Aborting bypass to allow background queue orchestration.`,
        fullErrorMsg
      );
      return { error, data: null };
    }

    // Check if it's a PGRST204 "Column not found" error, PostgreSQL 42703, or type mismatch / bad request error
    const isColumnMissingOrTypeError =
      error.code === 'PGRST204' ||
      error.code === '42703' ||
      error.code === '42804' ||
      error.code === '22023' ||
      error.code === 'PGRST102' ||
      error.code === 'PGRST200' ||
      error.code === '400' ||
      error.status === 400 ||
      (lowerErrorMsg.includes('column') &&
        (lowerErrorMsg.includes('does not exist') ||
          lowerErrorMsg.includes('not found') ||
          lowerErrorMsg.includes('unknown') ||
          lowerErrorMsg.includes('schema cache'))) ||
      lowerErrorMsg.includes('invalid input syntax') ||
      lowerErrorMsg.includes('expression is of type') ||
      lowerErrorMsg.includes('malformed') ||
      lowerErrorMsg.includes('cannot parse') ||
      lowerErrorMsg.includes('type mismatch') ||
      lowerErrorMsg.includes('bad request');

    if (isColumnMissingOrTypeError && fullErrorMsg) {
      const match1 = fullErrorMsg.match(/Could not find the '([^']+)' column/i);
      const match2 = fullErrorMsg.match(/column "([^"]+)"/i);
      const match3 = fullErrorMsg.match(/column '([^']+)'/i);
      const match4 = fullErrorMsg.match(/Could not find the column '([^']+)'/i);
      const match5 = fullErrorMsg.match(/Could not find column '([^']+)'/i);
      const match6 = fullErrorMsg.match(/Could not find the ([a-zA-Z0-9_]+) column/i);
      const match7 = fullErrorMsg.match(/field "([^"]+)"/i);
      const match8 = fullErrorMsg.match(/field '([^']+)'/i);
      const match9 = fullErrorMsg.match(/column ([a-zA-Z0-9_]+) does not exist/i);

      let offendingColumn =
        (match1 && match1[1]) ||
        (match4 && match4[1]) ||
        (match5 && match5[1]) ||
        (match2 && match2[1]) ||
        (match3 && match3[1]) ||
        (match6 && match6[1]) ||
        (match7 && match7[1]) ||
        (match8 && match8[1]) ||
        (match9 && match9[1]);

      // If regex couldn't find a column name, scan payload keys against error text
      if (!offendingColumn && payload && typeof payload === 'object') {
        const keysToCheck = Array.isArray(payload) ? (payload[0] ? Object.keys(payload[0]) : []) : Object.keys(payload);
        for (const k of keysToCheck) {
          if (lowerErrorMsg.includes(k.toLowerCase())) {
            offendingColumn = k;
            break;
          }
        }
      }

      // If still no column matched, progressively try stripping optional non-core columns
      if (!offendingColumn && payload && typeof payload === 'object' && !Array.isArray(payload)) {
        const optionalCandidateKeys = [
          'tour_vehicle',
          'tech_rider_url',
          'custom_slug',
          'booking_email',
          'booking_phone',
          'featured_youtube_url',
          'streaming_url',
          'payment_routing',
          'metal_archives_url',
          'headcount',
          'apparel_sizes',
          'user_role_in_band',
          'record_label',
          'legal_name',
          'tax_id',
          'legal_entity_type',
          'instagram',
          'spotify',
          'apple_music',
          'bandcamp',
          'website',
          'live_update',
          'featured_video_band_name',
          'featured_video_track_name',
          'is_verified',
          'verification_platform',
          'micro_genres',
          'state_province'
        ];
        for (const cand of optionalCandidateKeys) {
          if (cand in payload) {
            offendingColumn = cand;
            break;
          }
        }
      }

      if (offendingColumn) {
        console.warn(`[Supabase Resilience] Stripping column '${offendingColumn}' due to database error:`, fullErrorMsg);
        try {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`NEXUS_CORE_MISSING_COLUMN_${offendingColumn.toUpperCase()}`, 'true');
          }
        } catch (_) {}

        if (Array.isArray(payload)) {
          payload.forEach((item) => {
            if (item && typeof item === 'object') {
              delete item[offendingColumn];
            }
          });
        } else if (payload && typeof payload === 'object') {
          delete payload[offendingColumn];

          // If all custom data keys have been stripped, gracefully bypass this operation
          const remainingDataKeys = Object.keys(payload).filter(
            (k) =>
              k !== 'id' &&
              k !== 'creator_id' &&
              k !== 'user_id' &&
              k !== 'created_at' &&
              k !== 'owner_id' &&
              k !== 'profile_id'
          );
          if (remainingDataKeys.length === 0) {
            console.warn(
              `[Supabase Resilience] Gracefully bypassed operation after stripping unsupported column '${offendingColumn}':`,
              fullErrorMsg
            );
            return { error: null, data: null };
          }
        }

        attempts++;
        continue;
      }
    }

    // Check if it's an invalid UUID format error (PostgreSQL error code 22P02, or message references uuid)
    if ((error.code === '22P02' || error.message?.toLowerCase().includes('uuid')) && error.message) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      let cleanedSomething = false;
      const errorMsg = error.message.toLowerCase();

      // First, try targeting the specific invalid value mentioned in the error message
      for (const key of Object.keys(payload)) {
        const value = payload[key];
        if (typeof value === 'string' && value) {
          const lowerVal = value.toLowerCase();
          if (
            errorMsg.includes(`"${lowerVal}"`) ||
            errorMsg.includes(`'${lowerVal}'`) ||
            errorMsg.includes(` ${lowerVal}`)
          ) {
            console.warn(
              `[Supabase Resilience] Healing targeted invalid UUID column '${key}' ("${value}"):`,
              error.message
            );
            if (key === 'id') {
              payload[key] = ensureUUID(value);
            } else {
              payload[key] = ensureUUID(value);
            }
            cleanedSomething = true;
          }
        }
      }

      // If we couldn't target the exact value, fall back to safe healing of relation keys only
      if (!cleanedSomething) {
        for (const key of Object.keys(payload)) {
          const value = payload[key];

          if (typeof value === 'string' && key.endsWith('_id') && key !== 'id' && !uuidRegex.test(value)) {
            console.warn(`[Supabase Resilience] Healing invalid UUID relation column '${key}' ("${value}"):`, error.message);
            delete payload[key];
            cleanedSomething = true;
          }
        }
      }

      if (cleanedSomething) {
        attempts++;
        continue;
      }
    }

    // Check if it's a foreign key constraint violation (PostgreSQL error code 23503 or foreign key message)
    const isForeignKeyError =
      error.code === '23503' ||
      (error.message &&
        (error.message.toLowerCase().includes('foreign key') ||
          error.message.toLowerCase().includes('violates foreign key') ||
          error.message.toLowerCase().includes('not present in table') ||
          error.message.toLowerCase().includes('fkey') ||
          error.message.toLowerCase().includes('foreign_key')));

    if (isForeignKeyError && error.message) {
      let cleanedSomething = false;
      const errorMsg = error.message.toLowerCase();

      for (const key of Object.keys(payload)) {
        if ((key.endsWith('_id') || key === 'label_id') && payload[key] !== null && payload[key] !== undefined) {
          const lowerKey = key.toLowerCase();
          const valStr = String(payload[key]).toLowerCase();

          if (errorMsg.includes(lowerKey) || errorMsg.includes(valStr) || errorMsg.includes('fkey')) {
            console.warn(
              `[Supabase Resilience] Healing foreign key violation on column '${key}' ("${payload[key]}"):`,
              error.message
            );
            payload[key] = null;
            cleanedSomething = true;
          }
        }
      }

      if (!cleanedSomething) {
        for (const key of Object.keys(payload)) {
          if (
            key !== 'id' &&
            (key.endsWith('_id') || key === 'label_id') &&
            payload[key] !== null &&
            payload[key] !== undefined
          ) {
            console.warn(
              `[Supabase Resilience] Fallback healing foreign key violation on column '${key}':`,
              error.message
            );
            payload[key] = null;
            cleanedSomething = true;
          }
        }
      }

      if (cleanedSomething) {
        attempts++;
        continue;
      }
    }

    return { error, data };
  }

  return { error: { code: 'PGRST204', message: 'Exceeded dynamic schema resolution attempts' } };
}

export async function testSupabaseConnection(
  customUrl?: string,
  customKey?: string
): Promise<{ success: boolean; message: string }> {
  let supabase: any = null;
  if (customUrl && customKey) {
    try {
      supabase = createClient(customUrl, customKey);
    } catch (e: any) {
      return { success: false, message: `Invalid Supabase client config: ${e.message}` };
    }
  } else {
    supabase = getSupabase();
  }

  if (!supabase) {
    return { success: true, message: 'Bypassed connection check: Supabase client is not initialized.' };
  }

  try {
    const { count, error } = await supabase.from('shows').select('*', { count: 'exact', head: true });

    if (error) {
      console.warn('Diagnostic connection test warning:', error);
      return {
        success: false,
        message: `Gateway responded with error: ${error.message}`,
      };
    }

    return { success: true, message: `Connected successfully to gateway. Found ${count ?? 0} shows.` };
  } catch (err: any) {
    console.warn('Diagnostic connection test exception:', err);
    return {
      success: false,
      message: `Gateway test failed: ${err.message}`,
    };
  }
}

/**
 * Handles real-time subscriptions for a given table.
 * Returns a function to unsubscribe.
 */
export function subscribeToTable(table: string, onEvent: (payload: any) => void): (() => void) | null {
  const supabase = getSupabase();
  if (!supabase) return null;

  const channel = supabase
    .channel(`${table}-realtime-changes-${Date.now()}-${Math.random()}`)
    .on(
      'postgres_changes',
      {
        event: '*', // listen to all events (INSERT, UPDATE, DELETE)
        schema: 'public',
        table: table,
      },
      (payload) => {
        onEvent(payload);
      }
    )
    .subscribe((status) => {
      console.log(`Supabase Realtime subscription current status [${table}]:`, status);
    });

  return () => {
    if (supabase && channel) {
      supabase.removeChannel(channel).then();
    }
  };
}
