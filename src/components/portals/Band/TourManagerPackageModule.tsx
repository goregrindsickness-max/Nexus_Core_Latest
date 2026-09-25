import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Compass,
  Calendar,
  Users,
  MapPin,
  Clock,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Copy,
  FileText,
  DollarSign,
  Truck,
  Layers,
  Printer,
  Sparkles,
  ArrowUpDown,
  Music,
  Phone,
  Mail,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Share2,
  Crown,
  Search,
  CheckCircle2,
  ArrowUp,
  ArrowDown,
  Building2,
  ShieldCheck,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  Radio,
  Megaphone,
  KeyRound,
  FolderKanban,
  FolderPlus,
  Save,
  CloudUpload,
  BookOpen
} from 'lucide-react';
import { communityBandManager, CommunityBandRecord } from '../../../lib/communityBands';
import {
  tourPackageManager,
  TourPackageRecord,
  TourVehicle,
  SharedBacklineConfig,
  TourPackageBand,
  TourPackageStop,
  DEFAULT_SEED_VEHICLES,
  DEFAULT_BACKLINE_CONFIG
} from '../../../lib/tourPackageManager';
import { searchBlackBookVenues, isVenueInBlackBook, saveVenueToBlackBook, VenueResult } from '../../../services/venueSearchService';
import { formatTimeTo12Hour } from '../../../lib/timeUtils';
import { ItineraryTab } from './tourPackage/ItineraryTab';
import { LineupBandsTab } from './tourPackage/LineupBandsTab';
import { DaySheetsTab } from './tourPackage/DaySheetsTab';
import { SharedBacklineTab } from './tourPackage/SharedBacklineTab';
import { SettlementTab } from './tourPackage/SettlementTab';
import { LeakShieldPrivacyTab } from './tourPackage/LeakShieldPrivacyTab';
import { VehiclesTab } from './tourPackage/VehiclesTab';
import { SmartVenueScoutModal } from './tourPackage/SmartVenueScoutModal';

export type { TourPackageBand, TourPackageStop, TourVehicle, SharedBacklineConfig };

interface TourManagerPackageModuleProps {
  userProfile: any;
  activeBand: any;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  onSwitchToSingleBandView?: () => void;
}

const DEFAULT_PACKAGE_BANDS: TourPackageBand[] = [
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
];

const DEFAULT_PACKAGE_STOPS: TourPackageStop[] = [
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
    parkingNotes: 'Bus/Van parking in rear alley off Hill St. 2x 30A Shore Power drops confirmed.',
    hospitalityNotes: 'Catering buyouts $25/head for 12 crew/members. Hot vegan options requested.',
    advancingDone: true
  },
  {
    id: 'pkg-s2',
    date: '2026-10-16',
    venueName: 'DNA Lounge',
    city: 'San Francisco',
    state: 'CA',
    capacity: 800,
    status: 'advancing',
    loadInTime: '15:30',
    soundcheckTime: '17:00',
    doorsTime: '19:30',
    showStartTime: '20:00',
    curfewTime: '23:45',
    venueContactName: 'J.W. Sound & Advance',
    venueContactPhone: '(415) 555-9231',
    venueContactEmail: 'booking@dnalounge.com',
    grossDeal: 3600,
    merchCutVenuePct: 10,
    parkingNotes: 'Load in on 11th St loading zone. 15A shore power available.',
    hospitalityNotes: 'Full green room with 2 cases sparkling water & pizza buyout.',
    advancingDone: true
  },
  {
    id: 'pkg-s3',
    date: '2026-10-18',
    venueName: 'Dante\'s',
    city: 'Portland',
    state: 'OR',
    capacity: 450,
    status: 'pending',
    loadInTime: '16:00',
    soundcheckTime: '17:30',
    doorsTime: '20:00',
    showStartTime: '20:30',
    curfewTime: '00:00',
    venueContactName: 'Cody (Talent Buyer)',
    venueContactPhone: '(503) 555-8812',
    venueContactEmail: 'cody@danteslive.com',
    grossDeal: 2800,
    merchCutVenuePct: 0,
    parkingNotes: 'Street load-in with yellow permit cones. No shore power, van stays locked.',
    hospitalityNotes: 'Dante\'s pizza slices provided post-soundcheck.',
    advancingDone: false
  },
  {
    id: 'pkg-s4',
    date: '2026-10-19',
    venueName: 'El Corazon',
    city: 'Seattle',
    state: 'WA',
    capacity: 700,
    status: 'confirmed',
    loadInTime: '15:00',
    soundcheckTime: '16:30',
    doorsTime: '19:00',
    showStartTime: '19:30',
    curfewTime: '23:30',
    venueContactName: 'Dana (FOH & Production)',
    venueContactPhone: '(206) 555-4309',
    venueContactEmail: 'dana@elcorazonseattle.com',
    grossDeal: 3400,
    merchCutVenuePct: 10,
    parkingNotes: 'Back lot behind Funhouse stage. Secure gate code: 4920#.',
    hospitalityNotes: 'Taco bar hospitality in upper green room.',
    advancingDone: true
  }
];

