// Comprehensive Geographic Coordinate Resolution Engine for Music Tours & Shows

export interface GeoLocation {
  lng: number;
  lat: number;
  label?: string;
}

// 1. Comprehensive City Geolocation Database (160+ Tour Markets)
export const CITIES_DATABASE: Record<string, { lng: number; lat: number; state: string; label: string }> = {
  // Illinois
  'joliet': { lng: -88.0817, lat: 41.5250, state: 'IL', label: 'Joliet, IL, USA' },
  'chicago': { lng: -87.6298, lat: 41.8781, state: 'IL', label: 'Chicago, IL, USA' },
  'rockford': { lng: -89.0939, lat: 42.2711, state: 'IL', label: 'Rockford, IL, USA' },
  'peoria': { lng: -89.5890, lat: 40.6936, state: 'IL', label: 'Peoria, IL, USA' },
  'bloomington il': { lng: -88.9904, lat: 40.4842, state: 'IL', label: 'Bloomington, IL, USA' },
  'springfield il': { lng: -89.6501, lat: 39.7817, state: 'IL', label: 'Springfield, IL, USA' },
  'champaign': { lng: -88.2434, lat: 40.1164, state: 'IL', label: 'Champaign, IL, USA' },
  'urbana': { lng: -88.2073, lat: 40.1106, state: 'IL', label: 'Urbana, IL, USA' },
  'evanston': { lng: -87.6877, lat: 42.0451, state: 'IL', label: 'Evanston, IL, USA' },
  'aurora il': { lng: -88.3201, lat: 41.7606, state: 'IL', label: 'Aurora, IL, USA' },
  'naperville': { lng: -88.1535, lat: 41.7508, state: 'IL', label: 'Naperville, IL, USA' },

  // Tennessee
  'nashville': { lng: -86.7816, lat: 36.1627, state: 'TN', label: 'Nashville, TN, USA' },
  'memphis': { lng: -90.0490, lat: 35.1495, state: 'TN', label: 'Memphis, TN, USA' },
  'knoxville': { lng: -83.9207, lat: 35.9606, state: 'TN', label: 'Knoxville, TN, USA' },
  'chattanooga': { lng: -85.3097, lat: 35.0456, state: 'TN', label: 'Chattanooga, TN, USA' },
  'murfreesboro': { lng: -86.3903, lat: 35.8456, state: 'TN', label: 'Murfreesboro, TN, USA' },
  'clarksville': { lng: -87.3595, lat: 36.5298, state: 'TN', label: 'Clarksville, TN, USA' },
  'johnson city': { lng: -82.3535, lat: 36.3134, state: 'TN', label: 'Johnson City, TN, USA' },

  // California
  'los angeles': { lng: -118.2437, lat: 34.0522, state: 'CA', label: 'Los Angeles, CA, USA' },
  'san francisco': { lng: -122.4194, lat: 37.7749, state: 'CA', label: 'San Francisco, CA, USA' },
  'san diego': { lng: -117.1611, lat: 32.7157, state: 'CA', label: 'San Diego, CA, USA' },
  'san jose': { lng: -121.8863, lat: 37.3382, state: 'CA', label: 'San Jose, CA, USA' },
  'oakland': { lng: -122.2712, lat: 37.8044, state: 'CA', label: 'Oakland, CA, USA' },
  'sacramento': { lng: -121.4944, lat: 38.5816, state: 'CA', label: 'Sacramento, CA, USA' },
  'anaheim': { lng: -117.9143, lat: 33.8366, state: 'CA', label: 'Anaheim, CA, USA' },
  'santa cruz': { lng: -122.0308, lat: 36.9741, state: 'CA', label: 'Santa Cruz, CA, USA' },
  'berkeley': { lng: -122.2730, lat: 37.8715, state: 'CA', label: 'Berkeley, CA, USA' },
  'fresno': { lng: -119.7871, lat: 36.7468, state: 'CA', label: 'Fresno, CA, USA' },
  'long beach': { lng: -118.1937, lat: 33.7701, state: 'CA', label: 'Long Beach, CA, USA' },
  'bakersfield': { lng: -119.0187, lat: 35.3733, state: 'CA', label: 'Bakersfield, CA, USA' },
  'riverside': { lng: -117.3755, lat: 33.9806, state: 'CA', label: 'Riverside, CA, USA' },
  'pomona': { lng: -117.7500, lat: 34.0551, state: 'CA', label: 'Pomona, CA, USA' },
  'santa ana': { lng: -117.8677, lat: 33.7455, state: 'CA', label: 'Santa Ana, CA, USA' },
  'santa barbara': { lng: -119.6982, lat: 34.4208, state: 'CA', label: 'Santa Barbara, CA, USA' },
  'ventura': { lng: -119.2945, lat: 34.2805, state: 'CA', label: 'Ventura, CA, USA' },

  // Texas
  'austin': { lng: -97.7431, lat: 30.2672, state: 'TX', label: 'Austin, TX, USA' },
  'dallas': { lng: -96.7970, lat: 32.7767, state: 'TX', label: 'Dallas, TX, USA' },
  'houston': { lng: -95.3698, lat: 29.7604, state: 'TX', label: 'Houston, TX, USA' },
  'san antonio': { lng: -98.4936, lat: 29.4241, state: 'TX', label: 'San Antonio, TX, USA' },
  'fort worth': { lng: -97.3308, lat: 32.7555, state: 'TX', label: 'Fort Worth, TX, USA' },
  'el paso': { lng: -106.4850, lat: 31.7619, state: 'TX', label: 'El Paso, TX, USA' },
  'arlington tx': { lng: -97.1081, lat: 32.7357, state: 'TX', label: 'Arlington, TX, USA' },
  'corpus christi': { lng: -97.3964, lat: 27.8006, state: 'TX', label: 'Corpus Christi, TX, USA' },
  'lubbock': { lng: -101.8552, lat: 33.5779, state: 'TX', label: 'Lubbock, TX, USA' },
  'denton': { lng: -97.1331, lat: 33.2148, state: 'TX', label: 'Denton, TX, USA' },
  'denison': { lng: -96.5367, lat: 33.7557, state: 'TX', label: 'Denison, TX, USA' },

  // New York
  'new york': { lng: -74.0060, lat: 40.7128, state: 'NY', label: 'New York, NY, USA' },
  'brooklyn': { lng: -73.9442, lat: 40.6782, state: 'NY', label: 'Brooklyn, NY, USA' },
  'queens': { lng: -73.7949, lat: 40.7282, state: 'NY', label: 'Queens, NY, USA' },
  'buffalo': { lng: -78.8784, lat: 42.8864, state: 'NY', label: 'Buffalo, NY, USA' },
  'rochester ny': { lng: -77.6109, lat: 43.1566, state: 'NY', label: 'Rochester, NY, USA' },
  'syracuse': { lng: -76.1474, lat: 43.0481, state: 'NY', label: 'Syracuse, NY, USA' },
  'albany ny': { lng: -73.7562, lat: 42.6526, state: 'NY', label: 'Albany, NY, USA' },
  'ithaca': { lng: -76.4966, lat: 42.4440, state: 'NY', label: 'Ithaca, NY, USA' },

  // Washington & Oregon
  'seattle': { lng: -122.3321, lat: 47.6062, state: 'WA', label: 'Seattle, WA, USA' },
  'spokane': { lng: -117.4260, lat: 47.6588, state: 'WA', label: 'Spokane, WA, USA' },
  'tacoma': { lng: -122.4443, lat: 47.2529, state: 'WA', label: 'Tacoma, WA, USA' },
  'olympia': { lng: -122.9007, lat: 47.0379, state: 'WA', label: 'Olympia, WA, USA' },
  'bellingham': { lng: -122.4787, lat: 48.7519, state: 'WA', label: 'Bellingham, WA, USA' },
  'portland': { lng: -122.6765, lat: 45.5231, state: 'OR', label: 'Portland, OR, USA' },
  'eugene': { lng: -123.0868, lat: 44.0521, state: 'OR', label: 'Eugene, OR, USA' },
  'bend': { lng: -121.3153, lat: 44.0582, state: 'OR', label: 'Bend, OR, USA' },
  'salem or': { lng: -123.0351, lat: 44.9429, state: 'OR', label: 'Salem, OR, USA' },

  // Colorado & Mountain
  'denver': { lng: -104.9903, lat: 39.7392, state: 'CO', label: 'Denver, CO, USA' },
  'colorado springs': { lng: -104.8214, lat: 38.8339, state: 'CO', label: 'Colorado Springs, CO, USA' },
  'boulder': { lng: -105.2705, lat: 40.0150, state: 'CO', label: 'Boulder, CO, USA' },
  'fort collins': { lng: -105.0844, lat: 40.5853, state: 'CO', label: 'Fort Collins, CO, USA' },
  'salt lake city': { lng: -111.8910, lat: 40.7608, state: 'UT', label: 'Salt Lake City, UT, USA' },
  'salt lake': { lng: -111.8910, lat: 40.7608, state: 'UT', label: 'Salt Lake City, UT, USA' },
  'ogden': { lng: -111.9738, lat: 41.2230, state: 'UT', label: 'Ogden, UT, USA' },
  'provo': { lng: -111.6585, lat: 40.2338, state: 'UT', label: 'Provo, UT, USA' },
  'boise': { lng: -116.2023, lat: 43.6150, state: 'ID', label: 'Boise, ID, USA' },

  // Arizona, Nevada, New Mexico
  'phoenix': { lng: -112.0740, lat: 33.4484, state: 'AZ', label: 'Phoenix, AZ, USA' },
  'tucson': { lng: -110.9747, lat: 32.2226, state: 'AZ', label: 'Tucson, AZ, USA' },
  'tempe': { lng: -111.9400, lat: 33.4255, state: 'AZ', label: 'Tempe, AZ, USA' },
  'scottsdale': { lng: -111.9261, lat: 33.4942, state: 'AZ', label: 'Scottsdale, AZ, USA' },
  'mesa': { lng: -111.8315, lat: 33.4152, state: 'AZ', label: 'Mesa, AZ, USA' },
  'flagstaff': { lng: -111.6513, lat: 35.1983, state: 'AZ', label: 'Flagstaff, AZ, USA' },
  'las vegas': { lng: -115.1398, lat: 36.1699, state: 'NV', label: 'Las Vegas, NV, USA' },
  'reno': { lng: -119.8138, lat: 39.5296, state: 'NV', label: 'Reno, NV, USA' },
  'albuquerque': { lng: -106.6504, lat: 35.0844, state: 'NM', label: 'Albuquerque, NM, USA' },
  'santa fe': { lng: -105.9378, lat: 35.6870, state: 'NM', label: 'Santa Fe, NM, USA' },

  // Midwest
  'detroit': { lng: -83.0458, lat: 42.3314, state: 'MI', label: 'Detroit, MI, USA' },
  'grand rapids': { lng: -85.6681, lat: 42.9634, state: 'MI', label: 'Grand Rapids, MI, USA' },
  'ann arbor': { lng: -83.7430, lat: 42.2808, state: 'MI', label: 'Ann Arbor, MI, USA' },
  'lansing': { lng: -84.5555, lat: 42.7325, state: 'MI', label: 'Lansing, MI, USA' },
  'kalamazoo': { lng: -85.5872, lat: 42.2917, state: 'MI', label: 'Kalamazoo, MI, USA' },
  'milwaukee': { lng: -87.9065, lat: 43.0389, state: 'WI', label: 'Milwaukee, WI, USA' },
  'madison': { lng: -89.4012, lat: 43.0731, state: 'WI', label: 'Madison, WI, USA' },
  'green bay': { lng: -88.0198, lat: 44.5192, state: 'WI', label: 'Green Bay, WI, USA' },
  'cudahy': { lng: -87.8612, lat: 42.9556, state: 'WI', label: 'Cudahy, WI, USA' },
  'minneapolis': { lng: -93.2650, lat: 44.9778, state: 'MN', label: 'Minneapolis, MN, USA' },
  'saint paul': { lng: -93.0900, lat: 44.9537, state: 'MN', label: 'Saint Paul, MN, USA' },
  'st paul': { lng: -93.0900, lat: 44.9537, state: 'MN', label: 'Saint Paul, MN, USA' },
  'duluth': { lng: -92.1005, lat: 46.7867, state: 'MN', label: 'Duluth, MN, USA' },
  'indianapolis': { lng: -86.1581, lat: 39.7684, state: 'IN', label: 'Indianapolis, IN, USA' },
  'fort wayne': { lng: -85.1394, lat: 41.0793, state: 'IN', label: 'Fort Wayne, IN, USA' },
  'bloomington in': { lng: -86.5337, lat: 39.1653, state: 'IN', label: 'Bloomington, IN, USA' },
  'cleveland': { lng: -81.6944, lat: 41.4993, state: 'OH', label: 'Cleveland, OH, USA' },
  'columbus': { lng: -82.9988, lat: 39.9612, state: 'OH', label: 'Columbus, OH, USA' },
  'cincinnati': { lng: -84.5120, lat: 39.1031, state: 'OH', label: 'Cincinnati, OH, USA' },
  'dayton': { lng: -84.1916, lat: 39.7589, state: 'OH', label: 'Dayton, OH, USA' },
  'toledo': { lng: -83.5552, lat: 41.6528, state: 'OH', label: 'Toledo, OH, USA' },
  'akron': { lng: -81.5190, lat: 41.0814, state: 'OH', label: 'Akron, OH, USA' },
  // Missouri
  'st louis': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'st. louis': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'st louis mo': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'st. louis mo': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'st. louis, mo': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'saint louis': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'saint louis mo': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'saint louis missouri': { lng: -90.1994, lat: 38.6270, state: 'MO', label: 'St. Louis, MO, USA' },
  'kansas city': { lng: -94.5786, lat: 39.0997, state: 'MO', label: 'Kansas City, MO, USA' },
  'columbia mo': { lng: -92.3341, lat: 38.9517, state: 'MO', label: 'Columbia, MO, USA' },
  'springfield mo': { lng: -93.2923, lat: 37.2090, state: 'MO', label: 'Springfield, MO, USA' },
  'des moines': { lng: -93.6091, lat: 41.5868, state: 'IA', label: 'Des Moines, IA, USA' },
  'iowa city': { lng: -91.5302, lat: 41.6611, state: 'IA', label: 'Iowa City, IA, USA' },
  'omaha': { lng: -95.9345, lat: 41.2565, state: 'NE', label: 'Omaha, NE, USA' },
  'lincoln ne': { lng: -96.7026, lat: 40.8136, state: 'NE', label: 'Lincoln, NE, USA' },

  // Mid-Atlantic & Northeast
  'philadelphia': { lng: -75.1652, lat: 39.9526, state: 'PA', label: 'Philadelphia, PA, USA' },
  'pittsburgh': { lng: -79.9959, lat: 40.4406, state: 'PA', label: 'Pittsburgh, PA, USA' },
  'allentown': { lng: -75.4902, lat: 40.6084, state: 'PA', label: 'Allentown, PA, USA' },
  'scranton': { lng: -75.6624, lat: 41.4090, state: 'PA', label: 'Scranton, PA, USA' },
  'harrisburg': { lng: -76.8867, lat: 40.2732, state: 'PA', label: 'Harrisburg, PA, USA' },
  'lancaster pa': { lng: -76.3055, lat: 40.0379, state: 'PA', label: 'Lancaster, PA, USA' },
  'boston': { lng: -71.0589, lat: 42.3601, state: 'MA', label: 'Boston, MA, USA' },
  'cambridge ma': { lng: -71.1097, lat: 42.3736, state: 'MA', label: 'Cambridge, MA, USA' },
  'worcester': { lng: -71.8023, lat: 42.2626, state: 'MA', label: 'Worcester, MA, USA' },
  'baltimore': { lng: -76.6122, lat: 39.2904, state: 'MD', label: 'Baltimore, MD, USA' },
  'washington': { lng: -77.0369, lat: 38.9072, state: 'DC', label: 'Washington, DC, USA' },
  'richmond': { lng: -77.4360, lat: 37.5407, state: 'VA', label: 'Richmond, VA, USA' },
  'norfolk': { lng: -76.2859, lat: 36.8508, state: 'VA', label: 'Norfolk, VA, USA' },
  'virginia beach': { lng: -75.9780, lat: 36.8529, state: 'VA', label: 'Virginia Beach, VA, USA' },
  'roanoke': { lng: -79.9414, lat: 37.2710, state: 'VA', label: 'Roanoke, VA, USA' },
  'charlottesville': { lng: -78.4767, lat: 38.0293, state: 'VA', label: 'Charlottesville, VA, USA' },
  'providence': { lng: -71.4128, lat: 41.8240, state: 'RI', label: 'Providence, RI, USA' },
  'hartford': { lng: -72.6734, lat: 41.7658, state: 'CT', label: 'Hartford, CT, USA' },
  'new haven': { lng: -72.9279, lat: 41.3083, state: 'CT', label: 'New Haven, CT, USA' },
  'portland me': { lng: -70.2568, lat: 43.6591, state: 'ME', label: 'Portland, ME, USA' },
  'burlington vt': { lng: -73.2121, lat: 44.4759, state: 'VT', label: 'Burlington, VT, USA' },
  'asbury park': { lng: -74.0121, lat: 40.2204, state: 'NJ', label: 'Asbury Park, NJ, USA' },
  'newark': { lng: -74.1724, lat: 40.7357, state: 'NJ', label: 'Newark, NJ, USA' },

  // Southeast & South
  'atlanta': { lng: -84.3880, lat: 33.7490, state: 'GA', label: 'Atlanta, GA, USA' },
  'athens ga': { lng: -83.3576, lat: 33.9519, state: 'GA', label: 'Athens, GA, USA' },
  'savannah': { lng: -81.0998, lat: 32.0809, state: 'GA', label: 'Savannah, GA, USA' },
  'charlotte': { lng: -80.8431, lat: 35.2271, state: 'NC', label: 'Charlotte, NC, USA' },
  'raleigh': { lng: -78.6382, lat: 35.7796, state: 'NC', label: 'Raleigh, NC, USA' },
  'asheville': { lng: -82.5515, lat: 35.5951, state: 'NC', label: 'Asheville, NC, USA' },
  'greensboro': { lng: -79.7920, lat: 36.0726, state: 'NC', label: 'Greensboro, NC, USA' },
  'durham nc': { lng: -78.8986, lat: 35.9940, state: 'NC', label: 'Durham, NC, USA' },
  'wilmington nc': { lng: -77.9447, lat: 34.2257, state: 'NC', label: 'Wilmington, NC, USA' },
  'charleston sc': { lng: -79.9311, lat: 32.7765, state: 'SC', label: 'Charleston, SC, USA' },
  'columbia sc': { lng: -81.0348, lat: 34.0007, state: 'SC', label: 'Columbia, SC, USA' },
  'greenville sc': { lng: -82.3940, lat: 34.8526, state: 'SC', label: 'Greenville, SC, USA' },
  'tampa': { lng: -82.4572, lat: 27.9506, state: 'FL', label: 'Tampa, FL, USA' },
  'orlando': { lng: -81.3792, lat: 28.5383, state: 'FL', label: 'Orlando, FL, USA' },
  'miami': { lng: -80.1918, lat: 25.7617, state: 'FL', label: 'Miami, FL, USA' },
  'jacksonville': { lng: -81.6557, lat: 30.3322, state: 'FL', label: 'Jacksonville, FL, USA' },
  'fort lauderdale': { lng: -80.1373, lat: 26.1224, state: 'FL', label: 'Fort Lauderdale, FL, USA' },
  'st petersburg': { lng: -82.6403, lat: 27.7676, state: 'FL', label: 'St. Petersburg, FL, USA' },
  'gainesville': { lng: -82.3248, lat: 29.6516, state: 'FL', label: 'Gainesville, FL, USA' },
  'tallahassee': { lng: -84.2807, lat: 30.4383, state: 'FL', label: 'Tallahassee, FL, USA' },
  'pensacola': { lng: -87.2169, lat: 30.4213, state: 'FL', label: 'Pensacola, FL, USA' },
  'birmingham al': { lng: -86.8104, lat: 33.5186, state: 'AL', label: 'Birmingham, AL, USA' },
  'huntsville': { lng: -86.5861, lat: 34.7304, state: 'AL', label: 'Huntsville, AL, USA' },
  'mobile al': { lng: -88.0399, lat: 30.6954, state: 'AL', label: 'Mobile, AL, USA' },
  'new orleans': { lng: -90.0715, lat: 29.9511, state: 'LA', label: 'New Orleans, LA, USA' },
  'baton rouge': { lng: -91.1871, lat: 30.4515, state: 'LA', label: 'Baton Rouge, LA, USA' },
  'shreveport': { lng: -93.7502, lat: 32.5252, state: 'LA', label: 'Shreveport, LA, USA' },
  'louisville': { lng: -85.7585, lat: 38.2527, state: 'KY', label: 'Louisville, KY, USA' },
  'lexington ky': { lng: -84.5037, lat: 38.0406, state: 'KY', label: 'Lexington, KY, USA' },
  'little rock': { lng: -92.2896, lat: 34.7465, state: 'AR', label: 'Little Rock, AR, USA' },
  'fayetteville ar': { lng: -94.1574, lat: 36.0822, state: 'AR', label: 'Fayetteville, AR, USA' },
  'oklahoma city': { lng: -97.5164, lat: 35.4676, state: 'OK', label: 'Oklahoma City, OK, USA' },
  'tulsa': { lng: -95.9928, lat: 36.1540, state: 'OK', label: 'Tulsa, OK, USA' },

  // Canada & International
  'toronto': { lng: -79.3832, lat: 43.6532, state: 'ON', label: 'Toronto, ON, CA' },
  'montreal': { lng: -73.5673, lat: 45.5017, state: 'QC', label: 'Montreal, QC, CA' },
  'vancouver': { lng: -123.1207, lat: 49.2827, state: 'BC', label: 'Vancouver, BC, CA' },
  'calgary': { lng: -114.0719, lat: 51.0447, state: 'AB', label: 'Calgary, AB, CA' },
  'ottawa': { lng: -75.6972, lat: 45.4215, state: 'ON', label: 'Ottawa, ON, CA' },
  'edmonton': { lng: -113.4938, lat: 53.5461, state: 'AB', label: 'Edmonton, AB, CA' },
  'quebec city': { lng: -71.2080, lat: 46.8139, state: 'QC', label: 'Quebec City, QC, CA' },
  'london uk': { lng: -0.1278, lat: 51.5074, state: 'UK', label: 'London, UK' },
  'paris': { lng: 2.3522, lat: 48.8566, state: 'FR', label: 'Paris, FR' },
  'berlin': { lng: 13.4050, lat: 52.5200, state: 'DE', label: 'Berlin, DE' },
  'amsterdam': { lng: 4.8952, lat: 52.3702, state: 'NL', label: 'Amsterdam, NL' },
  'tokyo': { lng: 139.6503, lat: 35.6762, state: 'JP', label: 'Tokyo, JP' },
  'sydney': { lng: 151.2093, lat: -33.8688, state: 'AU', label: 'Sydney, AU' },
  'melbourne': { lng: 144.9631, lat: -37.8136, state: 'AU', label: 'Melbourne, AU' },
  'mexico city': { lng: -99.1332, lat: 19.4326, state: 'MX', label: 'Mexico City, MX' },
  'rio': { lng: -43.1729, lat: -22.9068, state: 'BR', label: 'Rio de Janeiro, BR' }
};

