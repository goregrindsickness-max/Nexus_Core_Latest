export interface Venue {
  id: string;
  created_at?: string;
  name: string;
  address?: string;
  city: string;
  state_province?: string;
  country?: string;
  lat?: number;
  lng?: number;
  capacity?: number;
  email?: string;
  phone?: string;
  website?: string;
  genre_fit?: number;
  payout_rating?: number;
  load_in_rating?: number;
  buyers?: string;
  intel_entries?: string[];
  promoter_id?: string;
  source?: string;
  place_type?: 'venue' | 'studio' | 'rehearsal' | 'other' | string;
}

export interface Sale {
  id: string;
  created_at: string;
  item_name: string;
  quantity: number;
  item_type: string; // e.g., 'One Size', 'CD', 'Multiple'
  amount: number;
  payment_method: 'CASH' | 'QR' | 'CARD' | 'PAYPAL';
  image_url?: string;
  band_id?: string;
  show_id?: string;
  team_member_id?: string;
  cart_items?: {
    item_id?: string;
    name: string;
    variantName?: string;
    quantity: number;
    price: number;
    image_url?: string;
  }[];
  client_id?: string;
  is_synced?: boolean;
}

export interface GuestListItem {
  id: string;
  name: string;
  additional_count: number; // e.g., 0, 1, 2, 3, 4
  email?: string;
  phone?: string;
  access_type?: 'VIP' | 'General' | 'Crew' | 'Media' | 'Press';
  confirmed_sent?: boolean;
  confirmed_sent_at?: string;
  confirmed_sent_via?: 'email' | 'sms';
  client_id?: string;
  is_synced?: boolean;
}

export interface Show {
  id: string;
  created_at: string;
  name: string; // Venue or Event Name
  festival_name?: string;
  date: string;
  status: string; // e.g., 'Active', 'Closed'
  revenue?: number;
  show_type?: 'headliner' | 'support' | 'festival' | 'tour date' | 'one-off';
  band_id?: string;

  // Added Fields based on Event input screen:
  event_scope?: 'tour' | 'single';
  tour_id?: string;
  venue_name?: string;
  venue_address?: string;
  venue?: string;
  venue_lat?: number;
  venue_lng?: number;
  city?: string;
  state_province?: string;
  country?: string;
  promoter_contact?: string;
  load_in_time?: string;
  doors_time?: string;
  set_time?: string;
  curfew_time?: string;
  venue_cut_percentage?: number;
  guarantee_amount?: number;
  currency?: string;
  tax_rate?: number;
  capacity?: number | string;
  venue_capacity?: number | string;
  expected_attendance?: '+100' | '100-300' | '300-700' | '700+' | string | number;
  guest_list?: GuestListItem[];
  merch_space_fee?: number;
  seller_cost?: number;
  tables_provided?: boolean;
  hanging_grids_provided?: boolean;
  shore_power?: boolean;
  parking_arrangements?: string;
  age_restriction?: string;
  wifi_network?: string;
  wifi_password?: string;
  additional_notes?: string;
  merch_call_time?: string;
  soundcheck_time?: string;
  dinner_arrangements?: string;
  local_food_notes?: string;
  emergency_medical_info?: string;
  local_pharmacy_info?: string;
  audio_production_requirements?: string;
  stage_backline_requirements?: string;
  support_lineup?: SupportBand[] | any[];
  support_bands?: string;
  stage_name?: string;
  time_slot?: 'early' | 'late' | 'afternoon' | 'all-day' | string;
  actual_attendance?: number;
  ticket_price?: number;
  day_of_show_price?: string | number;
  presale_price?: string | number;
  price?: string;
  safety_code?: string;
  flyer_url?: string;
  ticket_tier_sold?: 'low' | 'normal' | 'sold-out' | string;
  weather_condition?: 'Sunny' | 'Rainy' | 'Cold' | 'Stormy' | 'Snowy' | string;
  promo_effort?: 'none' | 'low' | 'medium' | 'high';
  marketing_medium?: 'flyers' | 'socials' | 'word-of-mouth' | 'radio' | string;
  client_id?: string;
  is_synced?: boolean;
  is_community_submitted?: boolean;
  external_ticket_url?: string;
  collaborator_ids?: string[];

