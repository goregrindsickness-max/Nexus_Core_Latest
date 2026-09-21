export function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 3958.8; // Radius of the Earth in miles
  const rlat1 = lat1 * (Math.PI / 180);
  const rlat2 = lat2 * (Math.PI / 180);
  const difflat = rlat2 - rlat1;
  const difflon = (lon2 - lon1) * (Math.PI / 180);

  const d = 2 * R * Math.asin(Math.sqrt(Math.sin(difflat / 2) * Math.sin(difflat / 2) + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(difflon / 2) * Math.sin(difflon / 2)));
  const dKm = d * 1.60934; return { miles: Math.round(d), km: Math.round(dKm) };
}

export function getShowCoordinates(show: any): { lat: number; lng: number } {
  // Try to parse from mapUrl
  if (show.mapUrl) {
    const match = show.mapUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) {
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
  }

  // Fallback to simple hash-based pseudo-random coords based on venue name to simulate map
  const hash = show.venue.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0);
  return {
    lat: 34.0522 + (hash % 10),
    lng: -118.2437 + (hash % 15)
  };
}
