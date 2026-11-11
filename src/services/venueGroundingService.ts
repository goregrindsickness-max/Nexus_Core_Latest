export interface GroundedVenueData {
  hasVenue: boolean;
  responseText: string;
  mapsSources: Array<{
    title: string;
    uri: string | null;
    placeAnswerSources?: any;
  }>;
  groundingChunks: any[];
  queriedAt?: string;
}

/**
 * Triggers Google Maps Grounded venue detection via server endpoint /api/venue-grounding
 */
export async function detectGroundedVenue(text: string, lat?: number, lng?: number): Promise<GroundedVenueData | null> {
  if (!text || typeof text !== 'string' || !text.trim()) return null;

  try {
    const res = await fetch('/api/venue-grounding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.trim(), lat, lng })
    });

    if (!res.ok) {
      console.warn('Venue grounding request returned status:', res.status);
      return null;
    }

    const data = await res.json();
    if (data && data.success) {
      return {
        hasVenue: Boolean(data.hasVenue),
        responseText: data.responseText || '',
        mapsSources: Array.isArray(data.mapsSources) ? data.mapsSources : [],
        groundingChunks: Array.isArray(data.groundingChunks) ? data.groundingChunks : [],
        queriedAt: new Date().toISOString()
      };
    }
    return null;
  } catch (err) {
    console.error('Failed to detect grounded venue:', err);
    return null;
  }
}
