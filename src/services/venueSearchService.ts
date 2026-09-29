import { venuesStore } from '../utils/indexedDB';
import { getApiEndpoint, getApiFallbackEndpoints } from '../utils/apiConfig';

export interface VenueResult {
  id: string;
  name: string;
  city?: string;
  state?: string;
  country?: string;
  streetAddress?: string;
  fullAddress?: string;
  capacity?: number | string;
  payoutRating?: number;
  loadInRating?: number;
  genreFit?: number;
  source: 'blackbook' | 'google-places';
  displayText: string;
  placeId?: string;
  lat?: number;
  lng?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  parkingNotes?: string;
  notes?: string;
  stageSpecs?: string;
  tags?: string[];
}

// Built-in curated Black Book venue directory (curated underground & premier music venues)
export const BUILT_IN_BLACK_BOOK_VENUES: VenueResult[] = [
  // NASHVILLE, TN
  {
    id: 'bb_v_nash_1',
    name: 'Exit/In',
    city: 'Nashville',
    state: 'TN',
    country: 'USA',
    streetAddress: '2208 Elliston Pl',
    fullAddress: '2208 Elliston Pl, Nashville, TN 37203',
    capacity: 500,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Exit/In • Nashville, TN (Cap: 500)',
    contactName: 'Chris Cobb (Production & Booking)',
    contactPhone: '(615) 321-3340',
    contactEmail: 'booking@exitin.com',
    parkingNotes: 'Bus/Van parking in dedicated alley spot behind venue. Load-in directly onto stage left via rear ramp.'
  },
  {
    id: 'bb_v_nash_2',
    name: 'The End',
    city: 'Nashville',
    state: 'TN',
    country: 'USA',
    streetAddress: '2219 Elliston Pl',
    fullAddress: '2219 Elliston Pl, Nashville, TN 37203',
    capacity: 200,
    payoutRating: 4.7,
    loadInRating: 4.0,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'The End • Nashville, TN (Cap: 200)',
    contactName: 'Bruce Fitzpatrick (Head Booker)',
    contactPhone: '(615) 321-4451',
    contactEmail: 'theendbooking@gmail.com',
    parkingNotes: 'Underground staple! Street parking or rear lot. Load-in through front/side double doors.'
  },
  {
    id: 'bb_v_nash_3',
    name: 'The Basement East',
    city: 'Nashville',
    state: 'TN',
    country: 'USA',
    streetAddress: '917 Woodland St',
    fullAddress: '917 Woodland St, Nashville, TN 37206',
    capacity: 600,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'The Basement East • Nashville, TN (Cap: 600)',
    contactName: 'Mike Grimes / Production Desk',
    contactPhone: '(615) 645-9174',
    contactEmail: 'production@thebasementnashville.com',
    parkingNotes: 'Dedicated gated rear tour bus & trailer parking with 50A shore power.'
  },
  {
    id: 'bb_v_nash_4',
    name: 'The Cobra Nashville',
    city: 'Nashville',
    state: 'TN',
    country: 'USA',
    streetAddress: '2511 Gallatin Pike',
    fullAddress: '2511 Gallatin Pike, Nashville, TN 37206',
    capacity: 300,
    payoutRating: 4.6,
    loadInRating: 4.3,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'The Cobra • Nashville, TN (Cap: 300)',
    contactName: 'Dave Strawn',
    contactPhone: '(615) 678-4333',
    contactEmail: 'cobranashville@gmail.com',
    parkingNotes: 'Rear parking lot fits van + 14ft trailer easily. Great heavy metal/punk room.'
  },
  {
    id: 'bb_v_nash_5',
    name: 'Brooklyn Bowl Nashville',
    city: 'Nashville',
    state: 'TN',
    country: 'USA',
    streetAddress: '925 3rd Ave N',
    fullAddress: '925 3rd Ave N, Nashville, TN 37201',
    capacity: 1200,
    payoutRating: 5.0,
    loadInRating: 5.0,
    genreFit: 88,
    source: 'blackbook',
    displayText: 'Brooklyn Bowl • Nashville, TN (Cap: 1200)',
    contactName: 'Dan Parise (Production Manager)',
    contactPhone: '(615) 622-2695',
    contactEmail: 'nashvilleproduction@brooklynbowl.com',
    parkingNotes: 'Full loading dock and bus parking pad with dual shore power drops.'
  },
  {
    id: 'bb_v_nash_6',
    name: 'Drkmttr Collective',
    city: 'Nashville',
    state: 'TN',
    country: 'USA',
    streetAddress: '1111 Dickerson Pike',
    fullAddress: '1111 Dickerson Pike, Nashville, TN 37207',
    capacity: 150,
    payoutRating: 4.8,
    loadInRating: 4.2,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Drkmttr Collective • Nashville, TN (Cap: 150)',
    contactName: 'Kathryn Edwards (DIY Booking Team)',
    contactPhone: '(615) 555-3756',
    contactEmail: 'drkmttrcollective@gmail.com',
    parkingNotes: 'All-ages DIY haven for extreme metal, hardcore and grind. Private lot in front.'
  },

  // JOLIET & CHICAGO, IL
  {
    id: 'bb_v_joliet_1',
    name: 'The Forge',
    city: 'Joliet',
    state: 'IL',
    country: 'USA',
    streetAddress: '22 W Cass St',
    fullAddress: '22 W Cass St, Joliet, IL 60432',
    capacity: 1000,
    payoutRating: 4.9,
    loadInRating: 4.7,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Forge • Joliet, IL (Cap: 1000)',
    contactName: 'FM Entertainment / Production Office',
    contactPhone: '(815) 280-5241',
    contactEmail: 'theforgebooking@gmail.com',
    parkingNotes: 'Home of Shamrock Slaughter Fest & major metal tours. Rear alley load-in ramp with bus shore power.'
  },
  {
    id: 'bb_v_chic_1',
    name: 'Reggies Rock Club',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '2105 S State St',
    fullAddress: '2105 S State St, Chicago, IL 60616',
    capacity: 400,
    payoutRating: 4.9,
    loadInRating: 4.5,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'Reggies Rock Club • Chicago, IL (Cap: 400)',
    contactName: 'Robby Glick / PM Desk',
    contactPhone: '(312) 949-0120',
    contactEmail: 'booking@reggieslive.com',
    parkingNotes: 'Tour bus parking in side lot with 50A power. Excellent hospitality and rooftop bar.'
  },
  {
    id: 'bb_v_chic_2',
    name: 'Cobra Lounge',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '235 N Ashland Ave',
    fullAddress: '235 N Ashland Ave, Chicago, IL 60607',
    capacity: 300,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Cobra Lounge • Chicago, IL (Cap: 300)',
    contactName: 'Sean McKee / Production',
    contactPhone: '(312) 226-6300',
    contactEmail: 'booking@cobralounge.com',
    parkingNotes: 'Street and side loading. Direct stage access.'
  },
  {
    id: 'bb_v_chic_3',
    name: 'Subterranean',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '2011 W North Ave',
    fullAddress: '2011 W North Ave, Chicago, IL 60647',
    capacity: 400,
    payoutRating: 4.6,
    loadInRating: 3.5,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'Subterranean • Chicago, IL (Cap: 400)',
    contactName: 'Robert Gomez',
    contactPhone: '(773) 278-6600',
    contactEmail: 'booking@subt.net',
    parkingNotes: 'Wicker Park corner. Load-in through North Ave front doors.'
  },
  {
    id: 'bb_v_chic_4',
    name: 'Metro Chicago',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '3730 N Clark St',
    fullAddress: '3730 N Clark St, Chicago, IL 60613',
    capacity: 1100,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'Metro Chicago • Chicago, IL (Cap: 1100)',
    contactName: 'Joe Shanahan / Production PM',
    contactPhone: '(773) 549-0205',
    contactEmail: 'production@metrochicago.com',
    parkingNotes: 'Bus lane on Clark St with city permits provided. Hydraulic lift load-in.'
  },
  {
    id: 'bb_v_chic_5',
    name: 'Bottom Lounge',
    city: 'Chicago',
    state: 'IL',
    country: 'USA',
    streetAddress: '1375 W Lake St',
    fullAddress: '1375 W Lake St, Chicago, IL 60607',
    capacity: 700,
    payoutRating: 4.9,
    loadInRating: 4.8,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'Bottom Lounge • Chicago, IL (Cap: 700)',
    contactName: 'Chris Brueck / PM',
    contactPhone: '(312) 666-6775',
    contactEmail: 'booking@bottomlounge.com',
    parkingNotes: 'Private parking lot for 2 tour buses + trailer. Ground floor load-in.'
  },

  // DENVER & COLORADO
  {
    id: 'bb_v_denv_1',
    name: 'The Roxy Theatre',
    city: 'Denver',
    state: 'CO',
    country: 'USA',
    streetAddress: '2549 Welton St',
    fullAddress: '2549 Welton St, Denver, CO 80205',
    capacity: 500,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'The Roxy Theatre • Denver, CO (Cap: 500)',
    contactName: 'James Rossi (Owner / Talent Buyer)',
    contactPhone: '(720) 242-9797',
    contactEmail: 'theroxy@theroxydenver.com',
    parkingNotes: 'Gated parking in rear alley for tour vehicles. Quick stage right load-in.'
  },
  {
    id: 'bb_v_denv_2',
    name: 'HQ Denver',
    city: 'Denver',
    state: 'CO',
    country: 'USA',
    streetAddress: '60 S Broadway',
    fullAddress: '60 S Broadway, Denver, CO 80209',
    capacity: 300,
    payoutRating: 4.7,
    loadInRating: 4.3,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'HQ Denver • Denver, CO (Cap: 300)',
    contactName: 'Geoff Brent / Booking',
    contactPhone: '(303) 777-2800',
    contactEmail: 'booking@hqdenver.com',
    parkingNotes: 'Broadway & 1st Ave. Private rear load-in door.'
  },
  {
    id: 'bb_v_denv_3',
    name: 'Marquis Theater',
    city: 'Denver',
    state: 'CO',
    country: 'USA',
    streetAddress: '2009 Larimer St',
    fullAddress: '2009 Larimer St, Denver, CO 80205',
    capacity: 450,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Marquis Theater • Denver, CO (Cap: 450)',
    contactName: 'Live Nation Rocky Mtn / PM',
    contactPhone: '(303) 487-0111',
    contactEmail: 'marquisproduction@livenation.com',
    parkingNotes: 'Reserved parking spot in front on Larimer St. Pizza kitchen in lobby.'
  },
  {
    id: 'bb_v_denv_4',
    name: 'Summit Music Hall',
    city: 'Denver',
    state: 'CO',
    country: 'USA',
    streetAddress: '1902 Blake St',
    fullAddress: '1902 Blake St, Denver, CO 80202',
    capacity: 1100,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 93,
    source: 'blackbook',
    displayText: 'Summit Music Hall • Denver, CO (Cap: 1100)',
    contactName: 'Dave Pendergast (PM)',
    contactPhone: '(303) 487-0111',
    contactEmail: 'summitproduction@livenation.com',
    parkingNotes: 'Dedicated bus bay in rear alley with 50A power drop.'
  },
  {
    id: 'bb_v_denv_5',
    name: 'The Black Sheep',
    city: 'Colorado Springs',
    state: 'CO',
    country: 'USA',
    streetAddress: '2106 E Platte Ave',
    fullAddress: '2106 E Platte Ave, Colorado Springs, CO 80909',
    capacity: 450,
    payoutRating: 4.7,
    loadInRating: 4.6,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'The Black Sheep • Colorado Springs, CO (Cap: 450)',
    contactName: 'Kevin Willis',
    contactPhone: '(719) 227-8010',
    contactEmail: 'booking@blacksheeprocks.com',
    parkingNotes: 'Massive private parking lot with plenty of room for buses, vans and trailers.'
  },

  // TEXAS (Austin, Dallas, Houston, San Antonio, Denton)
  {
    id: 'bb_v_aust_1',
    name: 'Mohawk Austin',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    streetAddress: '912 Red River St',
    fullAddress: '912 Red River St, Austin, TX 78701',
    capacity: 900,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Mohawk Austin • Austin, TX (Cap: 900)',
    contactName: 'James Moody / Margin Walker',
    contactPhone: '(512) 666-0877',
    contactEmail: 'production@mohawkaustin.com',
    parkingNotes: 'Red River cultural district. Bus parking permit provided along 10th St.'
  },
  {
    id: 'bb_v_aust_2',
    name: 'Come and Take It Live',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    streetAddress: '2015 E Riverside Dr',
    fullAddress: '2015 E Riverside Dr, Austin, TX 78741',
    capacity: 800,
    payoutRating: 4.8,
    loadInRating: 4.7,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Come and Take It Live • Austin, TX (Cap: 800)',
    contactName: 'Brandon Hunt (Owner / Booker)',
    contactPhone: '(512) 448-9488',
    contactEmail: 'booking@comeandtakeitproductions.com',
    parkingNotes: 'Dedicated tour bus and van parking lot. Ground level double-door stage load-in.'
  },
  {
    id: 'bb_v_aust_3',
    name: 'The Lost Well',
    city: 'Austin',
    state: 'TX',
    country: 'USA',
    streetAddress: '2421 Webberville Rd',
    fullAddress: '2421 Webberville Rd, Austin, TX 78702',
    capacity: 250,
    payoutRating: 4.7,
    loadInRating: 4.4,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Lost Well • Austin, TX (Cap: 250)',
    contactName: 'Marc Colombo',
    contactPhone: '(512) 524-0590',
    contactEmail: 'thelostwellaustin@gmail.com',
    parkingNotes: 'Austin premier heavy metal dive bar & underground live room. Private front lot.'
  },
  {
    id: 'bb_v_dal_1',
    name: 'Trees Dallas',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    streetAddress: '2709 Elm St',
    fullAddress: '2709 Elm St, Dallas, TX 75226',
    capacity: 600,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'Trees Dallas • Dallas, TX (Cap: 600)',
    contactName: 'Clint Barlow / Production',
    contactPhone: '(214) 741-1122',
    contactEmail: 'treesbooking@treesdallas.com',
    parkingNotes: 'Deep Ellum central. Side alley load-in.'
  },
  {
    id: 'bb_v_dal_2',
    name: 'Three Links Deep Ellum',
    city: 'Dallas',
    state: 'TX',
    country: 'USA',
    streetAddress: '2704 Elm St',
    fullAddress: '2704 Elm St, Dallas, TX 75226',
    capacity: 200,
    payoutRating: 4.7,
    loadInRating: 4.2,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Three Links • Dallas, TX (Cap: 200)',
    contactName: 'Oliver Peck / Scott Beggs',
    contactPhone: '(214) 484-6011',
    contactEmail: 'threelinksbooking@gmail.com',
    parkingNotes: 'Punk & extreme metal haven directly across from Trees.'
  },
  {
    id: 'bb_v_dal_3',
    name: 'Rubber Gloves Rehearsal Studios',
    city: 'Denton',
    state: 'TX',
    country: 'USA',
    streetAddress: '411 E Sycamore St',
    fullAddress: '411 E Sycamore St, Denton, TX 76205',
    capacity: 400,
    payoutRating: 4.8,
    loadInRating: 4.6,
    genreFit: 97,
    source: 'blackbook',
    displayText: 'Rubber Gloves • Denton, TX (Cap: 400)',
    contactName: 'Chad Withers',
    contactPhone: '(940) 387-7781',
    contactEmail: 'booking@rubberglovesdenton.com',
    parkingNotes: 'Spacious compound lot with full backline rehearsal bays and stage.'
  },
  {
    id: 'bb_v_hou_1',
    name: 'White Oak Music Hall',
    city: 'Houston',
    state: 'TX',
    country: 'USA',
    streetAddress: '2915 N Main St',
    fullAddress: '2915 N Main St, Houston, TX 77009',
    capacity: 1200,
    payoutRating: 5.0,
    loadInRating: 5.0,
    genreFit: 93,
    source: 'blackbook',
    displayText: 'White Oak Music Hall • Houston, TX (Cap: 1200)',
    contactName: 'Will Ahern (PM)',
    contactPhone: '(713) 237-0370',
    contactEmail: 'production@whiteoakmusichall.com',
    parkingNotes: 'Full touring compound with dedicated bus parking and green rooms.'
  },
  {
    id: 'bb_v_sa_1',
    name: 'Paper Tiger',
    city: 'San Antonio',
    state: 'TX',
    country: 'USA',
    streetAddress: '2410 N St Marys St',
    fullAddress: '2410 N St Marys St, San Antonio, TX 78212',
    capacity: 1000,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Paper Tiger • San Antonio, TX (Cap: 1000)',
    contactName: 'Ryan Soroka (Booking Desk)',
    contactPhone: '(210) 844-0404',
    contactEmail: 'booking@papertigersatx.com',
    parkingNotes: 'The Strip on St. Marys. Rear bus parking alley.'
  },

  // CALIFORNIA (LA, Anaheim, San Diego, SF, Berkeley)
  {
    id: 'bb_v_la_1',
    name: 'The Belasco Theater',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    streetAddress: '1050 S Hill St',
    fullAddress: '1050 S Hill St, Los Angeles, CA 90015',
    capacity: 1500,
    payoutRating: 4.9,
    loadInRating: 4.8,
    genreFit: 93,
    source: 'blackbook',
    displayText: 'The Belasco • Los Angeles, CA (Cap: 1500)',
    contactName: 'Marcus Vance (Production PM)',
    contactPhone: '(213) 555-0182',
    contactEmail: 'production@thebelasco.com',
    parkingNotes: 'Bus/Van parking in rear alley off Hill St. 2x 30A Shore Power drops confirmed.'
  },
  {
    id: 'bb_v_la_2',
    name: '1720',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    streetAddress: '1720 E 16th St',
    fullAddress: '1720 E 16th St, Los Angeles, CA 90021',
    capacity: 800,
    payoutRating: 4.8,
    loadInRating: 4.7,
    genreFit: 98,
    source: 'blackbook',
    displayText: '1720 • Los Angeles, CA (Cap: 800)',
    contactName: 'Alex Bauman / Production',
    contactPhone: '(213) 745-6677',
    contactEmail: 'production@1720.la',
    parkingNotes: 'Gated parking in warehouse district with stage-level roll up door.'
  },
  {
    id: 'bb_v_la_3',
    name: 'The Echo',
    city: 'Los Angeles',
    state: 'CA',
    country: 'USA',
    streetAddress: '1822 Sunset Blvd',
    fullAddress: '1822 Sunset Blvd, Los Angeles, CA 90026',
    capacity: 350,
    payoutRating: 4.8,
    loadInRating: 3.5,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'The Echo • Los Angeles, CA (Cap: 350)'
  },
  {
    id: 'bb_v_la_4',
    name: 'Chain Reaction',
    city: 'Anaheim',
    state: 'CA',
    country: 'USA',
    streetAddress: '1652 W Lincoln Ave',
    fullAddress: '1652 W Lincoln Ave, Anaheim, CA 92801',
    capacity: 250,
    payoutRating: 4.5,
    loadInRating: 4.0,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'Chain Reaction • Anaheim, CA (Cap: 250)'
  },
  {
    id: 'bb_v_sd_1',
    name: 'Brick by Brick',
    city: 'San Diego',
    state: 'CA',
    country: 'USA',
    streetAddress: '1130 Buenos Ave',
    fullAddress: '1130 Buenos Ave, San Diego, CA 92110',
    capacity: 400,
    payoutRating: 4.8,
    loadInRating: 4.6,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Brick by Brick • San Diego, CA (Cap: 400)',
    contactName: 'Max Frank (Talent Buyer)',
    contactPhone: '(619) 276-3990',
    contactEmail: 'booking@brickbybrick.com',
    parkingNotes: 'San Diegos premier heavy metal nightclub. Private side lot with van/bus parking.'
  },
  {
    id: 'bb_v_sf_1',
    name: 'DNA Lounge',
    city: 'San Francisco',
    state: 'CA',
    country: 'USA',
    streetAddress: '375 11th St',
    fullAddress: '375 11th St, San Francisco, CA 94103',
    capacity: 800,
    payoutRating: 4.9,
    loadInRating: 4.4,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'DNA Lounge • San Francisco, CA (Cap: 800)',
    contactName: 'JWZ / Production Desk',
    contactPhone: '(415) 626-1409',
    contactEmail: 'booking@dnalounge.com',
    parkingNotes: '11th & Harrison. 24-hour pizza joint attached with all-ages licensing.'
  },
  {
    id: 'bb_v_sf_2',
    name: '924 Gilman',
    city: 'Berkeley',
    state: 'CA',
    country: 'USA',
    streetAddress: '924 Gilman St',
    fullAddress: '924 Gilman St, Berkeley, CA 94710',
    capacity: 300,
    payoutRating: 4.9,
    loadInRating: 4.0,
    genreFit: 99,
    source: 'blackbook',
    displayText: '924 Gilman • Berkeley, CA (Cap: 300)'
  },

  // PACIFIC NORTHWEST (Seattle, Portland)
  {
    id: 'bb_v_sea_1',
    name: 'El Corazon / Funhouse',
    city: 'Seattle',
    state: 'WA',
    country: 'USA',
    streetAddress: '109 Eastlake Ave E',
    fullAddress: '109 Eastlake Ave E, Seattle, WA 98109',
    capacity: 800,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'El Corazon • Seattle, WA (Cap: 800)',
    contactName: 'Dana Sims',
    contactPhone: '(206) 262-0482',
    contactEmail: 'booking@elcorazonseattle.com',
    parkingNotes: 'Legendary heavy music room. Dedicated alley load-in behind stage.'
  },
  {
    id: 'bb_v_pdx_1',
    name: 'Dante\'s',
    city: 'Portland',
    state: 'OR',
    country: 'USA',
    streetAddress: '350 W Burnside St',
    fullAddress: '350 W Burnside St, Portland, OR 97209',
    capacity: 350,
    payoutRating: 4.7,
    loadInRating: 4.0,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'Dante\'s • Portland, OR (Cap: 350)',
    contactName: 'Frank Faillace',
    contactPhone: '(866) 777-8932',
    contactEmail: 'dantesbooking@gmail.com',
    parkingNotes: 'Downtown Burnside. Street load-in with stage directly adjacent.'
  },
  {
    id: 'bb_v_pdx_2',
    name: 'Hawthorne Theatre',
    city: 'Portland',
    state: 'OR',
    country: 'USA',
    streetAddress: '1507 SE 39th Ave',
    fullAddress: '1507 SE 39th Ave, Portland, OR 97214',
    capacity: 600,
    payoutRating: 4.8,
    loadInRating: 4.6,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Hawthorne Theatre • Portland, OR (Cap: 600)',
    contactName: 'Mike Thrasher Presents / PM',
    contactPhone: '(503) 233-7100',
    contactEmail: 'production@hawthornetheatre.com',
    parkingNotes: 'Side lot parking behind venue. Lounge and Main Room.'
  },

  // MIDWEST (Detroit, Cleveland, Columbus, Indianapolis, Milwaukee, Minneapolis)
  {
    id: 'bb_v_det_1',
    name: 'The Sanctuary Detroit',
    city: 'Detroit',
    state: 'MI',
    country: 'USA',
    streetAddress: '2932 Caniff St',
    fullAddress: '2932 Caniff St, Hamtramck, MI 48212',
    capacity: 300,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Sanctuary • Detroit, MI (Cap: 300)',
    contactName: 'Bryan Reedy',
    contactPhone: '(313) 462-4117',
    contactEmail: 'sanctuarydetroit@gmail.com',
    parkingNotes: 'Premier underground metal and punk club in Hamtramck. Private rear parking.'
  },
  {
    id: 'bb_v_clev_1',
    name: 'The Foundry Concert Club',
    city: 'Cleveland',
    state: 'OH',
    country: 'USA',
    streetAddress: '11729 Detroit Ave',
    fullAddress: '11729 Detroit Ave, Lakewood, OH 44107',
    capacity: 300,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Foundry • Cleveland, OH (Cap: 300)',
    contactName: 'Kevin Bilapka',
    contactPhone: '(216) 555-3921',
    contactEmail: 'foundrycleveland@gmail.com',
    parkingNotes: 'Lakewood heavy metal hub. Back door loading ramp.'
  },
  {
    id: 'bb_v_col_1',
    name: 'Ace of Cups',
    city: 'Columbus',
    state: 'OH',
    country: 'USA',
    streetAddress: '2619 N High St',
    fullAddress: '2619 N High St, Columbus, OH 43202',
    capacity: 250,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'Ace of Cups • Columbus, OH (Cap: 250)',
    contactName: 'Marcy Mays',
    contactPhone: '(614) 262-6001',
    contactEmail: 'aceofcupsbar@gmail.com',
    parkingNotes: 'High St venue with dedicated rear parking lot for tour rigs.'
  },
  {
    id: 'bb_v_indy_1',
    name: 'Black Circle Brewing',
    city: 'Indianapolis',
    state: 'IN',
    country: 'USA',
    streetAddress: '2201 E 46th St',
    fullAddress: '2201 E 46th St, Indianapolis, IN 46205',
    capacity: 250,
    payoutRating: 4.8,
    loadInRating: 4.7,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Black Circle • Indianapolis, IN (Cap: 250)',
    contactName: 'Jesse Rice',
    contactPhone: '(317) 602-7634',
    contactEmail: 'blackcircleindy@gmail.com',
    parkingNotes: 'Heavy metal craft brewery and venue. Large private parking lot.'
  },
  {
    id: 'bb_v_milw_1',
    name: 'X-Ray Arcade',
    city: 'Milwaukee',
    state: 'WI',
    country: 'USA',
    streetAddress: '5036 S Packard Ave',
    fullAddress: '5036 S Packard Ave, Cudahy, WI 53110',
    capacity: 300,
    payoutRating: 4.9,
    loadInRating: 4.8,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'X-Ray Arcade • Milwaukee, WI (Cap: 300)',
    contactName: 'Nick Woods (Owner / Booker)',
    contactPhone: '(414) 998-0665',
    contactEmail: 'booking@xrayarcade.com',
    parkingNotes: 'Musician-owned all-ages live room with classic arcade. Easy alley load-in.'
  },
  {
    id: 'bb_v_minn_1',
    name: 'First Avenue & 7th St Entry',
    city: 'Minneapolis',
    state: 'MN',
    country: 'USA',
    streetAddress: '701 N 1st Ave',
    fullAddress: '701 N 1st Ave, Minneapolis, MN 55403',
    capacity: 1500,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'First Avenue • Minneapolis, MN (Cap: 1500)'
  },

  // EAST COAST & SOUTHEAST (Brooklyn, Philly, Atlanta, Tampa)
  {
    id: 'bb_v_bk_1',
    name: 'Saint Vitus Bar',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    streetAddress: '1120 Manhattan Ave',
    fullAddress: '1120 Manhattan Ave, Brooklyn, NY 11222',
    capacity: 250,
    payoutRating: 4.9,
    loadInRating: 3.8,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Saint Vitus Bar • Brooklyn, NY (Cap: 250)'
  },
  {
    id: 'bb_v_bk_2',
    name: 'The Meadows',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    streetAddress: '17 Meadow St',
    fullAddress: '17 Meadow St, Brooklyn, NY 11206',
    capacity: 650,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 97,
    source: 'blackbook',
    displayText: 'The Meadows • Brooklyn, NY (Cap: 650)',
    contactName: 'Brian Stern (Production)',
    contactPhone: '(718) 417-1118',
    contactEmail: 'booking@themeadowsbk.com',
    parkingNotes: 'Industrial Bushwick. Easy loading dock access.'
  },
  {
    id: 'bb_v_philly_1',
    name: 'Kung Fu Necktie',
    city: 'Philadelphia',
    state: 'PA',
    country: 'USA',
    streetAddress: '1250 N Front St',
    fullAddress: '1250 N Front St, Philadelphia, PA 19122',
    capacity: 150,
    payoutRating: 4.7,
    loadInRating: 4.0,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Kung Fu Necktie • Philadelphia, PA (Cap: 150)',
    contactName: 'Keith Jones',
    contactPhone: '(215) 291-4919',
    contactEmail: 'kfnbooking@gmail.com',
    parkingNotes: 'Under the El train in Fishtown. Street parking.'
  },
  {
    id: 'bb_v_atl_1',
    name: 'The Masquerade (Heaven/Hell/Purgatory)',
    city: 'Atlanta',
    state: 'GA',
    country: 'USA',
    streetAddress: '50 Lower Alabama St',
    fullAddress: '50 Lower Alabama St, Atlanta, GA 30303',
    capacity: 1400,
    payoutRating: 4.9,
    loadInRating: 4.7,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'The Masquerade • Atlanta, GA (Cap: 1400)',
    contactName: 'Greg Green (Production Director)',
    contactPhone: '(404) 577-8178',
    contactEmail: 'production@masqueradeatlanta.com',
    parkingNotes: 'Underground Atlanta loading bays. 3 distinct stages (Hell: 550, Purgatory: 250, Heaven: 1400).'
  },
  {
    id: 'bb_v_tpa_1',
    name: 'The Orpheum',
    city: 'Tampa',
    state: 'FL',
    country: 'USA',
    streetAddress: '14802 N Nebraska Ave',
    fullAddress: '14802 N Nebraska Ave, Tampa, FL 33613',
    capacity: 750,
    payoutRating: 4.8,
    loadInRating: 4.7,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'The Orpheum • Tampa, FL (Cap: 750)',
    contactName: 'Jerry Dufrain',
    contactPhone: '(813) 248-9500',
    contactEmail: 'booking@theorpheum.com',
    parkingNotes: 'Tampa death metal capital of the world. Massive private parking lot for buses and rigs.'
  },
  {
    id: 'bb_v_tpa_2',
    name: 'Brass Mug',
    city: 'Tampa',
    state: 'FL',
    country: 'USA',
    streetAddress: '1450 Fletcher Ave',
    fullAddress: '1450 Fletcher Ave, Tampa, FL 33612',
    capacity: 250,
    payoutRating: 4.6,
    loadInRating: 4.3,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Brass Mug • Tampa, FL (Cap: 250)',
    contactName: 'Heather Mug',
    contactPhone: '(813) 972-8184',
    contactEmail: 'brassmugtampa@gmail.com',
    parkingNotes: 'Historic Florida death metal staple.'
  },

  // ST. LOUIS, MO & GREATER METRO
  {
    id: 'bb_v_stl_1',
    name: 'The Sinkhole',
    city: 'St. Louis',
    state: 'MO',
    country: 'USA',
    streetAddress: '7404 S Broadway',
    fullAddress: '7404 S Broadway, St. Louis, MO 63111',
    capacity: 150,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Sinkhole • St. Louis, MO (Cap: 150)',
    contactName: 'Matt Harnish / Booking Team',
    contactPhone: '(314) 328-2309',
    contactEmail: 'sinkholestl@gmail.com',
    parkingNotes: 'Dedicated south Broadway parking lot. Direct side door load-in. Epic underground extreme metal & grind haven.',
    tags: ['st. louis', 'st louis', 'saint louis', 'st. louis, mo', 'st louis, mo', 'st. louis mo', 'st louis mo', 'stl', 'missouri', 'underground', 'diy', 'metal', 'grind']
  },
  {
    id: 'bb_v_stl_2',
    name: 'Red Flag',
    city: 'St. Louis',
    state: 'MO',
    country: 'USA',
    streetAddress: '3040 Locust St',
    fullAddress: '3040 Locust St, St. Louis, MO 63103',
    capacity: 1000,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'Red Flag • St. Louis, MO (Cap: 1000)',
    contactName: 'Bob Pro Production & Talent',
    contactPhone: '(314) 289-9050',
    contactEmail: 'booking@redflagstl.com',
    parkingNotes: 'Secured alley bus & trailer parking with 50A power. Ground-level double door load-in straight to stage left.',
    tags: ['st. louis', 'st louis', 'saint louis', 'st. louis, mo', 'st louis, mo', 'st. louis mo', 'st louis mo', 'stl', 'missouri', 'touring', 'metal', 'midtown']
  },
  {
    id: 'bb_v_stl_3',
    name: "Pop's Nightclub & Concert Venue",
    city: 'Sauget',
    state: 'IL',
    country: 'USA',
    streetAddress: '401 Monsanto Ave',
    fullAddress: '401 Monsanto Ave, Sauget, IL 62201',
    capacity: 1200,
    payoutRating: 4.8,
    loadInRating: 4.7,
    genreFit: 99,
    source: 'blackbook',
    displayText: "Pop's Concert Venue • St. Louis Metro (Cap: 1200)",
    contactName: 'Production & Talent Office',
    contactPhone: '(618) 274-6720',
    contactEmail: 'booking@popsrocks.com',
    parkingNotes: 'Massive private tour bus parking lot directly behind venue. Legendary 24-hour Midwest heavy metal institution.',
    tags: ['st. louis', 'st louis', 'saint louis', 'st. louis, mo', 'st louis, mo', 'st. louis mo', 'st louis mo', 'stl', 'sauget', 'metro east', 'legendary']
  },
  {
    id: 'bb_v_stl_4',
    name: 'Off Broadway',
    city: 'St. Louis',
    state: 'MO',
    country: 'USA',
    streetAddress: '3509 Lemp Ave',
    fullAddress: '3509 Lemp Ave, St. Louis, MO 63118',
    capacity: 400,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 90,
    source: 'blackbook',
    displayText: 'Off Broadway • St. Louis, MO (Cap: 400)',
    contactName: 'Steve Pohlman',
    contactPhone: '(314) 498-6989',
    contactEmail: 'offbroadwaystl@gmail.com',
    parkingNotes: 'Benton Park historic district. Front load-in, van/trailer street parking reserved with city cones.',
    tags: ['st. louis', 'st louis', 'saint louis', 'st. louis, mo', 'st louis, mo', 'st. louis mo', 'st louis mo', 'stl', 'missouri', 'club']
  },
  {
    id: 'bb_v_stl_5',
    name: 'Delmar Hall',
    city: 'St. Louis',
    state: 'MO',
    country: 'USA',
    streetAddress: '6133 Delmar Blvd',
    fullAddress: '6133 Delmar Blvd, St. Louis, MO 63112',
    capacity: 800,
    payoutRating: 5.0,
    loadInRating: 4.9,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Delmar Hall • St. Louis, MO (Cap: 800)',
    contactName: 'The Pageant / Delmar Production Desk',
    contactPhone: '(314) 726-6161',
    contactEmail: 'production@thepageant.com',
    parkingNotes: 'Rear loading dock with private tour bus parking pad and shore power.',
    tags: ['st. louis', 'st louis', 'saint louis', 'st. louis, mo', 'st louis, mo', 'st. louis mo', 'st louis mo', 'stl', 'missouri', 'delmar loop']
  },
  {
    id: 'bb_v_stl_6',
    name: 'Blueberry Hill Duck Room',
    city: 'St. Louis',
    state: 'MO',
    country: 'USA',
    streetAddress: '6504 Delmar Blvd',
    fullAddress: '6504 Delmar Blvd, St. Louis, MO 63130',
    capacity: 340,
    payoutRating: 4.7,
    loadInRating: 4.1,
    genreFit: 88,
    source: 'blackbook',
    displayText: 'Blueberry Hill Duck Room • St. Louis, MO (Cap: 340)',
    contactName: 'Joe Edwards / Booking',
    contactPhone: '(314) 727-4444',
    contactEmail: 'duckroom@blueberryhill.com',
    parkingNotes: 'Historic basement venue. Rear alley loading ramp.',
    tags: ['st. louis', 'st louis', 'saint louis', 'st. louis, mo', 'st louis, mo', 'st. louis mo', 'st louis mo', 'stl', 'missouri', 'duck room']
  },

  // KANSAS CITY, MO & LAWRENCE, KS
  {
    id: 'bb_v_kc_1',
    name: 'recordBar',
    city: 'Kansas City',
    state: 'MO',
    country: 'USA',
    streetAddress: '1520 Grand Blvd',
    fullAddress: '1520 Grand Blvd, Kansas City, MO 64108',
    capacity: 400,
    payoutRating: 4.9,
    loadInRating: 4.5,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'recordBar • Kansas City, MO (Cap: 400)',
    contactName: 'Steve Tulipana',
    contactPhone: '(816) 753-5207',
    contactEmail: 'booking@therecordbar.com',
    parkingNotes: 'Crossroads Arts District. Side alley load-in directly to green room / stage.',
    tags: ['kansas city', 'kc', 'crossroads']
  },
  {
    id: 'bb_v_kc_2',
    name: 'The Rino',
    city: 'North Kansas City',
    state: 'MO',
    country: 'USA',
    streetAddress: '314 Armour Rd',
    fullAddress: '314 Armour Rd, North Kansas City, MO 64116',
    capacity: 150,
    payoutRating: 4.8,
    loadInRating: 4.3,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'The Rino • Kansas City, MO (Cap: 150)',
    contactName: 'Rino Booking Team',
    contactPhone: '(816) 945-2150',
    contactEmail: 'booking@therinokc.com',
    parkingNotes: 'Great DIY underground room for death metal, hardcore and touring packages. Free rear lot parking.',
    tags: ['kansas city', 'kc', 'north kansas city', 'underground', 'diy']
  },
  {
    id: 'bb_v_kc_3',
    name: 'The Truman',
    city: 'Kansas City',
    state: 'MO',
    country: 'USA',
    streetAddress: '601 E Truman Rd',
    fullAddress: '601 E Truman Rd, Kansas City, MO 64106',
    capacity: 1200,
    payoutRating: 5.0,
    loadInRating: 4.9,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'The Truman • Kansas City, MO (Cap: 1200)',
    contactName: 'Production Management',
    contactPhone: '(816) 205-8560',
    contactEmail: 'info@thetrumankc.com',
    parkingNotes: 'Full tour bus parking pad on east side of building with multiple shore power tie-ins.',
    tags: ['kansas city', 'kc', 'east crossroads', 'the truman']
  },
  {
    id: 'bb_v_kc_4',
    name: 'The Bottleneck',
    city: 'Lawrence',
    state: 'KS',
    country: 'USA',
    streetAddress: '737 New Hampshire St',
    fullAddress: '737 New Hampshire St, Lawrence, KS 66044',
    capacity: 450,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 97,
    source: 'blackbook',
    displayText: 'The Bottleneck • Lawrence / KC Metro (Cap: 450)',
    contactName: 'Brett Mosiman / Booking',
    contactPhone: '(785) 841-5483',
    contactEmail: 'bottleneckbooking@gmail.com',
    parkingNotes: 'Rear parking lot off 8th St. Historic regional tour stop for heavy touring packages.',
    tags: ['lawrence', 'kansas city', 'kc', 'bottleneck']
  },
  {
    id: 'bb_v_kc_5',
    name: 'Granada Theater',
    city: 'Lawrence',
    state: 'KS',
    country: 'USA',
    streetAddress: '1020 Massachusetts St',
    fullAddress: '1020 Massachusetts St, Lawrence, KS 66044',
    capacity: 900,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Granada Theater • Lawrence / KC Metro (Cap: 900)',
    contactName: 'Granada Production Desk',
    contactPhone: '(785) 842-1390',
    contactEmail: 'info@thegranada.com',
    parkingNotes: 'Alley loading on 10th St. Dedicated tour bus parking permit provided.',
    tags: ['lawrence', 'kansas city', 'kc', 'granada']
  },

  // CINCINNATI, OH & NEWPORT, KY
  {
    id: 'bb_v_cin_1',
    name: "Bogart's",
    city: 'Cincinnati',
    state: 'OH',
    country: 'USA',
    streetAddress: '2621 Vine St',
    fullAddress: '2621 Vine St, Cincinnati, OH 45219',
    capacity: 1500,
    payoutRating: 4.9,
    loadInRating: 4.7,
    genreFit: 96,
    source: 'blackbook',
    displayText: "Bogart's • Cincinnati, OH (Cap: 1500)",
    contactName: 'Production & Ops Manager',
    contactPhone: '(513) 872-8801',
    contactEmail: 'bogartsbooking@livenation.com',
    parkingNotes: 'Dedicated bus bay on Vine St with shore power hookups. Rear loading dock.',
    tags: ['cincinnati', 'cincy', 'vine st']
  },
  {
    id: 'bb_v_cin_2',
    name: 'Legends Bar & Venue',
    city: 'Cincinnati',
    state: 'OH',
    country: 'USA',
    streetAddress: '3801 Harrison Ave',
    fullAddress: '3801 Harrison Ave, Cheviot, OH 45211',
    capacity: 300,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Legends Bar & Venue • Cincinnati, OH (Cap: 300)',
    contactName: 'Booking & Promotions Desk',
    contactPhone: '(513) 662-1222',
    contactEmail: 'legendsbarbooking@gmail.com',
    parkingNotes: 'Premier underground metal & deathcore club in Greater Cincy. Private lot behind building.',
    tags: ['cincinnati', 'cincy', 'cheviot', 'underground', 'metal']
  },
  {
    id: 'bb_v_cin_3',
    name: 'Southgate House Revival',
    city: 'Newport',
    state: 'KY',
    country: 'USA',
    streetAddress: '111 E 6th St',
    fullAddress: '111 E 6th St, Newport, KY 41071',
    capacity: 600,
    payoutRating: 4.9,
    loadInRating: 4.5,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'Southgate House Revival • Cincinnati Metro (Cap: 600)',
    contactName: 'Morrella Raleigh / Booking',
    contactPhone: '(859) 431-2201',
    contactEmail: 'booking@southgatehouse.com',
    parkingNotes: 'Historic church conversion 2 minutes across the Ohio river from downtown Cincy. Dedicated van/bus parking in gravel lot.',
    tags: ['cincinnati', 'cincy', 'newport', 'sanctuary']
  },
  {
    id: 'bb_v_cin_4',
    name: 'Top Cats',
    city: 'Cincinnati',
    state: 'OH',
    country: 'USA',
    streetAddress: '2820 Vine St',
    fullAddress: '2820 Vine St, Cincinnati, OH 45219',
    capacity: 500,
    payoutRating: 4.7,
    loadInRating: 4.3,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Top Cats • Cincinnati, OH (Cap: 500)',
    contactName: 'Dan Mueller',
    contactPhone: '(513) 559-0005',
    contactEmail: 'booking@topcatscincy.com',
    parkingNotes: 'Direct Vine street frontage near UC campus. Side stage ramp load-in.',
    tags: ['cincinnati', 'cincy', 'top cats']
  },

  // PITTSBURGH, PA
  {
    id: 'bb_v_pit_1',
    name: 'Preserving Underground',
    city: 'New Kensington',
    state: 'PA',
    country: 'USA',
    streetAddress: '1101 Pittsburgh St',
    fullAddress: '1101 Pittsburgh St, New Kensington, PA 15068',
    capacity: 450,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Preserving Underground • Pittsburgh Metro (Cap: 450)',
    contactName: 'Josh Schroeder / Preserving Records',
    contactPhone: '(724) 472-1322',
    contactEmail: 'preservingbooking@gmail.com',
    parkingNotes: 'The premier national metalcore/death metal touring room in Western PA. Record store on site, massive private parking lot with trailer parking.',
    tags: ['pittsburgh', 'pgh', 'preserving', 'metal', 'hardcore']
  },
  {
    id: 'bb_v_pit_2',
    name: 'Mr. Smalls Theatre',
    city: 'Millvale',
    state: 'PA',
    country: 'USA',
    streetAddress: '400 Lincoln Ave',
    fullAddress: '400 Lincoln Ave, Millvale, PA 15209',
    capacity: 800,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Mr. Smalls Theatre • Pittsburgh, PA (Cap: 800)',
    contactName: 'Liz Berlin / Mike Speranzo',
    contactPhone: '(412) 821-4447',
    contactEmail: 'booking@mrsmalls.com',
    parkingNotes: 'Converted 18th-century sanctuary with legendary acoustics. Bus parking on Lincoln Ave with 50A hookup.',
    tags: ['pittsburgh', 'pgh', 'millvale', 'mr smalls']
  },
  {
    id: 'bb_v_pit_3',
    name: 'Crafthouse Stage & Grill',
    city: 'Pittsburgh',
    state: 'PA',
    country: 'USA',
    streetAddress: '5024 Curry Rd',
    fullAddress: '5024 Curry Rd, Pittsburgh, PA 15236',
    capacity: 350,
    payoutRating: 4.8,
    loadInRating: 4.7,
    genreFit: 97,
    source: 'blackbook',
    displayText: 'Crafthouse Stage & Grill • Pittsburgh, PA (Cap: 350)',
    contactName: 'Production Management',
    contactPhone: '(412) 653-2695',
    contactEmail: 'booking@crafthousepgh.com',
    parkingNotes: 'Huge private lot, direct ground load-in with no stairs. Great stage and hospitality.',
    tags: ['pittsburgh', 'pgh', 'crafthouse']
  },
  {
    id: 'bb_v_pit_4',
    name: 'Roxian Theatre',
    city: 'McKees Rocks',
    state: 'PA',
    country: 'USA',
    streetAddress: '425 Chartiers Ave',
    fullAddress: '425 Chartiers Ave, McKees Rocks, PA 15136',
    capacity: 1400,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Roxian Theatre • Pittsburgh, PA (Cap: 1400)',
    contactName: 'Roxian Operations Team',
    contactPhone: '(412) 331-1050',
    contactEmail: 'info@roxiantheatre.com',
    parkingNotes: 'Full modern production facility, tour bus parking with shore power.',
    tags: ['pittsburgh', 'pgh', 'roxian']
  },

  // SALT LAKE CITY, UT
  {
    id: 'bb_v_slc_1',
    name: 'The Complex',
    city: 'Salt Lake City',
    state: 'UT',
    country: 'USA',
    streetAddress: '536 W 100 S',
    fullAddress: '536 W 100 S, Salt Lake City, UT 84101',
    capacity: 2500,
    payoutRating: 5.0,
    loadInRating: 4.9,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'The Complex • Salt Lake City, UT (Cap: 2500)',
    contactName: 'Production & Booking Office',
    contactPhone: '(801) 528-9197',
    contactEmail: 'booking@thecomplexslc.com',
    parkingNotes: 'Multi-room facility. Gated rear tour bus staging lot with dual 50A shore power.',
    tags: ['salt lake city', 'slc', 'utah']
  },
  {
    id: 'bb_v_slc_2',
    name: 'Metro Music Hall',
    city: 'Salt Lake City',
    state: 'UT',
    country: 'USA',
    streetAddress: '615 W 100 S',
    fullAddress: '615 W 100 S, Salt Lake City, UT 84101',
    capacity: 600,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Metro Music Hall • Salt Lake City, UT (Cap: 600)',
    contactName: 'Sartain & Saunders Booking',
    contactPhone: '(801) 359-3219',
    contactEmail: 'booking@metromusichall.com',
    parkingNotes: 'Touring heavy metal & darkwave headquarters in SLC. Rear load-in door directly to stage.',
    tags: ['salt lake city', 'slc', 'metro music hall']
  },
  {
    id: 'bb_v_slc_3',
    name: 'Urban Lounge',
    city: 'Salt Lake City',
    state: 'UT',
    country: 'USA',
    streetAddress: '241 S 500 E',
    fullAddress: '241 S 500 E, Salt Lake City, UT 84102',
    capacity: 400,
    payoutRating: 4.8,
    loadInRating: 4.3,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'Urban Lounge • Salt Lake City, UT (Cap: 400)',
    contactName: 'Will Sartain',
    contactPhone: '(801) 746-0504',
    contactEmail: 'info@theurbanloungeslc.com',
    parkingNotes: 'Central Salt Lake room. Dedicated street loading zone.',
    tags: ['salt lake city', 'slc', 'urban lounge']
  },

  // BOISE, ID
  {
    id: 'bb_v_boi_1',
    name: 'The Shredder',
    city: 'Boise',
    state: 'ID',
    country: 'USA',
    streetAddress: '430 S 10th St',
    fullAddress: '430 S 10th St, Boise, ID 83702',
    capacity: 250,
    payoutRating: 4.9,
    loadInRating: 4.5,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Shredder • Boise, ID (Cap: 250)',
    contactName: 'Jeff Ament / Shredder Staff',
    contactPhone: '(208) 345-4309',
    contactEmail: 'shredderboise@gmail.com',
    parkingNotes: 'All-ages underground heavy music epicenter in Idaho. Skatepark & venue. Private lot parking.',
    tags: ['boise', 'idaho', 'shredder', 'diy', 'metal']
  },
  {
    id: 'bb_v_boi_2',
    name: 'Knitting Factory Boise',
    city: 'Boise',
    state: 'ID',
    country: 'USA',
    streetAddress: '416 S 9th St',
    fullAddress: '416 S 9th St, Boise, ID 83702',
    capacity: 1000,
    payoutRating: 4.9,
    loadInRating: 4.7,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Knitting Factory • Boise, ID (Cap: 1000)',
    contactName: 'Production Management',
    contactPhone: '(208) 367-1212',
    contactEmail: 'boisebooking@knittingfactory.com',
    parkingNotes: 'Downtown Boise loading dock with tour bus shore power.',
    tags: ['boise', 'idaho', 'knitting factory']
  },

  // SPOKANE, WA
  {
    id: 'bb_v_spk_1',
    name: 'The Big Dipper',
    city: 'Spokane',
    state: 'WA',
    country: 'USA',
    streetAddress: '171 S Washington St',
    fullAddress: '171 S Washington St, Spokane, WA 99201',
    capacity: 250,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Big Dipper • Spokane, WA (Cap: 250)',
    contactName: 'Dan Hoerner (Booking)',
    contactPhone: '(509) 863-8098',
    contactEmail: 'bigdipperspokane@gmail.com',
    parkingNotes: 'Historic Spokane heavy metal and punk landmark. Rear load-in directly to stage.',
    tags: ['spokane', 'washington', 'big dipper', 'metal', 'all ages']
  },
  {
    id: 'bb_v_spk_2',
    name: 'Knitting Factory Spokane',
    city: 'Spokane',
    state: 'WA',
    country: 'USA',
    streetAddress: '919 W Sprague Ave',
    fullAddress: '919 W Sprague Ave, Spokane, WA 99201',
    capacity: 1500,
    payoutRating: 4.9,
    loadInRating: 4.8,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'Knitting Factory • Spokane, WA (Cap: 1500)',
    contactName: 'Spokane Production Desk',
    contactPhone: '(509) 244-3277',
    contactEmail: 'spokanebooking@knittingfactory.com',
    parkingNotes: 'Full touring amenities, private tour bus parking pad on Sprague with shore power.',
    tags: ['spokane', 'washington', 'knitting factory']
  },

  // ALBUQUERQUE, NM
  {
    id: 'bb_v_abq_1',
    name: 'Launchpad',
    city: 'Albuquerque',
    state: 'NM',
    country: 'USA',
    streetAddress: '618 Central Ave SW',
    fullAddress: '618 Central Ave SW, Albuquerque, NM 87102',
    capacity: 300,
    payoutRating: 4.9,
    loadInRating: 4.5,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Launchpad • Albuquerque, NM (Cap: 300)',
    contactName: 'Joe Anderson / Booking',
    contactPhone: '(505) 764-8887',
    contactEmail: 'launchpadrocks@gmail.com',
    parkingNotes: 'Historic Route 66 rock and metal mainstay. Front street loading with city parking permits.',
    tags: ['albuquerque', 'abq', 'new mexico', 'launchpad', 'metal']
  },
  {
    id: 'bb_v_abq_2',
    name: 'Sunshine Theater',
    city: 'Albuquerque',
    state: 'NM',
    country: 'USA',
    streetAddress: '120 Central Ave SW',
    fullAddress: '120 Central Ave SW, Albuquerque, NM 87102',
    capacity: 1000,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 97,
    source: 'blackbook',
    displayText: 'Sunshine Theater • Albuquerque, NM (Cap: 1000)',
    contactName: 'Production Management',
    contactPhone: '(505) 764-0249',
    contactEmail: 'sunshinetheaterabq@gmail.com',
    parkingNotes: 'Historic theater venue for national touring packages. Bus parking on 2nd St.',
    tags: ['albuquerque', 'abq', 'sunshine theater']
  },
  {
    id: 'bb_v_abq_3',
    name: 'Sister Bar',
    city: 'Albuquerque',
    state: 'NM',
    country: 'USA',
    streetAddress: '407 Central Ave NW',
    fullAddress: '407 Central Ave NW, Albuquerque, NM 87102',
    capacity: 350,
    payoutRating: 4.8,
    loadInRating: 4.3,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'Sister Bar • Albuquerque, NM (Cap: 350)',
    contactName: 'Chad / Booking',
    contactPhone: '(505) 242-4900',
    contactEmail: 'booking@sisterthebar.com',
    parkingNotes: 'Downtown arcade bar & music venue with great sound system and craft beer.',
    tags: ['albuquerque', 'abq', 'sister bar']
  },

  // BALTIMORE, MD
  {
    id: 'bb_v_balt_1',
    name: 'Ottobar',
    city: 'Baltimore',
    state: 'MD',
    country: 'USA',
    streetAddress: '2549 N Howard St',
    fullAddress: '2549 N Howard St, Baltimore, MD 21218',
    capacity: 350,
    payoutRating: 5.0,
    loadInRating: 4.6,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Ottobar • Baltimore, MD (Cap: 350)',
    contactName: 'Te Te / Booking Team',
    contactPhone: '(410) 662-0069',
    contactEmail: 'theottobar@gmail.com',
    parkingNotes: 'Home of Maryland Deathfest pre-shows and underground legends. Rear alley loading ramp directly to backstage.',
    tags: ['baltimore', 'maryland', 'ottobar', 'deathfest', 'underground', 'metal']
  },
  {
    id: 'bb_v_balt_2',
    name: 'Baltimore Soundstage',
    city: 'Baltimore',
    state: 'MD',
    country: 'USA',
    streetAddress: '124 Market Pl',
    fullAddress: '124 Market Pl, Baltimore, MD 21202',
    capacity: 1000,
    payoutRating: 4.9,
    loadInRating: 4.8,
    genreFit: 99,
    source: 'blackbook',
    displayText: 'Baltimore Soundstage • Baltimore, MD (Cap: 1000)',
    contactName: 'Soundstage Production Office',
    contactPhone: '(410) 244-0057',
    contactEmail: 'booking@baltimoresoundstage.com',
    parkingNotes: 'Full touring loading bay with dual tour bus shore power drops in Inner Harbor district.',
    tags: ['baltimore', 'soundstage', 'deathfest']
  },
  {
    id: 'bb_v_balt_3',
    name: 'Metro Gallery',
    city: 'Baltimore',
    state: 'MD',
    country: 'USA',
    streetAddress: '1700 N Charles St',
    fullAddress: '1700 N Charles St, Baltimore, MD 21201',
    capacity: 250,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Metro Gallery • Baltimore, MD (Cap: 250)',
    contactName: 'Booking Office',
    contactPhone: '(410) 244-0899',
    contactEmail: 'booking@themetrogallery.net',
    parkingNotes: 'Arts district DIY space for heavy and experimental acts.',
    tags: ['baltimore', 'metro gallery']
  },

  // RICHMOND, VA
  {
    id: 'bb_v_ric_1',
    name: 'The Canal Club',
    city: 'Richmond',
    state: 'VA',
    country: 'USA',
    streetAddress: '1545 E Cary St',
    fullAddress: '1545 E Cary St, Richmond, VA 23219',
    capacity: 650,
    payoutRating: 4.9,
    loadInRating: 4.5,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Canal Club • Richmond, VA (Cap: 650)',
    contactName: 'Canal Club Booking',
    contactPhone: '(804) 643-2582',
    contactEmail: 'booking@thecanalclub.com',
    parkingNotes: 'Historic Shockoe Bottom 2-story metal and punk venue. Side loading ramp.',
    tags: ['richmond', 'rva', 'virginia', 'canal club', 'metal']
  },
  {
    id: 'bb_v_ric_2',
    name: 'The Broadberry',
    city: 'Richmond',
    state: 'VA',
    country: 'USA',
    streetAddress: '2729 W Broad St',
    fullAddress: '2729 W Broad St, Richmond, VA 23220',
    capacity: 500,
    payoutRating: 4.8,
    loadInRating: 4.6,
    genreFit: 94,
    source: 'blackbook',
    displayText: 'The Broadberry • Richmond, VA (Cap: 500)',
    contactName: 'Lucas Fritz / Production Desk',
    contactPhone: '(804) 353-1888',
    contactEmail: 'booking@thebroadberry.com',
    parkingNotes: 'Midtown RVA venue with dedicated bus parking and great hospitality.',
    tags: ['richmond', 'rva', 'broadberry']
  },

  // PHOENIX, MESA & TEMPE, AZ
  {
    id: 'bb_v_phx_1',
    name: 'The Nile Theater',
    city: 'Mesa',
    state: 'AZ',
    country: 'USA',
    streetAddress: '105 W Main St',
    fullAddress: '105 W Main St, Mesa, AZ 85201',
    capacity: 800,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'The Nile Theater • Mesa / Phoenix, AZ (Cap: 800)',
    contactName: 'Nile Production & Booking',
    contactPhone: '(480) 559-5859',
    contactEmail: 'booking@theniletheater.com',
    parkingNotes: 'Dedicated rear alley parking behind the venue. Ground floor double doors into backstage.',
    tags: ['phoenix', 'mesa', 'tempe', 'arizona', 'phx', 'nile', 'metal', 'hardcore', 'underground']
  },
  {
    id: 'bb_v_phx_2',
    name: 'The Rebel Lounge',
    city: 'Phoenix',
    state: 'AZ',
    country: 'USA',
    streetAddress: '4440 E Indian School Rd',
    fullAddress: '4440 E Indian School Rd, Phoenix, AZ 85018',
    capacity: 300,
    payoutRating: 4.8,
    loadInRating: 4.4,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'The Rebel Lounge • Phoenix, AZ (Cap: 300)',
    contactName: 'Stephen Chilton / Psyko Steve Presents',
    contactPhone: '(602) 296-7013',
    contactEmail: 'booking@therebellounge.com',
    parkingNotes: 'Dedicated lot in front & east side of building. Direct stage load-in.',
    tags: ['phoenix', 'arizona', 'phx', 'rebel lounge', 'psyko steve', 'punk', 'metal']
  },
  {
    id: 'bb_v_phx_3',
    name: 'Crescent Ballroom',
    city: 'Phoenix',
    state: 'AZ',
    country: 'USA',
    streetAddress: '308 N 2nd Ave',
    fullAddress: '308 N 2nd Ave, Phoenix, AZ 85003',
    capacity: 550,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'Crescent Ballroom • Phoenix, AZ (Cap: 550)',
    contactName: 'Charlie Levy / Stateside Presents',
    contactPhone: '(602) 716-2222',
    contactEmail: 'booking@crescentphx.com',
    parkingNotes: 'Downtown Phoenix loading zone on 2nd Ave. Dedicated tour bus power connection.',
    tags: ['phoenix', 'arizona', 'phx', 'crescent', 'downtown phoenix']
  },

  // SACRAMENTO, CA
  {
    id: 'bb_v_sac_1',
    name: 'Ace of Spades',
    city: 'Sacramento',
    state: 'CA',
    country: 'USA',
    streetAddress: '1417 R St',
    fullAddress: '1417 R St, Sacramento, CA 95811',
    capacity: 1000,
    payoutRating: 5.0,
    loadInRating: 4.8,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Ace of Spades • Sacramento, CA (Cap: 1000)',
    contactName: 'Ace Production Team',
    contactPhone: '(916) 448-8439',
    contactEmail: 'aceofspadesevents@livenation.com',
    parkingNotes: 'R Street corridor loading zone. Tour bus shore power available in secured alley.',
    tags: ['sacramento', 'norcal', 'california', 'sac', 'ace of spades', 'metal', 'hard rock']
  },
  {
    id: 'bb_v_sac_2',
    name: 'Cafe Colonial & The Colony',
    city: 'Sacramento',
    state: 'CA',
    country: 'USA',
    streetAddress: '3520 Stockton Blvd',
    fullAddress: '3520 Stockton Blvd, Sacramento, CA 95820',
    capacity: 150,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Cafe Colonial / The Colony • Sacramento, CA (Cap: 150)',
    contactName: 'Colony Collective Booking',
    contactPhone: '(916) 736-3520',
    contactEmail: 'cafecolonial916@gmail.com',
    parkingNotes: 'Private lot on side of building. Direct roll-in to stage. Legendary DIY all-ages extreme metal/grind institution.',
    tags: ['sacramento', 'the colony', 'cafe colonial', 'underground', 'diy', 'grind', 'metal', 'all ages']
  },
  {
    id: 'bb_v_sac_3',
    name: 'Goldfield Trading Post',
    city: 'Sacramento',
    state: 'CA',
    country: 'USA',
    streetAddress: '1630 J St',
    fullAddress: '1630 J St, Sacramento, CA 95814',
    capacity: 400,
    payoutRating: 4.8,
    loadInRating: 4.3,
    genreFit: 92,
    source: 'blackbook',
    displayText: 'Goldfield Trading Post • Sacramento, CA (Cap: 400)',
    contactName: 'Bret LeMaster',
    contactPhone: '(916) 476-5076',
    contactEmail: 'booking@goldfieldtradingpost.com',
    parkingNotes: 'Midtown J St load-in. Great sound rig and fast changeover staff.',
    tags: ['sacramento', 'goldfield', 'midtown sacramento']
  },

  // NEW YORK CITY, BROOKLYN & QUEENS, NY
  {
    id: 'bb_v_nyc_1',
    name: 'Saint Vitus Bar Presents',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    streetAddress: '1120 Manhattan Ave',
    fullAddress: '1120 Manhattan Ave, Brooklyn, NY 11222',
    capacity: 350,
    payoutRating: 5.0,
    loadInRating: 4.5,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Saint Vitus Presents • Brooklyn / New York, NY (Cap: 350)',
    contactName: 'David Castillo / Arty Shepherd',
    contactPhone: '(718) 389-2040',
    contactEmail: 'booking@saintvitusbar.com',
    parkingNotes: 'Curbside Greenpoint van/bus loading. Internationally recognized heavy metal epicenter.',
    tags: ['new york', 'nyc', 'brooklyn', 'greenpoint', 'manhattan', 'saint vitus', 'metal', 'grind', 'death metal']
  },
  {
    id: 'bb_v_nyc_2',
    name: 'The Bowery Ballroom',
    city: 'New York',
    state: 'NY',
    country: 'USA',
    streetAddress: '6 Delancey St',
    fullAddress: '6 Delancey St, New York, NY 10002',
    capacity: 575,
    payoutRating: 5.0,
    loadInRating: 4.7,
    genreFit: 90,
    source: 'blackbook',
    displayText: 'The Bowery Ballroom • New York, NY (Cap: 575)',
    contactName: 'Bowery Presents Desk',
    contactPhone: '(212) 533-2111',
    contactEmail: 'booking@boweryballroom.com',
    parkingNotes: 'Lower East Side Delancey St loading zone. Premier sound reinforcement.',
    tags: ['new york', 'nyc', 'manhattan', 'lower east side', 'bowery']
  },
  {
    id: 'bb_v_nyc_3',
    name: 'The Meadows',
    city: 'Brooklyn',
    state: 'NY',
    country: 'USA',
    streetAddress: '17 Meadow St',
    fullAddress: '17 Meadow St, Brooklyn, NY 11206',
    capacity: 400,
    payoutRating: 4.9,
    loadInRating: 4.6,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'The Meadows • Brooklyn / New York, NY (Cap: 400)',
    contactName: 'Meadows Booking Office',
    contactPhone: '(718) 417-1118',
    contactEmail: 'booking@themeadowsbk.com',
    parkingNotes: 'East Williamsburg industrial zone. Easy curbside van and bus staging.',
    tags: ['new york', 'nyc', 'brooklyn', 'williamsburg', 'metal', 'hardcore']
  },
  {
    id: 'bb_v_nyc_4',
    name: 'TV Eye',
    city: 'Ridgewood',
    state: 'NY',
    country: 'USA',
    streetAddress: '1647 Weirfield St',
    fullAddress: '1647 Weirfield St, Ridgewood, NY 11385',
    capacity: 250,
    payoutRating: 4.8,
    loadInRating: 4.6,
    genreFit: 95,
    source: 'blackbook',
    displayText: 'TV Eye • Queens / Ridgewood, NY (Cap: 250)',
    contactName: 'Jonathan Toubin / Production',
    contactPhone: '(718) 418-4000',
    contactEmail: 'booking@tveyenyc.com',
    parkingNotes: 'Weirfield St ground floor roll-in through side courtyard.',
    tags: ['new york', 'nyc', 'queens', 'ridgewood', 'brooklyn border', 'punk', 'garage', 'metal']
  },

  // TORONTO, ON & MONTREAL, QC (CANADA)
  {
    id: 'bb_v_tor_1',
    name: 'The Opera House',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    streetAddress: '735 Queen St E',
    fullAddress: '735 Queen St E, Toronto, ON M4M 1H1, Canada',
    capacity: 950,
    payoutRating: 5.0,
    loadInRating: 4.7,
    genreFit: 98,
    source: 'blackbook',
    displayText: 'The Opera House • Toronto, ON (Cap: 950)',
    contactName: 'Athena Ellinas-Towers / Production PM',
    contactPhone: '(416) 466-0313',
    contactEmail: 'booking@theoperahousetoronto.com',
    parkingNotes: 'Secured rear alley loading dock with dedicated bus pad and 50A hookup. Historic Canadian heavy touring stop.',
    tags: ['toronto', 'ontario', 'canada', 'opera house', 'metal', 'hardcore']
  },
  {
    id: 'bb_v_tor_2',
    name: 'The Velvet Underground',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    streetAddress: '508 Queen St W',
    fullAddress: '508 Queen St W, Toronto, ON M5V 2B3, Canada',
    capacity: 355,
    payoutRating: 4.9,
    loadInRating: 4.4,
    genreFit: 96,
    source: 'blackbook',
    displayText: 'Velvet Underground • Toronto, ON (Cap: 355)',
    contactName: 'Embrace Presents / Velvet Desk',
    contactPhone: '(416) 504-6688',
    contactEmail: 'booking@thevelvet.ca',
    parkingNotes: 'Queen St W curbside commercial loading. Top-tier intimate club sound system.',
    tags: ['toronto', 'ontario', 'canada', 'velvet underground', 'queen west', 'metal', 'indie']
  },
  {
    id: 'bb_v_tor_3',
    name: 'Hard Luck Bar',
    city: 'Toronto',
    state: 'ON',
    country: 'Canada',
    streetAddress: '772A Dundas St W',
    fullAddress: '772A Dundas St W, Toronto, ON M6J 1V1, Canada',
    capacity: 200,
    payoutRating: 4.7,
    loadInRating: 4.2,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Hard Luck Bar • Toronto, ON (Cap: 200)',
    contactName: 'Mark Pesci / Booking',
    contactPhone: '(416) 703-7722',
    contactEmail: 'hardluckbar@gmail.com',
    parkingNotes: 'Dundas St W loading. Intimate heavy metal, punk, and hardcore stronghold.',
    tags: ['toronto', 'ontario', 'canada', 'hard luck bar', 'underground', 'diy', 'metal']
  },
  {
    id: 'bb_v_mtl_1',
    name: 'Les Foufounes Électriques',
    city: 'Montreal',
    state: 'QC',
    country: 'Canada',
    streetAddress: '87 Rue Sainte-Catherine E',
    fullAddress: '87 Rue Sainte-Catherine E, Montréal, QC H2X 1K5, Canada',
    capacity: 650,
    payoutRating: 5.0,
    loadInRating: 4.6,
    genreFit: 100,
    source: 'blackbook',
    displayText: 'Foufounes Électriques • Montreal, QC (Cap: 650)',
    contactName: 'Production & Programmation Foufs',
    contactPhone: '(514) 844-0428',
    contactEmail: 'booking@foufouneselectriques.com',
    parkingNotes: 'Direct rear alley loading dock on Rue Sainte-Elisabeth. World-famous punk and metal institution.',
    tags: ['montreal', 'quebec', 'canada', 'foufounes', 'foufs', 'metal', 'punk']
  }
];