  // Tour Manager / Client Agency Booking Extension Fields
  is_client_managed_show?: boolean;
  tour_manager_id?: string;
  tour_manager_name?: string;
  tour_manager_handle?: string;
  tour_manager_email?: string;
  tour_manager_phone?: string;
  tm_commission_rate?: number; // e.g. 15 for 15%
  tm_commission_amount?: number; // calculated dollar amount
  tm_flat_fee?: number; // optional flat day rate
  client_artist_payout?: number; // net payout to client band
  tm_executive_notes?: string;
}

export interface SupportBand {
  name: string;
  start_time?: string;
  end_time?: string;
}

export interface InventoryItem {
  id: string;
  created_at?: string;
  name: string;
  table_stock: number;
  van_stock: number;
  low_threshold?: number;
  initial_batch_size?: number; // Standard printable or production batch size
  status: 'Critical' | 'Warning' | 'Healthy';
  item_type: string; // e.g. 'CD', 'Multiple', 'One Size', 'Sticker', 'Wall Flag'
  price: number;
  image_url?: string;
  image_path?: string; // Object key/path inside Supabase 'inventory-items' storage bucket
  border_color?: string; // e.g. '#a855f7'
  band_id?: string;
  is_exclusive?: boolean;
  cost?: number;
  sku?: string;
  barcode?: string;
  unit_weight?: string;
  package_type?: string;
  variants?: { id: string; size: string; stock: string }[];
  client_id?: string;
  is_synced?: boolean;
}

export interface StagedDistroItem {
  id: string;
  inventory_id: string;
  name: string;
  original_item_type: string;
  storefront_price: number;
  public_description: string;
  product_image_url: string;
  image_path?: string;
  visibility_status: boolean;
  owner_type?: 'ARTIST' | 'LABEL';
  owner_id?: string;
}

export interface InventoryAudit {
  id: string;
  created_at: string;
  item_id: string;
  item_name: string;
  quantity_change: number; // e.g. -2
  reason: 'misprint' | 'damaged' | 'giveaway' | 'trade' | 'lost' | 'other';
  notes?: string;
  band_id?: string;
}

export interface TourNote {
  id: string;
  created_at: string;
  category: string; // e.g., 'FINANCIALS'
  text: string;
  tag_name?: string; // e.g., 'SETTLEMENT'
  band_id?: string;
  show_id?: string; // Optional reference to a specific show
}

export interface CashTransaction {
  id: string;
  type: 'starting_bank' | 'bank_drop' | 'payout' | 'expense' | 'cash_sale';
  amount: number;
  description: string;
  created_at: string;
}