// 2. All 50 US State Centers & Full Names
export const US_STATES_DATABASE: Record<string, { lng: number; lat: number; name: string }> = {
  'AL': { lng: -86.9023, lat: 32.8067, name: 'Alabama' },
  'AK': { lng: -152.4044, lat: 61.3707, name: 'Alaska' },
  'AZ': { lng: -111.4312, lat: 33.7298, name: 'Arizona' },
  'AR': { lng: -92.3731, lat: 34.9697, name: 'Arkansas' },
  'CA': { lng: -119.4179, lat: 36.7783, name: 'California' },
  'CO': { lng: -105.7821, lat: 39.5501, name: 'Colorado' },
  'CT': { lng: -72.7554, lat: 41.6032, name: 'Connecticut' },
  'DE': { lng: -75.5277, lat: 38.9108, name: 'Delaware' },
  'FL': { lng: -81.5158, lat: 27.6648, name: 'Florida' },
  'GA': { lng: -82.9001, lat: 32.1656, name: 'Georgia' },
  'HI': { lng: -157.8583, lat: 21.3069, name: 'Hawaii' },
  'ID': { lng: -114.7420, lat: 44.0682, name: 'Idaho' },
  'IL': { lng: -89.3985, lat: 40.6331, name: 'Illinois' },
  'IN': { lng: -86.1349, lat: 40.2672, name: 'Indiana' },
  'IA': { lng: -93.0977, lat: 41.8780, name: 'Iowa' },
  'KS': { lng: -98.4842, lat: 39.0119, name: 'Kansas' },
  'KY': { lng: -84.2700, lat: 37.8393, name: 'Kentucky' },
  'LA': { lng: -91.9623, lat: 30.9843, name: 'Louisiana' },
  'ME': { lng: -69.4455, lat: 45.2538, name: 'Maine' },
  'MD': { lng: -76.6413, lat: 39.0458, name: 'Maryland' },
  'MA': { lng: -71.3824, lat: 42.4072, name: 'Massachusetts' },
  'MI': { lng: -85.6024, lat: 44.3148, name: 'Michigan' },
  'MN': { lng: -94.6859, lat: 46.7296, name: 'Minnesota' },
  'MS': { lng: -89.3985, lat: 32.3547, name: 'Mississippi' },
  'MO': { lng: -91.8318, lat: 37.9643, name: 'Missouri' },
  'MT': { lng: -110.3626, lat: 46.8797, name: 'Montana' },
  'NE': { lng: -99.9018, lat: 41.4925, name: 'Nebraska' },
  'NV': { lng: -116.4194, lat: 38.8026, name: 'Nevada' },
  'NH': { lng: -71.5724, lat: 43.1939, name: 'New Hampshire' },
  'NJ': { lng: -74.4057, lat: 40.0583, name: 'New Jersey' },
  'NM': { lng: -105.8701, lat: 34.5199, name: 'New Mexico' },
  'NY': { lng: -74.0060, lat: 40.7128, name: 'New York' },
  'NC': { lng: -79.0193, lat: 35.7596, name: 'North Carolina' },
  'ND': { lng: -101.0020, lat: 47.5515, name: 'North Dakota' },
  'OH': { lng: -82.9071, lat: 40.4173, name: 'Ohio' },
  'OK': { lng: -97.5164, lat: 35.0078, name: 'Oklahoma' },
  'OR': { lng: -120.5542, lat: 43.8041, name: 'Oregon' },
  'PA': { lng: -77.1945, lat: 41.2033, name: 'Pennsylvania' },
  'RI': { lng: -71.4774, lat: 41.5801, name: 'Rhode Island' },
  'SC': { lng: -81.1637, lat: 33.8361, name: 'South Carolina' },
  'SD': { lng: -99.9018, lat: 43.9695, name: 'South Dakota' },
  'TN': { lng: -86.5804, lat: 35.5175, name: 'Tennessee' },
  'TX': { lng: -99.9018, lat: 31.9686, name: 'Texas' },
  'UT': { lng: -111.0937, lat: 39.3210, name: 'Utah' },
  'VT': { lng: -72.5778, lat: 44.5588, name: 'Vermont' },
  'VA': { lng: -78.6569, lat: 37.4316, name: 'Virginia' },
  'WA': { lng: -120.7401, lat: 47.7511, name: 'Washington' },
  'WV': { lng: -80.4549, lat: 38.5976, name: 'West Virginia' },
  'WI': { lng: -89.6165, lat: 43.7844, name: 'Wisconsin' },
  'WY': { lng: -107.2903, lat: 43.0760, name: 'Wyoming' },
  'DC': { lng: -77.0369, lat: 38.9072, name: 'District of Columbia' }
};