export const GOOGLE_MAPS_API_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_MAPS_API_KEY) ||
  'AIzaSyDI0NWyHExs2pWEc9UIoe3y-luHdhqcbGg';

let isScriptLoading = false;
let isScriptLoaded = false;

// Initialize Google Maps script using the new modern loading pattern
export const initGooglePlacesScript = (): Promise<boolean> => {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if ((window as any).google?.maps) {
    isScriptLoaded = true;
    return Promise.resolve(true);
  }
  if (isScriptLoaded) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existingScript = document.getElementById('google-maps-places-sdk');
    if (existingScript) {
      if ((window as any).google?.maps) {
        isScriptLoaded = true;
        resolve(true);
      } else {
        existingScript.addEventListener('load', () => {
          isScriptLoaded = true;
          resolve(true);
        });
        existingScript.addEventListener('error', () => resolve(false));
      }
      return;
    }

    if (isScriptLoading) {
      const checkInterval = setInterval(() => {
        if ((window as any).google?.maps) {
          clearInterval(checkInterval);
          isScriptLoaded = true;
          resolve(true);
        }
      }, 100);
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(false);
      }, 5000);
      return;
    }

    isScriptLoading = true;
    const script = document.createElement('script');
    script.id = 'google-maps-places-sdk';
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&v=weekly&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      isScriptLoading = false;
      isScriptLoaded = true;
      resolve(true);
    };
    script.onerror = () => {
      isScriptLoading = false;
      resolve(false);
    };
    document.head.appendChild(script);
  });
};

