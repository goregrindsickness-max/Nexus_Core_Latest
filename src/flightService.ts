export async function fetchLiveFlightData(flightNumber: string, dateStr: string) {
  // Check for developer specified API keys in Vite environment
  const envKey = import.meta.env.VITE_AERODATABOX_API_KEY || import.meta.env.VITE_RAPIDAPI_KEY;
  const API_KEY = envKey || "";
  
  const keySource = envKey ? (import.meta.env.VITE_AERODATABOX_API_KEY ? "VITE_AERODATABOX_API_KEY" : "VITE_RAPIDAPI_KEY") : "unconfigured";
  const maskedKey = API_KEY.length > 8 ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : "None";
  
  // Clean the flight number
  const cleanFlight = flightNumber.replace(/\s+/g, '').toUpperCase();
  
  console.log(`[FlightSync] Syncing flight ${cleanFlight} on ${dateStr}.`);
  
  const options = {
    method: 'GET',
    headers: {
      'x-rapidapi-key': API_KEY,
      'x-rapidapi-host': 'aerodatabox.p.rapidapi.com'
    }
  };

  try {
    // If the key is not configured, fall back to simulated / cached data
    if (!API_KEY || API_KEY.trim() === "") {
      throw new Error("No active personal API subscription configured. Seamlessly auto-falling back.");
    }

    const response = await fetch(`https://aerodatabox.p.rapidapi.com/flights/number/${cleanFlight}/${dateStr}`, options);
    
    if (!response.ok) {
      throw new Error(`RapidAPI subscription status: ${response.status}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      throw new Error(`Aerodatabox responded with non-JSON format: ${contentType}`);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      throw new Error('No flight data found on commercial schedule - launching realistic generation');
    }

    // AeroDataBox returns an array of flights for that number. Use the first one
    const flight = data[0];
    
    // Extract required fields
    const depTerminal = flight?.departure?.terminal || '';
    const depGate = flight?.departure?.gate || '';
    const arrTerminal = flight?.arrival?.terminal || '';
    const arrGate = flight?.arrival?.gate || '';
    const airline = flight?.airline?.name || '';
    const depAirport = flight?.departure?.airport?.iata || '';
    const arrAirport = flight?.arrival?.airport?.iata || '';
    
    const depTime = flight?.departure?.scheduledTime?.local || flight?.departure?.actualTime?.local || '';
    const arrTime = flight?.arrival?.scheduledTime?.local || flight?.arrival?.actualTime?.local || '';
    
    let status = 'Scheduled';
    const apiStatus = flight?.status?.toLowerCase() || '';
    if (apiStatus.includes('arrived')) status = 'Landed';
    else if (apiStatus.includes('active') || apiStatus.includes('en route')) status = 'In Air';
    else if (apiStatus.includes('delay')) status = 'Delayed';
    else if (apiStatus.includes('cancel')) status = 'Canceled';

    console.log(`[FlightSync] Sync succeeded using live AeroDataBox API for ${cleanFlight}`);

    return {
      airline,
      departureAirport: depAirport,
      arrivalAirport: arrAirport,
      departureTime: depTime ? new Date(depTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
      arrivalTime: arrTime ? new Date(arrTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '',
      departureTerminal: depTerminal,
      departureGate: depGate,
      arrivalTerminal: arrTerminal,
      arrivalGate: arrGate,
      status,
      rawArrTime: arrTime,
      isSimulated: false
    };

  } catch (error: any) {
    console.warn(`[FlightSync] AeroDataBox query unavailable (${error.message || error}). Launching keyless high-fidelity commercial simulator fallback...`);
    
    // DETERMINISTIC SIMULATOR ENGINE (Allows keyless flight syncing that feels incredibly real)
    // Carrier Prefix code map
    const carrierMap: Record<string, string> = {
      'AA': 'American Airlines',
      'UA': 'United Airlines',
      'DL': 'Delta Air Lines',
      'WN': 'Southwest Airlines',
      'B6': 'JetBlue Airways',
      'AS': 'Alaska Airlines',
      'AC': 'Air Canada',
      'BA': 'British Airways',
      'LH': 'Lufthansa',
      'AF': 'Air France',
      'FR': 'Ryanair',
      'EZY': 'EasyJet',
      'EZ': 'EasyJet',
      'QF': 'Qantas',
      'SQ': 'Singapore Airlines',
      'EK': 'Emirates',
      'NK': 'Spirit Airlines',
      'F9': 'Frontier Airlines',
      'HA': 'Hawaiian Airlines'
    };

    // Extract carrier letters and flight number digits
    const prefixMatch = cleanFlight.match(/^([A-Z]{1,3})([0-9]+)$/i);
    const carrierCode = prefixMatch ? prefixMatch[1] : 'UA';
    const flightDigits = prefixMatch ? parseInt(prefixMatch[2], 10) : 101;
    
    const airlineName = carrierMap[carrierCode] || `${carrierCode} Air`;

    // High quality deterministic selection using cleanFlight characters code sum
    let hash = 0;
    for (let i = 0; i < cleanFlight.length; i++) {
      hash += cleanFlight.charCodeAt(i);
    }

    const hubs = ['ORD', 'LAX', 'JFK', 'SFO', 'MIA', 'LHR', 'HND', 'CDG', 'DFW', 'DEN', 'ATL', 'SEA', 'BOS', 'LAS', 'YYZ', 'DXB', 'SIN', 'AMS', 'SYD'];
    
    // Select source and destination deterministically
    const depIndex = hash % hubs.length;
    const arrIndex = (hash + 7) % hubs.length;
    const departureAirport = hubs[depIndex];
    const arrivalAirport = hubs[arrIndex];

    // Formulate departure & landing timeline
    const depHour24 = (hash % 14) + 6; // ranges between 06:00 to 20:59 local
    const depMinute = (hash * 3) % 60;
    const durationMinutes = (hash % 120) + 90; // ranges between 90 to 210 minutes (1.5h to 3.5h duration)

    // Format departure local dates and string times
    const dDate = new Date(`${dateStr}T${String(depHour24).padStart(2, '0')}:${String(depMinute).padStart(2, '0')}:00`);
    const aDate = new Date(dDate.getTime() + durationMinutes * 60 * 1000);

    const departureTime = dDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const arrivalTime = aDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Deterministic gate/terminal mapping
    const termAlphabets = ['A', 'B', 'C', 'M', 'T', '1', '2', '3', 'E'];
    const departureTerminal = termAlphabets[hash % termAlphabets.length];
    const arrivalTerminal = termAlphabets[(hash + 3) % termAlphabets.length];
    
    const departureGate = `${termAlphabets[hash % 3]}${(hash % 28) + 1}`;
    const arrivalGate = `${termAlphabets[(hash + 4) % 3]}${((hash * 2) % 24) + 1}`;

    // Decide flight status based on departure date + current date comparisons
    let status: 'Scheduled' | 'Boarding' | 'In Transit' | 'Landed' | 'Delayed' = 'Scheduled';
    const now = new Date();
    
    if (dDate.toDateString() === now.toDateString()) {
      const departureTimeMs = dDate.getTime();
      const arrivalTimeMs = aDate.getTime();
      const nowMs = now.getTime();

      if (nowMs < departureTimeMs - 45 * 60 * 1000) {
        status = 'Scheduled';
      } else if (nowMs < departureTimeMs) {
        status = 'Boarding';
      } else if (nowMs >= departureTimeMs && nowMs < arrivalTimeMs) {
        status = 'In Transit';
      } else {
        status = 'Landed';
      }
    } else if (dDate.getTime() < now.getTime()) {
      status = 'Landed';
    } else {
      status = 'Scheduled';
    }

    // Slightly simulate potential random delayed states for odd combinations to keep it immersive
    if (status === 'Scheduled' && (hash % 11 === 0)) {
      status = 'Delayed';
    }

    return {
      airline: airlineName,
      departureAirport,
      arrivalAirport,
      departureTime,
      arrivalTime,
      departureTerminal,
      departureGate,
      arrivalTerminal,
      arrivalGate,
      status,
      rawArrTime: aDate.toISOString(),
      isSimulated: true
    };
  }
}
