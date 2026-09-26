// Tour Package Sync & Multi-Tour Management Module
import { supabase } from './supabaseClient';

export interface TourVehicle {
  id: string;
  name: string; // e.g. "Lead Tour Sleeper Bus (Prevost H3)", "16ft Dual-Axle Cargo Trailer", "Support Band Mercedes Sprinter 3500"
  type: 'sleeper_bus' | 'sprinter' | 'passenger_van' | 'cargo_trailer' | 'box_truck' | 'car';
  licensePlate?: string;
  driverName?: string;
  driverPhone?: string;
  assignedBands?: string[]; // IDs or names of bands traveling in this vehicle
  capacityPax?: number;
  cargoNotes?: string;
  shorePowerReq?: string;
  status?: 'active' | 'in_repair' | 'backup';
  notes?: string;
}

export interface SharedBacklineConfig {
  drumKitNotes: string;
  drumProviderBandId?: string;
  drumSupportRules?: string;
  bassRigNotes: string;
  bassProviderBandId?: string;
  bassSupportRules?: string;
  trailerNotes: string;
  guitarCabNotes?: string;
  paMonitorsNotes?: string;
  stagePlotNotes?: string;
}

export interface TourPackageBand {
  id: string;
  name: string;
  role: 'headliner' | 'direct_support' | 'opener' | 'local_support';
  setMinutes: number;
  guarantee: number;
  guaranteeType: 'fixed' | 'percentage';
  percentageSplit?: number;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  sharedGearNotes: string;
  membersCount: number;
  avatarColor: string;
  avatarUrl?: string;
  city?: string;
  assignedVehicleId?: string;
}

export interface TourPackageStop {
  id: string;
  date: string;
  venueName: string;
  city: string;
  state: string;
  capacity?: number;
  status: 'confirmed' | 'advancing' | 'pending' | 'settled';
  loadInTime: string;
  soundcheckTime: string;
  doorsTime: string;
  showStartTime: string;
  curfewTime: string;
  venueContactName: string;
  venueContactPhone: string;
  venueContactEmail: string;
  grossDeal: number;
  merchCutVenuePct: number;
  parkingNotes: string;
  hospitalityNotes: string;
  advancingDone: boolean;
  advancingStatus?: string;
  blackBookVenueId?: string;
  venue_lat?: number;
  venue_lng?: number;
}