// Fetch all aggregated local Black Book venues (multi-tier resilient cloud & local storage)
export async function getAllBlackBookVenues(): Promise<VenueResult[]> {
  const aggregated: VenueResult[] = [...BUILT_IN_BLACK_BOOK_VENUES];
  const seenIds = new Set(aggregated.map((v) => v.id.toLowerCase()));
  const seenNames = new Set(aggregated.map((v) => `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`));

  // 1. Fetch live venues from persistent server API endpoint (supports Cloud Run & native APK)
  try {
    const endpoints = getApiFallbackEndpoints('/api/venues');
    for (const ep of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(ep, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.venues) && data.venues.length > 0) {
            data.venues.forEach((v: any) => {
              if (!v?.name) return;
              const key = `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
              if (!seenNames.has(key)) {
                seenNames.add(key);
                const nameSlug = (v.name || 'venue').toLowerCase().replace(/[^a-z0-9]/g, '_');
                const citySlug = (v.city || 'city').toLowerCase().replace(/[^a-z0-9]/g, '_');
                const vId = (v.id && typeof v.id === 'string' && v.id.trim().length > 0 && v.id !== 'undefined' && v.id !== 'null')
                  ? v.id
                  : `srv_${nameSlug}_${citySlug}_${Math.random().toString(36).substring(2, 7)}`;
                if (!seenIds.has(vId.toLowerCase())) {
                  seenIds.add(vId.toLowerCase());
                  aggregated.push({
                    id: vId,
                    name: v.name,
                    city: v.city,
                    state: v.state_province || v.state,
                    country: v.country || 'USA',
                    streetAddress: v.street_address || v.address,
                    fullAddress: [v.street_address || v.address, v.city, v.state_province || v.state].filter(Boolean).join(', '),
                    capacity: v.capacity,
                    payoutRating: v.payout_rating || v.payoutRating || 4.5,
                    loadInRating: v.load_in_rating || v.loadInRating || 4.0,
                    genreFit: v.genre_fit || v.genreFit || 90,
                    source: 'blackbook',
                    displayText: `${v.name}${v.city ? ` • ${v.city}${v.state_province || v.state ? `, ${v.state_province || v.state}` : ''}` : ''}${v.capacity ? ` (Cap: ${v.capacity})` : ''}`
                  });
                }
              }
            });
            break; // Stop after first successful response
          }
        }
      } catch (_) {}
    }
  } catch (_) {}

  // 2. Check IndexedDB venuesStore
  try {
    const stored = await venuesStore.getItem<any>('nexus_master_venues');
    let dbVenues: any[] = [];
    if (stored) {
      dbVenues = typeof stored === 'string' ? JSON.parse(stored) : stored;
    }
    if (Array.isArray(dbVenues)) {
      dbVenues.forEach((v) => {
        if (!v?.name) return;
        const key = `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
        if (!seenNames.has(key)) {
          seenNames.add(key);
          const nameSlug = (v.name || 'venue').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const citySlug = (v.city || 'city').toLowerCase().replace(/[^a-z0-9]/g, '_');
          const vId = (v.id && typeof v.id === 'string' && v.id.trim().length > 0 && v.id !== 'undefined' && v.id !== 'null')
            ? v.id
            : `db_${nameSlug}_${citySlug}_${Math.random().toString(36).substring(2, 7)}`;
          if (!seenIds.has(vId.toLowerCase())) {
            seenIds.add(vId.toLowerCase());
            aggregated.push({
              id: vId,
              name: v.name,
              city: v.city,
              state: v.state,
              country: v.country || 'USA',
              streetAddress: v.street_address || v.address,
              fullAddress: [v.street_address || v.address, v.city, v.state].filter(Boolean).join(', '),
              capacity: v.capacity,
              payoutRating: v.payoutRating || 4.5,
              loadInRating: v.loadInRating || 4.0,
              genreFit: v.genreFit || 90,
              source: 'blackbook',
              displayText: `${v.name}${v.city ? ` • ${v.city}${v.state ? `, ${v.state}` : ''}` : ''}${v.capacity ? ` (Cap: ${v.capacity})` : ''}`
            });
          }
        }
      });
    }
  } catch (_) {}

  // 3. Check localStorage nexus_core_venues
  try {
    const local = localStorage.getItem('nexus_core_venues');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) {
        parsed.forEach((v) => {
          if (!v?.name) return;
          const key = `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            const nameSlug = (v.name || 'venue').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const citySlug = (v.city || 'city').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const vId = (v.id && typeof v.id === 'string' && v.id.trim().length > 0 && v.id !== 'undefined' && v.id !== 'null')
              ? v.id
              : `loc_${nameSlug}_${citySlug}_${Math.random().toString(36).substring(2, 7)}`;
            if (!seenIds.has(vId.toLowerCase())) {
              seenIds.add(vId.toLowerCase());
              aggregated.push({
                id: vId,
                name: v.name,
                city: v.city,
                state: v.state,
                country: v.country || 'USA',
                streetAddress: v.street_address || v.address,
                fullAddress: [v.street_address || v.address, v.city, v.state].filter(Boolean).join(', '),
                capacity: v.capacity,
                payoutRating: v.payoutRating || 4.5,
                loadInRating: v.loadInRating || 4.0,
                genreFit: v.genreFit || 90,
                source: 'blackbook',
                displayText: `${v.name}${v.city ? ` • ${v.city}${v.state ? `, ${v.state}` : ''}` : ''}${v.capacity ? ` (Cap: ${v.capacity})` : ''}`
              });
            }
          }
        });
      }
    }
  } catch (_) {}

  // 4. Check localStorage nexus_musicbrainz_venues (Tour Hubs seeded via MusicBrainz)
  try {
    const mbRaw = localStorage.getItem('nexus_musicbrainz_venues');
    if (mbRaw) {
      const parsed = JSON.parse(mbRaw);
      if (Array.isArray(parsed)) {
        parsed.forEach((v: any) => {
          if (!v?.name) return;
          const key = `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            const nameSlug = (v.name || 'venue').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const citySlug = (v.city || 'city').toLowerCase().replace(/[^a-z0-9]/g, '_');
            const vId = (v.id && typeof v.id === 'string' && v.id.trim().length > 0 && v.id !== 'undefined' && v.id !== 'null')
              ? v.id
              : `mb_${nameSlug}_${citySlug}_${Math.random().toString(36).substring(2, 7)}`;
            if (!seenIds.has(vId.toLowerCase())) {
              seenIds.add(vId.toLowerCase());
              aggregated.push({
                id: vId,
                name: v.name,
                city: v.city,
                state: v.state_province || v.state || 'USA',
                country: v.country || 'USA',
                streetAddress: v.street_address || v.address,
                fullAddress: [v.street_address || v.address, v.city, v.state_province || v.state].filter(Boolean).join(', '),
                capacity: v.capacity || 350,
                payoutRating: v.payout_rating || v.payoutRating || 4.5,
                loadInRating: v.load_in_rating || v.loadInRating || 4.0,
                genreFit: v.genre_fit || v.genreFit || 85,
                source: 'blackbook',
                displayText: `${v.name}${v.city ? ` • ${v.city}${v.state_province || v.state ? `, ${v.state_province || v.state}` : ''}` : ''}${v.capacity ? ` (Cap: ${v.capacity})` : ''}`
              });
            }
          }
        });
      }
    }
  } catch (_) {}

  return aggregated;
}