export interface RegisteredWorkspaceRef {
  type: 'band' | 'promoter' | 'creative' | 'label' | string;
  id: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

export function hasRegisteredWorkspace(
  target: any,
  type: string
): boolean {
  if (!target) return false;
  const targetType = type.toLowerCase();

  // Helper matcher for arrays
  const checkList = (list: any): boolean => {
    if (!Array.isArray(list)) return false;
    return list.some((w: any) => {
      if (!w) return false;
      if (typeof w === 'string') return w.toLowerCase() === targetType;
      if (typeof w === 'object') {
        const itemType = (w.type || w.workspace_type || w.key || '').toLowerCase();
        if (itemType === targetType) return true;
        if (targetType === 'band' && (w.band_id || (itemType === 'band' && w.id))) return true;
        if (targetType === 'creative' && (w.creative_id || (itemType === 'creative' && w.id))) return true;
        if (targetType === 'label' && (w.label_id || (itemType === 'label' && w.id))) return true;
        if (targetType === 'promoter' && (w.promoter_id || (itemType === 'promoter' && w.id))) return true;
      }
      return false;
    });
  };

  // If passed an array directly
  if (Array.isArray(target)) {
    return checkList(target);
  }

  // If passed a userProfile or workspace object
  if (typeof target === 'object') {
    if (targetType === 'fan' || targetType === 'fan_only') return true;
    if (targetType === 'industry_pro' || targetType === 'industry pro') {
      const acc = (target.account_type || '').toLowerCase();
      return acc === 'industry pro' || acc === 'industry_pro' || acc === 'crew' || acc === 'band' || acc === 'promoter' || acc === 'creative' || acc === 'label' || acc === 'admin';
    }

    const accType = (target.account_type || '').toLowerCase();
    if (accType === targetType || (accType === 'artist' && targetType === 'band')) {
      // If account_type is 'band', also verify they have a registered band or band_id
      if (targetType === 'band') {
        if (target.band_id || checkList(target.registered_workspaces)) return true;
      } else {
        return true;
      }
    }

    if (checkList(target.registered_workspaces)) return true;

    if (targetType === 'band' && target.band_id && typeof target.band_id === 'string' && target.band_id.trim() !== '' && target.band_id !== 'null' && target.band_id !== 'undefined') return true;
    if (targetType === 'creative' && target.creative_id && typeof target.creative_id === 'string' && target.creative_id.trim() !== '' && target.creative_id !== 'null' && target.creative_id !== 'undefined') return true;
    if (targetType === 'label' && target.label_id && typeof target.label_id === 'string' && target.label_id.trim() !== '' && target.label_id !== 'null' && target.label_id !== 'undefined') return true;
    if (targetType === 'promoter' && target.promoter_id && typeof target.promoter_id === 'string' && target.promoter_id.trim() !== '' && target.promoter_id !== 'null' && target.promoter_id !== 'undefined') return true;
  }

  return false;
}

export function normalizeRegisteredWorkspaces(
  existing?: any,
  newItems?: any
): string[] {
  const set = new Set<string>();

  const processItem = (item: any) => {
    if (!item) return;
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('{"')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && (parsed.type || parsed.workspace_type || parsed.key)) {
            const t = String(parsed.type || parsed.workspace_type || parsed.key).toLowerCase().trim();
            if (t) set.add(t);
            return;
          }
        } catch (e) {}
      }
      const lower = trimmed.toLowerCase();
      if (lower) set.add(lower);
    } else if (typeof item === 'object') {
      const t = String(item.type || item.workspace_type || item.key || '').toLowerCase().trim();
      if (t) set.add(t);
    }
  };

  if (Array.isArray(existing)) {
    existing.forEach(processItem);
  } else if (existing) {
    processItem(existing);
  }

  if (Array.isArray(newItems)) {
    newItems.forEach(processItem);
  } else if (newItems) {
    processItem(newItems);
  }

  return Array.from(set);
}

export function getRegisteredWorkspaceRefs(
  registered_workspaces: (string | RegisteredWorkspaceRef)[] | undefined,
  profile?: any
): RegisteredWorkspaceRef[] {
  if (!registered_workspaces || !Array.isArray(registered_workspaces)) return [];
  const map = new Map<string, RegisteredWorkspaceRef>();

  registered_workspaces.forEach(w => {
    let type = '';
    let obj: any = null;

    if (typeof w === 'string') {
      const trimmed = w.trim();
      if (trimmed.startsWith('{')) {
        try {
          obj = JSON.parse(trimmed);
          type = String(obj.type || '').toLowerCase();
        } catch (e) {
          type = trimmed.toLowerCase();
        }
      } else {
        type = trimmed.toLowerCase();
      }
    } else if (typeof w === 'object' && w) {
      type = String(w.type || '').toLowerCase();
      obj = w;
    }

    if (!type) return;

    let id = obj?.id || `${type}_entity`;
    let name = obj?.name || `${type.toUpperCase()} Workspace`;

    if (profile) {
      if (type === 'band' && (profile.band_id || profile.band_name || profile.bandName)) {
        id = profile.band_id || id;
        name = profile.band_name || profile.bandName || name;
      } else if (type === 'creative' && (profile.creative_id || profile.creative_name || profile.business_name)) {
        id = profile.creative_id || id;
        name = profile.creative_name || profile.business_name || profile.creative_business_name || name;
      } else if (type === 'label' && (profile.label_id || profile.label_company_name)) {
        id = profile.label_id || id;
        name = profile.label_company_name || name;
      } else if (type === 'promoter') {
        id = profile.promoter_id || id;
        name = profile.promoter_agency || profile.promoter_brand || profile.promoter_name || profile.agency_name || profile.promoter_metadata?.brand_name || profile.promoter_metadata?.agency_name || profile.promoter_title || name;
      }
    }

    if (!map.has(type)) {
      map.set(type, { type, id, name, role: obj?.role });
    }
  });

  return Array.from(map.values());
}

