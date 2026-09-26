import { PROMOTER_BILLING_MATRIX } from '../../../config/promoterBilling';
import React, { useState, useEffect, useRef } from 'react';
import { getSupabase, executeWithSchemaResilience } from '../../../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { hasRegisteredWorkspace } from '../../../types';
const venueBg = "https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/High%20energy%20concert%202.png";
import BillingSettingsView from '../../BillingSettingsView';
import EventWorkspaceView from './EventWorkspaceView';
import { 
  Radio, 
  Mail, 
  RefreshCw, 
  Layers, 
  ShieldAlert, 
  LogOut, 
  Globe,
  User,
  Sliders, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Building, 
  Clock, 
  ChevronRight, 
  ChevronLeft,
  Check, 
  X, 
  Send, 
  AlertCircle,
  Sparkles,
  FileText,
  UserCheck,
  AlertTriangle,
  Home,
  Info,
  Lock,
  Pencil,
  Settings,
  Camera,
  Upload,
  PlayCircle,
  ExternalLink,
  Search,
  Plus,
  Trash, Trash2,
  List,
  Bell,
  MessageSquare,
  ArrowLeft,
  Pin,
  Activity
} from 'lucide-react';
import { UserProfile, Band, Offer, EventLineup, Show, TicketTier } from '../../../types';

import CrewTerminal from '../../sales/CrewTerminal';
import PacingTracker from '../../sales/PacingTracker';
import BandAffiliateMetrics from '../../sales/BandAffiliateMetrics';
import BreakevenIntelligence from '../../sales/BreakevenIntelligence';
import PublicStorefront from '../../sales/PublicStorefront';
import { MASTER_GENRES, MICRO_GENRES_MAP } from '../../../constants/genres';

export const genreClusters = MASTER_GENRES.map(g => {
  let color = 'border-purple-950 text-purple-400';
  if (g.name === 'Hardcore') color = 'border-red-950 text-red-450';
  else if (g.name === 'Hip Hop/Rap') color = 'border-amber-950 text-amber-400';
  else if (g.name === 'Industrial/EDM') color = 'border-teal-900 text-teal-400';
  else if (g.name === 'Punk/Alternative') color = 'border-pink-950 text-pink-400';
  else if (g.name === 'Rock/Heavy Metal') color = 'border-blue-950 text-blue-400';
  return { ...g, color };
});

interface PromoterPortalViewProps { isolatedTab?: string;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onLogout: () => void;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  bands: Band[];
  offers: Offer[];
  onCreateOffer: (offer: Offer) => void;
  onUpdateOffer: (offer: Offer) => void;
  shows?: Show[];
  notifications?: any[];
  onMarkAsRead?: (id: string) => void;
  onOpenNotifications?: () => void;
  activeBand?: any;
  activeBandId?: string;
  setActiveBandId?: (id: string) => void;
  isOfflineSimActive?: boolean;
  setIsOfflineSimActive?: React.Dispatch<React.SetStateAction<boolean>>;
  isOnline?: boolean;
  showOnlyCalendar?: boolean;
  showOnlyRoutingAndAvailability?: boolean;
  onUpgradeToPro?: () => void;
  setActiveTab?: (tab: string) => void;
}

export interface RoutingBeacon {
  id: string;
  band_name: string;
  target_region: string;
  start_date: string;
  end_date: string;
  booking_email: string;
  created_at: string;
  genre_tags?: string[];
}

const matchesFrequency = (itemTags: string[], freq: string): boolean => {
  if (freq === 'ALL') return true;
  if (!itemTags || itemTags.length === 0) return false;
  
  const lowerTags = itemTags.map(t => t.toLowerCase().replace(/[\s_/\\-]/g, ''));
  
  if (freq === 'Hardcore') {
    const valid = [
      'hardcore', 'beatdown', 'traditionalhardcore', 'metalcore', 'youthcrew', 'fastcore', 
      'posthardcore', 'melodichardcore', 'skramz', 'screamo', 'scremo'
    ];
    return (lowerTags || []).some(t => valid.includes(t));
  }
  if (freq === 'Extreme Metal') {
    const valid = [
      'brutaldeathmetal', 'grindcore', 'slam', 'deathcore', 'blackmetal', 
      'deathmetal', 'oldschooldeathmetal', 'goregrind', 'thrashmetal', 'osdm',
      'blackened', 'deaththrash', 'symphonicblack', 'melodicdeath', 'slammingbdm', 'deathgrind'
    ];
    return (lowerTags || []).some(t => valid.includes(t));
  }
  if (freq === 'Hip-Hop/Rap') {
    const valid = [
      'undergroundhiphop', 'trap', 'boombap', 'phonk', 'drill', 'cloudrap', 
      'experimentalhiphop', 'grime', 'hiphop', 'rap'
    ];
    return (lowerTags || []).some(t => valid.includes(t));
  }
  if (freq === 'Industrial/EDM') {
    const valid = [
      'industrial', 'edm', 'ebm', 'synthwave', 'aggrotech', 'techno', 
      'industrialmetal', 'dubstep', 'dnb', 'drumandbass', 'hardstyle', 'electronic'
    ];
    return (lowerTags || []).some(t => valid.includes(t));
  }
  if (freq === 'Rock/Heavy Metal') {
    const valid = [
      'rock', 'heavymetal', 'doommetal', 'sludge', 'stonerrock', 'grunge', 
      'progressivemetal', 'gothicrock', 'hardrock', 'metal', 'powermetal', 'altrock', 'newwave'
    ];
    return (lowerTags || []).some(t => valid.includes(t));
  }
  return false;
};

const FREQUENCY_METADATA: Record<string, {
  label: string;
  icon: string;
  subHeader: string;
  subColor: string;
  subBorder: string;
  activeStyle: string;
}> = {
  'Extreme Metal': {
    label: 'EXTREME METAL',
    icon: '☠️',
    subHeader: 'EXTREME METAL MICRO-SPECTRUM SELECTOR',
    subColor: 'text-rose-500',
    subBorder: 'border-t-red-600 border-red-900/25',
    activeStyle: 'bg-gradient-to-r from-red-950 to-rose-950 border-red-500 text-rose-100 shadow-lg shadow-red-950/40 font-bold'
  },
  'Hardcore': {
    label: 'HARDCORE',
    icon: '🔨',
    subHeader: 'HARDCORE CORE-SPECTRUM SELECTOR',
    subColor: 'text-orange-500',
    subBorder: 'border-t-orange-600 border-orange-900/25',
    activeStyle: 'bg-gradient-to-r from-orange-950 to-amber-950 border-orange-500 text-orange-100 shadow-lg shadow-orange-950/40 font-bold'
  },
  'Hip-Hop/Rap': {
    label: 'HIP-HOP / RAP',
    icon: '🎤',
    subHeader: 'HIP-HOP / RAP BEAT SELECTOR',
    subColor: 'text-amber-500',
    subBorder: 'border-t-amber-600 border-amber-900/25',
    activeStyle: 'bg-gradient-to-r from-amber-950 to-yellow-950 border-amber-500 text-amber-200 shadow-lg shadow-amber-950/40 font-bold'
  },
  'Industrial/EDM': {
    label: 'INDUSTRIAL / EDM',
    icon: '⚡',
    subHeader: 'INDUSTRIAL / EDM FREQUENCY SELECTOR',
    subColor: 'text-cyan-500',
    subBorder: 'border-t-cyan-600 border-cyan-900/20',
    activeStyle: 'bg-gradient-to-r from-cyan-950 to-blue-950 border-cyan-500 text-cyan-200 shadow-lg shadow-cyan-950/40 font-bold'
  },
  'Punk/Alternative': {
    label: 'PUNK / ALTERNATIVE',
    icon: '🛹',
    subHeader: 'PUNK / ALTERNATIVE SELECTOR',
    subColor: 'text-pink-500',
    subBorder: 'border-t-pink-600 border-pink-900/20',
    activeStyle: 'bg-gradient-to-r from-pink-950 to-rose-950 border-pink-500 text-pink-200 shadow-lg shadow-pink-950/40 font-bold'
  },
  'Rock/Heavy Metal': {
    label: 'ROCK / HEAVY METAL',
    icon: '🎸',
    subHeader: 'ROCK / HEAVY METAL CRUNCH SELECTOR',
    subColor: 'text-fuchsia-500',
    subBorder: 'border-t-fuchsia-600 border-fuchsia-900/20',
    activeStyle: 'bg-gradient-to-r from-purple-950 to-fuchsia-950 border-fuchsia-500 text-fuchsia-200 shadow-lg shadow-fuchsia-950/40 font-bold'
  }
};

const ALL_BANDS = [
  { id: 'b1', name: 'TOMB MOLD', handle: 'tombmold', isRoster: true, avatarText: 'TM', color: 'text-orange-400 bg-orange-950/20 border-orange-500/30' },
  { id: 'b2', name: 'BLOOD INCANTATION', handle: 'bloodincantation', isRoster: true, avatarText: 'BI', color: 'text-pink-400 bg-pink-950/20 border-pink-500/30' },
  { id: 'b3', name: 'UNDEATH', handle: 'undeath', isRoster: true, avatarText: 'UD', color: 'text-rose-400 bg-rose-950/20 border-rose-500/30' },
  { id: 'b4', name: 'GOREGRIND OVERLORDS', handle: 'goregrind', isRoster: false, avatarText: 'GO', color: 'text-[#39ff14] bg-emerald-950/20 border-emerald-500/30' },
  { id: 'b5', name: 'NECROSYNTH CULT', handle: 'necrosynth', isRoster: false, avatarText: 'NC', color: 'text-[#eab308] bg-yellow-950/20 border-yellow-500/30' },
  { id: 'b6', name: 'CREEPING DEATH', handle: 'creepingdeath', isRoster: false, avatarText: 'CD', color: 'text-[#00ffcc] bg-cyan-950/20 border-cyan-500/30' },
];

const ALL_PROMOTERS_AND_FANS = [
  { id: 'p1', name: 'CYBERPUNK PROMOTIONS', handle: 'cyberpunk_promo', type: 'promoter', avatarText: 'CP', color: 'text-purple-400 bg-purple-950/20 border-purple-500/30', bio: 'Booking heaviest electronic cyber tours across the northern systems.', location: 'Detroit, MI' },
  { id: 'p2', name: 'UNDERGROUND SOUNDS', handle: 'underground_sounds', type: 'promoter', avatarText: 'US', color: 'text-teal-400 bg-teal-950/20 border-teal-500/30', bio: 'DIY shows, warehouse gigs, and physical fanzine releases.', location: 'Chicago, IL' },
  { id: 'f1', name: 'HEAVY METALLIC FAN', handle: 'analog_fiend', type: 'fan', avatarText: 'AF', color: 'text-zinc-400 bg-zinc-950/20 border-zinc-500/30', bio: 'Tape collector, synthesizer enthusiast and gig flyer hoarder.', location: 'Austin, TX' },
  { id: 'f2', name: 'SYNTH CULTIST', handle: 'synth_cultist', type: 'fan', avatarText: 'SC', color: 'text-amber-400 bg-amber-950/20 border-amber-500/30', bio: 'Looking for poster prints and merchandising designs.', location: 'Seattle, WA' }
];

const OTHER_CREATIVES = [
  { id: 'c-vortex', name: "Vortex Graphics", handle: 'vortex_design', type: 'creative', avatarText: 'VX', color: 'text-indigo-400 bg-indigo-950/20 border-indigo-500/30', bio: 'Heavy vector specialist, halftone master, custom punk typography.', location: "Detroit, MI Market Hub", rate: "$300/design" },
  { id: 'c-gain', name: "Crust Gain Mastering", handle: 'crust_gain', type: 'creative', avatarText: 'CG', color: 'text-emerald-400 bg-emerald-950/20 border-emerald-500/30', bio: 'Unforgiving tape saturation, pristine dynamic high shelf optimization.', location: "Portland, OR Market Hub", rate: "$80/stem" },
  { id: 'c-drone', name: "Hyper-Sect Video System", handle: 'hyper_sect', type: 'creative', avatarText: 'HS', color: 'text-pink-400 bg-pink-950/20 border-pink-500/30', bio: 'High-speed action camera systems, live set cutdowns.', location: "New York, NY Market Hub", rate: "$500/day" }
];

export default function PromoterPortalView({
  isolatedTab,
  userProfile,
  setUserProfile,
  onLogout,
  triggerNotification,
  addLog, onUpgradeToPro,
  bands = [],
  offers = [],
  onCreateOffer,
  onUpdateOffer,
  shows = [],
  notifications,
  onMarkAsRead,
  onOpenNotifications,
  activeBand,
  activeBandId,
  setActiveBandId,
  isOfflineSimActive,
  setIsOfflineSimActive,
  isOnline,
  showOnlyCalendar,
  showOnlyRoutingAndAvailability,
  setActiveTab: setPortalActiveTab
}: PromoterPortalViewProps) {
  const isBandAllowed = hasRegisteredWorkspace(userProfile, 'band');
  const isCreativeAllowed = hasRegisteredWorkspace(userProfile, 'creative');
  const isPromoterAllowed = hasRegisteredWorkspace(userProfile, 'promoter');
  const isLabelAllowed = hasRegisteredWorkspace(userProfile, 'label');

  // Real-time Direct Mail / Coordinator Inbox states
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [inboxSubTab, setInboxSubTab] = useState<'conversations' | 'chat'>('conversations');
  const [inboxMessages, setInboxMessages] = useState<Record<string, { id: string; sender: 'me' | 'promoter'; text: string; timestamp: string }[]>>({});
  const [activeInboxChatId, setActiveInboxChatId] = useState<string>('tour-coordinator');
  const [inboxReplyDraft, setInboxReplyDraft] = useState('');

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [beacons, setBeacons] = useState<RoutingBeacon[]>([]);

  const confirmDeleteAccount = () => {
    localStorage.removeItem('nexus_core_user_profile');
    localStorage.removeItem('tour_operator_password');
    triggerNotification?.("Account permanently deleted.");
    addLog?.("Promoter account has been deleted from this terminal.");
    
    // Attempt full session wipe of related elements
    localStorage.removeItem('nexus_core_offers_offline');
    
    setShowDeleteConfirm(false);
    onLogout();
  };
  const [loading, setLoading] = useState(false);
  const [editingRegion, setEditingRegion] = useState(userProfile?.target_region || 'Texas');
  const [editingRadius, setEditingRadius] = useState('+100mi');
  const [dismissedBeacons, setDismissedBeacons] = useState<Set<string>>(new Set());
  const [isUpdatingRegion, setIsUpdatingRegion] = useState(false);
  const [showTrackerInfo, setShowTrackerInfo] = useState(false);
  
  const [selectedFrequency, setSelectedFrequency] = useState<'ALL' | 'Extreme Metal' | 'Hip-Hop/Rap' | 'Hardcore' | 'Industrial/EDM' | 'Punk/Alternative' | 'Rock/Heavy Metal'>('ALL');
  const [selectedSubGenre, setSelectedSubGenre] = useState<string>('ALL');
  
  // States for interactive show / festival planner launched from clicking any date
  const [showPlannerModal, setShowPlannerModal] = useState(false);
  const [showAllShowsDraftsModal, setShowAllShowsDraftsModal] = useState(false);
  const [isAllShowsDraftsExpanded, setIsAllShowsDraftsExpanded] = useState(false);

  // Tab control in Promoter View: 'routing' (Routing Dock) | 'workspace' (Immersive Event Builder Workspace) | 'offers' (In-App offers Hub) | 'sales' (Live Ticket Sales Tracker) | 'social' (Alliance Social Network)
  const [currentStep, setCurrentStep] = useState(1);
  const [activePortalTab, setActivePortalTab] = useState<'routing' | 'workspace' | 'offers' | 'sales'>(isolatedTab as any || 'routing');

  // Memoized list of promoter-specific offers
  const promoterOffers = React.useMemo(() => {
    return offers.filter(o => o.promoter_email === userProfile?.email || o.promoter_id === userProfile?.id);
  }, [offers, userProfile?.email, userProfile?.id]);

  // Track unread offers count for dynamic Contracts Hub badge
  const [unreadOffersCount, setUnreadOffersCount] = useState<number>(0);
  const hasInitializedOffersRef = useRef<boolean>(false);
  const prevOffersLengthRef = useRef<number>(0);

  // Swipe dragging state for shows/drafts
  const [draggingShowId, setDraggingShowId] = useState<string | null>(null);

  // Door Check-in Companion Terminal states
  const [isCrewTerminalActive, setIsCrewTerminalActive] = useState<boolean>(false);
  
  // Local state for dynamically syncing with manual ticket sales or live purchases
  const [localSalesList, setLocalSalesList] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_sales_offline');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  // Keep local list in sync with localStorage updates
  const reloadLocalSales = () => {
    try {
      const saved = localStorage.getItem('nexus_core_sales_offline');
      if (saved) {
        setLocalSalesList(JSON.parse(saved));
      }
    } catch (_) {}
  };

  useEffect(() => {
    reloadLocalSales();
    window.addEventListener('storage', reloadLocalSales);
    return () => {
      window.removeEventListener('storage', reloadLocalSales);
    };
  }, [activePortalTab]);

  const [INBOX_CHANNELS, setInboxChannels] = useState([
    {
      id: 'tour-coordinator',
      name: 'Touring Band Representative',
      category: 'In-Route Booking Coordinator',
      avatarText: 'TB',
      badgeColor: 'border-emerald-500 text-emerald-450 bg-emerald-950/20'
    },
    {
      id: 'sound-contractor',
      name: 'Vivid Audio Contractors',
      category: 'Day-of-Show FOH Crew Lead',
      avatarText: 'VA',
      badgeColor: 'border-rose-500 text-rose-455 bg-rose-950/20'
    },
    {
      id: 'graphic-studio',
      name: 'Decay Art & Print Shop',
      category: 'Show poster design studio',
      avatarText: 'DP',
      badgeColor: 'border-violet-500 text-violet-400 bg-violet-950/20'
    }
  ]);

  const getThreadMessages = () => {
    const msgs = inboxMessages[activeInboxChatId] || [];
    if (msgs.length === 0) {
      if (activeInboxChatId === 'tour-coordinator') {
        return [
          {
            id: 't-init',
            sender: 'me' as const,
            text: "Hi! We are routing our Southern Tour and have an open day next month on Oct 24. Is your main stage open for a metal package?",
            timestamp: 'Yesterday, 4:12 PM'
          }
        ];
      }
      if (activeInboxChatId === 'sound-contractor') {
        return [
          {
            id: 's-init',
            sender: 'me' as const,
            text: "Yo! We checked the venue spec. We'll need two extra subwoofers for the extreme metal show on Friday. Can you authorize the rider budget?",
            timestamp: '2 days ago'
          }
        ];
      }
      if (activeInboxChatId === 'graphic-studio') {
        return [
          {
            id: 'g-init',
            sender: 'me' as const,
            text: "Hello. The draft poster design is finished. Ready for the print approve. Let me know if we can press the initial batch.",
            timestamp: '3 days ago'
          }
        ];
      }
    }
    return msgs;
  };

  const handleSendInboxReply = (textToSubmit?: string) => {
    const rawTxt = textToSubmit || inboxReplyDraft;
    if (!rawTxt.trim()) return;

    const myId = activeInboxChatId;
    const currentList = inboxMessages[myId] || [];
    const finalCurrentList = currentList.length === 0 ? getThreadMessages() : currentList;

    const newMsg = {
      id: `promoter-${Date.now()}`,
      sender: 'promoter' as const,
      text: rawTxt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedList = [...finalCurrentList, newMsg];
    const updatedMessages = {
      ...inboxMessages,
      [myId]: updatedList
    };

    setInboxMessages(updatedMessages);
    localStorage.setItem('nexus_promoter_chat_messages', JSON.stringify(updatedMessages));
    setInboxReplyDraft('');

    triggerNotification?.("✉️ Message sent successfully.");
    addLog?.(`Sent message to "${myId}": "${rawTxt.slice(0, 30)}..."`);

    setTimeout(() => {
      let replyText = "Received! Our team is processing this. We'll follow up shortly.";
      if (myId === 'tour-coordinator') {
        const replies = [
          "That date works great for us. Let's draft the offer sheet with a $1,200 guarantee vs 60%.",
          "Excellent! We have 4 high-draw support bands ready. We'll finalize the flyer drafts tomorrow.",
          "Perfect. I'll pass the ticket links to our promo team. Let's get the presale live ASAP.",
          "Great! Let's lock in the hotel buyouts and we'll sign the guarantee contract tonight."
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else if (myId === 'sound-contractor') {
        const replies = [
          "Perfect, the subwoofers are added to the stage plan. We'll load in at 3 PM Friday.",
          "Awesome. I'll make sure the stage monitor mixers are synced properly.",
          "Thanks! We will arrive with our own vocal microphones and snake lines.",
          "Understood. FOH engineer confirmed. Soundcheck is scheduled for exactly 5 PM."
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      } else if (myId === 'graphic-studio') {
        const replies = [
          "Perfect! We will start printing the initial 150 holographic posters tomorrow.",
          "Great, we will deliver the direct print files to the local venue office.",
          "Excellent. The design invoice is fully updated. See you at the door on show night!",
          "Posters are approved! We'll post the web banner options for Instagram stories next."
        ];
        replyText = replies[Math.floor(Math.random() * replies.length)];
      }

      const savedLatest = localStorage.getItem('nexus_promoter_chat_messages');
      const parsedLatest = savedLatest ? JSON.parse(savedLatest) : {};
      const currentLatestList = parsedLatest[myId] || [];
      const parentList = currentLatestList.length === 0 ? getThreadMessages() : currentLatestList;

      const replyMsg = {
        id: `me-${Date.now()}`,
        sender: 'me' as const,
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalMessages = {
        ...parsedLatest,
        [myId]: [...parentList, replyMsg]
      };

      setInboxMessages(finalMessages);
      localStorage.setItem('nexus_promoter_chat_messages', JSON.stringify(finalMessages));
      
      const channelObj = INBOX_CHANNELS.find(c => c.id === myId);
      triggerNotification?.(`📬 New inbox message from ${replyMsg.sender === 'me' ? (channelObj?.name || 'Contact') : 'FOH Crew'}!`);
    }, 2000);
  };

  // Synchronize inbox messages with localStorage
  useEffect(() => {
    const loadInboxMessages = () => {
      try {
        const saved = localStorage.getItem('nexus_promoter_chat_messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          setInboxMessages(parsed);
        }
      } catch (e) {
        console.warn('Failed to load promoter inbox messages:', e);
      }
    };

    loadInboxMessages();

    // Poll for changes when inbox is open
    let interval: any;
    if (isInboxOpen) {
      interval = setInterval(loadInboxMessages, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInboxOpen, userProfile?.id]);

  // Synchronized creative contract desk lists
  const [creativeContracts, setCreativeContracts] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_creative_contracts_v1');
      return saved ? JSON.parse(saved) : [];
    } catch (_) {
      return [];
    }
  });

  useEffect(() => {
    const syncContracts = () => {
      try {
        const saved = localStorage.getItem('nexus_core_creative_contracts_v1');
        if (saved) {
          setCreativeContracts(JSON.parse(saved));
        }
      } catch (_) {}
    };
    syncContracts();
    const intv = setInterval(syncContracts, 3000);
    return () => clearInterval(intv);
  }, []);

  const handlePromoterReleaseEscrow = (contractId: string) => {
    try {
      const savedContractsStr = localStorage.getItem('nexus_core_creative_contracts_v1');
      if (savedContractsStr) {
        const savedContracts = JSON.parse(savedContractsStr);
        const updatedContracts = savedContracts.map((c: any) => {
          if (c.id === contractId) {
            const releasedMilestones = c.milestones?.map((m: any) => ({ ...m, status: 'released' as const }));
            return {
              ...c,
              status: 'released' as const,
              milestones: releasedMilestones
            };
          }
          return c;
        });

        localStorage.setItem('nexus_core_creative_contracts_v1', JSON.stringify(updatedContracts));
        setCreativeContracts(updatedContracts);

        const target = savedContracts.find((c: any) => c.id === contractId);
        triggerNotification(`⚡ ESCROW RELEASED SUCCESSFULLY: Hired Specialist "${target?.creative_name || 'Creative'}" has been paid $${target?.fee || 200}!`);
        
        if (addLog) {
          addLog(`Promoter authorized release of escrow flat-rate funding of $${target?.fee || 200} to "${target?.creative_name || 'Specialist'}" from desk.`);
        }

        const supabase = getSupabase();
        if (supabase) {
          supabase.from('creative_contracts_v1')
            .upsert(updatedContracts)
            .then(({ error }) => {
              if (error) console.warn('Supabase release escrow sync failure:', error);
            });
        }
      }
    } catch (err) {
      console.warn('Error releasing escrow payment from promoter workspace:', err);
    }
  };

  // Ticket Redemptions Map: ticket_id -> true (checked in)
  const [redeemedTickets, setRedeemedTickets] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_ticket_redemptions');
      return saved ? JSON.parse(saved) : {};
    } catch (_) {
      return {};
    }
  });

  // Commission split percentage (defaults to 70% to band)
  const [artistCommissionSplit, setArtistCommissionSplit] = useState<number>(70);

  // Collapse/Expand state for ticket sales modules
  const [isBandAffiliateCollapsed, setIsBandAffiliateCollapsed] = useState<boolean>(true);
  const [isBreakevenCollapsed, setIsBreakevenCollapsed] = useState<boolean>(true);

  const handleToggleRedeem = (saleId: string) => {
    setRedeemedTickets(prev => {
      const next = { ...prev, [saleId]: !prev[saleId] };
      localStorage.setItem('nexus_core_ticket_redemptions', JSON.stringify(next));
      return next;
    });
    if (typeof playLocalBeep === 'function') {
      playLocalBeep(660, 'sine', 0.05);
    }
  };

  useEffect(() => {
    if (!hasInitializedOffersRef.current) {
      prevOffersLengthRef.current = promoterOffers.length;
      setUnreadOffersCount(activePortalTab === 'offers' ? 0 : promoterOffers.length);
      hasInitializedOffersRef.current = true;
      return;
    }

    if (activePortalTab === 'offers') {
      setUnreadOffersCount(0);
      prevOffersLengthRef.current = promoterOffers.length;
    } else {
      if (promoterOffers.length > prevOffersLengthRef.current) {
        const diff = promoterOffers.length - prevOffersLengthRef.current;
        setUnreadOffersCount(prev => prev + diff);
        prevOffersLengthRef.current = promoterOffers.length;
      } else if (promoterOffers.length < prevOffersLengthRef.current) {
        const diff = prevOffersLengthRef.current - promoterOffers.length;
        setUnreadOffersCount(prev => Math.max(0, prev - diff));
        prevOffersLengthRef.current = promoterOffers.length;
      }
    }
  }, [activePortalTab, promoterOffers.length]);

  // Scroll to top of the page on view / tab change within Promoter Portal
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    const scrollableDivs = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
    scrollableDivs.forEach(div => {
      div.scrollTop = 0;
    });
  }, [activePortalTab]);

  // Offer Creation Form State
  const [bandSearchQuery, setBandSearchQuery] = useState('');
  const [filterByActiveBeacons, setFilterByActiveBeacons] = useState(false);
  const [formBandId, setFormBandId] = useState('');
  const [isExternalArtist, setIsExternalArtist] = useState(false);
  const [externalArtistName, setExternalArtistName] = useState('');
  const [externalArtistLinkPopup, setExternalArtistLinkPopup] = useState<string | null>(null);
  const [formVenue, setFormVenue] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formState, setFormState] = useState('');
  const [formCountry, setFormCountry] = useState('USA');
  const [formDate, setFormDate] = useState('');
  const [formGuarantee, setFormGuarantee] = useState('');
  const [formDeposit, setFormDeposit] = useState('');
  const [formDepositDate, setFormDepositDate] = useState('');
  const [formCurrency, setFormCurrency] = useState('USD');
  const [formAgeLimit, setFormAgeLimit] = useState('All Ages');
  const [formLoadIn, setFormLoadIn] = useState('');
  const [formDoorTime, setFormDoorTime] = useState('');
  const [formSetTime, setFormSetTime] = useState('');
  const [formCurfewTime, setFormCurfewTime] = useState('');
  const [formExpectedAttendance, setFormExpectedAttendance] = useState<'+100' | '100-300' | '300-700' | '700+'>('300-700');
  const [formRadiusClause, setFormRadiusClause] = useState('');
  const [formExpiration, setFormExpiration] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formShowType, setFormShowType] = useState<'standard' | 'festival'>('standard');
  const [formVenueCut, setFormVenueCut] = useState('');
  const [formMerchCut, setFormMerchCut] = useState('');
  const [formShowLineup, setFormShowLineup] = useState('');
  const [formSoundcheck, setFormSoundcheck] = useState('17:00');
  const [formMerchCall, setFormMerchCall] = useState('18:00');
  const [formDinnerArrangements, setFormDinnerArrangements] = useState('Buyout ($30/head)');
  const [formTravelArrangements, setFormTravelArrangements] = useState('');
  const [showQuickTemplates, setShowQuickTemplates] = useState(false);
  const [showDispatchedCollapse, setShowDispatchedCollapse] = useState(true);
  const [formEventId, setFormEventId] = useState('');
  const [formStageName, setFormStageName] = useState('');
  const [selectedVenueStages, setSelectedVenueStages] = useState<string[]>([]);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Event Lineups State
  const [lineups, setLineups] = useState<EventLineup[]>(userProfile?.creative_metadata?.events || []);
  const [isCreatingLineup, setIsCreatingLineup] = useState(false);
  const [isLineupsExpanded, setIsLineupsExpanded] = useState(false);
  const [newLineupName, setNewLineupName] = useState('');
  const [newLineupDate, setNewLineupDate] = useState('');
  const [newLineupVenue, setNewLineupVenue] = useState('');
  const [newLineupStage, setNewLineupStage] = useState('Main Stage');
  const [newLineupTimeSlot, setNewLineupTimeSlot] = useState<string>('all-day');
  const [showSearchQuery, setShowSearchQuery] = useState('');
  const [hiddenShowIds, setHiddenShowIds] = useState<Set<string>>(new Set());
  const [showShowDeleteConfirm, setShowShowDeleteConfirm] = useState<any | null>(null);

  // Load deleted shows on mount
  React.useEffect(() => {
    try {
      const savedDeleted = localStorage.getItem('nexus_promoter_deleted_shows');
      if (savedDeleted) {
        const parsed = JSON.parse(savedDeleted);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHiddenShowIds(new Set(parsed));
        }
      }
    } catch (e) {
      console.error("Failed to parse deleted shows:", e);
    }
  }, []);

  const handleDeleteShowPermanently = (ev: any) => {
    if (!ev) return;
    
    // 1. If it is a local lineup, remove it from the lineups array and userProfile
    if (ev.eventType === 'local_lineup') {
      const updatedLineups = lineups.filter(l => l.id !== ev.id);
      setLineups(updatedLineups);
      
      const currentMeta = userProfile?.creative_metadata || {};
      setUserProfile(prev => ({
        ...prev,
        creative_metadata: {
          ...currentMeta,
          events: updatedLineups
        }
      }));
    }

    // 2. Hide out of sight permanently
    setHiddenShowIds(prev => {
      const next = new Set(prev);
      next.add(ev.id);
      return next;
    });

    // 3. Persist deletion key to localStorage so it stays deleted permanently
    try {
      const savedDeleted = localStorage.getItem('nexus_promoter_deleted_shows');
      const deletedList = savedDeleted ? JSON.parse(savedDeleted) : [];
      if (!deletedList.includes(ev.id)) {
        deletedList.push(ev.id);
        localStorage.setItem('nexus_promoter_deleted_shows', JSON.stringify(deletedList));
      }
    } catch (err) {
      console.error("Local storage delete write error:", err);
    }

    if (typeof playLocalBeep === 'function') {
      playLocalBeep(180, 'sawtooth', 0.12);
    }
    triggerNotification?.(`"${ev.name}" has been permanently purged from the database.`);
    setShowShowDeleteConfirm(null);
  };

  // Breakeven states
  const [breakevenTicketPrice, setBreakevenTicketPrice] = useState<number>(25);
  const [estExpenses, setEstExpenses] = useState<number>(3500);

  // Promoter Details state for Accepted Shows
  const [submittingDetailsId, setSubmittingDetailsId] = useState<string | null>(null);
  const [detailAddress, setDetailAddress] = useState('');
  const [detailLoadIn, setDetailLoadIn] = useState('16:00');
  const [detailDoors, setDetailDoors] = useState('19:00');
  const [detailSetTime, setDetailSetTime] = useState('21:00');
  const [detailCurfew, setDetailCurfew] = useState('23:30');
  const [detailAttendance, setDetailAttendance] = useState<'+100' | '100-300' | '300-700' | '700+'>('300-700');
  const [detailAge, setDetailAge] = useState<'all' | '18' | '21'>('all');
  const [detailNotes, setDetailNotes] = useState('');

  // Counter proposal states
  const [renegotiatingId, setRenegotiatingId] = useState<string | null>(null);
  const [counterProposalAmount, setCounterProposalAmount] = useState('');
  const [counterProposalNotes, setCounterProposalNotes] = useState('');

  // Profile settings state variables for promoter details
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showSubscriptionTiersModal, setShowSubscriptionTiersModal] = useState(false);
  const [profileFormName, setProfileFormName] = useState(userProfile?.name || '');
  const [profileFormCompany, setProfileFormCompany] = useState(
    userProfile?.promoter_metadata?.brand_name || 
    userProfile?.promoter_metadata?.agency_name ||
    userProfile?.promoter_agency ||
    userProfile?.promoter_brand ||
    userProfile?.promoter_name ||
    'Nexus Live Productions'
  );
  const [profileFormRegion, setProfileFormRegion] = useState(userProfile?.target_region || userProfile?.promoter_metadata?.region || userProfile?.promoter_region || 'Texas');
  const [profileFormAvatar, setProfileFormAvatar] = useState(userProfile?.promoter_logo || userProfile?.promoter_metadata?.logo_url || userProfile?.avatar_url || '');
  const [profileFormRole, setProfileFormRole] = useState(userProfile?.promoter_metadata?.title || userProfile?.role || 'Lead Talent Buyer & Production Director');
  const [profileGenreTags, setProfileGenreTags] = useState<string[]>(userProfile?.promoter_metadata?.genres || userProfile?.genre_tags || []);

  // Venue settings tabs controls inside settings modal
  const [settingsTab, setSettingsTab] = useState<'general' | 'home_venue' | 'portfolio'>('general');

  // Home Venue State Fields
  const [homeVenueName, setHomeVenueName] = useState(
    userProfile?.promoter_metadata?.home_venue?.name || 
    userProfile?.promoter_metadata?.brand_name ||
    userProfile?.promoter_metadata?.agency_name ||
    userProfile?.promoter_agency ||
    userProfile?.creative_metadata?.home_venue?.name || 
    ''
  );
  const [homeVenueAddress, setHomeVenueAddress] = useState(
    userProfile?.promoter_metadata?.home_venue?.address || 
    userProfile?.promoter_metadata?.street_address ||
    userProfile?.creative_metadata?.home_venue?.address || 
    ''
  );
  const [homeVenueCity, setHomeVenueCity] = useState(
    userProfile?.promoter_metadata?.home_venue?.city || 
    userProfile?.promoter_metadata?.city ||
    userProfile?.creative_metadata?.home_venue?.city || 
    ''
  );
  const [homeVenueState, setHomeVenueState] = useState(
    userProfile?.promoter_metadata?.home_venue?.state_province || 
    userProfile?.promoter_metadata?.state ||
    userProfile?.creative_metadata?.home_venue?.state_province || 
    ''
  );
  const [homeVenueCountry, setHomeVenueCountry] = useState(
    userProfile?.promoter_metadata?.home_venue?.country || 
    userProfile?.promoter_metadata?.country ||
    userProfile?.creative_metadata?.home_venue?.country || 
    'USA'
  );
  const [homeVenueCapacity, setHomeVenueCapacity] = useState(
    userProfile?.promoter_metadata?.home_venue?.capacity?.toString() || 
    userProfile?.promoter_metadata?.capacity?.toString() ||
    userProfile?.creative_metadata?.home_venue?.capacity?.toString() || 
    ''
  );
  const [homeVenueLoadIn, setHomeVenueLoadIn] = useState(userProfile?.promoter_metadata?.home_venue?.load_in_time || userProfile?.creative_metadata?.home_venue?.load_in_time || '16:00');
  const [homeVenueDoors, setHomeVenueDoors] = useState(userProfile?.promoter_metadata?.home_venue?.doors_time || userProfile?.creative_metadata?.home_venue?.doors_time || '19:00');
  const [homeVenueSetTime, setHomeVenueSetTime] = useState(userProfile?.promoter_metadata?.home_venue?.set_time || userProfile?.creative_metadata?.home_venue?.set_time || '21:00');
  const [homeVenueCurfew, setHomeVenueCurfew] = useState(userProfile?.promoter_metadata?.home_venue?.curfew_time || userProfile?.creative_metadata?.home_venue?.curfew_time || '23:30');
  const [homeVenueAttendance, setHomeVenueAttendance] = useState<'+100' | '100-300' | '300-700' | '700+'>(userProfile?.promoter_metadata?.home_venue?.expected_attendance || userProfile?.creative_metadata?.home_venue?.expected_attendance || '300-700');
  const [homeVenueAgeRestriction, setHomeVenueAgeRestriction] = useState(userProfile?.promoter_metadata?.home_venue?.age_restriction || userProfile?.creative_metadata?.home_venue?.age_restriction || 'All Ages');
  const [homeVenueNotes, setHomeVenueNotes] = useState(userProfile?.promoter_metadata?.home_venue?.additional_notes || userProfile?.creative_metadata?.home_venue?.additional_notes || '');
  const [homeVenueStages, setHomeVenueStages] = useState<string[]>(userProfile?.promoter_metadata?.home_venue?.stages || userProfile?.creative_metadata?.home_venue?.stages || []);
  const [newStageNameHome, setNewStageNameHome] = useState('');

  // Additional Extended Venue Facilities/Advanced Schedules/Technical Specs state
  const [profileFormBookingEmail, setProfileFormBookingEmail] = useState(userProfile?.promoter_metadata?.booking_email || userProfile?.promoter_booking_email || userProfile?.email || '');
  const [venueWifiNetwork, setVenueWifiNetwork] = useState(userProfile?.promoter_metadata?.home_venue?.wifi_network || userProfile?.creative_metadata?.home_venue?.wifi_network || '');
  const [venueWifiPassword, setVenueWifiPassword] = useState(userProfile?.promoter_metadata?.home_venue?.wifi_password || userProfile?.creative_metadata?.home_venue?.wifi_password || '');
  const [venueParking, setVenueParking] = useState(userProfile?.promoter_metadata?.home_venue?.parking_arrangements || userProfile?.creative_metadata?.home_venue?.parking_arrangements || '');
  const [venueDinner, setVenueDinner] = useState(userProfile?.promoter_metadata?.home_venue?.dinner_arrangements || userProfile?.creative_metadata?.home_venue?.dinner_arrangements || 'Buyout for each band member');
  const [venueMerchCall, setVenueMerchCall] = useState(userProfile?.promoter_metadata?.home_venue?.merch_call_time || userProfile?.creative_metadata?.home_venue?.merch_call_time || '17:00');
  const [venueSoundcheck, setVenueSoundcheck] = useState(userProfile?.promoter_metadata?.home_venue?.soundcheck_time || userProfile?.creative_metadata?.home_venue?.soundcheck_time || '18:00');
  const [venueGearProvided, setVenueGearProvided] = useState(userProfile?.promoter_metadata?.home_venue?.gear_provided || userProfile?.promoter_metadata?.tech_rider || userProfile?.creative_metadata?.home_venue?.gear_provided || '');
  const [venueAudioRequirements, setVenueAudioRequirements] = useState(userProfile?.promoter_metadata?.home_venue?.audio_requirements || userProfile?.promoter_metadata?.tech_rider || userProfile?.creative_metadata?.home_venue?.audio_requirements || '');
  const [venueBacklineRequirements, setVenueBacklineRequirements] = useState(userProfile?.promoter_metadata?.home_venue?.backline_requirements || userProfile?.promoter_metadata?.security_map || userProfile?.creative_metadata?.home_venue?.backline_requirements || '');

  // Expansible genre clusters state (empty means all collapsed by default)
  const [expandedClusters, setExpandedClusters] = useState<string[]>([]);

  // Saved multi-venues portfolio list
  const [savedVenuesList, setSavedVenuesList] = useState<any[]>(userProfile?.promoter_metadata?.saved_venues || userProfile?.creative_metadata?.saved_venues || []);

  // Scroll to top of the page when the subscription picker is activated
  useEffect(() => {
    if (showSubscriptionTiersModal) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const scrollableDivs = document.querySelectorAll('.overflow-y-auto, .overflow-auto');
      scrollableDivs.forEach(div => {
        div.scrollTop = 0;
      });
    }
  }, [showSubscriptionTiersModal]);

  // Interactive calendar helper states
  const [calendarCurrentDate, setCalendarCurrentDate] = useState<Date>(() => new Date());
  const [calendarSelectedDate, setCalendarSelectedDate] = useState<Date>(() => new Date());
  const [selectedVenueIndex, setSelectedVenueIndex] = useState<number>(0);
  const [calendarTouchStart, setCalendarTouchStart] = useState<number | null>(null);
  const [calendarTouchEnd, setCalendarTouchEnd] = useState<number | null>(null);

  // Expanded detailed modal for clicked show details
  const [selectedCalendarShow, setSelectedCalendarShow] = useState<any | null>(null);
  
  // Entire Calendar Wrapper Collapse
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(true);

  React.useEffect(() => {
    if (activePortalTab === 'routing') {
      setIsCalendarExpanded(true);
    } else {
      setIsCalendarExpanded(false);
    }
  }, [activePortalTab]);

  // Collapsible view states for specs and date profile lists
  const [propertySpecExpanded, setPropertySpecExpanded] = useState(false);
  const [dateProfileExpanded, setDateProfileExpanded] = useState(false);

  // States for interactive show / festival planner launched from clicking any date
  const [plannerShowType, setPlannerShowType] = useState<'standard' | 'festival'>('standard');
  const [plannerFestivalDuration, setPlannerFestivalDuration] = useState<number>(3);
  const [plannerEventName, setPlannerEventName] = useState('');
  const [plannerBandId, setPlannerBandId] = useState('');
  const [plannerGuarantee, setPlannerGuarantee] = useState('2000');
  const [plannerNotes, setPlannerNotes] = useState('');

  // States for interactive lineup management inside the big calendar planner
  const [plannerLineup, setPlannerLineup] = useState<{
    id: string;
    band_id: string;
    band_name: string;
    status: 'pending' | 'accepted' | 'declined' | 'renegotiating' | 'interested';
    guarantee_amount: number | '';
    day: number;
    set_time: string;
    load_in_time: string;
    travel: string;
    rider: string;
    notes: string;
    primary_contact_method: 'phone' | 'email' | 'text' | 'facebook';
    contact_details: string;
  }[]>([]);

  // Cost Ledger to track production and promotional costs
  const [plannerCostLedger, setPlannerCostLedger] = useState<{
    id: string;
    description: string;
    category: 'sound' | 'lighting' | 'marketing' | 'security' | 'staff' | 'lodging' | 'catering' | 'other';
    estimated_cost: number;
    actual_cost: number;
    notes: string;
  }[]>([
    { id: 'l1', description: 'Main Stage PA Setup', category: 'sound', estimated_cost: 450, actual_cost: 0, notes: 'Vendor quote pending' },
    { id: 'l2', description: 'Social Media Boosting', category: 'marketing', estimated_cost: 200, actual_cost: 0, notes: 'Facebook / IG target' },
    { id: 'l3', description: 'Physical Flyering & Posters', category: 'marketing', estimated_cost: 100, actual_cost: 0, notes: 'Lobby print house' },
    { id: 'l4', description: 'Security detail (2 Officers)', category: 'security', estimated_cost: 300, actual_cost: 0, notes: 'Required by venue curfew bylaws' }
  ]);

  // States to add a single band to the plannerLineup list
  const [plannerAddBandId, setPlannerAddBandId] = useState('');
  const [plannerAddCustomName, setPlannerAddCustomName] = useState('');
  const [plannerAddIsExternal, setPlannerAddIsExternal] = useState(false);
  const [plannerAddDay, setPlannerAddDay] = useState(0);
  const [plannerDragOverDay, setPlannerDragOverDay] = useState<number | null>(null);
  const [plannerAddStatus, setPlannerAddStatus] = useState<'pending' | 'accepted' | 'declined' | 'renegotiating' | 'interested'>('pending');
  const [plannerAddGuarantee, setPlannerAddGuarantee] = useState('1000');
  const [plannerAddSetTime, setPlannerAddSetTime] = useState('');
  const [plannerAddLoadIn, setPlannerAddLoadIn] = useState('');
  const [plannerAddContactMethod, setPlannerAddContactMethod] = useState<'phone' | 'email' | 'text' | 'facebook'>('email');
  const [plannerAddContactValue, setPlannerAddContactValue] = useState('');
  
  // States to append items to the expense ledger inside the planner
  const [ledgerAddDescription, setLedgerAddDescription] = useState('');
  const [ledgerAddCategory, setLedgerAddCategory] = useState<'sound' | 'lighting' | 'marketing' | 'security' | 'staff' | 'lodging' | 'catering' | 'other'>('sound');
  const [ledgerAddEstimated, setLedgerAddEstimated] = useState('150');
  const [ledgerAddActual, setLedgerAddActual] = useState('0');
  const [ledgerAddNotes, setLedgerAddNotes] = useState('');

  // Search and filter inside the planner lineup roster
  const [plannerSearchQuery, setPlannerSearchQuery] = useState('');
  const [plannerActiveFilterDay, setPlannerActiveFilterDay] = useState<number | 'ALL'>('ALL');
  const [plannerEditingIndex, setPlannerEditingIndex] = useState<number | null>(null);

  // Expanded enhancements states
  const [showStagingTemplatesCollapse, setShowStagingTemplatesCollapse] = useState(false);
  const [ticketingEventId, setTicketingEventId] = useState<string>('demo-sandbox');
  const [sandboxTiers, setSandboxTiers] = useState<TicketTier[]>([
    { id: 'sb-early', name: 'Early Bird GA', price: 19, capacity: 150, sold: 120 },
    { id: 'sb-ga', name: 'General Admission', price: 29, capacity: 600, sold: 345 },
    { id: 'sb-vip', name: 'VIP Meet & Greet', price: 85, capacity: 75, sold: 42 },
    { id: 'sb-late', name: 'Late Entry Package', price: 40, capacity: 100, sold: 15 }
  ]);
  const [tierLineupId, setTierLineupId] = useState<string | null>(null);
  const [newTierName, setNewTierName] = useState('');
  const [newTierPrice, setNewTierPrice] = useState('');
  const [newTierCapacity, setNewTierCapacity] = useState('');
  const [newTierSold, setNewTierSold] = useState('');

  const handleCalendarPlannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const activeTier = userProfile?.sub_tier || 'local_booking_agent';
    const rollingActiveShowLimit = 
      activeTier === 'enterprise_network' || activeTier === 'enterprise_circuit' ? PROMOTER_BILLING_MATRIX.tiers.enterprise_network.rollingActiveShowLimit :
      activeTier === 'regional_talent_buyer' ? PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.rollingActiveShowLimit :
      activeTier === 'local_booking_agent' ? PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.rollingActiveShowLimit :
      1; // single_festival_pass or fallback
    
    const nowStr = new Date().toISOString().split('T')[0];
    const activeLineupsCount = lineups.filter(l => (l.date || '') >= nowStr).length;

    if (activeLineupsCount >= rollingActiveShowLimit) {
      triggerNotification?.(`LIMIT REACHED: You can only have ${rollingActiveShowLimit} active concurrent events on your current tier.`);
      return;
    }

    
    const activeVenue = activeAllVenues[selectedVenueIndex] || {
      name: 'Default Venue / Stage',
      address: 'No Address Specified',
      city: 'Global',
      state: 'TX',
      capacity: '500',
      age_restriction: 'All Ages',
      load_in_time: '16:00',
      doors_time: '19:00',
      set_time: '21:00',
      curfew_time: '23:30'
    };

    const isoSelectedStr = `${calendarSelectedDate.getFullYear()}-${String(calendarSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(calendarSelectedDate.getDate()).padStart(2, '0')}`;

    // 1. Create a parent EventLineup so that this full lineup setup has its own Workspace
    const eventId = 'event-' + Math.random().toString(36).substr(2, 9);
    const eventName = plannerEventName || `${activeVenue.name} Showcase`;
    
    // Support festival multi-days list
    const festivalDatesArray: string[] = [isoSelectedStr];
    if (plannerShowType === 'festival') {
      for (let i = 1; i < plannerFestivalDuration; i++) {
        const nextD = new Date(calendarSelectedDate);
        nextD.setDate(calendarSelectedDate.getDate() + i);
        const nextIso = `${nextD.getFullYear()}-${String(nextD.getMonth() + 1).padStart(2, '0')}-${String(nextD.getDate()).padStart(2, '0')}`;
        festivalDatesArray.push(nextIso);
      }
    }

    const newEvent: EventLineup = {
      id: eventId,
      name: eventName,
      date: isoSelectedStr,
      venue_name: activeVenue.name,
      dates: festivalDatesArray,
      duration_days: plannerShowType === 'festival' ? plannerFestivalDuration : 1,
    };

    // Append to list of lineups
    const updatedLineups = [...lineups, newEvent];
    setLineups(updatedLineups);
    
    // Update user profile metadata
    const currentMeta = userProfile?.creative_metadata || {};
    setUserProfile(prev => ({
      ...prev,
      creative_metadata: {
        ...currentMeta,
        events: updatedLineups
      }
    }));

    // 2. Add offers for all lineup items, or if empty, create a single headline offer
    const finalLineupItems = plannerLineup.length > 0 ? plannerLineup : [
      {
        id: 'item-' + Math.random().toString(36).substr(2, 9),
        band_id: plannerBandId || 'void_walkers',
        band_name: (allAvailableFormBands.find(b => b.id === plannerBandId) || allAvailableFormBands[0])?.name || 'Headline Artist',
        status: 'pending' as const,
        guarantee_amount: parseFloat(plannerGuarantee) || 2000,
        day: 1,
        set_time: activeVenue.set_time || '21:00',
        load_in_time: activeVenue.load_in_time || '16:00',
        travel: 'Ground Travel / Regional Shuttle Required',
        rider: 'Standard Tech Backline Requirements',
        notes: plannerNotes || `Planned Show/Festival via Interactive Calendar.`
      }
    ];

    finalLineupItems.forEach((item) => {
      const bandOffer: Offer = {
        id: 'offer-' + Math.random().toString(36).substr(2, 9),
        promoter_id: userProfile?.id || 'promoter-direct',
        promoter_name: userProfile?.name,
        promoter_email: userProfile?.email,
        band_id: item.band_id,
        band_name: item.band_name,
        venue_name: activeVenue.name,
        venue_address: activeVenue.address || undefined,
        city: activeVenue.city || 'Global',
        state_province: activeVenue.state || undefined,
        country: 'USA',
        date: isoSelectedStr,
        guarantee_amount: item.guarantee_amount,
        status: item.status === 'interested' ? 'pending' : item.status, // Normalize
        created_at: new Date().toISOString(),
        notes: item.notes || `Day ${item.day} Show Slot`,
        last_action_by: 'promoter',
        show_type: plannerShowType,
        deposit_amount: item.guarantee_amount ? Math.floor(item.guarantee_amount * 0.1) : undefined,
        deposit_due_date: isoSelectedStr,
        currency: 'USD',
        age_restriction: activeVenue.age_restriction || 'All Ages',
        load_in_time: item.load_in_time || activeVenue.load_in_time || '16:00',
        doors_time: activeVenue.doors_time || '19:00',
        set_time: item.set_time || activeVenue.set_time || '21:00',
        curfew_time: activeVenue.curfew_time || '23:30',
        expected_attendance: activeVenue.expected_attendance || '300-700',
        details_completed: true,
        event_name: eventName,
        event_id: eventId // Links to the Workspace!
      };
      onCreateOffer(bandOffer);
    });

    setActivePortalTab('routing');
    
    // Clear states
    setPlannerEventName('');
    setPlannerBandId('');
    setPlannerGuarantee('2000');
    setPlannerNotes('');
    setPlannerLineup([]);

    triggerNotification?.(`⚡ Event created! ${finalLineupItems.length} show draft offers added to calendar.`);
    addLog?.(`Interactive Calendar Plan created on ${isoSelectedStr}: ${eventName} with ${finalLineupItems.length} acts.`);
  };

  // Local premium synthesizer beep for high-end micro-interactions
  const playLocalBeep = (freq = 550, type: OscillatorType = 'sine', duration = 0.05) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.015, audioCtx.currentTime); 
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  };

  const calDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const calStartDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const calPreviousMonth = () => {
    playLocalBeep(450, 'sine', 0.04);
    setCalendarCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const calNextMonth = () => {
    playLocalBeep(450, 'sine', 0.04);
    setCalendarCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  const monthNames = [
    "JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", 
    "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"
  ];

  const activeAllVenues = React.useMemo(() => {
    const list: any[] = [];
    if (homeVenueName.trim()) {
      list.push({
        id: 'home',
        name: homeVenueName.trim(),
        city: homeVenueCity || '',
        state: homeVenueState || '',
        address: homeVenueAddress || '',
        capacity: homeVenueCapacity || 'N/A',
        expected_attendance: homeVenueAttendance || '300-700',
        age_restriction: homeVenueAgeRestriction || 'All Ages',
        additional_notes: homeVenueNotes || '',
        load_in_time: homeVenueLoadIn || '16:00',
        doors_time: homeVenueDoors || '19:00',
        set_time: homeVenueSetTime || '21:00',
        curfew_time: homeVenueCurfew || '23:30',
        isHome: true
      });
    }
    savedVenuesList.forEach((v: any, idx: number) => {
      if (v && v.name) {
        list.push({
          id: v.id || `saved`,
          name: v.name,
          city: v.city || '',
          state: v.state || v.state_province || '',
          address: v.address || '',
          capacity: v.capacity || 'N/A',
          expected_attendance: v.expected_attendance || '300-700',
          age_restriction: v.age_restriction || 'All Ages',
          additional_notes: v.additional_notes || '',
          load_in_time: v.load_in_time || '16:00',
          doors_time: v.doors_time || '19:00',
          set_time: v.set_time || '21:00',
          curfew_time: v.curfew_time || '23:30',
          isHome: false
        });
      }
    });
    if (list.length === 0) {
      list.push({
        id: 'no-stages-placeholder',
        name: 'Default Venue / Stage',
        city: 'Global',
        state: 'TX',
        address: 'No Address Specified',
        capacity: '500',
        expected_attendance: '300-700',
        age_restriction: 'All Ages',
        additional_notes: 'Add a Home Venue or Saved Venues in Settings to register your brand portfolio!',
        load_in_time: '16:00',
        doors_time: '19:00',
        set_time: '21:00',
        curfew_time: '23:30',
        isHome: true,
        isFallback: true
      });
    }
    return list;
  }, [homeVenueName, homeVenueCity, homeVenueState, homeVenueAddress, homeVenueCapacity, homeVenueAttendance, homeVenueAgeRestriction, homeVenueNotes, homeVenueLoadIn, homeVenueDoors, homeVenueSetTime, homeVenueCurfew, savedVenuesList]);

  const activeCalendarDays = React.useMemo(() => {
    if (activeAllVenues.length === 0) return [];
    
    const activeVenue = activeAllVenues[selectedVenueIndex];
    if (!activeVenue) return [];

    const totalDays = calDaysInMonth(calendarCurrentDate);
    const startOffset = calStartDayOfMonth(calendarCurrentDate);
    const daysArr: { date: Date | null; isCurrentMonth: boolean; hasShow: boolean; events: any[] }[] = [];

    // Offset for empty starting days
    for (let i = 0; i < startOffset; i++) {
      daysArr.push({ date: null, isCurrentMonth: false, hasShow: false, events: [] });
    }

    // Populate actual month days
    for (let d = 1; d <= totalDays; d++) {
      const dayDate = new Date(calendarCurrentDate.getFullYear(), calendarCurrentDate.getMonth(), d);
      const isoStr = `${dayDate.getFullYear()}-${String(dayDate.getMonth() + 1).padStart(2, '0')}-${String(dayDate.getDate()).padStart(2, '0')}`;
      
      // Match 1: Global shows matching our venue name or city
      const matchedGlobalShows = (shows || []).filter(s => {
        if (s.date !== isoStr) return false;
        const sName = (s.name || '').toLowerCase();
        const vName = activeVenue.name.toLowerCase();
        const matchesName = sName.includes(vName) || vName.includes(sName);
        const matchesAddress = s.venue_address && s.venue_address.toLowerCase().includes(activeVenue.address.toLowerCase());
        return matchesName || matchesAddress;
      }).map(s => ({ 
        id: s.id, 
        name: s.festival_name || s.name, 
        eventType: 'global_show', 
        guarantee: s.guarantee_amount || 0,
        status: s.status || 'Active',
        original: s,
        stage_name: s.stage_name,
        time_slot: s.time_slot,
        times: {
          load_in: s.load_in_time || activeVenue.load_in_time,
          doors: s.doors_time || activeVenue.doors_time,
          set_time: s.set_time || activeVenue.set_time,
          curfew: s.curfew_time || activeVenue.curfew_time
        }
      }));

      // Match 2: Offers made by this promoter for this venue name
      const matchedOffers = (offers || []).filter(o => {
        if (o.date !== isoStr) return false;
        // Check if from this promoter
        const isMyOffer = o.promoter_email === userProfile?.email || o.promoter_id === userProfile?.id;
        if (!isMyOffer) return false;
        
        const oVenue = (o.venue_name || '').toLowerCase();
        const vName = activeVenue.name.toLowerCase();
        return oVenue.includes(vName) || vName.includes(oVenue);
      }).map(o => ({
        id: o.id,
        name: `${o.band_name} at ${o.venue_name}`,
        eventType: 'offer',
        guarantee: o.guarantee_amount || 0,
        status: o.status, // e.g. 'pending' | 'accepted' | 'declined' | 'renegotiating'
        original: o,
        stage_name: o.stage_name,
        time_slot: o.time_slot,
        times: {
          load_in: activeVenue.load_in_time,
          doors: activeVenue.doors_time,
          set_time: activeVenue.set_time,
          curfew: activeVenue.curfew_time
        }
      }));

      // Match 3: Local promoter lineups
      const matchedLineups = (lineups || []).filter(l => {
        const matchesDate = l.date === isoStr || (l.dates && l.dates.includes(isoStr));
        if (!matchesDate) return false;
        const lVenue = (l.venue_name || '').toLowerCase();
        const vName = activeVenue.name.toLowerCase();
        return lVenue.includes(vName) || vName.includes(lVenue);
      }).map(l => ({
        id: l.id,
        name: l.name || 'Custom Lineup',
        eventType: 'local_lineup',
        guarantee: 0,
        status: 'Built / Local Draft',
        original: l,
        stage_name: l.stage_name,
        time_slot: l.time_slot,
        times: {
          load_in: activeVenue.load_in_time,
          doors: activeVenue.doors_time,
          set_time: activeVenue.set_time,
          curfew: activeVenue.curfew_time
        }
      }));

      // We combine and deduplicate if any ID is duplicate
      const hasDefinedShowOrLineup = matchedGlobalShows.length > 0 || matchedLineups.length > 0;
      
      let finalOffers = matchedOffers;
      if (hasDefinedShowOrLineup) {
         // Hide raw offers because they are likely already folded into the Show/Lineup
         finalOffers = [];
      } else if (matchedOffers.length > 1) {
         // Combine them into a single "Pending Draft" card if multiple
         const sumGuarantee = matchedOffers.reduce((acc, curr) => acc + curr.guarantee, 0);
         finalOffers = [{
           id: matchedOffers[0].id + '_grouped',
           name: `Show Draft (${matchedOffers.length} Bands)`,
           eventType: 'offer',
           guarantee: sumGuarantee,
           status: 'draft',
           original: matchedOffers[0].original,
           stage_name: matchedOffers[0].stage_name,
           time_slot: matchedOffers[0].time_slot,
           times: matchedOffers[0].times
         }];
      }

      const combined = [...matchedGlobalShows, ...matchedLineups, ...finalOffers];
      const seen = new Set();
      const uniqueCombined = combined.filter(item => {
        const key = `${item.eventType}-${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      daysArr.push({
        date: dayDate,
        isCurrentMonth: true,
        hasShow: uniqueCombined.length > 0,
        events: uniqueCombined
      });
    }

    return daysArr;
  }, [calendarCurrentDate, activeAllVenues, selectedVenueIndex, shows, offers, lineups, userProfile]);

  const unifiedPromoterShows = React.useMemo(() => {
    const list: any[] = [];
    const activeVenue = activeAllVenues[selectedVenueIndex] || activeAllVenues[0];

    // 1. Add other venues or specifically matched global shows
    if (shows) {
      shows.forEach(s => {
        const matchedVenue = activeAllVenues.find(v => {
          const sName = (s.name || '').toLowerCase();
          const sFest = (s.festival_name || '').toLowerCase();
          const vName = v.name.toLowerCase();
          return sName.includes(vName) || vName.includes(sName) || sFest.includes(vName) || vName.includes(sFest);
        });

        if (matchedVenue) {
          list.push({
            id: s.id,
            name: s.festival_name || s.name || 'Unnamed Show',
            dateString: s.date,
            venueName: matchedVenue.name,
            eventType: 'global_show',
            status: s.status || 'Active',
            guarantee: s.guarantee_amount || 0,
            original: s,
            times: {
              load_in: s.load_in_time || matchedVenue.load_in_time,
              doors: s.doors_time || matchedVenue.doors_time,
              set_time: s.set_time || matchedVenue.set_time,
              curfew: s.curfew_time || matchedVenue.curfew_time
            }
          });
        }
      });
    }

    // 2. Add local promoter lineups (Drafts)
    if (lineups) {
      lineups.forEach(l => {
        const matchedVenue = activeAllVenues.find(v => {
          const lVenue = (l.venue_name || '').toLowerCase();
          const vName = v.name.toLowerCase();
          return lVenue.includes(vName) || vName.includes(lVenue);
        }) || activeVenue;

        list.push({
          id: l.id,
          name: l.name || 'Custom Lineup',
          dateString: l.date,
          venueName: matchedVenue?.name || l.venue_name || 'Active Venue',
          eventType: 'local_lineup',
          status: 'Built / Local Draft',
          guarantee: 0,
          original: l,
          times: {
            load_in: matchedVenue?.load_in_time || '16:00',
            doors: matchedVenue?.doors_time || '19:00',
            set_time: matchedVenue?.set_time || '21:00',
            curfew: matchedVenue?.curfew_time || '23:30'
          }
        });
      });
    }

    // 3. Add promoter offers (Pending or Booked Contracts)
    if (offers) {
      const myOffers = offers.filter(o => o.promoter_email === userProfile?.email || o.promoter_id === userProfile?.id);
      myOffers.forEach(o => {
        const matchedVenue = activeAllVenues.find(v => {
          const oVenue = (o.venue_name || '').toLowerCase();
          const vName = v.name.toLowerCase();
          return oVenue.includes(vName) || vName.includes(oVenue);
        }) || activeVenue;

        list.push({
          id: o.id,
          name: o.event_name || `${o.band_name} at ${o.venue_name}`,
          dateString: o.date,
          venueName: o.venue_name || matchedVenue?.name || 'Active Venue',
          eventType: 'offer',
          status: o.status,
          guarantee: o.guarantee_amount || 0,
          original: o,
          times: {
            load_in: o.load_in_time || matchedVenue?.load_in_time || '16:00',
            doors: o.doors_time || matchedVenue?.doors_time || '19:00',
            set_time: o.set_time || matchedVenue?.set_time || '21:00',
            curfew: o.curfew_time || matchedVenue?.curfew_time || '23:30'
          }
        });
      });
    }

    // Deduplicate on name + date string or unique combined keys
    const seen = new Set();
    const finalFiltered: any[] = [];
    list.forEach(item => {
      const key = `${item.dateString}-${item?.name}-${item.eventType}-${item.id}`;
      if (item.eventType === 'offer' && item.original?.event_id) {
        const otherKey = `local_lineup-${item.original.event_id}`;
        if (seen.has(otherKey)) return;
      }
      if (!seen.has(key)) {
        seen.add(key);
        finalFiltered.push(item);
      }
    });

    // Sort by Date string
    finalFiltered.sort((a, b) => {
      return a.dateString.localeCompare(b.dateString);
    });

    return finalFiltered;
  }, [shows, lineups, offers, activeAllVenues, userProfile, selectedVenueIndex]);

  const handleOpenShowInWorkspace = (ev: any) => {
    if (ev.dateString) {
      const parts = ev.dateString.split('-');
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      if (y && m && d) {
        setCalendarSelectedDate(new Date(y, m - 1, d));
      }
    }

    setPlannerEventName(ev.name || 'Unnamed Showcase');
    const showType = ev.original?.show_type || 'standard';
    setPlannerShowType(showType);

    let lineupItems = ev.original?.lineup || ev.original?.stages;
    if (!lineupItems || lineupItems.length === 0) {
      lineupItems = [{
        id: String(Date.now()),
        band_id: ev.original?.band_id || `external_${Date.now()}`,
        band_name: ev.original?.band_name || ev.name,
        day: 1,
        status: ev.status === 'Active' ? 'accepted' : 'pending',
        guarantee_amount: ev.guarantee ? Number(ev.guarantee) : 0,
        set_time: ev.times?.set_time || '21:00',
        load_in_time: ev.times?.load_in || '16:00',
        primary_contact_method: 'email',
        contact_details: '',
        notes: '',
        travel: '',
        rider: ''
      }];
    } else {
      // Normalize existing objects
      lineupItems = lineupItems.map((item: any) => ({
        id: item.id || String(Date.now() + Math.random()),
        band_id: item.band_id || `external_${Date.now()}`,
        band_name: item.band_name || item?.name || 'Unknown Band',
        day: item.day || 1,
        status: item.status || 'pending',
        guarantee_amount: typeof item.guarantee_amount === 'number' ? item.guarantee_amount : (Number(item.guarantee) || 0),
        set_time: item.set_time || item.setTime || '21:00',
        load_in_time: item.load_in_time || item.loadIn || '16:00',
        primary_contact_method: item.primary_contact_method || item.contactMethod || 'email',
        contact_details: item.contact_details || item.contactValue || '',
        notes: item.notes || '',
        travel: item.travel || '',
        rider: item.rider || ''
      }));
    }
    setPlannerLineup(lineupItems);

    setPlannerNotes(ev.original?.notes || ev.original?.additional_notes || '');
    playLocalBeep(650, 'sine', 0.03);
    setActivePortalTab('workspace');
    if (triggerNotification) {
      triggerNotification(`Opened Builder Workspace for "${ev.name}"!`);
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setCalendarTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setCalendarTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!calendarTouchStart || !calendarTouchEnd) return;
    const distance = calendarTouchStart - calendarTouchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe && selectedVenueIndex < activeAllVenues.length - 1) {
      setSelectedVenueIndex(p => p + 1);
      playLocalBeep(650, 'sine', 0.03);
    } else if (isRightSwipe && selectedVenueIndex > 0) {
      setSelectedVenueIndex(p => p - 1);
      playLocalBeep(650, 'sine', 0.03);
    }
    setCalendarTouchStart(null);
    setCalendarTouchEnd(null);
  };

  // New Venue portfolio form states
  const [newVenueName, setNewVenueName] = useState('');
  const [newVenueAddress, setNewVenueAddress] = useState('');
  const [newVenueCity, setNewVenueCity] = useState('');
  const [newVenueState, setNewVenueState] = useState('');
  const [newVenueCountry, setNewVenueCountry] = useState('USA');
  const [newVenueCapacity, setNewVenueCapacity] = useState('');
  const [newVenueLoadIn, setNewVenueLoadIn] = useState('16:00');
  const [newVenueDoors, setNewVenueDoors] = useState('19:00');
  const [newVenueSetTime, setNewVenueSetTime] = useState('21:00');
  const [newVenueCurfew, setNewVenueCurfew] = useState('23:30');
  const [newVenueAttendance, setNewVenueAttendance] = useState<'+100' | '100-300' | '300-700' | '700+'>('300-700');
  const [newVenueAgeRestriction, setNewVenueAgeRestriction] = useState('All Ages');
  const [newVenueNotes, setNewVenueNotes] = useState('');
  const [newVenueStages, setNewVenueStages] = useState<string[]>([]);
  const [newStageNameSecondary, setNewStageNameSecondary] = useState('');

  useEffect(() => {
    setProfileFormName(userProfile?.name || '');
    setProfileFormCompany(
      userProfile?.promoter_metadata?.brand_name || 
      userProfile?.promoter_metadata?.agency_name ||
      userProfile?.promoter_agency ||
      userProfile?.promoter_brand ||
      userProfile?.promoter_name ||
      'Nexus Live Productions'
    );
    setProfileFormRegion(userProfile?.target_region || userProfile?.promoter_metadata?.region || userProfile?.promoter_region || 'Texas');
    setProfileFormAvatar(userProfile?.promoter_logo || userProfile?.promoter_metadata?.logo_url || userProfile?.avatar_url || '');
    setProfileFormRole(userProfile?.promoter_metadata?.title || userProfile?.role || 'Lead Talent Buyer & Production Director');
    setProfileGenreTags(userProfile?.promoter_metadata?.genres || userProfile?.genre_tags || []);
    setProfileFormBookingEmail(userProfile?.promoter_metadata?.booking_email || userProfile?.promoter_booking_email || userProfile?.email || '');

    setHomeVenueName(
      userProfile?.promoter_metadata?.home_venue?.name || 
      userProfile?.promoter_metadata?.brand_name ||
      userProfile?.promoter_metadata?.agency_name ||
      userProfile?.promoter_agency ||
      userProfile?.creative_metadata?.home_venue?.name || 
      ''
    );
    setHomeVenueAddress(
      userProfile?.promoter_metadata?.home_venue?.address || 
      userProfile?.promoter_metadata?.street_address ||
      userProfile?.creative_metadata?.home_venue?.address || 
      ''
    );
    setHomeVenueCity(
      userProfile?.promoter_metadata?.home_venue?.city || 
      userProfile?.promoter_metadata?.city ||
      userProfile?.creative_metadata?.home_venue?.city || 
      ''
    );
    setHomeVenueState(
      userProfile?.promoter_metadata?.home_venue?.state_province || 
      userProfile?.promoter_metadata?.state ||
      userProfile?.creative_metadata?.home_venue?.state_province || 
      ''
    );
    setHomeVenueCountry(
      userProfile?.promoter_metadata?.home_venue?.country || 
      userProfile?.promoter_metadata?.country ||
      userProfile?.creative_metadata?.home_venue?.country || 
      'USA'
    );
    setHomeVenueCapacity(
      userProfile?.promoter_metadata?.home_venue?.capacity?.toString() || 
      userProfile?.promoter_metadata?.capacity?.toString() ||
      userProfile?.creative_metadata?.home_venue?.capacity?.toString() || 
      ''
    );
    setHomeVenueLoadIn(userProfile?.promoter_metadata?.home_venue?.load_in_time || userProfile?.creative_metadata?.home_venue?.load_in_time || '16:00');
    setHomeVenueDoors(userProfile?.promoter_metadata?.home_venue?.doors_time || userProfile?.creative_metadata?.home_venue?.doors_time || '19:00');
    setHomeVenueSetTime(userProfile?.promoter_metadata?.home_venue?.set_time || userProfile?.creative_metadata?.home_venue?.set_time || '21:00');
    setHomeVenueCurfew(userProfile?.promoter_metadata?.home_venue?.curfew_time || userProfile?.creative_metadata?.home_venue?.curfew_time || '23:30');
    setHomeVenueAttendance(userProfile?.promoter_metadata?.home_venue?.expected_attendance || userProfile?.creative_metadata?.home_venue?.expected_attendance || '300-700');
    setHomeVenueAgeRestriction(userProfile?.promoter_metadata?.home_venue?.age_restriction || userProfile?.creative_metadata?.home_venue?.age_restriction || 'All Ages');
    setHomeVenueNotes(userProfile?.promoter_metadata?.home_venue?.additional_notes || userProfile?.creative_metadata?.home_venue?.additional_notes || '');
    setHomeVenueStages(userProfile?.promoter_metadata?.home_venue?.stages || userProfile?.creative_metadata?.home_venue?.stages || []);
    setSavedVenuesList(userProfile?.promoter_metadata?.saved_venues || userProfile?.creative_metadata?.saved_venues || []);

    setVenueWifiNetwork(userProfile?.promoter_metadata?.home_venue?.wifi_network || '');
    setVenueWifiPassword(userProfile?.promoter_metadata?.home_venue?.wifi_password || '');
    setVenueParking(userProfile?.promoter_metadata?.home_venue?.parking_arrangements || '');
    setVenueDinner(userProfile?.promoter_metadata?.home_venue?.dinner_arrangements || 'Buyout for each band member');
    setVenueMerchCall(userProfile?.promoter_metadata?.home_venue?.merch_call_time || '17:00');
    setVenueSoundcheck(userProfile?.promoter_metadata?.home_venue?.soundcheck_time || '18:00');
    setVenueGearProvided(userProfile?.promoter_metadata?.home_venue?.gear_provided || userProfile?.promoter_metadata?.tech_rider || '');
    setVenueAudioRequirements(userProfile?.promoter_metadata?.home_venue?.audio_requirements || userProfile?.promoter_metadata?.tech_rider || '');
    setVenueBacklineRequirements(userProfile?.promoter_metadata?.home_venue?.backline_requirements || userProfile?.promoter_metadata?.security_map || '');
  }, [userProfile?.id]);

  // Local Utility to Compress Images to avoid payload size constraints
  const compressImage = (dataUrl: string, maxDimension: number, callback: (url: string) => void) => {
    const img = document.createElement('img');
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        if (width <= 0 || height <= 0) {
          callback(dataUrl);
          return;
        }
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          try {
            const compressed = canvas.toDataURL('image/webp', 0.92);
            callback(compressed);
          } catch (e) {
            callback(dataUrl);
          }
        } else {
          callback(dataUrl);
        }
      } catch (e) {
        callback(dataUrl);
      }
    };
    img.onerror = () => callback(dataUrl);
    img.src = dataUrl;
  };

  const handleAvatarLocalUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        triggerNotification?.('⚠️ Please select an image under 20MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const rawUrl = reader.result as string;
        if (rawUrl) {
          compressImage(rawUrl, 256, (compressedUrl) => {
            setProfileFormAvatar(compressedUrl);
            triggerNotification?.('📸 Chosen profile photo optimized successfully.');
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleGenreTag = (id: string) => {
    setProfileGenreTags(prev => {
      if (prev.includes(id)) {
        return prev.filter(t => t !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedProfile = {
        ...userProfile,
        name: profileFormCompany.trim() || userProfile.name,
        promoter_agency: profileFormCompany.trim(),
        promoter_brand: profileFormCompany.trim(),
        promoter_name: profileFormCompany.trim(),
        promoter_logo: profileFormAvatar.trim() || userProfile?.promoter_logo,
        promoter_region: profileFormRegion.trim(),
        role: profileFormRole.trim(),
        target_region: profileFormRegion.trim(),
        avatar_url: userProfile?.avatar_url || profileFormAvatar.trim() || undefined,
        genre_tags: profileGenreTags,
        promoter_metadata: {
          ...(userProfile?.promoter_metadata || {}),
          brand_name: profileFormCompany.trim(),
          agency_name: profileFormCompany.trim(),
          company_name: profileFormCompany.trim(),
          promoter_name: profileFormCompany.trim(),
          title: profileFormRole.trim(),
          region: profileFormRegion.trim(),
          target_region: profileFormRegion.trim(),
          logo_url: profileFormAvatar.trim() || userProfile?.promoter_metadata?.logo_url,
          booking_email: profileFormBookingEmail.trim(),
          home_venue: {
            name: homeVenueName.trim(),
            address: homeVenueAddress.trim(),
            city: homeVenueCity.trim(),
            state_province: homeVenueState.trim(),
            country: homeVenueCountry.trim(),
            capacity: homeVenueCapacity.trim() || undefined,
            load_in_time: homeVenueLoadIn,
            doors_time: homeVenueDoors,
            set_time: homeVenueSetTime,
            curfew_time: homeVenueCurfew,
            expected_attendance: homeVenueAttendance,
            age_restriction: homeVenueAgeRestriction,
            additional_notes: homeVenueNotes.trim(),
            stages: homeVenueStages,
            // Extended Wifi network, password, parking, dinner options
            wifi_network: venueWifiNetwork.trim(),
            wifi_password: venueWifiPassword.trim(),
            parking_arrangements: venueParking.trim(),
            dinner_arrangements: venueDinner,
            // Advanced scheduling default offsets
            merch_call_time: venueMerchCall,
            soundcheck_time: venueSoundcheck,
            // Technical specs
            gear_provided: venueGearProvided.trim(),
            audio_requirements: venueAudioRequirements.trim(),
            backline_requirements: venueBacklineRequirements.trim()
          },
          saved_venues: savedVenuesList
        },
        creative_metadata: {
          ...(userProfile?.creative_metadata || {}),
          booking_email: profileFormBookingEmail.trim(),
          home_venue: {
            name: homeVenueName.trim(),
            address: homeVenueAddress.trim(),
            city: homeVenueCity.trim(),
            state_province: homeVenueState.trim(),
            country: homeVenueCountry.trim(),
            capacity: homeVenueCapacity.trim() || undefined,
            load_in_time: homeVenueLoadIn,
            doors_time: homeVenueDoors,
            set_time: homeVenueSetTime,
            curfew_time: homeVenueCurfew,
            expected_attendance: homeVenueAttendance,
            age_restriction: homeVenueAgeRestriction,
            additional_notes: homeVenueNotes.trim(),
            stages: homeVenueStages,
            // Extended Wifi network, password, parking, dinner options
            wifi_network: venueWifiNetwork.trim(),
            wifi_password: venueWifiPassword.trim(),
            parking_arrangements: venueParking.trim(),
            dinner_arrangements: venueDinner,
            // Advanced scheduling default offsets
            merch_call_time: venueMerchCall,
            soundcheck_time: venueSoundcheck,
            // Technical specs
            gear_provided: venueGearProvided.trim(),
            audio_requirements: venueAudioRequirements.trim(),
            backline_requirements: venueBacklineRequirements.trim()
          },
          saved_venues: savedVenuesList
        }
      };

      // Also let's push to Supabase table 'profiles' if getSupabase is available
      const supabase = getSupabase();
      if (supabase && userProfile?.id) {
        const promoterId = userProfile?.promoter_id || userProfile?.registered_promoter_id || userProfile?.id;
        const profilePayload: any = {
          id: userProfile?.id,
          role: profileFormRole.trim(),
          target_region: profileFormRegion.trim(),
          genre_tags: profileGenreTags,
          promoter_metadata: {
            ...(userProfile?.promoter_metadata || {}),
            brand_name: profileFormCompany.trim(),
            agency_name: profileFormCompany.trim(),
            company_name: profileFormCompany.trim(),
            promoter_name: profileFormCompany.trim(),
            title: profileFormRole.trim(),
            region: profileFormRegion.trim(),
            target_region: profileFormRegion.trim(),
            booking_email: profileFormBookingEmail.trim(),
            logo_url: profileFormAvatar.trim() || userProfile?.promoter_metadata?.logo_url || null,
            home_venue: {
              name: homeVenueName.trim(),
              address: homeVenueAddress.trim(),
              city: homeVenueCity.trim(),
              state_province: homeVenueState.trim(),
              country: homeVenueCountry.trim(),
              capacity: homeVenueCapacity.trim() || undefined,
              load_in_time: homeVenueLoadIn,
              doors_time: homeVenueDoors,
              set_time: homeVenueSetTime,
              curfew_time: homeVenueCurfew,
              expected_attendance: homeVenueAttendance,
              age_restriction: homeVenueAgeRestriction,
              additional_notes: homeVenueNotes.trim(),
              stages: homeVenueStages,
              wifi_network: venueWifiNetwork.trim(),
              wifi_password: venueWifiPassword.trim(),
              parking_arrangements: venueParking.trim(),
              dinner_arrangements: venueDinner,
              merch_call_time: venueMerchCall,
              soundcheck_time: venueSoundcheck,
              gear_provided: venueGearProvided.trim(),
              audio_requirements: venueAudioRequirements.trim(),
              backline_requirements: venueBacklineRequirements.trim()
            },
            saved_venues: savedVenuesList
          },
          creative_metadata: {
            ...(userProfile?.creative_metadata || {}),
            booking_email: profileFormBookingEmail.trim(),
            home_venue: {
              name: homeVenueName.trim(),
              address: homeVenueAddress.trim(),
              city: homeVenueCity.trim(),
              state_province: homeVenueState.trim(),
              country: homeVenueCountry.trim(),
              capacity: homeVenueCapacity.trim() || undefined,
              load_in_time: homeVenueLoadIn,
              doors_time: homeVenueDoors,
              set_time: homeVenueSetTime,
              curfew_time: homeVenueCurfew,
              expected_attendance: homeVenueAttendance,
              age_restriction: homeVenueAgeRestriction,
              additional_notes: homeVenueNotes.trim(),
              stages: homeVenueStages,
              wifi_network: venueWifiNetwork.trim(),
              wifi_password: venueWifiPassword.trim(),
              parking_arrangements: venueParking.trim(),
              dinner_arrangements: venueDinner,
              merch_call_time: venueMerchCall,
              soundcheck_time: venueSoundcheck,
              gear_provided: venueGearProvided.trim(),
              audio_requirements: venueAudioRequirements.trim(),
              backline_requirements: venueBacklineRequirements.trim()
            },
            saved_venues: savedVenuesList
          }
        };
        if (promoterId) {
          profilePayload.promoter_id = promoterId;
        }

        const { error } = await executeWithSchemaResilience(
          async (payload) => supabase.from('profiles').upsert(payload, { onConflict: 'id' }),
          profilePayload
        );

        if (error) {
          console.warn('[Supabase upsert warning]:', error);
        }

        if (promoterId) {
          try {
            await executeWithSchemaResilience(
              async (payload) => supabase.from('promoters').upsert(payload, { onConflict: 'id' }),
              {
                id: promoterId,
                user_id: userProfile?.id,
                creator_id: userProfile?.id,
                owner_id: userProfile?.id,
                corporate_name: profileFormCompany.trim() || 'Nexus Live Productions',
                brand_name: profileFormCompany.trim(),
                agency_name: profileFormCompany.trim(),
                promoter_name: profileFormCompany.trim(),
                name: profileFormCompany.trim(),
                promoter_logo: profileFormAvatar.trim() || userProfile?.promoter_logo || null,
                logo_url: profileFormAvatar.trim() || userProfile?.promoter_logo || null,
                region: profileFormRegion.trim(),
                target_region: profileFormRegion.trim(),
                booking_email: profileFormBookingEmail.trim(),
                title: profileFormRole.trim(),
                home_venue: {
                  name: homeVenueName.trim(),
                  address: homeVenueAddress.trim(),
                  city: homeVenueCity.trim(),
                  state_province: homeVenueState.trim(),
                  country: homeVenueCountry.trim(),
                  capacity: homeVenueCapacity.trim() || undefined,
                  gear_provided: venueGearProvided.trim(),
                  audio_requirements: venueAudioRequirements.trim(),
                  backline_requirements: venueBacklineRequirements.trim()
                }
              }
            );
          } catch (pErr) {
            console.warn('[Promoter table secondary upsert skipped/failed]:', pErr);
          }
        }
      }

      setUserProfile(updatedProfile);
      addLog?.(`Updated Promoter Profile and associated Venue lists.`);
      triggerNotification?.("⚡ Promoter console settings written successfully.");
      setIsEditingProfile(false);
    } catch (err: any) {
      console.error(err);
      triggerNotification?.(`⚠️ Error updating profile: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVenueToPortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVenueName.trim() || !newVenueAddress.trim() || !newVenueCity.trim()) {
      triggerNotification?.("⚠️ Venue Name, Address, and City are required.");
      return;
    }

    const currentVenuesCount = savedVenuesList.length + (userProfile?.promoter_metadata?.home_venue?.name ? 1 : 0);
    const subTier = userProfile.sub_tier || 'free_for_life';
    if (subTier === 'free_for_life' && currentVenuesCount >= 2) {
      triggerNotification?.('🛑 Lifetime Free tier allows up to 2 managed properties. Upgrade to Pro required.');
      return;
    }
    if (subTier === 'power_user_pro' && currentVenuesCount >= 6) {
      triggerNotification?.('🛑 Power User Pro tier allows up to 6 managed properties. Enterprise upgrade required.');
      return;
    }

    const uniqueId = 'venue-' + Math.random().toString(36).substr(2, 9);
    const item: any = {
      id: uniqueId,
      name: newVenueName.trim(),
      address: newVenueAddress.trim(),
      city: newVenueCity.trim(),
      state_province: newVenueState.trim() || undefined,
      country: newVenueCountry.trim() || 'USA',
      capacity: newVenueCapacity.trim() || undefined,
      load_in_time: newVenueLoadIn,
      doors_time: newVenueDoors,
      set_time: newVenueSetTime,
      curfew_time: newVenueCurfew,
      expected_attendance: newVenueAttendance,
      age_restriction: newVenueAgeRestriction,
      additional_notes: newVenueNotes.trim() || undefined,
      stages: newVenueStages
    };

    setSavedVenuesList(prev => [...prev, item]);
    
    // Reset inputs
    setNewVenueName('');
    setNewVenueAddress('');
    setNewVenueCity('');
    setNewVenueState('');
    setNewVenueCountry('USA');
    setNewVenueCapacity('');
    setNewVenueLoadIn('16:00');
    setNewVenueDoors('19:00');
    setNewVenueSetTime('21:00');
    setNewVenueCurfew('23:30');
    setNewVenueAttendance('300-700');
    setNewVenueAgeRestriction('All Ages');
    setNewVenueNotes('');
    setNewVenueStages([]);
    setNewStageNameSecondary('');

    triggerNotification?.(`🏢 Appended "${item?.name}" to portfolio list! Click Save Changes to commit.`);
  };

  const handleRemoveVenueFromPortfolio = (id: string, name: string) => {
    setSavedVenuesList(prev => prev.filter(v => v.id !== id));
    triggerNotification?.(`❌ Removed "${name}" from list. Click Save Changes to commit.`);
  };

  // Default initial seed beacons in case Supabase has no records or fails
  const initialSeedBeacons: RoutingBeacon[] = [
    {
      id: 'seed-1',
      band_name: 'Sanguisugabogg',
      target_region: 'Texas',
      start_date: '2026-07-10',
      end_date: '2026-07-15',
      booking_email: 'booking@sanguisugabogg.com',
      created_at: '2026-06-01T20:00:00Z',
      genre_tags: ['brutal_death_metal', 'slam']
    },
    {
      id: 'seed-2',
      band_name: 'Dying Fetus',
      target_region: 'California',
      start_date: '2026-08-01',
      end_date: '2026-08-12',
      booking_email: 'dyingfetus@merchmanagement.org',
      created_at: '2026-06-01T21:00:00Z',
      genre_tags: ['brutal_death_metal', 'grindcore']
    },
    {
      id: 'seed-3',
      band_name: 'Cannibal Corpse',
      target_region: 'East Coast',
      start_date: '2026-09-15',
      end_date: '2026-09-28',
      booking_email: 'bookings@cannibalcorpse.net',
      created_at: '2026-06-01T22:00:00Z',
      genre_tags: ['brutal_death_metal']
    },
    {
      id: 'seed-4',
      band_name: 'Void Walkers',
      target_region: 'Texas',
      start_date: '2026-06-15',
      end_date: '2026-06-25',
      booking_email: 'voidwalkers@grindsickness.com',
      created_at: '2026-06-01T23:00:00Z',
      genre_tags: ['grindcore', 'hardcore']
    }
  ];

  const fetchBeacons = async () => {
    setLoading(true);
    try {
      let cloudBeacons: any[] = [];
      const supabase = getSupabase();
      if (supabase) {
        let query = supabase.from('routing_beacons_v1').select('*');
        if (userProfile?.genre_tags && userProfile?.genre_tags.length > 0) {
          query = query.filter('genre_tags', 'ov', userProfile?.genre_tags);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          cloudBeacons = data;
        }
      }

      // Merge Cloud results, LocalStorage customized values, and static Seed fallback list
      const localBeaconsStr = localStorage.getItem('nexus_core_routing_beacons_v1') || '[]';
      const localBeacons = JSON.parse(localBeaconsStr);

      // Filter out duplicate ids
      const combined = [...localBeacons, ...cloudBeacons];
      const combinedIds = new Set(combined.map(b => b.id));
      const seedsToAdd = initialSeedBeacons.filter(seed => !combinedIds.has(seed.id));

      setBeacons([...combined, ...seedsToAdd]);
      addLog?.("Promoter Portal: Successfully synched active routing beacons.");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBeacons();
  }, []);

  const handleUpdateRegion = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingRegion(true);
    setUserProfile(prev => ({ ...prev, target_region: editingRegion }));
    triggerNotification?.(`Promoter focus region updated to: ${editingRegion}`);
    setIsUpdatingRegion(false);
  };

  const promoterRegion = userProfile?.target_region || 'Texas';

  // Filter beacons where region matches target_region and subculture overlaps
  const matchedBeacons = beacons.filter(beacon => {
    if (dismissedBeacons.has(beacon.id)) return false;

    // 1. Mono segmented frequency filter selection
    if (selectedFrequency !== 'ALL') {
      const beaconTags = beacon.genre_tags || [];
      const belongs = matchesFrequency(beaconTags, selectedFrequency);
      if (!belongs) return false;

      // Secondary Micro-Genre specificity if a specific sub-genre filter is active
      if (selectedSubGenre !== 'ALL') {
        const targetSubClean = selectedSubGenre.toLowerCase().replace(/[\s_/\\-]/g, '');
        const lowerTagsClean = beaconTags.map(t => t.toLowerCase().replace(/[\s_/\\-]/g, ''));
        
        const hasTagMatch = (lowerTagsClean || []).some(t => {
          if (targetSubClean === 'skramzscreamo') {
            return t.includes('skramz') || t.includes('screamo') || t.includes('scremo');
          }
          if (targetSubClean === 'oldschooldeathmetal') {
            return t.includes('oldschooldeathmetal') || t.includes('osdm');
          }
          if (targetSubClean === 'drumandbass') {
            return t.includes('dnb') || t.includes('drumandbass') || t.includes('drum&bass');
          }
          return t.includes(targetSubClean) || targetSubClean.includes(t);
        });

        const nameMatch = beacon.band_name.toLowerCase().replace(/[\s_/\\-]/g, '').includes(targetSubClean);

        if (!hasTagMatch && !nameMatch) return false;
      }
    }

    // 2. Local buffer subculture overlap check:
    const promoterTags = userProfile?.genre_tags || [];
    const beaconTags = beacon.genre_tags || [];
    const hasOverlap = promoterTags.length === 0 || beaconTags.length === 0 || (beaconTags || []).some(t => promoterTags.includes(t));
    if (!hasOverlap) return false;

    // 3. Content aware location matchmaking with partial mapping to handle abbreviations and regional cities
    if (!promoterRegion) return true;
    const cleanInput = promoterRegion.trim().toLowerCase();
    const cleanTarget = beacon.target_region.toLowerCase();
    
    if (cleanTarget.includes(cleanInput) || cleanInput.includes(cleanTarget)) {
      return true;
    }
    
    // Partial state-to-hub mapping associations
    const stateMappings: Record<string, string[]> = {
      'tx': ['texas', 'tx', 'dallas', 'austin', 'houston', 'san antonio', 'el paso'],
      'texas': ['tx', 'texas', 'dallas', 'austin', 'houston', 'san antonio'],
      'ca': ['california', 'ca', 'los angeles', 'la', 'san francisco', 'sf', 'san diego'],
      'california': ['ca', 'california', 'los angeles', 'la', 'san francisco'],
      'ny': ['new york', 'ny', 'nyc', 'brooklyn', 'manhattan'],
      'new york': ['ny', 'new york', 'nyc', 'brooklyn', 'manhattan'],
      'fl': ['florida', 'fl', 'miami', 'orlando', 'tampa'],
      'florida': ['fl', 'florida', 'miami', 'orlando', 'tampa'],
      'il': ['illinois', 'il', 'chicago'],
      'illinois': ['il', 'illinois', 'chicago'],
      'pa': ['pennsylvania', 'pa', 'philadelphia', 'philly', 'pittsburgh'],
      'pennsylvania': ['pa', 'pennsylvania', 'philadelphia', 'pittsburgh'],
      'oh': ['ohio', 'oh', 'cleveland', 'columbus', 'cincinnati'],
      'ohio': ['oh', 'ohio', 'cleveland', 'columbus', 'cincinnati'],
      'ga': ['georgia', 'ga', 'atlanta', 'atl'],
      'georgia': ['ga', 'georgia', 'atlanta'],
      'nc': ['north carolina', 'nc', 'charlotte', 'raleigh'],
      'north carolina': ['nc', 'north carolina', 'charlotte', 'raleigh'],
      'mi': ['michigan', 'mi', 'detroit'],
      'michigan': ['mi', 'michigan', 'detroit'],
      'wa': ['washington', 'wa', 'seattle'],
      'washington': ['wa', 'washington', 'seattle'],
      'co': ['colorado', 'co', 'denver'],
      'colorado': ['co', 'colorado', 'denver'],
      'or': ['oregon', 'or', 'portland'],
      'oregon': ['or', 'oregon', 'portland'],
      'md': ['maryland', 'md', 'baltimore'],
      'maryland': ['md', 'maryland', 'baltimore'],
      'va': ['virginia', 'va', 'richmond']
    };

    const inputWords = cleanInput.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').split(/\s+/).filter(Boolean);
    const targetWords = cleanTarget.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ' ').split(/\s+/).filter(Boolean);

    for (const iw of inputWords) {
      for (const tw of targetWords) {
        if (iw === tw) return true;
        if (iw.length > 2 && (tw.includes(iw) || iw.includes(tw))) return true;
        
        const mappedInputs = stateMappings[iw] || [iw];
        const mappedTargets = stateMappings[tw] || [tw];
        for (const mi of mappedInputs) {
          for (const mt of mappedTargets) {
            if (mi === mt) return true;
          }
        }
      }
    }

    return false;
  });

  const allAvailableFormBands = [
    ...bands.map(b => ({ id: b.id, name: b.name, genre: b.genre || 'Extreme Metal', isSeed: false, musicLink: b.music_link })),
    { id: 'void_walkers', name: 'Void Walkers', genre: 'Death Metal (Seed)', isSeed: true, musicLink: 'https://open.spotify.com/artist/dummy' },
    { id: 'dying_fetus', name: 'Dying Fetus', genre: 'Brutal Death Metal (Seed)', isSeed: true, musicLink: 'https://open.spotify.com/artist/dummy2' }
  ];

  const activeBeaconBandNames = new Set(matchedBeacons.map(mb => mb.band_name.trim().toLowerCase()));

  const filteredFormBands = allAvailableFormBands.filter(item => {
    if (bandSearchQuery.trim()) {
      const q = bandSearchQuery.toLowerCase();
      const matchName = item?.name.toLowerCase().includes(q);
      const matchGenre = item.genre.toLowerCase().includes(q);
      if (!matchName && !matchGenre) return false;
    }

    if (filterByActiveBeacons) {
      return activeBeaconBandNames.has(item?.name.toLowerCase());
    }

    return true;
  });

  const handleDismissBeacon = (beaconId: string) => {
    setDismissedBeacons(prev => {
      const newSet = new Set(prev);
      newSet.add(beaconId);
      return newSet;
    });
    triggerNotification?.("Routing signal dismissed from active dock.");
  };

  const handleInitiatePitch = (beacon: RoutingBeacon) => {
    const subject = encodeURIComponent(`[ BOOKING PROPOSAL ] - Tour Routing Ingress - ${beacon.target_region}`);
    const body = encodeURIComponent(
      `Hello ${beacon.band_name} Management,\n\n` +
      `We noticed your availability routing beacon dropped in target region '${beacon.target_region}' ` +
      `from ${beacon.start_date} to ${beacon.end_date}.\n\n` +
      `We would love to pitch a direct local club, theater, or festival date option. ` +
      `Please let us know your standard terms and minimum guarantees.\n\n` +
      `Best regards,\n` +
      `${userProfile?.name}\n` +
      `Regional Promoter Agent`
    );

    window.location.href = `mailto:${beacon.booking_email}?subject=${subject}&body=${body}`;
    addLog?.(`Promoter Portal: Initiated booking pitch for band ${beacon.band_name} (${beacon.booking_email})`);
    triggerNotification?.(`Booking Client initiated for ${beacon.band_name}!`);
  };

  // Launch In-App Proposal setup pre-populated from matched signal beacon
  const handleFormulateOfferFromBeacon = (beacon: RoutingBeacon) => {
    const matchedBand = bands.find(b => b.name.toLowerCase() === beacon.band_name.toLowerCase());
    setFormBandId(matchedBand ? matchedBand.id : bands[0]?.id || '');
    setFormVenue('Custom Club Room');
    setFormCity(beacon.target_region);
    setFormState(beacon.target_region === 'Texas' ? 'TX' : beacon.target_region === 'California' ? 'CA' : '');
    setFormDate(beacon.start_date);
    setFormGuarantee('1500');
    setFormNotes(`In-App booking proposal submitted in reference to routing signal beacon (Dates: ${beacon.start_date} -> ${beacon.end_date}). Flat guarantee proposal.`);
    
    setActivePortalTab('offers');
    triggerNotification?.(`Pre-populated offer docket for ${beacon.band_name}!`);
  };

  const handleCreateLineup = (e: React.FormEvent) => {
    e.preventDefault();

    const activeTier = userProfile?.sub_tier || 'local_booking_agent';
    const rollingActiveShowLimit = 
      activeTier === 'enterprise_network' || activeTier === 'enterprise_circuit' ? PROMOTER_BILLING_MATRIX.tiers.enterprise_network.rollingActiveShowLimit :
      activeTier === 'regional_talent_buyer' ? PROMOTER_BILLING_MATRIX.tiers.regional_talent_buyer.rollingActiveShowLimit :
      activeTier === 'local_booking_agent' ? PROMOTER_BILLING_MATRIX.tiers.local_booking_agent.rollingActiveShowLimit :
      1; // single_festival_pass or fallback
    
    const nowStr = new Date().toISOString().split('T')[0];
    const activeLineupsCount = lineups.filter(l => (l.date || '') >= nowStr).length;

    if (activeLineupsCount >= rollingActiveShowLimit) {
      triggerNotification?.(`LIMIT REACHED: You can only have ${rollingActiveShowLimit} active concurrent events on your current tier.`);
      return;
    }

    if (!newLineupName || !newLineupDate || !newLineupVenue) {
      triggerNotification?.("Error: Name, Date, and Venue are required to create a lineup.");
      return;
    }

    const newEvent: EventLineup = {
      id: 'event-' + Math.random().toString(36).substr(2, 9),
      name: newLineupName,
      date: newLineupDate,
      venue_name: newLineupVenue,
      stage_name: newLineupStage,
      time_slot: newLineupTimeSlot,
    };

    const updatedLineups = [...lineups, newEvent];
    setLineups(updatedLineups);
    
    // Update user profile metadata
    const currentMeta = userProfile?.creative_metadata || {};
    setUserProfile(prev => ({
      ...prev,
      creative_metadata: {
        ...currentMeta,
        events: updatedLineups
      }
    }));

    setNewLineupName('');
    setNewLineupDate('');
    setNewLineupVenue('');
    setNewLineupStage('Main Stage');
    setNewLineupTimeSlot('all-day');
    setIsCreatingLineup(false);
    triggerNotification?.(`Lineup ${newEvent.name} created successfully!`);
    addLog?.(`Created Lineup Workspace: ${newEvent.name}`);
  };

  const handleAddTicketTier = (lineupId: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newTierName || !newTierPrice) {
      triggerNotification?.("Error: Tier Name and Price are required.");
      return;
    }
    const priceNum = parseFloat(newTierPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      triggerNotification?.("Error: Enter a valid ticket price.");
      return;
    }
    const capacityNum = newTierCapacity ? parseInt(newTierCapacity) : undefined;
    const soldNum = newTierSold ? parseInt(newTierSold) : 0;
    
    if (capacityNum !== undefined && (isNaN(capacityNum) || capacityNum < 0)) {
      triggerNotification?.("Error: Enter a valid capacity.");
      return;
    }
    if (isNaN(soldNum) || soldNum < 0) {
      triggerNotification?.("Error: Enter a valid quantity sold.");
      return;
    }

    const newTier: TicketTier = {
      id: 'tier-' + Math.random().toString(36).substr(2, 9),
      name: newTierName,
      price: priceNum,
      capacity: capacityNum,
      sold: soldNum,
    };

    if (lineupId === 'demo-sandbox') {
      setSandboxTiers(prev => [...prev, newTier]);
      triggerNotification?.(`Ticket tier "${newTier.name}" added to Sandbox Demo!`);
    } else {
      const updatedLineups = lineups.map(l => {
        if (l.id === lineupId) {
          const currentTiers = l.ticket_tiers || [];
          return {
            ...l,
            ticket_tiers: [...currentTiers, newTier]
          };
        }
        return l;
      });

      setLineups(updatedLineups);
      
      const currentMeta = userProfile?.creative_metadata || {};
      setUserProfile(prev => ({
        ...prev,
        creative_metadata: {
          ...currentMeta,
          events: updatedLineups
        }
      }));
      triggerNotification?.(`Ticket tier "${newTier.name}" saved to Event!`);
    }

    // Reset fields
    setNewTierName('');
    setNewTierPrice('');
    setNewTierCapacity('');
    setNewTierSold('');
  };

  const handleUpdateTicketTierSold = (lineupId: string, tierId: string, newSoldCount: number) => {
    if (newSoldCount < 0) return;
    
    if (lineupId === 'demo-sandbox') {
      setSandboxTiers(prev => prev.map(t => {
        if (t.id === tierId) {
          if (t.capacity !== undefined && newSoldCount > t.capacity) {
            triggerNotification?.(`Warning: Limit reached! Capped at capacity (${t.capacity}).`);
            return { ...t, sold: t.capacity };
          }
          return { ...t, sold: newSoldCount };
        }
        return t;
      }));
    } else {
      const updatedLineups = lineups.map(l => {
        if (l.id === lineupId) {
          const updatedTiers = (l.ticket_tiers || []).map(t => {
            if (t.id === tierId) {
              if (t.capacity !== undefined && newSoldCount > t.capacity) {
                triggerNotification?.(`Warning: Limit reached! Capped at capacity (${t.capacity}).`);
                return { ...t, sold: t.capacity };
              }
              return { ...t, sold: newSoldCount };
            }
            return t;
          });
          return { ...l, ticket_tiers: updatedTiers };
        }
        return l;
      });

      setLineups(updatedLineups);

      const currentMeta = userProfile?.creative_metadata || {};
      setUserProfile(prev => ({
        ...prev,
        creative_metadata: {
          ...currentMeta,
          events: updatedLineups
        }
      }));
    }
  };

  const handleDeleteTicketTier = (lineupId: string, tierId: string) => {
    if (lineupId === 'demo-sandbox') {
      setSandboxTiers(prev => prev.filter(t => t.id !== tierId));
      triggerNotification?.("Ticket tier deleted from Sandbox!");
    } else {
      const updatedLineups = lineups.map(l => {
        if (l.id === lineupId) {
          const updatedTiers = (l.ticket_tiers || []).filter(t => t.id !== tierId);
          return { ...l, ticket_tiers: updatedTiers };
        }
        return l;
      });

      setLineups(updatedLineups);

      const currentMeta = userProfile?.creative_metadata || {};
      setUserProfile(prev => ({
        ...prev,
        creative_metadata: {
          ...currentMeta,
          events: updatedLineups
        }
      }));
      triggerNotification?.("Ticket tier deleted.");
    }
  };

  const applyBookingTemplate = (type: 'standard' | 'metal' | 'festival_headline') => {
    playLocalBeep?.(600, 'sine', 0.05);
    if (type === 'standard') {
      setFormGuarantee('1000');
      setFormAgeLimit('All Ages');
      setFormLoadIn('17:00');
      setFormDoorTime('19:00');
      setFormSetTime('21:00');
      setFormCurfewTime('23:00');
      setFormNotes("Standard flat-fee booking proposal. Hospitality rider includes standard towels, water, and greenroom amenities.");
      triggerNotification?.("⚡ 'Club Standard' booking template applied successfully!");
    } else if (type === 'metal') {
      setFormGuarantee('2500');
      setFormAgeLimit('All Ages');
      setFormLoadIn('16:00');
      setFormDoorTime('18:00');
      setFormSetTime('22:00');
      setFormCurfewTime('00:00');
      setFormNotes("Extreme Metal Package: Flat guarantee. Artist requires standard 4-way monitor mix, 100% compliant local venue backline support (2x Marshall 4x12, Ampeg SVT-810), and direct 15% merchandise buyout arrangement.");
      triggerNotification?.("⚡ 'Heavy Metal' slot template applied successfully!");
    } else if (type === 'festival_headline') {
      setFormGuarantee('8000');
      setFormAgeLimit('All Ages');
      setFormLoadIn('14:00');
      setFormDoorTime('16:00');
      setFormSetTime('20:30');
      setFormCurfewTime('23:30');
      setFormNotes("Festival Headline Docket: Premium guarantee. Co-headline billing placement, private dressing suite, 60-slot guest list allocation, production team contact mandatory.");
      triggerNotification?.("⚡ 'Headline Circuit' template applied successfully!");
    }
  };

  const handleSubmitOfferForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isExternalArtist && !formBandId) {
      triggerNotification?.("Error: Select a target Band/Artist to submit proposal.");
      return;
    }
    if (isExternalArtist && !externalArtistName) {
      triggerNotification?.("Error: Enter the name of the external artist.");
      return;
    }
    if (!formVenue || !formAddress || !formCity || !formState || !formCountry || !formDate || !formGuarantee) {
      triggerNotification?.("Error: Populate required Venue, Address, City, State, Country, Date, and Guarantee fields.");
      return;
    }

    const matchedBand = bands.find(b => b.id === formBandId);
    let finalBandId = formBandId;
    let bandName = matchedBand ? matchedBand.name : "Selected Artist";

    if (isExternalArtist) {
      finalBandId = 'external_artist';
      bandName = externalArtistName;
    }

    const selectedLineup = lineups.find(l => l.id === formEventId);

    const newOffer: Offer = {
      id: 'offer-' + Math.random().toString(36).substr(2, 9),
      promoter_id: userProfile?.id || 'promoter-direct',
      promoter_name: userProfile?.name,
      promoter_email: userProfile?.email,
      band_id: finalBandId,
      band_name: bandName,
      venue_name: formVenue,
      venue_address: formAddress || undefined,
      city: formCity,
      state_province: formState || undefined,
      country: formCountry,
      date: formDate,
      guarantee_amount: parseFloat(formGuarantee),
      status: 'pending',
      created_at: new Date().toISOString(),
      notes: formNotes || undefined,
      last_action_by: 'promoter',
      show_type: formShowType,
      deposit_amount: formDeposit ? parseFloat(formDeposit) : undefined,
      deposit_due_date: formDepositDate || undefined,
      currency: formCurrency,
      age_restriction: formAgeLimit,
      load_in_time: formLoadIn || undefined,
      doors_time: formDoorTime || undefined,
      set_time: formSetTime || undefined,
      curfew_time: formCurfewTime || undefined,
      soundcheck_time: formSoundcheck || undefined,
      merch_call_time: formMerchCall || undefined,
      dinner_arrangements: formDinnerArrangements || undefined,
      travel_arrangements: formTravelArrangements || undefined,
      expected_attendance: formExpectedAttendance || undefined,
      radius_clause: formRadiusClause || undefined,
      offer_expiration: formExpiration || undefined,
      details_completed: true,
      event_id: formEventId || undefined,
      event_name: selectedLineup ? selectedLineup.name : undefined,
      stage_name: formStageName || undefined,
      venue_cut_percentage: formVenueCut ? parseFloat(formVenueCut) : undefined,
      merch_cut_percentage: formMerchCut ? parseFloat(formMerchCut) : undefined,
      show_lineup: formShowLineup || undefined,
    };

    onCreateOffer(newOffer);
    
    // Reset fields
    if (isExternalArtist) {
      setExternalArtistLinkPopup(`https://nexus-core.app/invite?offer=${newOffer.id}`);
      triggerNotification?.("External Link generated! Copy and send it to the artist.");
    } else {
      triggerNotification?.(`booking contract dispatched for ${bandName}!`);
    }

    setFormBandId('');
    setIsExternalArtist(false);
    setExternalArtistName('');
    setFormVenue('');
    setFormAddress('');
    setFormCity('');
    setFormState('');
    setFormCountry('USA');
    setFormDate('');
    setFormGuarantee('');
    setFormDeposit('');
    setFormDepositDate('');
    setFormCurrency('USD');
    setFormAgeLimit('All Ages');
    setFormLoadIn('');
    setFormDoorTime('');
    setFormSetTime('');
    setFormCurfewTime('');
    setFormSoundcheck('17:00');
    setFormMerchCall('18:00');
    setFormDinnerArrangements('Buyout ($30/head)');
    setFormTravelArrangements('');
    setFormExpectedAttendance('300-700');
    setFormRadiusClause('');
    setFormExpiration('');
    setFormNotes('');
    setFormShowType('standard');
    setFormStageName('');
    setFormVenueCut('');
    setFormMerchCut('');
    setFormShowLineup('');
  };

  const handleOpenDetailsForm = (offer: Offer) => {
    setSubmittingDetailsId(offer.id);
    setDetailAddress(offer.venue_address || '');
    setDetailLoadIn(offer.load_in_time || '16:00');
    setDetailDoors(offer.doors_time || '19:00');
    setDetailSetTime(offer.set_time || '21:00');
    setDetailCurfew(offer.curfew_time || '23:30');
    setDetailAttendance(offer.expected_attendance || '300-700');
    setDetailAge((offer.age_restriction || 'all') as "all" | "18" | "21");
    setDetailNotes(offer.additional_notes || '');
  };

  const handleSubmitDetailsForm = (e: React.FormEvent, offer: Offer) => {
    e.preventDefault();
    if (!detailAddress) {
      triggerNotification?.("Please specify full venue address coordinates.");
      return;
    }

    const updatedOffer: Offer = {
      ...offer,
      venue_address: detailAddress,
      load_in_time: detailLoadIn,
      doors_time: detailDoors,
      set_time: detailSetTime,
      curfew_time: detailCurfew,
      expected_attendance: detailAttendance,
      age_restriction: detailAge,
      additional_notes: detailNotes,
      details_completed: true
    };

    onUpdateOffer(updatedOffer);
    setSubmittingDetailsId(null);
    triggerNotification?.("Show details applied and synced with the touring schedule!");
  };

  const handleAcceptBandCounter = (offer: Offer) => {
    const updated: Offer = {
      ...offer,
      status: 'accepted',
      last_action_by: 'promoter'
    };
    onUpdateOffer(updated);
    triggerNotification?.(`Accepted band's flat fee of $${offer.guarantee_amount}! Show Booked!`);
  };

  const handleOpenCounterForm = (offer: Offer) => {
    setRenegotiatingId(offer.id);
    setCounterProposalAmount(offer.guarantee_amount.toString());
    setCounterProposalNotes('');
  };

  const handleSubmitCounterPropose = (e: React.FormEvent, offer: Offer) => {
    e.preventDefault();
    if (!counterProposalAmount) return;

    const updated: Offer = {
      ...offer,
      status: 'renegotiating',
      guarantee_amount: parseFloat(counterProposalAmount),
      renegotiation_notes: counterProposalNotes || undefined,
      last_action_by: 'promoter'
    };

    onUpdateOffer(updated);
    setRenegotiatingId(null);
    triggerNotification?.(`New counter-guarantee of $${counterProposalAmount} sent back to band!`);
  };

  const roleTheme = {
    fan: { bgClass: 'bg-violet-950/40', borderClass: 'border-violet-500/30', hoverBorderClass: 'hover:border-violet-500/50', textClass: 'text-violet-400' },
    fan_only: { bgClass: 'bg-blue-950/40', borderClass: 'border-blue-500/30', hoverBorderClass: 'hover:border-blue-500/50', textClass: 'text-blue-400' },
    band: { bgClass: 'bg-emerald-950/40', borderClass: 'border-emerald-500/30', hoverBorderClass: 'hover:border-emerald-500/50', textClass: 'text-emerald-400' },
    promoter: { bgClass: 'bg-yellow-950/40', borderClass: 'border-yellow-500/30', hoverBorderClass: 'hover:border-yellow-500/50', textClass: 'text-yellow-400' },
    creative: { bgClass: 'bg-fuchsia-950/40', borderClass: 'border-fuchsia-500/30', hoverBorderClass: 'hover:border-fuchsia-500/50', textClass: 'text-fuchsia-400' },
    label: { bgClass: 'bg-orange-950/40', borderClass: 'border-orange-500/30', hoverBorderClass: 'hover:border-orange-500/50', textClass: 'text-orange-400' }
  };

  const portalHeader = (
    <div className="w-full px-5 py-3 flex items-center justify-between border-b border-[#1b1e25] bg-[#0c0e12] relative z-50 shrink-0 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center select-none shrink-0 transition-all">
          <img 
            src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png" 
            alt="Nexus Core" 
            className="object-contain"
            style={{ width: '154.791px', height: '57.9957px' }}
            referrerPolicy="no-referrer"
          />
        </div>
      </div>
      
      {/* Top right: quick info / workspace badge & subscription tier */}
      <div className="flex items-center gap-3">
        {(() => {
          const norm = (userProfile.sub_tier || 'free_for_life').toLowerCase();
          let label = 'LIFETIME FREE';
          let colorClass = 'bg-zinc-950 border-zinc-800 text-zinc-400';

          if (norm === 'power_user_pro' || norm === 'power_user') {
            label = 'POWER USER PRO';
            colorClass = 'bg-[#00ffcc]/10 border-[#00ffcc]/30 text-[#00ffcc] shadow-[0_0_8px_rgba(0,255,204,0.1)]';
          } else if (norm === 'apex_enterprise' || norm === 'apex') {
            label = 'APEX ENTERPRISE';
            colorClass = 'bg-pink-950/40 border-pink-500/30 text-pink-300 shadow-[0_0_8px_rgba(236,72,153,0.15)]';
          } else if (norm === 'distro') {
            label = 'DISTRO ACTIVE';
            colorClass = 'bg-violet-950/40 border-violet-500/30 text-violet-300 shadow-[0_0_8px_rgba(139,92,246,0.15)]';
          } else if (norm === 'syndicate') {
            label = 'SYNDICATE ACTIVE';
            colorClass = 'bg-emerald-950/40 border-emerald-550/30 text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.15)]';
          } else {
            label = norm.replace(/_/g, ' ').toUpperCase();
          }

          return (
            <span className={`px-2.5 py-1 border text-[9px] rounded-lg font-mono font-black uppercase tracking-widest ${colorClass}`}>
              {label}
            </span>
          );
        })()}
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest hidden sm:inline">
          PROMOTER PORTAL • <span className="text-yellow-400">{userProfile?.name}</span>
        </span>

        {/* Profile Avatar Trigger Button */}
        <div className="relative">
          <button 
            type="button"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="w-10 h-10 rounded-full bg-yellow-950/40 border border-yellow-500/50 flex items-center justify-center font-black text-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition-all active:scale-95 overflow-hidden shadow-md cursor-pointer hover:border-yellow-400 shrink-0"
            title="Switch Workspace or active profile context"
          >
            {userProfile?.promoter_logo || userProfile?.avatar_url ? (
              <img src={userProfile?.promoter_logo || userProfile?.avatar_url} className="w-full h-full object-cover animate-in fade-in" alt="" referrerPolicy="no-referrer" />
            ) : (
              userProfile?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </button>

          <AnimatePresence>
            {roleMenuOpen && (
              <>
                {/* Click outside backdrop with full coverage */}
                
        <motion.div key="modal-backdrop-promoterportalview-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[99990] bg-black/60 backdrop-blur-[2px]" onClick={() => setRoleMenuOpen(false)} />
                
                {/* Switcher Dropdown popup */}
                <div className="fixed top-[92px] right-4 sm:right-6 w-80 bg-[#09090b] border border-zinc-800 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.95)] z-[99999] text-left animate-in fade-in slide-in-from-top-3 duration-200">
                  <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                    {userProfile?.promoter_logo || userProfile?.avatar_url ? (
                      <img src={userProfile?.promoter_logo || userProfile?.avatar_url} className="w-10 h-10 rounded-full object-cover border border-yellow-500/40 shrink-0" alt="" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-yellow-950/40 border border-yellow-500/40 flex items-center justify-center font-black text-yellow-400 shrink-0">
                        {userProfile?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <div className="overflow-hidden flex-1">
                      <h4 className="text-sm font-black text-white truncate">
                        {userProfile?.name || 'Guest'}
                      </h4>
                      <p className="text-[9px] text-zinc-400 font-mono uppercase truncate mt-0.5">
                        {userProfile?.role || 'Manager'} • PROMOTER PORTAL
                      </p>
                    </div>
                  </div>

                  {/* ACTIVE BAND SWITCHER (PRO/PRO+) */}
                  {(() => {
                    const normTier = (userProfile.sub_tier || 'free_for_life').toLowerCase();
                    let bandLimit = 1;
                    let tierName = 'Free Plan';
                    if (normTier === 'touring_pro') {
                      bandLimit = 2;
                      tierName = 'Touring Pro Plan';
                    } else if (normTier === 'touring_pro_plus') {
                      bandLimit = 5;
                      tierName = 'Touring Pro+ Plan';
                    } else if (normTier === 'enterprise_circuit') {
                      bandLimit = 999;
                      tierName = 'Enterprise Circuit Plan';
                    } else if (normTier === 'power_user_pro') {
                      bandLimit = 2;
                      tierName = 'Power User Pro';
                    }

                    const switchableBands = bands.slice(0, bandLimit);

                    return (
                      <div className="space-y-2 py-3 border-b border-zinc-800/80">
                        <div className="flex justify-between items-center">
                          <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase">ACTIVE BAND CONTEXT</span>
                          <span className="text-[7px] font-mono font-bold bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] px-1.5 py-0.5 rounded uppercase">
                            {tierName} ({switchableBands.length}/{bandLimit === 999 ? '∞' : bandLimit})
                          </span>
                        </div>

                        <div className="space-y-1">
                          {switchableBands.map((b, bIdx) => {
                            const isSelected = activeBandId === b.id || (!activeBandId && bands[0]?.id === b.id);
                            return (
                              <button
                                key={`switch-band-${b.id}-${bIdx}`}
                                type="button"
                                onClick={() => {
                                  if (setActiveBandId) {
                                    setActiveBandId(b.id);
                                    triggerNotification?.(`⚡ Switched active artist context to: "${b.name}"`);
                                  }
                                }}
                                className={`w-full flex items-center justify-between p-2 rounded-xl border text-left transition-all duration-200 cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-400 font-bold shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                                    : 'bg-zinc-950 hover:bg-zinc-900 border-zinc-900 text-zinc-400 hover:text-white'
                                }`}
                              >
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {b.logo_url ? (
                                    <img src={b.logo_url} className="w-6 h-6 rounded-full object-cover border border-zinc-800 shrink-0" alt="" referrerPolicy="no-referrer" />
                                  ) : (
                                    <div className="w-6 h-6 rounded-full bg-zinc-850 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 shrink-0 font-bold">
                                      {b.name?.charAt(0).toUpperCase() || 'B'}
                                    </div>
                                  )}
                                  <div className="overflow-hidden">
                                    <p className="text-[10px] font-black uppercase tracking-wider truncate leading-tight">{b.name}</p>
                                    <p className="text-[8px] opacity-75 font-mono truncate">{b.genre || 'Assorted'}</p>
                                  </div>
                                </div>
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse shrink-0" />
                                )}
                              </button>
                            );
                          })}

                          {bands.length > bandLimit && (
                            <div className="text-[8px] text-zinc-500 font-mono text-center pt-1 uppercase">
                              + {bands.length - bandLimit} more profiles locked. Upgrade subscription.
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* SWITCH ACTIVE PORTAL SECTION */}
                  <div className="space-y-2 pt-3">
                    <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase mb-1.5">SWITCH ACTIVE PORTAL</span>
                    
                    <div className="space-y-1">
                      {[
                        { key: 'industry_pro', icon: '🎟️', name: 'Industry Pro', desc: 'Active social environment', theme: roleTheme.fan },
                        { key: 'fan_only', icon: '💙', name: 'Fan-Only Profile', desc: 'Royal Blue fan community', theme: roleTheme.fan_only },
                        { key: 'band', icon: '🎸', name: 'Band / Artist Workspace', desc: 'Lineup, repertoire & presets', theme: roleTheme.band },
                        { key: 'promoter', icon: '🏟️', name: 'Venue Promoter Gateway', desc: 'Calendars, lineups & finance', theme: roleTheme.promoter },
                        { key: 'creative', icon: '🛠️', name: 'Creative Hub & Crew', desc: 'Contracts, portfolio & sound crew', theme: roleTheme.creative },
                        { key: 'label', icon: '💿', name: 'Record Label Console', desc: 'Oversee rosters & releases', theme: roleTheme.label }
                      ].map((portal, idx) => {
                        const currentRole = userProfile?.active_workspace || userProfile?.account_type;
                        const isActive = currentRole === portal.key || (portal.key === 'fan_only' && (currentRole === 'fan' || currentRole === 'fan_only')) || (portal.key === 'industry_pro' && (currentRole === 'industry_pro' || currentRole === 'industry pro'));
                        const registeredWorkspaces = userProfile?.registered_workspaces || [];
                        const allowedWorkspaces = userProfile?.allowed_workspaces || [];
                        const isIndustryPro = userProfile?.account_type === 'industry_pro' ||
                          ['band', 'promoter', 'creative', 'label'].includes(userProfile?.account_type) ||
                          ['band', 'promoter', 'creative', 'label'].some(w => hasRegisteredWorkspace(userProfile, w));

                        if (portal.key === 'fan_only' && isIndustryPro) {
                          return (
                            <div key={`promoter-portal-disabled-${portal.key}-${idx}`} className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950/20 border border-zinc-900/30 text-zinc-650 opacity-40 select-none cursor-not-allowed">
                              <div className="flex items-center gap-2">
                                <span className="text-xs grayscale opacity-50">{portal.icon}</span>
                                <div className="text-left">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-zinc-500">{portal.name}</p>
                                  <p className="text-[8px] font-mono leading-none text-zinc-600">downgrade not possible</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-mono text-zinc-700">LOCKED</span>
                            </div>
                          );
                        }

                        const isAllowed = portal.key === 'fan' || 
                                          portal.key === 'fan_only' ||
                                          portal.key === 'industry_pro' ||
                                          hasRegisteredWorkspace(userProfile, portal.key) || 
                                          (userProfile?.email === 'admin@nexus.com' || userProfile?.account_type === 'admin');

                        if (isActive) {
                          return (
                            <div key={`promoter-portal-active-${portal.key}-${idx}`} className={`w-full flex items-center justify-between p-2 rounded-xl ${portal.theme.bgClass} border ${portal.theme.borderClass} ${portal.theme.textClass}`}>
                              <div className="flex items-center gap-2">
                                <span className="text-xs">{portal.icon}</span>
                                <div className="text-left">
                                  <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                  <p className="text-[8px] opacity-80 font-mono leading-none">Active Environment</p>
                                </div>
                              </div>
                              <span className={`w-1.5 h-1.5 rounded-full ${portal.key === 'fan_only' ? 'bg-blue-500 shadow-[0_0_8px_#3b82f6]' : portal.key === 'fan' ? 'bg-violet-500 shadow-[0_0_8px_#8b5cf6]' : portal.key === 'band' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : portal.key === 'promoter' ? 'bg-yellow-500 shadow-[0_0_8px_#eab308]' : portal.key === 'creative' ? 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' : 'bg-orange-500 shadow-[0_0_8px_#f97316]'} animate-pulse`} />
                            </div>
                          );
                        }

                        if (isAllowed) {
                          return (
                            <button
                              key={`promoter-portal-allowed-${portal.key}-${idx}`}
                              type="button"
                              onClick={() => {
                                setRoleMenuOpen(false);
                                if (setUserProfile) {
                                  const targetAcc = (portal.key === 'fan' || portal.key === 'fan_only') ? 'fan_only' : (portal.key === 'industry_pro') ? 'industry_pro' : portal.key;
                                  const updated = { ...userProfile, account_type: targetAcc as any, active_workspace: portal.key as any };
                                  setUserProfile(updated);
                                  try { localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated)); } catch (_) {}
                                  window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                                  triggerNotification?.(`⚡ Switched to ${portal.name}.`);
                                }
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 ${portal.theme.hoverBorderClass} text-zinc-400 hover:text-white transition-all cursor-pointer group`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xs group-hover:scale-110 transition-transform">{portal.icon}</span>
                                <div className="text-left">
                                  <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                  <p className="text-[8px] text-zinc-500 font-mono leading-none">{portal.desc}</p>
                                </div>
                              </div>
                            </button>
                          );
                        }

                        // Locked/Upgrade workspace
                        return (
                          <button
                            key={`${portal.key}-${idx}`}
                            type="button"
                            onClick={() => {
                              setRoleMenuOpen(false);
                              triggerNotification?.(`💡 Upgrade clearance to unlock ${portal.name}.`);
                            }}
                            className="w-full flex items-center justify-between p-2 rounded-xl bg-black/40 border border-zinc-950 text-zinc-550 hover:text-zinc-400 transition-all cursor-pointer group"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-xs group-hover:scale-110 transition-transform">{portal.icon}</span>
                              <div className="text-left">
                                <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                <p className="text-[8px] text-zinc-650 font-mono leading-none">Upgrade to Unlock</p>
                              </div>
                            </div>
                            <Lock className="w-3.5 h-3.5 text-zinc-700 group-hover:text-zinc-500 shrink-0" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  if (showSubscriptionTiersModal) {
    return (
      <div className="w-full min-h-screen bg-[#0c0e12] flex flex-col">
        {!isolatedTab && portalHeader}
        <div className="flex-1">
          <BillingSettingsView 
            userProfile={userProfile}
            onClose={() => setShowSubscriptionTiersModal(false)}
            onNotification={triggerNotification}
          />
        </div>
      </div>
    );
  }


  if (userProfile?.role === 'Door Staff / Box Office') {
    return (
      <div className="w-full min-h-screen bg-[#0c0e12] flex flex-col">
        {!isolatedTab && portalHeader}
        <div className="flex-1 w-full h-full p-4 sm:p-6 flex flex-col justify-center items-center">
          <CrewTerminal
            ticketingEventId={ticketingEventId}
            lineups={lineups}
            localSalesList={localSalesList}
            redeemedTickets={redeemedTickets}
            handleToggleRedeem={handleToggleRedeem}
            isCrewTerminalActive={true}
            setIsCrewTerminalActive={() => {}}
            playLocalBeep={playLocalBeep}
            triggerNotification={triggerNotification}
            isDoorCrewOnly={true}
          />
        </div>
      </div>
    );
  }

  if (activePortalTab === 'workspace') {
    return (
      <div className={isolatedTab ? "w-full flex flex-col" : "w-full min-h-screen bg-[#0c0e12] flex flex-col"}>
        {!isolatedTab && portalHeader}

        <div className="flex-1">
          <EventWorkspaceView
            userProfile={userProfile}
            calendarSelectedDate={calendarSelectedDate}
            selectedVenueIndex={selectedVenueIndex}
            setSelectedVenueIndex={setSelectedVenueIndex}
            activeAllVenues={activeAllVenues}
            plannerShowType={plannerShowType}
            setPlannerShowType={setPlannerShowType}
            plannerEventName={plannerEventName}
            setPlannerEventName={setPlannerEventName}
            plannerNotes={plannerNotes}
            setPlannerNotes={setPlannerNotes}
            plannerLineup={plannerLineup}
            setPlannerLineup={setPlannerLineup}
            bands={bands}
            onClose={() => {
              setActivePortalTab('routing');
              playLocalBeep(450, 'sine', 0.015);
            }}
            triggerNotification={triggerNotification}
            playLocalBeep={playLocalBeep}
            handleCalendarPlannerSubmit={handleCalendarPlannerSubmit}
            plannerCostLedger={plannerCostLedger}
            setPlannerCostLedger={setPlannerCostLedger}
            festivalDuration={plannerFestivalDuration}
            setFestivalDuration={setPlannerFestivalDuration}
            onNavigateToTab={(tab) => {
              setActivePortalTab(tab);
              playLocalBeep(580, 'sine', 0.015);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={(isolatedTab || showOnlyCalendar || showOnlyRoutingAndAvailability) ? "w-full flex flex-col" : "w-full min-h-screen bg-[#0c0e12] flex flex-col"}>
      {!isolatedTab && !showOnlyCalendar && !showOnlyRoutingAndAvailability && portalHeader}
      <div 
        id="promoter-portal" 
        className={`w-full min-w-0 text-[#fef08a] font-mono pb-1 flex flex-col space-y-2 relative overflow-x-hidden flex-1 ${
          (isolatedTab || showOnlyCalendar || showOnlyRoutingAndAvailability) ? 'p-0' : 'p-1.5 sm:p-3.5'
        }`}
      >
      {/* High-End Venue background image with fine overlays */}
      {!isolatedTab && !showOnlyCalendar && !showOnlyRoutingAndAvailability && (
        <>
          <div 
            className="fixed inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-1000 scale-105 select-none"
            style={{ 
              backgroundImage: `url(${venueBg})`,
              zIndex: 0
            }}
            role="presentation"
          />
          {/* Industrial amber / metallic dark style gradient blend over image */}
          <div className="fixed inset-0 bg-gradient-to-br from-[#0e0d0a]/98 via-[#0b0a08]/96 to-[#020202]/99 pointer-events-none z-0" />
          
          {/* Reticle / scanline decorative styling */}
          <div className="fixed inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,234,0,0.03),rgba(0,255,0,0.01),rgba(255,200,0,0.03))] bg-[size:100%_4px,3px_100%] pointer-events-none opacity-20 z-10" />
        </>
      )}

      {/* Content wrapper to force elements relative over background */}
      <div className="relative z-10 flex flex-col space-y-2 w-full max-w-full">
        {!isolatedTab && !showOnlyCalendar && !showOnlyRoutingAndAvailability && (
        <>
        {activePortalTab === 'routing' && (
        <div className="block lg:hidden yellow-chase-border-mobile pulse-glow-yellow w-full shadow-2xl">
          <div className="backdrop-blur-md rounded-[calc(1rem-2px)] bg-[#090b0e]/95 flex flex-col items-center sm:items-stretch justify-between gap-5 relative overflow-hidden p-5 sm:p-6 w-full shadow-2xl border border-zinc-800/10" id="promoter-profile-card-mobile">
            {/* Optional Cover Image in Top Third */}
            {(userProfile?.promoter_cover_image || userProfile?.banner_url) && (
              <div className="absolute top-0 left-0 right-0 h-1/3 overflow-hidden pointer-events-none z-0">
                <img 
                  src={userProfile?.promoter_cover_image || userProfile?.banner_url} 
                  alt="Cover Profile" 
                  className="w-full h-full object-cover opacity-35"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/60 to-[#090b0e]" />
              </div>
            )}
            {/* Decorative Grid & Metallic Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(#eab30807_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#eab308]/5 blur-[90px] pointer-events-none" />
 
            {/* Action buttons - Upper Left & Right Corners */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={() => {
                  setPropertySpecExpanded(!propertySpecExpanded);
                  playLocalBeep(520, 'sine', 0.02);
                }}
                className={`bg-zinc-950/60 hover:bg-zinc-850 border ${propertySpecExpanded ? 'border-emerald-500 text-[#00ffcc] shadow-[0_0_10px_rgba(16,185,129,0.25)]' : 'border-zinc-800 text-zinc-400'} hover:border-zinc-500 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black`}
                title="Toggle Venue Property Specs"
              >
                <Building className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-20"><button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-150 hover:border-zinc-500 text-zinc-400 hover:text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black"
                title="Edit Promoter Console Details"
              >
                <Settings className="w-4 h-4 text-zinc-400 hover:rotate-90 transition-transform duration-300" />
              </button>
              <span className="text-[8px] font-mono text-zinc-550 border border-zinc-900 bg-black/45 px-1.5 py-0.5 rounded animate-pulse">
                v1.24.P
              </span>
            </div>
 
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10 w-full mb-1">
              {/* Profile Picture */}
              <div 
                onClick={() => setIsEditingProfile(true)}
                className="relative group shrink-0 cursor-pointer mx-auto sm:mx-0"
                title="Click to edit profile specifications & picture"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#eab308] via-[#facc15] to-[#fef08a] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 yellow-pulse-glow" />
                <div id="promoter-avatar-frame-mob" className="relative w-32 h-32 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/80 flex items-center justify-center shadow-lg group-hover:border-[#eab308] transition-colors yellow-pulse-glow">
                  {userProfile?.promoter_logo || userProfile?.avatar_url ? (
                    <img 
                      src={userProfile?.promoter_logo || userProfile?.avatar_url} 
                      alt={userProfile?.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <span className="text-5xl font-bold font-mono text-[#facc15] tracking-wider">
                      {(userProfile?.name || 'P').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </div>
 
              {/* Profile Specifications Info */}
              <div className="min-w-0 flex-1 space-y-1">
                <h1 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_metadata?.agency_name || userProfile?.promoter_agency || userProfile?.promoter_brand || userProfile?.promoter_name || 'Nexus Live Productions'}</span>
                </h1>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs text-zinc-400 font-mono leading-relaxed">
                  <span className="text-[#facc15] uppercase tracking-wider font-extrabold flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                    Live Event Booking &amp; Concert Promotions
                  </span>
                  <span className="text-zinc-750">•</span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-yellow-500" /> {userProfile?.target_region || 'Texas Region'}
                  </span>
                  <span className="text-zinc-755">•</span>
                  <span className="text-[#00ffcc] font-black flex items-center gap-1.5 uppercase tracking-wide animate-pulse">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
                    </span>
                    ONLINE
                  </span>
                </div>

                {/* Active Operator info */}
                <div className="pt-2 flex justify-center sm:justify-start">
                  <div className="inline-flex items-center gap-1.5 text-zinc-450 bg-black/40 border border-yellow-500/20 px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase tracking-wider">
                    <span className="text-zinc-550">Active Operator:</span>
                    <span className="text-white font-bold">({userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Guest'})</span>
                    <span className="text-yellow-400 font-bold">/ {userProfile?.promoter_metadata?.title || userProfile?.role || 'Lead Talent Buyer & Production Director'}</span>
                  </div>
                </div>
              </div>
            </div>
 
            {/* Real-time Notification Center Link Button */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="w-full mt-2 py-3 px-4 rounded-xl border border-yellow-500/25 hover:border-yellow-500/50 bg-yellow-950/15 hover:bg-yellow-950/30 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group focus:outline-none cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-yellow-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-250 animate-pulse" />
                  <div>
                    <span className="block font-black text-white text-[10px] tracking-wider uppercase">NOTIFICATION CENTER</span>
                    <span className="text-[8.5px] text-zinc-500 block uppercase font-bold mt-0.5">📡 Access all your current notifications and system alerts</span>
                  </div>
                </div>
                {notifications && (
                  <span className={`px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider transition-all shadow-md ${
                    (notifications || []).some(n => !n.is_read)
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'bg-zinc-900/95 text-zinc-555 border border-zinc-800'
                  }`}>
                    {notifications.filter(n => !n.is_read).length} DIRECTIVES
                  </span>
                )}
              </button>
            )}

            {/* Real-time Message Center / Inbox Button (Mobile) */}
            <button
              type="button"
              onClick={() => {
                setIsInboxOpen(true);
                setInboxSubTab('conversations');
              }}
              className="w-full mt-1.5 py-3 px-4 rounded-xl border border-yellow-500/25 hover:border-yellow-500/50 bg-yellow-950/15 hover:bg-yellow-950/30 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group focus:outline-none cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-yellow-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-250 animate-pulse" />
                <div>
                  <span className="block font-black text-white text-[10px] tracking-wider uppercase">MESSAGE CENTER</span>
                  <span className="text-[8.5px] text-zinc-500 block uppercase font-bold mt-0.5">💬 Access direct messages and promoter inbox channels</span>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded text-[9px] uppercase font-black tracking-wider transition-all shadow-md bg-zinc-900/95 text-yellow-400 border border-yellow-950">
                ACTIVE
              </span>
            </button>

            {/* Merge Property Profile spec card inside main profile card */}
            {propertySpecExpanded && activeAllVenues[selectedVenueIndex] && (
              <div className="w-full max-w-2xl mx-auto mt-2 p-4 border border-emerald-500/30 bg-zinc-950/90 rounded-xl font-mono text-xs text-left text-zinc-300 animate-slide-down relative z-10 shadow-lg shadow-black/80">
                <div className="absolute top-0 right-0 p-1 px-2 text-[8px] text-[#00ffcc] font-black uppercase tracking-widest bg-emerald-950/40 border-l border-b border-emerald-900/40 rounded-bl rounded-tr-xl">
                  {activeAllVenues[selectedVenueIndex].isHome ? '🏠 HOME BASE' : '🏬 PORTFOLIO'}
                </div>
                <div className="text-[9px] font-black text-[#00ffcc] tracking-widest uppercase mb-2 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>[ Active Venue Specs: {activeAllVenues[selectedVenueIndex].name} ]</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 text-[10px] leading-relaxed uppercase">
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-550">Address:</span>
                    <strong className="text-zinc-200 truncate max-w-[150px]">{activeAllVenues[selectedVenueIndex].address || 'No Address'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-555">Location:</span>
                    <strong className="text-zinc-200">{activeAllVenues[selectedVenueIndex].city}, {activeAllVenues[selectedVenueIndex].state}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-555">Technical Specs:</span>
                    <strong className="text-purple-400 font-bold">Cap: {activeAllVenues[selectedVenueIndex].capacity} • Min Age: {activeAllVenues[selectedVenueIndex].age_restriction}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-555">Curfew:</span>
                    <strong className="text-red-400 font-bold">Curfew {activeAllVenues[selectedVenueIndex].curfew_time || '23:30'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Switcher & Log out row for Mobile */}
            <div className="flex flex-col items-center justify-center gap-4 pt-4 pb-1 relative z-10 w-full border-t border-zinc-850/40">
              <div className="grid grid-cols-2 bg-black/60 border border-zinc-800/80 rounded-2xl p-1.5 gap-1.5 shadow-inner w-full max-w-sm mt-1 mb-1">
                {/* BAND PORTAL */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isBandAllowed) {
                      triggerNotification?.('Band Workspace is locked. Please register to unlock.');
                      window.dispatchEvent(new CustomEvent('nexus_target_register_workspace', { detail: { target: 'band' } }));
                      return;
                    }
                    const updated = { ...userProfile, active_workspace: 'band', account_type: 'industry pro' };
                    if (setUserProfile) setUserProfile(updated);
                    localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                    window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                    triggerNotification?.("⚡ Switched to Band & Artist Operations Workspace.");
                  }}
                  className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    isBandAllowed 
                      ? 'hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/30 text-emerald-300 hover:text-white cursor-pointer active:scale-95' 
                      : 'bg-amber-950/20 border border-amber-500/30 text-amber-300 hover:border-amber-500/60 cursor-pointer'
                  }`}
                  title={isBandAllowed ? "Switch to active Band / Artist Workspace" : "Locked • Tap to Register"}
                >
                  <Home className="w-3.5 h-3.5 text-emerald-400" />
                  <span>BAND {!isBandAllowed && <Lock className="w-2.5 h-2.5 text-amber-400 inline ml-0.5" />}</span>
                </button>

                {/* CREATIVE SPACE */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isCreativeAllowed) {
                      triggerNotification?.('Creative Hub is locked. Please register to unlock.');
                      window.dispatchEvent(new CustomEvent('nexus_target_register_workspace', { detail: { target: 'creative' } }));
                      return;
                    }
                    const updated = { 
                      ...userProfile, 
                      active_workspace: 'creative',
                      account_type: 'industry pro',
                      creative_metadata: userProfile?.creative_metadata || {
                        business_name: (userProfile?.name || 'Pro') + ' Studio',
                        booking_email: userProfile?.email,
                        base_location: userProfile?.target_region || 'Austin, Texas',
                        portfolio_link: '',
                        bio: 'Creative visual artist, designer, or audio tech.',
                        day_rate: '$350 / Day',
                        pricing_notes: 'Rates available upon request',
                        gear: ['Digital Audio Desk', 'Photoshop CC'],
                        skills: ['Art Direction', 'Audio Post'],
                        primary_category: 'Artist/Designer'
                      }
                    };
                    if (setUserProfile) setUserProfile(updated);
                    localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                    window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                    triggerNotification?.("⚡ Switched to Creative & Crew Workspace.");
                  }}
                  className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    isCreativeAllowed 
                      ? 'hover:bg-violet-950/35 border border-transparent hover:border-violet-500/30 text-violet-305 hover:text-white cursor-pointer active:scale-95' 
                      : 'bg-amber-950/20 border border-amber-500/30 text-amber-300 hover:border-amber-500/60 cursor-pointer'
                  }`}
                  title={isCreativeAllowed ? "Switch to Active Creative & Crew Workspace" : "Locked • Tap to Register"}
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>CREATIVE {!isCreativeAllowed && <Lock className="w-2.5 h-2.5 text-amber-400 inline ml-0.5" />}</span>
                </button>

                {/* PROMOTER PORTAL (ACTIVE) */}
                <button
                  type="button"
                  disabled
                  className="text-[9px] font-mono font-black uppercase tracking-wider px-2 py-2 rounded-lg border border-yellow-500/55 bg-yellow-950/20 text-yellow-300 flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
                  <span>PROMOTER</span>
                </button>

                {/* RECORD LABEL PORTAL */}
                <button
                  type="button"
                  onClick={() => {
                    if (!isLabelAllowed) {
                      triggerNotification?.('Record Label Terminal is locked. Please register to unlock.');
                      window.dispatchEvent(new CustomEvent('nexus_target_register_workspace', { detail: { target: 'label' } }));
                      return;
                    }
                    const updated = { ...userProfile, active_workspace: 'label', account_type: 'industry pro' };
                    if (setUserProfile) setUserProfile(updated);
                    localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated));
                    window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                    triggerNotification?.("⚡ Switched to Record Label HQ Terminal.");
                  }}
                  className={`text-[9px] font-mono font-black uppercase tracking-wider px-2 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    isLabelAllowed
                      ? 'hover:bg-amber-955/35 border border-transparent hover:border-amber-500/30 text-amber-500 hover:text-white cursor-pointer active:scale-95'
                      : 'bg-amber-950/20 border border-amber-500/30 text-amber-300 hover:border-amber-500/60 cursor-pointer'
                  }`}
                  title={isLabelAllowed ? "Switch to Record Label Headquarters" : "Locked • Tap to Register"}
                >
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  <span>LABEL {!isLabelAllowed && <Lock className="w-2.5 h-2.5 text-amber-400 inline ml-0.5" />}</span>
                </button>

                {/* FAN PORTAL */}
                <button
                  type="button"
                  onClick={() => {
                    if (setUserProfile) {
                      setUserProfile(prev => ({ ...prev, active_workspace: 'fan_only', account_type: 'fan' }));
                    }
                    triggerNotification?.("⚡ Switched to Fan & Listener Portal.");
                  }}
                  className="col-span-2 text-[9px] font-mono font-black uppercase tracking-wider px-2 py-2 rounded-lg border border-rose-500/35 hover:border-rose-500/60 bg-rose-955/10 hover:bg-rose-950/25 text-rose-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Switch to active Fan & Listener Portal"
                >
                  <User className="w-3.5 h-3.5 text-rose-400" />
                  <span>FAN PORTAL 🎟️</span>
                </button>
              </div>

              {/* Red pill style SIGN OUT button */}
              <button 
                onClick={onLogout}
                className="px-6 py-2 rounded-full border border-red-500/40 bg-red-950/40 hover:bg-red-600 hover:text-white text-red-400 font-mono text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.35)] flex items-center gap-2 active:scale-95 mt-1"
                title="Disconnect active console session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* DESKTOP ONLY PROFILE HEADER */}
        {activePortalTab === 'routing' && (
        <div className="hidden lg:block yellow-chase-border pulse-glow-yellow w-full shadow-2xl">
          <div className="backdrop-blur-md rounded-[calc(1.5rem-2.2px)] bg-[#090b0e]/95 flex flex-col items-center justify-between gap-6 relative overflow-hidden p-8 w-full" id="promoter-profile-card-desktop">
            {/* Optional Cover Image in Top Third */}
            {(userProfile?.promoter_cover_image || userProfile?.banner_url) && (
              <div className="absolute top-0 left-0 right-0 h-1/3 overflow-hidden pointer-events-none z-0">
                <img 
                  src={userProfile?.promoter_cover_image || userProfile?.banner_url} 
                  alt="Cover Profile" 
                  className="w-full h-full object-cover opacity-35"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/60 to-[#090b0e]" />
              </div>
            )}
            {/* Decorative Grid & Metallic Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(#eab30807_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" />
            <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#eab308]/5 blur-[90px] pointer-events-none" />

            {/* Action buttons - Upper Left & Right Corners */}
            <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
              <button
                type="button"
                onClick={() => {
                  setPropertySpecExpanded(!propertySpecExpanded);
                  playLocalBeep(520, 'sine', 0.02);
                }}
                className={`bg-zinc-950/60 hover:bg-zinc-850 border ${propertySpecExpanded ? 'border-emerald-500 text-[#00ffcc] shadow-[0_0_10px_rgba(16,185,129,0.25)]' : 'border-zinc-800 text-zinc-400'} hover:border-zinc-500 p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black`}
                title="Toggle Venue Property Specs"
              >
                <Building className="w-4 h-4" />
              </button>
            </div>
            <div className="absolute top-4 right-4 flex flex-col items-end gap-1 z-20">
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-150 hover:border-yellow-500 text-zinc-400 hover:text-white p-2 text-zinc-400 hover:rotate-90 hover:text-white p-2 rounded-xl transition-all cursor-pointer z-20 flex items-center justify-center shadow-md shadow-black"
                title="Edit Promoter Console Details"
              >
                <Settings className="w-4 h-4 text-zinc-400 hover:rotate-90 transition-transform duration-300" />
              </button>
              <span className="text-[8px] font-mono text-zinc-550 border border-zinc-900 bg-black/45 px-1.5 py-0.5 rounded animate-pulse">
                v1.24.P
              </span>
            </div>

            {/* Center Column Content */}
            <div className="flex max-w-7xl flex-col items-center gap-5 text-center relative z-10 w-full animate-fade-in">
              {/* Centered Profile Picture */}
              <div 
                onClick={() => setIsEditingProfile(true)}
                className="relative group shrink-0 cursor-pointer animate-fade-in mx-auto"
                title="Click to edit profile specifications & picture"
              >
                <div className="absolute -inset-0.5 bg-gradient-to-r from-[#eab308] via-[#facc15] to-[#fef08a] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 yellow-pulse-glow" />
                <div className="relative w-48 h-48 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/85 flex items-center justify-center shadow-lg group-hover:border-[#eab308] transition-colors yellow-pulse-glow">
                  {userProfile?.promoter_logo || userProfile?.avatar_url ? (
                    <img 
                      src={userProfile?.promoter_logo || userProfile?.avatar_url} 
                      alt={userProfile?.name} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350" 
                      referrerPolicy="no-referrer" 
                    />
                  ) : (
                    <span className="text-8xl font-bold font-mono text-[#facc15] tracking-wider animate-pulse">
                      {(userProfile?.name || 'P').charAt(0).toUpperCase()}
                    </span>
                  )}
                  {/* Visual hover edit overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[8px] font-mono font-bold text-white uppercase bg-black/80 px-1 py-0.5 rounded border border-yellow-500/30">Edit</span>
                  </div>
                </div>
              </div>

              {/* Profile Info Details Stacked Center */}
              <div className="flex flex-col items-center text-center space-y-3 w-full">
                {/* Promoter Name: Centered in one single line */}
                <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center gap-2">
                  <span>{userProfile?.promoter_metadata?.brand_name || userProfile?.promoter_metadata?.agency_name || userProfile?.promoter_agency || userProfile?.promoter_brand || userProfile?.promoter_name || 'Nexus Live Productions'}</span>
                </h1>

                {/* Team / Agency, location, and status under that on the same level */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono w-full">
                  {/* Agency Brand Name Badge */}
                  <div className="text-sm text-zinc-350 font-mono flex items-center justify-center gap-1.5 p-1.5 px-3 bg-[#101319]/80 border border-zinc-900/80 rounded-xl shrink-0">
                    <span className="text-yellow-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      Live Event Booking &amp; Concert Promotions
                    </span>
                  </div>

                  <span className="hidden sm:inline text-zinc-700 font-black">•</span>

                  {/* Location Badge */}
                  <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-900/50 font-mono">
                    <MapPin className="w-3.5 h-3.5 text-yellow-400" /> 
                    <span className="text-zinc-350 font-bold">{userProfile?.target_region || 'Texas Region'}</span>
                  </div>

                  <span className="hidden sm:inline text-zinc-700 font-black">•</span>

                  {/* Synced Online Status Indicator */}
                  <div className="flex items-center gap-1.5 text-zinc-400 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-900/50">
                    <span className="text-[#00ffcc] font-black flex items-center gap-1.5 uppercase tracking-wide animate-pulse">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
                      </span>
                      ONLINE
                    </span>
                  </div>

                  <span className="hidden sm:inline text-zinc-700 font-black">•</span>

                  {/* Active Operator info */}
                  <div className="flex items-center gap-1.5 text-zinc-400 bg-black border border-yellow-500/25 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase shadow-[0_2px_10px_rgba(234,179,8,0.1)]">
                    <span className="text-zinc-550">Active Operator:</span>
                    <span className="text-white font-black">({userProfile?.full_name || userProfile?.legal_name || userProfile?.name || 'Guest'})</span>
                    <span className="text-yellow-400 font-bold">/ {userProfile?.promoter_metadata?.title || userProfile?.role || 'Lead Talent Buyer & Production Director'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Real-time Notification Center Link Button */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="w-full max-w-2xl mx-auto mt-4 py-3.5 px-5 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 bg-yellow-950/15 hover:bg-yellow-950/30 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group cursor-pointer"
              >
                <div className="flex items-center gap-3.5">
                  <Bell className="w-5 h-5 text-yellow-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-250 animate-pulse" />
                  <div>
                    <span className="block font-black text-white text-[11px] tracking-wider uppercase">NOTIFICATION CENTER SYSTEM LINK</span>
                    <span className="text-[9px] text-[#eab308] block uppercase font-bold mt-0.5">📡 Access all your current notifications and system alerts</span>
                  </div>
                </div>
                {notifications && (
                  <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all shadow-md ${
                    (notifications || []).some(n => !n.is_read)
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-500/40 animate-pulse'
                      : 'bg-zinc-900/95 text-zinc-555 border border-zinc-800'
                  }`}>
                    {notifications.filter(n => !n.is_read).length} DIRECTIVES
                  </span>
                )}
              </button>
            )}

            {/* Real-time Message Center / Inbox Button (Desktop) */}
            <button
              type="button"
              onClick={() => {
                setIsInboxOpen(true);
                setInboxSubTab('conversations');
              }}
              className="w-full max-w-2xl mx-auto mt-2 py-3.5 px-5 rounded-2xl border border-yellow-500/20 hover:border-yellow-500/50 bg-yellow-950/15 hover:bg-yellow-950/30 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group cursor-pointer focus:outline-none"
            >
              <div className="flex items-center gap-3.5">
                <MessageSquare className="w-5 h-5 text-yellow-400 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-250 animate-pulse" />
                <div>
                  <span className="block font-black text-white text-[11px] tracking-wider uppercase">MESSAGE CENTER SYSTEM LINK</span>
                  <span className="text-[9px] text-[#eab308] block uppercase font-bold mt-0.5">💬 Access direct messages and promoter inbox channels</span>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all shadow-md bg-zinc-900/95 text-yellow-400 border border-yellow-950">
                ACTIVE
              </span>
            </button>

            {/* Merge Property Profile spec card inside main profile card */}
            {propertySpecExpanded && activeAllVenues[selectedVenueIndex] && (
              <div className="w-full max-w-2xl mx-auto mt-2 p-4 border border-emerald-500/30 bg-zinc-950/90 rounded-xl font-mono text-xs text-left text-zinc-300 animate-slide-down relative z-10 shadow-lg shadow-black/80">
                <div className="absolute top-0 right-0 p-1 px-2 text-[8px] text-[#00ffcc] font-black uppercase tracking-widest bg-emerald-950/40 border-l border-b border-emerald-900/40 rounded-bl rounded-tr-xl">
                  {activeAllVenues[selectedVenueIndex].isHome ? '🏠 HOME BASE' : '🏬 PORTFOLIO'}
                </div>
                <div className="text-[9px] font-black text-[#00ffcc] tracking-widest uppercase mb-2 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5" />
                  <span>[ Active Venue Specs: {activeAllVenues[selectedVenueIndex].name} ]</span>
                </div>
                <div className="grid grid-cols-1 gap-2.5 text-[10px] leading-relaxed uppercase">
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-550">Address:</span>
                    <strong className="text-zinc-200 truncate max-w-[150px]">{activeAllVenues[selectedVenueIndex].address || 'No Address'}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-550">Location:</span>
                    <strong className="text-zinc-200">{activeAllVenues[selectedVenueIndex].city}, {activeAllVenues[selectedVenueIndex].state}</strong>
                  </div>
                  <div className="flex justify-between border-b border-zinc-900 pb-1">
                    <span className="text-zinc-550">Technical Specs:</span>
                    <strong className="text-purple-400 font-bold">Cap: {activeAllVenues[selectedVenueIndex].capacity} • Min Age: {activeAllVenues[selectedVenueIndex].age_restriction}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-555">Curfew:</span>
                    <strong className="text-red-400 font-bold">Curfew {activeAllVenues[selectedVenueIndex].curfew_time || '23:30'}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Switcher & Log out row for Desktop */}
            <div className="flex flex-col items-center justify-center gap-5 pt-5 w-full relative z-10 border-t border-zinc-850/40">
              {/* OMNI-CLEARANCE WORKSPACE SWITCHER - formatted in a 2x2 grid */}
              <div className="grid grid-cols-2 bg-black/60 border border-zinc-800/80 rounded-2xl p-2 gap-2 shadow-inner w-full max-w-sm mx-auto my-3 scale-110">
                {/* BAND PORTAL */}
                <button
                  type="button"
                  disabled={!isBandAllowed}
                  onClick={() => {
                    setUserProfile(prev => ({ ...prev, active_workspace: 'band', account_type: 'industry pro' }));
                    triggerNotification?.("⚡ Switched to Band & Artist Operations Workspace.");
                  }}
                  className={`text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    isBandAllowed 
                      ? 'hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/30 text-emerald-300 hover:text-white cursor-pointer active:scale-95' 
                      : 'opacity-40 border border-transparent text-zinc-650 cursor-not-allowed'
                  }`}
                  title={isBandAllowed ? "Switch to active Band / Artist Workspace" : "Access Restricted: Register multi-role clearance to unlock"}
                >
                  <Home className="w-3.5 h-3.5 text-emerald-400" />
                  <span>BAND</span>
                </button>

                {/* CREATIVE SPACE */}
                <button
                  type="button"
                  disabled={!isCreativeAllowed}
                  onClick={() => {
                    setUserProfile(prev => ({ 
                      ...prev, 
                      active_workspace: 'creative',
                      account_type: 'industry pro',
                      creative_metadata: prev.creative_metadata || {
                        business_name: prev.name + ' Studio',
                        booking_email: prev.email,
                        base_location: prev.target_region || 'Austin, Texas',
                        portfolio_link: '',
                        bio: 'Creative visual artist, designer, or audio tech.',
                        day_rate: '$350 / Day',
                        pricing_notes: 'Rates available upon request',
                        gear: ['Digital Audio Desk', 'Photoshop CC'],
                        skills: ['Art Direction', 'Audio Post'],
                        primary_category: 'Artist/Designer'
                      }
                    }));
                    triggerNotification?.("⚡ Switched to Creative & Crew Workspace.");
                  }}
                  className={`text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    isCreativeAllowed 
                      ? 'hover:bg-violet-950/35 border border-transparent hover:border-violet-500/30 text-violet-355 hover:text-white cursor-pointer active:scale-95' 
                      : 'opacity-40 border border-transparent text-zinc-650 cursor-not-allowed'
                  }`}
                  title={isCreativeAllowed ? "Switch to Active Creative & Crew Workspace" : "Access Restricted: Register multi-role clearance to unlock"}
                >
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  <span>CREATIVE {!isCreativeAllowed && <Lock className="w-2.5 h-2.5 text-amber-400 inline ml-0.5" />}</span>
                </button>

                {/* PROMOTER PORTAL (ACTIVE) */}
                <button
                  type="button"
                  disabled
                  className="text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-2 rounded-xl border border-purple-500/55 bg-purple-950/20 text-purple-300 flex items-center justify-center gap-1.5 font-bold shadow-[0_0_8px_rgba(168,85,247,0.15)]"
                >
                  <Radio className="w-3.5 h-3.5 text-purple-450 animate-pulse" />
                  <span>PROMOTER</span>
                </button>

                {/* RECORD LABEL PORTAL */}
                <button
                  type="button"
                  disabled={!isLabelAllowed}
                  onClick={() => {
                    setUserProfile(prev => ({ ...prev, active_workspace: 'label', account_type: 'industry pro' }));
                    triggerNotification?.("⚡ Switched to Record Label HQ Terminal.");
                  }}
                  className={`text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    isLabelAllowed
                      ? 'hover:bg-amber-955/35 border border-transparent hover:border-amber-500/30 text-amber-500 hover:text-white cursor-pointer active:scale-95'
                      : 'opacity-40 border border-transparent text-zinc-650 cursor-not-allowed'
                  }`}
                  title={isLabelAllowed ? "Switch to Record Label Headquarters" : "Access Restricted: Register multi-role clearance to unlock"}
                >
                  <Globe className="w-3.5 h-3.5 text-amber-500" />
                  <span>LABEL {!isLabelAllowed && <Lock className="w-2.5 h-2.5 text-amber-400 inline ml-0.5" />}</span>
                </button>

                {/* FAN PORTAL */}
                <button
                  type="button"
                  onClick={() => {
                    setUserProfile(prev => ({ ...prev, active_workspace: 'fan_only', account_type: 'fan' }));
                    triggerNotification?.("⚡ Switched to Fan & Listener Portal.");
                  }}
                  className="col-span-2 text-[9px] font-mono font-black uppercase tracking-wider px-2.5 py-2 rounded-xl border border-rose-500/35 hover:border-rose-500/60 bg-rose-955/10 hover:bg-rose-950/25 text-rose-300 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  title="Switch to active Fan & Listener Portal"
                >
                  <User className="w-3.5 h-3.5 text-rose-400" />
                  <span>FAN PORTAL 🎟️</span>
                </button>
              </div>

              {/* Red pill style SIGN OUT button */}
              <button 
                onClick={onLogout}
                className="px-8 py-2.5 rounded-full border border-red-500/40 bg-red-950/40 hover:bg-red-600 hover:text-white text-red-400 font-mono text-[10px] uppercase font-black tracking-widest transition-all cursor-pointer shadow-[0_0_12px_rgba(239,68,68,0.35)] flex items-center gap-2 active:scale-95 mt-2"
                title="Disconnect active console session"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>SIGN OUT</span>
              </button>
            </div>
          </div>
        </div>
        )}

        {/* Tab Selection separated into its own styled card */}
        <div className="border-2 border-white/20 p-[2.2px] bg-black/60 shadow-2xl relative shrink-0 rounded-[1.5rem] overflow-hidden">
          <div className="slate-stone-card p-4 sm:p-5 relative overflow-hidden z-10 text-left">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2.5 p-1.5 bg-black/45 rounded-xl border border-yellow-950/40" id="promoter-navigation-tabs">
              <button
                type="button"
                onClick={() => { setActivePortalTab('routing'); playLocalBeep(520, 'sine', 0.015); }}
                className={`px-4 py-3 rounded-lg text-[11.5px] uppercase font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                  activePortalTab === 'routing'
                    ? 'bg-gradient-to-r from-zinc-950 via-yellow-950/35 to-zinc-950 border-yellow-500/60 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] font-bold'
                    : 'border-transparent text-zinc-400 hover:text-yellow-400 hover:bg-yellow-950/10'
                }`}
              >
                <span className={activePortalTab === 'routing' ? 'animate-pulse text-yellow-400' : 'text-zinc-650'}>📅</span>
                Calendar & Beacons
              </button>

              <button
                type="button"
                onClick={() => { setActivePortalTab('workspace'); playLocalBeep(580, 'sine', 0.015); }}
                className={`px-4 py-3 rounded-lg text-[11.5px] uppercase font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                  false /* activePortalTab === 'workspace' */
                    ? 'bg-gradient-to-r from-zinc-950 via-yellow-950/35 to-zinc-950 border-yellow-500/60 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] font-bold'
                    : 'border-transparent text-zinc-400 hover:text-yellow-400 hover:bg-yellow-950/10'
                }`}
              >
                <span className={false /* activePortalTab === 'workspace' */ ? 'animate-pulse text-yellow-400' : 'text-zinc-650'}>🛠️</span>
                Immersive Workspace
              </button>

              <button
                type="button"
                onClick={() => { 
                  setActivePortalTab('offers'); 
                  setUnreadOffersCount(0);
                  playLocalBeep(640, 'sine', 0.015); 
                }}
                className={`px-4 py-3 rounded-lg text-[11.5px] uppercase font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                  activePortalTab === 'offers'
                    ? 'bg-gradient-to-r from-zinc-950 via-yellow-950/35 to-zinc-950 border-yellow-500/60 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] font-bold'
                    : 'border-transparent text-zinc-400 hover:text-yellow-400 hover:bg-yellow-950/10'
                }`}
              >
                <span className={activePortalTab === 'offers' ? 'animate-pulse text-yellow-400' : 'text-zinc-650'}>📜</span>
                Contracts Hub
                {unreadOffersCount > 0 && (
                  <span className="relative flex h-4 w-4 items-center justify-center shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-600 text-black font-extrabold text-[8.5px] items-center justify-center">
                      {unreadOffersCount}
                    </span>
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setActivePortalTab('sales'); playLocalBeep(700, 'sine', 0.015); }}
                className={`px-4 py-3 rounded-lg text-[11.5px] uppercase font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border ${
                  activePortalTab === 'sales'
                    ? 'bg-gradient-to-r from-zinc-950 via-yellow-950/35 to-zinc-950 border-yellow-500/60 text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)] font-bold'
                    : 'border-transparent text-zinc-400 hover:text-yellow-400 hover:bg-yellow-950/10'
                }`}
              >
                <span className={activePortalTab === 'sales' ? 'animate-pulse text-yellow-400' : 'text-zinc-650'}>🎟️</span>
                Ticket Sales Tracker
              </button>

              <button
                type="button"
                onClick={() => {
                  if (setPortalActiveTab) {
                    setPortalActiveTab('social');
                  } else {
                    try {
                      window.dispatchEvent(new CustomEvent('nexus:navigate-tab', { detail: 'social' }));
                    } catch (e) {}
                  }
                  playLocalBeep(740, 'sine', 0.015);
                }}
                className="px-4 py-3 rounded-lg text-[11.5px] uppercase font-black tracking-widest transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer border border-transparent text-zinc-400 hover:text-yellow-400 hover:bg-yellow-950/10"
              >
                <span className="text-zinc-500 hover:text-yellow-400">💬</span>
                Alliance Network
              </button>
            </div>
          </div>
        </div>

        </>)}
        {/* ========================================================================= */}
        {/* INTERACTIVE MULTI-VENUE CALENDAR SYSTEM FOR PROMOTERS                     */}
        {/* ========================================================================= */}
        {(activePortalTab === 'routing' || showOnlyCalendar) && !showOnlyRoutingAndAvailability && (
          <div 
            id="promoter-interactive-calendar-section"
            className="w-full bg-[#090b0e]/95 border-2 border-yellow-500/30 rounded-2xl p-4 sm:p-6 backdrop-blur-sm relative overflow-hidden flex flex-col gap-6 yellow-pulse-glow hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] transition-all duration-300"
          >
            {/* Subtle Ambient Radial Highlight */}
            <div className="absolute inset-0 bg-[radial-gradient(#a855f705_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
          <div className="absolute top-0 right-10 w-[200px] h-[200px] rounded-full bg-purple-500/5 blur-[80px] pointer-events-none" />

          {/* Header Bar: Status & Venue Selector */}
          <div className="flex flex-col items-center justify-center gap-3 border-b border-zinc-900 pb-4 relative z-10 w-full text-center">
            <div className="flex flex-col gap-2 items-center mx-auto w-full justify-center">
              {/* Swipe Switcher Indicators & Left/Right Arrows moved up */}
              {activeAllVenues.length > 0 ? (
                <div className="flex items-center justify-center gap-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedVenueIndex > 0) {
                        setSelectedVenueIndex(p => p - 1);
                        playLocalBeep(650, 'sine', 0.03);
                      }
                    }}
                    disabled={selectedVenueIndex === 0}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md select-none touch-manipulation min-h-[44px] flex items-center justify-center"
                    title="Previous stage"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex flex-col items-center min-w-[180px] sm:min-w-[360px] text-center px-3 sm:px-5 bg-zinc-950 border border-zinc-900 rounded-xl py-2 relative overflow-hidden shadow-lg shadow-purple-950/20">
                    <span className="text-[8px] sm:text-[9px] text-zinc-500 font-bold uppercase leading-none font-mono tracking-wider">
                      ACTIVE VENUE ({selectedVenueIndex + 1} of {activeAllVenues.length})
                    </span>
                    <span className="text-xs sm:text-lg font-black text-[#d8b4fe] uppercase font-mono tracking-wide mt-1.5 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] sm:max-w-[320px]">
                      {activeAllVenues[selectedVenueIndex].name}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (selectedVenueIndex < activeAllVenues.length - 1) {
                        setSelectedVenueIndex(p => p + 1);
                        playLocalBeep(650, 'sine', 0.03);
                      }
                    }}
                    disabled={selectedVenueIndex === activeAllVenues.length - 1}
                    className="p-2 px-3.5 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-md select-none touch-manipulation min-h-[44px] flex items-center justify-center"
                    title="Next stage"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-zinc-550 uppercase font-bold font-mono">0 Properties loaded</span>
              )}

              {/* Multi-stage sync direct text moved under the venue selector */}
              <span className="text-[9px] text-yellow-400 font-mono leading-none tracking-wider animate-pulse uppercase font-black mt-1 text-center w-full block">
                ● MULTI-STAGE SYNC DIRECT
              </span>
            </div>
          </div>

            <div className="flex flex-col gap-6 relative z-10">
                
                {/* SWIPEABLE CALENDAR COLUMN */}
                <div 
                  className="w-full flex flex-col gap-3"
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                >
                {/* Month Picker Header */}
                <div className="w-full flex items-center justify-between bg-zinc-950 border border-zinc-900 rounded-xl p-2 font-mono">
                  <button
                    type="button"
                    onClick={calPreviousMonth}
                    className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded border border-zinc-800 transition-all cursor-pointer"
                  >
                    ◀
                  </button>
                  <span className="text-[11px] font-black tracking-widest text-white">
                    {monthNames[calendarCurrentDate.getMonth()]} {calendarCurrentDate.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={calNextMonth}
                    className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded border border-zinc-800 transition-all cursor-pointer"
                  >
                    ▶
                  </button>
                </div>

                {/* Weekday Labels */}
                <div className="grid grid-cols-7 gap-1 text-center font-mono text-[9px] font-black text-zinc-500 uppercase tracking-widest py-1">
                  <span>Sun</span>
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu</span>
                  <span>Fri</span>
                  <span>Sat</span>
                </div>

                {/* Calendar Days Matrix */}
                <div className="grid grid-cols-7 gap-1">
                  {activeCalendarDays.map((day, idx) => {
                    if (!day.date) {
                      return <div key={`empty-cal-${idx}`} className="aspect-square bg-transparent rounded" />;
                    }

                    const isCurrentDay = day.date.toDateString() === new Date().toDateString();
                    const isSelected = day.date.toDateString() === calendarSelectedDate.toDateString();
                    const dayStr = day.date.getDate();

                    // Count of events
                    const hasShowValue = day.hasShow;
                    const eventCount = day.events.length;

                    // Compute styling based on statuses
                    // Any date that has show fully confirmed should be filled in green, 
                    // if a show has been started but still being built/modified that date should be filled in amber. 
                    // Festival dates can be purple and in progress festival dates red.
                    let statusClasses = 'border-zinc-900 text-zinc-400 hover:bg-zinc-900/60 bg-zinc-950/40';
                    let labelIndicator = '';

                    if (hasShowValue && eventCount > 0) {
                      const festivalEvents = day.events.filter(e => {
                        return (
                          e.original?.show_type === 'festival' || 
                          e.original?.festival_name || 
                          (e.name && e.name.toLowerCase().includes('fest'))
                        );
                      });

                      if (festivalEvents.length > 0) {
                        // It is a festival day
                        const inProgressFestival = (festivalEvents || []).some(e => e.status !== 'accepted' && e.status !== 'Active');
                        if (inProgressFestival) {
                          // In progress festival dates: red
                          statusClasses = 'bg-red-950/80 border-red-500/85 text-red-350 font-extrabold shadow-[0_0_12px_rgba(239,68,68,0.2)] hover:bg-red-900/80';
                          labelIndicator = '🎪';
                        } else {
                          // Confirmed festival dates: purple
                          statusClasses = 'bg-purple-950/80 border-purple-500/85 text-purple-200 font-extrabold shadow-[0_0_12px_rgba(168,85,247,0.2)] hover:bg-purple-900/80';
                          labelIndicator = '💜';
                        }
                      } else {
                        // Standard show day
                        const hasConfirmedShow = (day.events || []).some(e => e.status === 'accepted' || e.status === 'Active');
                        if (hasConfirmedShow) {
                          // fully confirmed: green
                          statusClasses = 'bg-emerald-950/80 border-emerald-500/85 text-emerald-300 font-extrabold shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:bg-[#064e3b]/80';
                          labelIndicator = '💚';
                        } else {
                          // started but still being built (or in build/draft/pending/local_lineup/renegotiating): amber/gold
                          statusClasses = 'bg-amber-950/80 border-amber-500/80 text-amber-300 font-bold shadow-[0_0_12px_rgba(245,158,11,0.15)] hover:bg-amber-900/80';
                          labelIndicator = '⏳';
                        }
                      }
                    }

                    if (isSelected) {
                      statusClasses += ' ring-2 ring-white ring-offset-2 ring-offset-black scale-[1.03] z-10';
                    }
                    if (isCurrentDay) {
                      statusClasses += ' border-white text-white font-extrabold shadow-[inset_0_0_8px_rgba(255,255,255,0.25)]';
                    }

                    return (
                      <button
                        key={`cal-day-${day.date.getMonth()}-${idx}`}
                        type="button"
                        onClick={() => {
                          setCalendarSelectedDate(day.date!);
                          setDateProfileExpanded(true); // Auto expands the date profile on click!
                          playLocalBeep(600, 'sine', 0.02);
                        }}
                        className={`aspect-square hover:scale-[1.03] transition-all flex flex-col justify-between p-1.5 text-xs rounded border cursor-pointer select-none relative overflow-hidden ${statusClasses}`}
                      >
                        <span className="leading-none text-[10px] font-mono font-bold tracking-tight">
                          {dayStr}
                        </span>
                        
                        {eventCount > 0 && (
                          <div className="flex items-center justify-between w-full mt-1">
                            <span className="text-[7.5px] font-black uppercase text-zinc-400 leading-none shrink-0 border border-zinc-800 bg-black/60 px-1 py-0.5 rounded scale-90">
                              {eventCount}x
                            </span>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse opacity-80" />
                          </div>
                        )}
                        
                        {labelIndicator && (
                          <span className="absolute top-0.5 right-0.5 text-[8px] opacity-75">{labelIndicator}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Swipe Guidance Bar helper */}
                <div className="text-center text-[9px] text-zinc-650 font-mono uppercase tracking-widest mt-1">
                  💡 Swipe left or right on the calendar grid to flip active staging zones!
                </div>

                {/* Calendar Color Code Key Legend */}
                <div className="bg-black/45 border border-zinc-900/70 rounded-xl p-3 mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-2.5 text-[9px] font-mono uppercase tracking-widest text-zinc-450">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-[#064e3b]/80 border border-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.3)] shrink-0" />
                    <span className="text-yellow-400">Single Show = Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-amber-950/80 border border-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.3)] shrink-0" />
                    <span className="text-amber-300">Single Show = Draft/ In-Progress</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-purple-950/80 border border-purple-500 shadow-[0_0_6px_rgba(168,85,247,0.3)] shrink-0" />
                    <span className="text-purple-200">Festival = Confirmed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded bg-red-950/80 border border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.3)] shrink-0" />
                    <span className="text-red-300">Festival = Draft/ In-Progress</span>
                  </div>
                </div>
              </div>

              {/* DETAILED EVENT DAY SHEET INFO PANEL */}
              <div className="w-full flex flex-col gap-4">
                
                {/* Selected Day Event List */}
                <div className={`bg-zinc-950 p-4 rounded-xl flex-grow flex flex-col gap-3 min-h-0 transition-all duration-500 border ${
                  dateProfileExpanded 
                    ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.35)] animate-[pulse_2.5s_infinite]' 
                    : 'border-zinc-910'
                }`}>
                  
                  {/* Selected Target Date Label Banner */}
                  <div 
                    onClick={() => {
                      setDateProfileExpanded(!dateProfileExpanded);
                      playLocalBeep(520, 'sine', 0.02);
                    }}
                    className="flex items-center justify-between border-b border-zinc-900 pb-2 cursor-pointer group select-none hover:text-yellow-400 transition-colors"
                  >
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest font-mono flex items-center gap-1.5">
                      <span className="text-[7.5px] font-bold text-zinc-500">{dateProfileExpanded || selectedCalendarShow !== null ? '▼' : '▶'}</span>
                      <span style={{ fontSize: '10px' }}>📅 DATE PROFILE</span>
                    </span>
                    <span className="text-[10px] font-black text-white font-mono bg-zinc-905 px-2 py-0.5 rounded border border-zinc-800 transition-colors group-hover:bg-zinc-800">
                      {calendarSelectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>

                  {(dateProfileExpanded || selectedCalendarShow !== null) && (
                    <div className="space-y-3 flex-grow flex flex-col gap-3 animate-slide-down">
                      {/* Filtered events list on selected date */}
                      {(() => {
                        const isoSelectedStr = `${calendarSelectedDate.getFullYear()}-${String(calendarSelectedDate.getMonth() + 1).padStart(2, '0')}-${String(calendarSelectedDate.getDate()).padStart(2, '0')}`;
                        const targetEvents = activeCalendarDays.find(d => d.date && d.date.toDateString() === calendarSelectedDate.toDateString())?.events || [];

                        if (targetEvents.length === 0) {
                          return (
                            <div className="py-8 flex flex-col items-center justify-center text-center space-y-2 flex-grow">
                              <span className="text-2xl opacity-60">💤</span>
                              <div>
                                <h4 className="text-[10px] font-black text-zinc-500 uppercase font-mono">Stage is Vacant</h4>
                                <p style={{ marginLeft: '31px', fontSize: '10px' }} className="text-[9px] text-zinc-650 font-mono mt-1 max-w-[200px]">
                                  Excellent day to schedule routing beacons or send band contracts!
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setPlannerEventName('');
                                    setPlannerBandId(bands[0]?.id || 'void_walkers');
                                    setPlannerGuarantee('2000');
                                    setPlannerNotes('');
                                    setPlannerShowType('standard');
                                    setActivePortalTab('workspace');
                                    playLocalBeep(650, 'sine', 0.03);
                                  }}
                                  style={{ width: '269.626px', fontSize: '11.5px', backgroundColor: '#facc15', color: '#000000' }}
                                  className="mt-3.5 px-3.5 py-2 border border-yellow-500/40 hover:border-yellow-400 text-black font-black rounded-xl uppercase font-mono tracking-widest transition-all cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5"
                                >
                                  + Add or Edit show/ fest on the calendar
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div className="space-y-3 flex-grow overflow-y-auto max-h-[260px] pr-1">
                            {targetEvents.map((ev, idx) => {
                              const isBooked = ev.status === 'accepted' || ev.eventType === 'global_show';
                              
                              // Look up band specific notes/guarantees
                              const guaranteeAmount = ev.guarantee || 0;
                              const showNotes = ev.original?.notes || ev.original?.additional_notes || ev.original?.renegotiation_notes || 'No custom riders attached';
                              
                              // Determine brand label
                              let brandingLabel = 'Draft Event';
                              let brandingColor = 'bg-zinc-900 text-zinc-450 border-zinc-850';
                              if (ev.eventType === 'global_show') {
                                brandingLabel = 'Sync Show';
                                brandingColor = 'bg-sky-950 text-sky-400 border-sky-500/30';
                              } else if (ev.eventType === 'offer') {
                                brandingLabel = isBooked ? 'Booked Contract' : `Contract: ${ev.original?.status?.toUpperCase()}`;
                                brandingColor = isBooked ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' : 'bg-amber-950/60 text-amber-555 border-amber-500/30';
                              }

                              return (
                                <div 
                                  key={`${ev.eventType}-${ev.id}-${idx}`}
                                  onClick={() => {
                                    setSelectedCalendarShow(ev);
                                    playLocalBeep(700, 'sine', 0.04);
                                  }}
                                  className="group p-3 border border-zinc-90 w-full rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-700 transition-all cursor-pointer text-left flex flex-col gap-2 relative overflow-hidden"
                                >
                                  <div className="flex items-center justify-between border-b border-zinc-900/60 pb-1.5">
                                    <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${brandingColor}`}>
                                      {brandingLabel}
                                    </span>
                                    {guaranteeAmount > 0 && (
                                      <span className="text-[10px] font-bold text-white font-mono bg-[#111] border border-zinc-850 px-1.5 py-0.5 rounded">
                                        💰 ${guaranteeAmount.toLocaleString()} Base
                                      </span>
                                    )}
                                  </div>

                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-extrabold text-white uppercase font-mono tracking-tight group-hover:text-yellow-400 transition-colors truncate font-sans">
                                      {ev.name}
                                    </span>
                                    {ev.original?.band_name && (
                                      <span className="text-[9px] text-zinc-400 font-mono mt-0.5 uppercase">
                                        🎸 artist: <strong className="text-zinc-200">{ev.original.band_name}</strong>
                                      </span>
                                    )}
                                    {(ev.stage_name || ev.time_slot) && (
                                      <span className="text-[8.5px] text-zinc-400 font-mono mt-0.5 uppercase flex flex-wrap gap-1.5">
                                        {ev.stage_name && <span>🏛️ Stage: <strong className="text-orange-400">{ev.stage_name}</strong></span>}
                                        {ev.time_slot && <span>⏳ Slot: <strong className="text-sky-400">{ev.time_slot.toUpperCase()}</strong></span>}
                                      </span>
                                    )}
                                  </div>

                                  {/* Times Row & Swipe Click hint */}
                                  <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 pt-1 border-t border-zinc-915">
                                    <span>
                                      🚪 doors: {ev.times?.doors} • 🎸 set: {ev.times?.set_time}
                                    </span>
                                    <span className="text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity font-bold uppercase tracking-wider text-[8px]">
                                      READ SPEC 🔍
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Empty state description guide if utilizing the fallback venue stage */}
                  {activeAllVenues[selectedVenueIndex]?.isFallback && (
                    <div className="mt-4 p-4 bg-yellow-950/15 border border-yellow-500/20 rounded-xl flex items-start gap-3 text-left relative z-10 font-mono animate-fade-in shadow-inner">
                      <span className="text-lg shrink-0 mt-0.5">🏟️</span>
                      <div>
                        <h4 className="text-[11px] font-black text-yellow-400 uppercase tracking-wider">No Custom Managed Stages Saved</h4>
                        <p className="text-[10px] text-zinc-400 mt-1 leading-relaxed">
                          You haven't specified a Home Venue profile or portfolio stages yet. Tap the <strong className="text-white hover:text-yellow-400 underline">Gear Settings icon</strong> at the top right of your Profile card to specify your home venue coordinates and unlock professional stage scheduling panels!
                        </p>
                      </div>
                    </div>
                  )}

                </div>

              </div>
              
            </div>

            {/* SEPARATE MASTER MODAL FOR MASTER ALL SHOWS & DRAFTS */}
            {showAllShowsDraftsModal && (
              <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[110] flex items-center justify-center p-3 sm:p-5 font-mono">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full max-w-2xl bg-[#090b0e] border-2 border-yellow-500/30 rounded-2xl overflow-hidden shadow-2xl relative block flex flex-col max-h-[85vh] yellow-pulse-glow"
                >
                  {/* Header Accents Overlay */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-500 via-[#ffd700] to-amber-600" />
                  
                  {/* Header padding and title info */}
                  <div className="p-4 sm:p-6 border-b border-zinc-900 bg-zinc-950/80 flex flex-col items-center justify-center text-center relative shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAllShowsDraftsModal(false);
                        if (typeof playLocalBeep === 'function') {
                          playLocalBeep(400, 'sine', 0.05);
                        }
                      }}
                      className="absolute top-4 right-4 p-1.5 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 rounded-lg font-black text-[9px] sm:text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer shadow-md z-20"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Close</span>
                    </button>

                    <div className="flex flex-col items-center text-center">
                      <span className="text-[9.5px] font-bold text-yellow-500 uppercase tracking-widest leading-none mb-1.5">
                        MASTER EVENTS HUB
                      </span>
                      <h3 className="text-[28px] font-bold text-yellow-400 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(234,179,8,0.65)] font-mono leading-tight">
                        All Shows & Drafts
                      </h3>
                      <p className="text-[10px] text-zinc-450 font-sans leading-relaxed mt-2 max-w-md text-center">
                        Access and manage all active shows, proposals, scheduled lines, and templates. Drag items left to permanently delete or right to customize in your workspace.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-grow flex flex-col min-h-0 text-left">
                    {/* Search Bar Input */}
                    <div className="relative w-full shrink-0">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
                        <Search className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        value={showSearchQuery}
                        onChange={(e) => setShowSearchQuery(e.target.value)}
                        placeholder="Search shows, drafts or venues..."
                        className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-900 focus:border-emerald-500 focus:outline-none focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-xl text-[10.5px] font-mono text-white placeholder-zinc-650 uppercase tracking-widest transition-all"
                      />
                      {showSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setShowSearchQuery('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-white text-base"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    {/* Swipe Help Microtext */}
                    <div className="text-[8px] font-mono text-zinc-555 uppercase tracking-widest text-left select-none leading-none shrink-0">
                      [ swipe left to delete / swipe right to edit ]
                    </div>

                    {/* List Container */}
                    <div className="space-y-2.5 flex-grow overflow-y-auto pr-1">
                      {(() => {
                        const filtered = unifiedPromoterShows.filter(item => {
                          if (hiddenShowIds.has(item.id)) return false;
                          if (!showSearchQuery) return true;
                          const q = showSearchQuery.toLowerCase();
                          return (
                            (item?.name || '').toLowerCase().includes(q) ||
                            (item.venueName || '').toLowerCase().includes(q) ||
                            (item.dateString || '').toLowerCase().includes(q) ||
                            (item.eventType || '').toLowerCase().includes(q) ||
                            (item.status || '').toLowerCase().includes(q)
                          );
                        });

                        if (filtered.length === 0) {
                          return (
                            <div className="p-12 border-2 border-dashed border-zinc-900 rounded-2xl text-center space-y-3 font-mono">
                              <span className="text-3xl opacity-40">📂</span>
                              <div>
                                <h4 className="text-xs font-black text-zinc-400 uppercase tracking-wider">No matching records</h4>
                                <p className="text-[10px] text-zinc-650 mt-1 max-w-xs mx-auto">
                                  Adjust your search query or generate new scheduled events inside your calendar staging lanes.
                                </p>
                              </div>
                            </div>
                          );
                        }

                        return filtered.map((ev, index) => {
                          const showDate = ev.dateString ? new Date(ev.dateString + 'T00:00:00') : new Date();
                          const dateFormatted = showDate.toLocaleDateString(undefined, {
                             month: 'short',
                             day: 'numeric',
                             year: 'numeric'
                          }).toUpperCase();

                          const isFestival = ev.original?.show_type === 'festival' || 
                                             ev.original?.festival_name || 
                                             (ev.name && ev.name.toLowerCase().includes('fest'));
                          const isConfirmed = ev.status === 'Active' || ev.status === 'accepted';

                          let cardBorderClass = 'border-zinc-800 hover:border-zinc-700 bg-zinc-950';
                          let statusBadge = 'bg-zinc-900 text-zinc-400 border-zinc-800';
                          let statusText = ev.status;

                          if (isFestival) {
                            if (isConfirmed) {
                              cardBorderClass = 'border-purple-500/35 hover:border-purple-500/70 bg-[#160e24] shadow-[0_0_8px_rgba(168,85,247,0.05)]';
                              statusBadge = 'bg-purple-950/45 text-purple-300 border-purple-500/20';
                              statusText = '🎪 CONFIRMED FEST';
                            } else {
                              cardBorderClass = 'border-red-500/35 hover:border-red-500/70 bg-[#240e0e] shadow-[0_0_8px_rgba(239,68,68,0.05)]';
                              statusBadge = 'bg-red-950/45 text-red-350 border-red-500/20';
                              statusText = '🎪 FESTIVAL DRAFT';
                            }
                          } else {
                            if (isConfirmed) {
                              cardBorderClass = 'border-emerald-500/35 hover:border-emerald-500/70 bg-[#0e2416] shadow-[0_0_8px_rgba(16,185,129,0.05)]';
                              statusBadge = 'bg-emerald-950/45 text-emerald-300 border-emerald-500/20';
                              statusText = '💚 CONFIRMED SHOW';
                            } else {
                              cardBorderClass = 'border-amber-500/35 hover:border-amber-500/70 bg-[#21160d] shadow-[0_0_8px_rgba(245,158,11,0.05)]';
                              statusBadge = 'bg-amber-950/45 text-amber-300 border-amber-500/20';
                              statusText = '⏳ SHOW DRAFT';
                            }
                          }

                          return (
                            <div 
                              key={`modal-show-wrap-${ev.eventType}-${ev.id}-${index}`} 
                              className="relative overflow-hidden w-full rounded-xl bg-zinc-950 font-mono"
                            >
                              {/* Blue Pencil Reveal Panel */}
                              <div 
                                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-blue-600 to-blue-900/10 flex items-center justify-start pl-4 text-white rounded-l-xl pointer-events-none z-0 transition-opacity duration-150"
                                style={{ opacity: draggingShowId === ev.id ? 1 : 0 }}
                              >
                                <div className="flex items-center gap-2">
                                  <Pencil className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
                                  <span className="text-[9px] font-black font-mono uppercase tracking-widest text-blue-200">
                                    WORKSPACE
                                  </span>
                                </div>
                              </div>

                              {/* Red Trash Reveal Panel */}
                              <div 
                                className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-red-600/80 to-red-950/10 flex items-center justify-end pr-4 text-white rounded-r-xl pointer-events-none z-0 transition-opacity duration-150"
                                style={{ opacity: draggingShowId === ev.id ? 1 : 0 }}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-black font-mono uppercase tracking-widest text-rose-200">
                                    PERMANENT PURGE
                                  </span>
                                  <Trash className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                                </div>
                              </div>

                              {/* Draggable Content Card */}
                              <motion.div
                                key={`modal-show-${ev.eventType}-${ev.id}-${index}`}
                                onClick={() => {
                                  handleOpenShowInWorkspace(ev);
                                  setShowAllShowsDraftsModal(false);
                                }}
                                className={`p-3 border w-full rounded-xl transition-colors text-left flex flex-col gap-1.5 relative overflow-hidden group ${cardBorderClass} cursor-pointer active:cursor-grabbing z-10`}
                                drag="x"
                                dragConstraints={{ left: 0, right: 0 }}
                                dragElastic={0.7}
                                onDragStart={() => setDraggingShowId(ev.id)}
                                onDragEnd={(e, info) => {
                                  setDraggingShowId(null);
                                  if (info.offset.x < -80) {
                                    if (typeof playLocalBeep === 'function') {
                                      playLocalBeep(220, 'sawtooth', 0.08);
                                    }
                                    setShowShowDeleteConfirm(ev);
                                  } else if (info.offset.x > 80) {
                                    if (typeof playLocalBeep === 'function') {
                                      playLocalBeep(520, 'sine', 0.04);
                                    }
                                    handleOpenShowInWorkspace(ev);
                                    setShowAllShowsDraftsModal(false);
                                  }
                                }}
                              >
                                <div className="flex items-center justify-between gap-2 relative z-10">
                                  <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${statusBadge}`}>
                                    {statusText}
                                  </span>
                                  
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleOpenShowInWorkspace(ev);
                                      setShowAllShowsDraftsModal(false);
                                    }}
                                    className="px-2 py-0.5 bg-emerald-950/45 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/25 hover:border-emerald-500 text-[8px] font-extrabold uppercase rounded-md font-mono tracking-widest transition-all cursor-pointer shadow-sm shadow-black/10 z-20"
                                  >
                                    OPEN WORKSPACE ⚙️
                                  </button>
                                </div>

                                <div className="flex items-start justify-between gap-4 min-w-0 relative z-10">
                                  <div className="flex flex-col min-w-0 flex-grow">
                                    <span className="text-[10px] font-black text-white uppercase font-mono tracking-tight group-hover:text-emerald-400 transition-colors truncate">
                                      {ev.name}
                                    </span>
                                    <span className="text-[8px] text-zinc-455 font-mono mt-0.5 uppercase tracking-wide truncate">
                                      🏟️ {ev.venueName}
                                    </span>
                                  </div>
                                  <span className="text-[8px] font-mono text-zinc-400 uppercase font-black bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded shrink-0 self-center">
                                    {dateFormatted}
                                  </span>
                                </div>
                              </motion.div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                </motion.div>
              </div>
            )}

          {/* SIMULATED MODAL FOR CALENDAR DATE EXPANDED SHOW DETAILS */}
          {selectedCalendarShow && (
            <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[60] flex items-center justify-center p-3 sm:p-5 font-mono">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-[#0C1014] border border-purple-900/80 rounded-2xl overflow-hidden shadow-2xl relative block"
              >
                {/* Header Accents Overlay */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-[#00ffcc] to-purple-800" />
                
                {/* Header padding and title info */}
                <div className="p-4 sm:p-6 border-b border-zinc-900 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📋</span>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold text-[#00ffcc] uppercase tracking-widest leading-none">
                        STAGE AGREEMENT PROTOCOL
                      </span>
                      <span className="text-xs font-black text-white uppercase tracking-tight mt-1 truncate max-w-[280px]">
                        {selectedCalendarShow.name}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCalendarShow(null);
                        
                        // Populate planner fields
                        setPlannerEventName(selectedCalendarShow.name || `${activeAllVenues[selectedVenueIndex]?.name || 'Venue'} Showcase`);
                        
                        // Construct planner lineup from the show
                        if (selectedCalendarShow.eventType === 'lineup' || selectedCalendarShow.eventType === 'global_show') {
                           // Try to restore lineup items if any exist
                           const items = selectedCalendarShow.original?.stages || []; // or however they are stored
                           // For now, let's just make sure there is at least one entry for the main bill
                           const lineupItems = selectedCalendarShow.original?.lineup ? selectedCalendarShow.original.lineup : [{
                               id: String(Date.now()),
                               band_id: selectedCalendarShow.original?.band_id || '',
                               band_name: selectedCalendarShow.original?.band_name || selectedCalendarShow.name || 'Target Band',
                               day: 1,
                               status: selectedCalendarShow.status || 'pending',
                               guarantee_amount: Number(selectedCalendarShow.guarantee || 0),
                               set_time: selectedCalendarShow.times?.set_time || '21:00',
                               load_in_time: selectedCalendarShow.times?.load_in || '16:00',
                               primary_contact_method: 'email' as const,
                               contact_details: '',
                               travel: '',
                               rider: '',
                               notes: ''
                           }];
                           setPlannerLineup(lineupItems);
                        } else if (selectedCalendarShow.eventType === 'offer') {
                           setPlannerLineup([{
                               id: String(Date.now()),
                               band_id: selectedCalendarShow.original?.band_id || '',
                               band_name: selectedCalendarShow.original?.band_name || 'Target Band',
                               day: 1,
                               status: selectedCalendarShow.status || 'pending',
                               guarantee_amount: Number(selectedCalendarShow.guarantee || 0),
                               set_time: selectedCalendarShow.times?.set_time || '21:00',
                               load_in_time: selectedCalendarShow.times?.load_in || '16:00',
                               primary_contact_method: 'email' as const,
                               contact_details: '',
                               travel: '',
                               rider: '',
                               notes: ''
                           }]);
                           setPlannerShowType('standard');
                        }
                        
                        setPlannerNotes(selectedCalendarShow.original?.notes || selectedCalendarShow.original?.additional_notes || '');
                        playLocalBeep(650, 'sine', 0.03);
                        setActivePortalTab('workspace');
                      }}
                      className="p-1 px-3 text-emerald-400 hover:text-white border border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-950/20 hover:bg-emerald-900/40 rounded-lg font-black text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-md"
                    >
                      EDIT PROTOCOL
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCalendarShow(null);
                        playLocalBeep(400, 'sine', 0.05);
                      }}
                      className="p-1 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 rounded-lg pr-2 font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Close
                    </button>
                  </div>
                </div>

                <div className="p-5 sm:p-6 space-y-4 max-h-[65vh] overflow-y-auto">
                  
                  {/* Row 1: Lineup, status & fee */}
                  <div className="grid grid-cols-2 gap-3 bg-zinc-950/70 p-3 rounded-lg border border-zinc-900 text-[10px] uppercase">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-zinc-550 font-bold text-[8px]">CONTRACTED BAND:</span>
                      <span className="text-white font-extrabold text-[11px] font-mono tracking-tight text-purple-400">
                        {selectedCalendarShow.original?.band_name || 'N/A: Multi-bill lineup'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-0.5 text-right">
                      <span className="text-zinc-550 font-bold text-[8px]">COMPLIANCE STATUS:</span>
                      <span className="text-white font-black text-[11px] underline decoration-purple-600">
                        {selectedCalendarShow.status?.toUpperCase() || 'ACCEPTED / ACTIVE'}
                      </span>
                    </div>
                  </div>

                  {/* Physical Location and Designated Stage */}
                  <div className="flex flex-col gap-1.5 bg-purple-950/10 border border-purple-900/25 p-3 rounded-lg text-[10px] uppercase">
                    <span className="text-zinc-500 font-bold text-[8px] tracking-wider uppercase">
                      📍 Physical Venue & Performance Space
                    </span>
                    <div className="text-white font-mono flex flex-wrap gap-x-2 items-center leading-none">
                      <span className="font-extrabold text-[#00ffcc]">
                        {selectedCalendarShow.original?.venue_name || selectedCalendarShow.venue || 'Home Venue'}
                      </span>
                      {selectedCalendarShow.original?.stage_name && (
                        <>
                          <span className="text-zinc-700">|</span>
                          <span className="text-purple-300 bg-purple-950/40 border border-purple-500/25 px-1.5 py-0.5 rounded text-[8.5px] font-bold">
                            🏛️ STAGE: {selectedCalendarShow.original.stage_name}
                          </span>
                        </>
                      )}
                      <span className="text-zinc-700">|</span>
                      <span className="text-zinc-400">
                        {selectedCalendarShow.original?.city || 'Austin'}
                      </span>
                    </div>
                  </div>

                  {/* Row 2: Financial Terms (guarantees) */}
                  <div className="p-3 bg-[#111] rounded-lg border border-zinc-900 text-[10px] uppercase space-y-2">
                    <span className="text-zinc-500 font-bold block text-[8px] border-b border-zinc-900 pb-1">
                      💰 AGREED TAX & REVENUE SETTLEMENT
                    </span>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                        <span className="text-zinc-500">GUARANTEE FEE:</span>
                        <strong className="text-[#00ffcc]">
                          ${(selectedCalendarShow.guarantee || 0).toLocaleString()} USD
                        </strong>
                      </div>
                      <div className="flex justify-between items-center bg-zinc-950 p-2 rounded">
                        <span className="text-zinc-500">TIX COMMISS:</span>
                        <strong className="text-white">
                          {selectedCalendarShow.original?.venue_cut_percentage ? `${selectedCalendarShow.original.venue_cut_percentage}% CUT` : '0% FLAT RATE'}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Row 3: Timings Sheet */}
                  <div className="p-3 bg-zinc-950/50 rounded-lg border border-zinc-900 space-y-2">
                    <span className="text-zinc-500 font-bold block text-[8px] uppercase tracking-wider border-b border-zinc-900 pb-1">
                      ⏰ EVENT LOAD-IN / SHOW TIMES
                    </span>
                    <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[9px] uppercase">
                      <div className="bg-zinc-950 p-1.5 rounded">
                        <span className="text-zinc-550 block text-[7.5px]">LOAD-IN</span>
                        <strong className="text-white block mt-0.5">{selectedCalendarShow.times?.load_in}</strong>
                      </div>
                      <div className="bg-zinc-950 p-1.5 rounded">
                        <span className="text-zinc-550 block text-[7.5px]">DOORS Open</span>
                        <strong className="text-white block mt-0.5">{selectedCalendarShow.times?.doors}</strong>
                      </div>
                      <div className="bg-zinc-950 p-1.5 rounded">
                        <span className="text-zinc-550 block text-[7.5px]">CURATED SET</span>
                        <strong className="text-[#00ffcc] block mt-0.5">{selectedCalendarShow.times?.set_time}</strong>
                      </div>
                      <div className="bg-zinc-950 p-1.5 rounded">
                        <span className="text-zinc-550 block text-[7.5px]">CURFEW</span>
                        <strong className="text-red-400 block mt-0.5">{selectedCalendarShow.times?.curfew}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Specific Terms and Notes (attached to specific band bill) */}
                  <div className="p-3 bg-zinc-950/70 rounded-lg border border-zinc-900 text-[10px] space-y-1">
                    <span className="text-zinc-500 font-bold block text-[8px] uppercase tracking-wider">
                      📝 CONTRACT TERMS & RIDERS
                    </span>
                    <p className="text-zinc-300 font-sans leading-relaxed text-xs bg-zinc-900 p-2.5 rounded border border-zinc-850 mt-1 whitespace-pre-wrap max-h-[140px] overflow-y-auto">
                      {(selectedCalendarShow.original?.notes || selectedCalendarShow.original?.additional_notes || selectedCalendarShow.original?.renegotiation_notes) ? (
                        <>
                          {selectedCalendarShow.original.notes && (
                            <div className="mb-2">
                              <span className="text-zinc-450 uppercase text-[8px] font-black font-mono block">Promoter Notes:</span>
                              <span>{selectedCalendarShow.original.notes}</span>
                            </div>
                          )}
                          {selectedCalendarShow.original.renegotiation_notes && (
                            <div className="mb-2">
                              <span className="text-zinc-450 uppercase text-[8px] font-black font-mono block">Renegotiation Terms:</span>
                              <span>{selectedCalendarShow.original.renegotiation_notes}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        'No custom technical specifications or merchandise buyout contract terms attached to this specific show bill. Reverts to default registered venue rider parameters.'
                      )}
                    </p>
                  </div>

                  {/* Quick stats / limitations if any */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-600 font-bold font-mono border-t border-zinc-900 pt-3">
                    <span className="uppercase">📅 EVENT ID: #{selectedCalendarShow.id?.slice(0, 8)}</span>
                    <span className="uppercase">SYSTEM VERIFIED HANDSHAKE ✔</span>
                  </div>

                </div>
              </motion.div>
            </div>
          )}

          {/* SIMULATED MODAL FOR PERMANENT DELETION WARNING */}
          {showShowDeleteConfirm && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[150] flex items-center justify-center p-3 sm:p-5 font-mono">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full max-w-md bg-[#0d0909] border border-red-900/40 rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.25)] relative block text-left"
              >
                {/* Header Accents Overlay */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-655 via-rose-550 to-red-800" />
                
                {/* Warning Content */}
                <div className="p-5 sm:p-6 space-y-6">
                  <div className="flex items-center gap-3 border-b border-red-950/40 pb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                      <AlertTriangle className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-none">
                        PERMANENT DATABASE RESTRUCTURING
                      </span>
                      <span className="text-xs font-black text-rose-100 uppercase tracking-tight mt-1 truncate">
                        CONFIRM SHOW PURGE
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-red-955/10 border border-red-900/30 p-3.5 rounded-xl space-y-2">
                      <span className="text-[10px] text-red-400 font-extrabold block uppercase tracking-wide">
                        TARGET RESOURCE PROFILE:
                      </span>
                      <strong className="text-white text-sm font-black block uppercase leading-snug">
                        {showShowDeleteConfirm.name}
                      </strong>
                      <div className="flex justify-between items-center text-[9px] text-zinc-500 font-bold font-mono">
                        <span className="uppercase">🏛️ {showShowDeleteConfirm.venueName}</span>
                        <span className="uppercase">⏰ {showShowDeleteConfirm.dateString}</span>
                      </div>
                    </div>

                    <div className="p-3 bg-black/40 border border-zinc-900/60 rounded-xl space-y-2">
                      <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                        This action will <strong className="text-white">permanently destroy</strong> this Draft/Show from your offline local cache database and cloud sync matrix. All associated lineup billing sheets, budget cards, and show specifications will look completely empty or be permanently removed.
                      </p>
                      <div className="p-2 border border-red-900/30 bg-red-950/20 text-[9.5px] rounded-lg text-red-300 font-black uppercase tracking-wider flex items-center gap-2">
                        <span>🚨 WARNING:</span>
                        <span>THIS OPERATION CANNOT BE UNDONE!</span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowShowDeleteConfirm(null);
                        if (typeof playLocalBeep === 'function') {
                          playLocalBeep(350, 'sine', 0.05);
                        }
                      }}
                      className="w-full sm:w-1/2 py-2.5 bg-zinc-90 w-full bg-zinc-900 hover:bg-zinc-850 hover:text-white text-zinc-350 border border-zinc-800 text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer text-center"
                    >
                      ABORT OPERATION
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteShowPermanently(showShowDeleteConfirm)}
                      className="w-full sm:w-1/2 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 hover:scale-[1.02] shadow-[0_0_15px_rgba(220,38,38,0.3)] text-white text-[10px] uppercase font-black tracking-widest rounded-xl transition-all cursor-pointer text-center"
                    >
                      PURGE PERMANENTLY
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* INTERACTIVE CALENDAR DATE SHOW / MULTI-DAY FESTIVAL PLANNER MODAL */}
          {showPlannerModal && (
            <div className="fixed inset-0 bg-[#07090c] backdrop-blur-md z-[120] flex flex-col font-mono text-zinc-100 overflow-hidden">
              {/* Header block with glow */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-[#00ffcc] to-emerald-800" />
              
              <div className="p-4 sm:p-6 border-b border-zinc-900 bg-zinc-950/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10 shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl animate-pulse">⚡</span>
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-black text-[#00ffcc] uppercase tracking-widest leading-none">
                      SPATIAL EVENT WORKSPACE & STAGING GRID
                    </span>
                    <span className="text-sm font-black text-white uppercase tracking-wider mt-1">
                      PLANNING SESSION • {calendarSelectedDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPlannerModal(false);
                      playLocalBeep(400, 'sine', 0.05);
                    }}
                    className="p-2.5 px-4 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-950 hover:bg-zinc-900 text-[10px] uppercase font-black tracking-wider flex items-center gap-2 transition-all cursor-pointer rounded-xl"
                  >
                    <X className="w-4 h-4" />
                    <span>[ CLOSE WORKSPACE ]</span>
                  </button>
                </div>
              </div>

              {/* Master View */}
              <div className="flex-1 flex flex-col overflow-hidden relative z-10">
                
                {/* TOP BLOCK: STAGE GLOBAL PROPERTIES */}
                <div className="w-full border-b border-zinc-900 bg-[#090b0e] p-5 sm:p-6 overflow-y-auto space-y-6 flex flex-col justify-between shrink-0">
                  <div className="space-y-6 text-left">
                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-2.5">
                      <Sliders className="w-4 h-4 text-[#00ffcc]" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">EVENT SETTINGS</h3>
                    </div>

                    {/* Planning template type selector */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                        PLANNING FORMAT STYLE
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPlannerShowType('standard');
                            playLocalBeep(520, 'sine', 0.02);
                          }}
                          className={`py-3 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider flex flex-col gap-1.5 justify-center items-center text-center transition-all cursor-pointer active:scale-95 ${
                            plannerShowType === 'standard'
                              ? 'bg-emerald-950/40 text-[#00ffcc] border-emerald-500'
                              : 'bg-zinc-950/60 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                          }`}
                        >
                          <span className="text-base text-center">🏟️</span>
                          <span>CLUB NIGHT</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setPlannerShowType('festival');
                            playLocalBeep(650, 'sine', 0.02);
                          }}
                          className={`py-3 px-3 rounded-xl border text-[9px] font-black uppercase tracking-wider flex flex-col gap-1.5 justify-center items-center text-center transition-all cursor-pointer active:scale-95 ${
                            plannerShowType === 'festival'
                              ? 'bg-purple-950/40 text-purple-300 border-purple-500'
                              : 'bg-zinc-950/60 text-zinc-500 border-zinc-900 hover:border-zinc-800'
                          }`}
                        >
                          <span className="text-base text-center">🎪</span>
                          <span>MULTI-DAY FEST</span>
                        </button>
                      </div>
                    </div>

                    {/* Event Name */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                        EVENT / FESTIVAL TITLE *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={plannerShowType === 'festival' ? "e.g. Decibel Cascade Festival III" : "e.g. Ritual Spotlight Showcase"}
                        value={plannerEventName}
                        onChange={(e) => setPlannerEventName(e.target.value)}
                        className="w-full bg-[#050608] border border-zinc-850 focus:border-emerald-500/85 text-zinc-200 rounded-xl p-3 text-xs outline-none transition-colors animate-none"
                      />
                    </div>

                    {/* Main Target Stage/Venue */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                        Stage Staging Ground / Venue Venue
                      </label>
                      <select
                        value={selectedVenueIndex}
                        onChange={(e) => {
                          setSelectedVenueIndex(parseInt(e.target.value) || 0);
                          playLocalBeep(500, 'sine', 0.02);
                        }}
                        className="w-full bg-[#050608] border border-zinc-855 focus:border-emerald-500/85 text-zinc-200 rounded-xl p-3 text-xs outline-none transition-colors"
                      >
                        {activeAllVenues.map((v, idx) => (
                          <option key={`opt-venue-${v.id || idx}-${idx}`} value={idx} className="bg-[#0c0e12]">
                            {v.name} ({v.city}, {v.state || 'TX'} | Cap: {v.capacity || 'N/A'})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Overall Notes */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-black uppercase text-zinc-500 tracking-wider">
                        GLOBAL DISPATCH LOGISTICS & AGREEMENT NOTES
                      </label>
                      <textarea
                        placeholder="Global details, merchant split arrangements, backline compliance guidelines, or ticket allocations..."
                        rows={3}
                        value={plannerNotes}
                        onChange={(e) => setPlannerNotes(e.target.value)}
                        className="w-full bg-[#050608] border border-zinc-850 focus:border-emerald-500 text-zinc-200 rounded-xl p-3 text-xs outline-none transition-colors font-sans resize-none"
                      />
                    </div>

                    {/* LIVE WORKSPACE METRICS BOX */}
                    <div className="p-4 bg-zinc-950/60 border border-zinc-900 rounded-2xl space-y-2 text-xs">
                      <span className="text-[9px] font-black text-zinc-500 uppercase block tracking-wider border-b border-zinc-905/30 pb-2">
                        📊 Live Workspace Analytics
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight">
                        <div className="bg-black/30 p-2.5 rounded-lg border border-zinc-850">
                          <span className="text-zinc-500 block text-[8px] uppercase">Roster Density</span>
                          <span className="text-white font-bold">{plannerLineup.length} / 60 Acts</span>
                          <div className="w-full bg-zinc-900 h-1 rounded-full mt-1.5 overflow-hidden">
                            <div 
                              className="bg-[#00ffcc] h-full" 
                              style={{ width: `${Math.min(100, (plannerLineup.length / 60) * 100)}%` }} 
                            />
                          </div>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-lg border border-zinc-850">
                          <span className="text-zinc-500 block text-[8px] uppercase">Guarantees Pool</span>
                          <span className="text-emerald-400 font-bold">
                            ${plannerLineup.reduce((sum, item) => sum + (Number(item.guarantee_amount) || 0), 0).toLocaleString()}
                          </span>
                        </div>
                        <div className="bg-black/30 p-2.5 rounded-lg border border-zinc-850 col-span-2">
                          <span className="text-zinc-500 block text-[8px] uppercase">Status Distributions</span>
                          <div className="flex gap-2.5 mt-1 text-[9px] font-sans">
                            <span className="text-emerald-300">
                              ● {plannerLineup.filter(x => x.status === 'accepted').length} Confirmed
                            </span>
                            <span className="text-purple-400">
                              ● {plannerLineup.filter(x => x.status === 'pending').length} Pending
                            </span>
                            <span className="text-zinc-400">
                              ● {plannerLineup.filter(x => x.status === 'interested' || x.status === 'renegotiating').length} Offered
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                  </div>

                  <div className="pt-4 border-t border-zinc-900 space-y-3">
                    <button
                      type="button"
                      onClick={handleCalendarPlannerSubmit}
                      className="w-full py-3.5 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-550 hover:to-teal-450 text-white text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer rounded-xl shadow-lg shadow-emerald-950/20 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2 border border-emerald-400/20"
                    >
                      <span>⚡ [ DEPLOY & DISPATCH MULTI-LINEUP EVENT ]</span>
                    </button>
                    <p className="text-[8px] text-zinc-500 text-center leading-normal">
                      This will initialize a custom Event Workspace and automatically dispatch formal booking contracts for all roster bands in parallel.
                    </p>
                  </div>
                </div>

                {/* BOTTOM BLOCK: LINEUP MANAGER */}
                <div className="bg-zinc-950/20 p-5 sm:p-6 overflow-y-auto space-y-6 flex flex-col text-left">
                  
                  {/* Dynamic Headline section / Instructions */}
                  <div className="flex flex-col gap-1 border-b border-zinc-900 pb-3">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-xs font-black text-white uppercase tracking-widest">LINEUP BUILDER & DISPATCH GRID (UP TO 60 BANDS)</h3>
                    </div>
                    <p className="text-[9px] text-zinc-400 font-sans mt-1">
                      Quickly add multiple bands to any days of your show or multi-day festival setup. You can add default database talent or type in custom external bands, and manually configure schedule, hospitality rider and hotel routing.
                    </p>
                  </div>

                  {/* QUICK ADD BAND PANEL */}
                  <div className="bg-zinc-950/80 border border-emerald-500/20 p-4 rounded-2xl space-y-4 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-1.5 text-[8px] text-emerald-400/50 uppercase font-black tracking-widest">
                      Quick Entry Terminal
                    </div>
                    
                    <span className="text-[9px] font-heavy text-emerald-300 uppercase tracking-widest block font-bold">
                      Add Artist / Band to Lineup
                    </span>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
                      
                      {/* Checkbox or label toggle for custom external band */}
                      <div className="md:col-span-4 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                            {plannerAddIsExternal ? "Type Custom Band Name" : "Select Registered Artist"}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setPlannerAddIsExternal(!plannerAddIsExternal);
                              playLocalBeep(600, 'sine', 0.02);
                            }}
                            className="text-[8px] text-[#00ffcc] hover:underline font-black uppercase tracking-tight cursor-pointer"
                          >
                            {plannerAddIsExternal ? "[ Use App Database ]" : "[ Custom Text Input ]"}
                          </button>
                        </div>
                        
                        {plannerAddIsExternal ? (
                          <input
                            type="text"
                            placeholder="e.g. Immolation"
                            value={plannerAddCustomName}
                            onChange={(e) => setPlannerAddCustomName(e.target.value)}
                            className="w-full bg-[#050608] border border-zinc-800 focus:border-emerald-500 text-zinc-100 rounded-xl p-2.5 text-xs outline-none uppercase tracking-wide font-mono"
                          />
                        ) : (
                          <select
                            value={plannerAddBandId}
                            onChange={(e) => {
                              setPlannerAddBandId(e.target.value);
                              playLocalBeep(500, 'sine', 0.01);
                            }}
                            className="w-full bg-[#050608] border border-zinc-850 focus:border-emerald-500 text-zinc-100 rounded-xl p-2.5 text-xs outline-none"
                          >
                            <option value="">-- Choose talent --</option>
                            {allAvailableFormBands.map((b, bIdx) => (
                              <option key={`opt-planner-add-${b.id}-${bIdx}`} value={b.id}>
                                {b.name} ({b.genre})
                              </option>
                            ))}
                          </select>
                        )}
                      </div>

                      {/* Day Selector */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Festival Day
                        </label>
                        <select
                          value={plannerAddDay}
                          onChange={(e) => {
                            setPlannerAddDay(parseInt(e.target.value) || 0);
                            playLocalBeep(500, 'sine', 0.01);
                          }}
                          className="w-full bg-[#050608] border border-zinc-850 focus:border-emerald-500 text-zinc-100 rounded-xl p-2.5 text-xs outline-none font-mono"
                        >
                          <option value={0}>Staging Depot (Unassigned)</option>
                          <option value={1}>Day 1</option>
                          <option value={2}>Day 2</option>
                          <option value={3}>Day 3</option>
                          <option value={4}>Day 4</option>
                          <option value={5}>Day 5</option>
                          <option value={6}>Day 6</option>
                          <option value={7}>Day 7</option>
                        </select>
                      </div>

                      {/* Status Selector */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Roster Status
                        </label>
                        <select
                          value={plannerAddStatus}
                          onChange={(e) => {
                            setPlannerAddStatus(e.target.value as any);
                            playLocalBeep(500, 'sine', 0.01);
                          }}
                          className="w-full bg-[#050608] border border-zinc-850 focus:border-emerald-500 text-[#00ffcc] rounded-xl p-2.5 text-xs outline-none font-mono"
                        >
                          <option value="pending">Offered/Pending</option>
                          <option value="accepted">Confirmed</option>
                          <option value="renegotiating">Negotiating</option>
                          <option value="interested">Interested Only</option>
                          <option value="declined">Declined</option>
                        </select>
                      </div>

                      {/* Performance Guarantee */}
                      <div className="md:col-span-2 space-y-1.5">
                        <label className="block text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                          Guarantee ($)
                        </label>
                        <input
                          type="number"
                          placeholder="1000"
                          value={plannerAddGuarantee}
                          onChange={(e) => setPlannerAddGuarantee(e.target.value)}
                          className="w-full bg-[#050608] border border-zinc-800 focus:border-emerald-500 text-zinc-100 rounded-xl p-2.5 text-xs outline-none font-mono"
                        />
                      </div>

                      {/* Deploy Button */}
                      <div className="md:col-span-2">
                        <button
                          type="button"
                          onClick={() => {
                            let name = '';
                            let bandId = '';
                            if (plannerAddIsExternal) {
                              name = plannerAddCustomName.trim();
                              bandId = 'external_' + Math.random().toString(36).substr(2, 9);
                              if (!name) {
                                triggerNotification?.("Error: Please enter a custom band name.");
                                return;
                              }
                            } else {
                              const selected = allAvailableFormBands.find(b => b.id === plannerAddBandId || (!plannerAddBandId && b.id === 'void_walkers'));
                              if (!selected) {
                                const fallback = allAvailableFormBands[0] || { id: 'void_walkers', name: 'Void Walkers' };
                                name = fallback.name;
                                bandId = fallback.id;
                              } else {
                                name = selected.name;
                                bandId = selected.id;
                              }
                            }

                            if (plannerLineup.length >= 60) {
                              triggerNotification?.("Roster Limit Reached: Calendar planner supports up to 60 bands per lineup session.");
                              return;
                            }

                            if ((plannerLineup || []).some(x => x.band_name.toLowerCase() === name.toLowerCase() && x.day === plannerAddDay)) {
                              triggerNotification?.(`"${name}" is already scheduled on Day ${plannerAddDay}.`);
                              return;
                            }

                            const newItem = {
                              id: 'item-' + Math.random().toString(36).substr(2, 9),
                              band_id: bandId,
                              band_name: name,
                              status: plannerAddStatus,
                              guarantee_amount: parseFloat(plannerAddGuarantee) || 1000,
                              day: plannerAddDay,
                              set_time: plannerAddSetTime || '19:00 - 19:45',
                              load_in_time: plannerAddLoadIn || '15:30',
                              primary_contact_method: 'email' as const,
                              contact_details: '',
                              travel: 'Ground Travel Requested / Pending Hotel',
                              rider: 'Standard Technical Stage Rider',
                              notes: ''
                            };

                            setPlannerLineup(prev => [...prev, newItem]);
                            playLocalBeep(720, 'sine', 0.04);
                            triggerNotification?.(`Added "${name}" to Day ${plannerAddDay} drafting list.`);
                            setPlannerAddCustomName('');
                          }}
                          className="w-full py-2.5 bg-gradient-to-r from-emerald-950/65 to-emerald-900/80 hover:from-emerald-500 hover:to-[#00ffcc] hover:text-black border border-emerald-500/45 text-emerald-300 font-black text-[9px] uppercase tracking-widest transition-all cursor-pointer rounded-xl h-10 flex items-center justify-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>[ Deploy ]</span>
                        </button>
                      </div>

                    </div>
                  </div>

                  {/* TWO-COLUMN WHITEBOARD INTERFACE */}
                  <div className="flex flex-col gap-4 mt-2">
                    
                    {/* Live Lineup Search Header */}
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div className="relative w-full sm:w-auto min-w-[240px]">
                        <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-zinc-500" />
                        <input
                          type="text"
                          placeholder="Search roster (up to 60 bands)..."
                          value={plannerSearchQuery}
                          onChange={(e) => setPlannerSearchQuery(e.target.value)}
                          className="w-full bg-zinc-950/60 border border-zinc-850 focus:border-emerald-500 rounded-xl py-2 pl-9 pr-3 text-xs text-zinc-100 outline-none uppercase font-mono tracking-wide"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 h-[600px] overflow-hidden">
                      {(() => {
                        const RenderCard = ({ item }: { item: any; key?: any }) => {
                          const index = plannerLineup.findIndex(x => x.id === item.id);
                          const isEditing = plannerEditingIndex === index;
                          const cardBorders = 
                            item.status === 'accepted' ? 'border-[#00ffcc]/35 bg-emerald-950/5 hover:border-[#00ffcc]/50 shadow-emerald-950/5' :
                            item.status === 'declined' ? 'border-red-900/35 bg-red-950/5 hover:border-red-500/40' :
                            item.status === 'renegotiating' ? 'border-yellow-950/35 bg-yellow-950/5 hover:border-yellow-500/40' :
                            'border-purple-900/35 bg-purple-950/5 hover:border-purple-500/40';

                          const targetTagColor = 
                            item.status === 'accepted' ? 'text-[#00ffcc] bg-[#00ffcc]/5' :
                            item.status === 'declined' ? 'text-rose-400 bg-rose-900/10' :
                            item.status === 'renegotiating' ? 'text-amber-400 bg-amber-900/10' :
                            'text-purple-400 bg-purple-900/10';

                          return (
                            <div 
                              key={`draft-${item.id}-${index}`}
                              draggable
                              onDragStart={(e) => e.dataTransfer.setData('itemId', item.id)}
                              className={`border rounded-xl transition-all duration-200 overflow-hidden text-zinc-300 font-mono text-[11px] cursor-grab active:cursor-grabbing hover:scale-[1.01] ${cardBorders}`}
                            >
                              {/* Card Header Row */}
                              <div className="p-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative cursor-grab">
                                <div className="flex items-center gap-2.5">
                                  <span className="bg-zinc-900 border border-zinc-800 text-zinc-450 px-2 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider font-mono">
                                    {item.day === 0 ? 'STAGING' : `DAY ${item.day}`}
                                  </span>
                                  <span className="text-xs font-black text-white uppercase tracking-wide">
                                    {item.band_name}
                                  </span>
                                  {item.band_id?.startsWith('external_') && (
                                    <span className="text-[7px] text-zinc-500 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-850">
                                      EXTERNAL
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
                                  <div className="flex flex-col text-right">
                                    <span className="text-[8px] text-zinc-500 block uppercase leading-none">SET TIME</span>
                                    <span className="text-zinc-400 text-[10px] uppercase font-bold mt-0.5">{item.set_time}</span>
                                  </div>
                                  <div className="flex flex-col text-right">
                                    <span className="text-[8px] text-zinc-500 block uppercase leading-none">GUARANTEE</span>
                                    <span className="text-emerald-400 text-[10px] font-black mt-0.5">${item.guarantee_amount.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center gap-2 select-none border-l border-zinc-900 pl-3">
                                    <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-wider border border-zinc-850 ${targetTagColor}`}>
                                      {item.status === 'interested' ? 'interested' : item.status}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        isEditing ? setPlannerEditingIndex(null) : setPlannerEditingIndex(index);
                                        playLocalBeep(600, 'sine', 0.02);
                                      }}
                                      className="p-1 px-2 border border-zinc-800 hover:border-emerald-500 text-zinc-400 hover:text-white bg-black/40 rounded transition-all cursor-pointer uppercase text-[8.5px]"
                                    >
                                      {isEditing ? '[ Save ]' : '[ Edit ]'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPlannerLineup(prev => prev.filter((_, idx) => idx !== index));
                                        playLocalBeep(300, 'sawtooth', 0.06);
                                        triggerNotification?.(`Removed "${item.band_name}" from active staging line.`);
                                      }}
                                      className="p-1 px-2 border border-red-950 text-red-400 hover:text-white bg-red-950/20 hover:bg-red-900 rounded transition-all cursor-pointer"
                                      title="Delete from roster"
                                    >
                                      <Trash className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              </div>

                              {/* Collapsible inline editing panel / forms explicitly requested by user */}
                              {isEditing && (
                                <div className="bg-black/60 border-t border-zinc-900 p-4 space-y-4 text-xs font-mono cursor-default" onClick={(e) => e.stopPropagation()} onPointerDown={(e) => e.stopPropagation()}>
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
                                    
                                    {/* Edit Status */}
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-zinc-500 uppercase font-black block">Contract Status</label>
                                      <select
                                        value={item.status}
                                        onChange={(e) => {
                                          const val = e.target.value as any;
                                          setPlannerLineup(prev => prev.map((it, idx) => idx === index ? { ...it, status: val } : it));
                                        }}
                                        className="w-full bg-[#050608] border border-zinc-800 text-zinc-200 text-[10px] p-2 rounded-lg"
                                      >
                                        <option value="pending">Offered/Pending</option>
                                        <option value="accepted">Confirmed</option>
                                        <option value="renegotiating">Negotiating</option>
                                        <option value="interested">Interested Only</option>
                                        <option value="declined">Declined</option>
                                      </select>
                                    </div>

                                    {/* Edit Guarantee */}
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-zinc-500 uppercase font-black block">Guarantee Amount ($)</label>
                                      <input
                                        type="number"
                                        value={item.guarantee_amount}
                                        onChange={(e) => {
                                          const val = parseFloat(e.target.value) || 0;
                                          setPlannerLineup(prev => prev.map((it, idx) => idx === index ? { ...it, guarantee_amount: val } : it));
                                        }}
                                        className="w-full bg-[#050608] border border-zinc-800 text-zinc-200 text-[10px] p-2 rounded-lg"
                                      />
                                    </div>

                                    {/* Edit Show Times */}
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-zinc-500 uppercase font-black block">Performance Set Time</label>
                                      <input
                                        type="text"
                                        value={item.set_time}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setPlannerLineup(prev => prev.map((it, idx) => idx === index ? { ...it, set_time: val } : it));
                                        }}
                                        className="w-full bg-[#050608] border border-zinc-800 text-zinc-200 text-[10px] p-2 rounded-lg"
                                      />
                                    </div>

                                    {/* Edit Load-in Times */}
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-zinc-500 uppercase font-black block">Load-in Time</label>
                                      <input
                                        type="text"
                                        value={item.load_in_time}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setPlannerLineup(prev => prev.map((it, idx) => idx === index ? { ...it, load_in_time: val } : it));
                                        }}
                                        className="w-full bg-[#050608] border border-zinc-800 text-zinc-200 text-[10px] p-2 rounded-lg"
                                      />
                                    </div>

                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1.5">
                                    
                                    {/* Travel and accommodation details */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between">
                                        <label className="text-[8px] text-zinc-500 uppercase font-black block">✈️ TRAVEL & AIRFARE GUIDANCE</label>
                                      </div>
                                      <textarea
                                        rows={2}
                                        value={item.travel}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setPlannerLineup(prev => prev.map((it, idx) => idx === index ? { ...it, travel: val } : it));
                                        }}
                                        placeholder="Detail airlines, hotel allocations, lobby calls, or ground shuttle pickups..."
                                        className="w-full bg-[#050608] border border-zinc-800 text-zinc-350 text-[10px] p-2 rounded-lg resize-none font-sans"
                                      />
                                    </div>

                                    {/* Rider & Catering specifications */}
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-zinc-500 uppercase font-black block">🍔 HOSPITALITY & TECHNICAL RIDERS</label>
                                      <textarea
                                        rows={2}
                                        value={item.rider}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setPlannerLineup(prev => prev.map((it, idx) => idx === index ? { ...it, rider: val } : it));
                                        }}
                                        placeholder="Detail sound specs, backline configurations, beer/dietary requirements, toweling etc..."
                                        className="w-full bg-[#050608] border border-zinc-800 text-zinc-350 text-[10px] p-2 rounded-lg resize-none font-sans"
                                      />
                                    </div>

                                    {/* Custom internal workspace notes */}
                                    <div className="space-y-1">
                                      <label className="text-[8px] text-zinc-500 uppercase font-black block">💬 PRIVATE PROMOTER INTERNAL NOTES</label>
                                      <textarea
                                        rows={2}
                                        value={item.notes}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setPlannerLineup(prev => prev.map((it, idx) => idx === index ? { ...it, notes: val } : it));
                                        }}
                                        placeholder="Ticket splits, secondary contact numbers, agent commission tracking details..."
                                        className="w-full bg-[#050608] border border-zinc-800 text-zinc-350 text-[10px] p-2 rounded-lg resize-none font-sans"
                                      />
                                    </div>

                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        };

                        const activeDays = Array.from(new Set([1, 2, ...plannerLineup.map(i => i.day)])).filter(d => d !== 0).sort((a,b) => a-b);
                        
                        return (
                          <>
                            {/* COLUMN 1: ROSTER STAGING DEPOT */}
                            <div 
                              className={`bg-[#050608] border rounded-xl flex flex-col transition-all duration-300 overflow-hidden ${plannerDragOverDay === 0 ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-[#262626]'}`}
                              onDragOver={(e) => { e.preventDefault(); if(plannerDragOverDay !== 0) setPlannerDragOverDay(0); }}
                              onDragLeave={() => { if(plannerDragOverDay === 0) setPlannerDragOverDay(null); }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setPlannerDragOverDay(null);
                                const id = e.dataTransfer.getData('itemId');
                                if (id) {
                                  setPlannerLineup(prev => prev.map(item => item.id === id ? { ...item, day: 0 } : item));
                                  playLocalBeep(600, 'sine', 0.05);
                                }
                              }}
                            >
                              <div className="p-3 border-b border-[#262626] bg-[#0c0c0c] flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-purple-400">Roster Staging Depot (Unassigned)</span>
                                <span className="px-2 py-0.5 bg-purple-950/40 border border-purple-500/20 rounded text-[9px] text-purple-300">
                                  {plannerLineup.filter(i => i.day === 0).length} ACTS
                                </span>
                              </div>
                              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                                {(() => {
                                  const stagingList = plannerLineup.filter(i => i.day === 0 && (!plannerSearchQuery.trim() || i.band_name.toLowerCase().includes(plannerSearchQuery.toLowerCase())));
                                  if (stagingList.length === 0) {
                                    return <div className="text-center py-10 text-zinc-600 text-[10px] uppercase tracking-wider font-bold border border-zinc-900 border-dashed rounded-xl">Staging Depot Empty<br/><span className="font-normal text-[8px] block mt-1 opacity-50">Drag bands here or add them</span></div>;
                                  }
                                  return stagingList.map((item, idx) => <RenderCard key={`${item.id}-${idx}`} item={item} />);
                                })()}
                              </div>
                            </div>

                            {/* COLUMN 2: MULTI-DAY TIMELINE GRIDS */}
                            <div className="flex flex-col gap-5 overflow-y-auto pr-1.5 scroll-smooth pb-4">
                              {activeDays.map((day, dIdx) => (
                                <div 
                                  key={`day-col-${day}-${dIdx}`}
                                  className={`bg-black border rounded-xl flex flex-col transition-all duration-300 min-h-[220px] ${plannerDragOverDay === day ? 'border-[#A855F7] shadow-[0_0_20px_rgba(168,85,247,0.3)]' : 'border-[#262626]'}`}
                                  onDragOver={(e) => { e.preventDefault(); if(plannerDragOverDay !== day) setPlannerDragOverDay(day); }}
                                  onDragLeave={() => { if(plannerDragOverDay === day) setPlannerDragOverDay(null); }}
                                  onDrop={(e) => {
                                    e.preventDefault();
                                    setPlannerDragOverDay(null);
                                    const id = e.dataTransfer.getData('itemId');
                                    if (id) {
                                      setPlannerLineup(prev => prev.map(item => item.id === id ? { ...item, day: day } : item));
                                      playLocalBeep(800, 'sine', 0.05);
                                    }
                                  }}
                                >
                                  <div className="p-3 border-b border-[#262626] bg-[#080808] flex justify-between items-center sticky top-0 z-10 shadow-md">
                                    <div className="flex items-center gap-2">
                                      <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                      <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest">Day {day} Timeline</span>
                                    </div>
                                    <span className="px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 rounded text-[9px] text-emerald-300">
                                      {plannerLineup.filter(i => i.day === day).length} ACTS
                                    </span>
                                  </div>
                                  <div className="flex-1 p-3 space-y-2.5">
                                    {(() => {
                                      let dayList = plannerLineup.filter(i => i.day === day && (!plannerSearchQuery.trim() || i.band_name.toLowerCase().includes(plannerSearchQuery.toLowerCase())));
                                      dayList.sort((a,b) => a.set_time.localeCompare(b.set_time));
                                      if (dayList.length === 0) {
                                        return <div className="text-center py-6 text-zinc-600 text-[10px] uppercase tracking-wider font-bold border border-zinc-900 border-dashed rounded-xl h-full flex items-center justify-center min-h-[100px]">Drop bands here</div>;
                                      }
                                      return dayList.map((item, idx) => <RenderCard key={`${item.id}-${idx}`} item={item} />);
                                    })()}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MASTER REGISTRY FOR ALL SHOWS & DRAFTS (FLAT & DECOUPLED OUTSIDE CALENDAR) */}
      {/* ========================================================================= */}
      {(activePortalTab === 'routing' || showOnlyCalendar) && !showOnlyRoutingAndAvailability && (
        <div 
          id="promoter-all-shows-drafts-master-registry"
          className="w-full mt-6 bg-[#090b0e]/95 border-2 border-yellow-500/30 rounded-2xl p-5 sm:p-6 backdrop-blur-sm flex flex-col gap-5 relative overflow-hidden yellow-pulse-glow hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] transition-all duration-300"
        >
          {/* Subtle Ambient Radial Highlight */}
          <div className="absolute inset-0 bg-[radial-gradient(#a855f705_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />

          <div className="flex flex-col items-center justify-center text-center gap-3 border-b border-zinc-900 pb-4 relative z-10">
            <h3 className="text-[28px] font-bold text-yellow-400 uppercase tracking-wider drop-shadow-[0_0_15px_rgba(234,179,8,0.65)] font-mono leading-tight">
              All Shows & Drafts
            </h3>
            <p className="text-[10px] sm:text-[10.5px] text-zinc-450 font-sans leading-relaxed max-w-xl text-center">
              Access and manage all active shows, proposals, scheduled lines, and templates. Drag items left to permanently delete or right to customize in your workspace.
            </p>
            <span className="text-[10px] font-mono text-yellow-400 bg-yellow-950/20 px-3.5 py-1 rounded-full border border-yellow-500/20 uppercase font-black tracking-widest mt-1">
              {unifiedPromoterShows.length} total events
            </span>
          </div>

          {/* Search Bar Input */}
          <div className="relative w-full relative z-10">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-zinc-500">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={showSearchQuery}
              onChange={(e) => setShowSearchQuery(e.target.value)}
              placeholder="Search shows, drafts or venues..."
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/60 border border-zinc-900 focus:border-emerald-500 focus:outline-none focus:shadow-[0_0_15px_rgba(16,185,129,0.1)] rounded-xl text-[10.5px] font-mono text-white placeholder-zinc-650 uppercase tracking-widest transition-all"
            />
            {showSearchQuery && (
              <button
                type="button"
                onClick={() => setShowSearchQuery('')}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-500 hover:text-white text-base"
              >
                ×
              </button>
            )}
          </div>

          {/* Swipe Help Microtext */}
          <div className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest text-center select-none leading-none relative z-10">
            [ swipe left to delete / swipe right to edit ]
          </div>

          {/* List Container */}
          <div className="space-y-2.5 relative z-10">
            {(() => {
              const filtered = unifiedPromoterShows.filter(item => {
                if (hiddenShowIds.has(item.id)) return false;
                if (!showSearchQuery) return true;
                const q = showSearchQuery.toLowerCase();
                return (
                  (item?.name || '').toLowerCase().includes(q) ||
                  (item.venueName || '').toLowerCase().includes(q) ||
                  (item.dateString || '').toLowerCase().includes(q) ||
                  (item.eventType || '').toLowerCase().includes(q) ||
                  (item.status || '').toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12 text-zinc-500 space-y-2">
                    <span className="text-xl">📭</span>
                    <span className="text-[9px] font-black font-mono tracking-widest uppercase">
                      No matching shows or drafts found
                    </span>
                  </div>
                );
              }

              return filtered.map((ev, index) => {
                const showDate = ev.dateString ? new Date(ev.dateString + 'T00:00:00') : new Date();
                const dateFormatted = showDate.toLocaleDateString(undefined, {
                   month: 'short',
                   day: 'numeric',
                   year: 'numeric'
                }).toUpperCase();

                const isFestival = ev.original?.show_type === 'festival' || 
                                   ev.original?.festival_name || 
                                   (ev.name && ev.name.toLowerCase().includes('fest'));
                const isConfirmed = ev.status === 'Active' || ev.status === 'accepted';

                let cardBorderClass = 'border-zinc-800 hover:border-zinc-700 bg-zinc-950';
                let statusBadge = 'bg-zinc-900 text-zinc-400 border-zinc-800';
                let statusText = ev.status;

                if (isFestival) {
                  if (isConfirmed) {
                    cardBorderClass = 'border-purple-500/35 hover:border-purple-500/70 bg-[#160e24] shadow-[0_0_8px_rgba(168,85,247,0.05)]';
                    statusBadge = 'bg-purple-950/45 text-purple-300 border-purple-500/20';
                    statusText = '🎪 CONFIRMED FEST';
                  } else {
                    cardBorderClass = 'border-red-500/35 hover:border-red-500/70 bg-[#240e0e] shadow-[0_0_8px_rgba(239,68,68,0.05)]';
                    statusBadge = 'bg-red-955 text-red-350 border-red-500/20';
                    statusText = '🎪 FESTIVAL DRAFT';
                  }
                } else {
                  if (isConfirmed) {
                    cardBorderClass = 'border-emerald-500/35 hover:border-emerald-500/70 bg-[#0e2416] shadow-[0_0_8px_rgba(16,185,129,0.05)]';
                    statusBadge = 'bg-emerald-950/45 text-emerald-300 border-emerald-500/20';
                    statusText = '💚 CONFIRMED SHOW';
                  } else {
                    cardBorderClass = 'border-amber-500/35 hover:border-amber-500/70 bg-[#21160d] shadow-[0_0_8px_rgba(245,158,11,0.05)]';
                    statusBadge = 'bg-amber-955 text-amber-300 border-amber-500/20';
                    statusText = '⏳ SHOW DRAFT';
                  }
                }

                return (
                  <div 
                    key={`upcoming-show-wrap-flat-${ev.eventType}-${ev.id}-${index}`} 
                    className="relative overflow-hidden w-full rounded-xl bg-zinc-950"
                  >
                    {/* Blue Pencil Reveal Panel */}
                    <div 
                      className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-blue-600 to-blue-900/10 flex items-center justify-start pl-4 text-white rounded-l-xl pointer-events-none z-0 transition-opacity duration-150"
                      style={{ opacity: draggingShowId === ev.id ? 1 : 0 }}
                    >
                      <div className="flex items-center gap-2">
                        <Pencil className="w-3.5 h-3.5 text-blue-300 animate-pulse" />
                        <span className="text-[9px] font-black font-mono uppercase tracking-widest text-blue-200">
                          WORKSPACE
                        </span>
                      </div>
                    </div>

                    {/* Red Trash Reveal Panel */}
                    <div 
                      className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-red-600/80 to-red-950/10 flex items-center justify-end pr-4 text-white rounded-r-xl pointer-events-none z-0 transition-opacity duration-150"
                      style={{ opacity: draggingShowId === ev.id ? 1 : 0 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black font-mono uppercase tracking-widest text-rose-200">
                          PERMANENT PURGE
                        </span>
                        <Trash className="w-3.5 h-3.5 text-rose-400 animate-bounce" />
                      </div>
                    </div>

                    {/* Draggable Content Card */}
                    <motion.div
                      key={`upcoming-show-flat-${ev.eventType}-${ev.id}-${index}`}
                      onClick={() => handleOpenShowInWorkspace(ev)}
                      className={`p-3 border w-full rounded-xl transition-colors text-left flex flex-col gap-1.5 relative overflow-hidden group ${cardBorderClass} cursor-pointer active:cursor-grabbing z-10`}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.7}
                      onDragStart={() => setDraggingShowId(ev.id)}
                      onDragEnd={(e, info) => {
                        setDraggingShowId(null);
                        if (info.offset.x < -80) {
                          if (typeof playLocalBeep === 'function') {
                            playLocalBeep(220, 'sawtooth', 0.08);
                          }
                          setShowShowDeleteConfirm(ev);
                        } else if (info.offset.x > 80) {
                          if (typeof playLocalBeep === 'function') {
                            playLocalBeep(520, 'sine', 0.04);
                          }
                          handleOpenShowInWorkspace(ev);
                        }
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 relative z-10">
                        <span className={`text-[8px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded border ${statusBadge}`}>
                          {statusText}
                        </span>
                        
                        <button
                          type="button"
                          onClick={() => handleOpenShowInWorkspace(ev)}
                          className="px-2 py-0.5 bg-emerald-950/45 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/25 hover:border-emerald-500 text-[8px] font-extrabold uppercase rounded-md font-mono tracking-widest transition-all cursor-pointer shadow-sm shadow-black/10 z-20"
                        >
                          OPEN WORKSPACE ⚙️
                        </button>
                      </div>

                      <div className="flex items-start justify-between gap-4 min-w-0 relative z-10">
                        <div className="flex flex-col min-w-0 flex-grow">
                          <span className="text-[10px] font-black text-white uppercase font-mono tracking-tight group-hover:text-emerald-400 transition-colors truncate font-sans">
                            {ev.name}
                          </span>
                          <span className="text-[8px] text-zinc-450 font-mono mt-0.5 uppercase tracking-wide truncate">
                            🏟️ {ev.venueName}
                          </span>
                        </div>
                        <span className="text-[8px] font-mono text-zinc-400 uppercase font-black bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded shrink-0 self-center">
                          {dateFormatted}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
 
      {/* Main Container Contents depending on selection tab */}
      {((activePortalTab === 'routing' && !showOnlyCalendar) || showOnlyRoutingAndAvailability) ? (
        <motion.div
          key="routing"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6"
        >
          {/* Elegant inline segmented control filter bar */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-2">
              <div style={{ fontSize: '12px', width: '312.965px' }} className="text-[10px] text-yellow-300 font-sans font-bold leading-relaxed px-3 py-2 text-center mx-auto border-2 border-dashed border-yellow-400/70 bg-yellow-400/10 rounded-lg">
                Select general styles or input specific micro-genres to narrow your artist search parameters.
              </div>
              <div className="flex flex-col gap-2 py-3 px-4 bg-[#0a0612]/70 border border-purple-900/20 rounded-xl font-mono text-[9.5px] w-full" id="promoter-segmented-frequency-selector">
                {(['ALL', 'Extreme Metal', 'Rock/Heavy Metal', 'Punk/Alternative', 'Hardcore', 'Hip-Hop/Rap', 'Industrial/EDM'] as const).map((freq, idx) => {
                  const meta = FREQUENCY_METADATA[freq];
                  const isActive = selectedFrequency === freq;
                  return (
                    <button
                      key={`${freq}-${idx}`}
                      type="button"
                      onClick={() => {
                        setSelectedFrequency(freq);
                        setSelectedSubGenre('ALL');
                        triggerNotification?.(`Category changed: ${freq}`);
                      }}
                      className={`w-full py-2.5 px-4 rounded-lg border font-bold uppercase transition-all cursor-pointer select-none text-center ${
                        isActive
                          ? meta?.activeStyle || 'bg-gradient-to-r from-zinc-900 to-zinc-800 border-zinc-500 text-white shadow-md shadow-zinc-900/40 font-bold'
                          : 'bg-zinc-950/65 border-zinc-900/80 text-zinc-550 hover:text-purple-300 hover:border-purple-900/40'
                      }`}
                    >
                      {freq === 'ALL' ? '[ ALL FREQUENCIES ]' : `[ ${meta?.icon || '🎸'} ${meta?.label || freq.toUpperCase()} ]`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Micro-Genres Expanded Selector */}
            {selectedFrequency !== 'ALL' && FREQUENCY_METADATA[selectedFrequency] && (
              <motion.div 
                key={selectedFrequency}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3.5 bg-black/45 border rounded-xl space-y-2.5 text-left shadow-lg border-t-2 ${FREQUENCY_METADATA[selectedFrequency].subBorder}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9.5px] font-mono font-black ${FREQUENCY_METADATA[selectedFrequency].subColor} uppercase tracking-widest flex items-center gap-1.5 animate-pulse`}>
                    <span>{FREQUENCY_METADATA[selectedFrequency].icon}</span> {FREQUENCY_METADATA[selectedFrequency].subHeader}
                  </span>
                  <span className="text-[8.5px] font-mono text-zinc-500 lowercase italic">
                    narrow active signals spectrum
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(MICRO_GENRES_MAP[selectedFrequency] || []).map((mg, idx) => {
                    const isSubActive = selectedSubGenre === mg.id;
                    const activeStyle = selectedFrequency === 'Extreme Metal'
                      ? 'bg-gradient-to-r from-red-950/90 to-red-900/40 border-red-500 text-rose-400'
                      : selectedFrequency === 'Hardcore'
                      ? 'bg-gradient-to-r from-orange-950/90 to-orange-900/40 border-orange-500 text-orange-450'
                      : selectedFrequency === 'Hip-Hop/Rap'
                      ? 'bg-gradient-to-r from-amber-950/90 to-amber-900/40 border-amber-500 text-amber-250'
                      : selectedFrequency === 'Industrial/EDM'
                      ? 'bg-gradient-to-r from-cyan-950/90 to-cyan-900/40 border-cyan-500 text-cyan-400'
                      : selectedFrequency === 'Punk/Alternative'
                      ? 'bg-gradient-to-r from-pink-950/90 to-pink-900/40 border-pink-500 text-pink-400'
                      : 'bg-gradient-to-r from-purple-950/90 to-purple-900/40 border-fuchsia-500 text-fuchsia-450';
                    
                    return (
                      <button
                        key={`${mg.id}-${idx}`}
                        type="button"
                        onClick={() => {
                          setSelectedSubGenre(mg.id);
                          triggerNotification?.(`Narrowed focus to micro-genre: ${mg.label}`);
                        }}
                        className={`px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-900/80 text-[9px] font-mono uppercase transition-all cursor-pointer whitespace-nowrap border ${
                          isSubActive
                            ? `${activeStyle} font-bold shadow-[0_0_10px_rgba(255,255,255,0.05)]`
                            : 'border-zinc-850 text-zinc-400 hover:text-white hover:border-zinc-700'
                        }`}
                      >
                        {mg.label}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
            
            <div className="flex items-center justify-between w-full px-6 text-sm text-[#36ff00] font-mono tracking-widest opacity-80 -my-2 pb-1">
              <span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span><span>+</span>
            </div>
            
          </div>

          <div className="flex flex-col gap-6 transition-all" id="routing-specification-grid">
          
          {/* Left Side: Target Focus */}
          <div className="relative overflow-hidden border border-purple-500/20 bg-black/65 backdrop-blur-md p-5 rounded-2xl space-y-5 shadow-2xl hover:border-purple-500/40 transition-all duration-300">
            {/* Elegant World Map Minimal Background */}
            <div className="absolute inset-0 opacity-30 pointer-events-none select-none">
              <img 
                src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Dark%20World%20Map.png" 
                alt="World Map Background" 
                className="w-full h-full object-cover max-md:scale-x-[1.28] max-md:scale-y-[1.22] max-md:translate-x-6 max-md:translate-y-1.5 max-md:origin-right" 
                referrerPolicy="no-referrer"
              />
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 500" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* Cyber network arcs */}
                <path d="M150,150 Q250,100 350,140" stroke="#a855f7" strokeWidth="1.25" strokeDasharray="3 3" className="opacity-80"/>
                <path d="M350,140 Q550,180 620,150" stroke="#a855f7" strokeWidth="1.25" strokeDasharray="3 3" className="opacity-80"/>
                <path d="M620,150 Q750,220 810,380" stroke="#00ffcc" strokeWidth="1.25" strokeDasharray="2 2" className="opacity-80"/>

                {/* Pulse highlights on targeted regional clusters */}
                <circle cx="170" cy="160" r="4" fill="#00ffcc" className="animate-pulse"/>
                <circle cx="170" cy="160" r="10" stroke="#00ffcc" strokeWidth="0.75" className="animate-ping opacity-30"/>
                <circle cx="560" cy="180" r="3.5" fill="#a855f7" className="opacity-80"/>
                <circle cx="750" cy="370" r="3.5" fill="#a855f7" className="opacity-80"/>
              </svg>
            </div>

            {/* Info Circle Popout Button in the upper right corner */}
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowTrackerInfo(!showTrackerInfo);
                  playLocalBeep(550, 'sine', 0.02);
                }}
                className={`p-1.5 rounded-lg border text-zinc-400 transition-all cursor-pointer flex items-center justify-center hover:scale-110 active:scale-95 ${
                  showTrackerInfo 
                    ? 'bg-purple-950/85 border-purple-500 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.3)]' 
                    : 'bg-zinc-950/60 border-zinc-800 hover:bg-zinc-900 hover:text-white'
                }`}
                title="Availability Tracker Info"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Animated Pop-out Info Card explaining how this works */}
            {showTrackerInfo && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute top-12 right-4 left-4 sm:left-auto sm:w-[280px] bg-zinc-950/95 border border-purple-500/50 p-4 rounded-xl text-[10px] text-zinc-300 font-mono leading-relaxed uppercase shadow-2xl z-30 space-y-2.5 backdrop-blur-md"
              >
                <div className="flex items-center justify-between border-b border-purple-900/40 pb-1.5 text-[#00ffcc] font-black tracking-widest text-[9px]">
                  <span>ℹ️ HOW TRACKER WORKS</span>
                  <button 
                    type="button"
                    onClick={() => setShowTrackerInfo(false)}
                    className="text-zinc-500 hover:text-white font-bold px-1"
                  >
                    ×
                  </button>
                </div>
                <div className="space-y-2 text-zinc-400 text-[9px]">
                  <p>
                    1. SET TARGET FOCUS REGION/STATE AND LOCALIZED MILE RADIUS TO TARGET SEGMENT.
                  </p>
                  <p>
                    2. TRACKER SCANS COHORT BEACONS REPRESENTING BOOKING OR TOUR CONSTRAINTS.
                  </p>
                  <p>
                    3. OPENINGS AUTOMATICALLY POPULATE ACTIVE ROUTING DOCK FOR QUICK ACTION!
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex flex-col gap-1 border-b border-purple-900/40 pb-3 relative z-10">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-purple-400 animate-pulse" />
                <h3 style={{ fontSize: '15px', color: '#f9df00', width: '260.5px' }} className="text-xs font-black text-white uppercase tracking-widest">Band/ Artist Availability Tracker</h3>
              </div>
              <p style={{ fontSize: '11px' }} className="text-[10px] text-zinc-450 font-mono tracking-wide mt-1 leading-relaxed">
                Find bands currently booking tours near your venue or locate open dates on confirmed regional runs.
              </p>
            </div>

            <form onSubmit={handleUpdateRegion} className="space-y-4 relative z-10">
              <div className="space-y-1.5">
                <label htmlFor="target-region-input" className="text-[9px] font-bold uppercase tracking-widest block" style={{ color: '#d2d2da' }}>
                  TARGET FOCUS REGION / STATE
                </label>
                <div className="relative">
                  <input
                    id="target-region-input"
                    type="text"
                    list="target-region-suggestions"
                    value={editingRegion}
                    onChange={(e) => setEditingRegion(e.target.value)}
                    placeholder="e.g. Dallas, TX or Statewide (Texas) or Country (USA)"
                    className="w-full bg-zinc-950/80 border border-purple-900/50 focus:border-[#00ffcc] focus:shadow-[0_0_10px_rgba(0,255,204,0.15)] focus:outline-none p-2.5 rounded-lg text-xs text-white uppercase tracking-wider font-mono transition-all"
                  />
                  <datalist id="target-region-suggestions">
                    {Array.from(new Set(beacons.map((b) => b.target_region).filter(Boolean))).sort().map((region, idx) => (
                      <option key={`${region}-${idx}`} value={region} />
                    ))}
                  </datalist>
                  <div className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-purple-500 animate-ping" />
                </div>
                
                <div className="flex flex-col gap-1.5 mt-2">
                  <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-wider mr-1">TIPS:</span>
                  <p className="text-[9px] font-mono italic" style={{ color: '#ffffff', fontSize: '10px' }}>
                    When entering a city, please include the state/province 
                    to avoid confusion (e.g. "Dallas, TX"). If casting a wider net, literally state "Statewide" or "Country Wide".
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    {['Dallas, TX', 'Texas Statewide', 'US Country Wide', 'London, UK'].map((ex, idx) => (
                      <button
                        key={`${ex}-${idx}`}
                        type="button"
                        onClick={() => {
                          setEditingRegion(ex);
                          setUserProfile(prev => ({ ...prev, target_region: ex }));
                          triggerNotification?.(`Focus region aligned to ${ex}!`);
                        }}
                        className="px-2 py-0.5 bg-purple-950/40 hover:bg-purple-900/60 border border-purple-900/40 hover:border-[#00ffcc]/60 text-[9px] text-purple-300 hover:text-[#00ffcc] font-mono rounded uppercase transition-all duration-150 cursor-pointer"
                      >
                        {ex}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="target-radius-input" className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest block">
                  LOCALIZED SUB-REGION / RADIUS
                </label>
                <div className="relative">
                  <select
                    id="target-radius-input"
                    value={editingRadius}
                    onChange={(e) => setEditingRadius(e.target.value)}
                    className="w-full bg-zinc-950/80 border border-purple-900/50 focus:border-[#00ffcc] focus:shadow-[0_0_10px_rgba(0,255,204,0.15)] focus:outline-none p-2.5 rounded-lg text-xs text-zinc-300 uppercase tracking-wider font-mono transition-all appearance-none cursor-pointer"
                  >
                    <option value="+25mi" className="bg-zinc-950">Within 25 Miles</option>
                    <option value="+50mi" className="bg-zinc-950">Within 50 Miles</option>
                    <option value="+100mi" className="bg-zinc-950">Within 100 Miles</option>
                    <option value="+250mi" className="bg-zinc-950">Within 250 Miles</option>
                    <option value="statewide" className="bg-zinc-950">Statewide Wide-Net</option>
                  </select>
                  <div className="absolute right-3 top-3.5 pointer-events-none text-purple-500 text-[10px]">
                    ▼
                  </div>
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isUpdatingRegion}
                className="w-full py-2.5 border border-purple-500/50 hover:border-purple-300 text-purple-300 hover:text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md"
                style={{ backgroundColor: '#000000', fontSize: '12px' }}
              >
                Search Active Runs
              </motion.button>
            </form>

            {/* Quick Stats Widget */}
            <div className="pt-3 border-t border-purple-950/60 space-y-3 relative z-10">
              <span className="text-[8px] font-black tracking-widest uppercase block" style={{ color: '#c5c5c5' }}>Gateway Telemetry</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9px] font-mono">
                <div className="bg-black/40 p-2.5 rounded-lg border border-purple-500/10">
                  <span className="text-zinc-500 block leading-tight">CHANNELS</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse" />
                    <span className="text-white font-black text-xs">{beacons.length} ACTIVE</span>
                  </div>
                </div>
                <div className="bg-black/40 p-2.5 rounded-lg border border-emerald-500/10">
                  <span className="text-zinc-500 block leading-tight">REGION HITS</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[#00ffcc] font-black text-xs">{matchedBeacons.length} FOUND</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Centered micro-arrows & text divider to direct user to available beacons */}
          <div className="flex flex-col items-center justify-center py-1 my-0.5 relative w-full select-none" id="availability-tracker-search-results-divider">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-purple-500/15" />
            </div>
            <div className="relative flex justify-center text-[10px] font-mono uppercase bg-[#090317] border border-purple-900/50 hover:border-purple-500/60 px-4 py-1.5 text-purple-400 rounded-full shadow-[0_0_15px_rgba(168,85,247,0.15)] gap-2.5 items-center transition-all duration-300">
              <span className="animate-bounce inline-block">↓</span>
              <span className="font-extrabold tracking-[0.2em] text-[#00ffcc] text-[9.5px] animate-pulse">search results</span>
              <span className="animate-bounce inline-block" style={{ animationDelay: '0.2s' }}>↓</span>
            </div>
          </div>

          {/* Right Side: Tabular Beacons Index */}
          <div className="border border-purple-500/30 bg-black/65 backdrop-blur-md p-3 sm:p-6 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden hover:border-purple-500/40 transition-all duration-300" id="routing-dock-parent-container">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400 animate-bounce" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">ACTIVE ROUTING DOCK</h3>
              </div>

              <motion.button 
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={fetchBeacons}
                disabled={loading}
                className="p-1 px-3 bg-purple-950/60 border border-purple-800/40 hover:border-purple-400 rounded-lg text-purple-300 hover:text-white transition-all text-[8.5px] font-mono font-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                SYNC DOCK
              </motion.button>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400 block mb-3 font-mono">
                Filtering routing signals corresponding to focus region: <strong className="text-purple-300 font-extrabold uppercase bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/30">"{promoterRegion || 'ALL'}"</strong>
              </span>
              
              {loading ? (
                <div className="py-24 text-center text-purple-400 font-bold text-xs animate-pulse font-mono tracking-widest">
                  📡 POLLING HIGH-SPEED SATELLITE CHANNELS...
                </div>
              ) : matchedBeacons.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-purple-500/20 rounded-2xl space-y-4 bg-purple-950/5">
                  <ShieldAlert className="w-8 h-8 text-purple-500 mx-auto animate-bounce" />
                  <div className="space-y-2">
                    <p className="text-zinc-300 text-xs font-black uppercase tracking-wider">
                      NO ACTIVE SIGNALS MATCHED IN "{promoterRegion.toUpperCase()}"
                    </p>
                    <p className="text-[10px] text-zinc-500 font-mono tracking-tight max-w-sm mx-auto leading-relaxed">
                      Adjust your target region of focus on the side grid or clear filters to track bands routing elsewhere.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => {
                      setEditingRegion('');
                      setUserProfile(prev => ({ ...prev, target_region: '' }));
                      triggerNotification?.("Focus configuration broadened to global channels!");
                    }}
                    className="px-4 py-2 bg-purple-950/60 text-purple-300 font-mono font-bold uppercase tracking-widest rounded-lg border border-purple-700/60 hover:border-purple-400 hover:text-white text-[9px] transition-all cursor-pointer"
                  >
                    [ ALIGN FOCUS SYSTEM TO ALL REGIONS ]
                  </motion.button>
                </div>
              ) : (
                <div className="max-h-[500px] overflow-y-auto space-y-4 pr-1 bg-black/40 p-2 pb-1 sm:p-3 sm:pb-1 rounded-xl border border-purple-500/5 scrollbar-thin">
                  {matchedBeacons.map((beacon, idx) => {
                    const mappedBand = bands.find(b => b.name.toLowerCase() === beacon.band_name.toLowerCase());
                    return (
                    <motion.div 
                      key={`${beacon.id}-${idx}`}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="w-full relative border border-purple-500/10 bg-[#0d0713]/85 hover:bg-[#120a1c]/95 hover:border-purple-500/50 p-4 sm:p-6 sm:p-7 pt-10 sm:pt-9 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-5 transition-all duration-300 text-center sm:text-left hover:shadow-[0_0_25px_rgba(168,85,247,0.2)] group"
                    >
                      {selectedFrequency === 'ALL' && (
                        <div className="absolute top-2.5 right-3 text-[8px] font-mono text-purple-400 font-extrabold uppercase border border-purple-950 bg-black/80 px-2 py-0.5 rounded tracking-wider shrink-0 select-none z-10">
                          // FREQ: {beacon.genre_tags?.[0]?.toUpperCase() || 'GENERAL'}
                        </div>
                      )}
                      <div className="space-y-3 flex-grow w-full min-w-0 pt-2 sm:pt-0">
                        <div className="flex flex-col sm:flex-row flex-wrap items-center gap-2 sm:gap-3 justify-center sm:justify-start min-w-0">
                          <span className="bg-gradient-to-r from-purple-900 to-fuchsia-950 text-white border border-purple-500/40 text-[13px] sm:text-[14px] font-black uppercase px-4 py-2 rounded-md tracking-wider leading-none shadow-md max-w-full whitespace-normal break-words">
                            {beacon.band_name}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1.5 justify-center sm:justify-start shrink-0">
                            TARGET: <strong className="text-[#00ffcc] uppercase bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/20">{beacon.target_region.toUpperCase()}</strong>
                          </span>
                          {mappedBand?.music_link && (
                            <a 
                              href={mappedBand.music_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] text-blue-400 border border-blue-900/50 bg-blue-950/30 hover:bg-blue-900/60 font-bold uppercase px-2 py-1 rounded transition-colors flex items-center gap-1 shrink-0"
                            >
                              <PlayCircle className="w-3.5 h-3.5" /> LISTEN
                            </a>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 tracking-wide font-mono whitespace-normal break-words leading-relaxed">
                          Schedule Window: <span className="text-purple-300 font-bold">{beacon.start_date}</span> to <span className="text-purple-300 font-bold">{beacon.end_date}</span>
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 shrink-0 w-full sm:w-48 items-center sm:items-stretch justify-center">
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleFormulateOfferFromBeacon(beacon)}
                          className="w-full max-w-[280px] sm:max-w-none px-3.5 py-2.5 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 border border-[#00ffcc]/40 hover:border-[#00ffcc] text-white font-extrabold tracking-widest rounded-lg text-[9px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md text-center"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#00ffcc] animate-pulse shrink-0" />
                          <span>[ Formulate Offer ]</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleInitiatePitch(beacon)}
                          className="w-full max-w-[280px] sm:max-w-none px-3.5 py-2.5 bg-purple-950/80 hover:bg-purple-900/50 border border-purple-800/40 hover:border-purple-400 text-purple-300 hover:text-white font-black tracking-widest rounded-lg text-[9px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md text-center"
                        >
                          <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                          <span>[ Direct Email ]</span>
                        </motion.button>
                        
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => handleDismissBeacon(beacon.id)}
                          className="w-full max-w-[280px] sm:max-w-none px-3.5 py-2.5 bg-red-950/10 hover:bg-red-950/40 border border-red-900/20 hover:border-red-500/40 text-zinc-500 hover:text-red-400 font-black tracking-widest rounded-lg text-[9px] uppercase flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-none text-center"
                        >
                          <X className="w-3 shrink-0" />
                          <span>[ DISMISS ]</span>
                        </motion.button>
                      </div>
                    </motion.div>
                  )})}
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
            ) : (activePortalTab === 'offers' && !showOnlyCalendar && !showOnlyRoutingAndAvailability) ? (
        <motion.div
          key="offers"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col gap-6 w-full"
        >
          <div className="border border-orange-900/40 bg-black/65 backdrop-blur-md p-5 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-orange-900/40 pb-4 mb-5">
              <div className="flex items-center gap-2">
                <span className="text-orange-400">📜</span>
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Event Lineup Builder</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsLineupsExpanded(!isLineupsExpanded)}
                  className="px-4 py-2 border border-zinc-700 hover:bg-zinc-800 text-zinc-300 text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer"
                >
                  {isLineupsExpanded ? 'HIDE EVENTS' : 'SHOW EVENTS'}
                </button>
                <button 
                  onClick={() => setIsCreatingLineup(!isCreatingLineup)}
                className="px-4 py-2 border border-orange-500/50 hover:bg-orange-950/40 text-orange-400 text-[10px] uppercase font-bold tracking-wider rounded transition-all cursor-pointer shadow-[0_0_10px_rgba(249,115,22,0.1)] hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]"
              >
                {isCreatingLineup ? '✕ CANCEL' : '+ CREATE NEW LINEUP'}
              </button>
              </div>
            </div>

            {isCreatingLineup && (
              <form onSubmit={handleCreateLineup} className="mb-8 p-4 bg-orange-950/10 border border-orange-900/30 rounded-xl space-y-4 shadow-inner">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Lineup / Event Name</label>
                    <input 
                      type="text"
                      value={newLineupName}
                      onChange={(e) => setNewLineupName(e.target.value)}
                      placeholder="e.g. Texas Chainsaw Fest"
                      className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Date</label>
                    <input 
                      type="date"
                      value={newLineupDate}
                      onChange={(e) => setNewLineupDate(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono [color-scheme:dark]"
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Venue Name</label>
                    <input 
                      type="text"
                      value={newLineupVenue}
                      onChange={(e) => setNewLineupVenue(e.target.value)}
                      placeholder="e.g. Red Blood Club"
                      className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-zinc-900/60 pt-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Stage Name (Optional)</label>
                    <input 
                      type="text"
                      value={newLineupStage}
                      onChange={(e) => setNewLineupStage(e.target.value)}
                      placeholder="e.g. Main Stage, Basement Lounge, Second Room"
                      className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Timing Slot (Optional)</label>
                    <select
                      value={newLineupTimeSlot}
                      onChange={(e) => setNewLineupTimeSlot(e.target.value)}
                      className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono"
                    >
                      <option value="all-day">Full Day Show / Standard</option>
                      <option value="early">Early Show (Matinee / Afternoon)</option>
                      <option value="late">Late Show (Main Clubnight / Nite support)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-orange-900 to-red-900 hover:from-orange-800 hover:to-red-800 text-white font-black text-[10px] font-mono tracking-widest rounded shadow-xl uppercase transition-all cursor-pointer">
                    INITIALIZE LINEUP SECURE WORKSPACE
                  </button>
                </div>
              </form>
            )}

            {isLineupsExpanded && (
            <div className="space-y-5">
              {lineups.length === 0 ? (
                <div className="text-center p-10 bg-zinc-950/30 rounded-xl border border-zinc-900/50">
                  <span className="text-3xl mb-3 block opacity-50"> 📜 </span>
                  <p className="text-zinc-500 font-mono text-[11px] uppercase tracking-widest">No lineups created yet. Initialize your first event workspace.</p>
                </div>
              ) : (
                lineups.map((lineup, idx) => {
                  const lineupOffers = promoterOffers.filter(o => o.event_id === lineup.id);
                  return (
                    <div key={`${lineup.id}-${idx}`} className="border border-orange-950 bg-[#0a0705] rounded-xl overflow-hidden shadow-2xl">
                      <div className="bg-gradient-to-r from-orange-950/40 to-black p-4 border-b border-orange-950/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h4 className="text-orange-400 font-black tracking-widest uppercase text-sm flex items-center gap-2">
                            {lineup.name}
                            <span className="text-[9px] font-mono bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-400 border border-zinc-800">
                              {lineupOffers.length} Bands Added
                            </span>
                          </h4>
                          <p className="text-[10px] text-zinc-500 font-mono mt-1">
                            {lineup.date} @ {lineup.venue_name} {lineup.stage_name ? `| 🏛️ Stage: ${lineup.stage_name}` : ''} {lineup.time_slot ? `| ⏳ Slot: ${lineup.time_slot.toUpperCase()}` : ''}
                          </p>
                        </div>
                        <button 
                          onClick={() => {
                            setActivePortalTab('offers');
                            setFormEventId(lineup.id);
                            setFormVenue(lineup.venue_name);
                            setFormDate(lineup.date);
                            triggerNotification?.(`Context shifted to adding offers for ${lineup.name}`);
                          }}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:scale-105 transition-transform text-white font-black font-mono text-[9px] uppercase tracking-widest shadow-[0_0_15px_rgba(249,115,22,0.4)] cursor-pointer rounded"
                        >
                          + ADD NEW OFFER TO LINEUP
                        </button>
                      </div>
                      
                      <div className="p-4 bg-black/60">
                        {lineupOffers.length === 0 ? (
                          <div className="text-center p-4">
                            <p className="text-zinc-600 font-mono text-[10px] uppercase">Roster is empty. Add bands to see them listed here.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead>
                                <tr className="border-b border-zinc-900">
                                  <th className="pb-2 text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Artist / Band</th>
                                  <th className="pb-2 text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Status</th>
                                  <th className="pb-2 text-[9px] font-mono text-zinc-500 uppercase tracking-wider font-bold">Guarantee</th>
                                </tr>
                              </thead>
                              <tbody>
                                {lineupOffers.map((o, oIdx) => (
                                  <tr key={`lineup-offer-${lineup.id}-${o.id}-${oIdx}`} className="border-b border-zinc-900/50 hover:bg-zinc-950/50 transition-colors">
                                    <td className="py-3 text-xs text-zinc-300 font-bold">{o.band_name}</td>
                                    <td className="py-3">
                                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase tracking-widest ${
                                        o.status === 'accepted' ? 'bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/30' :
                                        o.status === 'declined' ? 'bg-red-500/10 text-red-500 border border-red-500/30' :
                                        o.status === 'renegotiating' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                                        'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                      }`}>
                                        {o.status}
                                      </span>
                                    </td>
                                    <td className="py-3 text-xs text-zinc-400 font-mono">${o.guarantee_amount.toLocaleString()}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            )}
          </div>
          {/* Always Visible Contract Statuses (Booking Staging Zone) */}
          <div className="w-full bg-black/60 border border-purple-900/20 p-5 rounded-2xl text-left shadow-xl space-y-4">
            <div className="flex items-center gap-2 border-b border-zinc-900 pb-2">
              <span className="text-purple-400 text-sm">📊</span>
              <h4 className="text-xs font-black uppercase text-white tracking-widest" style={{ fontSize: '15px' }}>Contract Statuses</h4>
            </div>
            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              Visual queue indicating active contract statuses throughout the regional regional booking cycle. System tracks state transitions from drafting to live show specs file confirmations.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 font-mono">
              {/* Drafts */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/50 border border-zinc-900 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Drafting</span>
                </div>
                <span className="text-[9px] bg-amber-955/40 text-amber-400 border border-amber-900/30 px-1.5 py-0.5 rounded font-bold">
                  {promoterOffers.filter(o => o.status === 'interested').length}
                </span>
              </div>

              {/* Pending */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/50 border border-zinc-900 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc]" />
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider">Pending</span>
                </div>
                <span className="text-[9px] bg-purple-955/40 text-purple-400 border border-purple-900/30 px-1.5 py-0.5 rounded font-bold">
                  {promoterOffers.filter(o => o.status === 'pending').length}
                </span>
              </div>

              {/* Counters */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/50 border border-zinc-900 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-400 shadow-[0_0_8px_#f97316]" />
                  <span className="text-[9px] font-bold text-orange-400 uppercase tracking-wider">Counters</span>
                </div>
                <span className="text-[9px] bg-orange-955/40 text-orange-400 border border-orange-900/30 px-1.5 py-0.5 rounded font-bold">
                  {promoterOffers.filter(o => o.status === 'renegotiating').length}
                </span>
              </div>

              {/* Rejected */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/50 border border-zinc-900 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-600 shadow-[0_0_8px_#dc2626]" />
                  <span className="text-[9px] font-bold text-red-305 uppercase tracking-wider" style={{ color: '#ed0017' }}>Rejected</span>
                </div>
                <span className="text-[9px] bg-red-955/20 text-red-450 border border-red-900/30 px-1.5 py-0.5 rounded font-bold" style={{ color: '#e60000' }}>
                  {promoterOffers.filter(o => o.status === 'declined').length}
                </span>
              </div>

              {/* Confirmed */}
              <div className="flex items-center justify-between p-2.5 bg-zinc-950/50 border border-zinc-900 rounded-xl col-span-2 md:col-span-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#39ff14] shadow-[0_0_8px_#39ff14]" />
                  <span className="text-[9px] font-bold text-[#39ff14] uppercase tracking-wider">Confirmed</span>
                </div>
                <span className="text-[9px] bg-emerald-955/40 text-[#39ff14] border border-emerald-500/30 px-1.5 py-0.5 rounded font-bold">
                  {promoterOffers.filter(o => o.status === 'accepted').length}
                </span>
              </div>
            </div>
          </div>

          {/* Collapsible Card for Quick-Offer Booking Templates */}
          <div className="w-full bg-black/60 border border-purple-900/20 p-5 rounded-2xl text-left shadow-lg">
            <button
              type="button"
              onClick={() => setShowQuickTemplates(!showQuickTemplates)}
              className="w-full flex items-center justify-between font-mono font-black text-xs text-purple-400 cursor-pointer bg-transparent focus:outline-none"
            >
              <div className="flex items-center gap-2">
                <span>⚡</span>
                <span className="uppercase tracking-wider">Quick-Offer Booking Templates</span>
              </div>
              <span 
                className="text-[10px] text-[#00ffcc] uppercase font-black tracking-widest font-mono"
                style={{ fontSize: '9px', width: '84.5174px' }}
              >
                {showQuickTemplates ? "[ ▲ COLLAPSE ]" : "[ ▼ EXPAND ]"}
              </span>
            </button>

            {showQuickTemplates && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 space-y-4">
                <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                  Select a high-speed pre-configured guarantee & technical rider template to populate the contract formulation workspace instantly.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-left">
                  <button
                    type="button"
                    onClick={() => {
                      applyBookingTemplate('standard');
                      triggerNotification?.("Applied Club Standard Template");
                    }}
                    className="p-3 text-left border border-zinc-900 hover:border-purple-500 hover:bg-purple-950/15 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-white group-hover:text-purple-300">🏟️ CLUB STANDARD</span>
                      <span className="text-[9px] font-extrabold text-green-400">$1,000 Flat</span>
                    </div>
                    <p className="text-[8.5px] text-zinc-500 font-sans mt-1">Recommended for standard regional headline club shows.</p>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => {
                      applyBookingTemplate('metal');
                      triggerNotification?.("Applied Heavy Metal Special Template");
                    }}
                    className="p-3 text-left border border-zinc-900 hover:border-purple-500 hover:bg-purple-950/15 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-white group-hover:text-purple-300">🤘 HEAVY METAL SPECIAL</span>
                      <span className="text-[9px] font-extrabold text-[#00ffcc]">$2,500 + Specs</span>
                    </div>
                    <p className="text-[8.5px] text-zinc-500 font-sans mt-1">Detailed monitor requirements, 100% backline, dinner buyout.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      applyBookingTemplate('festival_headline');
                      triggerNotification?.("Applied Festival Hero Headline Template");
                    }}
                    className="p-3 text-left border border-zinc-900 hover:border-purple-505 hover:bg-purple-950/15 rounded-xl transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black text-white group-hover:text-purple-305">🎪 FESTIVAL HEADLINE</span>
                      <span className="text-[9px] font-extrabold text-green-400">$8,000 + Extras</span>
                    </div>
                    <p className="text-[8.5px] text-zinc-500 font-sans mt-1">Premium contract tier. High guest list privileges and fully catered dressing rooms.</p>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* 4-Step Contract Creation Wizard */}
          <form onSubmit={handleSubmitOfferForm} className="space-y-4 flex flex-col items-start w-full" id="offers-formulator-grid">
            
            {/* Title Card */}
            <div className="w-[343px] bg-black/65 backdrop-blur-md border border-orange-900/40 p-4 rounded-xl text-left flex items-center gap-2 shadow-lg">
              <span className="text-orange-400 text-sm animate-pulse">📜</span>
              <h4 className="text-xs font-black uppercase text-white tracking-widest" style={{ fontSize: '15px' }}>4-Step Contract Creation Wizard</h4>
            </div>

            {/* Step 1: Talent & Logistics */}
            <div className="w-[343px] border border-zinc-900/80 rounded-xl overflow-hidden bg-black/65 backdrop-blur-md transition-all duration-300 shadow-lg text-left">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep === 1 ? 0 : 1)}
                className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                  currentStep === 1
                    ? 'bg-zinc-900/50 text-yellow-400 border-b border-zinc-900/80'
                    : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded font-mono font-bold">STEP 01</span>
                  <span className="text-xs font-black uppercase tracking-wider">Talent & Logistics</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">{currentStep === 1 ? '[ Collapse − ]' : '[ Expand + ]'}</span>
              </button>

              {currentStep === 1 && (
                <div className="p-4 space-y-4">
                  <div className="flex flex-col gap-2.5 items-stretch">
                    <div className="flex-1">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Artist Targeting Module</label>
                      <input type="text" value={bandSearchQuery} onChange={(e) => setBandSearchQuery(e.target.value)} placeholder="Search Artist locator bar..." className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono" />
                    </div>
                    <div className="flex gap-2">
                      <button type="button" className="text-[9px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2.5 rounded text-zinc-300 font-mono flex-1 transition-all">Global Search</button>
                      <button type="button" className="text-[9px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-3 py-2.5 rounded text-zinc-300 font-mono flex-1 transition-all">Active Locals</button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-1">Select Found Artist</label>
                    <select value={formBandId} onChange={(e) => setFormBandId(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono" required>
                      <option value="" className="bg-zinc-950 text-zinc-500">-- Select Found Artist --</option>
                      {filteredFormBands.map((b, bIdx) => (
                        <option key={`${b.id}-${bIdx}`} value={b.id} className="bg-zinc-950 text-white">{b.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="w-full bg-orange-950/20 border border-orange-500/25 p-3 rounded-xl flex flex-col gap-2 items-start justify-between">
                    <div>
                      <span className="text-[10px] text-orange-400 font-black uppercase tracking-wider block">Auto-Fill Saved Venue Profile</span>
                      <span className="text-[9px] text-zinc-500 font-sans block mt-0.5">Quickly load address coordinates from the top active location.</span>
                    </div>
                    <button type="button" onClick={() => {
                      if (activeAllVenues && activeAllVenues[selectedVenueIndex]) {
                        const v = activeAllVenues[selectedVenueIndex];
                        setFormVenue(v.name || '');
                        setFormAddress(v.address || '');
                        setFormCity(v.city || '');
                        setFormState(v.state || '');
                        triggerNotification?.("Injected active venue coordinates into contract worksheet.");
                      } else {
                        triggerNotification?.("No active venue coordinates loaded.");
                      }
                    }} className="bg-orange-500 hover:bg-orange-400 text-black text-[9px] px-3.5 py-1.5 rounded-lg font-black uppercase cursor-pointer self-stretch text-center transition-all">Inject</button>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Show Format Type</label>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setFormShowType('standard')} className={`flex-1 py-2 rounded-lg border text-xs font-mono uppercase cursor-pointer transition-all ${formShowType === 'standard' ? 'bg-zinc-800 border-yellow-500 text-yellow-500 font-bold' : 'border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>[ Standard ]</button>
                        <button type="button" onClick={() => setFormShowType('festival')} className={`flex-1 py-2 rounded-lg border text-xs font-mono uppercase cursor-pointer transition-all ${formShowType === 'festival' ? 'bg-zinc-800 border-yellow-500 text-yellow-500 font-bold' : 'border-zinc-800 text-zinc-500 hover:text-zinc-400'}`}>[ Festival ]</button>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Target Show Date</label>
                      <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono [color-scheme:dark]" required />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Financials & Venue Specs */}
            <div className="w-[343px] border border-zinc-900/80 rounded-xl overflow-hidden bg-black/65 backdrop-blur-md transition-all duration-300 shadow-lg text-left">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep === 2 ? 0 : 2)}
                className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                  currentStep === 2
                    ? 'bg-zinc-900/50 text-emerald-400 border-b border-zinc-900/80'
                    : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">STEP 02</span>
                  <span className="text-xs font-black uppercase tracking-wider">Financials & Venue Specs</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">{currentStep === 2 ? '[ Collapse − ]' : '[ Expand + ]'}</span>
              </button>

              {currentStep === 2 && (
                <div className="p-4 space-y-4">
                  <div className="space-y-1.5 bg-zinc-950/40 p-4 border border-emerald-900/30 rounded-xl">
                    <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block text-center">Guarantee Fee ($)</label>
                    <input type="number" value={formGuarantee} onChange={(e) => setFormGuarantee(e.target.value)} placeholder="0.00" className="w-full bg-black/50 border border-emerald-900/30 p-3 rounded-lg text-xl text-center text-emerald-400 font-black uppercase font-mono tracking-wider" required />
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Venue Name</label>
                      <input type="text" value={formVenue} onChange={(e) => setFormVenue(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Venue Address</label>
                      <input type="text" value={formAddress} onChange={(e) => setFormAddress(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono" required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">City</label>
                      <input type="text" value={formCity} onChange={(e) => setFormCity(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono" required />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">State / Province</label>
                      <input type="text" value={formState} onChange={(e) => setFormState(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white uppercase font-mono" required />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Deal Clauses & Exclusivity */}
            <div className="w-[343px] border border-zinc-900/80 rounded-xl overflow-hidden bg-black/65 backdrop-blur-md transition-all duration-300 shadow-lg text-left">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep === 3 ? 0 : 3)}
                className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                  currentStep === 3
                    ? 'bg-zinc-900/50 text-purple-400 border-b border-zinc-900/80'
                    : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/30 px-2 py-0.5 rounded font-mono font-bold">STEP 03</span>
                  <span className="text-xs font-black uppercase tracking-wider">Deal Clauses & Exclusivity</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">{currentStep === 3 ? '[ Collapse − ]' : '[ Expand + ]'}</span>
              </button>

              {currentStep === 3 && (
                <div className="p-4 space-y-4">
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Deposit Amount ($)</label>
                      <input type="number" value={formDeposit} onChange={(e) => setFormDeposit(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Deposit Due Date</label>
                      <input type="date" value={formDepositDate} onChange={(e) => setFormDepositDate(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono [color-scheme:dark]" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Currency</label>
                      <select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono">
                        <option value="USD">USD ($)</option>
                        <option value="CAD">CAD ($)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="GBP">GBP (£)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Target Stage / Space</label>
                      <input type="text" value={formStageName} onChange={(e) => setFormStageName(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Expected Attendance</label>
                      <select value={formExpectedAttendance} onChange={(e) => setFormExpectedAttendance(e.target.value as any)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono">
                        <option value="100-300">100-300 attendees</option>
                        <option value="300-700">300-700 attendees</option>
                        <option value="700+">700+ attendees</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Ticket Cut %</label>
                      <input type="number" value={formVenueCut} onChange={(e) => setFormVenueCut(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Merch Cut %</label>
                      <input type="number" value={formMerchCut} onChange={(e) => setFormMerchCut(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Radius / Exclusivity Limits</label>
                      <textarea rows={2} value={formRadiusClause} onChange={(e) => setFormRadiusClause(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono resize-none" placeholder="e.g., No other local shows within 100mi."></textarea>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Rider & Technical Notes</label>
                      <textarea rows={2} value={formNotes} onChange={(e) => setFormNotes(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono resize-none" placeholder="e.g., Backline specs, catered kitchen buyouts."></textarea>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Proposal Expiration</label>
                      <input type="datetime-local" value={formExpiration} onChange={(e) => setFormExpiration(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono [color-scheme:dark]" />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Step 4: Day Sheet & Itinerary */}
            <div className="w-[343px] border border-zinc-900/80 rounded-xl overflow-hidden bg-black/65 backdrop-blur-md transition-all duration-300 shadow-lg text-left">
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep === 4 ? 0 : 4)}
                className={`w-full text-left px-4 py-4 flex items-center justify-between transition-colors cursor-pointer ${
                  currentStep === 4
                    ? 'bg-zinc-900/50 text-blue-400 border-b border-zinc-900/80'
                    : 'text-zinc-400 hover:bg-zinc-900/30 hover:text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-mono font-bold">STEP 04</span>
                  <span className="text-xs font-black uppercase tracking-wider">Day Sheet & Itinerary</span>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">{currentStep === 4 ? '[ Collapse − ]' : '[ Expand + ]'}</span>
              </button>

              {currentStep === 4 && (
                <div className="p-4 space-y-4">
                  <div className="p-3 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block mb-3 text-left">Itinerary Timeline</label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase block">Load-In</label>
                        <input type="time" value={formLoadIn} onChange={(e) => setFormLoadIn(e.target.value)} className="w-full bg-black/60 border border-zinc-800 p-2 rounded text-xs text-white font-mono [color-scheme:dark]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase block">Doors</label>
                        <input type="time" value={formDoorTime} onChange={(e) => setFormDoorTime(e.target.value)} className="w-full bg-black/60 border border-zinc-800 p-2 rounded text-xs text-white font-mono [color-scheme:dark]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase block">Soundcheck</label>
                        <input type="time" value={formSoundcheck} onChange={(e) => setFormSoundcheck(e.target.value)} className="w-full bg-black/60 border border-zinc-800 p-2 rounded text-xs text-white font-mono [color-scheme:dark]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase block">Merch Call</label>
                        <input type="time" value={formMerchCall} onChange={(e) => setFormMerchCall(e.target.value)} className="w-full bg-black/60 border border-zinc-800 p-2 rounded text-xs text-white font-mono [color-scheme:dark]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase block">Set Time</label>
                        <input type="time" value={formSetTime} onChange={(e) => setFormSetTime(e.target.value)} className="w-full bg-black/60 border border-zinc-800 p-2 rounded text-xs text-white font-mono [color-scheme:dark]" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 font-mono uppercase block">Curfew</label>
                        <input type="time" value={formCurfewTime} onChange={(e) => setFormCurfewTime(e.target.value)} className="w-full bg-black/60 border border-zinc-800 p-2 rounded text-xs text-white font-mono [color-scheme:dark]" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Dinner Arrangements</label>
                      <input type="text" value={formDinnerArrangements} onChange={(e) => setFormDinnerArrangements(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono" placeholder="e.g., $25 buyout or catered." />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Travel / Lodging</label>
                      <input type="text" value={formTravelArrangements} onChange={(e) => setFormTravelArrangements(e.target.value)} className="w-full bg-black/50 border border-zinc-800 p-2.5 rounded-lg text-xs text-white font-mono" placeholder="e.g., booked under TM." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="w-[343px] flex flex-col gap-2.5 pt-2">
              <button type="button" onClick={() => {
                triggerNotification?.("Simulated contract draft saved successfully.");
              }} className="w-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-mono text-xs py-3.5 rounded-lg cursor-pointer text-center transition-all">
                [ 💾 SAVE CONTRACT DRAFT ]
              </button>
              <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-mono font-bold text-xs py-3.5 rounded-lg uppercase tracking-widest transition-all cursor-pointer text-center">
                [ 🚀 DISPATCH DIRECT PROPOSAL ]
              </button>
            </div>
          </form>

          {/* Direct Contracts & Dispatched Proposals Log */}
          <div className="w-full border border-purple-500/20 bg-black/65 backdrop-blur-md p-5 rounded-2xl space-y-5 shadow-2xl hover:border-purple-500/40 transition-all duration-300 text-left w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-3 w-full min-w-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400 animate-pulse" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">DISPATCHED PROPOSALS & CONTRACTS</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDispatchedCollapse(!showDispatchedCollapse)}
                className="text-[9px] text-[#cc00ff] hover:text-[#00ffcc] uppercase font-mono font-bold tracking-wider px-2 py-1 bg-purple-950/20 border border-purple-900/50 rounded transition-all cursor-pointer"
              >
                {showDispatchedCollapse ? "[ Expand Log ]" : "[ Collapse Log ]"}
              </button>
            </div>

            {!showDispatchedCollapse && (
              <>
            {promoterOffers.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-purple-950/50 rounded-xl space-y-3 bg-purple-950/5">
                <AlertCircle className="w-7 h-7 text-purple-900 mx-auto" />
                <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest">
                  NO DIRECT CONTRACT PROPOSALS TRANSMITTED YET.
                </p>
                <p className="text-[10px] text-zinc-600 max-w-xs mx-auto text-center leading-normal">
                  Select a registered band profile on the left sidebar to draft a formal agreement.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1 font-mono w-full min-w-0">
                {promoterOffers.map((offer, idx) => (
                  <div 
                    key={`${offer.id}-${idx}`} 
                    className={`border border-purple-900/40 rounded-lg p-3 text-xs space-y-3 transition-all min-w-0 w-full overflow-hidden ${
                      offer.status === 'accepted' ? 'border-emerald-500/30 bg-[#0c1f13]/30' : 
                      offer.status === 'renegotiating' ? 'border-purple-500/40 bg-purple-900/10' : 
                      offer.status === 'declined' ? 'border-red-500/20 bg-red-950/10' : 'bg-black/40'
                    }`}
                  >
                    
                    {/* Header line: Band Info & proposed details */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 min-w-0">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 min-w-0 w-full sm:w-auto">
                        {offer.status === 'pending' && (
                          <span className="text-[#00ffcc] bg-[#00ffcc]/10 border border-[#00ffcc]/30 px-2 py-1 rounded text-[10px] uppercase font-black min-w-[95px] text-center tracking-widest shadow-[0_0_10px_rgba(0,255,204,0.1)] shrink-0">[ PENDING ]</span>
                        )}
                        {offer.status === 'accepted' && (
                          <span className="text-[#39ff14] bg-[#39ff14]/10 border border-[#39ff14]/30 px-2 py-1 rounded text-[10px] uppercase font-black min-w-[95px] text-center tracking-widest shadow-[0_0_10px_rgba(57,255,20,0.1)] shrink-0">[ ACCEPTED ]</span>
                        )}
                        {offer.status === 'renegotiating' && (
                          <span className="text-[#cc00ff] bg-[#cc00ff]/10 border border-[#cc00ff]/30 px-2 py-1 rounded text-[10px] uppercase font-black min-w-[95px] text-center tracking-widest animate-pulse shadow-[0_0_10px_rgba(204,0,255,0.15)] shrink-0">[ COUNTERED ]</span>
                        )}
                        {offer.status === 'declined' && (
                          <span className="text-[#dc143c] bg-[#dc143c]/10 border border-[#dc143c]/30 px-2 py-1 rounded text-[10px] uppercase font-black min-w-[95px] text-center tracking-widest shadow-[0_0_10px_rgba(220,20,60,0.1)] shrink-0">[ REJECTED ]</span>
                        )}

                        <div className="flex flex-col gap-0.5 min-w-0 w-full">
                          <span className="font-black text-white text-sm uppercase tracking-wider block truncate">
                            {offer.band_name}
                          </span>
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-0.5 text-[9px] text-zinc-500 uppercase min-w-0">
                            <span className="text-purple-300 font-bold shrink-0">{offer.date}</span>
                            <span className="shrink-0 text-zinc-700">|</span>
                            <span className="break-words whitespace-normal text-zinc-400">
                              {offer.venue_name}
                              {offer.stage_name ? ` [Stage: ${offer.stage_name}]` : ''} ({offer.city}{offer.state_province ? `, ${offer.state_province}` : ''})
                            </span>
                            <span className="shrink-0 text-zinc-700">|</span>
                            <span className={`shrink-0 ${
                              offer.show_type === 'festival' ? 'text-[#00ffcc] font-bold' : 'text-zinc-550'
                            }`}>
                              {offer.show_type === 'festival' ? 'FESTIVAL' : 'STANDARD'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-left sm:text-right flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center w-full sm:w-auto border-t border-purple-950/40 sm:border-t-0 pt-2 sm:pt-0 shrink-0">
                        <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest sm:mb-0.5">GUARANTEE</p>
                        <p className="text-green-400 font-black text-xs tracking-wider">${offer.guarantee_amount}</p>
                      </div>
                    </div>

                    {offer.notes && (
                      <div className="bg-black/40 p-2.5 border border-purple-950 rounded text-[10.5px] text-zinc-400 font-mono italic leading-relaxed break-words whitespace-pre-wrap w-full min-w-0">
                        <span className="text-[9px] text-purple-400 font-bold block not-italic uppercase mb-1">Contract Specifications:</span>
                        "{offer.notes}"
                      </div>
                    )}

                    {/* Cuts & Lineup Details */}
                    {(offer.venue_cut_percentage || offer.merch_cut_percentage || offer.show_lineup) && (
                      <div className="flex flex-col gap-1.5 p-2.5 bg-black/40 border border-purple-950 rounded font-mono text-[10px] w-full min-w-0">
                        {offer.show_lineup && (
                          <div className="text-zinc-300 leading-normal"><strong className="text-purple-400 uppercase text-[9px] block">Lineup / Support:</strong>{offer.show_lineup}</div>
                        )}
                        {(offer.venue_cut_percentage || offer.merch_cut_percentage) && (
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[9px] uppercase font-bold text-purple-300 border-t border-purple-950/40 pt-1 mt-1">
                            {offer.venue_cut_percentage && (
                              <span className="flex items-center gap-1">🏛️ Venue Cut: <span className="text-[#00ffcc]">{offer.venue_cut_percentage}%</span></span>
                            )}
                            {offer.merch_cut_percentage && (
                              <span className="flex items-center gap-1">👕 Merch Cut: <span className="text-orange-400">{offer.merch_cut_percentage}%</span></span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* RENEGOTIATION / COUNTER DOCK BLOCK */}
                    {offer.status === 'renegotiating' && (
                      <div className="border border-amber-500/30 bg-[#2b2114]/40 p-3 rounded-lg space-y-2.5">
                        <p className="font-black text-amber-400 text-[10.5px] uppercase tracking-wide">
                          Band Proposed Counters:
                        </p>
                        
                        {offer.renegotiation_notes && (
                          <p className="text-[10px] text-zinc-300 font-mono leading-relaxed bg-[#1b150c] p-2 rounded break-words whitespace-pre-wrap w-full min-w-0">
                            "{offer.renegotiation_notes}"
                          </p>
                        )}
                        <p className="text-[11px] text-zinc-400">
                          Proposed Counter Guarantee: <strong className="text-green-400">${offer.guarantee_amount} USD</strong>
                        </p>

                        {renegotiatingId === offer.id ? (
                          <form onSubmit={(e) => handleSubmitCounterPropose(e, offer)} className="space-y-2.5 bg-black/40 p-3 rounded border border-purple-950 text-left mt-2 shadow-inner">
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-500 font-bold block" htmlFor={`counter-amount-${offer.id}`}>NEW OFFER AMOUNT ($)</label>
                              <input 
                                id={`counter-amount-${offer.id}`}
                                type="number" 
                                value={counterProposalAmount} 
                                onChange={(e) => setCounterProposalAmount(e.target.value)} 
                                className="bg-[#111319] border border-purple-900 text-xs p-1.5 rounded text-white font-extrabold"
                                required
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[9px] text-zinc-500 font-bold block" htmlFor={`counter-notes-${offer.id}`}>TERMS NOTES</label>
                              <textarea 
                                id={`counter-notes-${offer.id}`}
                                value={counterProposalNotes} 
                                onChange={(e) => setCounterProposalNotes(e.target.value)} 
                                placeholder="Catering enhancements, transit coverage, etc."
                                className="w-full bg-[#111319] border border-purple-900 text-xs p-1.5 rounded text-white focus:outline-none"
                                rows={2}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button type="submit" className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded text-[9.5px]">TRANS-COUNTER</button>
                              <button type="button" onClick={() => setRenegotiatingId(null)} className="px-3 py-1 bg-zinc-800 text-zinc-400 hover:text-white rounded text-[9.5px]">CANCEL</button>
                            </div>
                          </form>
                        ) : (
                          <div className="flex flex-wrap gap-2 pt-1 border-t border-amber-500/15">
                            <button
                              onClick={() => handleAcceptBandCounter(offer)}
                              className="px-3.5 py-1.5 bg-green-950/80 hover:bg-green-700/60 border border-green-500 hover:border-green-300 text-green-300 hover:text-white font-black uppercase text-[9px] rounded transition-colors"
                            >
                              [ Accept Flat Fee Counter ]
                            </button>
                            <button
                              onClick={() => handleOpenCounterForm(offer)}
                              className="px-3.5 py-1.5 bg-purple-950/80 hover:bg-purple-900/40 border border-purple-700 hover:border-purple-400 text-purple-300 hover:text-white font-black uppercase text-[9px] rounded transition-colors"
                            >
                              [ Re-Counter Propose ]
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ACCEPTED SHOWS - ADDITIONAL TOUR DETAILS SUBMITTER FORMS */}
                    {offer.status === 'accepted' && (
                      <div className="border border-emerald-500/40 bg-green-950/10 p-3.5 rounded-lg space-y-3 shadow-inner">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-emerald-400" />
                          <p className="font-extrabold text-[#00ffcc] text-[10.5px] uppercase tracking-wide">
                            Touring details request pending:
                          </p>
                        </div>

                        {offer.details_completed ? (
                          <div className="space-y-2 text-zinc-400 font-mono text-[10px]">
                            <p className="text-emerald-300/80 font-bold leading-none">🟢 SYNCHRONIZATION COMPLETED SUCCESSFUL!</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 bg-black/40 p-3 rounded-lg border border-emerald-950/60 font-mono text-[10px] w-full min-w-0 break-words">
                              <p className="break-all sm:col-span-2"><strong className="text-emerald-400">VENUE ADDR:</strong> {offer.venue_address}</p>
                              <p><strong className="text-zinc-500">LOAD IN:</strong> {offer.load_in_time}</p>
                              <p><strong className="text-[#00ffcc]/80">SET TIME:</strong> {offer.set_time}</p>
                              <p className="sm:col-span-2 break-normal"><strong className="text-zinc-500">EXPECTED:</strong> {offer.expected_attendance}</p>
                            </div>
                            {offer.additional_notes && <p className="break-words whitespace-pre-wrap w-full min-w-0"><strong className="text-zinc-500">TECH SPEC RIDER:</strong> "{offer.additional_notes}"</p>}
                          </div>
                        ) : (
                          <div className="space-y-2 text-zinc-400 text-[10.5px]">
                            <p className="leading-relaxed">
                              Tour managers require show logistics (Load-in, Address, Expected Attendance, Set Time, Curfew) to file day sheets. Submit specifications below.
                            </p>

                            {submittingDetailsId === offer.id ? (
                              <form onSubmit={(e) => handleSubmitDetailsForm(e, offer)} className="space-y-3 bg-black/50 p-3.5 rounded border border-emerald-500/25 mt-2.5">
                                <div className="space-y-1 text-left">
                                  <label htmlFor={`address-${offer.id}`} className="text-[9.5px] text-zinc-500 font-bold block">
                                    Full Street Venue Address <span className="text-red-500">*</span>
                                  </label>
                                  <input 
                                    id={`address-${offer.id}`}
                                    type="text" 
                                    placeholder="e.g. 606 E Red River St, Austin, TX 78701" 
                                    value={detailAddress}
                                    onChange={(e) => setDetailAddress(e.target.value)}
                                    className="w-full bg-[#111319] border border-purple-950 focus:border-[#00ffcc]/80 text-xs p-1.5 rounded text-white"
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                  <div className="space-y-1 text-left">
                                    <label htmlFor={`loadin-${offer.id}`} className="text-[9px] text-zinc-500 font-bold block">Load In</label>
                                    <input 
                                      id={`loadin-${offer.id}`}
                                      type="text" 
                                      value={detailLoadIn} 
                                      onChange={(e) => setDetailLoadIn(e.target.value)} 
                                      className="w-full bg-[#111319] border border-purple-950 text-xs p-1.5 rounded text-white" 
                                    />
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <label htmlFor={`doors-${offer.id}`} className="text-[9px] text-zinc-500 font-bold block">Doors</label>
                                    <input 
                                      id={`doors-${offer.id}`}
                                      type="text" 
                                      value={detailDoors} 
                                      onChange={(e) => setDetailDoors(e.target.value)} 
                                      className="w-full bg-[#111319] border border-purple-950 text-xs p-1.5 rounded text-white" 
                                    />
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <label htmlFor={`set-${offer.id}`} className="text-[9px] text-zinc-500 font-bold block">Set Time</label>
                                    <input 
                                      id={`set-${offer.id}`}
                                      type="text" 
                                      value={detailSetTime} 
                                      onChange={(e) => setDetailSetTime(e.target.value)} 
                                      className="w-full bg-[#111319] border border-purple-950 text-xs p-1.5 rounded text-white" 
                                    />
                                  </div>
                                  <div className="space-y-1 text-left">
                                    <label htmlFor={`curfew-${offer.id}`} className="text-[9px] text-zinc-500 font-bold block">Curfew</label>
                                    <input 
                                      id={`curfew-${offer.id}`}
                                      type="text" 
                                      value={detailCurfew} 
                                      onChange={(e) => setDetailCurfew(e.target.value)} 
                                      className="w-full bg-[#111319] border border-purple-950 text-xs p-1.5 rounded text-white" 
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-left">
                                  <div className="space-y-1">
                                    <label htmlFor={`attendance-${offer.id}`} className="text-[9.5px] text-zinc-500 font-bold block col-span-1">EXPECTED ATTENDANCE</label>
                                    <select 
                                      id={`attendance-${offer.id}`}
                                      value={detailAttendance} 
                                      onChange={(e) => setDetailAttendance(e.target.value as any)} 
                                      className="bg-[#111319] border border-purple-950 text-xs p-1.5 rounded text-white w-full"
                                    >
                                      <option value="+100">+100 heads</option>
                                      <option value="100-300">100-300 capacity</option>
                                      <option value="300-700">300-700 room</option>
                                      <option value="700+">700+ theater</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1 text-left row-span-1">
                                    <label htmlFor={`age-${offer.id}`} className="text-[9.5px] text-zinc-500 font-bold block col-span-1">AGE POLICY</label>
                                    <select 
                                      id={`age-${offer.id}`}
                                      value={detailAge} 
                                      onChange={(e) => setDetailAge(e.target.value as any)} 
                                      className="bg-[#111319] border border-purple-950 text-xs p-1.5 rounded text-white w-full"
                                    >
                                      <option value="all">All Ages Allowed</option>
                                      <option value="18">18+ Only</option>
                                      <option value="21">21+ Club Policy</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1 text-left">
                                  <label htmlFor={`specnotes-${offer.id}`} className="text-[9.5px] text-zinc-500 font-bold block">Soundcheck details or stage specifications</label>
                                  <textarea 
                                    id={`specnotes-${offer.id}`}
                                    rows={2} 
                                    placeholder="e.g. Local food notes, PA specs, parking logistics details..." 
                                    value={detailNotes}
                                    onChange={(e) => setDetailNotes(e.target.value)}
                                    className="w-full bg-[#111319] border border-purple-950 text-xs p-1.5 rounded text-white focus:outline-none"
                                  />
                                </div>

                                <div className="flex gap-2">
                                  <button 
                                    type="submit" 
                                    className="px-4 py-1.5 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/25 border border-[#00ffcc] text-white font-extrabold rounded text-[10px] uppercase cursor-pointer"
                                  >
                                    [ ⚡ SYNC SHOW DETAILS TO BAND ]
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => setSubmittingDetailsId(null)}
                                    className="px-4 py-1.5 bg-zinc-805 border border-zinc-700 text-zinc-400 hover:text-white rounded text-[10px] uppercase cursor-pointer"
                                  >
                                    [ CANCEL ]
                                  </button>
                                </div>
                              </form>
                            ) : (
                              <button
                                onClick={() => handleOpenDetailsForm(offer)}
                                className="px-3.5 py-1.5 bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 border border-[#00ffcc]/70 text-[#00ffcc] font-black uppercase text-[9px] rounded flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#00ffcc]/5"
                              >
                                [ 📋 FILE SHOW DETAILS SPECIFICATIONS ]
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
              </>
            )}
          </div>
        </motion.div>
      ) : (activePortalTab === 'sales' && !showOnlyCalendar && !showOnlyRoutingAndAvailability) ? (
        <motion.div
          key="sales"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-full flex-grow flex-1"
        >
          <PublicStorefront
            ticketingEventId={ticketingEventId}
            sandboxTiers={sandboxTiers}
            setSandboxTiers={setSandboxTiers}
            lineups={lineups}
            promoterOffers={promoterOffers}
            localSalesList={localSalesList}
            setLocalSalesList={setLocalSalesList}
            handleUpdateTicketTierSold={handleUpdateTicketTierSold}
            triggerNotification={triggerNotification}
            playLocalBeep={playLocalBeep}
          />
        </motion.div>
      ) : null}

      {/* Snuggled Footer Stack for Subscription Tier & Disconnect Block */}
      {!showOnlyCalendar && !showOnlyRoutingAndAvailability && (
        <div className="flex flex-col gap-3.5 mt-1 pb-2" id="promoter-portal-snuggled-footer-stack">
          
          {/* Promoter Subscription Tier & Pipeline Panel (Lifetime Free vs Upgrades) */}
          {activePortalTab === 'routing' && (
            <div className="border border-[#36ff00]/40 bg-zinc-950/80 hover:bg-zinc-900 p-5 rounded-2xl flex flex-col gap-4 text-center transition-all duration-300 relative overflow-hidden shadow-[0_0_15px_rgba(54,255,0,0.25)] animate-pulse" id="promoter-billing-pipeline-footer">
              {/* Subtle glowing accent overlay */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500/20 via-[#36ff00]/40 to-purple-800/20" />
              
              <div className="flex items-center justify-center gap-2 border-b border-zinc-900 pb-3 w-full">
                <span className="text-xs">💳</span>
                <h4 className="text-[11px] font-mono font-black text-white uppercase tracking-widest">[ SUBSCRIPTIONS & ACCOUNT STATUS ]</h4>
              </div>
              <div className="flex flex-col items-center justify-center gap-4 font-mono text-center w-full">
                <div className="space-y-2 max-w-xl mx-auto">
                  <p className="text-[11px] text-zinc-300 leading-relaxed uppercase">
                    STATUS: <span className="text-[#00ffcc] font-black underline bg-[#00ffcc]/10 px-2 py-0.5 rounded ml-1 border border-[#00ffcc]/20">LIFETIME FREE ACCESS ACTIVE</span>
                  </p>
                  <p className="text-[10px] text-zinc-400 font-sans leading-normal">
                    Promoters managing up to TWO (2) active venues or stages are 100% free for life. Adding 3 or more properties will automatically prompt a subscription upgrade. Our tiers are designed to keep the underground circuit fair—we support independent venue spaces for free and scale pricing only as operations expand.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowSubscriptionTiersModal(true)}
                  className="px-6 py-3 border border-emerald-500/50 hover:border-emerald-300 bg-emerald-950/30 hover:bg-emerald-950/65 text-emerald-300 hover:text-white text-[9.5px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-md shadow-emerald-950/10 shrink-0 whitespace-nowrap min-h-[44px] flex items-center justify-center rounded-xl mx-auto"
                >
                  [ VIEW SUBSCRIPTION TIERS ]
                </button>
              </div>
            </div>
          )}


        </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border-2 border-red-900 rounded-2xl w-full max-w-sm overflow-hidden flex flex-col shadow-2xl shadow-red-900/20">
            <div className="bg-red-950/40 p-4 border-b border-red-900/50 flex flex-col items-center justify-center text-center">
              <AlertTriangle className="text-red-500 w-10 h-10 mb-2" />
              <h3 className="font-mono text-red-500 font-bold uppercase tracking-wider">CRITICAL WARNING</h3>
            </div>
            <div className="p-6">
              <p className="text-zinc-300 text-sm mb-4 font-mono leading-relaxed text-center">
                Are you sure you want to permanently delete your promoter account? This action cannot be undone and will destroy your security tokens.
              </p>
              <div className="flex gap-3 mt-6">
                <button 
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-mono font-bold text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteAccount}
                  className="flex-1 py-3 bg-red-900 hover:bg-red-800 text-white rounded font-mono font-bold text-xs uppercase tracking-wider"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* Editing Promoter Profile Modal */}
      {isEditingProfile && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-[#0c0f13] border border-yellow-500/30 rounded-2xl w-full max-w-2xl overflow-hidden flex flex-col shadow-2xl border-t-[3px] border-t-yellow-500 yellow-pulse-glow"
          >
            {/* Header */}
            <div className="bg-[#11151c] p-4 border-b border-zinc-850 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-yellow-400 animate-spin-hover" />
                <div>
                  <h3 className="text-sm font-black font-mono text-white uppercase tracking-wider">Promoter Console Settings</h3>
                  <p className="text-[10px] text-zinc-450 font-mono">Configure profiles, home venues, and booking networks</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEditingProfile(false)}
                className="text-zinc-400 hover:text-white p-1 hover:bg-zinc-800/50 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Custom Tab Bar for Console Settings */}
            <div className="flex border-b border-zinc-850 bg-black/40 text-[10px] font-mono font-bold uppercase tracking-wider overflow-x-auto shrink-0 select-none">
              <button
                type="button"
                onClick={() => setSettingsTab('general')}
                className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                  settingsTab === 'general'
                    ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                👤 General Details
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('home_venue')}
                className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                  settingsTab === 'home_venue'
                    ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🏠 Home Venue Details
              </button>
              <button
                type="button"
                onClick={() => setSettingsTab('portfolio')}
                className={`flex-1 py-3 text-center border-b-2 transition-all cursor-pointer ${
                  settingsTab === 'portfolio'
                    ? 'border-yellow-500 text-yellow-400 bg-yellow-500/5'
                    : 'border-transparent text-zinc-500 hover:text-zinc-300'
                }`}
              >
                🏢 Multi-Venue Portfolio ({savedVenuesList.length})
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProfile} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              
              {settingsTab === 'general' && (
                <div className="space-y-4">
                  {/* Profile Pic preview and device uploader */}
                  <div className="bg-zinc-950/60 p-4 rounded-xl border border-zinc-900 flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative shrink-0 w-16 h-16 rounded-full bg-zinc-900 border border-zinc-700/60 overflow-hidden flex items-center justify-center shadow">
                      {profileFormAvatar.trim() ? (
                        <img 
                          src={profileFormAvatar.trim()} 
                          alt="Avatar Preview" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <Camera className="w-6 h-6 text-zinc-650" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2 text-left w-full">
                      <label htmlFor="avatar-file-input" className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">Profile Picture Artwork</label>
                      
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-900 hover:bg-yellow-500/10 border border-zinc-800 text-xs font-mono font-bold text-yellow-400 hover:text-white transition-all cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload Profile Photo</span>
                          <input 
                            id="avatar-file-input"
                            type="file" 
                            accept="image/*" 
                            onChange={handleAvatarLocalUpload} 
                            className="hidden" 
                          />
                        </label>

                        {profileFormAvatar && (
                          <button
                            type="button"
                            onClick={() => {
                              setProfileFormAvatar('');
                              triggerNotification?.('❌ Chosen profile picture cleared.');
                            }}
                            className="px-2.5 py-2 rounded-xl bg-zinc-950/40 border border-zinc-900 text-zinc-400 hover:text-red-400 font-mono text-[10px] transition-colors cursor-pointer"
                            title="Remove current avatar image"
                          >
                            Clear Image
                          </button>
                        )}
                      </div>
                      <p className="text-[9.5px] text-zinc-500 font-mono">Accepts PNG, JPG, or GIF files. Max file size: 20MB.</p>
                    </div>
                  </div>

                  {/* Promoter Name */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="promoter-name-input" className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">Full Name</label>
                    <input
                      id="promoter-name-input"
                      required
                      type="text"
                      placeholder="Promoter Agent Name"
                      value={profileFormName}
                      onChange={(e) => setProfileFormName(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                    />
                  </div>

                  {/* Promotion Company Name */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="promoter-company-input" className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">Promotion Company (Agency)</label>
                    <input
                      id="promoter-company-input"
                      required
                      type="text"
                      placeholder="e.g. Black Cloud Booking"
                      value={profileFormCompany}
                      onChange={(e) => setProfileFormCompany(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                    />
                    <p className="text-[9px] text-zinc-550 font-mono">This name appears under your profile as the primary operating entity.</p>
                  </div>

                  {/* Focus Location / Region */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="promoter-region-input" className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">Focus Location Region</label>
                    <input
                      id="promoter-region-input"
                      required
                      type="text"
                      placeholder="e.g. Northwest Coast / Austin, TX"
                      value={profileFormRegion}
                      onChange={(e) => setProfileFormRegion(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                    />
                  </div>

                  {/* Professional Role */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="promoter-role-input" className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">Professional Title</label>
                    <input
                      id="promoter-role-input"
                      required
                      type="text"
                      placeholder="e.g. Lead Talents Booker"
                      value={profileFormRole}
                      onChange={(e) => setProfileFormRole(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                    />
                  </div>

                  {/* Direct Booking Email */}
                  <div className="space-y-1.5 text-left">
                    <label htmlFor="promoter-booking-email-input" className="text-[10px] text-zinc-400 font-mono font-bold uppercase block">Direct Booking Email Address</label>
                    <input
                      id="promoter-booking-email-input"
                      required
                      type="email"
                      placeholder="e.g. booking@agency.com"
                      value={profileFormBookingEmail}
                      onChange={(e) => setProfileFormBookingEmail(e.target.value)}
                      className="w-full bg-zinc-950/80 border border-zinc-800 focus:border-zinc-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                    />
                    <p className="text-[9px] text-zinc-550 font-mono">Used for direct incoming tour routing queries and contact proposals.</p>
                  </div>

                  {/* High Density Monospace Micro-Genre Selection Console */}
                  <div className="space-y-2 border border-zinc-900 rounded-xl bg-[#090b0f] p-4 text-left">
                    <label className="block text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest leading-none mb-1">
                      Multi-Genre Frequency Selection Console (620px Centralized Grid)
                    </label>
                    <p className="text-[9.5px] text-zinc-500 font-sans leading-normal mb-3">
                      Select target underground micro-genres. Categories are collapsed by default to optimize space.
                    </p>

                    <div className="space-y-2.5 font-mono text-[9px]">
                      {genreClusters.map((cluster, idx) => {
                        const selectedCount = cluster.tags.filter(t => profileGenreTags.includes(t.id)).length;
                        const isExpanded = expandedClusters.includes(cluster.name);
                        return (
                          <div key={`${cluster.name}-${idx}`} className="border border-zinc-850 bg-black/20 rounded-xl overflow-hidden">
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedClusters(prev => 
                                  prev.includes(cluster.name) 
                                    ? [] 
                                    : [cluster.name]
                                );
                              }}
                              className="w-full flex items-center justify-between p-3 bg-zinc-950/40 hover:bg-zinc-950/80 transition-all text-left border-b border-transparent hover:border-zinc-800"
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-400 font-bold">▶</span>
                                <span className={`text-[10.5px] uppercase font-bold tracking-wider ${selectedCount > 0 ? 'text-yellow-400' : 'text-zinc-300'}`}>
                                  // {cluster.name} Cluster
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {selectedCount > 0 && (
                                  <span className="bg-yellow-500/10 border border-yellow-500/35 text-yellow-400 text-[8px] font-bold uppercase px-2 py-0.5 rounded-full">
                                    {selectedCount} Selected
                                  </span>
                                )}
                                <span className="text-[9px] text-zinc-500 uppercase font-bold">
                                  {isExpanded ? '[ Collapse ]' : '[ Expand ]'}
                                </span>
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="p-3 bg-[#050608] transition-all">
                                <div className="grid grid-cols-2 gap-2">
                                  {cluster.tags.map((tag, idx) => {
                                    const isChecked = profileGenreTags.includes(tag.id);
                                    return (
                                      <button
                                        type="button"
                                        key={`${tag.id}-${idx}`}
                                        onClick={() => toggleGenreTag(tag.id)}
                                        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-left transition-all ${
                                          isChecked
                                            ? 'bg-yellow-950/20 border-yellow-500/40 text-yellow-400 shadow shadow-yellow-500/20 font-black'
                                            : 'bg-zinc-950/20 border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-950/40'
                                        }`}
                                      >
                                        <div className={`w-3 h-3 rounded border flex items-center justify-center shrink-0 ${
                                          isChecked ? 'border-yellow-500 bg-yellow-500 text-black' : 'border-zinc-750 bg-black'
                                        }`}>
                                          {isChecked && <Check className="w-2.5 h-2.5 text-black" strokeWidth={4} />}
                                        </div>
                                        <span className="truncate">{tag.label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'home_venue' && (
                <div className="space-y-6 text-left">
                  {/* TIP BANNER */}
                  <div className="bg-yellow-950/15 p-3 rounded-xl border border-yellow-500/20">
                    <p className="text-[10px] text-yellow-400 font-mono leading-relaxed">
                      🏠 <span className="font-bold">PROMOTER CONVENIENCE CO-PILOT:</span> Setting up a comprehensive, professional Home Venue profile allows real-time day sheets, contract drafts, and tech spec sheets to pre-fill fully on the band side. This prevents manual back-and-forth email friction.
                    </p>
                  </div>

                  {/* 1. CORE COORDINATES SECTION */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400 border-b border-zinc-900 pb-1.5">// 1. Physical Location & Capacity</h3>
                    
                    <div className="space-y-1.5">
                      <label htmlFor="home-venue-name" className="text-[10px] text-zinc-400 font-mono block">Venue / Club Name</label>
                      <input
                        id="home-venue-name"
                        type="text"
                        placeholder="e.g. Red River Auditorium"
                        value={homeVenueName}
                        onChange={(e) => setHomeVenueName(e.target.value)}
                        className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="home-venue-address" className="text-[10px] text-zinc-400 font-mono block">Physical Street Address</label>
                      <input
                        id="home-venue-address"
                        type="text"
                        placeholder="e.g. 606 E Red River St"
                        value={homeVenueAddress}
                        onChange={(e) => setHomeVenueAddress(e.target.value)}
                        className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5 sm:col-span-2">
                        <label htmlFor="home-venue-city" className="text-[10px] text-zinc-400 font-mono block">City</label>
                        <input
                          id="home-venue-city"
                          type="text"
                          placeholder="e.g. Austin"
                          value={homeVenueCity}
                          onChange={(e) => setHomeVenueCity(e.target.value)}
                          className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="home-venue-state" className="text-[10px] text-zinc-400 font-mono block">State</label>
                        <input
                          id="home-venue-state"
                          type="text"
                          placeholder="TX"
                          value={homeVenueState}
                          onChange={(e) => setHomeVenueState(e.target.value)}
                          className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label htmlFor="home-venue-country" className="text-[10px] text-zinc-400 font-mono block">Country</label>
                        <input
                          id="home-venue-country"
                          type="text"
                          placeholder="USA"
                          value={homeVenueCountry}
                          onChange={(e) => setHomeVenueCountry(e.target.value)}
                          className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label htmlFor="home-venue-capacity" className="text-[10px] text-zinc-400 font-mono block">Default Capacity</label>
                        <input
                          id="home-venue-capacity"
                          type="text"
                          placeholder="e.g. 500"
                          value={homeVenueCapacity}
                          onChange={(e) => setHomeVenueCapacity(e.target.value)}
                          className="w-full bg-zinc-950/80 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2.5 rounded-lg text-xs font-mono text-white transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-mono block">Age Policy</label>
                        <select
                          value={homeVenueAgeRestriction}
                          onChange={(e) => setHomeVenueAgeRestriction(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 font-mono p-2.5 rounded-lg cursor-pointer"
                        >
                          <option value="All Ages">All Ages</option>
                          <option value="18+">18+</option>
                          <option value="21+">21+</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-400 font-mono block">Avg Attendance</label>
                        <select
                          value={homeVenueAttendance}
                          onChange={(e) => setHomeVenueAttendance(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-850 text-xs text-zinc-300 font-mono p-2.5 rounded-lg cursor-pointer"
                        >
                          <option value="100-300">100-300</option>
                          <option value="300-700">300-700</option>
                          <option value="700+">700+</option>
                          <option value="+100">+100</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. AMENITIES SECTION */}
                  <div className="space-y-3 p-4 bg-zinc-950/40 border border-zinc-900 rounded-xl">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400">// 2. Band Amenities & Hospitality</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label htmlFor="venue-wifi-net" className="text-[9.5px] text-zinc-400 font-mono block">WiFi Network Name</label>
                        <input
                          id="venue-wifi-net"
                          type="text"
                          placeholder="e.g. VENUE_GUEST"
                          value={venueWifiNetwork}
                          onChange={(e) => setVenueWifiNetwork(e.target.value)}
                          className="w-full bg-black/60 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2 rounded text-xs font-mono text-white"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="venue-wifi-pass" className="text-[9.5px] text-zinc-400 font-mono block">WiFi Password</label>
                        <input
                          id="venue-wifi-pass"
                          type="text"
                          placeholder="Pass code"
                          value={venueWifiPassword}
                          onChange={(e) => setVenueWifiPassword(e.target.value)}
                          className="w-full bg-black/60 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2 rounded text-xs font-mono text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="venue-parking" className="text-[9.5px] text-zinc-400 font-mono block">Parking Arrangements</label>
                      <input
                        id="venue-parking"
                        type="text"
                        placeholder="e.g. Dedicated load-in space in alley behind venue, van with trailer fits 2 spots."
                        value={venueParking}
                        onChange={(e) => setVenueParking(e.target.value)}
                        className="w-full bg-black/60 border border-zinc-850 focus:border-yellow-500 focus:outline-none p-2.5 rounded text-xs font-mono text-white"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="venue-dinner" className="text-[9.5px] text-zinc-400 font-mono block">Dinner Arrangements</label>
                      <select
                        id="venue-dinner"
                        value={venueDinner}
                        onChange={(e) => setVenueDinner(e.target.value)}
                        className="w-full bg-black border border-zinc-850 text-xs text-zinc-300 font-mono p-2.5 rounded cursor-pointer"
                      >
                        <option value="Venue Catering Included bg-black">Venue Catering Included</option>
                        <option value="No Food Provided bg-black">No Food Provided</option>
                        <option value="In-house Food Discount bg-black">In-house Food Discount</option>
                        <option value="Buyout for each band member bg-black">Buyout for each band member</option>
                      </select>
                    </div>
                  </div>

                  {/* 3. ADVANCED SCHEDULE SECTION */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400 border-b border-zinc-900 pb-1.5">// 3. Day-of-Show Scheduling Defaults</h3>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-yellow-500/5 p-4 rounded-xl border border-yellow-500/10">
                      <div className="space-y-1">
                        <label className="text-[9px] text-yellow-300 font-mono font-bold uppercase block leading-none">Load-In Time</label>
                        <input
                          type="time"
                          value={homeVenueLoadIn}
                          onChange={(e) => setHomeVenueLoadIn(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-1.5 rounded text-xs text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-yellow-300 font-mono font-bold uppercase block leading-none">Merch Call</label>
                        <input
                          type="time"
                          value={venueMerchCall}
                          onChange={(e) => setVenueMerchCall(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-1.5 rounded text-xs text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-yellow-300 font-mono font-bold uppercase block leading-none">Soundcheck</label>
                        <input
                          type="time"
                          value={venueSoundcheck}
                          onChange={(e) => setVenueSoundcheck(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-1.5 rounded text-xs text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-400 font-mono font-bold uppercase block leading-none">Doors Open</label>
                        <input
                          type="time"
                          value={homeVenueDoors}
                          onChange={(e) => setHomeVenueDoors(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-1.5 rounded text-xs text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-yellow-400 font-mono font-bold uppercase block leading-none">Target Set Time</label>
                        <input
                          type="time"
                          value={homeVenueSetTime}
                          onChange={(e) => setHomeVenueSetTime(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-1.5 rounded text-xs text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-red-400/80 font-mono font-bold uppercase block leading-none">Venue Curfew</label>
                        <input
                          type="time"
                          value={homeVenueCurfew}
                          onChange={(e) => setHomeVenueCurfew(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-1.5 rounded text-xs text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* 4. TECHNICAL SPECIFICATIONS */}
                  <div className="space-y-2">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400 border-b border-zinc-900 pb-1.5">// 4. Technical Specs & Infrastructure</h3>
                    
                    <div className="space-y-1.5">
                      <label htmlFor="venue-gear-provided" className="text-[10px] text-zinc-400 font-mono block">Gear / PA Provided by Venue</label>
                      <textarea
                        id="venue-gear-provided"
                        rows={2}
                        placeholder="e.g. 16-channel digital board, 2 front mains, 3 monitors, sm58 mics. No lighting desk."
                        value={venueGearProvided}
                        onChange={(e) => setVenueGearProvided(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white font-mono p-2.5 rounded-lg focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="venue-audio-reqs" className="text-[10px] text-zinc-400 font-mono block">Audio & Production Requirements</label>
                      <textarea
                        id="venue-audio-reqs"
                        rows={2}
                        placeholder="e.g. dB limits 105 max over average, sound engineer provided by venue, smoke/fire machines are strictly forbidden."
                        value={venueAudioRequirements}
                        onChange={(e) => setVenueAudioRequirements(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white font-mono p-2.5 rounded-lg focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label htmlFor="venue-backline" className="text-[10px] text-zinc-400 font-mono block">Stage Backline Provided / Shared</label>
                      <textarea
                        id="venue-backline"
                        rows={2}
                        placeholder="e.g. House drum kit 5-piece (bring own breakables, cymbals & snare). Bass cab Ampeg 8x10 provided."
                        value={venueBacklineRequirements}
                        onChange={(e) => setVenueBacklineRequirements(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white font-mono p-2.5 rounded-lg focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 5. ADDITIONAL SHOW-DAY NOTES & ENCOURAGEMENT */}
                  <div className="space-y-3">
                    <h3 className="text-[10px] font-mono font-bold uppercase tracking-wider text-yellow-400/80 border-b border-zinc-900 pb-1.5">// 5. Additional Term Defaults</h3>
                    
                    <div className="space-y-1.5">
                      <label htmlFor="venue-additional-notes" className="text-[10px] text-zinc-400 font-mono block">Custom Day-sheet Notes & Term Defaults</label>
                      <textarea
                        id="venue-additional-notes"
                        rows={2.5}
                        placeholder="e.g. 1 free guest list spot per band member. Payment via cash or Zelle right after set."
                        value={homeVenueNotes}
                        onChange={(e) => setHomeVenueNotes(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 text-xs text-white font-mono p-2.5 rounded-lg focus:border-yellow-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* 6. MULTIPLE LOCAL STAGES */}
                  <div className="space-y-2 border-t border-zinc-900 pt-3">
                    <label className="text-[10px] text-yellow-400 font-mono font-bold uppercase block">🏛️ Venue Stages</label>
                    <p className="text-[9px] text-zinc-500 font-mono leading-tight">
                      Does this venue host multiple stages at its physical location (e.g. Main Hall, Basement Lounge, Outdoor Stage)? Add them here so bookings can target specific stages.
                    </p>

                    {homeVenueStages.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {homeVenueStages.map((stg, sIdx) => (
                          <span key={`home-venue-stage-${stg}-${sIdx}`} className="bg-zinc-900 border border-yellow-500/20 text-yellow-400 text-[10px] font-mono px-2 py-1 rounded-md flex items-center gap-1.5">
                            <span>{stg}</span>
                            <button
                              type="button"
                              onClick={() => setHomeVenueStages(prev => prev.filter((_, i) => i !== sIdx))}
                              className="text-red-400 hover:text-red-300 font-bold cursor-pointer text-xs leading-none ml-1 focus:outline-none"
                              title="Delete stage"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. Upstairs Hall"
                        value={newStageNameHome}
                        onChange={(e) => setNewStageNameHome(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = newStageNameHome.trim();
                            if (val) {
                              if (homeVenueStages.includes(val)) {
                                triggerNotification?.("⚠️ Stage name already exists.");
                                return;
                              }
                              setHomeVenueStages(prev => [...prev, val]);
                              setNewStageNameHome('');
                            }
                          }
                        }}
                        className="flex-1 bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs font-mono text-white focus:border-yellow-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = newStageNameHome.trim();
                          if (val) {
                            if (homeVenueStages.includes(val)) {
                              triggerNotification?.("⚠️ Stage name already exists.");
                              return;
                            }
                            setHomeVenueStages(prev => [...prev, val]);
                            setNewStageNameHome('');
                          }
                        }}
                        className="bg-zinc-900 hover:bg-yellow-500/10 border border-zinc-800 hover:border-yellow-500/35 text-yellow-400 text-[10px] font-mono px-3 py-2 rounded-lg transition-all"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {settingsTab === 'portfolio' && (
                <div className="space-y-4 text-left">
                  <div className="bg-yellow-950/15 p-3 rounded-xl border border-yellow-500/20 mb-2">
                    <p className="text-[10px] text-yellow-400 font-mono leading-relaxed">
                      🏢 Register multiple secondary venues, stadiums, or DIY halls you book promoters/artists into. Pre-adding properties allows lightning-fast offer creation across your whole venue portfolio.
                    </p>
                  </div>

                  {/* Saved list container */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] text-zinc-450 font-mono font-black uppercase tracking-wider block">Currently Saved Properties ({savedVenuesList.length})</h4>
                    {savedVenuesList.length === 0 ? (
                      <div className="p-4 border border-zinc-850 bg-black/40 rounded-xl text-center text-zinc-550 text-xs font-mono">
                        No additional properties saved. Pre-add below!
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[180px] overflow-y-auto bg-black/35 p-2 rounded-xl border border-zinc-900 scrollbar-thin">
                        {savedVenuesList.map((venue, idx) => (
                          <div key={`promoter-venue-${venue.id || "v"}-${idx}`} className="flex items-center justify-between p-2.5 bg-zinc-950/80 border border-yellow-950/40 rounded-lg text-xs font-mono hover:border-yellow-500/30 transition-all">
                            <div>
                              <div className="text-white font-black">
                                {venue.name}{' '}
                                <span className="text-yellow-400 text-[10px]">({venue.capacity || 'N/A'} Cap)</span>
                                {venue.stages && venue.stages.length > 0 && (
                                  <span className="text-zinc-400 text-[8.5px] ml-1.5 font-normal px-1 py-0.5 bg-yellow-950/15 rounded border border-yellow-500/20">
                                    {venue.stages.length} stages: {venue.stages.join(', ')}
                                  </span>
                                )}
                              </div>
                              <div className="text-zinc-500 text-[10px] leading-tight mt-0.5">{venue.address}, {venue.city} ({venue.state_province || 'N/A'})</div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveVenueFromPortfolio(venue.id, venue.name)}
                              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-[10px] px-2 py-1 rounded transition-all cursor-pointer border border-red-500/15"
                            >
                              Delete
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Form to Pre-add new venue to list */}
                  <div className="border border-zinc-855 p-4 rounded-xl bg-zinc-950/40 space-y-2 pt-3">
                    <h4 className="text-[10px] text-yellow-400 font-mono font-black uppercase tracking-wider block border-b border-zinc-900 pb-1">➕ Create Secondary Venue Profile</h4>
                    
                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">Venue Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Mohawk Austin"
                        value={newVenueName}
                        onChange={(e) => setNewVenueName(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-white font-mono focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">Street Address</label>
                      <input
                        type="text"
                        placeholder="e.g. 912 Red River St"
                        value={newVenueAddress}
                        onChange={(e) => setNewVenueAddress(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-white font-mono focus:border-yellow-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">City</label>
                        <input
                          type="text"
                          placeholder="Austin"
                          value={newVenueCity}
                          onChange={(e) => setNewVenueCity(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-white font-mono focus:border-yellow-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">State</label>
                        <input
                          type="text"
                          placeholder="TX"
                          value={newVenueState}
                          onChange={(e) => setNewVenueState(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-white font-mono focus:border-yellow-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">Country</label>
                        <input
                          type="text"
                          placeholder="USA"
                          value={newVenueCountry}
                          onChange={(e) => setNewVenueCountry(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-white font-mono focus:border-yellow-500 focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">Capacity</label>
                        <input
                          type="number"
                          placeholder="e.g. 900"
                          value={newVenueCapacity}
                          onChange={(e) => setNewVenueCapacity(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-855 p-2 rounded-lg text-xs text-white font-mono focus:border-yellow-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-2 bg-yellow-500/5 rounded-lg border border-yellow-500/20">
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 font-bold uppercase block leading-none">Load-In</label>
                        <input
                          type="time"
                          value={newVenueLoadIn}
                          onChange={(e) => setNewVenueLoadIn(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-[11px] text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-zinc-400 font-bold uppercase block leading-none">Doors</label>
                        <input
                          type="time"
                          value={newVenueDoors}
                          onChange={(e) => setNewVenueDoors(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-[11px] text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-yellow-400 font-bold uppercase block leading-none">Set Time</label>
                        <input
                          type="time"
                          value={newVenueSetTime}
                          onChange={(e) => setNewVenueSetTime(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-[11px] text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[8.5px] text-red-400/80 font-bold uppercase block leading-none">Curfew</label>
                        <input
                          type="time"
                          value={newVenueCurfew}
                          onChange={(e) => setNewVenueCurfew(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 p-1 rounded text-[11px] text-white font-mono [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">Age Policy</label>
                        <select
                          value={newVenueAgeRestriction}
                          onChange={(e) => setNewVenueAgeRestriction(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-zinc-400 font-mono cursor-pointer"
                        >
                          <option value="All Ages">All Ages</option>
                          <option value="18+">18+</option>
                          <option value="21+">21+</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">Attendance</label>
                        <select
                          value={newVenueAttendance}
                          onChange={(e) => setNewVenueAttendance(e.target.value as any)}
                          className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-zinc-400 font-mono cursor-pointer"
                        >
                          <option value="100-300">100-300</option>
                          <option value="300-700">300-700</option>
                          <option value="700+">700+</option>
                          <option value="+100">+100</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-450 font-bold uppercase block leading-none">Tech/Notes Info</label>
                      <textarea
                        rows={1}
                        placeholder="e.g. Catering buyout details, PA spec ratings..."
                        value={newVenueNotes}
                        onChange={(e) => setNewVenueNotes(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs text-white font-mono"
                      />
                    </div>

                    <div className="space-y-2 border-t border-zinc-900 pt-2 pb-1">
                      <label className="text-[9px] text-yellow-400 font-mono font-bold uppercase block">🏛️ Venue Stages</label>
                      <p className="text-[8px] text-zinc-500 font-mono leading-tight">
                        Define physical stages inside this venue (e.g. Lounge, Roof Deck).
                      </p>

                      {newVenueStages.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-1.5">
                          {newVenueStages.map((stg, sIdx) => (
                            <span key={`new-venue-stage-${stg}-${sIdx}`} className="bg-yellow-950/15 border border-yellow-500/20 text-yellow-400 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1.5">
                              <span>{stg}</span>
                              <button
                                type="button"
                                onClick={() => setNewVenueStages(prev => prev.filter((_, i) => i !== sIdx))}
                                className="text-red-400 hover:text-red-300 font-bold cursor-pointer text-xs leading-none"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="e.g. Main Hall"
                          value={newStageNameSecondary}
                          onChange={(e) => setNewStageNameSecondary(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = newStageNameSecondary.trim();
                              if (val) {
                                if (newVenueStages.includes(val)) {
                                  triggerNotification?.("⚠️ Stage already exists.");
                                  return;
                                }
                                setNewVenueStages(prev => [...prev, val]);
                                setNewStageNameSecondary('');
                              }
                            }
                          }}
                          className="flex-1 bg-zinc-950 border border-zinc-850 p-2 rounded-lg text-xs font-mono text-white focus:border-yellow-500 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const val = newStageNameSecondary.trim();
                            if (val) {
                              if (newVenueStages.includes(val)) {
                                triggerNotification?.("⚠️ Stage already exists.");
                                return;
                              }
                              setNewVenueStages(prev => [...prev, val]);
                              setNewStageNameSecondary('');
                            }
                          }}
                          className="bg-zinc-900 hover:bg-yellow-500/10 border border-zinc-800 hover:border-yellow-500/30 text-yellow-400 text-[10px] font-mono px-3 py-2 rounded-lg"
                        >
                          + Add
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddVenueToPortfolio}
                      className="w-full py-2.5 bg-yellow-600/30 hover:bg-yellow-600/50 border border-yellow-500/50 hover:border-yellow-400 text-yellow-100 font-mono font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer shadow"
                    >
                      + APPEND PROPERTY TO PORTFOLIO LIST
                    </button>
                  </div>
                </div>
              )}

              {/* Footer buttons */}
              <div className="flex gap-3 pt-4 border-t border-zinc-900 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white border border-zinc-800 rounded-xl font-mono text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 bg-gradient-to-r from-zinc-750 via-zinc-500 to-zinc-650 hover:scale-101 border border-zinc-550 text-white font-black rounded-xl font-mono text-xs uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-black/40 disabled:opacity-50"
                >
                  {loading ? 'SYNCING...' : 'SAVE CHANGES'}
                </button>
              </div>

            </form>
          </motion.div>
        </div>
      )}
      {/* External Artist Link Popup Modal */}
      {externalArtistLinkPopup && (
        <>
          <div 
            onClick={() => setExternalArtistLinkPopup(null)}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-all"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-black border border-emerald-900 rounded-2xl z-50 p-6 shadow-2xl"
          >
            <div className="absolute top-4 right-4 cursor-pointer" onClick={() => setExternalArtistLinkPopup(null)}>
              <X className="w-5 h-5 text-zinc-500 hover:text-white" />
            </div>
            <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Nexus Booking Link
            </h2>
            <p className="text-zinc-400 text-[10px] mb-4">
              Send this secure link to the artist's management. They can use it to review the terms, accept the offer, and join the platform to manage the show fully.
            </p>
            <div className="flex gap-2">
              <input 
                type="text" 
                readOnly
                value={externalArtistLinkPopup}
                className="flex-1 bg-zinc-950 border border-zinc-800 rounded p-2 text-xs font-mono text-zinc-300 outline-none"
              />
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(externalArtistLinkPopup);
                  triggerNotification?.("Link copied to clipboard!");
                  setExternalArtistLinkPopup(null);
                }}
                className="px-4 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded hover:bg-emerald-500/40 font-bold text-xs uppercase cursor-pointer transition-colors"
               >
                Copy
              </button>
            </div>
          </motion.div>
        </>
      )}

      {/* MESSAGE CENTER/INBOX OVERLAY MODAL */}
      <AnimatePresence>
        {isInboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 backdrop-blur-md z-[80] flex flex-col pt-safe"
          >
            {/* Header section with clean human-centric text */}
            <div className="border-b border-zinc-900 w-full bg-[#07080a] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-yellow-950/20 border border-yellow-500/30 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase flex items-center gap-2">
                    Message Center & Inbox
                  </h2>
                  <p className="text-[10px] text-zinc-500 uppercase mt-0.5 font-mono">
                    Direct discussions and booking inquiries with touring crews & designers
                  </p>
                </div>
              </div>

              {/* Status metrics bar */}
              <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-zinc-400 bg-zinc-950/60 px-4 py-2 border border-zinc-900 rounded-xl w-full sm:w-auto">
                <div className="uppercase">
                  Logged In: <span className="text-yellow-400 font-bold">{(userProfile?.name || 'Promoter').slice(0, 15)}</span>
                </div>
                <div className="hidden sm:block text-zinc-850">|</div>
                <div>
                  STATUS: <span className="text-[#00ffcc] font-bold animate-pulse">ONLINE</span>
                </div>
                <div className="hidden sm:block text-zinc-850">|</div>
                <button
                  type="button"
                  onClick={() => setIsInboxOpen(false)}
                  className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold px-3 py-1 rounded text-[10px] uppercase tracking-wider transition-all hover:bg-zinc-800 w-full sm:w-auto hover:text-white active:scale-95 cursor-pointer flex items-center gap-1 justify-center"
                >
                  <X className="w-3 h-3 text-zinc-400" />
                  <span>CLOSE</span>
                </button>
              </div>
            </div>

            {/* Sub-tab navigation bar */}
            <div className="border-b w-full bg-[#07080a] border-zinc-900 flex items-center p-2.5 gap-2 select-none">
              <button
                type="button"
                onClick={() => setInboxSubTab('conversations')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all font-mono uppercase cursor-pointer ${
                  inboxSubTab === 'conversations'
                    ? 'bg-yellow-650/20 border border-yellow-500/40 text-yellow-300'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                1. Channels ({INBOX_CHANNELS.length})
              </button>
              <button
                type="button"
                onClick={() => setInboxSubTab('chat')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all font-mono uppercase cursor-pointer ${
                  inboxSubTab === 'chat'
                    ? 'bg-yellow-650/20 border border-yellow-500/40 text-yellow-300'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                2. Active Chat Screen
              </button>
            </div>

            {/* Split Workspace Dynamic View */}
            <div className="flex-1 overflow-hidden w-full h-full bg-[#07080a] flex flex-col">
              {inboxSubTab === 'conversations' ? (
                /* Tab 1: List of Active Chats */
                <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
                  <div className="pb-2 border-b border-zinc-900">
                    <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                      Active Promoter Channels
                    </span>
                    <p className="text-[11px] text-zinc-400 font-mono mt-1">
                      Communicate in real-time with touring band coordinates, live audio contractors, or print partners.
                    </p>
                  </div>

                  <div className="space-y-3 mt-4">
                    {INBOX_CHANNELS.map((channel, idx) => {
                      const isCurrentlyActive = activeInboxChatId === channel.id;
                      const threadMsgs = inboxMessages[channel.id] || [];
                      const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
                      
                      let defaultText = '';
                      if (channel.id === 'tour-coordinator') {
                        defaultText = "Hi! We are routing our Southern Tour and have an open day next month on Oct 24. Is your main stage open for a metal package?";
                      } else if (channel.id === 'sound-contractor') {
                        defaultText = "Yo! We checked the venue spec. We'll need two extra subwoofers for the extreme metal show on Friday. Can you authorize the rider budget?";
                      } else if (channel.id === 'graphic-studio') {
                        defaultText = "Hello. The draft poster design is finished. Ready for the print approve. Let me know if we can press the initial batch.";
                      }

                      const snippet = lastMsg ? lastMsg.text : defaultText;

                      return (
                        <button
                          key={`${channel.id}-${idx}`}
                          type="button"
                          onClick={() => {
                            setActiveInboxChatId(channel.id);
                            setInboxSubTab('chat');
                          }}
                          className={`w-full p-4.5 text-left flex items-start gap-4 transition-all relative rounded-2xl border ${
                            isCurrentlyActive 
                              ? 'bg-zinc-900/40 border-yellow-500/40 text-white' 
                              : 'bg-zinc-950/30 hover:bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono text-xs font-black shrink-0 ${channel.badgeColor}`}>
                            {channel.avatarText}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="font-mono text-xs font-black truncate block uppercase text-white font-sans">
                                {channel.name}
                              </span>
                            </div>
                            <span className="text-[8.5px] text-zinc-500 font-mono uppercase block mt-1">
                              {channel.category}
                            </span>
                            <p className="text-xs text-zinc-400 font-mono truncate block mt-2.5 leading-relaxed">
                              {lastMsg?.sender === 'promoter' ? 'You: ' : ''}{snippet}
                            </p>
                          </div>
                          
                          {isCurrentlyActive && (
                            <div className="absolute right-4 top-4.5 w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* Tab 2: Actual Chat Stream */
                <div className="flex-1 flex flex-col h-full bg-[#07080a] overflow-hidden relative">
                  {(() => {
                    const activeChanObj = INBOX_CHANNELS.find(c => c.id === activeInboxChatId);
                    if (!activeChanObj) {
                      return (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/30">
                          <MessageSquare className="w-12 h-12 text-zinc-850 mb-3" />
                          <span className="text-xs text-zinc-550 font-mono uppercase tracking-wider block">No chat thread selected</span>
                          <button
                            type="button"
                            onClick={() => setInboxSubTab('conversations')}
                            className="mt-4 bg-yellow-600 hover:bg-yellow-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all cursor-pointer"
                          >
                            Browse Thread list
                          </button>
                        </div>
                      );
                    }

                    return (
                      <>
                        <div className="p-4 bg-zinc-950/70 border-b border-zinc-900 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setInboxSubTab('conversations')}
                              className="mr-1 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 hover:text-white border border-zinc-800 p-2 rounded-xl text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer uppercase font-black"
                              title="Go back to list of discussions"
                            >
                              <ArrowLeft className="w-3.5 h-3.5" />
                              <span>Channel List</span>
                            </button>
                            <div>
                              <h4 className="text-xs font-black font-mono text-white uppercase tracking-wider">
                                {activeChanObj.name}
                              </h4>
                              <span className="text-[9px] text-zinc-450 font-mono uppercase block mt-0.5">
                                {activeChanObj.category}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-500/30 px-3 py-1 rounded-lg text-[9px] font-mono text-emerald-400 shrink-0 uppercase">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Secure Link Active
                          </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                          {getThreadMessages().map((message, idx) => {
                            const isIncoming = message.sender === 'me';
                            return (
                              <div 
                                key={`promoter-chat-msg-${message.id || "msg"}-${idx}`}
                                className={`flex flex-col max-w-[85%] ${isIncoming ? 'mr-auto' : 'ml-auto items-end'}`}
                              >
                                <div className="flex items-center gap-2 mb-1 text-[8px] font-mono text-zinc-500 uppercase tracking-widest font-black">
                                  <span>{isIncoming ? activeChanObj.name : 'You'}</span>
                                  <span>•</span>
                                  <span>{message.timestamp}</span>
                                </div>
                                
                                <div className={`p-3.5 rounded-2xl text-[11px] font-mono leading-relaxed shadow-sm uppercase ${
                                  isIncoming 
                                    ? 'bg-[#101216] border border-zinc-900 text-zinc-300 rounded-tl-none' 
                                    : 'bg-yellow-950/15 border border-yellow-500/40 text-yellow-350 rounded-tr-none'
                                }`}>
                                  {message.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Replies Panel & Typing box */}
                        <div className="p-4 bg-zinc-950/85 border-t border-zinc-900 flex flex-col gap-3">
                          <div className="flex flex-wrap gap-2 select-none">
                            <span className="text-[8px] font-mono text-zinc-550 self-center uppercase font-bold tracking-wider mr-1">
                              QUICK MESSAGES:
                            </span>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("We checked the calendar. Sound check is approved for the 24th. Please proceed with routing.")}
                              className="text-[9px] font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded transition-colors uppercase active:scale-95 cursor-pointer"
                            >
                              "CONFIRM VENUE ROUTE"
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Rider authorized. Poster graphics look incredible! Please press the initial batch immediately.")}
                              className="text-[9px] font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded transition-colors uppercase active:scale-95 cursor-pointer"
                            >
                              "AUTHORIZE PRINT & SPEC"
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Our staging coordinator is updating the contract sheet now. We'll synchronize tonight.")}
                              className="text-[9px] font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded transition-colors uppercase active:scale-95 cursor-pointer"
                            >
                              "LOCKED CONTRACT SHEET"
                            </button>
                          </div>

                          <form 
                            onSubmit={(e) => {
                              e.preventDefault();
                              handleSendInboxReply();
                            }}
                            className="flex items-center gap-2"
                          >
                            <input
                              type="text"
                              value={inboxReplyDraft}
                              onChange={(e) => setInboxReplyDraft(e.target.value)}
                              placeholder={`Reply to ${activeChanObj.name}...`}
                              className="flex-1 bg-black/60 border border-zinc-805 focus:border-yellow-500 rounded-xl px-4 py-3 font-mono text-xs text-white focus:outline-none placeholder-zinc-700 uppercase"
                            />
                            <button
                              type="submit"
                              disabled={!inboxReplyDraft.trim()}
                              className={`px-5 py-3 rounded-xl font-mono text-xs font-black uppercase tracking-widest flex items-center gap-1.5 active:scale-95 transition-all select-none ${
                                inboxReplyDraft.trim()
                                  ? 'bg-yellow-500 hover:bg-yellow-400 text-black cursor-pointer shadow-md'
                                  : 'bg-zinc-900/60 border border-zinc-850 text-zinc-650 cursor-not-allowed'
                              }`}
                            >
                              <Send className="w-3.5 h-3.5" />
                              <span>SEND</span>
                            </button>
                          </form>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
        </div>
  );
}