// Search Black Book venues
export async function searchBlackBookVenues(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length === 0) return [];
  const rawQ = query.toLowerCase().trim();
  const cleanQ = rawQ.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').trim();
  const qTokens = cleanQ.split(' ').filter(Boolean);

  const isStLouisQuery = rawQ.includes('louis') || rawQ.includes('stl') || cleanQ.includes('st louis') || cleanQ.includes('saint louis') || rawQ.includes('sauget');
  const isNycQuery = rawQ === 'nyc' || cleanQ.includes('new york') || cleanQ.includes('brooklyn') || cleanQ.includes('manhattan') || cleanQ.includes('queens');
  const isLaQuery = rawQ === 'la' || cleanQ.includes('los angeles') || cleanQ.includes('hollywood') || cleanQ.includes('anaheim');
  const isPhxQuery = rawQ === 'phx' || cleanQ.includes('phoenix') || cleanQ.includes('tempe') || cleanQ.includes('mesa');
  const isDfwQuery = rawQ === 'dfw' || cleanQ.includes('dallas') || cleanQ.includes('fort worth') || cleanQ.includes('haltom');
  const isBayAreaQuery = rawQ === 'sf' || cleanQ.includes('san francisco') || cleanQ.includes('oakland') || cleanQ.includes('berkeley');
  const isSlcQuery = rawQ === 'slc' || cleanQ.includes('salt lake');
  const isKcQuery = rawQ === 'kc' || cleanQ.includes('kansas city') || cleanQ.includes('lawrence');
  const isMspQuery = rawQ === 'msp' || cleanQ.includes('minneapolis') || cleanQ.includes('st paul') || cleanQ.includes('saint paul');

  const all = await getAllBlackBookVenues();

  return all
    .filter((v) => {
      const vName = (v.name || '').toLowerCase();
      const vCity = (v.city || '').toLowerCase();
      const vState = (v.state || '').toLowerCase();
      const vFull = (v.fullAddress || v.streetAddress || '').toLowerCase();
      const vTags = (v.tags || []).map(t => t.toLowerCase());

      if (isStLouisQuery && (vCity.includes('louis') || vCity.includes('sauget') || vTags.some(t => t.includes('louis') || t.includes('sauget')))) return true;
      if (isNycQuery && (vCity.includes('new york') || vCity.includes('brooklyn') || vCity.includes('queens') || vTags.some(t => t.includes('york') || t.includes('brooklyn')))) return true;
      if (isLaQuery && (vCity.includes('los angeles') || vCity.includes('anaheim') || vTags.some(t => t.includes('angeles') || t.includes('anaheim')))) return true;
      if (isPhxQuery && (vCity.includes('phoenix') || vCity.includes('tempe') || vCity.includes('mesa') || vTags.some(t => t.includes('phoenix')))) return true;
      if (isDfwQuery && (vCity.includes('dallas') || vCity.includes('fort worth') || vCity.includes('denton') || vCity.includes('haltom'))) return true;
      if (isBayAreaQuery && (vCity.includes('san francisco') || vCity.includes('berkeley') || vCity.includes('oakland'))) return true;
      if (isSlcQuery && vCity.includes('salt lake')) return true;
      if (isKcQuery && (vCity.includes('kansas city') || vCity.includes('lawrence'))) return true;
      if (isMspQuery && (vCity.includes('minneapolis') || vCity.includes('paul'))) return true;

      const searchable = `${vName} ${vCity} ${vState} ${vFull} ${vTags.join(' ')}`.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').replace(/\s+/g, ' ').toLowerCase();
      if (searchable.includes(cleanQ)) return true;
      if (qTokens.length > 1 && qTokens.every(tok => searchable.includes(tok))) return true;

      return false;
    })
    .slice(0, 12);
}