export interface TourPackageRecord {
  id: string;
  title: string;
  headlinerClientName: string;
  publicationStatus: 'embargoed_private' | 'confirmed_routing' | 'public_announced';
  embargoUntilDate: string;
  bands: TourPackageBand[];
  stops: TourPackageStop[];
  vehicles: TourVehicle[];
  backlineConfig: SharedBacklineConfig;
  backlineNotes?: {
    drumKitNotes?: string;
    bassRigNotes?: string;
    trailerNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

const LOCAL_STORAGE_KEY_ALL_TOURS = 'tm_all_tour_packages_v2';
const LOCAL_STORAGE_KEY_ACTIVE_TOUR_ID = 'tm_active_tour_package_id_v2';

export const DEFAULT_BACKLINE_CONFIG: SharedBacklineConfig = {
  drumKitNotes: 'Pearl Reference 5-piece Drum Kit provided by Headliner (22" Kick, 10"/12"/14" Toms, DW heavy-duty hardware). Support acts supply snare, cymbals, kick pedal, and throne.',
  drumProviderBandId: 'pkg-b1',
  drumSupportRules: 'No moving rack locks. 15-minute stage turnaround between sets.',
  bassRigNotes: 'Ampeg SVT-CL + 8x10 Stage Rig provided. All bassists patch direct preamp pedals (Darkglass / SansAmp) with DI output to FOH.',
  bassProviderBandId: 'pkg-b1',
  bassSupportRules: 'Direct balanced XLR out required.',
  trailerNotes: '6x12 Dual-Axle Cargo Trailer: Row 1 = Headliner fly-rigs & drum vault; Row 2 = Support guitar cabs; Row 3 = Merch bins & soft luggage.',
  guitarCabNotes: 'Headliner and Direct Support share 2x 4x12 Marshall/Mesa stage cabs. Openers bring compact heads or modelers.',
  paMonitorsNotes: 'In-Ear Monitor transmitters racked in Trailer Rack A. Coordinated wireless frequencies per venue sweep.',
  stagePlotNotes: 'Standard 4-piece heavy package setup with dual guitar stage left/right and centered bass wedge.'
};

export const DEFAULT_SEED_VEHICLES: TourVehicle[] = [
  {
    id: 'veh-1',
    name: 'Lead Sleeper Bus (Prevost H3-45)',
    type: 'sleeper_bus',
    licensePlate: 'OH-TOUR-88',
    driverName: 'Ray Delgado',
    driverPhone: '(555) 391-0492',
    assignedBands: ['Sanguisugabogg', '200 Stab Wounds'],
    capacityPax: 12,
    cargoNotes: 'Tows 16ft heavy cargo trailer. Shore power 50A hookup required.',
    shorePowerReq: '50A 240V Shore Power Drop',
    status: 'active',
    notes: 'Primary crew & artist sleeper bus. Driver sleeper bunk #1.'
  },
  {
    id: 'veh-2',
    name: '16ft Dual-Axle Cargo Trailer',
    type: 'cargo_trailer',
    licensePlate: 'OH-TR-9941',
    driverName: 'Ray Delgado (Towed)',
    driverPhone: '(555) 391-0492',
    assignedBands: ['All Package Bands'],
    capacityPax: 0,
    cargoNotes: 'Heavy stage backline, drum cases, 8x10 bass cab, merch master bins.',
    shorePowerReq: 'None',
    status: 'active',
    notes: 'Ramp door loading. Padlocked hitch lock #4820.'
  },
  {
    id: 'veh-3',
    name: 'Support Band Sprinter 2500 High-Roof',
    type: 'sprinter',
    licensePlate: 'NV-SPR-441',
    driverName: 'Marcus Vance',
    driverPhone: '(555) 620-4491',
    assignedBands: ['Cerebral Incubation'],
    capacityPax: 7,
    cargoNotes: 'Rear partition holds personal cymbals, pedalboards, merch totes.',
    shorePowerReq: '15A standard 110V for trickle charge',
    status: 'active',
    notes: 'Secondary convoy runner van.'
  }
];

// Built-in starter tours for seamless multi-tour workflow
export const SEED_TOURS: TourPackageRecord[] = [
  {
    id: 'tour-pkg-fall-2026',
    title: 'West Coast Heavy Package 2026',
    headlinerClientName: 'Sanguisugabogg',
    publicationStatus: 'embargoed_private',
    embargoUntilDate: '2026-10-01T10:00',
    bands: [
      {
        id: 'pkg-b1',
        name: 'Sanguisugabogg',
        role: 'headliner',
        setMinutes: 60,
        guarantee: 2200,
        guaranteeType: 'percentage',
        percentageSplit: 50,
        contactName: 'Devin Swank',
        contactPhone: '(555) 847-2931',
        contactEmail: 'boggmgmt@gmail.com',
        sharedGearNotes: 'Provides complete 8x10 Bass Cab & Pearl Drum shell kit. IEM rack in Trailer Rack A.',
        membersCount: 4,
        avatarColor: 'from-amber-600 to-yellow-950',
        city: 'Columbus, OH'
      },
      {
        id: 'pkg-b2',
        name: '200 Stab Wounds',
        role: 'direct_support',
        setMinutes: 45,
        guarantee: 1200,
        guaranteeType: 'percentage',
        percentageSplit: 30,
        contactName: 'Steve Buhl',
        contactPhone: '(555) 392-4419',
        contactEmail: '200swmgmt@gmail.com',
        sharedGearNotes: 'Shares bass cab & kick drum shells. Brings own dual 4x12 guitar cabs and pedalboards.',
        membersCount: 4,
        avatarColor: 'from-purple-600 to-indigo-950',
        city: 'Cleveland, OH'
      },
      {
        id: 'pkg-b3',
        name: 'Cerebral Incubation',
        role: 'opener',
        setMinutes: 35,
        guarantee: 700,
        guaranteeType: 'percentage',
        percentageSplit: 20,
        contactName: 'Andrew Baird',
        contactPhone: '(555) 620-4491',
        contactEmail: 'cerebralmgmt@yahoo.com',
        sharedGearNotes: 'Uses headliner drum kit shells (brings cymbals, snare, kick pedal).',
        membersCount: 4,
        avatarColor: 'from-rose-600 to-red-950',
        city: 'Las Vegas, NV'
      }
    ],
    stops: [
      {
        id: 'pkg-s1',
        date: '2026-10-15',
        venueName: 'The Belasco Theater',
        city: 'Los Angeles',
        state: 'CA',
        capacity: 1500,
        status: 'confirmed',
        loadInTime: '15:00',
        soundcheckTime: '16:30',
        doorsTime: '19:00',
        showStartTime: '19:45',
        curfewTime: '23:30',
        venueContactName: 'Marcus Vance (Production PM)',
        venueContactPhone: '(213) 555-0182',
        venueContactEmail: 'production@thebelasco.com',
        grossDeal: 4500,
        merchCutVenuePct: 15,
        parkingNotes: 'Back alley loading dock accommodates 1 Tour Bus + 16ft Cargo Trailer. Shore power 50A available.',
        hospitalityNotes: 'Catering buyouts $25/head for 12 crew/members. Hot vegan options requested.',
        advancingDone: true
      },
      {
        id: 'pkg-s2',
        date: '2026-10-16',
        venueName: 'The Catalyst',
        city: 'Santa Cruz',
        state: 'CA',
        capacity: 800,
        status: 'confirmed',
        loadInTime: '15:30',
        soundcheckTime: '17:00',
        doorsTime: '19:30',
        showStartTime: '20:00',
        curfewTime: '00:00',
        venueContactName: 'Sarah Jenkins',
        venueContactPhone: '(831) 555-0142',
        venueContactEmail: 'prod@catalystclub.com',
        grossDeal: 3800,
        merchCutVenuePct: 10,
        parkingNotes: 'Rear lot parking pass issued upon load-in arrival.',
        hospitalityNotes: 'Direct merch sales table in main hall atrium.',
        advancingDone: true
      },
      {
        id: 'pkg-s3',
        date: '2026-10-17',
        venueName: 'Great American Music Hall',
        city: 'San Francisco',
        state: 'CA',
        capacity: 600,
        status: 'advancing',
        loadInTime: '16:00',
        soundcheckTime: '17:30',
        doorsTime: '19:30',
        showStartTime: '20:15',
        curfewTime: '23:45',
        venueContactName: 'Dave Miller',
        venueContactPhone: '(415) 555-0188',
        venueContactEmail: 'sound@gamh.com',
        grossDeal: 3500,
        merchCutVenuePct: 10,
        parkingNotes: "O'Farrell St loading zone reserved. Call TM upon 15 min ETA.",
        hospitalityNotes: 'Historic venue with balcony. Sound dB limit 104dBA at FOH.',
        advancingDone: true
      }
    ],
    vehicles: DEFAULT_SEED_VEHICLES,
    backlineConfig: DEFAULT_BACKLINE_CONFIG,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'tour-pkg-europe-summer',
    title: 'European Festival & Club Siege 2026',
    headlinerClientName: 'Virulent Excision',
    publicationStatus: 'confirmed_routing',
    embargoUntilDate: '2026-11-15T12:00',
    bands: [
      {
        id: 'pkg-ve1',
        name: 'Virulent Excision',
        role: 'headliner',
        setMinutes: 50,
        guarantee: 3000,
        guaranteeType: 'percentage',
        percentageSplit: 60,
        contactName: 'Tour Director',
        contactPhone: '(555) 777-0100',
        contactEmail: 'tour@virulentexcision.com',
        sharedGearNotes: 'Full backline flyer pack + 230V stepdown transformers in Fly-Rig A.',
        membersCount: 4,
        avatarColor: 'from-emerald-600 to-green-950',
        city: 'Chicago, IL'
      },
      {
        id: 'pkg-ve2',
        name: 'Defeated Sanity',
        role: 'direct_support',
        setMinutes: 45,
        guarantee: 2000,
        guaranteeType: 'percentage',
        percentageSplit: 40,
        contactName: 'Lille Gruber',
        contactPhone: '+49 170 555 9182',
        contactEmail: 'dsbooking@gmail.com',
        sharedGearNotes: 'Provides European standard 4x12 cabs.',
        membersCount: 4,
        avatarColor: 'from-cyan-600 to-blue-950',
        city: 'Berlin, DE'
      }
    ],
    stops: [
      {
        id: 'pkg-eu1',
        date: '2026-11-20',
        venueName: 'Turock Essen',
        city: 'Essen',
        state: 'NRW',
        capacity: 650,
        status: 'confirmed',
        loadInTime: '15:00',
        soundcheckTime: '16:30',
        doorsTime: '19:00',
        showStartTime: '20:00',
        curfewTime: '23:00',
        venueContactName: 'Klaus Meier',
        venueContactPhone: '+49 201 555 010',
        venueContactEmail: 'booking@turock.de',
        grossDeal: 4000,
        merchCutVenuePct: 0,
        parkingNotes: 'Direct venue parking pass for Sprinter Van.',
        hospitalityNotes: 'Catering provided backstage (vegan + gluten free options included).',
        advancingDone: true
      }
    ],
    vehicles: [
      {
        id: 'veh-eu1',
        name: 'Euro-Touring 9-Seater Sprinter',
        type: 'sprinter',
        licensePlate: 'B-EX-9920',
        driverName: 'Hans Becker',
        driverPhone: '+49 171 4920 182',
        assignedBands: ['Virulent Excision', 'Defeated Sanity'],
        capacityPax: 9,
        cargoNotes: 'Extended cargo bay with fly-rigs and European 230V cabs.',
        shorePowerReq: 'CEE 16A Blue 230V Plug',
        status: 'active',
        notes: 'Equipped with European toll transponders.'
      }
    ],
    backlineConfig: {
      ...DEFAULT_BACKLINE_CONFIG,
      drumKitNotes: 'Turock House Kit (Tama Starclassic 22/10/12/16) used for backline. Bands bring own breakables.',
      bassRigNotes: 'Ampeg SVT-CL 8x10 provided by venue.',
      trailerNotes: 'All flight cases loaded in rear van compartment.'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class TourPackageManagerService {
  private memoryTours: TourPackageRecord[] = [];
  private activeTourId: string = 'tour-pkg-fall-2026';
  private hasInitialized: boolean = false;
  private syncDebounceTimers: Map<string, any> = new Map();

  constructor() {
    this.init();
  }

  private normalizeTour(raw: any): TourPackageRecord {
    const dataObj = raw.data || raw.payload || {};
    return {
      id: raw.id || dataObj.id || `tour-${Date.now()}`,
      title: raw.title || dataObj.title || 'Tour Package Workspace',
      headlinerClientName: raw.headlinerClientName || raw.headliner_client_name || dataObj.headlinerClientName || dataObj.headliner_client_name || 'Headliner Band',
      publicationStatus: raw.publicationStatus || raw.publication_status || dataObj.publicationStatus || dataObj.publication_status || 'embargoed_private',
      embargoUntilDate: raw.embargoUntilDate || raw.embargo_until_date || dataObj.embargoUntilDate || dataObj.embargo_until_date || new Date().toISOString().slice(0, 16),
      bands: Array.isArray(raw.bands) ? raw.bands : (Array.isArray(dataObj.bands) ? dataObj.bands : []),
      stops: Array.isArray(raw.stops) ? raw.stops : (Array.isArray(dataObj.stops) ? dataObj.stops : []),
      vehicles: Array.isArray(raw.vehicles) && raw.vehicles.length > 0 
        ? raw.vehicles 
        : (Array.isArray(dataObj.vehicles) && dataObj.vehicles.length > 0 ? dataObj.vehicles : [...DEFAULT_SEED_VEHICLES]),
      backlineConfig: raw.backlineConfig || raw.backline_config || dataObj.backlineConfig || dataObj.backline_config || {
        ...DEFAULT_BACKLINE_CONFIG,
        drumKitNotes: raw.backlineNotes?.drumKitNotes || dataObj.backlineNotes?.drumKitNotes || DEFAULT_BACKLINE_CONFIG.drumKitNotes,
        bassRigNotes: raw.backlineNotes?.bassRigNotes || dataObj.backlineNotes?.bassRigNotes || DEFAULT_BACKLINE_CONFIG.bassRigNotes,
        trailerNotes: raw.backlineNotes?.trailerNotes || dataObj.backlineNotes?.trailerNotes || DEFAULT_BACKLINE_CONFIG.trailerNotes
      },
      createdAt: raw.createdAt || raw.created_at || dataObj.createdAt || dataObj.created_at || new Date().toISOString(),
      updatedAt: raw.updatedAt || raw.updated_at || dataObj.updatedAt || dataObj.updated_at || new Date().toISOString()
    };
  }

  private init() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ALL_TOURS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryTours = parsed.map(t => this.normalizeTour(t));
        } else {
          this.memoryTours = SEED_TOURS.map(t => this.normalizeTour(t));
          this.saveToLocal();
        }
      } else {
        this.memoryTours = SEED_TOURS.map(t => this.normalizeTour(t));
        this.saveToLocal();
      }

      const activeId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_TOUR_ID);
      if (activeId && this.memoryTours.some(t => t.id === activeId)) {
        this.activeTourId = activeId;
      } else if (this.memoryTours.length > 0) {
        this.activeTourId = this.memoryTours[0].id;
      }
    } catch {
      this.memoryTours = SEED_TOURS.map(t => this.normalizeTour(t));
    }
    this.hasInitialized = true;
  }

