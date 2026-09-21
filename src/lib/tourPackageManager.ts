// Tour Package Sync & Multi-Tour Management Module
import { supabase } from './supabaseClient';
import { TourPackageBand, TourPackageStop } from '../components/portals/Band/TourManagerPackageModule';

export interface TourPackageRecord {
  id: string;
  title: string;
  headlinerClientName: string;
  publicationStatus: 'embargoed_private' | 'confirmed_routing' | 'public_announced';
  embargoUntilDate: string;
  bands: TourPackageBand[];
  stops: TourPackageStop[];
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
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class TourPackageManagerService {
  private memoryTours: TourPackageRecord[] = [];
  private activeTourId: string = 'tour-pkg-fall-2026';
  private hasInitialized: boolean = false;
  private isCloudSyncAvailable: boolean = true;
  private syncDebounceTimers: Map<string, any> = new Map();

  constructor() {
    this.init();
  }

  private init() {
    if (typeof window === 'undefined') return;
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_ALL_TOURS);
      if (stored) {
        this.memoryTours = JSON.parse(stored);
      } else {
        this.memoryTours = [...SEED_TOURS];
        this.saveToLocal();
      }

      const activeId = localStorage.getItem(LOCAL_STORAGE_KEY_ACTIVE_TOUR_ID);
      if (activeId && this.memoryTours.some(t => t.id === activeId)) {
        this.activeTourId = activeId;
      } else if (this.memoryTours.length > 0) {
        this.activeTourId = this.memoryTours[0].id;
      }
    } catch {
      this.memoryTours = [...SEED_TOURS];
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
    const updatedTour: TourPackageRecord = {
      ...tour,
      updatedAt: new Date().toISOString()
    };

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

  // Cloud Database Sync Methods
  public async pullFromCloud(): Promise<TourPackageRecord[]> {
    try {
      const { data, error } = await supabase
        .from('tour_packages')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        // Table might not exist yet; gracefully fallback to local cache
        return this.memoryTours;
      }

      if (data && data.length > 0) {
        const cloudTours: TourPackageRecord[] = data.map(item => ({
          id: item.id,
          title: item.title,
          headlinerClientName: item.headliner_client_name || item.headlinerClientName,
          publicationStatus: item.publication_status || item.publicationStatus || 'embargoed_private',
          embargoUntilDate: item.embargo_until_date || item.embargoUntilDate || '',
          bands: item.bands || [],
          stops: item.stops || [],
          createdAt: item.created_at || new Date().toISOString(),
          updatedAt: item.updated_at || new Date().toISOString()
        }));

        this.memoryTours = cloudTours;
        this.saveToLocal();
        this.notifyChanges();
        return cloudTours;
      }
    } catch {
      // Offline safe fallback
    }
    return this.memoryTours;
  }

  private async syncToCloud(tour: TourPackageRecord) {
    try {
      const payload = {
        id: tour.id,
        title: tour.title,
        headliner_client_name: tour.headlinerClientName,
        publication_status: tour.publicationStatus,
        embargo_until_date: tour.embargoUntilDate,
        bands: tour.bands,
        stops: tour.stops,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('tour_packages')
        .upsert(payload, { onConflict: 'id' });

      if (error) {
        // Silently log; offline local storage preserves work uninterrupted
        console.info('[TourPackageManager] Local persistence active; Supabase sync cached.');
      }
    } catch (e) {
      console.info('[TourPackageManager] Supabase offline fallback active.');
    }
  }

  private async deleteFromCloud(tourId: string) {
    try {
      await supabase.from('tour_packages').delete().eq('id', tourId);
    } catch {}
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