// Search Places API (New) via REST
export async function searchPlacesApiNew(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length < 2 || !GOOGLE_MAPS_API_KEY) return [];

  try {
    const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_MAPS_API_KEY
      },
      body: JSON.stringify({
        input: query.trim()
      })
    });

    if (!res.ok) {
      return [];
    }

    const data = await res.json();
    const suggestions = data?.suggestions || [];

    return suggestions.map((s: any) => {
      const pred = s.placePrediction;
      const mainText = pred?.structuredFormat?.mainText?.text || pred?.text?.text || query;
      const secondaryText = pred?.structuredFormat?.secondaryText?.text || '';
      const fullText = pred?.text?.text || (secondaryText ? `${mainText}, ${secondaryText}` : mainText);
      const placeId = pred?.placeId || pred?.place || '';

      return {
        id: `gp_${placeId || Math.random().toString(36).substring(2, 9)}`,
        name: mainText,
        fullAddress: fullText,
        placeId,
        source: 'google-places' as const,
        displayText: secondaryText ? `${mainText} • ${secondaryText}` : mainText
      };
    });
  } catch {
    return [];
  }
}

// Search Places API (New) via modern JS SDK (importLibrary)
export async function searchPlacesJsSdk(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const google = (window as any).google;
    if (!google?.maps?.importLibrary) return [];

    const placesLib: any = await google.maps.importLibrary('places');
    if (placesLib?.AutocompleteSuggestion) {
      const resp = await placesLib.AutocompleteSuggestion.fetchAutocompleteSuggestions({
        input: query.trim()
      });
      const suggestions = resp?.suggestions || [];

      return suggestions.map((s: any, idx: number) => {
        const pred = s.placePrediction;
        const mainText = pred?.mainText?.toString() || pred?.text?.toString() || query;
        const secondaryText = pred?.secondaryText?.toString() || '';
        const fullText = pred?.text?.toString() || (secondaryText ? `${mainText}, ${secondaryText}` : mainText);
        const placeId = pred?.placeId || `gp_${idx}`;

        return {
          id: `gp_${placeId}`,
          name: mainText,
          fullAddress: fullText,
          placeId,
          source: 'google-places' as const,
          displayText: secondaryText ? `${mainText} • ${secondaryText}` : mainText
        };
      });
    }
  } catch {
    // fallback
  }

  return [];
}