  public getAllTours(): TourPackageRecord[] {
    if (!this.hasInitialized) this.init();
    return [...this.memoryTours];
  }

  public getActiveTour(): TourPackageRecord {
    if (!this.hasInitialized) this.init();
    const tour = this.memoryTours.find(t => t.id === this.activeTourId);
    return tour || this.memoryTours[0] || SEED_TOURS[0];
  }

  public setActiveTourId(id: string) {
    if (this.memoryTours.some(t => t.id === id)) {
      this.activeTourId = id;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_TOUR_ID, id);
      } catch {}
      this.notifyChanges();
    }
  }

  public async saveTour(tour: TourPackageRecord, immediateSync = false): Promise<TourPackageRecord> {
    const updatedTour: TourPackageRecord = this.normalizeTour({
      ...tour,
      updatedAt: new Date().toISOString()
    });

    const index = this.memoryTours.findIndex(t => t.id === tour.id);
    if (index >= 0) {
      this.memoryTours[index] = updatedTour;
    } else {
      this.memoryTours.push(updatedTour);
    }

    this.saveToLocal();
    this.notifyChanges();

    // Debounced async sync to Supabase table `tour_packages` (400ms throttle)
    if (this.syncDebounceTimers.has(tour.id)) {
      clearTimeout(this.syncDebounceTimers.get(tour.id));
    }

    if (immediateSync) {
      this.syncDebounceTimers.delete(tour.id);
      this.syncToCloud(updatedTour);
    } else {
      const timer = setTimeout(() => {
        this.syncDebounceTimers.delete(tour.id);
        this.syncToCloud(updatedTour);
      }, 400);
      this.syncDebounceTimers.set(tour.id, timer);
    }

    return updatedTour;
  }

  public createNewTour(title: string, headlinerClientName: string): TourPackageRecord {
    const newId = `tour-pkg-${Date.now()}`;
    const newTour: TourPackageRecord = {
      id: newId,
      title: title || 'New Headline Tour 2026',
      headlinerClientName: headlinerClientName || 'Sanguisugabogg',
      publicationStatus: 'embargoed_private',
      embargoUntilDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 16),
      bands: [
        {
          id: `pkg-b-${Date.now()}-1`,
          name: headlinerClientName || 'Sanguisugabogg',
          role: 'headliner',
          setMinutes: 60,
          guarantee: 2000,
          guaranteeType: 'percentage',
          percentageSplit: 50,
          contactName: 'Tour Director',
          contactPhone: '',
          contactEmail: '',
          sharedGearNotes: 'Provides drum shells & bass cab.',
          membersCount: 4,
          avatarColor: 'from-amber-600 to-yellow-950',
          city: 'USA'
        }
      ],
      stops: [],
      vehicles: [...DEFAULT_SEED_VEHICLES],
      backlineConfig: { ...DEFAULT_BACKLINE_CONFIG },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.memoryTours.unshift(newTour);
    this.activeTourId = newId;
    this.saveToLocal();
    this.notifyChanges();
    this.syncToCloud(newTour);
    return newTour;
  }

  public duplicateTour(sourceTourId: string, newTitle?: string): TourPackageRecord | null {
    const source = this.memoryTours.find(t => t.id === sourceTourId);
    if (!source) return null;

    const clonedId = `tour-pkg-clone-${Date.now()}`;
    const clonedTour: TourPackageRecord = {
      ...source,
      id: clonedId,
      title: newTitle || `${source.title} (Copy)`,
      publicationStatus: 'embargoed_private',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.memoryTours.unshift(clonedTour);
    this.activeTourId = clonedId;
    this.saveToLocal();
    this.notifyChanges();
    this.syncToCloud(clonedTour);
    return clonedTour;
  }

  public deleteTour(tourId: string): boolean {
    if (this.memoryTours.length <= 1) {
      return false; // Prevent deleting last remaining tour
    }
    this.memoryTours = this.memoryTours.filter(t => t.id !== tourId);
    if (this.activeTourId === tourId) {
      this.activeTourId = this.memoryTours[0].id;
    }
    this.saveToLocal();
    this.notifyChanges();
    this.deleteFromCloud(tourId);
    return true;
  }

  // Cloud Database Sync Methods (Multi-tier resilient cloud & Supabase synchronization)
  public async pullFromCloud(): Promise<TourPackageRecord[]> {
    let cloudTours: TourPackageRecord[] = [];

    // 1. Fetch from server-side persistent endpoint (works across all devices & APK)
    try {
      const res = await fetch('/api/tour-packages');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.tours) && json.tours.length > 0) {
          cloudTours = json.tours.map((t: any) => this.normalizeTour(t));
        }
      }
    } catch (_) {}

    // 2. Query Supabase tour_packages table if accessible
    try {
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const dbTours = data.map((item: any) => this.normalizeTour(item));
        // Merge dbTours into cloudTours
        const map = new Map<string, TourPackageRecord>();
        cloudTours.forEach(t => map.set(t.id, t));
        dbTours.forEach(t => map.set(t.id, t));
        cloudTours = Array.from(map.values());
      }
    } catch (_) {}

    // 3. Reconcile with local tours
    if (cloudTours.length > 0) {
      let hasChanges = false;
      const mergedMap = new Map<string, TourPackageRecord>();
      for (const local of this.memoryTours) {
        mergedMap.set(local.id, local);
      }

      for (const cloud of cloudTours) {
        const local = mergedMap.get(cloud.id);
        if (!local) {
          mergedMap.set(cloud.id, cloud);
          hasChanges = true;
        } else {
          const cloudTime = new Date(cloud.updatedAt || 0).getTime();
          const localTime = new Date(local.updatedAt || 0).getTime();

          if (cloudTime > localTime + 1000) {
            mergedMap.set(cloud.id, cloud);
            hasChanges = true;
          } else if (localTime > cloudTime + 1000) {
            this.syncToCloud(local);
          }
        }
      }

      // Check for local-only tours that need pushing
      for (const local of this.memoryTours) {
        if (!cloudTours.some(c => c.id === local.id)) {
          this.syncToCloud(local);
        }
      }

      if (hasChanges) {
        this.memoryTours = Array.from(mergedMap.values());
        this.saveToLocal();
        this.notifyChanges();
      }
      return this.memoryTours;
    } else if (this.memoryTours.length > 0) {
      for (const local of this.memoryTours) {
        this.syncToCloud(local);
      }
    }

    return this.memoryTours;
  }

  private async syncToCloud(tour: TourPackageRecord) {
    // 1. Push to server persistent API endpoint
    try {
      fetch('/api/tour-packages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tour })
      }).catch(() => {});
    } catch (_) {}

    // 2. Sync all stops directly to Supabase `shows` table (guaranteed accessible across all devices)
    try {
      if (Array.isArray(tour.stops) && tour.stops.length > 0) {
        for (const stop of tour.stops) {
          const hexId = (stop.id || '').replace(/[^a-f0-9]/gi, '').padEnd(32, '0').slice(0, 32);
          const stopUuid = hexId.slice(0, 8) + '-' + hexId.slice(8, 12) + '-4' + hexId.slice(13, 16) + '-a' + hexId.slice(17, 20) + '-' + hexId.slice(20, 32);

          const showRecord = {
            id: stopUuid,
            creator_id: '24523979-7f72-422b-8fb6-85634345d81c',
            show_name: `${tour.title} - ${stop.city || 'Tour Stop'}`,
            headliner: tour.headlinerClientName || 'Headliner Band',
            date: stop.date,
            show_date: stop.date,
            venue_name: stop.venueName || 'Venue',
            venue: stop.venueName || 'Venue',
            city: stop.city || 'Tour City',
            state_province: stop.state || 'USA',
            country: 'USA',
            guarantee_amount: stop.grossDeal || 2000,
            doors_time: stop.doorsTime || '19:00',
            set_time: stop.showStartTime || '20:00',
            promoter_contact: stop.venueContactName || '',
            parking_arrangements: stop.parkingNotes || '',
            status: 'Active',
            additional_notes: JSON.stringify({
              tour_id: tour.id,
              tour_title: tour.title,
              stop_id: stop.id,
              load_in_time: stop.loadInTime,
              soundcheck_time: stop.soundcheckTime,
              curfew_time: stop.curfewTime,
              hospitality: stop.hospitalityNotes,
              venue_email: stop.venueContactEmail,
              venue_phone: stop.venueContactPhone,
              stop_status: stop.status
            }),
            support_lineup: Array.isArray(tour.bands) ? tour.bands.map(b => b.name).join(', ') : ''
          };

          supabase.from('shows').upsert(showRecord, { onConflict: 'id' }).then();
        }
      }
    } catch (_) {}

    // 3. Attempt direct Supabase tour_packages table upsert
    try {
      const fullPayload = {
        id: tour.id,
        title: tour.title,
        headliner_client_name: tour.headlinerClientName,
        publication_status: tour.publicationStatus,
        embargo_until_date: tour.embargoUntilDate,
        bands: tour.bands,
        stops: tour.stops,
        vehicles: tour.vehicles,
        backline_config: tour.backlineConfig,
        data: tour,
        payload: tour,
        updated_at: tour.updatedAt || new Date().toISOString()
      };

      const { error } = await supabase
        .from('tour_packages')
        .upsert(fullPayload, { onConflict: 'id' });

      if (error) {
        await supabase
          .from('tour_packages')
          .upsert({
            id: tour.id,
            title: tour.title,
            data: tour,
            updated_at: tour.updatedAt || new Date().toISOString()
          }, { onConflict: 'id' });
      }
    } catch (_) {}
  }

  private async deleteFromCloud(tourId: string) {
    try {
      fetch(`/api/tour-packages/${tourId}`, { method: 'DELETE' }).catch(() => {});
      await supabase.from('tour_packages').delete().eq('id', tourId);
    } catch (_) {}
  }

  private saveToLocal() {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_ALL_TOURS, JSON.stringify(this.memoryTours));
      localStorage.setItem(LOCAL_STORAGE_KEY_ACTIVE_TOUR_ID, this.activeTourId);
    } catch {}
  }

  private notifyChanges() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('tour_manager_packages_updated', {
        detail: {
          tours: this.memoryTours,
          activeTourId: this.activeTourId
        }
      }));
    }
  }
}

export const tourPackageManager = new TourPackageManagerService();
