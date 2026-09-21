// Utility for community event pages, flyer attachments, and duplicate detection
export interface CommunityEventRecord {
  id: string;
  name: string;
  headliner?: string;
  date: string;
  time?: string;
  venue_name: string;
  venue_address?: string;
  city?: string;
  state_province?: string;
  category?: string;
  lineup?: string[];
  price?: string;
  cost?: string;
  external_ticket_url?: string;
  ticketUrl?: string;
  flyer_url?: string;
  description?: string;
  is_secret_location?: boolean;
  created_by?: string;
  created_at?: string;
  rsvps_count?: number;
  attendees?: string[];
  linked_posts_count?: number;
}

export interface CommunityEventInput {
  id?: string;
  title?: string;
  name?: string;
  category?: string;
  date?: string;
  time?: string;
  venue?: string;
  venue_name?: string;
  locationName?: string;
  address?: string;
  venue_address?: string;
  city?: string;
  state_province?: string;
  isSecretLocation?: boolean;
  is_secret_location?: boolean;
  lineup?: string[] | string;
  flyerUrl?: string;
  flyer_url?: string;
  description?: string;
  cost?: string;
  price?: string;
  ticketUrl?: string;
  external_ticket_url?: string;
}

export const EVENT_CATEGORIES = [
  { id: 'DIY Show', label: 'DIY SHOW', icon: '🎸', desc: 'House, basement, or backyard gig' },
  { id: 'Fest / Festival', label: 'FESTIVAL', icon: '🎪', desc: 'Multi-band fest or all-dayer' },
  { id: 'Tour Date', label: 'TOUR DATE', icon: '🚐', desc: 'Official tour routing stop' },
  { id: 'Club Gig', label: 'CLUB GIG', icon: '⚡', desc: 'Standard music club or venue' },
  { id: 'Warehouse Rave', label: 'WAREHOUSE RAVE', icon: '🔊', desc: 'Off-grid venue / late night' },
  { id: 'House Party', label: 'HOUSE PARTY', icon: '🎉', desc: 'Living room, kitchen, or generator set' },
  { id: 'Pop-Up / Jam', label: 'POP-UP / JAM', icon: '🔥', desc: 'Skate park, bridge, impromptu showcase' },
  { id: 'Other Gathering', label: 'OTHER', icon: '✨', desc: 'Zine fair, swap meet, or workshop' }
];

const STORAGE_KEY = 'nexus_community_events';

// Default initial seeded community events so the calendar has rich scene history
const SEEDED_EVENTS: CommunityEventRecord[] = [
  {
    id: 'evt_autopsy_la',
    name: 'AUTOPSY Severed Underground Ritual',
    headliner: 'AUTOPSY',
    date: 'Fri, Oct 24, 2026',
    time: 'Doors 7:00 PM',
    venue_name: 'The Underground',
    venue_address: '1420 S Main St',
    city: 'Los Angeles',
    state_province: 'CA',
    category: 'Club Show',
    lineup: ['Autopsy', 'Mortician', 'Skeletal Remains'],
    price: '$35.00',
    external_ticket_url: 'https://dice.fm/event/autopsy-la',
    flyer_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop&q=80',
    description: 'Exclusive West Coast death metal ritual. Full classic set + rare cuts. 21+ only.',
    created_by: 'UndergroundPromoter',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    rsvps_count: 88,
    attendees: ['MoshKing', 'RiffLord'],
    linked_posts_count: 2,
  },
  {
    id: 'evt_nw_terror_fest',
    name: 'Northwest Terror Fest 2026',
    headliner: 'DARK FUNERAL',
    date: 'Sat, Nov 14, 2026',
    time: 'Doors 3:00 PM',
    venue_name: 'Neumos & Barboza',
    venue_address: '925 E Pike St',
    city: 'Seattle',
    state_province: 'WA',
    category: 'Festival',
    lineup: ['Dark Funeral', 'Immolation', 'Cryptopsy', 'Mizmor', 'Bell Witch'],
    price: '$95 3-Day Pass',
    external_ticket_url: 'https://dice.fm/event/nw-terror-fest-2026',
    flyer_url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop&q=80',
    description: '3 Days of extreme audio devastation across two stages. All ages permitted.',
    created_by: 'NW_Terror_Crew',
    created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
    rsvps_count: 142,
    attendees: ['GraveDigger', 'SeattleSlammer'],
    linked_posts_count: 3,
  },
  {
    id: 'evt_boiler_room_diy',
    name: 'The Boiler Room Alley DIY Noise Fest',
    headliner: 'Vomit Corpse',
    date: 'Sat, Aug 22, 2026',
    time: '8:00 PM',
    venue_name: 'The Boiler Room Alley',
    venue_address: 'Secret Alleyway Spot',
    city: 'Portland',
    state_province: 'OR',
    category: 'DIY Gig',
    is_secret_location: true,
    lineup: ['Vomit Corpse', 'Mortician Tribute', 'Local Grinders'],
    price: 'Free / $5 Donation',
    external_ticket_url: '',
    flyer_url: 'https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Analepsy%20-%20Quinscence.jpg',
    description: 'DIY house and alleyway slam show. BYOB, respect the neighbors, no jerks.',
    created_by: 'PortlandDIYUnion',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    rsvps_count: 42,
    attendees: ['SludgeBoy'],
    linked_posts_count: 1,
  }
];