export interface UserProfile {
  id?: string;
  name: string;
  full_name?: string;
  legal_name?: string;
  legalName?: string;
  email: string;
  role: string;
  pin?: string;
  screen_name?: string;
  avatar_url?: string;
  banner_url?: string;
  cover_url?: string;
  bandName?: string;
  band_name?: string;
  band_id?: string;
  creative_id?: string;
  promoter_id?: string;
  promoter_agency?: string;
  promoter_brand?: string;
  promoter_name?: string;
  agency_name?: string;
  promoter_logo?: string;
  promoter_cover_image?: string;
  promoter_region?: string;
  band_logo?: string;
  band_banner?: string;
  band_metadata?: any;
  label_id?: string;
  account_type?: string; // 'fan' | 'industry pro'
  active_workspace?: string; // 'fan' | 'band' | 'promoter' | 'creative' | 'label' etc.
  band_role_mode?: 'musician' | 'tour_manager' | string; // Active identity mode within band workspace
  previous_band_role?: string; // Saved previous musician role for toggling
  target_region?: string; // region matching promoter's profile target_region
  console_handle?: string; // Unique console handle
  location_code?: string; // Legacy location code
  city_state?: string; // Public City, State location
  city?: string;
  state_province?: string;
  country?: string;
  phone?: string;
  zip_code?: string; // Private shipping ZIP code
  creative_metadata?: {
    business_name?: string;
    booking_email?: string;
    base_location?: string;
    portfolio_link?: string;
    bio?: string;
    day_rate?: string;
    pricing_notes?: string;
    gear?: string[];
    skills?: string[];
    primary_category?: string;
    saved_venues?: string[]; // Added for profile directory bookmarks
    [key: string]: any; // Allow arbitrary fields for backwards compatibility
  };
  promoter_metadata?: {
    agency_name?: string;
    brand_name?: string;
    phone?: string;
    target_region?: string;
    saved_venues?: string[]; // Added for profile directory bookmarks
    home_venue?: any;
    [key: string]: any; // Allow arbitrary fields for backwards compatibility
  };
  genre_tags?: string[]; // Added: postgresql SCHEMA EXTENSION
  allowed_workspaces?: string[]; // Entitlement / Paywall capabilities flag
  registered_workspaces?: (string | RegisteredWorkspaceRef)[]; // Entity Registry with type & id references
  sub_tier?: SubscriptionTier;
  stripe_customer_id?: string | null;
  stripe_merchant_id?: string | null;
  stripe_account_id?: string | null;
  payout_method?: string | null;
  paypal_email?: string | null;
  cashapp_tag?: string | null;
  subscription_status?: 'active' | 'trailing_trial' | 'past_due' | 'inactive';
  current_period_end?: string | null;
  billing?: ProfileBillingMetadata;
  is_internal_admin?: boolean;
  user_metadata?: { clearance_tier: 'FAN' | 'PRO' };
  clearance_tier?: 'FAN' | 'PRO';
  clearance_level?: number;
  