// OpenStreetMap / Photon live geocoding fallback for venues & establishments
export async function searchPhotonVenues(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(`https://photon.komoot.io/api/?q=${encodeURIComponent(query.trim())}&limit=5`);
    if (!res.ok) return [];

    const data = await res.json();
    const features = data?.features || [];

    return features.map((f: any, idx: number) => {
      const p = f.properties || {};
      const name = p.name || query;
      const city = p.city || p.county || p.state || '';
      const state = p.state || p.country || '';
      const street = p.street ? `${p.housenumber ? p.housenumber + ' ' : ''}${p.street}` : '';
      const full = [street, city, state, p.country].filter(Boolean).join(', ');

      return {
        id: `osm_${p.osm_id || idx}`,
        name,
        city,
        state,
        country: p.country,
        streetAddress: street,
        fullAddress: full || name,
        source: 'google-places' as const,
        displayText: city || state ? `${name} • ${[city, state].filter(Boolean).join(', ')}` : name
      };
    });
  } catch {
    return [];
  }
}

// Unified Venue Search (Black Book directory first, complemented by Places API New + fallback)
export async function searchVenues(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.trim();

  // 1. Search Black Book
  const blackBookResults = await searchBlackBookVenues(cleanQ);

  // 2. Search Places API (New) if query is 2+ chars
  let externalPlacesResults: VenueResult[] = [];
  if (cleanQ.length >= 2) {
    // Try Places API (New) REST first
    externalPlacesResults = await searchPlacesApiNew(cleanQ);

    // If REST returned empty, try JS SDK
    if (externalPlacesResults.length === 0) {
      externalPlacesResults = await searchPlacesJsSdk(cleanQ);
    }

    // If still empty, fallback to Photon OSM
    if (externalPlacesResults.length === 0) {
      externalPlacesResults = await searchPhotonVenues(cleanQ);
    }
  }

  const seenKeys = new Set<string>();
  const combined: VenueResult[] = [];

  // Add Black Book matches first
  blackBookResults.forEach((v) => {
    const key = v.name.toLowerCase().trim();
    seenKeys.add(key);
    combined.push(v);
  });

  // Add Google Places / external matches
  externalPlacesResults.forEach((v) => {
    const key = v.name.toLowerCase().trim();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      combined.push(v);
    }
  });

  return combined;
}