/**
 * Normalizes text for fuzzy deduplication comparison
 */
export function normalizeText(str?: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(the|at|in|on|live|presents|and|&|show|gig|tour|fest|festival)\b/gi, ' ')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Normalizes URL (strips protocol, www, query params, trailing slashes)
 */
export function normalizeUrl(url?: string): string {
  if (!url) return '';
  try {
    const raw = url.trim();
    const withoutProtocol = raw.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const withoutQuery = withoutProtocol.split('?')[0].split('#')[0];
    return withoutQuery.replace(/\/+$/, '').toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

/**
 * Normalizes date string into month/day tokens for robust matching
 */
export function normalizeDate(dateStr?: string): string {
  if (!dateStr) return '';
  const clean = dateStr.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  
  // Try standard date parse
  const parsed = Date.parse(dateStr);
  if (!isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}-${d.getUTCDate()}`;
  }

  // Tokenize (e.g. "sat aug 22" or "oct 24 2026")
  const tokens = clean.split(/\s+/).filter(t => t.length > 0 && !['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'].includes(t));
  return tokens.slice(0, 3).sort().join('-');
}

/**
 * Retrieves all registered community events from local storage (with fallback seeds)
 */
export function getExistingCommunityEvents(): CommunityEventRecord[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_EVENTS));
      return SEEDED_EVENTS;
    }
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEEDED_EVENTS));
    return SEEDED_EVENTS;
  } catch (err) {
    console.warn('Error reading community events:', err);
    return SEEDED_EVENTS;
  }
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedEvent: CommunityEventRecord | null;
  matchReason?: string;
  confidence: 'exact' | 'high' | 'possible' | 'none';
}

/**
 * Checks whether a candidate event already exists in the community database
 */
export function checkDuplicateCommunityEvent(candidate: CommunityEventInput): DuplicateCheckResult {
  const title = (candidate.title || candidate.name || '').trim();
  const date = (candidate.date || '').trim();
  const venue = (candidate.venue || candidate.venue_name || candidate.locationName || '').trim();
  const ticketUrl = (candidate.ticketUrl || candidate.external_ticket_url || '').trim();

  // If insufficient information to identify an event, cannot be duplicate
  if (!title && !ticketUrl && (!venue || !date)) {
    return { isDuplicate: false, matchedEvent: null, confidence: 'none' };
  }

  const existingEvents = getExistingCommunityEvents();
  const normCandidateUrl = normalizeUrl(ticketUrl);
  const normCandidateTitle = normalizeText(title);
  const normCandidateVenue = normalizeText(venue);
  const normCandidateDate = normalizeDate(date);

  for (const event of existingEvents) {
    // If candidate has an explicit id and matches existing event id
    if (candidate.id && event.id === candidate.id) {
      return {
        isDuplicate: true,
        matchedEvent: event,
        matchReason: 'Existing event page record ID',
        confidence: 'exact'
      };
    }

    // 1. Exact Ticket URL Match
    const normEventUrl = normalizeUrl(event.external_ticket_url || event.ticketUrl);
    if (normCandidateUrl && normEventUrl && normCandidateUrl === normEventUrl) {
      return {
        isDuplicate: true,
        matchedEvent: event,
        matchReason: `Matching ticket URL (${event.venue_name || 'Event'})`,
        confidence: 'exact'
      };
    }

    const normEventTitle = normalizeText(event.name || event.headliner);
    const normEventVenue = normalizeText(event.venue_name);
    const normEventDate = normalizeDate(event.date);

    // 2. Same Venue + Same Date (Most reliable gig deduplicator)
    if (normCandidateVenue && normEventVenue && normCandidateDate && normEventDate) {
      const venueMatches = normCandidateVenue === normEventVenue ||
        normCandidateVenue.includes(normEventVenue) ||
        normEventVenue.includes(normCandidateVenue);

      const dateMatches = normCandidateDate === normEventDate ||
        date.toLowerCase().replace(/[^a-z0-9]/g, '') === event.date.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (venueMatches && dateMatches) {
        return {
          isDuplicate: true,
          matchedEvent: event,
          matchReason: `Same venue (${event.venue_name}) and date (${event.date})`,
          confidence: 'high'
        };
      }
    }

    // 3. Same Title + Same Date
    if (normCandidateTitle && normEventTitle && normCandidateDate && normEventDate) {
      const titleMatches = normCandidateTitle === normEventTitle ||
        (normCandidateTitle.length > 5 && normEventTitle.includes(normCandidateTitle)) ||
        (normEventTitle.length > 5 && normCandidateTitle.includes(normEventTitle));

      const dateMatches = normCandidateDate === normEventDate ||
        date.toLowerCase().replace(/[^a-z0-9]/g, '') === event.date.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (titleMatches && dateMatches) {
        return {
          isDuplicate: true,
          matchedEvent: event,
          matchReason: `Matching event title "${event.name}" on ${event.date}`,
          confidence: 'high'
        };
      }
    }

    // 4. Exact Title Match + Same Venue (even if date string is slightly different)
    if (normCandidateTitle && normEventTitle && normCandidateVenue && normEventVenue) {
      if (normCandidateTitle === normEventTitle && normCandidateVenue === normEventVenue) {
        return {
          isDuplicate: true,
          matchedEvent: event,
          matchReason: `Same event title and venue (${event.venue_name})`,
          confidence: 'high'
        };
      }
    }
  }

  return { isDuplicate: false, matchedEvent: null, confidence: 'none' };
}

/**
 * Saves a new community event OR links to an existing one without creating duplicate pages.
 */
export function registerCommunityEvent(
  candidate: CommunityEventInput,
  authorName: string = 'Scene Member',
  forceCreateNew: boolean = false
): { event: CommunityEventRecord; isNew: boolean; matchedEvent?: CommunityEventRecord } {
  const existingEvents = getExistingCommunityEvents();
  const dupCheck = !forceCreateNew ? checkDuplicateCommunityEvent(candidate) : { isDuplicate: false, matchedEvent: null };

  const rawLineup = candidate.lineup;
  const parsedLineup: string[] = Array.isArray(rawLineup)
    ? rawLineup
    : typeof rawLineup === 'string' && rawLineup.trim()
    ? rawLineup.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const rawAddress = candidate.address || candidate.venue_address || '';
  const city = candidate.city || (rawAddress.includes(',') ? rawAddress.split(',')[0].trim() : candidate.locationName || candidate.venue || '');
  const stateProvince = candidate.state_province || (rawAddress.includes(',') ? rawAddress.split(',')[1]?.trim() : '');

  // If a duplicate event page already exists, merge/enrich and reuse its ID!
  if (dupCheck.isDuplicate && dupCheck.matchedEvent) {
    const existing = dupCheck.matchedEvent;
    
    // Combine lineup items without duplicates
    const combinedLineup = Array.from(new Set([
      ...(existing.lineup || []),
      ...parsedLineup
    ]));

    const updatedEvent: CommunityEventRecord = {
      ...existing,
      // Keep canonical ID!
      id: existing.id,
      // Enrich any fields that were empty before
      external_ticket_url: existing.external_ticket_url || candidate.ticketUrl || candidate.external_ticket_url || '',
      ticketUrl: existing.ticketUrl || candidate.ticketUrl || candidate.external_ticket_url || '',
      flyer_url: existing.flyer_url || candidate.flyerUrl || candidate.flyer_url || '',
      lineup: combinedLineup.length > 0 ? combinedLineup : existing.lineup,
      description: existing.description || candidate.description || '',
      price: existing.price || candidate.price || candidate.cost || '',
      cost: existing.cost || candidate.cost || candidate.price || '',
      linked_posts_count: (existing.linked_posts_count || 1) + 1,
    };

    const targetIndex = existingEvents.findIndex(e => e.id === existing.id);
    if (targetIndex >= 0) {
      existingEvents[targetIndex] = updatedEvent;
    } else {
      existingEvents.unshift(updatedEvent);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existingEvents));
      window.dispatchEvent(new CustomEvent('nexus_community_events_updated', { detail: { event: updatedEvent, isDuplicateLink: true } }));
    } catch (e) {
      console.error('Error saving updated community event:', e);
    }

    return { event: updatedEvent, isNew: false, matchedEvent: existing };
  }

  // Otherwise, create a brand-new distinct event page record
  const newEventId = candidate.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const title = (candidate.title || candidate.name || 'Underground Show').trim();

  const newEventRecord: CommunityEventRecord = {
    id: newEventId,
    name: title,
    headliner: title,
    date: candidate.date?.trim() || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    time: candidate.time?.trim() || '8:00 PM',
    venue_name: candidate.venue || candidate.venue_name || candidate.locationName || 'DIY Underground Space',
    venue_address: rawAddress,
    city: city || 'Local Scene',
    state_province: stateProvince,
    category: candidate.category || 'DIY Gig',
    is_secret_location: candidate.isSecretLocation ?? candidate.is_secret_location ?? false,
    lineup: parsedLineup,
    price: candidate.cost || candidate.price || 'Free / Donation',
    cost: candidate.cost || candidate.price || 'Free / Donation',
    external_ticket_url: candidate.ticketUrl || candidate.external_ticket_url || '',
    ticketUrl: candidate.ticketUrl || candidate.external_ticket_url || '',
    flyer_url: candidate.flyerUrl || candidate.flyer_url || '',
    description: candidate.description || '',
    created_by: authorName,
    created_at: new Date().toISOString(),
    rsvps_count: 1,
    attendees: [authorName],
    linked_posts_count: 1,
  };

  existingEvents.unshift(newEventRecord);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingEvents));
    window.dispatchEvent(new CustomEvent('nexus_community_events_updated', { detail: { event: newEventRecord, isDuplicateLink: false } }));
  } catch (e) {
    console.error('Error creating community event record:', e);
  }

  return { event: newEventRecord, isNew: true };
}