// Helper: Escape string for safe RegExp
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Generative deterministic procedural coordinate fallback (US bounded)
export function getProceduralLatLng(str: string): { lng: number; lat: number } {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generates lng between -120 and -75
  const l = -120 + (Math.abs(hash) % 45);
  // Generates lat between 28 and 48
  const t = 28 + (Math.abs(hash >> 3) % 20);
  return { lng: l, lat: t };
}

/**
 * Robust Geolocation Matcher:
 * Resolves venue/stop to exact Geo coordinates with strict token/word-boundary matching.
 * Will NEVER match substring state codes inside words (e.g. 'LA' in 'slaughter' or 'IL' in 'Nashville').
 */
export function resolveLocationCoordinates(params: {
  city?: string;
  state?: string;
  country?: string;
  venueName?: string;
  festivalName?: string;
  venueLat?: number;
  venueLng?: number;
  fallbackKey?: string;
  stopIndex?: number;
}): { lng: number; lat: number; label: string } {
  const { city, state, country, venueName, festivalName, venueLat, venueLng, fallbackKey, stopIndex = 0 } = params;

  // 1. Direct Coordinates if provided and non-zero
  if (typeof venueLat === 'number' && typeof venueLng === 'number' && venueLat !== 0 && venueLng !== 0) {
    return applyMicroJitter({ lng: venueLng, lat: venueLat, label: venueName || city || 'Custom' }, stopIndex);
  }

  const cleanCity = (city || '').trim().toLowerCase();
  const normalizedCity = cleanCity.replace(/\./g, ' ').replace(/\s+/g, ' ').trim();
  const cleanState = (state || '').trim();
  const cleanStateUpper = cleanState.toUpperCase();
  const cleanStateLower = cleanState.toLowerCase();

  // 2. Exact or Word-Boundary City Matching (Highest Priority)
  if (cleanCity) {
    // Exact match in CITIES_DATABASE
    if (CITIES_DATABASE[cleanCity]) {
      const match = CITIES_DATABASE[cleanCity];
      return applyMicroJitter({ lng: match.lng, lat: match.lat, label: match.label }, stopIndex);
    }

    if (normalizedCity && CITIES_DATABASE[normalizedCity]) {
      const match = CITIES_DATABASE[normalizedCity];
      return applyMicroJitter({ lng: match.lng, lat: match.lat, label: match.label }, stopIndex);
    }

    // Try token match: e.g. "Joliet, IL" -> "joliet"
    const cityTokens = cleanCity.split(/[,/\-_]/).map(t => t.replace(/\./g, '').trim().toLowerCase());
    for (const token of cityTokens) {
      if (token && CITIES_DATABASE[token]) {
        const match = CITIES_DATABASE[token];
        return applyMicroJitter({ lng: match.lng, lat: match.lat, label: match.label }, stopIndex);
      }
    }

    // Try finding city key with word boundaries in cleanCity or normalizedCity
    for (const [key, match] of Object.entries(CITIES_DATABASE)) {
      const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'i');
      if (regex.test(cleanCity) || regex.test(normalizedCity)) {
        return applyMicroJitter({ lng: match.lng, lat: match.lat, label: match.label }, stopIndex);
      }
    }
  }

  // 3. Search across Venue Name / Festival Name with Word Boundaries
  const combinedNames = [venueName, festivalName].filter(Boolean).join(' ');
  if (combinedNames) {
    // Sort keys by length descending to match full city names first
    const sortedCityKeys = Object.keys(CITIES_DATABASE).sort((a, b) => b.length - a.length);
    for (const key of sortedCityKeys) {
      // Must match whole word: e.g. \bNashville\b, \bJoliet\b, \bChicago\b
      const regex = new RegExp(`\\b${escapeRegex(key)}\\b`, 'i');
      if (regex.test(combinedNames)) {
        const match = CITIES_DATABASE[key];
        return applyMicroJitter({ lng: match.lng, lat: match.lat, label: match.label }, stopIndex);
      }
    }
  }

  // 4. State Level Matching using State Code or Full State Name (with strict word boundaries)
  if (cleanState) {
    // Check 2-letter state code directly
    if (US_STATES_DATABASE[cleanStateUpper]) {
      const stateMatch = US_STATES_DATABASE[cleanStateUpper];
      return applyMicroJitter({ lng: stateMatch.lng, lat: stateMatch.lat, label: `${stateMatch.name}, USA` }, stopIndex);
    }

    // Check full state name
    for (const [code, stateMatch] of Object.entries(US_STATES_DATABASE)) {
      if (stateMatch.name.toLowerCase() === cleanStateLower) {
        return applyMicroJitter({ lng: stateMatch.lng, lat: stateMatch.lat, label: `${stateMatch.name}, USA` }, stopIndex);
      }
    }
  }

  // Check state tokens in combined text with word boundary
  const fullText = [venueName, festivalName, city, state, country].filter(Boolean).join(' ');
  for (const [code, stateMatch] of Object.entries(US_STATES_DATABASE)) {
    const codeRegex = new RegExp(`\\b${code}\\b`, 'i');
    const nameRegex = new RegExp(`\\b${escapeRegex(stateMatch.name)}\\b`, 'i');
    if (nameRegex.test(fullText) || codeRegex.test(fullText)) {
      return applyMicroJitter({ lng: stateMatch.lng, lat: stateMatch.lat, label: `${stateMatch.name}, USA` }, stopIndex);
    }
  }

  // 5. Look for any raw coordinates in double format e.g. "41.52,-88.08"
  const rawCoordMatch = fullText.match(/(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)/);
  if (rawCoordMatch) {
    const parsedLat = parseFloat(rawCoordMatch[1]);
    const parsedLng = parseFloat(rawCoordMatch[2]);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      return applyMicroJitter({ lng: parsedLng, lat: parsedLat, label: city || 'Custom Coordinates' }, stopIndex);
    }
  }

  // 6. Procedural Deterministic Coordinates as safe fallback
  const procedural = getProceduralLatLng(fallbackKey || city || venueName || 'Location');
  return applyMicroJitter({ lng: procedural.lng, lat: procedural.lat, label: city || 'Procedural Location' }, stopIndex);
}

/**
 * Micro-jitter helper:
 * If multiple shows/stops share identical coordinates (e.g. 2-day festival in Joliet),
 * offset by a tiny radial angle (~150-250m) so both markers remain visible and individually selectable.
 */
function applyMicroJitter(
  geo: { lng: number; lat: number; label: string },
  stopIndex: number
): { lng: number; lat: number; label: string } {
  if (!stopIndex || stopIndex === 0) return geo;
  // Offset radius ~0.0025 degrees (~200 meters)
  const angle = (stopIndex * 137.5 * Math.PI) / 180; // Golden angle distribution
  const radius = 0.0028 * Math.min(stopIndex, 4);
  return {
    lng: geo.lng + Math.cos(angle) * radius,
    lat: geo.lat + Math.sin(angle) * radius * 0.75, // Adjust for latitude distortion
    label: geo.label
  };
}