/**
 * Check if a venue is already registered in the Black Book directory
 */
export async function isVenueInBlackBook(venueName: string, city?: string): Promise<boolean> {
  if (!venueName || !venueName.trim()) return false;
  const match = await findBlackBookVenue(venueName, city);
  return !!match;
}

/**
 * Locate a Black Book venue by name and optional city match
 */
export async function findBlackBookVenue(venueName: string, city?: string): Promise<VenueResult | null> {
  if (!venueName || !venueName.trim()) return null;
  const cleanName = venueName.trim().toLowerCase();
  const cleanCity = city?.trim().toLowerCase();
  const all = await getAllBlackBookVenues();

  // Exact or near match
  const found = all.find(v => {
    const nameMatch = v.name.toLowerCase() === cleanName || v.name.toLowerCase().includes(cleanName) || cleanName.includes(v.name.toLowerCase());
    if (!nameMatch) return false;
    if (cleanCity && v.city) {
      return v.city.toLowerCase() === cleanCity || v.city.toLowerCase().includes(cleanCity) || cleanCity.includes(v.city.toLowerCase());
    }
    return true;
  });

  return found || null;
}

/**
 * Seamlessly save a new venue into the Black Book directory
 * Updates localStorage (nexus_core_venues & nexus_venue_custom_overrides) and broadcasts sync event
 */
