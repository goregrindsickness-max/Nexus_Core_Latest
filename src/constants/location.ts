export interface StateOption {
  code: string;
  name: string;
}

export interface CountryOption {
  code: string;
  name: string;
}

export const US_STATES: StateOption[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' }
];

export function formatLocationDisplay(profOrLocation?: any): string {
  if (!profOrLocation) return 'USA / Global';

  let rawString = '';
  let cityInput = '';
  let stateInput = '';
  let countryInput = '';

  if (typeof profOrLocation === 'string') {
    rawString = profOrLocation;
  } else if (typeof profOrLocation === 'object') {
    cityInput = profOrLocation.city || profOrLocation.homebase_city || '';
    stateInput = profOrLocation.state_province || profOrLocation.state || '';
    countryInput = profOrLocation.country || '';
    rawString = profOrLocation.location || profOrLocation.city_state || profOrLocation.homebase || profOrLocation.location_code || '';
  }

  // Tokenize and clean all location input fragments
  const rawPieces = [cityInput, stateInput, countryInput, rawString]
    .filter(Boolean)
    .join(',')
    .split(/[,/|]+/)
    .map(p => p.trim())
    .filter(Boolean);

  let detectedCity = '';
  let detectedState = '';
  let detectedCountry = '';

  for (const piece of rawPieces) {
    if (!piece) continue;
    const clean = piece.trim();
    if (!clean) continue;
    const upper = clean.toUpperCase();

    // Skip generic placeholder words
    if (['GLOBAL', 'REMOTE', 'ANYWHERE', 'SCENE', 'GLOBAL SCENE', 'WORLDWIDE', 'N/A', 'NULL', 'UNDEFINED'].includes(upper)) {
      continue;
    }

    // Check if fragment matches US state (by 2-letter code or full state name)
    const foundState = US_STATES.find(s => s.code.toUpperCase() === upper || s.name.toUpperCase() === upper);
    if (foundState) {
      // Always keep the full state name (e.g. 'Texas') and drop the 2-letter code ('TX')
      detectedState = foundState.name;
      continue;
    }

    // Check US country aliases
    if (['US', 'USA', 'UNITED STATES', 'UNITED STATES OF AMERICA'].includes(upper)) {
      if (!detectedCountry) {
        detectedCountry = 'USA';
      }
      continue;
    }

    // Check countries list
    const foundCountry = COUNTRIES.find(c => c.code.toUpperCase() === upper || c.name.toUpperCase() === upper);
    if (foundCountry) {
      if (!detectedCountry) {
        detectedCountry = foundCountry.name === 'United States' ? 'USA' : foundCountry.name;
      }
      continue;
    }

    // Check for city candidate, stripping embedded state codes, state names, and country aliases
    let candidateCity = clean;
    for (const st of US_STATES) {
      const stateRegex = new RegExp(`\\b(${st.code}|${st.name})\\b`, 'gi');
      if (stateRegex.test(candidateCity)) {
        if (!detectedState) {
          detectedState = st.name;
        }
        candidateCity = candidateCity.replace(stateRegex, ' ').trim();
      }
    }

    // Also strip country words from city candidate
    candidateCity = candidateCity
      .replace(/\b(USA|US|United States|United States of America|Global|Scene)\b/gi, ' ')
      .replace(/[\s,\-_]+/g, ' ')
      .trim();

    if (candidateCity && !detectedCity) {
      detectedCity = candidateCity;
    }
  }

  // If a US state is present with no explicit country, set USA
  if (detectedState && !detectedCountry) {
    detectedCountry = 'USA';
  }

  // Final check: if city equals state (e.g. "Texas"), clear city so it doesn't duplicate
  if (detectedCity && detectedState && detectedCity.toLowerCase() === detectedState.toLowerCase()) {
    detectedCity = '';
  }

  const parts: string[] = [];
  if (detectedCity) parts.push(detectedCity);
  if (detectedState) parts.push(detectedState);
  if (detectedCountry && detectedCountry.toUpperCase() !== detectedState?.toUpperCase() && detectedCountry.toUpperCase() !== detectedCity?.toUpperCase()) {
    parts.push(detectedCountry);
  }

  if (parts.length === 0) {
    if (rawString) {
      const cleanRaw = rawString
        .replace(/\bTX\b/g, 'Texas')
        .split('/')[0]
        .trim();
      return cleanRaw || 'USA / Global';
    }
    return 'USA / Global';
  }

  return parts.join(', ');
}

export const COUNTRIES: CountryOption[] = [
  { code: 'USA', name: 'United States' },
  { code: 'CAN', name: 'Canada' },
  { code: 'GBR', name: 'United Kingdom' },
  { code: 'MEX', name: 'Mexico' },
  { code: 'DEU', name: 'Germany' },
  { code: 'FRA', name: 'France' },
  { code: 'AUS', name: 'Australia' },
  { code: 'JPN', name: 'Japan' },
  { code: 'BRA', name: 'Brazil' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'AUT', name: 'Austria' },
  { code: 'BEL', name: 'Belgium' },
  { code: 'CHL', name: 'Chile' },
  { code: 'COL', name: 'Colombia' },
  { code: 'CZE', name: 'Czech Republic' },
  { code: 'DNK', name: 'Denmark' },
  { code: 'EGY', name: 'Egypt' },
  { code: 'EST', name: 'Estonia' },
  { code: 'FIN', name: 'Finland' },
  { code: 'GRC', name: 'Greece' },
  { code: 'HUN', name: 'Hungary' },
  { code: 'ISL', name: 'Iceland' },
  { code: 'IND', name: 'India' },
  { code: 'IDN', name: 'Indonesia' },
  { code: 'IRL', name: 'Ireland' },
  { code: 'ISR', name: 'Israel' },
  { code: 'ITA', name: 'Italy' },
  { code: 'JAM', name: 'Jamaica' },
  { code: 'KEN', name: 'Kenya' },
  { code: 'LVA', name: 'Latvia' },
  { code: 'LTU', name: 'Lithuania' },
  { code: 'MYS', name: 'Malaysia' },
  { code: 'NLD', name: 'Netherlands' },
  { code: 'NZL', name: 'New Zealand' },
  { code: 'NGA', name: 'Nigeria' },
  { code: 'NOR', name: 'Norway' },
  { code: 'PER', name: 'Peru' },
  { code: 'PHL', name: 'Philippines' },
  { code: 'POL', name: 'Poland' },
  { code: 'PRT', name: 'Portugal' },
  { code: 'ROU', name: 'Romania' },
  { code: 'SAU', name: 'Saudi Arabia' },
  { code: 'SGP', name: 'Singapore' },
  { code: 'SVK', name: 'Slovakia' },
  { code: 'ZAF', name: 'South Africa' },
  { code: 'KOR', name: 'South Korea' },
  { code: 'ESP', name: 'Spain' },
  { code: 'SWE', name: 'Sweden' },
  { code: 'CHE', name: 'Switzerland' },
  { code: 'THA', name: 'Thailand' },
  { code: 'TUR', name: 'Turkey' },
  { code: 'ARE', name: 'United Arab Emirates' },
  { code: 'URY', name: 'Uruguay' },
  { code: 'VNM', name: 'Vietnam' },
  { code: 'OTHER', name: 'Other / Global' }
];