  // Custom user fields
  bio?: string;
  blurb?: string;
  profileBlurb?: string;
  genres?: string[];
  top_song_title?: string;
  favoriteSong?: string;
  top_song_url?: string;
  // Decoupled portal-specific assets and names
  creative_avatar?: string;
  creative_banner?: string;
  creative_name?: string;
  promoter_booking_email?: string;
  registered_promoter_id?: string;
  
  // Label-specific fields
  label_avatar?: string;
  label_company_name?: string;
  label_verification_id?: string;
  label_plan_tier?: string;
  label_digital_accreditation_scheme?: string;
  label_default_contract_split?: number;
  label_url_slug?: string;
  label_billing_cycle?: string;
  label_trial_period_days?: number;
  label_stripe_connected?: boolean;
  label_paypal_connected?: boolean;
  label_setup_payment_later?: boolean;
  label_banner?: string;
  label_band_roster?: string[];
  label_sub_labels?: string[];
  label_legal_entity_type?: string;
  label_tax_registration_number?: string;
  label_master_distro_model?: string;
  label_shipping_postal_code?: string;
  label_shipping_country?: string;
  label_genres?: string[];
  label_booking_email?: string;
  label_headquarters?: string;
  label_founded_year?: string;
  label_roster_count?: string;
  label_security_pin?: string;
  label_roster_ticker?: string;
  label_ar_operations_email?: string;
  label_legal_clearance_phone?: string;
  label_dist_channel_dsp?: boolean;
  label_dist_channel_direct?: boolean;
  label_dist_channel_physical?: boolean;
  promoter_setup_payment_later?: boolean;
  promoter_trial_start_time?: number | null;
  payment_due_by?: string | null;
}

// Sub-Scene Matrix Database Table Schemas
export interface DbProfile {
  id: string;
  created_at?: string;
  full_name: string;
  email: string;
  role: string;
  avatar_url?: string;
  band_id?: string;
  genre_tags: string[]; // postgresql: text[] NOT NULL DEFAULT '{}'
}

export interface DbPromoterProfile {
  id: string;
  created_at?: string;
  name: string;
  email: string;
  target_region?: string;
  genre_tags: string[]; // postgresql: text[] NOT NULL DEFAULT '{}'
}

export interface DbVenueDirectory {
  id: string;
  created_at?: string;
  name: string;
  city: string;
  state?: string;
  country?: string;
  capacity?: number;
  email: string;
  buyers?: string;
  genre_tags: string[]; // postgresql: text[] NOT NULL DEFAULT '{}'
}

export interface DbRoutingBeacon {
  id: string;
  created_at?: string;
  band_name: string;
  target_region: string;
  start_date: string;
  end_date: string;
  booking_email: string;
  genre_tags: string[]; // postgresql: text[] NOT NULL DEFAULT '{}'
}

export interface DbCreativeNode {
  id: string;
  created_at?: string;
  updated_at?: string;
  creator_id?: string;
  user_id?: string;
  name: string;
  business_name?: string;
  creative_name?: string;
  handle?: string;
  category: string;
  primary_category?: string;
  secondary_category?: string;
  skills?: string[];
  primary_gear?: string;
  gear?: string[];
  biography?: string;
  bio?: string;
  day_rate?: string;
  base_rate_value?: number;
  rate_range?: string;
  pricing_notes?: string;
  booking_email?: string;
  base_location?: string;
  location?: string;
  portfolio_link?: string;
  website?: string;
  avatar_url?: string;
  banner_url?: string;
  cover_url?: string;
  image?: string;
  image_url?: string;
  instagram?: string;
  payout_method?: string;
  stripe_account_id?: string;
  paypal_email?: string;
  availability_status?: string;
  quick_broadcast?: string;
  genre_tags?: string[];
}

export type Creative = DbCreativeNode;

export const FLAGS = {
  ENABLE_PROMOTER_PORTAL: true
};