export function saveVenueToBlackBook(venueData: {
  name: string;
  city: string;
  state?: string;
  country?: string;
  address?: string;
  streetAddress?: string;
  capacity?: number;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  parkingNotes?: string;
}): VenueResult {
  const venueId = `v_bb_${Date.now()}`;
  const fullAddress = [venueData.address || venueData.streetAddress, venueData.city, venueData.state].filter(Boolean).join(', ');
  
  const newVenueRecord: any = {
    id: venueId,
    name: venueData.name.trim(),
    city: venueData.city.trim(),
    state: venueData.state?.trim() || 'USA',
    state_province: venueData.state?.trim() || 'USA',
    country: venueData.country || 'USA',
    place_type: 'venue',
    address: venueData.address || venueData.streetAddress || fullAddress,
    street_address: venueData.streetAddress || venueData.address || '',
    website: venueData.website?.trim() || '',
    capacity: venueData.capacity || 500,
    email: venueData.contactEmail || '',
    buyers: venueData.contactName || 'Production / Booking Dept.',
    phone: venueData.contactPhone || '',
    genre_fit: 90,
    genreFit: 90,
    payout_rating: 4.8,
    payoutRating: 4.8,
    load_in_rating: 4.5,
    loadInRating: 4.5,
    intel_entries: venueData.parkingNotes ? [venueData.parkingNotes] : ['Imported from Tour Manager show routing.'],
    intelEntries: venueData.parkingNotes ? [venueData.parkingNotes] : ['Imported from Tour Manager show routing.'],
    source: 'blackbook'
  };

  // 1. Persist to localStorage nexus_core_venues
  try {
    const raw = localStorage.getItem('nexus_core_venues');
    const existing = raw ? JSON.parse(raw) : [];
    if (Array.isArray(existing)) {
      const filtered = existing.filter((v: any) => 
        v.name?.toLowerCase().trim() !== newVenueRecord.name.toLowerCase().trim() ||
        (v.city && newVenueRecord.city && v.city.toLowerCase().trim() !== newVenueRecord.city.toLowerCase().trim())
      );
      localStorage.setItem('nexus_core_venues', JSON.stringify([newVenueRecord, ...filtered]));
    } else {
      localStorage.setItem('nexus_core_venues', JSON.stringify([newVenueRecord]));
    }
  } catch (err) {
    console.warn('Failed to save venue to nexus_core_venues:', err);
  }

  // 2. Persist to overrides map
  try {
    const overridesStr = localStorage.getItem('nexus_venue_custom_overrides');
    const overrides = overridesStr ? JSON.parse(overridesStr) : {};
    overrides[venueId] = newVenueRecord;
    localStorage.setItem('nexus_venue_custom_overrides', JSON.stringify(overrides));
  } catch {}

  // 3. Persist to server API endpoint (sync across preview, web & APK)
  try {
    fetch('/api/venues', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ venue: newVenueRecord })
    }).catch(() => {});
  } catch (_) {}

  // 4. Broadcast window event so Black Book tabs refresh live
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('nexus_venues_updated', { detail: newVenueRecord }));
  }

  return {
    id: venueId,
    name: newVenueRecord.name,
    city: newVenueRecord.city,
    state: newVenueRecord.state,
    country: newVenueRecord.country,
    streetAddress: newVenueRecord.street_address,
    fullAddress: newVenueRecord.address,
    capacity: newVenueRecord.capacity,
    payoutRating: 4.8,
    loadInRating: 4.5,
    genreFit: 90,
    source: 'blackbook',
    displayText: `${newVenueRecord.name} • ${newVenueRecord.city}${newVenueRecord.state ? `, ${newVenueRecord.state}` : ''}${newVenueRecord.capacity ? ` (Cap: ${newVenueRecord.capacity})` : ''}`
  };
}
