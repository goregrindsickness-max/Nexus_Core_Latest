import { venuesStore } from '../utils/indexedDB';

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

// Fetch all aggregated local Black Book venues
export async function getAllBlackBookVenues(): Promise<VenueResult[]> {
  const aggregated: VenueResult[] = [...BUILT_IN_BLACK_BOOK_VENUES];
  const seenIds = new Set(aggregated.map((v) => v.id.toLowerCase()));
  const seenNames = new Set(aggregated.map((v) => `${v.name.toLowerCase()}_${(v.city || '').toLowerCase()}`));

  // 1. Check IndexedDB venuesStore
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
          const vId = v.id || `db_${v.name.replace(/\s+/g, '_')}`;
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

  // 2. Check localStorage nexus_core_venues
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
            const vId = v.id || `loc_${v.name.replace(/\s+/g, '_')}`;
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

  return aggregated;
}

// Search Black Book venues
export async function searchBlackBookVenues(query: string): Promise<VenueResult[]> {
  if (!query || query.trim().length === 0) return [];
  const cleanQ = query.toLowerCase().trim();
  const all = await getAllBlackBookVenues();

  return all
    .filter((v) => {
      const nameMatch = v.name.toLowerCase().includes(cleanQ);
      const cityMatch = v.city && v.city.toLowerCase().includes(cleanQ);
      const stateMatch = v.state && v.state.toLowerCase().includes(cleanQ);
      const fullMatch = v.fullAddress && v.fullAddress.toLowerCase().includes(cleanQ);
      return nameMatch || cityMatch || stateMatch || fullMatch;
    })
    .slice(0, 6);
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

  // 3. Broadcast window event so Black Book tabs refresh live
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