export interface Band {
  id: string;
  name: string;
  band_name?: string;
  logo_url: string;
  micro_genres?: string[];
  city?: string;
  state_province?: string;
  country?: string;
  genre?: string;
  homebase?: string;
  founded_year?: string;
  bio?: string;
  music_link?: string;
  label_id?: string;
  cover_url?: string;
  custom_slug?: string;
  booking_email?: string;
  booking_phone?: string;
  featured_youtube_url?: string;
  streaming_url?: string;
  tour_vehicle?: string;
  apparel_sizes?: string[];
  tech_rider_url?: string;
  lineup?: string;
  payment_routing?: string;
  creator_id?: string;
  user_id?: string;
  is_verified?: boolean;
  verification_platform?: string | null;
  metal_archives_url?: string;
  user_role_in_band?: string;
  record_label?: string;
  legal_name?: string;
  tax_id?: string;
  legal_entity_type?: string;
  instagram?: string;
  spotify?: string;
  apple_music?: string;
  bandcamp?: string;
  website?: string;

  // Executive Management & Tour Agency Mode
  is_managed_client?: boolean;
  management_role?: 'tour_manager' | 'booking_agent' | 'executive_producer' | 'owner';
  management_commission_pct?: number;
  management_day_rate?: number;
  executive_contact_name?: string;
  executive_contact_email?: string;
  executive_contact_phone?: string;
  client_roster_notes?: string;
}

export interface Label {
  id: string;
  name: string;
  contact_email?: string;
  payout_routing_key?: string;
}

export interface AssetRevenueSplit {
  item_id: string; // references music or merch items
  label_percentage: number;
  artist_percentage: number;
}

export interface LedgerEntry {
  id: string;
  created_at?: string;
  sale_id: string;
  amount: number;
  payout_target_id: string; // ID of artist or label
  payout_target_type: 'ARTIST' | 'LABEL';
  split_percentage: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  url: string;
  duration?: string;
  fileType?: string;
  track_preview_mode?: '30_SEC_CLIP' | 'FULL_STREAM' | 'LOCKED';
  track_price?: number;
  track_visibility?: boolean;
  owner_type?: 'ARTIST' | 'LABEL';
  owner_id?: string;
  band_id?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
  created_at: string;
}

export interface TicketTier {
  id: string;
  name: string;
  price: number;
  capacity?: number;
  sold: number;
}

export interface StorefrontTicketOption {
  label: string;
  choices: string[];
}

export interface StorefrontTicketItem {
  id: string;
  sku: string;
  name: string;
  details: string;
  price: number;
  capacity: number; // Rendered as "Starting Stock Limit"
  sold: number;
  show_id: string;
  images?: string[]; // Array of up to 6 base64 uploaded files
  optionsLabel?: string; // Legacy: e.g. "Shirt Size"
  options?: string[]; // Legacy: e.g. ["S", "M", "L", "XL"]
  multiOptions?: StorefrontTicketOption[]; // New structured multiple options
  chargeTax?: boolean; // Toggle for taxable status (+8.25%)
  taxRate?: number; // Custom tax rate (defaults 8.25)
  lowStockThreshold?: number; // low stock trigger limit
}

export interface EventLineup {
  id: string;
  name: string;
  date: string;
  venue_name: string;
  ticket_tiers?: TicketTier[];
  stage_name?: string;
  time_slot?: 'early' | 'late' | 'afternoon' | 'all-day' | string;
  dates?: string[];
  duration_days?: number;
}

export interface BankItem {
  id: string;
  text: string;
  category?: string;
}

export interface Flight {
  id: string;
  travelerName: string;
  airline: string;
  flightNumber: string;
  departureAirport: string;
  arrivalAirport: string;
  departureTime: string;
  arrivalTime: string;
  status: 'Scheduled' | 'Boarding' | 'In Transit' | 'Landed' | 'Delayed' | 'Needs Pickup' | 'Reminder Set' | 'Picked up';
  gate?: string;
  notes?: string;
  client_id?: string;
  is_synced?: boolean;
}