export const TourManagerPackageModule: React.FC<TourManagerPackageModuleProps> = ({
  userProfile,
  activeBand,
  triggerNotification,
  addLog,
  onSwitchToSingleBandView
}) => {
  // Multi-Tour Workspace State
  const [allTours, setAllTours] = useState<TourPackageRecord[]>(() => tourPackageManager.getAllTours());
  const [activeTourId, setActiveTourId] = useState<string>(() => tourPackageManager.getActiveTour().id);
  const [isTourSwitcherOpen, setIsTourSwitcherOpen] = useState(false);
  const [isCreateTourModalOpen, setIsCreateTourModalOpen] = useState(false);
  const [newTourTitleInput, setNewTourTitleInput] = useState('');
  const [newTourClientInput, setNewTourClientInput] = useState('');

  // Active Tour Data
  const currentTour = useMemo(() => {
    return allTours.find(t => t.id === activeTourId) || allTours[0] || tourPackageManager.getActiveTour();
  }, [allTours, activeTourId]);

  const [activeSubTab, setActiveSubTab] = useState<'itinerary' | 'bands' | 'vehicles' | 'daysheet' | 'backline' | 'settlement' | 'privacy'>('itinerary');
  const [tourTitle, setTourTitle] = useState(currentTour.title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [tempTitle, setTempTitle] = useState('');

  // Tour Package state
  const [bands, setBands] = useState<TourPackageBand[]>(currentTour.bands);
  const [stops, setStops] = useState<TourPackageStop[]>(currentTour.stops);
  const [vehicles, setVehicles] = useState<TourVehicle[]>(() => currentTour.vehicles || [...DEFAULT_SEED_VEHICLES]);
  const [backlineConfig, setBacklineConfig] = useState<SharedBacklineConfig>(() => currentTour.backlineConfig || { ...DEFAULT_BACKLINE_CONFIG });
  const [clientBandName, setClientBandName] = useState<string>(currentTour.headlinerClientName);
  const [publicationStatus, setPublicationStatus] = useState<'embargoed_private' | 'confirmed_routing' | 'public_announced'>(currentTour.publicationStatus);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [embargoUntilDate, setEmbargoUntilDate] = useState<string>(currentTour.embargoUntilDate || '2026-10-01T10:00');

  // Save & Persistence State
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() => new Date());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveSuccessAnimation, setSaveSuccessAnimation] = useState(false);
  const lastSavedSnapshotRef = useRef<string>('');

  // Current tour state snapshot for tracking dirty/unsaved state
  const currentSnapshot = useMemo(() => {
    return JSON.stringify({
      activeTourId,
      tourTitle,
      clientBandName,
      publicationStatus,
      embargoUntilDate,
      bands,
      stops,
      vehicles,
      backlineConfig
    });
  }, [activeTourId, tourTitle, clientBandName, publicationStatus, embargoUntilDate, bands, stops, vehicles, backlineConfig]);

  // Sync state whenever activeTour changes
  useEffect(() => {
    const tour = allTours.find(t => t.id === activeTourId);
    if (tour) {
      setTourTitle(tour.title);
      setBands(tour.bands);
      setStops(tour.stops);
      setVehicles(tour.vehicles || [...DEFAULT_SEED_VEHICLES]);
      setBacklineConfig(tour.backlineConfig || { ...DEFAULT_BACKLINE_CONFIG });
      setClientBandName(tour.headlinerClientName);
      setPublicationStatus(tour.publicationStatus);
      setEmbargoUntilDate(tour.embargoUntilDate || '2026-10-01T10:00');
      lastSavedSnapshotRef.current = JSON.stringify({
        activeTourId: tour.id,
        tourTitle: tour.title,
        clientBandName: tour.headlinerClientName,
        publicationStatus: tour.publicationStatus,
        embargoUntilDate: tour.embargoUntilDate || '2026-10-01T10:00',
        bands: tour.bands,
        stops: tour.stops,
        vehicles: tour.vehicles || [...DEFAULT_SEED_VEHICLES],
        backlineConfig: tour.backlineConfig || { ...DEFAULT_BACKLINE_CONFIG }
      });
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date(tour.updatedAt || Date.now()));
    }
  }, [activeTourId]);

  // Check for unsaved changes against last saved snapshot
  useEffect(() => {
    if (!lastSavedSnapshotRef.current) {
      lastSavedSnapshotRef.current = currentSnapshot;
    } else if (lastSavedSnapshotRef.current !== currentSnapshot) {
      setHasUnsavedChanges(true);
    }
  }, [currentSnapshot]);

  // Listen to external/cloud updates
  useEffect(() => {
    const handleToursUpdated = (e: any) => {
      if (e.detail?.tours) {
        setAllTours(e.detail.tours);
      }
    };
    window.addEventListener('tour_manager_packages_updated', handleToursUpdated);
    
    // Initial async pull from Cloud DB
    tourPackageManager.pullFromCloud().then(updatedTours => {
      setAllTours(updatedTours);
    });

    return () => {
      window.removeEventListener('tour_manager_packages_updated', handleToursUpdated);
    };
  }, []);

  // Background auto-save to in-memory/debounced store
  useEffect(() => {
    if (!currentTour) return;
    const updatedRecord: TourPackageRecord = {
      ...currentTour,
      id: activeTourId,
      title: tourTitle,
      headlinerClientName: clientBandName,
      publicationStatus: publicationStatus,
      embargoUntilDate: embargoUntilDate,
      bands: bands,
      stops: stops,
      vehicles: vehicles,
      backlineConfig: backlineConfig,
      updatedAt: new Date().toISOString()
    };
    tourPackageManager.saveTour(updatedRecord);
  }, [tourTitle, clientBandName, publicationStatus, embargoUntilDate, bands, stops, vehicles, backlineConfig, activeTourId]);

  // Manual explicit Save Tour Progress handler (Forces immediate Cloud & Local storage sync)
  const handleManualSaveTour = async (e?: React.MouseEvent | KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!currentTour) return;

    setIsSaving(true);
    const updatedRecord: TourPackageRecord = {
      ...currentTour,
      id: activeTourId,
      title: tourTitle,
      headlinerClientName: clientBandName,
      publicationStatus: publicationStatus,
      embargoUntilDate: embargoUntilDate,
      bands: bands,
      stops: stops,
      vehicles: vehicles,
      backlineConfig: backlineConfig,
      updatedAt: new Date().toISOString()
    };

    try {
      const saved = await tourPackageManager.saveTour(updatedRecord, true);
      lastSavedSnapshotRef.current = JSON.stringify({
        activeTourId: saved.id,
        tourTitle: saved.title,
        clientBandName: saved.headlinerClientName,
        publicationStatus: saved.publicationStatus,
        embargoUntilDate: saved.embargoUntilDate,
        bands: saved.bands,
        stops: saved.stops,
        vehicles: saved.vehicles,
        backlineConfig: saved.backlineConfig
      });

      setAllTours(tourPackageManager.getAllTours());
      setHasUnsavedChanges(false);
      setLastSavedAt(new Date());
      setSaveSuccessAnimation(true);
      setTimeout(() => setSaveSuccessAnimation(false), 2500);

      // Dispatch global event so all map/itinerary modules synchronize
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('tourPackageUpdated', { detail: saved }));
      }

      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      triggerNotification?.(`💾 All Tour Progress Saved: "${tourTitle}" (${stops.length} dates, ${bands.length} bands, ${vehicles.length} vehicles) at ${timeStr}`);
      addLog?.(`TM Workspace: Saved "${tourTitle}" tour progress (stops: ${stops.length}, bands: ${bands.length}, vehicles: ${vehicles.length})`);
    } catch (err: any) {
      triggerNotification?.(`⚠️ Error saving tour progress: ${err?.message || 'Local storage write failed'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Keyboard shortcut support: Ctrl+S or Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleManualSaveTour();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTour, activeTourId, tourTitle, clientBandName, publicationStatus, embargoUntilDate, bands, stops]);

  // Modals & Search state
  const [isSelectClientModal, setIsSelectClientModal] = useState(false);
  const [clientSearchQuery, setClientSearchQuery] = useState('');
  const [clientTab, setClientTab] = useState<'community' | 'package' | 'custom'>('community');
  const [customClientName, setCustomClientName] = useState('');
  const [customClientGenre, setCustomClientGenre] = useState('Death Metal');
  const [customClientCity, setCustomClientCity] = useState('');
  const [customClientContact, setCustomClientContact] = useState('');
  const [customClientPhone, setCustomClientPhone] = useState('');

  // Selected stop for deep view / modal
  const [selectedStopId, setSelectedStopId] = useState<string>(stops[0]?.id || '');
  const [isAddingBandModal, setIsAddingBandModal] = useState(false);
  const [isAddingStopModal, setIsAddingStopModal] = useState(false);
  const [bandSearchCommunityQuery, setBandSearchCommunityQuery] = useState('');

  // New band form state
  const [newBandName, setNewBandName] = useState('');
  const [newBandRole, setNewBandRole] = useState<'headliner' | 'direct_support' | 'opener' | 'local_support'>('direct_support');
  const [newBandSetMinutes, setNewBandSetMinutes] = useState(45);
  const [newBandGuarantee, setNewBandGuarantee] = useState(800);
  const [newBandSplitPct, setNewBandSplitPct] = useState(25);
  const [newBandContact, setNewBandContact] = useState('');
  const [newBandPhone, setNewBandPhone] = useState('');
  const [newBandEmail, setNewBandEmail] = useState('');
  const [newBandGear, setNewBandGear] = useState('');
  const [newBandCity, setNewBandCity] = useState('');

  // New stop form state
  const [newStopDate, setNewStopDate] = useState('');
  const [newStopVenue, setNewStopVenue] = useState('');
  const [newStopCity, setNewStopCity] = useState('');
  const [newStopState, setNewStopState] = useState('');
  const [newStopGrossDeal, setNewStopGrossDeal] = useState(3000);
  const [newStopLoadIn, setNewStopLoadIn] = useState('15:00');
  const [newStopSoundcheck, setNewStopSoundcheck] = useState('16:30');
  const [newStopDoors, setNewStopDoors] = useState('19:00');
  const [newStopDownbeat, setNewStopDownbeat] = useState('19:30');
  const [newStopCurfew, setNewStopCurfew] = useState('23:30');
  const [newStopContact, setNewStopContact] = useState('');
  const [newStopPhone, setNewStopPhone] = useState('');
  const [newStopParking, setNewStopParking] = useState('');
  const [newStopCapacity, setNewStopCapacity] = useState(500);
  const [newStopBlackBookVenueId, setNewStopBlackBookVenueId] = useState<string | undefined>(undefined);
  const [newStopSaveToBlackBook, setNewStopSaveToBlackBook] = useState(true);
  const [newStopSearchQuery, setNewStopSearchQuery] = useState('');
  const [newStopSuggestions, setNewStopSuggestions] = useState<VenueResult[]>([]);

  // Get Community Band Profiles
  const communityBands = useMemo(() => {
    try {
      return communityBandManager.getAll();
    } catch {
      return [];
    }
  }, [isSelectClientModal, isAddingBandModal]);

  const handleSaveTitle = () => {
    if (tempTitle.trim()) {
      const newTitle = tempTitle.trim();
      setTourTitle(newTitle);
      if (currentTour) {
        tourPackageManager.saveTour({
          ...currentTour,
          title: newTitle
        });
      }
      triggerNotification?.('Tour package title updated.');
    }
    setIsEditingTitle(false);
  };

  const handleSelectTour = (tourId: string) => {
    tourPackageManager.setActiveTourId(tourId);
    setActiveTourId(tourId);
    const selected = allTours.find(t => t.id === tourId);
    if (selected) {
      setTourTitle(selected.title);
      setBands(selected.bands);
      setStops(selected.stops);
      setClientBandName(selected.headlinerClientName);
      setPublicationStatus(selected.publicationStatus);
      setEmbargoUntilDate(selected.embargoUntilDate || '2026-10-01T10:00');
      triggerNotification?.(`Switched active workspace to: "${selected.title}"`);
      addLog?.(`TM Workspace: switched to "${selected.title}"`);
    }
    setIsTourSwitcherOpen(false);
  };

  const handleCreateNewTour = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourTitleInput.trim()) return;
    const created = tourPackageManager.createNewTour(newTourTitleInput.trim(), newTourClientInput.trim() || 'Sanguisugabogg');
    setAllTours(tourPackageManager.getAllTours());
    setActiveTourId(created.id);
    setTourTitle(created.title);
    setBands(created.bands);
    setStops(created.stops);
    setClientBandName(created.headlinerClientName);
    setPublicationStatus(created.publicationStatus);
    setEmbargoUntilDate(created.embargoUntilDate || '2026-10-01T10:00');
    setNewTourTitleInput('');
    setNewTourClientInput('');
    setIsCreateTourModalOpen(false);
    triggerNotification?.(`Created new tour workspace: "${created.title}"`);
    addLog?.(`TM Workspace: Created "${created.title}"`);
  };

  const handleDuplicateCurrentTour = () => {
    const cloned = tourPackageManager.duplicateTour(activeTourId);
    if (cloned) {
      setAllTours(tourPackageManager.getAllTours());
      setActiveTourId(cloned.id);
      setTourTitle(cloned.title);
      setBands(cloned.bands);
      setStops(cloned.stops);
      setClientBandName(cloned.headlinerClientName);
      setPublicationStatus(cloned.publicationStatus);
      setEmbargoUntilDate(cloned.embargoUntilDate || '2026-10-01T10:00');
      triggerNotification?.(`Duplicated tour package to: "${cloned.title}"`);
      addLog?.(`TM Workspace: Duplicated to "${cloned.title}"`);
    }
  };

  const handleDeleteTour = (tourId: string, tourName: string) => {
    if (allTours.length <= 1) {
      triggerNotification?.('Cannot delete the only remaining tour package.');
      return;
    }
    const success = tourPackageManager.deleteTour(tourId);
    if (success) {
      const remaining = tourPackageManager.getAllTours();
      setAllTours(remaining);
      const newActive = tourPackageManager.getActiveTour();
      setActiveTourId(newActive.id);
      triggerNotification?.(`Deleted tour "${tourName}"`);
      addLog?.(`TM Workspace: Deleted "${tourName}"`);
    }
  };

  // Set active client/headliner
  const handleSelectClient = (name: string, record?: CommunityBandRecord | null, alsoAddToLineup = true) => {
    if (!name.trim()) return;
    const cleanName = name.trim();
    setClientBandName(cleanName);

    // Update or add to package lineup
    setBands(prevBands => {
      const existingIdx = prevBands.findIndex(b => b.name.toLowerCase() === cleanName.toLowerCase());
      if (existingIdx >= 0) {
        // Demote other headliners, promote this band, move to top
        const updated = prevBands.map((b, i) => {
          if (i === existingIdx) {
            return { ...b, role: 'headliner' as const };
          }
          if (b.role === 'headliner') {
            return { ...b, role: 'direct_support' as const };
          }
          return b;
        });
        const target = updated[existingIdx];
        const rest = updated.filter((_, i) => i !== existingIdx);
        return [target, ...rest];
      } else if (alsoAddToLineup) {
        // Add new headliner band
        const demoted = prevBands.map(b => b.role === 'headliner' ? { ...b, role: 'direct_support' as const } : b);
        const newHeadliner: TourPackageBand = {
          id: `pkg-b-${Date.now()}`,
          name: cleanName,
          role: 'headliner',
          setMinutes: 60,
          guarantee: 2000,
          guaranteeType: 'percentage',
          percentageSplit: 50,
          contactName: record?.curator_name || (record?.lineup && record.lineup[0]?.name) || 'Band TM / Booking Rep',
          contactPhone: '(555) 201-9482',
          contactEmail: record?.spotify || 'booking@bandmgmt.com',
          sharedGearNotes: 'Provides complete 8x10 bass cab & stage backline rack.',
          membersCount: record?.lineup?.length || 4,
          avatarColor: 'from-amber-600 to-yellow-950',
          avatarUrl: record?.avatar_url || record?.logo_url,
          city: record?.city ? `${record.city}${record.state ? `, ${record.state}` : ''}` : undefined
        };
        return [newHeadliner, ...demoted];
      }
      return prevBands;
    });

    triggerNotification?.(`👑 Selected ${cleanName} as Headliner & Client.`);
    addLog?.(`TM Mode: Selected ${cleanName} as active client / tour headliner.`);
    setIsSelectClientModal(false);
  };

  // Promote any existing package band to Headliner / Client
  const handlePromoteToHeadliner = (bandId: string) => {
    const target = bands.find(b => b.id === bandId);
    if (!target) return;

    setClientBandName(target.name);
    const updated = bands.map(b => {
      if (b.id === bandId) return { ...b, role: 'headliner' as const, percentageSplit: 50 };
      if (b.role === 'headliner') return { ...b, role: 'direct_support' as const, percentageSplit: 30 };
      return b;
    });

    // Move headliner to top
    const headliner = updated.find(b => b.id === bandId)!;
    const rest = updated.filter(b => b.id !== bandId);
    setBands([headliner, ...rest]);

    triggerNotification?.(`👑 ${target.name} is now the Headliner & Client!`);
    addLog?.(`TM Mode: Promoted ${target.name} to Headliner & Client.`);
  };

  // Reorder bands
  const handleMoveBand = (fromIdx: number, toIdx: number) => {
    if (toIdx < 0 || toIdx >= bands.length) return;
    const updated = [...bands];
    const [moved] = updated.splice(fromIdx, 1);
    updated.splice(toIdx, 0, moved);
    setBands(updated);
  };

  const handleAddBand = () => {
    if (!newBandName.trim()) return;
    const colors = [
      'from-purple-600 to-indigo-950',
      'from-amber-600 to-yellow-950',
      'from-cyan-600 to-blue-950',
      'from-rose-600 to-red-950',
      'from-emerald-600 to-teal-950'
    ];
    const newBand: TourPackageBand = {
      id: `pkg-b-${Date.now()}`,
      name: newBandName.trim(),
      role: newBandRole,
      setMinutes: Number(newBandSetMinutes) || 30,
      guarantee: Number(newBandGuarantee) || 500,
      guaranteeType: 'percentage',
      percentageSplit: Number(newBandSplitPct) || 20,
      contactName: newBandContact.trim() || 'Tour Manager',
      contactPhone: newBandPhone.trim() || '',
      contactEmail: newBandEmail.trim() || '',
      sharedGearNotes: newBandGear.trim() || 'Standard gear agreement',
      membersCount: 4,
      avatarColor: colors[bands.length % colors.length],
      city: newBandCity.trim() || undefined
    };

    if (newBandRole === 'headliner') {
      setClientBandName(newBand.name);
      const demoted = bands.map(b => b.role === 'headliner' ? { ...b, role: 'direct_support' as const } : b);
      setBands([newBand, ...demoted]);
    } else {
      setBands([...bands, newBand]);
    }

    triggerNotification?.(`Added ${newBand.name} to the tour package billing!`);
    addLog?.(`TM Mode: Added ${newBand.name} (${newBand.role}) to one-off package.`);
    setIsAddingBandModal(false);

    // Reset
    setNewBandName('');
    setNewBandContact('');
    setNewBandPhone('');
    setNewBandEmail('');
    setNewBandGear('');
    setNewBandCity('');
    setBandSearchCommunityQuery('');
  };

  const handleQuickFillFromCommunity = (b: CommunityBandRecord) => {
    setNewBandName(b.name);
    setNewBandContact(b.curator_name || (b.lineup && b.lineup[0]?.name) || 'Tour Manager');
    setNewBandCity(b.city ? `${b.city}${b.state ? `, ${b.state}` : ''}` : '');
    setNewBandPhone('(555) 234-8901');
    setNewBandGear(`Brings standard backline (${b.genre} setup).`);
  };

  const handleRemoveBand = (id: string, name: string) => {
    setBands(bands.filter(b => b.id !== id));
    triggerNotification?.(`Removed ${name} from package.`);
    addLog?.(`TM Mode: Removed ${name} from tour package.`);
  };

  const handleAddStop = async () => {
    if (!newStopVenue.trim() || !newStopCity.trim()) return;

    let linkedBbId = newStopBlackBookVenueId;
    if (newStopSaveToBlackBook) {
      const alreadyIn = await isVenueInBlackBook(newStopVenue.trim(), newStopCity.trim());
      if (!alreadyIn) {
        const saved = saveVenueToBlackBook({
          name: newStopVenue.trim(),
          city: newStopCity.trim(),
          state: newStopState.trim(),
          capacity: Number(newStopCapacity) || 500,
          contactName: newStopContact.trim(),
          contactPhone: newStopPhone.trim(),
          parkingNotes: newStopParking.trim()
        });
        linkedBbId = saved.id;
        triggerNotification?.(`Added "${newStopVenue.trim()}" to Black Book Rolodex!`);
      }
    }

    const newStop: TourPackageStop = {
      id: `pkg-s-${Date.now()}`,
      date: newStopDate || new Date().toISOString().split('T')[0],
      venueName: newStopVenue.trim(),
      city: newStopCity.trim(),
      state: newStopState.trim().toUpperCase() || 'US',
      capacity: Number(newStopCapacity) || 500,
      status: 'advancing',
      loadInTime: newStopLoadIn || '15:00',
      soundcheckTime: newStopSoundcheck || '16:30',
      doorsTime: newStopDoors || '19:00',
      showStartTime: newStopDownbeat || '19:30',
      curfewTime: newStopCurfew || '23:30',
      venueContactName: newStopContact.trim() || 'Production PM',
      venueContactPhone: newStopPhone.trim() || '',
      venueContactEmail: '',
      grossDeal: Number(newStopGrossDeal) || 2500,
      merchCutVenuePct: 10,
      parkingNotes: newStopParking.trim() || 'Band vehicle loading zone',
      hospitalityNotes: 'Standard green room rider',
      advancingDone: false,
      blackBookVenueId: linkedBbId
    };

    const updated = [...stops, newStop].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setStops(updated);
    setSelectedStopId(newStop.id);
    triggerNotification?.(`Added ${newStop.venueName} (${newStop.city}) to tour route!`);
    addLog?.(`TM Mode: Added ${newStop.venueName} routing stop.`);
    setIsAddingStopModal(false);

    // Reset
    setNewStopVenue('');
    setNewStopCity('');
    setNewStopState('');
    setNewStopContact('');
    setNewStopPhone('');
    setNewStopParking('');
    setNewStopBlackBookVenueId(undefined);
    setNewStopSearchQuery('');
    setNewStopSuggestions([]);
  };

  const handleAddStopDirect = (newStop: TourPackageStop) => {
    const updated = [...stops, newStop].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setStops(updated);
    setSelectedStopId(newStop.id);
    triggerNotification?.(`Added ${newStop.venueName} (${newStop.city}) to tour route!`);
    addLog?.(`TM Mode: Added ${newStop.venueName} routing stop.`);
  };

  const handleRemoveStop = (id: string, venue: string) => {
    setStops(stops.filter(s => s.id !== id));
    triggerNotification?.(`Removed ${venue} from route.`);
  };

  const handleToggleAdvancing = (id: string) => {
    setStops(stops.map(s => s.id === id ? { ...s, advancingDone: !s.advancingDone } : s));
    triggerNotification?.('Advancing checklist status updated.');
  };

  // Complete editability handlers
  const handleUpdateBand = (updatedBand: TourPackageBand) => {
    setBands(prev => prev.map(b => b.id === updatedBand.id ? updatedBand : b));
    if (updatedBand.role === 'headliner') {
      setClientBandName(updatedBand.name);
    }
    triggerNotification?.(`Updated details for ${updatedBand.name}.`);
    addLog?.(`TM Mode: Updated details for ${updatedBand.name}.`);
  };

  const handleUpdateStop = (updatedStop: TourPackageStop) => {
    setStops(prev => prev.map(s => s.id === updatedStop.id ? updatedStop : s));
    triggerNotification?.(`Updated stop details for ${updatedStop.venueName}.`);
    addLog?.(`TM Mode: Updated stop ${updatedStop.venueName}.`);
  };

  // Vehicle convoy handlers
  const handleAddVehicle = (newVeh: Omit<TourVehicle, 'id'>) => {
    const created: TourVehicle = {
      ...newVeh,
      id: `veh-${Date.now()}`
    };
    setVehicles(prev => [...prev, created]);
    triggerNotification?.(`Added ${created.name} to tour fleet.`);
    addLog?.(`TM Mode: Added vehicle ${created.name}.`);
  };

  const handleUpdateVehicle = (updatedVeh: TourVehicle) => {
    setVehicles(prev => prev.map(v => v.id === updatedVeh.id ? updatedVeh : v));
    triggerNotification?.(`Updated vehicle ${updatedVeh.name}.`);
    addLog?.(`TM Mode: Updated vehicle ${updatedVeh.name}.`);
  };

  const handleDeleteVehicle = (id: string, name: string) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
    triggerNotification?.(`Removed ${name} from tour fleet.`);
    addLog?.(`TM Mode: Removed vehicle ${name}.`);
  };

  // Backline & splits handlers
  const handleUpdateBacklineConfig = (newCfg: SharedBacklineConfig) => {
    setBacklineConfig(newCfg);
    triggerNotification?.('Updated shared backline and cargo trailer setup.');
    addLog?.(`TM Mode: Updated shared backline config.`);
  };

  const handleUpdateBandGearNotes = (bandId: string, notes: string) => {
    setBands(prev => prev.map(b => b.id === bandId ? { ...b, sharedGearNotes: notes } : b));
    triggerNotification?.('Updated band gear agreement notes.');
  };

  const handleUpdateBandSplits = (updatedBands: TourPackageBand[]) => {
    setBands(updatedBands);
    triggerNotification?.('Updated deals, splits and nightly guarantees.');
    addLog?.(`TM Mode: Adjusted package splits and guarantees.`);
  };

  const handleUpdateStopDeal = (stopId: string, grossDeal: number) => {
    setStops(prev => prev.map(s => s.id === stopId ? { ...s, grossDeal } : s));
    triggerNotification?.('Updated show gross deal amount.');
  };

  const activeStop = stops.find(s => s.id === selectedStopId) || stops[0];

  // Day Sheet Formatted Generator
  const generateFormattedDaySheetText = (stop: TourPackageStop) => {
    if (!stop) return '';
    const dateFormatted = new Date(stop.date + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    const lines = [
      `==================================================`,
      `🏁 ${tourTitle.toUpperCase()} - OFFICIAL TM DAY SHEET`,
      `==================================================`,
      `DATE: ${dateFormatted}`,
      `VENUE: ${stop.venueName} (${stop.city}, ${stop.state})`,
      `CAPACITY: ${stop.capacity || 'N/A'} | STATUS: ${stop.status.toUpperCase()}`,
      `TOUR MANAGER: ${userProfile?.full_name || userProfile?.name || 'Miguel Goregrinder Medina'} (Lead Production)`,
      `VENUE PM / FOH: ${stop.venueContactName} - ${stop.venueContactPhone}`,
      `--------------------------------------------------`,
      `⏱️ MASTER PRODUCTION & SET TIMELINE (12H):`,
      `  • ${formatTimeTo12Hour(stop.loadInTime)} - All Tour Vans Load-In & Trailer Unpack`,
      `  • ${formatTimeTo12Hour(stop.soundcheckTime)} - Production & Backline Audio Line Check`,
      `  • ${formatTimeTo12Hour(stop.doorsTime)} - Public Doors Open`,
      `  • ${formatTimeTo12Hour(stop.showStartTime)} - DOWNBEAT: First Band`,
      `  • ${formatTimeTo12Hour(stop.curfewTime)} - Curfew & Stage Lockup`,
      `--------------------------------------------------`,
      `🎸 BILLING PACKAGE & SET TIMES:`,
      ...bands.map((b, idx) => `  ${idx + 1}. [${b.role.toUpperCase()}] ${b.name} (${b.setMinutes} MINS) - Rep: ${b.contactName} ${b.contactPhone}`),
      `--------------------------------------------------`,
      `🚐 PARKING & SHORE POWER:`,
      `  ${stop.parkingNotes || 'Contact venue upon arrival for designated van alley/lot.'}`,
      `--------------------------------------------------`,
      `🍔 HOSPITALITY & CATERING:`,
      `  ${stop.hospitalityNotes || 'Standard green room provisions & buyout per contract.'}`,
      `==================================================`
    ];
    return lines.join('\n');
  };

  const handleCopyDaySheet = (stop: TourPackageStop) => {
    const text = generateFormattedDaySheetText(stop);
    navigator.clipboard.writeText(text);
    triggerNotification?.(`📋 Copied Day Sheet for ${stop.venueName} to clipboard!`);
    addLog?.(`TM Mode: Copied Day Sheet for ${stop.venueName}.`);
  };

  // Financial calculations
  const totalTourGross = stops.reduce((acc, s) => acc + (s.grossDeal || 0), 0);
  const totalGrossPotential = totalTourGross;
  const totalPackageGuarantees = bands.reduce((acc, b) => acc + (b.guarantee || 0), 0);
  const totalBandsCount = bands.length;
  const totalStopsCount = stops.length;

  const tmIdentityName = userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Miguel Goregrinder Medina';

  return (
    <div className="p-3 sm:p-4 bg-[#08090d] border border-amber-500/25 rounded-2xl shadow-2xl relative overflow-hidden transition-all">
      {/* Background Accent Gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-amber-500/10 via-amber-600/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-emerald-500/5 to-transparent blur-3xl pointer-events-none" />

      {/* 1. Executive TM Header & Controls Full-Width Banner */}
      <div className="relative z-10 flex flex-col items-center text-center gap-4 pb-4 border-b border-zinc-800/80">
        {/* Badges Grid: Suite Active and Multi-Tour Switcher */}
        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mx-auto">
          {/* Badge 1: Tour Manager Suite Active */}
          <div className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-300 font-mono text-xs font-black tracking-wider uppercase shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Compass className="w-4 h-4 text-amber-400 animate-spin shrink-0" style={{ animationDuration: '20s' }} />
            <span>Tour Manager Suite Active</span>
          </div>

          {/* Badge 2: Multi-Tour Switcher Dropdown */}
          <div className="relative w-full">
            <button
              type="button"
              onClick={() => setIsTourSwitcherOpen(!isTourSwitcherOpen)}
              className="w-full flex items-center justify-between gap-2 text-xs font-mono text-cyan-400 bg-cyan-950/60 hover:bg-cyan-900/80 px-3.5 py-2 rounded-xl border border-cyan-500/40 hover:border-cyan-400 transition-all cursor-pointer group shadow-sm"
              title="Switch Active Tour Project"
            >
              <div className="flex items-center gap-2 truncate min-w-0">
                <FolderKanban className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform shrink-0" />
                <span className="text-zinc-400 shrink-0">Tours ({allTours.length}):</span>
                <strong className="text-cyan-300 truncate">{tourTitle}</strong>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-cyan-400 shrink-0 ml-1" />
            </button>

            {/* Tour Switcher Popover Menu */}
            {isTourSwitcherOpen && (
              <div className="absolute left-0 right-0 top-full mt-1.5 w-full bg-zinc-900/95 backdrop-blur-md border border-cyan-500/40 rounded-xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 text-left">
                <div className="flex items-center justify-between px-2 py-1 border-b border-zinc-800 text-[10px] font-mono text-zinc-400">
                  <span className="font-bold text-zinc-200">ACTIVE TOUR WORKSPACES</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTourSwitcherOpen(false);
                      setIsCreateTourModalOpen(true);
                    }}
                    className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-bold cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> New Tour
                  </button>
                </div>
                <div className="max-h-56 overflow-y-auto space-y-1 py-1.5">
                  {allTours.map(t => {
                    const isCurrent = t.id === activeTourId;
                    return (
                      <div
                        key={t.id}
                        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-all ${
                          isCurrent
                            ? 'bg-cyan-950/70 border border-cyan-500/50 text-white'
                            : 'bg-zinc-800/40 hover:bg-zinc-800 border border-zinc-700/30 text-zinc-300'
                        }`}
                        onClick={() => handleSelectTour(t.id)}
                      >
                        <div className="flex flex-col min-w-0 pr-2 text-left">
                          <div className="flex items-center gap-1.5">
                            {isCurrent && <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                            <span className="text-xs font-bold font-display truncate text-white">{t.title}</span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-400 truncate">
                            {t.stops.length} dates • {t.bands.length} bands
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {allTours.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteTour(t.id, t.title);
                              }}
                              className="p-1 hover:bg-rose-950/60 rounded text-zinc-500 hover:text-rose-400 transition cursor-pointer"
                              title="Delete tour workspace"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="pt-1 border-t border-zinc-800/80 flex items-center justify-between gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleDuplicateCurrentTour();
                      setIsTourSwitcherOpen(false);
                    }}
                    className="w-full text-center py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-mono flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" /> Duplicate Active Tour
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tour Title, Subtitle & Action Controls Row - Centered */}
        <div className="flex flex-col items-center justify-center text-center gap-3 w-full max-w-3xl mx-auto">
          <div className="space-y-1.5 flex flex-col items-center justify-center text-center w-full">
            {/* Editable Tour Title (Centered, no one-off badge) */}
            <div className="flex items-center justify-center gap-2">
              {isEditingTitle ? (
                <div className="flex items-center justify-center gap-1.5">
                  <input
                    type="text"
                    value={tempTitle}
                    onChange={e => setTempTitle(e.target.value)}
                    className="bg-zinc-900 border border-amber-500/60 rounded-lg px-3 py-1.5 text-base font-bold text-white font-sans focus:outline-none focus:ring-2 focus:ring-amber-400 min-w-[280px] sm:min-w-[360px] text-center"
                    placeholder="e.g. West Coast Annihilation Run 2026"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={handleSaveTitle}
                    className="p-2 bg-amber-500 text-black rounded-lg hover:bg-amber-400 transition cursor-pointer"
                    title="Save title"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingTitle(false)}
                    className="p-2 bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition cursor-pointer"
                    title="Cancel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center gap-2.5 group cursor-pointer"
                  onClick={() => { setTempTitle(tourTitle); setIsEditingTitle(true); }}
                  title="Click to edit tour title"
                >
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-display font-black text-white uppercase tracking-tight flex items-center justify-center gap-2 text-center">
                    <span>{tourTitle}</span>
                    <Edit3 className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 transition-colors" />
                  </h2>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed text-center max-w-xl mx-auto">
              Routing, multi-band billing, shared backline agreements, and unified day sheets for this tour run.
            </p>
          </div>

          {/* Action Controls: Full-Width Save All Progress Bar & Secondary Actions */}
          <div className="w-full max-w-xl mx-auto flex flex-col items-center gap-2.5 pt-1">
            {/* Full-Width Save All Progress Bar */}
            <button
              type="button"
              onClick={handleManualSaveTour}
              disabled={isSaving}
              className={`w-full py-3 px-5 rounded-xl font-mono font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer select-none ${
                isSaving
                  ? 'bg-amber-600/80 text-white cursor-wait ring-2 ring-amber-400 animate-pulse'
                  : saveSuccessAnimation
                  ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)] border border-emerald-400'
                  : hasUnsavedChanges
                  ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-black shadow-[0_0_20px_rgba(245,158,11,0.5)] border border-amber-300 ring-2 ring-amber-400/70 animate-pulse'
                  : 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 hover:text-emerald-200 border border-emerald-500/50 hover:border-emerald-400'
              }`}
              title={
                hasUnsavedChanges
                  ? 'Unsaved changes detected across route and package. Click to save everything now (Ctrl+S / Cmd+S)'
                  : 'All tour progress and routing is saved and synchronized with Cloud & Local storage (Ctrl+S / Cmd+S)'
              }
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-200 shrink-0" />
                  <span>Saving All Tour Progress...</span>
                </>
              ) : saveSuccessAnimation ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white stroke-[2.5] shrink-0" />
                  <span>All Progress &amp; Route Saved ✓</span>
                </>
              ) : hasUnsavedChanges ? (
                <>
                  <Save className="w-4 h-4 text-black stroke-[2.5] shrink-0" />
                  <span>Save All Progress *</span>
                  <span className="text-[9px] bg-black text-amber-300 px-1.5 py-0.5 rounded font-black ml-1">
                    UNSAVED CHANGES
                  </span>
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Save All Progress</span>
                  {lastSavedAt && (
                    <span className="text-[10px] text-emerald-400/80 font-normal hidden sm:inline ml-1 font-mono">
                      (Saved at {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  )}
                </>
              )}
            </button>

            {/* Secondary Controls: Add Package Band & Countdown Card */}
            <div className="flex items-center justify-center gap-2.5 w-full flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setBandSearchCommunityQuery('');
                  setIsAddingBandModal(true);
                }}
                className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
              >
                <Users className="w-3.5 h-3.5" />
                Add Package Band
              </button>
              {onSwitchToSingleBandView && (
                <button
                  type="button"
                  onClick={onSwitchToSingleBandView}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 font-mono text-xs uppercase tracking-wider transition-colors cursor-pointer"
                  title="Peek at Single Band Countdown view"
                >
                  Countdown Card
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Stats Bar */}
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 my-3">
        {/* Clickable Bands on Package Tile linked to bands tab */}
        <div
          onClick={() => setActiveSubTab('bands')}
          className="bg-[#11131a]/80 hover:bg-amber-950/30 border border-zinc-800/80 hover:border-amber-500/50 rounded-xl p-2.5 flex items-center gap-2.5 cursor-pointer transition-all group shadow-sm"
          title="Click to manage Bands on Package"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 group-hover:bg-amber-500/20 group-hover:border-amber-500/60 flex items-center justify-center text-amber-400 shrink-0 transition-colors">
            <Users className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block leading-none flex items-center gap-1 group-hover:text-amber-400 transition-colors">
              Bands on Package <span className="text-[8px] text-amber-400 font-bold">→</span>
            </span>
            <span className="text-sm font-mono font-black text-white group-hover:text-amber-300 leading-tight transition-colors">{totalBandsCount} Bands</span>
          </div>
        </div>

        <div className="bg-[#11131a]/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block leading-none">Routed Stops</span>
            <span className="text-sm font-mono font-black text-emerald-400 leading-tight">{totalStopsCount} Confirmed</span>
          </div>
        </div>

        <div className="bg-[#11131a]/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block leading-none">Total Gross Guarantees</span>
            <span className="text-sm font-mono font-black text-cyan-300 leading-tight">${totalTourGross.toLocaleString()}</span>
          </div>
        </div>

        <div className="bg-[#11131a]/80 border border-zinc-800/80 rounded-xl p-2.5 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono text-zinc-500 uppercase block leading-none">Tour Vehicle Convoys</span>
            <span className="text-sm font-mono font-black text-purple-300 leading-tight">
              {vehicles.length} Vehicles ({vehicles.reduce((sum, v) => sum + (v.capacityPax || 0), 0)} PAX)
            </span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Sub-Tabs */}
      <div className="relative z-10 flex items-center gap-1 overflow-x-auto no-scrollbar pb-1 border-b border-zinc-850 mb-3">
        {[
          { key: 'itinerary', label: 'Route & Tour Stops', icon: MapPin, count: stops.length },
          { key: 'bands', label: 'Bands on Package', icon: Users, count: bands.length },
          { key: 'vehicles', label: 'Tour Vehicles & Fleet', icon: Truck, count: vehicles.length },
          { key: 'backline', label: 'Shared Backline & Trailer', icon: Layers },
          { key: 'settlement', label: 'Nightly Splits & Guarantees', icon: DollarSign },
          { key: 'daysheet', label: 'Unified Day Sheet', icon: FileText },
          { 
            key: 'privacy', 
            label: publicationStatus === 'public_announced' ? 'Live Announcement' : 'Confidentiality & Leak Shield', 
            icon: publicationStatus === 'public_announced' ? Megaphone : Lock,
            isPrivateFlag: publicationStatus === 'embargoed_private'
          }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveSubTab(tab.key as any)}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? tab.key === 'privacy' && publicationStatus === 'embargoed_private'
                    ? 'bg-rose-500 text-black shadow-md shadow-rose-500/20 font-black'
                    : 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                  : tab.key === 'privacy' && publicationStatus === 'embargoed_private'
                  ? 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40'
                  : 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${isActive ? 'bg-black/30 text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                  {tab.count}
                </span>
              )}
              {tab.key === 'privacy' && publicationStatus === 'embargoed_private' && (
                <span className="text-[7.5px] font-mono px-1 py-0.2 bg-rose-600 text-white rounded font-black tracking-widest uppercase">
                  NDA
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. Sub-Tab Content Areas */}

      {/* TAB 1: Route & Tour Stops */}
      {activeSubTab === 'itinerary' && (
        <ItineraryTab
          stops={stops}
          selectedStopId={selectedStopId}
          setSelectedStopId={setSelectedStopId}
          onCopyDaySheet={handleCopyDaySheet}
          onRemoveStop={handleRemoveStop}
          onToggleAdvancing={handleToggleAdvancing}
          onUpdateStop={handleUpdateStop}
          onAddStop={handleAddStopDirect}
          triggerNotification={triggerNotification}
          onSaveProgress={handleManualSaveTour}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
          onOpenAddStopModal={() => setIsAddingStopModal(true)}
        />
      )}

      {/* TAB 2: Bands on Package */}
      {activeSubTab === 'bands' && (
        <LineupBandsTab
          bands={bands}
          clientBandName={clientBandName}
          vehicles={vehicles}
          onOpenSelectClientModal={() => {
            setClientTab('community');
            setIsSelectClientModal(true);
          }}
          onOpenAddBandModal={() => {
            setBandSearchCommunityQuery('');
            setIsAddingBandModal(true);
          }}
          onMoveBand={handleMoveBand}
          onRemoveBand={handleRemoveBand}
          onPromoteToHeadliner={handlePromoteToHeadliner}
          onUpdateBand={handleUpdateBand}
          onSaveProgress={handleManualSaveTour}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
        />
      )}

      {/* TAB 3: Vehicles & Fleet Logistics */}
      {activeSubTab === 'vehicles' && (
        <VehiclesTab
          vehicles={vehicles}
          bands={bands}
          onAddVehicle={handleAddVehicle}
          onUpdateVehicle={handleUpdateVehicle}
          onDeleteVehicle={handleDeleteVehicle}
          onSaveProgress={handleManualSaveTour}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
        />
      )}

      {/* TAB 4: Master Day Sheet Generator */}
      {activeSubTab === 'daysheet' && (
        <DaySheetsTab
          stops={stops}
          selectedStopId={selectedStopId}
          setSelectedStopId={setSelectedStopId}
          onCopyDaySheet={handleCopyDaySheet}
          daySheetText={activeStop ? generateFormattedDaySheetText(activeStop) : ''}
        />
      )}

      {/* TAB 5: Shared Backline & Logistics */}
      {activeSubTab === 'backline' && (
        <SharedBacklineTab
          bands={bands}
          clientBandName={clientBandName}
          backlineConfig={backlineConfig}
          onUpdateBacklineConfig={handleUpdateBacklineConfig}
          onUpdateBandGearNotes={handleUpdateBandGearNotes}
          onSaveProgress={handleManualSaveTour}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
        />
      )}

      {/* TAB 6: Settlements & Financial Splits */}
      {activeSubTab === 'settlement' && (
        <SettlementTab
          bands={bands}
          stops={stops}
          totalPackageGuarantees={totalPackageGuarantees}
          totalGrossPotential={totalGrossPotential}
          onUpdateBandSplits={handleUpdateBandSplits}
          onUpdateStopDeal={handleUpdateStopDeal}
          onSaveProgress={handleManualSaveTour}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
        />
      )}

      {/* TAB 7: Confidentiality, NDA Leak Shield & Public Announcement */}
      {activeSubTab === 'privacy' && (
        <LeakShieldPrivacyTab
          publicationStatus={publicationStatus}
          embargoUntilDate={embargoUntilDate}
          tourTitle={tourTitle}
          onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          onPublish={() => {
            setPublicationStatus('public_announced');
            triggerNotification?.('🎉 Tour officially published and marked as Publicly Announced!');
            addLog?.(`TM Mode: Tour "${tourTitle}" announced publicly.`);
          }}
          onLock={() => {
            setPublicationStatus('embargoed_private');
            triggerNotification?.('🔒 Tour reverted to Private & Embargoed mode.');
            addLog?.(`TM Mode: Tour "${tourTitle}" set back to private.`);
          }}
          onSaveProgress={handleManualSaveTour}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          lastSavedAt={lastSavedAt}
        />
      )}

      {/* MODAL: Select / Change Headliner & Client Band */}
      {isSelectClientModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#0f1219] border border-amber-500/60 rounded-2xl w-full max-w-xl p-4 sm:p-5 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-tight">
                    Change Tour Headliner / Managed Client
                  </h3>
                  <p className="text-[10.5px] text-zinc-400">
                    Designate which band you are tour managing for this package run.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSelectClientModal(false)}
                className="p-1 text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sub Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950 rounded-lg border border-zinc-850 shrink-0 text-xs font-mono">
              <button
                type="button"
                onClick={() => setClientTab('community')}
                className={`flex-1 py-1.5 px-2 rounded font-bold uppercase transition text-[10px] flex items-center justify-center gap-1.5 cursor-pointer ${
                  clientTab === 'community'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                Community Band Archives ({communityBands.length})
              </button>
              <button
                type="button"
                onClick={() => setClientTab('package')}
                className={`flex-1 py-1.5 px-2 rounded font-bold uppercase transition text-[10px] flex items-center justify-center gap-1.5 cursor-pointer ${
                  clientTab === 'package'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Users className="w-3 h-3" />
                Package Lineup ({bands.length})
              </button>
              <button
                type="button"
                onClick={() => setClientTab('custom')}
                className={`flex-1 py-1.5 px-2 rounded font-bold uppercase transition text-[10px] flex items-center justify-center gap-1.5 cursor-pointer ${
                  clientTab === 'custom'
                    ? 'bg-amber-500 text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Plus className="w-3 h-3" />
                Custom Band
              </button>
            </div>

            {/* TAB 1: Community Band Profiles */}
            {clientTab === 'community' && (
              <div className="space-y-3 flex-1 overflow-hidden flex flex-col">
                <div className="relative shrink-0">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={clientSearchQuery}
                    onChange={e => setClientSearchQuery(e.target.value)}
                    placeholder="Search community band archives by name, genre, city..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-amber-400 font-mono"
                  />
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                  {communityBands
                    .filter(b => {
                      if (!clientSearchQuery.trim()) return true;
                      const q = clientSearchQuery.toLowerCase();
                      return (
                        b.name.toLowerCase().includes(q) ||
                        (b.genre && b.genre.toLowerCase().includes(q)) ||
                        (b.city && b.city.toLowerCase().includes(q)) ||
                        (b.state && b.state.toLowerCase().includes(q))
                      );
                    })
                    .map(band => {
                      const isCurrent = band.name.toLowerCase() === clientBandName.toLowerCase();
                      return (
                        <div
                          key={band.id}
                          className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                            isCurrent
                              ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/40'
                              : 'bg-zinc-950/80 border-zinc-850 hover:border-zinc-700'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {band.avatar_url || band.logo_url ? (
                              <img
                                src={band.avatar_url || band.logo_url}
                                alt={band.name}
                                className="w-9 h-9 rounded-lg object-cover border border-zinc-800 shrink-0"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold font-mono text-amber-400 text-xs shrink-0">
                                {band.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0 text-left">
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-bold text-white uppercase truncate">{band.name}</h5>
                                {band.verification_status && (
                                  <span className="text-[7.5px] font-mono px-1 py-0.2 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 uppercase">
                                    {band.verification_status === 'verified_official' ? 'Verified' : 'Community'}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 truncate">
                                <span>{band.genre || 'Extreme Metal'}</span>
                                {band.city && <span className="text-zinc-600"> • </span>}
                                {band.city && <span>{band.city}{band.state ? `, ${band.state}` : ''}</span>}
                              </p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isCurrent ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-amber-500 text-black font-mono font-bold text-[9px] uppercase tracking-wider shadow">
                                <CheckCircle2 className="w-3 h-3 stroke-[3]" /> Active Client
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleSelectClient(band.name, band, true)}
                                className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-black border border-amber-500/40 font-mono font-bold text-[9.5px] uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Crown className="w-3 h-3" /> Select as Client
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}

                  {communityBands.length === 0 && (
                    <div className="p-4 text-center text-xs text-zinc-500 font-mono">
                      No community band profiles found. Create them in the Community directory or use the Custom Band tab.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 2: Package Lineup Bands */}
            {clientTab === 'package' && (
              <div className="space-y-2 flex-1 overflow-y-auto">
                <p className="text-[11px] text-zinc-400 text-left">
                  Promote any band currently on the tour package bill to Headliner &amp; Managed Client:
                </p>
                <div className="space-y-2">
                  {bands.map((b, idx) => {
                    const isHeadliner = b.role === 'headliner' || b.name.toLowerCase() === clientBandName.toLowerCase();
                    return (
                      <div
                        key={b.id}
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                          isHeadliner
                            ? 'bg-amber-950/40 border-amber-500/60 ring-1 ring-amber-500/30'
                            : 'bg-zinc-950/80 border-zinc-850'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-left">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${b.avatarColor} flex items-center justify-center font-bold text-white font-mono text-xs shrink-0`}>
                            {idx + 1}
                          </div>
                          <div>
                            <h5 className="text-xs font-bold text-white uppercase">{b.name}</h5>
                            <span className="text-[9px] font-mono text-zinc-400">
                              Current slot: {b.role.replace('_', ' ')} • {b.setMinutes} min set
                            </span>
                          </div>
                        </div>

                        {isHeadliner ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-amber-500 text-black font-mono font-bold text-[9px] uppercase tracking-wider">
                            <Crown className="w-3 h-3 fill-black" /> Current Headliner
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handlePromoteToHeadliner(b.id)}
                            className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-[9px] uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
                          >
                            <Crown className="w-3 h-3" /> Make Headliner
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: Custom Client Band */}
            {clientTab === 'custom' && (
              <div className="space-y-3 flex-1 overflow-y-auto text-left text-xs font-mono">
                <p className="text-[11px] text-zinc-400 font-sans">
                  Enter a band you are managing for this tour run if they don't have a community profile yet.
                </p>

                <div className="space-y-2">
                  <div>
                    <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Client Band Name *</label>
                    <input
                      type="text"
                      value={customClientName}
                      onChange={e => setCustomClientName(e.target.value)}
                      placeholder="e.g. Mortician"
                      className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Genre</label>
                      <input
                        type="text"
                        value={customClientGenre}
                        onChange={e => setCustomClientGenre(e.target.value)}
                        placeholder="Brutal Death Metal"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Hometown / City</label>
                      <input
                        type="text"
                        value={customClientCity}
                        onChange={e => setCustomClientCity(e.target.value)}
                        placeholder="Yonkers, NY"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Band Contact / TM Rep</label>
                      <input
                        type="text"
                        value={customClientContact}
                        onChange={e => setCustomClientContact(e.target.value)}
                        placeholder="Will Rahmer"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Rep Phone</label>
                      <input
                        type="text"
                        value={customClientPhone}
                        onChange={e => setCustomClientPhone(e.target.value)}
                        placeholder="(555) 789-1029"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!customClientName.trim()) return;
                      handleSelectClient(customClientName.trim(), null, true);
                    }}
                    disabled={!customClientName.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
                  >
                    Set as Headliner &amp; Client
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-zinc-800 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsSelectClientModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Band to Package */}
      {isAddingBandModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#10131a] border border-amber-500/50 rounded-2xl w-full max-w-md p-4 space-y-3 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">Add Band to Tour Package</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingBandModal(false)}
                className="p-1 text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Community Band Suggestions */}
            {communityBands.length > 0 && (
              <div className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-850 space-y-1.5 text-left">
                <span className="text-[8.5px] font-mono font-bold text-amber-400 uppercase block">
                  ⚡️ Quick-Pick from Community Band Archives
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                  {communityBands.slice(0, 12).map(b => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => handleQuickFillFromCommunity(b)}
                      className="px-2 py-0.5 rounded bg-zinc-900 hover:bg-amber-500/20 border border-zinc-800 hover:border-amber-500/40 text-[9px] font-mono text-zinc-300 hover:text-amber-300 transition-colors cursor-pointer"
                    >
                      + {b.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2.5 text-left text-xs font-mono">
              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Band / Artist Name</label>
                <input
                  type="text"
                  value={newBandName}
                  onChange={e => setNewBandName(e.target.value)}
                  placeholder="e.g. 200 Stab Wounds"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Billing Role</label>
                  <select
                    value={newBandRole}
                    onChange={e => setNewBandRole(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  >
                    <option value="headliner">Headliner &amp; Client</option>
                    <option value="direct_support">Direct Support</option>
                    <option value="opener">Tour Opener</option>
                    <option value="local_support">Local Opener</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Set Length (Mins)</label>
                  <input
                    type="number"
                    value={newBandSetMinutes}
                    onChange={e => setNewBandSetMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Nightly Guarantee ($)</label>
                  <input
                    type="number"
                    value={newBandGuarantee}
                    onChange={e => setNewBandGuarantee(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Package Split %</label>
                  <input
                    type="number"
                    value={newBandSplitPct}
                    onChange={e => setNewBandSplitPct(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Contact Person / TM</label>
                  <input
                    type="text"
                    value={newBandContact}
                    onChange={e => setNewBandContact(e.target.value)}
                    placeholder="e.g. Dave"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newBandPhone}
                    onChange={e => setNewBandPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Shared Gear &amp; Backline Notes</label>
                <input
                  type="text"
                  value={newBandGear}
                  onChange={e => setNewBandGear(e.target.value)}
                  placeholder="e.g. Shares bass cab, brings own kick pedal & cymbals"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddingBandModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddBand}
                disabled={!newBandName.trim()}
                className="px-4 py-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
              >
                Add Band to Lineup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add Tour Stop */}
      {isAddingStopModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#10131a] border border-emerald-500/50 rounded-2xl w-full max-w-md p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase font-mono">Add Tour Route Stop</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingStopModal(false)}
                className="p-1 text-zinc-500 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-left text-xs font-mono">
              {/* Seamless Black Book Lookup Section */}
              <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-amber-300 font-bold uppercase flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3 text-amber-400" />
                    Pick Venue from Black Book
                  </span>
                  {newStopBlackBookVenueId && (
                    <span className="text-[7.5px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-500/40 px-1 py-0.2 rounded font-bold">
                      ✓ Black Book Linked
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={newStopSearchQuery}
                    onChange={async (e) => {
                      const q = e.target.value;
                      setNewStopSearchQuery(q);
                      if (q.trim().length > 0) {
                        try {
                          const res = await searchBlackBookVenues(q);
                          setNewStopSuggestions(res);
                        } catch {
                          setNewStopSuggestions([]);
                        }
                      } else {
                        setNewStopSuggestions([]);
                      }
                    }}
                    placeholder="Search Black Book (e.g. Echo, Belasco, Catalyst, Neumos)..."
                    className="w-full px-2.5 py-1.5 bg-zinc-950 border border-zinc-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-amber-500"
                  />
                  {newStopSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-zinc-900 border border-amber-500/50 rounded-xl shadow-2xl p-1.5 z-50 max-h-40 overflow-y-auto space-y-1">
                      {newStopSuggestions.map(v => (
                        <div
                          key={v.id}
                          onClick={() => {
                            setNewStopVenue(v.name);
                            if (v.city) setNewStopCity(v.city);
                            if (v.state) setNewStopState(v.state);
                            if (v.capacity) setNewStopCapacity(typeof v.capacity === 'number' ? v.capacity : parseInt(v.capacity) || 500);
                            setNewStopBlackBookVenueId(v.id);
                            if (v.fullAddress) setNewStopParking(`Address: ${v.fullAddress}`);
                            setNewStopSuggestions([]);
                            setNewStopSearchQuery('');
                            triggerNotification?.(`Inserted "${v.name}" from Black Book!`);
                          }}
                          className="p-1.5 rounded-lg bg-zinc-950 hover:bg-amber-950/50 border border-zinc-800 hover:border-amber-500/40 cursor-pointer flex items-center justify-between transition-colors"
                        >
                          <div>
                            <span className="text-xs font-bold text-white uppercase block">{v.name}</span>
                            <span className="text-[8.5px] font-mono text-zinc-400">{v.city}{v.state ? `, ${v.state}` : ''} • Cap: {v.capacity || 'N/A'}</span>
                          </div>
                          <span className="text-[8.5px] font-mono text-amber-400 uppercase font-bold">
                            Insert +
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Date</label>
                  <input
                    type="date"
                    value={newStopDate}
                    onChange={e => setNewStopDate(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Gross Deal ($)</label>
                  <input
                    type="number"
                    value={newStopGrossDeal}
                    onChange={e => setNewStopGrossDeal(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Venue Name</label>
                <input
                  type="text"
                  value={newStopVenue}
                  onChange={e => setNewStopVenue(e.target.value)}
                  placeholder="e.g. Chain Reaction"
                  className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">City</label>
                  <input
                    type="text"
                    value={newStopCity}
                    onChange={e => setNewStopCity(e.target.value)}
                    placeholder="Anaheim"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">State</label>
                  <input
                    type="text"
                    value={newStopState}
                    onChange={e => setNewStopState(e.target.value)}
                    placeholder="CA"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newStopCapacity}
                    onChange={e => setNewStopCapacity(parseInt(e.target.value) || 500)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[8px] text-zinc-400 uppercase font-bold block mb-1">Load-In</label>
                  <input
                    type="time"
                    value={newStopLoadIn}
                    onChange={e => setNewStopLoadIn(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-zinc-400 uppercase font-bold block mb-1">Doors</label>
                  <input
                    type="time"
                    value={newStopDoors}
                    onChange={e => setNewStopDoors(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[8px] text-zinc-400 uppercase font-bold block mb-1">Downbeat</label>
                  <input
                    type="time"
                    value={newStopDownbeat}
                    onChange={e => setNewStopDownbeat(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Production Contact</label>
                  <input
                    type="text"
                    value={newStopContact}
                    onChange={e => setNewStopContact(e.target.value)}
                    placeholder="PM Name"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={newStopPhone}
                    onChange={e => setNewStopPhone(e.target.value)}
                    placeholder="(555) 000-0000"
                    className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1.5 text-white focus:outline-none focus:ring-1 focus:ring-emerald-400"
                  />
                </div>
              </div>

              {/* Seamless Black Book integration toggle */}
              <div className="pt-1.5 border-t border-zinc-800/80">
                <label className="flex items-center gap-2 cursor-pointer select-none group">
                  <input
                    type="checkbox"
                    checked={newStopSaveToBlackBook}
                    onChange={e => setNewStopSaveToBlackBook(e.target.checked)}
                    className="w-4 h-4 rounded border-zinc-750 bg-zinc-900 text-amber-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-amber-500"
                  />
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-mono text-zinc-300 group-hover:text-amber-300 transition-colors">
                      Auto-sync venue to <strong className="text-amber-400">Black Book Rolodex</strong> if not yet registered
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsAddingStopModal(false)}
                className="px-3 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-mono text-xs uppercase cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddStop}
                disabled={!newStopVenue.trim() || !newStopCity.trim()}
                className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
              >
                Add Tour Stop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Privacy, NDA Embargo & Public Announcement Settings */}
      {isPrivacyModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-[#0f1219] border border-rose-500/60 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-left">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-rose-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-tight">
                    Tour Confidentiality &amp; Release Safeguards
                  </h3>
                  <p className="text-[10.5px] text-zinc-400">
                    Prevent premature leaks until routing is 100% confirmed and announced.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivacyModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Privacy Mode Selector */}
            <div className="space-y-2.5">
              <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase block">
                Select Publication Status:
              </label>

              <div
                onClick={() => setPublicationStatus('embargoed_private')}
                className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                  publicationStatus === 'embargoed_private'
                    ? 'bg-rose-950/40 border-rose-500 ring-1 ring-rose-500/40'
                    : 'bg-zinc-950/80 border-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-white uppercase font-mono">
                      🔒 Strictly Private &amp; Embargoed (Default)
                    </span>
                  </div>
                  {publicationStatus === 'embargoed_private' && (
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-rose-500 text-black font-black uppercase">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal pl-6">
                  Guarantees, routing holds, and day sheets remain isolated strictly within your Tour Manager session. Zero public discovery leaks.
                </p>
              </div>

              <div
                onClick={() => setPublicationStatus('confirmed_routing')}
                className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                  publicationStatus === 'confirmed_routing'
                    ? 'bg-amber-950/40 border-amber-500 ring-1 ring-amber-500/40'
                    : 'bg-zinc-950/80 border-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-bold text-white uppercase font-mono">
                      🟡 Internal Confirmed (Pre-Announce Locked)
                    </span>
                  </div>
                  {publicationStatus === 'confirmed_routing' && (
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-amber-500 text-black font-black uppercase">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal pl-6">
                  All dates confirmed with venues and signed by artists. Information remains embargoed until official press blast.
                </p>
              </div>

              <div
                onClick={() => setPublicationStatus('public_announced')}
                className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1 ${
                  publicationStatus === 'public_announced'
                    ? 'bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500/40'
                    : 'bg-zinc-950/80 border-zinc-850 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white uppercase font-mono">
                      🟢 Publicly Announced &amp; Live
                    </span>
                  </div>
                  {publicationStatus === 'public_announced' && (
                    <span className="text-[8px] font-mono px-1.5 py-0.2 rounded bg-emerald-500 text-black font-black uppercase">
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-zinc-400 leading-normal pl-6">
                  Tour flyer is released, tickets on sale, and routing is live for fan discovery.
                </p>
              </div>
            </div>

            {/* Embargo Lift Target Date Field */}
            <div className="space-y-1 pt-1 border-t border-zinc-850">
              <label className="text-[9.5px] font-mono font-bold text-zinc-400 uppercase block">
                Press &amp; Artist Embargo Lift Time:
              </label>
              <input
                type="datetime-local"
                value={embargoUntilDate}
                onChange={e => setEmbargoUntilDate(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-700 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:ring-1 focus:ring-rose-400"
              />
              <span className="text-[8.5px] font-mono text-zinc-500 block">
                Artists and reps are under agreement not to share flyers prior to this timestamp.
              </span>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  setIsPrivacyModalOpen(false);
                  triggerNotification?.(`Confidentiality status set to: ${publicationStatus.replace('_', ' ').toUpperCase()}`);
                }}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-xs uppercase cursor-pointer"
              >
                Save Safeguards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Create New Tour Workspace Modal */}
      {isCreateTourModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-cyan-500/50 rounded-2xl w-full max-w-lg p-5 shadow-2xl relative space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold font-display uppercase tracking-wider text-white">
                  Create New Tour Package Workspace
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateTourModalOpen(false)}
                className="p-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewTour} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase block">
                  Tour Run Title / Package Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midwest Bloodshed Tour 2026"
                  value={newTourTitleInput}
                  onChange={e => setNewTourTitleInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                  autoFocus
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono font-bold text-zinc-300 uppercase block">
                  Primary Client / Headliner Band
                </label>
                <input
                  type="text"
                  placeholder="e.g. 200 Stab Wounds"
                  value={newTourClientInput}
                  onChange={e => setNewTourClientInput(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:ring-2 focus:ring-cyan-400"
                />
                <span className="text-[10px] font-mono text-zinc-500 block">
                  Defaults to independent community band roster. Does not affect your main personal roster subscription tier.
                </span>
              </div>

              <div className="bg-cyan-950/30 border border-cyan-500/20 rounded-lg p-3 text-[11px] text-cyan-200/90 leading-relaxed font-mono">
                💡 <strong>Multi-Tour Isolation:</strong> Each tour package maintains its own isolated routing schedule, confidential day sheets, multi-band backline agreements, and leak embargo settings.
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsCreateTourModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono font-bold uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTourTitleInput.trim()}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-black text-xs font-mono font-black uppercase cursor-pointer transition shadow-lg"
                >
                  Create Tour Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TourManagerPackageModule;
