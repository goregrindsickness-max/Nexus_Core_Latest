import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, DollarSign, Clock, MapPin, Building, Users, 
  Trash2, Copy, Check, Info, FileText, ChevronDown, Sparkles, Coffee, ShieldAlert, AlertTriangle
} from 'lucide-react';
import { Show, GuestListItem, SupportBand } from '../../../types';

const US_STATES = [
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

const COUNTRIES = [
  'United States',
  'Canada',
  'United Kingdom',
  'Australia',
  'Germany',
  'France',
  'Japan',
  'New Zealand',
  'Ireland',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Italy',
  'Spain',
  'Portugal',
  'Denmark',
  'Norway',
  'Sweden',
  'Finland',
  'Mexico',
  'Brazil',
  'Argentina',
  'Chile',
  'Colombia',
  'South Africa',
  'South Korea',
  'Singapore',
  'Hong Kong',
  'Malaysia',
  'Thailand',
  'India',
  'China'
];

interface ShowFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (showData: any) => void;
  onDuplicate?: (show: Show) => void;
  editingShow?: Show | null;
  shows: Show[];
  initialShowType?: 'headliner' | 'support' | 'festival' | 'tour date' | 'one-off';
}

export default function ShowFormModal({
  isOpen,
  onClose,
  onSubmit,
  onDuplicate,
  editingShow,
  shows,
  initialShowType
}: ShowFormModalProps) {

  // Form Fields
  const [eventScope, setEventScope] = useState<'tour' | 'single'>('tour');
  const [tourId, setTourId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [festivalName, setFestivalName] = useState<string>('');
  const [venueAddress, setVenueAddress] = useState<string>('');
  const [city, setCity] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [promoterContact, setPromoterContact] = useState<string>('');
  
  // Logistics
  const [loadInTime, setLoadInTime] = useState<string>('');
  const [doorsTime, setDoorsTime] = useState<string>('');
  const [setTime, setSetTime] = useState<string>('');
  
  const [venueCutPercentage, setVenueCutPercentage] = useState<number>(0);
  const [guaranteeAmount, setGuaranteeAmount] = useState<number>(0);
  const [currency, setCurrency] = useState<string>('USD ($)');
  const [taxRate, setTaxRate] = useState<number>(0);
  
  const [showType, setShowType] = useState<'headliner' | 'support' | 'festival' | 'tour date' | 'one-off'>('headliner');
  const [expectedAttendance, setExpectedAttendance] = useState<'+100' | '100-300' | '300-700' | '700+'>('100-300');
  
  // Custom added fields
  const [stateProvince, setStateProvince] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [customStateMode, setCustomStateMode] = useState<boolean>(false);
  const [customCountryMode, setCustomCountryMode] = useState<boolean>(false);
  const [curfewTime, setCurfewTime] = useState<string>('');
  const [merchSpaceFee, setMerchSpaceFee] = useState<number>(0);
  const [sellerCost, setSellerCost] = useState<number>(0);
  const [tablesProvided, setTablesProvided] = useState<boolean>(false);
  const [hangingGridsProvided, setHangingGridsProvided] = useState<boolean>(false);
  const [shorePower, setShorePower] = useState<boolean>(false);
  const [parkingArrangements, setParkingArrangements] = useState<string>('');
  const [ageRestriction, setAgeRestriction] = useState<'all' | '18' | '21'>('all');
  const [wifiNetwork, setWifiNetwork] = useState<string>('');
  const [wifiPassword, setWifiPassword] = useState<string>('');

  const [isCommunitySubmitted, setIsCommunitySubmitted] = useState<boolean>(false);
  const [externalTicketUrl, setExternalTicketUrl] = useState<string>('');
  const [isTime24Hour, setIsTime24Hour] = useState<boolean>(() => { try { return localStorage.getItem('tour_time_is_24h') !== 'false'; } catch(e) { return true; } });

  const existingDuplicateMatch = useMemo(() => {
    if (!date || (!city && !name)) return null;
    return shows.find(s => s.date === date && (
      (city && s.city?.toLowerCase() === city.toLowerCase()) || 
      (name && s.name?.toLowerCase() === name.toLowerCase())
    ) && s.id !== editingShow?.id);
  }, [date, city, name, shows, editingShow]);

  // Time Inputs Refs
  const loadInRef = React.useRef<HTMLInputElement | null>(null);
  const doorsRef = React.useRef<HTMLInputElement | null>(null);
  const setRef = React.useRef<HTMLInputElement | null>(null);
  const curfewRef = React.useRef<HTMLInputElement | null>(null);
  const merchCallRef = React.useRef<HTMLInputElement | null>(null);
  const soundcheckRef = React.useRef<HTMLInputElement | null>(null);

  // Time formatting display
  const formatTimeDisplay = (time24: string) => {
    if (!time24) return 'Not Set';
    if (isTime24Hour) return time24;
    try {
      const parts = time24.split(':');
      if (parts.length < 2) return time24;
      let hrs = parseInt(parts[0], 10);
      const mins = parts[1];
      if (isNaN(hrs)) return time24;
      const ampm = hrs >= 12 ? 'PM' : 'AM';
      hrs = hrs % 12;
      if (hrs === 0) hrs = 12;
      const hrStr = hrs.toString().padStart(2, '0');
      return `${hrStr}:${mins} ${ampm}`;
    } catch (_) {
      return time24;
    }
  };

  const triggerTimePicker = (ref: React.RefObject<HTMLInputElement | null>) => {
    try {
      if (ref.current) {
        if (typeof ref.current.showPicker === 'function') {
          ref.current.showPicker();
        } else {
          ref.current.click();
        }
      }
    } catch (err) {
      console.error("Failed to show time picker", err);
    }
  };
  
  // Guest List local state
  const [guestList, setGuestList] = useState<GuestListItem[]>([]);
  const [tempGuestName, setTempGuestName] = useState<string>('');
  const [tempAdditionalCount, setTempAdditionalCount] = useState<number>(0);
  
  const [additionalNotes, setAdditionalNotes] = useState<string>('');
  
  const [merchCallTime, setMerchCallTime] = useState<string>('');
  const [soundcheckTime, setSoundcheckTime] = useState<string>('');
  const [dinnerArrangements, setDinnerArrangements] = useState<string>('');
  const [localFoodNotes, setLocalFoodNotes] = useState<string>('');
  const [emergencyMedicalInfo, setEmergencyMedicalInfo] = useState<string>('');
  const [localPharmacyInfo, setLocalPharmacyInfo] = useState<string>('');
  const [isHuntingHospitals, setIsHuntingHospitals] = useState<boolean>(false);
  const [audioProductionRequirements, setAudioProductionRequirements] = useState<string>('');
  const [stageBacklineRequirements, setStageBacklineRequirements] = useState<string>('');
  const [stageName, setStageName] = useState<string>('');
  const [timeSlot, setTimeSlot] = useState<string>('');
  const [supportLineup, setSupportLineup] = useState<SupportBand[]>([]);

  // Venue auto-suggest state
  const [venueSuggestions, setVenueSuggestions] = useState<any[]>([]);
  const [showVenueDropdown, setShowVenueDropdown] = useState(false);
  const [isSearchingVenues, setIsSearchingVenues] = useState(false);
  const searchTimeoutRef = React.useRef<number | null>(null);

  const handleVenueSearch = (query: string) => {
    setName(query);
    if (!query || query.length < 3) {
      setVenueSuggestions([]);
      setShowVenueDropdown(false);
      return;
    }

    setShowVenueDropdown(true);
    setIsSearchingVenues(true);

    if (searchTimeoutRef.current) {
      window.clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = window.setTimeout(async () => {
      const qLower = query.toLowerCase();
      // 1. Search existing shows locally
      const localMatches: any[] = [];
      const seenNames = new Set<string>();

      shows.forEach(s => {
        if (s.name && s.name.toLowerCase().includes(qLower) && !seenNames.has(s.name.toLowerCase())) {
          seenNames.add(s.name.toLowerCase());
          localMatches.push({
            name: s.name,
            address: s.venue_address,
            city: s.city,
            state: s.state_province,
            country: s.country,
            source: 'directory'
          });
        }
      });

      // Prefer local matches, if any, otherwise fallback to OpenStreetMap (Nominatim)
      if (localMatches.length > 0) {
        setVenueSuggestions(localMatches.slice(0, 5));
        setIsSearchingVenues(false);
      } else {
        // 2. Fetch from Nominatim API if directory has no exact matches
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=jsonv2&addressdetails=1&limit=5`, {
            headers: {
              'Accept-Language': 'en-US,en;q=0.9',
              'User-Agent': 'NexusCore/1.0 (tourmanagement)' // required by Nominatim ToS
            }
          });
          if (!res.ok) {
            throw new Error(`Nominatim autocomplete error (status ${res.status})`);
          }
          const autocompleteContentType = res.headers.get("content-type") || "";
          if (!autocompleteContentType.includes("application/json")) {
            throw new Error("Nominatim autocomplete returned non-JSON response.");
          }
          const data = await res.json();
          if (data && data.length > 0) {
            const webMatches = data.map((item: any) => ({
              name: item?.name || (item.display_name).split(',')[0],
              address: item.address?.road ? `${item.address?.house_number || ''} ${item.address?.road}`.trim() : '',
              city: item.address?.city || item.address?.town || item.address?.village || '',
              state: item.address?.state || '',
              country: item.address?.country || '',
              source: 'online'
            }));
            const validMatches = webMatches.filter((m: any) => m.name && m.name.toLowerCase().includes(qLower));
            setVenueSuggestions(validMatches.length > 0 ? validMatches : webMatches);
          } else {
            setVenueSuggestions([]);
          }
        } catch (err) {
          console.error("Venue search error", err);
          setVenueSuggestions([]);
        } finally {
          setIsSearchingVenues(false);
        }
      }
    }, 600);
  };

  // Extract unique tour IDs/names from existing shows for the dropdown list
  const uniqueTours = Array.from(
    new Set(
      shows
        .map(s => s.tour_id || (s.event_scope === 'tour' ? 'Savage Ascension Tour' : ''))
        .filter(t => t !== '')
    )
  );

  // If no tours found, seed standard ones
  if (uniqueTours.length === 0) {
    uniqueTours.push('Savage Ascension North American Tour');
    uniqueTours.push('Maryland Deathfest Warmup Run');
    uniqueTours.push('Relentless Devastation European Invasion');
  }

  // Pre-load form state if editingShow is specified
  useEffect(() => {
    if (editingShow) {
      const stateVal = editingShow.state_province || '';
      const countryVal = editingShow.country || 'United States';
      const isUSState = US_STATES.some(s => s.code.toUpperCase() === stateVal.trim().toUpperCase());
      const isStandardCountry = COUNTRIES.some(c => c.toLowerCase() === countryVal.trim().toLowerCase());

      setEventScope(editingShow.event_scope || 'tour');
      setTourId(editingShow.tour_id || '');
      setName(editingShow.name || '');
      setFestivalName(editingShow.festival_name || '');
      setVenueAddress(editingShow.venue_address || '');
      setCity(editingShow.city || '');
      setStateProvince(stateVal);
      setCountry(countryVal);
      setCustomStateMode(stateVal ? !isUSState : false);
      setCustomCountryMode(countryVal ? !isStandardCountry : false);
      setDate(editingShow.date || '');
      setPromoterContact(editingShow.promoter_contact || '');
      
      setLoadInTime(editingShow.load_in_time || '');
      setDoorsTime(editingShow.doors_time || '');
      setSetTime(editingShow.set_time || '');
      setCurfewTime(editingShow.curfew_time || '');
      
      setVenueCutPercentage(editingShow.venue_cut_percentage !== undefined ? editingShow.venue_cut_percentage : 0);
      setGuaranteeAmount(editingShow.guarantee_amount || editingShow.revenue || 0);
      setCurrency(editingShow.currency || 'USD ($)');
      setTaxRate(editingShow.tax_rate || 0);
      
      setShowType(editingShow.show_type || 'headliner');
      setExpectedAttendance((editingShow.expected_attendance as any) || '100-300');
      setGuestList(editingShow.guest_list || []);
      
      setMerchSpaceFee(editingShow.merch_space_fee || 0);
      setSellerCost(editingShow.seller_cost || 0);
      setTablesProvided(!!editingShow.tables_provided);
      setHangingGridsProvided(!!editingShow.hanging_grids_provided);
      setShorePower(!!editingShow.shore_power);
      setParkingArrangements(editingShow.parking_arrangements || '');
      setAgeRestriction((editingShow.age_restriction || 'all') as "all" | "18" | "21");
      setWifiNetwork(editingShow.wifi_network || '');
      setWifiPassword(editingShow.wifi_password || '');
      setMerchCallTime(editingShow.merch_call_time || '');
      setSoundcheckTime(editingShow.soundcheck_time || '');
      setDinnerArrangements(editingShow.dinner_arrangements || '');
      setLocalFoodNotes(editingShow.local_food_notes || '');
      setEmergencyMedicalInfo(editingShow.emergency_medical_info || '');
      setLocalPharmacyInfo(editingShow.local_pharmacy_info || '');
      setAudioProductionRequirements(editingShow.audio_production_requirements || '');
      setStageBacklineRequirements(editingShow.stage_backline_requirements || '');
      setStageName(editingShow.stage_name || '');
      setTimeSlot(editingShow.time_slot || 'all-day');
      setSupportLineup(editingShow.support_lineup || []);
      
      setAdditionalNotes(editingShow.additional_notes || '');
      setIsCommunitySubmitted(!!editingShow.is_community_submitted);
      setExternalTicketUrl(editingShow.external_ticket_url || '');
    } else {
      // Set default dates & values for a new show
      setEventScope('tour');
      setTourId(uniqueTours[0] || '');
      setName('');
      setFestivalName('');
      setVenueAddress('');
      setCity('');
      setStateProvince('');
      setCountry('United States');
      setCustomStateMode(false);
      setCustomCountryMode(false);
      setDate(new Date().toISOString().split('T')[0]);
      setPromoterContact('');
      setLoadInTime('');
      setDoorsTime('');
      setSetTime('');
      setCurfewTime('');
      setVenueCutPercentage(0); // Preset venue cut to 0% by default as requested
      setGuaranteeAmount(500);
      setCurrency('USD ($)');
      setTaxRate(0);
      setShowType(initialShowType || 'headliner');
      if (initialShowType === 'one-off' || initialShowType === 'festival') {
        setEventScope('single');
      }
      setExpectedAttendance('100-300');
      setGuestList([]);
      setMerchSpaceFee(0);
      setSellerCost(0);
      setTablesProvided(false);
      setHangingGridsProvided(false);
      setShorePower(false);
      setParkingArrangements('');
      setAgeRestriction('all');
      setWifiNetwork('');
      setWifiPassword('');
      setMerchCallTime('');
      setSoundcheckTime('');
      setDinnerArrangements('');
      setLocalFoodNotes('');
      setEmergencyMedicalInfo('');
      setLocalPharmacyInfo('');
      setAudioProductionRequirements('');
      setStageBacklineRequirements('');
      setStageName('');
      setTimeSlot('all-day');
      setSupportLineup([]);
      setAdditionalNotes('');
    }
  }, [editingShow, isOpen]);

  const handleAddGuest = () => {
    if (!tempGuestName.trim()) return;
    const newItem: GuestListItem = {
      id: Math.random().toString(36).substring(2, 9),
      name: tempGuestName.trim(),
      additional_count: tempAdditionalCount
    };
    setGuestList(prev => [...prev, newItem]);
    setTempGuestName('');
    setTempAdditionalCount(0);
  };

  const handleRemoveGuest = (id: string) => {
    setGuestList(prev => prev.filter(g => g.id !== id));
  };

  const handleAddSupportBand = () => {
    setSupportLineup(prev => [...prev, { name: '', start_time: '', end_time: '' }]);
  };

  const handleRemoveSupportBand = (index: number) => {
    setSupportLineup(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateSupportBand = (index: number, field: keyof SupportBand, value: string) => {
    setSupportLineup(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAutoSuggestEmergency = async () => {
    if (!venueAddress.trim() || !city.trim()) {
      alert("Please enter both Venue Address and City first.");
      setEmergencyMedicalInfo("Nearest Hospital: [Name]\nAddress: [Address]\nPhone: [Phone]\nNotes: ~24/7 ER");
      setLocalPharmacyInfo("Nearest Pharmacy: [Name]\nAddress: [Address]");
      setLocalFoodNotes("1. [Restaurant Name] - [Cuisine]\n2. [Cafe Name] - [Coffee/Breakfast]");
      return;
    }
    
    setIsHuntingHospitals(true);
    try {
      const q = encodeURIComponent(`${venueAddress}, ${city}`);
      const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}`);
      if (!geoRes.ok) {
        throw new Error(`Nominatim geocoding failed (status ${geoRes.status})`);
      }
      const geoContentType = geoRes.headers.get("content-type") || "";
      if (!geoContentType.includes("application/json")) {
        throw new Error("Nominatim geocoding returned non-JSON response.");
      }
      const geoData = await geoRes.json();
      
      if (!geoData || geoData.length === 0) {
        throw new Error("Address not found.");
      }
      
      const { lat, lon } = geoData[0];
      
      // Look up Hospital and Clinics (nodes, ways, relations), Pharmacy, and Restaurants in one go using Overpass QL
      const overpassQuery = `[out:json];
        (
          nwr(around:5000,${lat},${lon})["amenity"="hospital"];
          nwr(around:5000,${lat},${lon})["amenity"="clinic"];
          node(around:5000,${lat},${lon})["amenity"="pharmacy"];
          node(around:2000,${lat},${lon})["amenity"="restaurant"];
          node(around:2000,${lat},${lon})["amenity"="cafe"];
        );
        out center;`;
        
      const poiRes = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: overpassQuery
      });
      if (!poiRes.ok) {
        setEmergencyMedicalInfo("Nearest Hospital: [Name]\nAddress: [Address]\nPhone: [Phone]\nNotes: ~24/7 ER");
        setLocalPharmacyInfo("Nearest Pharmacy: [Name]\nAddress: [Address]");
        setLocalFoodNotes("1. [Restaurant Name] - [Cuisine]\n2. [Cafe Name] - [Coffee/Breakfast]");
        setIsHuntingHospitals(false);
        return;
      }
      const poiContentType = poiRes.headers.get("content-type") || "";
      if (!poiContentType.includes("application/json")) {
        setEmergencyMedicalInfo("Nearest Hospital: [Name]\nAddress: [Address]\nPhone: [Phone]\nNotes: ~24/7 ER");
        setLocalPharmacyInfo("Nearest Pharmacy: [Name]\nAddress: [Address]");
        setLocalFoodNotes("1. [Restaurant Name] - [Cuisine]\n2. [Cafe Name] - [Coffee/Breakfast]");
        setIsHuntingHospitals(false);
        return;
      }
      const poiData = await poiRes.json();
      
      const elements = poiData?.elements || [];
      
      // Keywords that indicate clean, non-emergency clinics/offices we should filter out in a real emergency
      const blacklistedKeywords = [
        'rehab', 'rehabilitation', 'dental', 'dentist', 'veterinary', 'animal', 'pet', 'nursing', 'retirement', 
        'psychiatric', 'mental', 'addiction', 'substance', 'skin', 'cosmetic', 'spa', 'therapy', 'chiropractic', 
        'orthodontic', 'family medicine', 'pediatric', 'physiotherapy', 'optometry', 'nursing home', 'physio', 
        'wellness', 'massage', 'acupuncture', 'beauty', 'laser', 'podiatry'
      ];

      // Step 1: Look for premium "hospital" elements that don't have blocklisted keywords
      let selectedHospital = null;
      
      const hospitals = elements.filter((e: any) => e.tags?.amenity === 'hospital');
      const cleanHospitals = hospitals.filter((h: any) => {
        const name = (h.tags?.name || '').toLowerCase();
        return !(blacklistedKeywords || []).some(kw => name.includes(kw));
      });

      if (cleanHospitals.length > 0) {
        // Prioritize hospitals that state emergency/ER availability or have "hospital" / "medical center" in name
        const withEr = cleanHospitals.filter((h: any) => h.tags?.emergency === 'yes' || (h.tags?.name || '').toLowerCase().includes('emergency'));
        const withMedCenter = cleanHospitals.filter((h: any) => (h.tags?.name || '').toLowerCase().includes('medical center') || (h.tags?.name || '').toLowerCase().includes('hospital'));
        
        selectedHospital = withEr[0] || withMedCenter[0] || cleanHospitals[0];
      }

      // Step 2: Fallback to non-blacklisted "clinic" / local health centers if no clean hospital found
      if (!selectedHospital) {
        const clinics = elements.filter((e: any) => e.tags?.amenity === 'clinic');
        const cleanClinics = clinics.filter((c: any) => {
          const name = (c.tags?.name || '').toLowerCase();
          return !(blacklistedKeywords || []).some(kw => name.includes(kw));
        });

        if (cleanClinics.length > 0) {
          // Prioritize urgent care or emergency mentions
          const pocketEr = cleanClinics.filter((c: any) => c.tags?.emergency === 'yes' || (c.tags?.name || '').toLowerCase().includes('urgent') || (c.tags?.name || '').toLowerCase().includes('emergency'));
          selectedHospital = pocketEr[0] || cleanClinics[0];
        }
      }

      // Step 3: Absolute final fallback to any hospital element if everything is filtered out
      if (!selectedHospital && hospitals.length > 0) {
        selectedHospital = hospitals[0];
      }

      if (selectedHospital) {
        const hName = selectedHospital.tags?.name || "Nearest Emergency Room";
        
        let hAddr = '';
        if (selectedHospital.tags?.["addr:housenumber"] && selectedHospital.tags?.["addr:street"]) {
          hAddr = `${selectedHospital.tags["addr:housenumber"]} ${selectedHospital.tags["addr:street"]}`;
          if (selectedHospital.tags?.["addr:city"]) {
            hAddr += `, ${selectedHospital.tags["addr:city"]}`;
          }
        } else {
          hAddr = selectedHospital.tags?.["addr:full"] || selectedHospital.tags?.["contact:address"] || `${city} Area (See directions)`;
        }

        let notesStr = "";
        const isUrgentCare = (selectedHospital.tags?.name || '').toLowerCase().includes('urgent');
        
        if (selectedHospital.tags?.emergency === 'yes' || (selectedHospital.tags?.name || '').toLowerCase().includes('emergency')) {
          notesStr = "\nNotes: Has 24/7 dedicated Emergency Room (ER) ✅";
        } else if (isUrgentCare) {
          notesStr = "\nNotes: Urgent Care Center (Always verify hours)";
        } else if (selectedHospital.tags?.amenity === 'hospital') {
          notesStr = "\nNotes: General Hospital";
        } else {
          notesStr = "\nNotes: Local Medical Facility / Clinic";
        }

        if (selectedHospital.tags?.phone || selectedHospital.tags?.["contact:phone"]) {
          notesStr += `\nPhone: ${selectedHospital.tags.phone || selectedHospital.tags["contact:phone"]}`;
        }

        setEmergencyMedicalInfo(`${hName}\nAddress: ${hAddr}${notesStr}`);
      } else {
        setEmergencyMedicalInfo("No nearby 24/7 hospital or emergency facility found. Please check online in case of immediate danger.");
      }

      // Pharmacy
      const pharmacies = elements.filter((e: any) => e.tags?.amenity === 'pharmacy');
      if (pharmacies.length > 0) {
        const p = pharmacies[0];
        const pName = p.tags?.name || "Unknown Pharmacy";
        const pAddr = (p.tags?.["addr:housenumber"] && p.tags?.["addr:street"]) ? 
           `${p.tags["addr:housenumber"]} ${p.tags["addr:street"]}, ${p.tags?.["addr:city"]||city}` :
           "Unknown Address";
        setLocalPharmacyInfo(`${pName}\n${pAddr}`);
      } else {
        setLocalPharmacyInfo("No nearby pharmacy found.");
      }

      // Food (Top 2)
      const food = elements.filter((e: any) => e.tags?.amenity === 'restaurant' || e.tags?.amenity === 'cafe').slice(0, 2);
      if (food.length > 0) {
        const foodStr = food.map((f: any, i: number) => {
          const fName = f.tags?.name || "Unknown Place";
          const fCuisine = f.tags?.cuisine || f.tags?.amenity || "Food";
          return `${i+1}. ${fName} (${fCuisine})`;
        }).join('\n');
        setLocalFoodNotes(foodStr);
      } else {
        setLocalFoodNotes("No nearby food found.");
      }
      
    } catch (err: any) {
      console.warn("Could not automatically locate emergency info. Pre-filling placeholder layout:", err.message || err);
      alert("Could not automatically locate emergency info. Pre-filling placeholder layout.");
      setEmergencyMedicalInfo("Nearest Hospital: [Name]\nAddress: [Address]\nPhone: [Phone]\nNotes: ~24/7 ER");
      setLocalPharmacyInfo("Nearest Pharmacy: [Name]\nAddress: [Address]");
      setLocalFoodNotes("1. [Restaurant Name] - [Cuisine]\n2. [Cafe Name] - [Coffee/Breakfast]");
    } finally {
      setIsHuntingHospitals(false);
    }
  };

  const sanitizeInput = (text: string): string => {
    if (!text) return '';
    let cleaned = text.trim();
    // Strip script elements and HTML tags to prevent XSS / malicious injection
    cleaned = cleaned.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    cleaned = cleaned.replace(/<[^>]*>/g, '');
    return cleaned;
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Load-In and Set-Time are required fields, other times are optional
    if (!loadInTime) {
      alert("Load-In time is required. Please set a valid Load-In time.");
      return;
    }
    if (!setTime) {
      alert("Set-Time is required. Please set a valid Set-Time.");
      return;
    }

    const payload = {
      id: editingShow?.id, // include if updating
      event_scope: eventScope,
      tour_id: eventScope === 'tour' ? tourId : '',
      name: sanitizeInput(name),
      festival_name: showType === 'festival' ? (sanitizeInput(festivalName) || 'Festival Set') : '',
      venue_address: sanitizeInput(venueAddress),
      city: sanitizeInput(city),
      state_province: sanitizeInput(stateProvince),
      country: sanitizeInput(country),
      date,
      promoter_contact: sanitizeInput(promoterContact),
      load_in_time: loadInTime,
      doors_time: doorsTime,
      set_time: setTime,
      curfew_time: curfewTime,
      venue_cut_percentage: Number(venueCutPercentage),
      guarantee_amount: Number(guaranteeAmount),
      revenue: Number(guaranteeAmount), // support legacy rendering field
      currency,
      tax_rate: Number(taxRate),
      show_type: showType,
      expected_attendance: expectedAttendance,
      guest_list: guestList,
      merch_space_fee: Number(merchSpaceFee),
      seller_cost: Number(sellerCost),
      tables_provided: tablesProvided,
      hanging_grids_provided: hangingGridsProvided,
      shore_power: shorePower,
      parking_arrangements: sanitizeInput(parkingArrangements),
      age_restriction: ageRestriction,
      wifi_network: sanitizeInput(wifiNetwork),
      wifi_password: sanitizeInput(wifiPassword),
      merch_call_time: sanitizeInput(merchCallTime),
      soundcheck_time: sanitizeInput(soundcheckTime),
      dinner_arrangements: sanitizeInput(dinnerArrangements),
      local_food_notes: sanitizeInput(localFoodNotes),
      emergency_medical_info: sanitizeInput(emergencyMedicalInfo),
      local_pharmacy_info: sanitizeInput(localPharmacyInfo),
      audio_production_requirements: sanitizeInput(audioProductionRequirements),
      stage_backline_requirements: sanitizeInput(stageBacklineRequirements),
      stage_name: sanitizeInput(stageName),
      time_slot: timeSlot || 'all-day',
      support_lineup: supportLineup,
      additional_notes: sanitizeInput(additionalNotes),
      is_community_submitted: isCommunitySubmitted,
      external_ticket_url: sanitizeInput(externalTicketUrl),
      status: editingShow?.status || 'Active'
    };

    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0d0f14] sm:bg-black/90 sm:backdrop-blur-md flex items-center justify-center sm:p-4 overflow-hidden">
      <div 
        className="w-full h-full sm:max-h-[85vh] sm:h-auto sm:max-w-[540px] bg-[#0d0f14] sm:border-2 sm:border-[#1a1e26] sm:rounded-2xl shadow-2xl relative flex flex-col"
        id="show-form-modal-container"
      >
        {/* Top Concert Action Banner */}
        <div className="relative h-40 shrink-0 bg-cover bg-center flex flex-col justify-between p-4" style={{ backgroundImage: `linear-gradient(to bottom, rgba(13,15,20,0.1) 20%, rgba(13,15,20,0.95)), url('https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80')` }}>
          <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-transparent to-teal-500/20 mix-blend-color-add opacity-60" />
          
          <div className="flex justify-between items-start z-10 w-full">
            <span className="text-[10px] font-mono font-bold tracking-widest text-teal-400 bg-black/40 px-2 py-1 rounded uppercase">
              {editingShow ? `🔒 EDITING EVENT ID: ${editingShow.id}` : '⚡ SCHEDULING DISPATCH'}
            </span>
            
            {editingShow && onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  onDuplicate(editingShow);
                  onClose();
                }}
                className="border border-[#00ffcc] text-[#00ffcc] bg-black/60 hover:bg-[#00ffcc] hover:text-black py-1 px-2.5 text-[9px] font-mono tracking-wider font-extrabold rounded uppercase transition-all duration-300 mr-8"
              >
                DUPLICATE EVENT
              </button>
            )}
          </div>

          <div className="z-10 flex flex-col">
            <h2 className="text-xl font-display font-black tracking-tight text-white uppercase">
              {editingShow ? 'Update Show Details' : 'Schedule New Tour stop'}
            </h2>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5">Configure routing coordinates, payouts & gig logistics</p>
          </div>

          {/* Close button absolute position */}
          <button 
            type="button" 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-1.5 text-zinc-400 hover:text-white bg-black/50 hover:bg-zinc-800 rounded-full transition-colors border border-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Form Body */}
        <form onSubmit={handleFormSubmit} className="p-4 space-y-5 flex-1 overflow-y-auto text-left scroller-none pb-24 sm:pb-4">
          
          {/* EVENT DETAILS */}
          <div className="space-y-3.5">
            <h3 className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-1 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-400" /> Event Details
            </h3>

            {/* Scope Button Group */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEventScope('tour')}
                className={`py-2 text-[10px] uppercase font-mono font-bold tracking-wider rounded border transition-all text-center cursor-pointer ${
                  eventScope === 'tour'
                    ? 'bg-[#00ffcc] text-black border-[#00ffcc]'
                    : 'bg-[#13161d] border-zinc-800 text-zinc-450 hover:border-zinc-700 hover:text-white'
                }`}
              >
                Part of Existing Tour
              </button>
              <button
                type="button"
                onClick={() => setEventScope('single')}
                className={`py-2 text-[10px] uppercase font-mono font-bold tracking-wider rounded border transition-all text-center cursor-pointer ${
                  eventScope === 'single'
                    ? 'bg-[#00ffcc] text-black border-[#00ffcc]'
                    : 'bg-[#13161d] border-zinc-800 text-zinc-450 hover:border-zinc-700 hover:text-white'
                }`}
              >
                Single Show/Fest
              </button>
            </div>

            {/* Community Crowdsourced Show Submission & External Ticketing */}
            <div className="bg-[#13161d] border border-zinc-800 rounded-lg p-3 space-y-2.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input 
                  type="checkbox"
                  checked={isCommunitySubmitted}
                  onChange={(e) => setIsCommunitySubmitted(e.target.checked)}
                  className="w-4 h-4 rounded border-zinc-700 bg-black text-[#00ffcc] focus:ring-0 cursor-pointer"
                />
                <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wide">
                  🌍 Submit as Community Crowdsourced Show
                </span>
              </label>
              <p className="text-[9px] text-zinc-400 font-mono pl-6 leading-relaxed">
                Crowdsourced events populate the upcoming shows feed. Direct in-app ticketing is disabled unless an official 3rd-party ticket link is attached. Registered band, promoter, or label reps on Nexus Core can collaborate or claim this event to avoid duplicates.
              </p>

              {isCommunitySubmitted && (
                <div className="pt-1 pl-6">
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">
                    External 3rd-Party Ticket Link (Optional)
                  </label>
                  <input 
                    type="url"
                    value={externalTicketUrl}
                    onChange={(e) => setExternalTicketUrl(e.target.value)}
                    placeholder="https://dice.fm/event/... or https://ticketmaster.com/..."
                    className="w-full bg-black border border-zinc-800 rounded p-2 text-xs text-[#00ffcc] font-mono focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>
              )}
            </div>

            {/* Duplicate Event Match Warning */}
            {existingDuplicateMatch && (
              <div className="bg-amber-950/30 border border-amber-500/40 rounded p-2.5 text-[10px] text-amber-300 font-mono space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>Potential Existing Event Match Detected</span>
                </div>
                <p className="text-[9.5px] text-zinc-400">
                  An event at <strong className="text-white">{existingDuplicateMatch.name}</strong> on <strong className="text-white">{existingDuplicateMatch.date}</strong> is already logged in Nexus Core. Posting this will link or collaborate with registered representatives to avoid duplicate listings.
                </p>
              </div>
            )}

            {/* Select Tour Name (conditional on scope) */}
            {eventScope === 'tour' && (
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Select Tour</label>
                <div className="relative">
                  <select
                    value={tourId}
                    onChange={(e) => setTourId(e.target.value)}
                    className="w-full bg-[#13161d] border border-zinc-850 rounded p-2 text-xs text-white uppercase font-mono focus:outline-none focus:border-teal-400 cursor-pointer appearance-none"
                  >
                    {uniqueTours.map((t, idx) => (
                      <option key={`${t}-${idx}`} value={t}>{t}</option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-2.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            )}

            {/* Guarantee ($) */}
            <div>
              <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider flex items-center gap-1">
                Guarantee ($) <span className="text-[#00ffcc] font-black">*</span>
              </label>
              <div className="relative">
                <DollarSign className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="number"
                  step="1"
                  value={guaranteeAmount}
                  onChange={(e) => setGuaranteeAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 500"
                  className="w-full bg-[#13161d] border border-zinc-850 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-2 pl-9 text-xs text-white focus:outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Venue / Event Name */}
            <div className="relative">
              <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Venue or Event Name</label>
              <div className="relative">
                <Building className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => handleVenueSearch(e.target.value)}
                  onFocus={() => {
                    if (name.length > 2) setShowVenueDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay hiding to allow click events on dropdown parsing exactly
                    setTimeout(() => setShowVenueDropdown(false), 200);
                  }}
                  placeholder="e.g. The Fillmore, Regency Ballroom"
                  className="w-full bg-[#13161d] border border-zinc-850 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-2 pl-9 text-xs text-white focus:outline-none transition-all"
                />
                
                {showVenueDropdown && name.length > 2 && (
                  <div className="absolute z-[100] w-full mt-1 bg-[#1a1e26] border border-zinc-700/60 rounded-md shadow-[0_8px_30px_rgba(0,0,0,0.8)] overflow-hidden font-mono top-full">
                    {isSearchingVenues ? (
                      <div className="px-3 py-3 text-[10px] text-zinc-400 flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full border-2 border-zinc-600 border-t-[#00ffcc] animate-spin"></span>
                        SCANNING REGISTRIES...
                      </div>
                    ) : venueSuggestions.length > 0 ? (
                      <div className="max-h-56 overflow-y-auto custom-scrollbar">
                        {venueSuggestions.map((sug, i) => (
                          <div 
                            key={`show-lineup-band-${i}`}
                            onClick={() => {
                              setName(sug.name || '');
                              if (sug.address) setVenueAddress(sug.address);
                              if (sug.city) setCity(sug.city);
                              if (sug.state) {
                                setStateProvince(sug.state);
                                const isUSState = US_STATES.some(s => s.code.toUpperCase() === sug.state.trim().toUpperCase());
                                setCustomStateMode(!isUSState);
                              }
                              if (sug.country) {
                                setCountry(sug.country);
                                const isStandardCountry = COUNTRIES.some(c => c.toLowerCase() === sug.country.trim().toLowerCase());
                                setCustomCountryMode(!isStandardCountry);
                              } else {
                                setCountry('United States');
                                setCustomCountryMode(false);
                              }
                              setShowVenueDropdown(false);
                            }}
                            className="px-3 py-2 hover:bg-[#252a36] cursor-pointer border-b border-zinc-800/40 flex flex-col gap-1 transition-colors group"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-white font-bold">{sug.name}</span>
                              {sug.source === 'directory' ? (
                                <span className="text-[8px] bg-[#00ffcc]/15 text-[#00ffcc] px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Directory</span>
                              ) : (
                                <span className="text-[8px] bg-blue-500/15 text-blue-400 px-1.5 py-0.5 rounded uppercase tracking-wider font-bold">Web Match</span>
                              )}
                            </div>
                            <span className="text-[9.5px] text-zinc-500 group-hover:text-zinc-400">
                              {[sug.address, sug.city, sug.state].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-3 py-3 text-[10px] text-zinc-500 text-center bg-[#13161d]">
                        NO KNOWN RECORDS FOUND
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Venue Address</label>
              <div className="relative">
                <MapPin className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
                <input 
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="e.g. 1234 Main St."
                  className="w-full bg-[#13161d] border border-zinc-850 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-2 pl-9 text-xs text-white focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* City, State, Country Grid */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[8px] font-mono text-zinc-400 mb-1 uppercase tracking-widest">City</label>
                <input 
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="San Francisco"
                  className="w-full bg-[#13161d] border border-zinc-850 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-1.5 text-xs text-white focus:outline-none transition-all font-mono"
                />
              </div>
              <div>
                <label className="block text-[8px] font-mono text-zinc-400 mb-1 uppercase tracking-widest">State / Prov</label>
                {customStateMode ? (
                  <div className="relative">
                    <input 
                      type="text"
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      placeholder="e.g. ON or NSW"
                      className="w-full bg-[#13161d] border border-zinc-855 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-1.5 pr-14 text-xs text-white focus:outline-none transition-all font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomStateMode(false);
                        setStateProvince('');
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-[#00ffcc] hover:text-white bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 px-1 py-0.5 rounded uppercase tracking-wider transition-all cursor-pointer font-bold"
                    >
                      US List
                    </button>
                  </div>
                ) : (
                  <select
                    value={US_STATES.some(s => s.code.toUpperCase() === stateProvince.toUpperCase()) ? stateProvince.toUpperCase() : ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setCustomStateMode(true);
                        setStateProvince('');
                      } else {
                        setStateProvince(val);
                      }
                    }}
                    className="w-full bg-[#13161d] border border-zinc-855 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-1.5 text-xs text-white focus:outline-none transition-all font-mono uppercase cursor-pointer"
                  >
                    <option value="" disabled className="text-zinc-500 font-sans">Select State...</option>
                    <option value="__custom__" className="text-[#00ffcc] font-sans font-bold bg-[#1a1e26]">Custom / Province...</option>
                    <option disabled>-----------------------</option>
                    {US_STATES.map((state, idx) => (
                      <option key={`${state.code}-${idx}`} value={state.code} className="font-sans text-white bg-[#13161d]">
                        {state.code} - {state.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[8px] font-mono text-zinc-400 mb-1 uppercase tracking-widest">Country</label>
                {customCountryMode ? (
                  <div className="relative">
                    <input 
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="e.g. Germany"
                      className="w-full bg-[#13161d] border border-zinc-855 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-1.5 pr-12 text-xs text-white focus:outline-none transition-all font-mono uppercase"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setCustomCountryMode(false);
                        setCountry('United States');
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[8px] font-mono text-[#00ffcc] hover:text-white bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 px-1 py-0.5 rounded uppercase tracking-wider transition-all cursor-pointer font-bold"
                    >
                      List
                    </button>
                  </div>
                ) : (
                  <select
                    value={COUNTRIES.some(c => c.toLowerCase() === country.trim().toLowerCase()) ? country : 'United States'}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setCustomCountryMode(true);
                        setCountry('');
                      } else {
                        setCountry(val);
                      }
                    }}
                    className="w-full bg-[#13161d] border border-zinc-855 hover:border-zinc-750 focus:border-[#00ffcc] rounded p-1.5 text-xs text-white focus:outline-none transition-all font-mono uppercase cursor-pointer"
                  >
                    <option value="United States" className="font-sans text-white bg-[#13161d]">United States</option>
                    <option value="__custom__" className="text-[#00ffcc] font-sans font-bold bg-[#1a1e26]">Custom / Other...</option>
                    <option disabled>-----------------------</option>
                    {COUNTRIES.filter(c => c !== 'United States').map((ctry, idx) => (
                      <option key={`${ctry}-${idx}`} value={ctry} className="font-sans text-white bg-[#13161d]">
                        {ctry}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>


          {/* CORE ANALYTICS (Date, Load-In, Doors, Set, Guarantee, Cut, Attendance) */}
          <div className="space-y-3.5">
            <h3 className="text-[10px] font-mono font-semibold text-zinc-400 uppercase tracking-widest border-b border-zinc-800 pb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-orange-400" /> Core Show Analytics & Times
            </h3>

            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Date</label>
                <input 
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-[#13161d] border border-zinc-850 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-orange-400 text-center uppercase"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Expected Attendance</label>
                <div className="relative">
                  <select
                    value={expectedAttendance}
                    onChange={(e) => setExpectedAttendance(e.target.value as '+100')}
                    className="w-full bg-[#13161d] border border-zinc-850 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-orange-400 appearance-none cursor-pointer"
                  >
                    <option value="+100">+100</option>
                    <option value="100-300">100-300</option>
                    <option value="300-700">300-700</option>
                    <option value="700+">700+</option>
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3.5 top-2.5 text-zinc-500 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[8px] font-mono text-zinc-455 mb-1 uppercase tracking-widest text-center">
                  Load-In <span className="text-[#00ffcc] font-black">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    readOnly
                    value={formatTimeDisplay(loadInTime)}
                    onClick={() => triggerTimePicker(loadInRef)}
                    placeholder="Not Set"
                    className="w-full bg-[#13161d] border border-zinc-850 hover:border-zinc-700 rounded p-1.5 pr-7 text-xs text-white font-mono text-center cursor-pointer transition-all"
                  />
                  <button type="button" onClick={() => triggerTimePicker(loadInRef)} className="absolute right-1 top-1 p-1 text-zinc-500 hover:text-[#00ffcc] active:scale-95 transition-colors outline-none"><Clock className="w-3.5 h-3.5" /></button>
                  <input type="time" ref={loadInRef} value={loadInTime} onChange={(e) => setLoadInTime(e.target.value)} className="opacity-0 absolute inset-0 w-0 h-0 pointer-events-none" />
                </div>
              </div>
              
              <div>
                <label className="block text-[8px] font-mono text-zinc-500 mb-1 uppercase tracking-widest text-center">
                  Doors <span className="text-zinc-650">(Opt)</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    readOnly
                    value={formatTimeDisplay(doorsTime)}
                    onClick={() => triggerTimePicker(doorsRef)}
                    placeholder="Not Set"
                    className="w-full bg-[#13161d] border border-zinc-850 hover:border-zinc-700 rounded p-1.5 pr-7 text-xs text-white font-mono text-center cursor-pointer transition-all"
                  />
                  <button type="button" onClick={() => triggerTimePicker(doorsRef)} className="absolute right-1 top-1 p-1 text-zinc-500 hover:text-[#00ffcc] active:scale-95 transition-colors outline-none"><Clock className="w-3.5 h-3.5" /></button>
                  <input type="time" ref={doorsRef} value={doorsTime} onChange={(e) => setDoorsTime(e.target.value)} className="opacity-0 absolute inset-0 w-0 h-0 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-mono text-zinc-455 mb-1 uppercase tracking-widest text-center">
                  Set-Time <span className="text-[#00ffcc] font-black">*</span>
                </label>
                <div className="relative">
                  <input 
                    type="text"
                    readOnly
                    value={formatTimeDisplay(setTime)}
                    onClick={() => triggerTimePicker(setRef)}
                    placeholder="Not Set"
                    className="w-full bg-[#13161d] border border-zinc-850 hover:border-zinc-700 rounded p-1.5 pr-7 text-xs text-white font-mono text-center cursor-pointer transition-all"
                  />
                  <button type="button" onClick={() => triggerTimePicker(setRef)} className="absolute right-1 top-1 p-1 text-zinc-500 hover:text-[#00ffcc] active:scale-95 transition-colors outline-none"><Clock className="w-3.5 h-3.5" /></button>
                  <input type="time" ref={setRef} value={setTime} onChange={(e) => setSetTime(e.target.value)} className="opacity-0 absolute inset-0 w-0 h-0 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Venue Cut (%)</label>
              <input 
                type="number" step="0.1" value={venueCutPercentage} onChange={(e) => setVenueCutPercentage(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#13161d] border border-zinc-850 focus:border-emerald-400 rounded p-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3.5">
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Merch Space Fee</label>
                <input 
                  type="number" step="1" value={merchSpaceFee} onChange={(e) => setMerchSpaceFee(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#13161d] border border-zinc-850 focus:border-emerald-400 rounded p-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Seller Cost</label>
                <input 
                  type="number" step="1" value={sellerCost} onChange={(e) => setSellerCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#13161d] border border-zinc-850 focus:border-emerald-400 rounded p-2 text-xs text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>


          {/* =========================================
              ACCORDION 1: ADVANCED SCHEDULE & LINEUP
             ========================================= */}
          <details className="group border-2 border-[#8B5CF6] bg-black rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="p-3 bg-[#13161d] text-zinc-300 font-mono text-[10px] uppercase font-bold tracking-widest cursor-pointer select-none flex justify-between items-center group-open:border-b group-open:border-[#8B5CF6]/30">
              [ + ADVANCED SCHEDULE & LINEUP ]
              <ChevronDown className="w-4 h-4 text-[#8B5CF6] group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-4 space-y-4">
              {/* Time Format Toggle */}
              <div className="flex justify-between items-center bg-[#13161d] border border-zinc-850 p-2 rounded">
                <label className="block text-[9px] font-mono text-[#8B5CF6] uppercase tracking-wider font-extrabold">Time Format Preference</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsTime24Hour(false);
                      localStorage.setItem('tour_time_is_24h', 'false');
                    }}
                    className={`text-[8px] font-mono font-black tracking-wider px-2 py-1 rounded border cursor-pointer uppercase transition-all ${
                      !isTime24Hour 
                        ? 'text-[#8B5CF6] border-[#8B5CF6]/50 bg-[#8B5CF6]/10' 
                        : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    [ 12-Hour (AM/PM) ]
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTime24Hour(true);
                      localStorage.setItem('tour_time_is_24h', 'true');
                    }}
                    className={`text-[8px] font-mono font-black tracking-wider px-2 py-1 rounded border cursor-pointer uppercase transition-all ${
                      isTime24Hour 
                        ? 'text-[#8B5CF6] border-[#8B5CF6]/50 bg-[#8B5CF6]/10' 
                        : 'text-zinc-500 border-zinc-800 hover:text-zinc-300'
                    }`}
                  >
                    [ 24-Hour (Military) ]
                  </button>
                </div>
              </div>

              {/* Advanced Timeline */}
              <div className="grid grid-cols-3 gap-3">
                {/* Merch Call Time */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider text-center">Merch Call</label>
                  <div className="relative">
                    <input 
                      type="text"
                      readOnly
                      value={formatTimeDisplay(merchCallTime)}
                      onClick={() => triggerTimePicker(merchCallRef)}
                      placeholder="Not Set"
                      className="w-full bg-[#13161d] border border-zinc-900 border-b-[#8B5CF6]/50 hover:bg-zinc-800 p-2 pr-7 text-xs text-white font-mono text-center cursor-pointer transition-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => triggerTimePicker(merchCallRef)}
                      className="absolute right-1 top-1.5 p-1 text-[#8B5CF6] hover:text-[#a78bfa] active:scale-95 transition-colors outline-none"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="time"
                      ref={merchCallRef}
                      value={merchCallTime}
                      onChange={(e) => setMerchCallTime(e.target.value)}
                      className="opacity-0 absolute inset-0 w-0 h-0 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Soundcheck */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider text-center">Soundcheck</label>
                  <div className="relative">
                    <input 
                      type="text"
                      readOnly
                      value={formatTimeDisplay(soundcheckTime)}
                      onClick={() => triggerTimePicker(soundcheckRef)}
                      placeholder="Not Set"
                      className="w-full bg-[#13161d] border border-zinc-900 border-b-[#8B5CF6]/50 hover:bg-zinc-800 p-2 pr-7 text-xs text-white font-mono text-center cursor-pointer transition-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => triggerTimePicker(soundcheckRef)}
                      className="absolute right-1 top-1.5 p-1 text-[#8B5CF6] hover:text-[#a78bfa] active:scale-95 transition-colors outline-none"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="time"
                      ref={soundcheckRef}
                      value={soundcheckTime}
                      onChange={(e) => setSoundcheckTime(e.target.value)}
                      className="opacity-0 absolute inset-0 w-0 h-0 pointer-events-none"
                    />
                  </div>
                </div>

                {/* Curfew Time */}
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider text-center">Curfew</label>
                  <div className="relative">
                    <input 
                      type="text"
                      readOnly
                      value={formatTimeDisplay(curfewTime)}
                      onClick={() => triggerTimePicker(curfewRef)}
                      placeholder="Not Set"
                      className="w-full bg-[#13161d] border border-zinc-900 border-b-rose-500/50 hover:bg-zinc-800 p-2 pr-7 text-xs text-white font-mono text-center cursor-pointer transition-all focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => triggerTimePicker(curfewRef)}
                      className="absolute right-1 top-1.5 p-1 text-rose-500 hover:text-rose-400 active:scale-95 transition-colors outline-none"
                    >
                      <Clock className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="time"
                      ref={curfewRef}
                      value={curfewTime}
                      onChange={(e) => setCurfewTime(e.target.value)}
                      className="opacity-0 absolute inset-0 w-0 h-0 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              {/* Support Acts Scheduler */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center border-b border-[#8B5CF6]/30 pb-2">
                  <h3 className="text-[10px] font-mono font-semibold text-[#8B5CF6] uppercase tracking-widest flex items-center gap-1.5 leading-none">
                    <Users className="w-3.5 h-3.5" /> Dynamic Support Scheduler
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddSupportBand}
                    className="text-[9px] font-mono font-black tracking-widest text-emerald-400 hover:text-emerald-300 border border-emerald-400/30 bg-emerald-400/10 px-2 py-1 rounded uppercase flex items-center gap-1 transition-all"
                  >
                    [ + ADD SUPPORT BAND ]
                  </button>
                </div>
                
                {supportLineup.length > 0 ? (
                  <div className="space-y-2">
                    {supportLineup.map((band, idx) => (
                      <div key={`show-member-row-${idx}`} className="flex flex-wrap sm:flex-nowrap gap-2 items-end bg-[#0a0c10] border border-zinc-800 p-2 rounded relative group">
                        <div className="flex-grow">
                          <label className="block text-[8px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Band Name</label>
                          <input 
                            type="text"
                            value={band.name}
                            onChange={(e) => handleUpdateSupportBand(idx, 'name', e.target.value)}
                            placeholder="e.g. Local Opener"
                            className="w-full bg-transparent border-b border-zinc-700 hover:border-[#8B5CF6]/50 p-1 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6] transition-all"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-[8px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">Start Time</label>
                          <input 
                            type="time"
                            value={band.start_time || ''}
                            onChange={(e) => handleUpdateSupportBand(idx, 'start_time', e.target.value)}
                            className="w-full bg-transparent border-b border-zinc-700 hover:border-[#8B5CF6]/50 p-1 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6] transition-all [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert"
                          />
                        </div>
                        <div className="w-24">
                          <label className="block text-[8px] font-mono text-zinc-500 mb-1 uppercase tracking-wider">End Time</label>
                          <input 
                            type="time"
                            value={band.end_time || ''}
                            onChange={(e) => handleUpdateSupportBand(idx, 'end_time', e.target.value)}
                            className="w-full bg-transparent border-b border-zinc-700 hover:border-[#8B5CF6]/50 p-1 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6] transition-all [&::-webkit-calendar-picker-indicator]:opacity-50 [&::-webkit-calendar-picker-indicator]:invert"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveSupportBand(idx)}
                          className="p-1.5 text-zinc-600 hover:text-red-500 bg-red-900/10 rounded ml-1 transition-colors"
                          title="Remove Band"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-5 border border-dashed border-zinc-800 rounded bg-[#0a0c10]/50">
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">No support acts scheduled.</p>
                  </div>
                )}
              </div>
            </div>
          </details>

          {/* =========================================
              ACCORDION 2: HOSPITALITY & SAFETY
             ========================================= */}
          <details className="group border-2 border-[#8B5CF6] bg-black rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="p-3 bg-[#13161d] text-zinc-300 font-mono text-[10px] uppercase font-bold tracking-widest cursor-pointer select-none flex justify-between items-center group-open:border-b group-open:border-[#8B5CF6]/30">
              [ + HOSPITALITY & SAFETY LOGISTICS ]
              <ChevronDown className="w-4 h-4 text-[#8B5CF6] group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-4 space-y-5">
              {/* Contacts & Wifi */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Promoter Contact</label>
                    <input 
                      type="text"
                      value={promoterContact}
                      onChange={(e) => setPromoterContact(e.target.value)}
                      placeholder="Name (123) 456-7890"
                      className="w-full bg-[#13161d] border border-zinc-800 rounded p-2 text-xs text-white font-mono focus:outline-none focus:border-[#8B5CF6]"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Parking Arrangements</label>
                    <input 
                      type="text"
                      value={parkingArrangements}
                      onChange={(e) => setParkingArrangements(e.target.value)}
                      placeholder="Loading dock, etc."
                      className="w-full bg-[#13161d] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono"
                    />
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">WiFi Network (SSID)</label>
                    <input 
                      type="text"
                      value={wifiNetwork}
                      onChange={(e) => setWifiNetwork(e.target.value)}
                      className="w-full bg-[#13161d] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#8B5CF6] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">WiFi Password</label>
                    <input 
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full bg-[#13161d] border border-zinc-800 rounded p-2 text-xs text-[#00ffcc] font-black focus:outline-none focus:border-[#8B5CF6] font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[8px] font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">Age Restriction</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(['all', '18', '21'] as const).map((restriction, idx) => (
                    <button
                      key={`${restriction}-${idx}`}
                      type="button"
                      onClick={() => setAgeRestriction(restriction)}
                      className={`py-1.5 text-[9px] uppercase font-mono font-black tracking-tight rounded border transition-all cursor-pointer ${
                        ageRestriction === restriction
                          ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                          : 'bg-[#13161d] border-zinc-800 text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      {restriction === 'all' ? 'All ages' : restriction === '18' ? '18+' : '21+'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Hospitality Text Areas */}
              <div className="space-y-3">
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Dinner Arrangements</label>
                  <input 
                    type="text"
                    value={dinnerArrangements}
                    onChange={(e) => setDinnerArrangements(e.target.value)}
                    placeholder="$15 Buyout, Venue Catering..."
                    className="w-full bg-[#13161d] border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Local Food / Diet Notes</label>
                  <textarea 
                    value={localFoodNotes}
                    onChange={(e) => setLocalFoodNotes(e.target.value)}
                    rows={2}
                    className="w-full bg-[#13161d] border border-zinc-800 focus:border-amber-500 rounded p-2 text-xs text-white font-mono focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Safety Text Areas */}
              <div className="space-y-3 pt-2 border-t border-zinc-800">
                <div>
                  <div className="flex justify-between items-end mb-1">
                    <label className="block text-[9px] font-mono text-zinc-400 uppercase tracking-wider">Emergency Medical Info</label>
                    <button 
                      type="button" 
                      onClick={handleAutoSuggestEmergency}
                      disabled={isHuntingHospitals}
                      className="text-[8px] font-mono tracking-widest font-black text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 px-2 py-0.5 rounded transition-all outline-none uppercase"
                    >
                      {isHuntingHospitals ? "Scanning Maps..." : "Auto-Fill Nearby ER"}
                    </button>
                  </div>
                  <textarea 
                    value={emergencyMedicalInfo}
                    onChange={(e) => setEmergencyMedicalInfo(e.target.value)}
                    rows={2}
                    className="w-full bg-[#13161d] border border-zinc-800 focus:border-rose-500 rounded p-2 text-xs text-white font-mono focus:outline-none resize-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Local Pharmacy Info</label>
                  <textarea 
                    value={localPharmacyInfo}
                    onChange={(e) => setLocalPharmacyInfo(e.target.value)}
                    rows={2}
                    className="w-full bg-[#13161d] border border-zinc-800 focus:border-rose-500 rounded p-2 text-xs text-white font-mono focus:outline-none resize-none"
                  />
                </div>
              </div>
            </div>
          </details>

          {/* =========================================
              ACCORDION 3: TECHNICAL & PRODUCTION SPECS
             ========================================= */}
          <details className="group border-2 border-[#8B5CF6] bg-black rounded-lg overflow-hidden [&_summary::-webkit-details-marker]:hidden">
            <summary className="p-3 bg-[#13161d] text-zinc-300 font-mono text-[10px] uppercase font-bold tracking-widest cursor-pointer select-none flex justify-between items-center group-open:border-b group-open:border-[#8B5CF6]/30">
              [ + TECHNICAL & PRODUCTION SPECS ]
              <ChevronDown className="w-4 h-4 text-[#8B5CF6] group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-4 space-y-5">
              {/* Venue Provisions */}
              <div>
                <label className="block text-[8px] font-mono text-zinc-500 mb-1.5 uppercase tracking-wider">Gear Provided by Venue</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setTablesProvided(!tablesProvided)}
                    className={`py-1.5 rounded border text-[10px] uppercase font-mono font-bold tracking-tight text-center transition-all cursor-pointer ${
                      tablesProvided 
                        ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10' 
                        : 'border-zinc-850 text-zinc-550 hover:text-white bg-[#13161d]'
                    }`}
                  >
                    {tablesProvided ? '✓' : '✗'} Tables
                  </button>
                  <button
                    type="button"
                    onClick={() => setHangingGridsProvided(!hangingGridsProvided)}
                    className={`py-1.5 rounded border text-[10px] uppercase font-mono font-bold tracking-tight text-center transition-all cursor-pointer ${
                      hangingGridsProvided 
                        ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10' 
                        : 'border-zinc-850 text-zinc-550 hover:text-white bg-[#13161d]'
                    }`}
                  >
                    {hangingGridsProvided ? '✓' : '✗'} Grid
                  </button>
                  <button
                    type="button"
                    onClick={() => setShorePower(!shorePower)}
                    className={`py-1.5 rounded border text-[10px] uppercase font-mono font-bold tracking-tight text-center transition-all cursor-pointer ${
                      shorePower 
                        ? 'border-[#00ffcc] text-[#00ffcc] bg-[#00ffcc]/10' 
                        : 'border-zinc-850 text-zinc-550 hover:text-white bg-[#13161d]'
                    }`}
                  >
                    {shorePower ? '✓' : '✗'} Power
                  </button>
                </div>
              </div>

              {/* Stage and Timing Slots for Multi-Show Tracking */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 border-t border-zinc-900 pt-3">
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Designated Stage Name</label>
                  <input 
                    type="text"
                    value={stageName}
                    onChange={(e) => setStageName(e.target.value)}
                    placeholder="e.g. Main Stage, Basement Room"
                    className="w-full bg-[#13161d] border border-zinc-800 focus:border-[#00ffcc] rounded px-3 py-2 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Timing Show Slot</label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full bg-[#13161d] border border-zinc-800 focus:border-[#00ffcc] rounded px-3 py-2 text-xs text-white font-mono focus:outline-none [color-scheme:dark]"
                  >
                    <option value="all-day">Full Day / Standard</option>
                    <option value="early">Early Show (Matinee / Afternoon)</option>
                    <option value="late">Late Show (Main Clubnight)</option>
                  </select>
                </div>
              </div>

              {/* Text Areas for Specs */}
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Audio / Production Requirements</label>
                <textarea 
                  value={audioProductionRequirements}
                  onChange={(e) => setAudioProductionRequirements(e.target.value)}
                  placeholder="FOH console requests, input lists, monitor requirements..."
                  rows={3}
                  className="w-full bg-[#13161d] border border-zinc-800 focus:border-[#00ffcc] rounded p-2 text-xs text-white font-mono focus:outline-none resize-none"
                />
              </div>
              
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Stage Backline Requirements</label>
                <textarea 
                  value={stageBacklineRequirements}
                  onChange={(e) => setStageBacklineRequirements(e.target.value)}
                  placeholder="Amps, drum shells, local hires to be provided by venue..."
                  rows={3}
                  className="w-full bg-[#13161d] border border-zinc-800 focus:border-[#00ffcc] rounded p-2 text-xs text-white font-mono focus:outline-none resize-none"
                />
              </div>
            </div>
          </details>


          {/* GUEST LIST */}
          <div className="space-y-3 p-3.5 bg-[#141822] border border-zinc-850 rounded-xl">
            <h4 className="text-[10px] font-mono font-semibold text-zinc-300 uppercase tracking-widest flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#00ffcc]" /> Guest List Administrator
            </h4>

            {/* Existing guest list items display */}
            {guestList.length > 0 && (
              <div className="border border-zinc-800 rounded bg-[#0d0f14] max-h-[110px] overflow-y-auto p-1.5 mb-2.5 text-xs font-mono space-y-1">
                {guestList.map((g, gIdx) => (
                  <div key={`${g.id}-${gIdx}`} className="flex justify-between items-center bg-[#141720]/80 px-2 py-1 rounded border border-zinc-900">
                    <span className="text-zinc-300 text-[11px]">
                      👤 {g.name} {g.additional_count > 0 ? `(+${g.additional_count})` : ''}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveGuest(g.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 hover:bg-zinc-800/40 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add inputs */}
            <div className="space-y-2.5">
              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1">Guest Name:</label>
                <input 
                  type="text"
                  value={tempGuestName}
                  onChange={(e) => setTempGuestName(e.target.value)}
                  placeholder="Enter guest name"
                  className="w-full bg-[#13161d] border border-zinc-850 rounded p-1.5 text-xs text-white focus:outline-none focus:border-teal-400"
                />
              </div>

              <div>
                <label className="block text-[9px] font-mono text-zinc-400 mb-1">Additional Guests:</label>
                <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
                  {([0, 1, 2, 3, 4] as const).map((count, idx) => (
                    <button
                      key={`${count}-${idx}`}
                      type="button"
                      onClick={() => setTempAdditionalCount(count)}
                      className={`p-1 border rounded transition-all cursor-pointer ${
                        tempAdditionalCount === count 
                          ? 'bg-teal-500/10 border-teal-400 text-teal-300 font-extrabold' 
                          : 'bg-[#13161d] border-zinc-850 text-zinc-500 hover:text-white'
                      }`}
                    >
                      {count === 0 ? 'None' : `+${count}`}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddGuest}
                disabled={!tempGuestName.trim()}
                className="w-full py-1.5 flex items-center justify-center gap-1.5 bg-[#14292b] hover:bg-[#1a3d3f] disabled:opacity-40 disabled:hover:bg-[#14292b] text-[#00ffcc] font-mono font-bold text-[10px] uppercase border border-[#00ffcc]/35 hover:border-[#00ffcc] rounded-lg transition-all cursor-pointer"
              >
                + Add to Guest List
              </button>
            </div>
          </div>

          {/* ADDITIONAL NOTES */}
          <div>
            <label className="block text-[9px] font-mono text-zinc-400 mb-1 uppercase tracking-wider">Additional Notes</label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Merch cut details, loading dock directions, access codes, band wifi passcode..."
              rows={3}
              className="w-full bg-[#13161d] border border-zinc-850 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc] transition-all font-mono"
            />
          </div>

          {/* SAVE / UPDATE BUTTON */}
          <div className="sticky bottom-0 -mx-4 px-4 py-4 bg-[#0d0f14] border-t border-[#1a1e26] sm:border-none sm:bg-transparent sm:py-2 z-20 mt-4 shadow-[0_-12px_24px_-12px_rgba(0,0,0,0.7)] sm:shadow-none">
            <button
              type="submit"
              className="w-full py-3 bg-[#00ffcc] hover:bg-[#57ffd9] text-black font-extrabold text-[12px] font-mono uppercase tracking-widest rounded-xl hover:scale-[1.01] transition-all cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,255,204,0.15)]"
            >
              <Check className="w-4 h-4 text-black stroke-[3px]" />
              {editingShow ? 'UPDATE SHOW DETAILS' : 'SAVE SHOW'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