export interface UserReview {
  id: string;
  rating: number;
  text: string;
  name: string;
  group: string;
  created_at: string;
  client_id?: string;
  is_synced?: boolean;
}

export interface LoyaltyMember {
  id: string;
  created_at: string;
  name: string;
  city: string;
  state: string;
  country: string;
  email: string;
  phone: string;
  pin: string; // 4-digit verification PIN
  opt_in_promotions: boolean;
  lifetime_discount_uses?: number;
  scans_count?: number;
  points?: number;
  scanned_shows?: string[];
}

export interface BandJoinRequest {
  id: string;
  band_id: string;
  band_name: string;
  user_id: string;
  user_name: string;
  user_email: string;
  role_requested: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export interface DbNotification {
  id: string;
  created_at: string;
  user_id?: string;
  message: string;
  category: 'INVENTORY REFILL' | 'CURFEW UPDATE' | 'MARKET OFFER' | 'SYSTEM' | string;
  requires_push: boolean;
  is_read: boolean;
  item_id?: string; // used for low stock matching to target inventory item
  post_id?: string; // link to related social feed post
}

export interface Offer {
  id: string;
  promoter_id: string;
  promoter_name: string;
  promoter_email: string;
  promoter_phone?: string;
  band_id: string;
  band_name: string;
  venue_name: string;
  city: string;
  state_province?: string;
  country?: string;
  date: string;
  guarantee_amount: number;
  status: 'pending' | 'accepted' | 'declined' | 'renegotiating' | 'interested' | 'draft';
  created_at: string;
  notes?: string;
  renegotiation_notes?: string;
  last_action_by?: 'promoter' | 'band';
  
  // Show/Venue Details requested from/provided by promoter
  load_in_time?: string;
  doors_time?: string;
  set_time?: string;
  curfew_time?: string;
  venue_address?: string;
  expected_attendance?: '+100' | '100-300' | '300-700' | '700+';
  age_restriction?: string;
  additional_notes?: string;
  details_completed?: boolean;
  show_type?: 'standard' | 'festival';
  deposit_amount?: number;
  deposit_due_date?: string;
  currency?: string;
  radius_clause?: string;
  offer_expiration?: string;
  event_id?: string;
  event_name?: string;
  stage_name?: string;
  time_slot?: 'early' | 'late' | 'afternoon' | 'all-day' | string;
  venue_cut_percentage?: number;
  merch_cut_percentage?: number;
  show_lineup?: string;
  soundcheck_time?: string;
  merch_call_time?: string;
  dinner_arrangements?: string;
  travel_arrangements?: string;
  is_cancelled?: boolean;
  cancellation_acknowledged?: boolean;
}

export type SubscriptionTier = 'free_for_life' | 'power_user_pro' | 'enterprise_circuit' | 'touring_pro' | 'touring_pro_plus' | 'per_show' | 'per_tour' | 'local_booking_agent' | 'regional_talent_buyer' | 'enterprise_network' | 'single_festival_pass';

export const BILLING_TIER_LIMITS = {
  free_for_life: { maxVenues: Infinity, price: 0, label: 'FREE FOR LIFE' },
  power_user_pro: { maxVenues: Infinity, price: 89, label: 'POWER USER PRO' },
  enterprise_circuit: { maxVenues: Infinity, price: 249, label: 'ENTERPRISE CIRCUIT' },
  local_booking_agent: { maxVenues: Infinity, price: 29.99, label: 'LOCAL BOOKING AGENT' },
  regional_talent_buyer: { maxVenues: Infinity, price: 74.99, label: 'REGIONAL TALENT BUYER' },
  enterprise_network: { maxVenues: Infinity, price: 149.99, label: 'ENTERPRISE NETWORK' }
};

export interface ProfileBillingMetadata {
  stripe_customer_id: string | null;
  subscription_status: 'active' | 'trailing_trial' | 'past_due' | 'inactive';
  current_period_end: string | null;
}






