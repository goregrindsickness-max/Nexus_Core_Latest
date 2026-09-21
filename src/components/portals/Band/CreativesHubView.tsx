import React, { useState, useEffect, useRef } from "react";
import {
  Briefcase,
  UserPlus,
  CheckCircle,
  Clock,
  HelpCircle,
  AlertTriangle,
  Check,
  Loader2,
  X,
  MapPin,
  DollarSign,
  CornerDownRight,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Database,
  Play,
  Volume2,
  Pause,
  Calendar,
  Layers,
  Plus,
  Send,
  Video,
  ArrowUpRight,
  Activity,
  ChevronLeft,
  Star,
  Mail,
  Music,
  FolderOpen,
  Map,
  Box,
  Eye,
  UserCheck,
  MessageSquare,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getSupabase } from "../../../supabase";
import CreativeWorkspaceProtocols from "../Creative/CreativeWorkspaceProtocols";

// Fullscreen external media embed parser helper
export function getEmbedData(url: string) {
  if (!url) {
    return {
      embedUrl: null,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400",
      type: "generic",
    };
  }

  const strUrl = url.trim();

  // 1. YouTube
  const ytMatch = strUrl.match(
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/i,
  );
  if (ytMatch && ytMatch[1]) {
    const videoId = ytMatch[1];
    return {
      embedUrl: `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0`,
      thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      type: "youtube",
    };
  }

  // 2. Vimeo
  const vimeoMatch = strUrl.match(
    /vimeo\.com\/(?:channels\/[^\/]+\/|groups\/[^\/]+\/videos\/|album\/[0-9]+\/video\/|video\/|showcase\/[^\/]+\/video\/|)?([0-9]+)/i,
  );
  if (vimeoMatch && vimeoMatch[1]) {
    const videoId = vimeoMatch[1];
    return {
      embedUrl: `https://player.vimeo.com/video/${videoId}?autoplay=1`,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=600",
      type: "vimeo",
    };
  }

  // 3. Spotify
  if (strUrl.includes("spotify.com")) {
    const embedUrl = strUrl.replace("spotify.com/", "spotify.com/embed/");
    return {
      embedUrl,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=600",
      type: "spotify",
    };
  }

  // 4. SoundCloud
  if (strUrl.includes("soundcloud.com")) {
    const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(strUrl)}&color=%238b5cf6&auto_play=true&hide_related=true&show_comments=true&show_user=true&show_reposts=false&show_teaser=false&visual=true`;
    return {
      embedUrl,
      thumbnailUrl:
        "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=600",
      type: "soundcloud",
    };
  }

  return {
    embedUrl: strUrl,
    thumbnailUrl:
      "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=400",
    type: "generic",
  };
}

interface CreativesHubViewProps {
  onBack: () => void;
  triggerNotification?: (msg: string) => void;
  addLog?: (msg: string) => void;
  activeBandName?: string;
}

// Initial mock list of world-class brutalist creatives
interface CreativeTalent {
  id: string;
  name: string;
  category: "visual" | "audio" | "media";
  categoryLabel: string;
  title_block: string;
  skills: string[];
  location: string;
  rate_range: string;
  bio: string;
  avatar_url?: string;
  genre_tags?: string[];
  availability_status?: string;
  quick_broadcast?: string;
  gear?: string[];
}

const DEFAULT_CREATIVE_TALENT: CreativeTalent[] = [
  {
    id: "c-vortex",
    name: "Vortex Graphics",
    category: "visual",
    categoryLabel: "Visual Arts",
    title_block: "Vortex Graphics // VISUAL",
    skills: [
      "Logo Art",
      "Vector Conversion",
      "Screenprint Sepps",
      "Brutalist Posters",
    ],
    location: "Detroit, MI Market Hub",
    rate_range: "$250 - $600 per design",
    bio: "Heavy vector specialist, halftone master, custom punk typography and production-ready CMYK separated files.",
    genre_tags: ["brutal_death_metal", "grindcore"],
    gear: [
      "Wacom Intuos Pro Stylus Setup (Mobile)",
      "Adobe Creative Suite",
      "Simulated Halftone Automator",
    ],
  },
  {
    id: "c-gain",
    name: "Crust Gain Mastering",
    category: "audio",
    categoryLabel: "Audio Engineering",
    title_block: "Crust Gain Mastering // AUDIO",
    skills: [
      "Mix and Master",
      "Gain Optimization",
      "Analog Tape Transfers",
      "D-Beat EQ balancing",
    ],
    location: "Portland, OR Market Hub",
    rate_range: "$80 / Stem or $300 / Track",
    bio: "Unforgiving tape saturation, pristine dynamic high shelf optimization and full multitrack archival stems preparation.",
    genre_tags: ["grindcore", "hardcore", "slam"],
    gear: [
      "Otari MX-5050 Tape Deck",
      "Analog Mix Console Rack (Travel)",
      "UAD Precision EQ Stack",
    ],
  },
  {
    id: "c-drone",
    name: "Hyper-Sect Video System",
    category: "media",
    categoryLabel: "Media Production",
    title_block: "Hyper-Sect Video System // MEDIA",
    skills: [
      "Video Production",
      "Live Set Cutdowns",
      "ProRes Color grading",
      "Sensor Dust Mapping",
    ],
    location: "New York, NY Market Hub",
    rate_range: "$400 - $1200 per day",
    bio: "High-speed action camera systems, drone flyovers, dust-free sensors mapping, and redundant multi-drive footage pipelines.",
    genre_tags: ["synthwave", "underground_hip_hop"],
    gear: [
      "Sony A7S III Photo / Hybrid Capture Kit",
      "RED Komodo 6K Cinema Active Pro (Kit)",
      "DJI Mavic 3 Cine Combo",
    ],
  },
  {
    id: "c-spectral",
    name: "Spectral Seps & Indexing",
    category: "visual",
    categoryLabel: "Visual Arts",
    title_block: "Spectral Seps & Indexing // VISUAL",
    skills: [
      "Merch Design",
      "Simulated Process",
      "CMYK Seps",
      "Plastisol Ink Tuning",
    ],
    location: "Chicago, IL Market Hub",
    rate_range: "$150 - $400 per design",
    bio: "Silkscreen industry vector separations and complex color-keyed screenprint indexing. Run direct digital to garment proofs.",
    genre_tags: ["brutal_death_metal", "slam", "deathcore"],
    gear: [
      "Adobe Illustrator & Photoshop CC",
      "M&R Automatic Screenpress",
      "Spot Process indexing rack",
    ],
  },
  {
    id: "c-noise",
    name: "Sub-Ohm Resonance Lab",
    category: "audio",
    categoryLabel: "Audio Engineering",
    title_block: "Sub-Ohm Resonance Lab // AUDIO",
    skills: [
      "FOH Sound Engineer",
      "Fuzz Sculpting",
      "Subharmonic synthesis",
      "Live Mix",
    ],
    location: "Austin, TX Market Hub",
    rate_range: "$120 / Hour",
    bio: "Specialist in heavy low-end guitar frequencies and audio separation. Crushing live mixes and extreme dynamics leveling.",
    genre_tags: ["hardcore", "deathcore", "slam"],
    gear: [
      "Behringer X32 Sound Desk",
      "Analog Mix Console Rack (Travel)",
      "Sub-harmonic Synths Room Rig",
    ],
  },
  {
    id: "c-anamorphic",
    name: "Dust & Lens Film Arch",
    category: "media",
    categoryLabel: "Media Production",
    title_block: "Dust & Lens Film Arch // MEDIA",
    skills: [
      "Photography",
      "RAW Clip Archival",
      "Vapor-Proof rigs",
      "Gimbals calibration",
    ],
    location: "Los Angeles, CA Market Hub",
    rate_range: "$600 - $1500 / Project",
    bio: "Primal visual framing and heavy-duty tour backup server pipelines. Complete redundancy from drone to hard drive.",
    genre_tags: ["trap", "boom_bap", "underground_hip_hop"],
    gear: [
      "A7S III Photo / Hybrid Capture Kit",
      "RED Komodo 6K Cinema Active Pro (Kit)",
      "Anamorphic prime lens primes set",
    ],
  },
  {
    id: "c-void-type",
    name: "Voidform Typography",
    category: "visual",
    categoryLabel: "Visual Arts",
    title_block: "Voidform Typography // VISUAL",
    skills: [
      "Typography / Lettering",
      "Album Artwork",
      "Custom Fonts",
      "Inlays",
    ],
    location: "London, UK Market Hub",
    rate_range: "$150 - $350 per logo",
    bio: "Unreadable, chaotic text structures and highly illegible branding motifs for extreme bands.",
    genre_tags: ["brutal_death_metal", "black_metal", "slam"],
    gear: [
      "Wacom Intuos Pro Stylus Setup (Mobile)",
      "Custom digital calligraphy tablets",
      "Adobe Creative Suite",
    ],
  },
  {
    id: "c-strobe",
    name: "Retina Burn LD",
    category: "media",
    categoryLabel: "Media Production",
    title_block: "Retina Burn LD // MEDIA",
    skills: [
      "Lighting Director / LD",
      "Stage Design",
      "DMX Programming",
      "Strobe Arrays",
    ],
    location: "Berlin, DE Market Hub",
    rate_range: "$500 / Show",
    bio: "Seizure-inducing visual assaults, laser synchronization, and absolute darkness manipulation.",
    genre_tags: ["synthwave", "trap", "phonk"],
    gear: [
      "A7S III Photo / Hybrid Capture Kit",
      "MA Lighting grandMA3 console",
      "10W RGB Laser projector array",
    ],
  },
];

// Utility function to parse arbitrary day rates/fees for numeric list sorting
function parseRateForSorting(rateStr: string): number {
  const matches = rateStr.match(/\d+/g);
  if (!matches || matches.length === 0) return 0;
  if (matches.length >= 2) {
    return (parseFloat(matches[0]) + parseFloat(matches[1])) / 2;
  }
  return parseFloat(matches[0]);
}

export interface PayoutMilestone {
  id: string;
  title: string;
  percent: number;
  amount: number;
  status: "locked" | "released";
}

export interface CreativeContract {
  id: string;
  created_at: string;
  project_title: string;
  creative_id: string;
  creative_name: string;
  creative_category: "visual" | "audio" | "media";
  band_name: string;
  fee: number;
  timeline_days: number;
  enforced_protocols: Record<string, boolean>; // map of item.id -> isEnforced
  verified_protocols: Record<string, boolean>; // map of item.id -> isCompleted
  status: "production" | "verified" | "released";
  useMilestones?: boolean;
  milestones?: PayoutMilestone[];
}

export interface RFPPitch {
  id: string;
  creative_id: string;
  creative_name: string;
  pitch_text: string;
  sketch_ref?: string;
  created_at: string;
}

export interface CreativeRFP {
  id: string;
  created_at: string;
  title: string;
  category: "visual" | "audio" | "media";
  description: string;
  budget: number;
  delivery_by: string;
  band_name: string;
  pitches: RFPPitch[];
  views?: number;
}

export default function CreativesHubView({
  onBack,
  triggerNotification,
  addLog,
  activeBandName = "Artist",
}: CreativesHubViewProps) {
  const [activeTab, setActiveTab2] = useState<
    "discover" | "rfp-bulletin" | "contracts"
  >("discover");
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [showcaseDescCollapsed, setShowcaseDescCollapsed] =
    useState<boolean>(true);
  const [selectedDrawerTab, setSelectedDrawerTab] = useState<
    "specs" | "coordination"
  >("specs");
  const [viewMode, setViewMode] = useState<"lookbook" | "roster">("lookbook");
  const [drawerChatDraft, setDrawerChatDraft] = useState<string>("");
  const [drawerIsTyping, setDrawerIsTyping] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<
    Record<
      string,
      {
        id: string;
        sender: "me" | "creative";
        text: string;
        timestamp: string;
      }[]
    >
  >(() => {
    try {
      const saved = localStorage.getItem("nexus_coordinator_chat_messages");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(
        "nexus_coordinator_chat_messages",
        JSON.stringify(chatMessages),
      );
    } catch (e) {
      console.warn("Failed to save chat messages:", e);
    }
  }, [chatMessages]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "default" | "rate-low" | "rate-high" | "availability"
  >("default");
  const [expandedCardIds, setExpandedCardIds] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setLookbookPage(1);
  }, [searchQuery, selectedFilter, selectedRegion, sortBy]);

  const toggleCardExpanded = (id: string) => {
    setExpandedCardIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Favorites state quick save
  const [favorites, setFavorites] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_creatives_favorites");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleFavorite = (id: string, name: string) => {
    setFavorites((prev) => {
      const updated = prev.includes(id)
        ? prev.filter((fid) => fid !== id)
        : [...prev, id];
      localStorage.setItem(
        "nexus_creatives_favorites",
        JSON.stringify(updated),
      );
      if (triggerNotification) {
        if (prev.includes(id)) {
          triggerNotification(
            `⭐️ REMOVED "${name}" from Quick Favorites list!`,
          );
        } else {
          triggerNotification(`⭐ SAVED "${name}" to Quick Favorites list!`);
        }
      }
      return updated;
    });
  };

  // Followed creative talents state
  const [followedTalents, setFollowedTalents] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("nexus_followed_creatives");
      return saved ? JSON.parse(saved) : ["c-vortex"];
    } catch {
      return ["c-vortex"];
    }
  });

  const toggleFollowTalent = (id: string, name: string) => {
    setFollowedTalents((prev) => {
      const isFollowing = prev.includes(id);
      const updated = isFollowing
        ? prev.filter((fid) => fid !== id)
        : [...prev, id];
      localStorage.setItem(
        "nexus_followed_creatives",
        JSON.stringify(updated),
      );
      if (triggerNotification) {
        if (isFollowing) {
          triggerNotification(`Unfollowed ${name}`);
        } else {
          triggerNotification(`✓ Following ${name}! Updates will appear in your feed.`);
        }
      }
      return updated;
    });
  };

  const handleMessageCreative = (talent: CreativeTalent) => {
    window.dispatchEvent(
      new CustomEvent('nexus_open_chat', {
        detail: {
          profile_id: talent.id,
          name: talent.name,
          username: talent.name,
          avatar_url: talent.avatar_url || null,
        },
      })
    );
    setSelectedDrawerTalent(talent);
    setSelectedDrawerTab("coordination");
    if (triggerNotification) {
      triggerNotification(`💬 Established communication tunnel with ${talent.name}`);
    }
  };

  // Tour Routing Ingress Collapse state (collapsed by default)
  const [isRoutingCollapsed, setIsRoutingCollapsed] = useState<boolean>(true);

  // Real-time network and loading states
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [talents, setTalents] = useState<CreativeTalent[]>(
    DEFAULT_CREATIVE_TALENT,
  );
  const [contracts, setContracts] = useState<CreativeContract[]>([]);
  const [supabaseLookbook, setSupabaseLookbook] = useState<any[]>([]);
  const [fullscreenLookbookItem, setFullscreenLookbookItem] = useState<{
    id: string;
    imageUrl: string;
    talent: CreativeTalent;
    mediaType?: string;
    externalUrl?: string;
  } | null>(null);
  const [lookbookPage, setLookbookPage] = useState<number>(1);

  // RFP BULLETIN STATE
  const [rfps, setRfps] = useState<CreativeRFP[]>([]);
  const [showRfpForm, setShowRfpForm] = useState<boolean>(false);
  const [newRfpTitle, setNewRfpTitle] = useState<string>("");
  const [newRfpCategory, setNewRfpCategory] = useState<
    "visual" | "audio" | "media"
  >("visual");
  const [newRfpDesc, setNewRfpDesc] = useState<string>("");
  const [newRfpBudget, setNewRfpBudget] = useState<number>(250);
  const [newRfpDeliveryBy, setNewRfpDeliveryBy] =
    useState<string>("2026-06-30");

  // Custom simulation pitch state
  const [selectedCreativeForPitchSim, setSelectedCreativeForPitchSim] =
    useState<string>("");
  const [simmedPitchText, setSimmedPitchText] = useState<string>("");
  const [simmedSketchRef, setSimmedSketchRef] = useState<string>("");

  // Routing Beacons
  const [routingBeacons, setRoutingBeacons] = useState<any[]>([]);

  // Showcase Player modes
  const [showreelAudioMode, setShowreelAudioMode] = useState<
    "before" | "after"
  >("after");
  const [videoPlayState, setVideoPlayState] = useState<boolean>(false);
  const [videoTimestamp, setVideoTimestamp] = useState<number>(0);

  // Hire Contract Modal State
  const [hiringCreative, setHiringCreative] = useState<CreativeTalent | null>(
    null,
  );
  const [selectedTierIdInModal, setSelectedTierIdInModal] =
    useState<string>("premium");
  const [newProjectTitle, setNewProjectTitle] = useState<string>("");
  const [newProjectFee, setNewProjectFee] = useState<number>(350);
  const [newProjectTimeline, setNewProjectTimeline] = useState<number>(7);
  const [newProjectProtocols, setNewProjectProtocols] = useState<
    Record<string, boolean>
  >({});
  const [useMilestonePayout, setUseMilestonePayout] = useState<boolean>(false);

  // Rental Modal State
  const [rentingCreative, setRentingCreative] = useState<CreativeTalent | null>(
    null,
  );
  const [rentingGearItem, setRentingGearItem] = useState<string>("");
  const [rentalDays, setRentalDays] = useState<number>(3);
  const [rentalDeposit, setRentalDeposit] = useState<number>(250);
  const [rentalDailyRate, setRentalDailyRate] = useState<number>(75);
  const [rentalLogistics, setRentalLogistics] = useState<
    "courier" | "handover" | "locker"
  >("handover");
  const [rentalInsurance, setRentalInsurance] = useState<boolean>(true);

  const openRentalModal = (creative: CreativeTalent, gear: string) => {
    setRentingCreative(creative);
    setRentingGearItem(gear);

    // Autofill rates/deposit based on gear item text match
    const lower = gear.toLowerCase();
    let rate = 65;
    let deposit = 200;

    if (
      lower.includes("komodo") ||
      lower.includes("red") ||
      lower.includes("6k") ||
      lower.includes("cinema")
    ) {
      rate = 280;
      deposit = 1200;
    } else if (
      lower.includes("a7s") ||
      lower.includes("sony") ||
      lower.includes("lens") ||
      lower.includes("camera") ||
      lower.includes("projector")
    ) {
      rate = 145;
      deposit = 600;
    } else if (
      lower.includes("tape") ||
      lower.includes("desk") ||
      lower.includes("mix") ||
      lower.includes("console") ||
      lower.includes("grandma") ||
      lower.includes("laser")
    ) {
      rate = 165;
      deposit = 800;
    } else if (
      lower.includes("wacom") ||
      lower.includes("stylus") ||
      lower.includes("adobe") ||
      lower.includes("tablet") ||
      lower.includes("platen")
    ) {
      rate = 45;
      deposit = 150;
    }

    setRentalDailyRate(rate);
    setRentalDeposit(deposit);
    setRentalDays(3);
    setRentalLogistics("handover");
    setRentalInsurance(true);
  };

  const handleCreateRental = async () => {
    if (!rentingCreative) return;
    setSubmitting(true);

    const logisticsDesc =
      rentalLogistics === "courier"
        ? "Insured Flightcase Air Express Courier"
        : rentalLogistics === "locker"
          ? "Secure Studio Smart Locker self pick-up & drop"
          : "Direct Regional Backstage Handover Event handoff";

    const baseCost = rentalDailyRate * rentalDays;
    const insuranceCost = rentalInsurance ? 15 * rentalDays : 0;
    const finalAmount = baseCost + insuranceCost + rentalDeposit;

    const newContract: CreativeContract = {
      id: `rental-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      created_at: new Date().toISOString(),
      project_title: `📦 DRY-HIRE RENTAL: ${rentingGearItem.toUpperCase()}`,
      creative_id: rentingCreative.id,
      creative_name: rentingCreative.name,
      creative_category: rentingCreative.category,
      band_name: activeBandName,
      fee: finalAmount,
      timeline_days: rentalDays,
      enforced_protocols: { "rental-return-verification": true },
      verified_protocols: {},
      status: "production",
      useMilestones: false,
    };

    // Store rental details as extra fields (typecast to bypass strict schema constraints cleanly)
    (newContract as any).isRental = true;
    (newContract as any).rental_details = {
      gear_item: rentingGearItem,
      daily_rate: rentalDailyRate,
      days: rentalDays,
      security_deposit: rentalDeposit,
      logistics_type: logisticsDesc,
      insurance_active: rentalInsurance,
    };

    const updated = [newContract, ...contracts];
    saveContracts(updated);

    if (triggerNotification) {
      triggerNotification(
        `📦 Standalone Dry-Hire Rental booked! Payout hold of $${finalAmount.toFixed(2)} active.`,
      );
    }
    if (addLog) {
      addLog(
        `Booked dry-hire equipment rental: "${rentingGearItem}" from ${rentingCreative.name} for ${rentalDays} days. Refundable payout security deposit of $${rentalDeposit} is held.`,
      );
    }

    setSubmitting(false);
    setRentingCreative(null);
  };

  // Helper inside Component to resolve service tiers with offline fallback
  const getTalentServiceTiers = (
    talentId: string,
    category: "visual" | "audio" | "media",
  ) => {
    try {
      const saved = localStorage.getItem(
        `nexus_core_creative_service_tiers_${talentId}`,
      );
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (_) {}

    // Default templates by category
    if (category === "audio") {
      return [
        {
          id: "standard",
          name: "Dry-hire Desk Prep",
          price: "$150",
          desc: "Basic stems setup and console routing template configuration. 1 review pass, 3-day turnaround.",
        },
        {
          id: "premium",
          name: "Premium Tour Engineering",
          price: "$350",
          desc: "FOH live mix engineering configuration and master output polish. 3 revisions, priority support.",
        },
        {
          id: "pro",
          name: "Pro Retainer",
          price: "$800/mo",
          desc: "Continuous master engineering & monitor setups across all upcoming stops. Direct intercom access.",
        },
      ];
    } else if (category === "media") {
      return [
        {
          id: "standard",
          name: "Dry-hire Photo Capture",
          price: "$150",
          desc: "Basic raw digital captures for promotional content. Minimal color grading. 3-day turn.",
        },
        {
          id: "premium",
          name: "Premium Hybrid Shoot",
          price: "$350",
          desc: "Post-production color graded cinematic action captures. High definition hybrid print quality proofs.",
        },
        {
          id: "pro",
          name: "Pro Retainer",
          price: "$800/mo",
          desc: "All access festival filming/editorial coverage, multi-location setups, and premium master reels.",
        },
      ];
    } else {
      return [
        {
          id: "standard",
          name: "Standard Run",
          price: "$150",
          desc: "Basic deliverables, 1 revision round, 3-day turnaround. Ideal for standard event flyers.",
        },
        {
          id: "premium",
          name: "Premium Package",
          price: "$350",
          desc: "High-priority deliverables, 3 revision rounds, source files included, 24-hr turnaround.",
        },
        {
          id: "pro",
          name: "Pro Retainer",
          price: "$800/mo",
          desc: "Unlimited basic tasks, priority support, direct intercom access. Best for ongoing tours.",
        },
      ];
    }
  };

  // Detailed Creative Showcase details drawer hooks
  const [selectedDrawerTalent, setSelectedDrawerTalent] =
    useState<CreativeTalent | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  // Auto-population of creative welcome message on selection change
  useEffect(() => {
    if (selectedDrawerTalent) {
      const tid = selectedDrawerTalent.id;
      if (!chatMessages[tid]) {
        let welcomeText =
          "Hail! Received your coordinator signal. Send through any detail queries regarding specs or availability on the upcoming stops.";
        if (selectedDrawerTalent.category === "audio") {
          welcomeText =
            "Greetings. Crust Gain audio feed operational. Let me know if you need specific analog tape separation, multitrack transfers room testing, or custom rack compression pricing.";
        } else if (selectedDrawerTalent.category === "visual") {
          welcomeText =
            "Awaiting layout coordinates. Ready to convert rough punk sketches or brand layouts to vector spot colors or screenprint separate layers.";
        } else if (selectedDrawerTalent.category === "media") {
          welcomeText =
            "Live feed established. RED Komodo multi-cam arrays and high-speed recaps active. Send through your show dates to cross-reference with our travel routes.";
        }

        setChatMessages((prev) => ({
          ...prev,
          [tid]: [
            {
              id: "init-sys",
              sender: "creative",
              text: `[ SECURE ADAPTIVE ENCRYPTED COORDINATION ESTABLISHED WITH ${selectedDrawerTalent.name.toUpperCase()} ]`,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
            {
              id: "init-msg",
              sender: "creative",
              text: welcomeText,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
        }));
      }
    }
  }, [selectedDrawerTalent]);

  const handleSendDrawerMessage = (textToSend?: string) => {
    if (!selectedDrawerTalent) return;
    const msgText = textToSend || drawerChatDraft;
    if (!msgText.trim()) return;

    const tid = selectedDrawerTalent.id;
    const userMsg = {
      id: `me-${Date.now()}`,
      sender: "me" as const,
      text: msgText,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setChatMessages((prev) => ({
      ...prev,
      [tid]: [...(prev[tid] || []), userMsg],
    }));

    if (!textToSend) {
      setDrawerChatDraft("");
    }

    setDrawerIsTyping(true);

    setTimeout(() => {
      let creativeResponse =
        "Hail! Got it. Send through the contract spec or locked fee, and let's configure the payout milestones.";
      const query = msgText.toLowerCase();

      if (selectedDrawerTalent.category === "audio") {
        if (
          query.includes("rate") ||
          query.includes("cost") ||
          query.includes("price") ||
          query.includes("fee")
        ) {
          creativeResponse =
            "Our dry hire analog racks are flat $40/day. For full stem mastering work, the baseline is $80/stem or we can arrange a flat-rate payout for the whole release.";
        } else if (
          query.includes("avail") ||
          query.includes("free") ||
          query.includes("when")
        ) {
          creativeResponse =
            "Currently booked for a festival master through the weekend, but I have open workspace capacity starting Tuesday. Let's lock the Payout schedule.";
        } else if (
          query.includes("stems") ||
          query.includes("format") ||
          query.includes("file")
        ) {
          creativeResponse =
            "Please export stems in 24-bit WAV format with at least -6dB headroom. Turn off all master limiter plug-ins so we keep pristine high-shelf saturation space.";
        }
      } else if (selectedDrawerTalent.category === "visual") {
        if (
          query.includes("rate") ||
          query.includes("cost") ||
          query.includes("price") ||
          query.includes("fee")
        ) {
          creativeResponse =
            "Full logo commissions are $250 - $600 depending on screenprint separation requirements. Simple poster layout overlays start at $150 flat.";
        } else if (
          query.includes("avail") ||
          query.includes("free") ||
          query.includes("when")
        ) {
          creativeResponse =
            "Available to start drawing index separations immediately this week. Send across a sample or reference image so I can sketch some concept drafts.";
        } else if (
          query.includes("format") ||
          query.includes("file") ||
          query.includes("vector")
        ) {
          creativeResponse =
            "I output final assets in fully separated AI vector or 1200 DPI layered TIFF files with color-keyed separation meshes optimized for plastisol or discharge ink.";
        }
      } else if (selectedDrawerTalent.category === "media") {
        if (
          query.includes("rate") ||
          query.includes("cost") ||
          query.includes("price") ||
          query.includes("fee")
        ) {
          creativeResponse =
            "Day rates for live RED Komodo shoots are $400 - $1200 depending on backup rack and drone support. Post-production recaps have custom payout pricing.";
        } else if (
          query.includes("avail") ||
          query.includes("free") ||
          query.includes("when")
        ) {
          creativeResponse =
            "I have en-route capabilities for Denver on June 15 and Chicago on July 02. Let's register a locked tour contract so we secure the date!";
        } else if (
          query.includes("camera") ||
          query.includes("rig") ||
          query.includes("gear")
        ) {
          creativeResponse =
            "Dual RED Komodo cinema cameras, anamorphic lenses, DJI Cine drone, and active sensor dust monitoring. All files are backed up to redundant drives immediately on-site.";
        }
      }

      setChatMessages((prev) => ({
        ...prev,
        [tid]: [
          ...(prev[tid] || []),
          {
            id: `creative-${Date.now()}`,
            sender: "creative" as const,
            text: creativeResponse,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ],
      }));
      setDrawerIsTyping(false);

      if (triggerNotification) {
        triggerNotification(
          `📬 Secure coordinator reply from ${selectedDrawerTalent.name}!`,
        );
      }
    }, 1500);
  };

  // Fetch creatives and active contracts
  useEffect(() => {
    fetchData();
  }, []);

  // Keep the latest rfps in a ref to decouple dependency arrays and prevent render cycles
  const rfpsRef = useRef(rfps);
  useEffect(() => {
    rfpsRef.current = rfps;
  }, [rfps]);

  // Periodically increment RFP job views dynamically to make it feel alive
  useEffect(() => {
    if (activeTab === "rfp-bulletin") {
      const interval = setInterval(() => {
        if (rfpsRef.current && rfpsRef.current.length > 0) {
          setRfps((prev) => {
            let changed = false;
            const updated = prev.map((rfp) => {
              // 25% chance to increment views by 1 or 2
              if (Math.random() > 0.75) {
                changed = true;
                const currentViews = rfp.views || 0;
                return {
                  ...rfp,
                  views: currentViews + Math.floor(Math.random() * 2) + 1,
                };
              }
              return rfp;
            });
            // If nothing changed, return prev exactly to avoid triggering any component updates
            return changed ? updated : prev;
          });
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    const supabase = getSupabase();

    // Parse dynamic custom user profile
    let userTalentObj: CreativeTalent | null = null;
    let upId: string | null = null;
    try {
      const userProfileStr = localStorage.getItem("nexus_core_user_profile");
      if (userProfileStr) {
        const up = JSON.parse(userProfileStr);
        upId = up.id || null;
        const primal =
          up.creative_metadata?.primary_category || "Artist/Designer";
        const rawCat =
          primal === "Sound Engineer/Recording" ||
          primal === "Session Musician/Techs"
            ? "audio"
            : primal === "Media/Photography"
              ? "media"
              : "visual";
        const label =
          primal === "Sound Engineer/Recording"
            ? "Audio Engineering"
            : primal === "Session Musician/Techs"
              ? "Session Musician / Techs"
              : primal === "Media/Photography"
                ? "Media Production"
                : "Visual Arts";

        userTalentObj = {
          id: "my-profile-talent",
          name:
            up.creative_metadata?.business_name ||
            up.name ||
            "Anonymous Creative",
          category: rawCat as "visual" | "audio" | "media",
          categoryLabel: label,
          title_block: `${up.creative_metadata?.business_name || up.name} // ${(up.creative_metadata?.primary_category || "VISUAL").toUpperCase()} (You)`,
          skills: up.creative_metadata?.skills || ["Freelance Spec"],
          location: up.creative_metadata?.base_location || "Global/Remote",
          rate_range: up.creative_metadata?.day_rate || "$350 / Day",
          bio:
            up.creative_metadata?.bio ||
            "Tuning gears and ready for next local or tour engagement.",
          avatar_url: up.avatar_url || "",
          genre_tags: up.genre_tags || up.creative_metadata?.genre_tags || [],
          availability_status:
            up.creative_metadata?.availability_status || "Available",
          quick_broadcast:
            up.creative_metadata?.quick_broadcast ||
            "Ready for next tour assignment",
          gear: Array.isArray(up.creative_metadata?.gear)
            ? up.creative_metadata.gear
            : [],
        };
      }
    } catch (e) {
      console.warn("Could not parse user profile:", e);
    }

    // 1. Fetch Freelance talent from creatives table
    if (supabase) {
      try {
        let { data, error } = await supabase.from("creatives").select("*");

        if (error) {
          console.warn(
            "Supabase fetched table error, using offline database state for creatives:",
            error,
          );
          if (userTalentObj) {
            setTalents([userTalentObj, ...DEFAULT_CREATIVE_TALENT]);
          } else {
            setTalents(DEFAULT_CREATIVE_TALENT);
          }
        } else if (data && data.length > 0) {
          // Format successfully
          const formatted: CreativeTalent[] = data.map((item: any) => {
            const displayName = item?.name || item?.creative_name || item?.business_name || "Anonymous Creative";
            const hasGear = Array.isArray(item.gear)
              ? item.gear
              : item.gear
                ? item.gear.split(",")
                : item.primary_gear
                  ? [item.primary_gear]
                  : null;
            const defaultGears =
              item.category === "audio"
                ? [
                    "Analog Mix Console Rack (Travel)",
                    "Sub-harmonic Synths Room Rig",
                  ]
                : item.category === "visual"
                  ? [
                      "Wacom Intuos Pro Stylus Setup (Mobile)",
                      "Silkscreen Platen Press (Tour Ready)",
                    ]
                  : [
                      "A7S III Photo / Hybrid Capture Kit",
                      "RED Komodo 6K Cinema Active Pro (Kit)",
                    ];
            return {
              id: item.id || `c-${Math.random()}`,
              name: displayName,
              category: item.category || "visual",
              categoryLabel:
                item.category === "audio"
                  ? "Audio Engineering"
                  : item.category === "media"
                    ? "Media Production"
                    : "Visual Arts",
              title_block:
                item.title_block ||
                `${displayName} // ${item.category?.toUpperCase() || "VISUAL"}`,
              skills: Array.isArray(item.skills)
                ? item.skills
                : item.skills
                  ? item.skills.split(",")
                  : item.core_skill_1
                    ? [item.core_skill_1, item.core_skill_2].filter(Boolean)
                    : [],
              location: item.location || "Remote Market Hub",
              rate_range: item.rate_range || item.day_rate || (item.base_rate_value ? `$${item.base_rate_value} / Day` : "$300 per delivery"),
              bio: item.bio || item.biography || "General operations creative resource.",
              availability_status: item.availability_status || "Available",
              gear: hasGear || defaultGears,
              avatar_url: item.avatar_url || item.creative_avatar || item.image || item.image_url || "",
            };
          });

          const filteredFormatted = formatted.filter(
            (item) =>
              item.id !== upId &&
              item?.name.toLowerCase() !== userTalentObj?.name.toLowerCase(),
          );

          if (userTalentObj) {
            setTalents([userTalentObj, ...filteredFormatted]);
          } else {
            setTalents(formatted);
          }
        } else {
          if (userTalentObj) {
            setTalents([userTalentObj, ...DEFAULT_CREATIVE_TALENT]);
          } else {
            setTalents(DEFAULT_CREATIVE_TALENT);
          }
        }
      } catch (err) {
        console.warn(
          "Failed to query Supabase creatives, fallbacks applied:",
          err,
        );
        if (userTalentObj) {
          setTalents([userTalentObj, ...DEFAULT_CREATIVE_TALENT]);
        } else {
          setTalents(DEFAULT_CREATIVE_TALENT);
        }
      }

      // 2. Fetch Active Contracts
      try {
        const { data, error } = await supabase
          .from("creative_contracts_v1")
          .select("*");

        if (error) {
          loadOfflineContracts();
        } else if (data) {
          setContracts(data as CreativeContract[]);
        } else {
          loadOfflineContracts();
        }
      } catch (err) {
        loadOfflineContracts();
      }
    } else {
      if (userTalentObj) {
        setTalents([userTalentObj, ...DEFAULT_CREATIVE_TALENT]);
      } else {
        setTalents(DEFAULT_CREATIVE_TALENT);
      }
      loadOfflineContracts();
    }

    loadOfflineRFPs();
    loadRoutingBeacons();

    // Fetch Lookbook Feed dynamically from Supabase if available
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data, error } = await supabase
          .from("creative_lookbook_feed")
          .select("*")
          .order("created_at", { ascending: false });
        if (!error && data) {
          setSupabaseLookbook(data);
        }
      }
    } catch (_) {}

    setLoading(false);
  };

  const loadOfflineContracts = () => {
    try {
      const saved = localStorage.getItem("nexus_core_creative_contracts_v1");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const seenIds = new Set<string>();
          const healed = parsed.map((contract: CreativeContract) => {
            if (!contract.id || seenIds.has(contract.id)) {
              const newId = `${contract.id || 'con'}-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
              seenIds.add(newId);
              return { ...contract, id: newId };
            }
            seenIds.add(contract.id);
            return contract;
          });
          setContracts(healed);
          localStorage.setItem(
            "nexus_core_creative_contracts_v1",
            JSON.stringify(healed),
          );
        } else {
          setContracts(parsed);
        }
      } else {
        // Sample seed contract
        const seedContract: CreativeContract = {
          id: "contract-demo-1",
          created_at: new Date().toISOString(),
          project_title: "Unclean Soul Album Cover Design",
          creative_id: "c-vortex",
          creative_name: "Vortex Graphics",
          creative_category: "visual",
          band_name: activeBandName,
          fee: 350,
          timeline_days: 7,
          enforced_protocols: { "visual-1": true, "visual-2": true },
          verified_protocols: { "visual-1": true, "visual-2": false }, // one complete, one outstanding for interactive testing
          status: "production",
        };
        setContracts([seedContract]);
        localStorage.setItem(
          "nexus_core_creative_contracts_v1",
          JSON.stringify([seedContract]),
        );
      }
    } catch (_) {}
  };

  const saveContracts = (updated: CreativeContract[]) => {
    setContracts(updated);
    try {
      localStorage.setItem(
        "nexus_core_creative_contracts_v1",
        JSON.stringify(updated),
      );
    } catch (_) {}

    // Attempt Supabase backup insertion
    const supabase = getSupabase();
    if (supabase) {
      supabase
        .from("creative_contracts_v1")
        .upsert(updated)
        .then(({ error }) => {
          if (error)
            console.info(
              "Supabase contract upsert error (safely cached offline):",
              error,
            );
        });
    }
  };

  const loadOfflineRFPs = () => {
    try {
      const saved = localStorage.getItem("nexus_core_creative_rfps_v1");
      if (saved) {
        setRfps(JSON.parse(saved));
      } else {
        const seedRfps: CreativeRFP[] = [
          {
            id: "rfp-demo-1",
            created_at: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
            title: "Distressed Left-Hand Path Tape Layout",
            category: "visual",
            description:
              "Looking for a hardcore visual layout for a tour-only tape release. Minimal monochrome ink separators, distressed xerox style textures, print-ready CMYK separated file with fold lines and panel indicators. Must use standard tape J-card dimensions.",
            budget: 250,
            delivery_by: "2026-06-30",
            band_name: activeBandName,
            pitches: [
              {
                id: "pitch-1",
                creative_id: "c-vortex",
                creative_name: "Vortex Graphics",
                pitch_text:
                  "I can execute this perfectly. I specialize in old-school xerox halftone style and already have a dynamic template ready for standard 3-panel J-cards. Take a look at my mock sketch showing distressed black border alignments: [vector_proof_v1.tiff]",
                sketch_ref:
                  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=250",
                created_at: new Date(
                  Date.now() - 24 * 3600 * 1000,
                ).toISOString(),
              },
            ],
            views: 142,
          },
          {
            id: "rfp-demo-2",
            created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
            title: "Brutal Grindcore Tape Stem Mastering",
            category: "audio",
            description:
              "Need dynamic, brickwall-limited analog warm stem mastering for our 6-track EP which is 9 minutes long. File format needs to be ready for cassette shell replication (A/B balancing optimization).",
            budget: 300,
            delivery_by: "2026-06-25",
            band_name: activeBandName,
            pitches: [],
            views: 48,
          },
        ];
        setRfps(seedRfps);
        localStorage.setItem(
          "nexus_core_creative_rfps_v1",
          JSON.stringify(seedRfps),
        );
      }
    } catch (_) {}
  };

  const saveRFPs = (updated: CreativeRFP[]) => {
    setRfps(updated);
    try {
      localStorage.setItem(
        "nexus_core_creative_rfps_v1",
        JSON.stringify(updated),
      );
    } catch (_) {}
  };

  const loadRoutingBeacons = () => {
    try {
      const localStr = localStorage.getItem("nexus_core_routing_beacons_v1");
      if (localStr) {
        setRoutingBeacons(JSON.parse(localStr));
      } else {
        const defaultBeacons = [
          {
            id: "beacon-tour-1",
            band_name: activeBandName,
            target_region: "Detroit, MI",
            start_date: "2026-06-18",
            end_date: "2026-06-19",
            booking_email: "tour@nexusapp.com",
            created_at: new Date().toISOString(),
          },
          {
            id: "beacon-tour-2",
            band_name: activeBandName,
            target_region: "Chicago, IL",
            start_date: "2026-06-24",
            end_date: "2026-06-25",
            booking_email: "tour@nexusapp.com",
            created_at: new Date().toISOString(),
          },
          {
            id: "beacon-tour-3",
            band_name: activeBandName,
            target_region: "Berlin, DE",
            start_date: "2026-07-12",
            end_date: "2026-07-15",
            booking_email: "tour@nexusapp.com",
            created_at: new Date().toISOString(),
          },
        ];
        setRoutingBeacons(defaultBeacons);
        localStorage.setItem(
          "nexus_core_routing_beacons_v1",
          JSON.stringify(defaultBeacons),
        );
      }
    } catch (_) {}
  };

  // Algorithmic Search, Dropdown Specialty filter, and Custom sorting order logic
  const processedTalents = talents
    .filter((talent) => {
      // 1. Dropdown specialty filter
      if (selectedFilter !== "all") {
        const filterStr = selectedFilter.toLowerCase();
        let passDropdown = false;
        if (talent.category.toLowerCase().includes(filterStr))
          passDropdown = true;
        else if (talent.categoryLabel.toLowerCase().includes(filterStr))
          passDropdown = true;
        else if ((talent.skills || []).some((s) => s.toLowerCase().includes(filterStr)))
          passDropdown = true;
        else if (
          [
            "logo art",
            "album artwork",
            "layout",
            "graphic design",
            "merch design",
            "typography / lettering",
            "animation / motion graphics",
            "3d art & rendering",
          ].includes(filterStr) &&
          talent.category === "visual"
        )
          passDropdown = true;
        else if (
          [
            "mix and master",
            "foh sound engineer",
            "system tech / monitor engineer",
            "session musician",
          ].includes(filterStr) &&
          talent.category === "audio"
        )
          passDropdown = true;
        else if (
          [
            "photography",
            "video production",
            "music video director",
            "lighting director / ld",
            "tour management",
            "stage design",
            "booking agent",
          ].includes(filterStr) &&
          talent.category === "media"
        )
          passDropdown = true;

        if (!passDropdown) return false;
      }

      // 1.5 region hub matching filter
      if (
        selectedRegion.trim() !== "" &&
        selectedRegion.toLowerCase() !== "all"
      ) {
        const regStr = selectedRegion.toLowerCase().trim();
        if (!talent.location.toLowerCase().includes(regStr)) {
          return false;
        }
      }

      // 2. Text Search Query matching name, bio, tags, skills, location
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const matchesName = talent.name.toLowerCase().includes(query);
        const matchesBio = talent.bio.toLowerCase().includes(query);
        const matchesLocation = talent.location.toLowerCase().includes(query);
        const matchesTitle = talent.title_block.toLowerCase().includes(query);
        const matchesSkills = (talent.skills || []).some((s) =>
          s.toLowerCase().includes(query),
        );
        const matchesGenreTags =
          talent.genre_tags?.some((gt) => gt.toLowerCase().includes(query)) ||
          false;

        if (
          !matchesName &&
          !matchesBio &&
          !matchesLocation &&
          !matchesTitle &&
          !matchesSkills &&
          !matchesGenreTags
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      // Always keep Candidate Profile at the absolute top (id 'my-profile-talent')
      if (a.id === "my-profile-talent") return -1;
      if (b.id === "my-profile-talent") return 1;

      if (sortBy === "rate-low") {
        return (
          parseRateForSorting(a.rate_range) - parseRateForSorting(b.rate_range)
        );
      }
      if (sortBy === "rate-high") {
        return (
          parseRateForSorting(b.rate_range) - parseRateForSorting(a.rate_range)
        );
      }
      if (sortBy === "availability") {
        const getStatusRank = (status?: string) => {
          const s = status?.toLowerCase() || "available";
          if (s === "available") return 3;
          if (s === "on tour") return 2;
          if (s === "busy") return 1;
          return 0;
        };
        return (
          getStatusRank(b.availability_status) -
          getStatusRank(a.availability_status)
        );
      }

      // Default Option: Ranked Algorithmic score (by overlapping genre match tags)
      const userProfileStr = localStorage.getItem("nexus_core_user_profile");
      const userProfileObj = userProfileStr ? JSON.parse(userProfileStr) : null;
      const userTags = userProfileObj?.genre_tags || [
        "brutal_death_metal",
        "slam",
      ];

      const overlapA = (a.genre_tags || []).filter((t) =>
        userTags.includes(t),
      ).length;
      const overlapB = (b.genre_tags || []).filter((t) =>
        userTags.includes(t),
      ).length;

      return overlapB - overlapA; // Descending density of tag overlap matches
    });

  // Modal handlers
  const openHireModal = (
    creative: CreativeTalent,
    preselectedTierId?: string,
  ) => {
    setHiringCreative(creative);
    const tiers = getTalentServiceTiers(creative.id, creative.category);
    const tierId = preselectedTierId || "premium";
    setSelectedTierIdInModal(tierId);

    const activeTier =
      tiers.find((t) => t.id === tierId) || tiers[1] || tiers[0];
    const parsedPrice = activeTier
      ? parseInt(activeTier.price.replace(/[^0-9]/g, ""), 10) || 350
      : 350;

    setNewProjectTitle(
      `${activeBandName} // ${activeTier ? activeTier.name.toUpperCase() : "Custom Production Deliverables"}`,
    );
    setNewProjectFee(parsedPrice);
    setNewProjectTimeline(
      tierId === "pro" ? 30 : tierId === "premium" ? 5 : 10,
    );

    // Preset dynamic defaults
    if (creative.category === "visual") {
      setNewProjectProtocols({ "visual-1": true, "visual-2": true });
    } else if (creative.category === "audio") {
      setNewProjectProtocols({ "audio-1": true, "audio-2": true });
    } else {
      setNewProjectProtocols({ "media-1": true, "media-2": true });
    }
  };

  const handleCreateContract = async () => {
    if (!hiringCreative) return;
    setSubmitting(true);

    const feeVal = Number(newProjectFee) || 200;
    const tiers = getTalentServiceTiers(
      hiringCreative.id,
      hiringCreative.category,
    );
    const activeTier = tiers.find((t) => t.id === selectedTierIdInModal);

    const newContract: CreativeContract & { service_tier?: string } = {
      id: `contract-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      created_at: new Date().toISOString(),
      project_title: newProjectTitle.trim() || "Custom Creative Gig Project",
      creative_id: hiringCreative.id,
      creative_name: hiringCreative.name,
      creative_category: hiringCreative.category,
      band_name: activeBandName,
      fee: feeVal,
      timeline_days: Number(newProjectTimeline) || 5,
      enforced_protocols: newProjectProtocols,
      verified_protocols: {}, // none initially checked by hired freelancer
      status: "production",
      useMilestones: useMilestonePayout,
      service_tier: activeTier ? activeTier.name : undefined,
      milestones: useMilestonePayout
        ? [
            {
              id: "m1",
              title: "Phase 1: Mockup Kickoff",
              percent: 30,
              amount: Math.floor(feeVal * 0.3),
              status: "locked",
            },
            {
              id: "m2",
              title: "Phase 2: Raw Capture Review",
              percent: 40,
              amount: Math.floor(feeVal * 0.4),
              status: "locked",
            },
            {
              id: "m3",
              title: "Phase 3: Master Assets Received",
              percent: 30,
              amount:
                feeVal - Math.floor(feeVal * 0.3) - Math.floor(feeVal * 0.4),
              status: "locked",
            },
          ]
        : undefined,
    };

    const updated = [newContract, ...contracts];
    saveContracts(updated);

    if (triggerNotification) {
      triggerNotification(
        `🚀 INDUSTRIAL PAYOUT DISPATCHED: $${newContract.fee} secured for ${newContract.creative_name}! ${useMilestonePayout ? "(3 progressive milestones configuration)" : ""}`,
      );
    }
    if (addLog) {
      addLog(
        `Created direct merchant contract for "${newContract.project_title}" with ${newContract.creative_name}. Funds locked in Payout.`,
      );
    }

    setSubmitting(false);
    setHiringCreative(null);
    setUseMilestonePayout(false); // Reset
    setActiveTab2("contracts"); // Switch to active pipelines tracking tab
  };

  const handleUpdateVerifiedProtocols = (
    contractId: string,
    verifiedMap: Record<string, boolean>,
  ) => {
    const updated = contracts.map((c) => {
      if (c.id === contractId) {
        // If all enforced checks are marked, status upgraded to verified
        const isAllDone = Object.keys(c.enforced_protocols)
          .filter((key) => c.enforced_protocols[key] === true)
          .every((key) => verifiedMap[key] === true);

        return {
          ...c,
          verified_protocols: verifiedMap,
          status: (isAllDone ? "verified" : "production") as
            | "production"
            | "verified"
            | "released",
        };
      }
      return c;
    });
    saveContracts(updated);
  };

  const handleAuthorizeRelease = (contractId: string) => {
    const updated = contracts.map((c) => {
      if (c.id === contractId) {
        // If they had milestones, release all of them
        const releasedMilestones = c.milestones?.map((m) => ({
          ...m,
          status: "released" as const,
        }));
        return {
          ...c,
          status: "released" as const,
          milestones: releasedMilestones,
        };
      }
      return c;
    });
    saveContracts(updated);

    const target = contracts.find((c) => c.id === contractId);
    if (triggerNotification) {
      triggerNotification(
        `⚡ FUNDS DISPATCHED: Flat rate fee of $${target?.fee || 0} released successfully to ${target?.creative_name || "Creative"}.`,
      );
    }
    if (addLog) {
      addLog(
        `Released payout flat rate funding of $${target?.fee || 0} via standard PayPal interface connection to ${target?.creative_name || "Independent Specialist"}.`,
      );
    }
  };

  const handleReleaseMilestone = (contractId: string, milestoneId: string) => {
    const updated = contracts.map((c) => {
      if (c.id === contractId) {
        if (!c.milestones) return c;

        const updatedMilestones = c.milestones.map((m) => {
          if (m.id === milestoneId) {
            return { ...m, status: "released" as const };
          }
          return m;
        });

        const allReleased = updatedMilestones.every(
          (m) => m.status === "released",
        );

        const releasedM = c.milestones.find((m) => m.id === milestoneId);
        if (triggerNotification) {
          triggerNotification(
            `💸 MILESTONE RELEASED: $${releasedM?.amount || 0} disbursed to ${c.creative_name}!`,
          );
        }
        if (addLog) {
          addLog(
            `Disbursed milestone payment of $${releasedM?.amount || 0} for "${c.project_title}" - ${releasedM?.title}.`,
          );
        }

        return {
          ...c,
          milestones: updatedMilestones,
          status: (allReleased ? "released" : c.status) as
            | "production"
            | "verified"
            | "released",
        };
      }
      return c;
    });
    saveContracts(updated);
  };

  const handleCreateRfp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRfpTitle.trim() || !newRfpDesc.trim()) {
      if (triggerNotification)
        triggerNotification(
          "⚠️ Please fill out all required RFP bulletin fields!",
        );
      return;
    }

    const newRfp: CreativeRFP = {
      id: `rfp-${Date.now()}`,
      created_at: new Date().toISOString(),
      title: newRfpTitle,
      category: newRfpCategory,
      description: newRfpDesc,
      budget: Number(newRfpBudget) || 250,
      delivery_by: newRfpDeliveryBy || "2026-06-30",
      band_name: activeBandName,
      pitches: [],
      views: Math.floor(Math.random() * 3) + 1,
    };

    const updated = [newRfp, ...rfps];
    saveRFPs(updated);

    if (triggerNotification) {
      triggerNotification(
        `📢 BULLETIN DEPLOYED: "${newRfpTitle}" active creative need is now live!`,
      );
    }
    if (addLog) {
      addLog(
        `Posted active Reverse Auction RFP "${newRfpTitle}" looking for ${newRfpCategory} specialists.`,
      );
    }

    // Reset fields
    setNewRfpTitle("");
    setNewRfpDesc("");
    setNewRfpBudget(250);
    setNewRfpDeliveryBy("2026-06-30");
    setNewRfpCategory("visual");
    setShowRfpForm(false);
  };

  const handleSimulatePitch = (rfpId: string) => {
    const rfpTarget = rfps.find((r) => r.id === rfpId);
    if (!rfpTarget) return;

    const mockPitchesAvailableByCat: Record<
      string,
      Array<{ name: string; creative_id: string; text: string; sketch: string }>
    > = {
      visual: [
        {
          name: "Iron Lettering Co.",
          creative_id: "c-ironlettering",
          text: "I can do hand-painted brutal typographic layout. Can deliver a high-contrast vector file in 4 days. See reference attached.",
          sketch:
            "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=250",
        },
        {
          name: "Occultus Designs",
          creative_id: "c-occultus",
          text: "Classic heavy ink stippling and grotesque skull layout. Done multiple record sleeves for slam and post-metal groups. Ready to start immediately!",
          sketch:
            "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=250",
        },
      ],
      audio: [
        {
          name: "Anode mastering lab",
          creative_id: "c-anode",
          text: "Brickwall limiter with analog tape saturation. Will deliver 24-bit WAV file with cassette EQ curve pre-checked. 48 hour turnaround guaranteed.",
          sketch:
            "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=250",
        },
        {
          name: "Audio Siege",
          creative_id: "c-audiosiege",
          text: "Full mixing & stem balancing. Let me run your tracks through my vintage SSL console to extract massive crunch and room depth.",
          sketch:
            "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=250",
        },
      ],
      media: [
        {
          name: "Cremator Videography",
          creative_id: "c-cremator",
          text: "Tour recap film specialist. High density VHS noise filter, multicam synchronization, full Premiere Pro editable timeline dispatch.",
          sketch:
            "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=250",
        },
      ],
    };

    const candidates =
      mockPitchesAvailableByCat[rfpTarget.category] ||
      mockPitchesAvailableByCat.visual;
    const existingPitchNames =
      rfpTarget.pitches?.map((p) => p.creative_name) || [];
    const pool = candidates.filter((c) => !existingPitchNames.includes(c.name));

    if (pool.length === 0) {
      if (triggerNotification)
        triggerNotification(
          "ℹ️ All eligible network candidates have already pitched for this active bulletin!",
        );
      return;
    }

    const chosen = pool[Math.floor(Math.random() * pool.length)];
    const newPitch: RFPPitch = {
      id: `pitch-${Date.now()}`,
      creative_id: chosen.creative_id,
      creative_name: chosen.name,
      pitch_text: chosen.text,
      sketch_ref: chosen.sketch,
      created_at: new Date().toISOString(),
    };

    const updatedRfps = rfps.map((r) => {
      if (r.id === rfpId) {
        return {
          ...r,
          pitches: [...(r.pitches || []), newPitch],
        };
      }
      return r;
    });

    saveRFPs(updatedRfps);
    if (triggerNotification) {
      triggerNotification(
        `⚡ REVERSE PITCH SUBMITTED: ${chosen.name} placed a bid of $${rfpTarget.budget} on "${rfpTarget.title}"!`,
      );
    }
    if (addLog) {
      addLog(
        `Independent specialist "${chosen.name}" submitted a micro-pitch for RFP: "${rfpTarget.title}".`,
      );
    }
  };

  const handleAcceptPitch = (rfpId: string, pitchId: string) => {
    const rfp = rfps.find((r) => r.id === rfpId);
    if (!rfp) return;

    const pitch = rfp.pitches?.find((p) => p.id === pitchId);
    if (!pitch) return;

    const milestonePortions: PayoutMilestone[] = [
      {
        id: `${Date.now()}-m1`,
        title: "Kickoff Draft Verification",
        percent: 35,
        amount: +(rfp.budget * 0.35).toFixed(2),
        status: "locked" as const,
      },
      {
        id: `${Date.now()}-m2`,
        title: "Mid-production Deliverable Review",
        percent: 35,
        amount: +(rfp.budget * 0.35).toFixed(2),
        status: "locked" as const,
      },
      {
        id: `${Date.now()}-m3`,
        title: "Final Mastering & Assets Sign-off",
        percent: 30,
        amount: +(rfp.budget * 0.3).toFixed(2),
        status: "locked" as const,
      },
    ];

    const protocolMapByCat: Record<string, Record<string, boolean>> = {
      visual: { print_separation_cmyk: true, layer_source_file_psd: true },
      audio: { stem_balancing_master: true, cassette_eq_curves: true },
      media: { video_transcaps: true, metadata_tagging_embedded: true },
    };

    const newContract: CreativeContract = {
      id: `con-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      created_at: new Date().toISOString(),
      project_title: `RFP: ${rfp.title}`,
      creative_id: pitch.creative_id,
      creative_name: pitch.creative_name,
      creative_category: rfp.category,
      band_name: activeBandName,
      fee: rfp.budget,
      timeline_days: 14,
      status: "production" as const,
      enforced_protocols: protocolMapByCat[rfp.category] || {
        standard_sign_off: true,
      },
      verified_protocols: {},
      useMilestones: true,
      milestones: milestonePortions,
    };

    const updatedContracts = [newContract, ...contracts];
    saveContracts(updatedContracts);

    const updatedRfps = rfps.filter((r) => r.id !== rfpId);
    saveRFPs(updatedRfps);

    if (triggerNotification) {
      triggerNotification(
        `🚀 REVERSE AUCTION PAYOUT ACTIVE: Instant-instantiated dynamic milestone contract with ${pitch.creative_name} for $${rfp.budget}!`,
      );
    }
    if (addLog) {
      addLog(
        `Accepted pitch from "${pitch.creative_name}" on bulletin "${rfp.title}". Locked $${rfp.budget} in multi-stage progressive Payout.`,
      );
    }

    setActiveTab2("contracts");
  };

  // Pre-calculate full lookbook items for pagination and total count
  const allLookbookItems = React.useMemo(() => {
    let userPushedLookbook: any[] = [];
    try {
      userPushedLookbook = JSON.parse(
        localStorage.getItem("nexus_core_lookbook_feed") || "[]",
      );
    } catch (_) {}

    // Merge supabase items into the local pushed list if they exist
    if (supabaseLookbook && supabaseLookbook.length > 0) {
      supabaseLookbook.forEach((sbItem: any) => {
        if (!userPushedLookbook.find((l: any) => l.id === sbItem.id)) {
          userPushedLookbook.push({
            id: sbItem.id,
            talentId: sbItem.talent_id,
            imageUrl: sbItem.image_url,
            mediaType: sbItem.media_type || "image",
            externalUrl: sbItem.external_url || "",
            timestamp: new Date(sbItem.created_at).getTime(),
          });
        }
      });
    }

    return processedTalents.flatMap((talent) => {
      const talentPushed = userPushedLookbook.filter(
        (l) =>
          l.talentId === talent.id ||
          (talent.id.startsWith("c-") &&
            l.talentId === "default" &&
            talent.name.includes("Soren")),
      );
      if (talentPushed.length > 0) {
        return talentPushed.map((p) => ({
          id: `pushed-${p.id}`,
          talent,
          imageUrl: p.imageUrl,
          mediaType: p.mediaType || "image",
          externalUrl: p.externalUrl || "",
          genre: p.genre,
          microGenre: p.microGenre,
        }));
      }

      const hash = talent.id
        .split("")
        .reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const images = [
        "https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1510127034890-ba27508e9f1c?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1550684376-efcbd6e3f031?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=400&q=80",
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      ];

      // Generate deterministic curated pieces for the feed
      const pieces = [];
      const count = 1 + (hash % 2); // 1 or 2 pieces
      for (let i = 0; i < count; i++) {
        pieces.push({
          id: `${talent.id}-art`,
          talent,
          imageUrl: images[(hash + i) % images.length],
        });
      }
      return pieces;
    });
  }, [processedTalents, supabaseLookbook]);

  return (
    <div className="min-h-screen w-full bg-black text-white p-5 font-mono select-none flex flex-col justify-between relative">
      {/* Fullscreen Slider Overlay for Lookbook Item */}
      <AnimatePresence>
        {fullscreenLookbookItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 sm:p-8"
          >
            <button
              className="absolute top-4 right-4 z-50 p-3 bg-black/50 hover:bg-black/80 rounded-full text-white/50 hover:text-white transition-colors cursor-pointer"
              onClick={() => setFullscreenLookbookItem(null)}
            >
              <X className="w-8 h-8" />
            </button>
            <div className="relative w-full h-full flex flex-col items-center justify-center max-w-5xl mx-auto space-y-6">
              {(() => {
                const item = fullscreenLookbookItem;
                const isExternal =
                  item.mediaType === "external" ||
                  !!(item as any).externalUrl ||
                  item.imageUrl.includes("youtube.com") ||
                  item.imageUrl.includes("youtu.be") ||
                  item.imageUrl.includes("vimeo.com") ||
                  item.imageUrl.includes("spotify.com") ||
                  item.imageUrl.includes("soundcloud.com");

                const targetUrl = (item as any).externalUrl || item.imageUrl;
                const embed = isExternal ? getEmbedData(targetUrl) : null;

                if (isExternal && embed && embed.embedUrl) {
                  if (embed.type === "youtube" || embed.type === "vimeo") {
                    return (
                      <iframe
                        src={embed.embedUrl}
                        className="w-full aspect-video max-h-[70vh] rounded-xl border-2 border-zinc-900 shadow-[0_0_35px_rgba(168,85,247,0.15)] bg-zinc-950"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        title="Lookbook Streaming Video Player"
                      />
                    );
                  } else if (
                    embed.type === "spotify" ||
                    embed.type === "soundcloud"
                  ) {
                    return (
                      <div className="w-full max-w-2xl bg-zinc-950 p-4 border border-zinc-850 rounded-2xl flex flex-col items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.15)] space-y-4">
                        <iframe
                          src={embed.embedUrl}
                          width="100%"
                          height={embed.type === "spotify" ? "352" : "166"}
                          frameBorder="0"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          title="Lookbook Streaming Audio Player"
                          className="rounded-xl"
                        />
                      </div>
                    );
                  }
                }

                if (item.mediaType === "video") {
                  return (
                    <video
                      src={item.imageUrl}
                      className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl rounded"
                      autoPlay
                      controls
                    />
                  );
                } else if (item.mediaType === "audio") {
                  return (
                    <div className="w-full max-w-sm aspect-square bg-zinc-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden">
                      <div className="absolute inset-0 bg-violet-500/10 pulse animate-pulse" />
                      <Music className="w-16 h-16 text-violet-500 mb-6 relative z-10" />
                      <audio
                        src={item.imageUrl}
                        controls
                        className="relative z-10 w-3/4"
                        autoPlay
                      />
                    </div>
                  );
                }
                return (
                  <img
                    src={item.imageUrl}
                    alt="Fullscreen Preview"
                    className="max-w-full max-h-[75vh] object-contain drop-shadow-2xl rounded"
                  />
                );
              })()}

              {/* Overlay Metadata & Action Buttons */}
              <div className="bg-zinc-900 border border-zinc-700/50 p-4 rounded flex flex-col md:flex-row items-center gap-4 w-full justify-between shadow-2xl">
                <div className="flex flex-col text-left">
                  <span className="text-white font-black uppercase text-sm">
                    {fullscreenLookbookItem?.talent?.name || 'Creative Artist'}
                  </span>
                  <span className="text-zinc-400 text-[10px] uppercase tracking-widest">
                    {fullscreenLookbookItem?.talent?.categoryLabel || 'Specialist'}
                  </span>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setSelectedDrawerTab("specs");
                      setSelectedDrawerTalent(fullscreenLookbookItem.talent);
                      setFullscreenLookbookItem(null);
                    }}
                    className="px-4 py-2 border border-zinc-700 font-mono text-[9px] sm:text-xs tracking-[0.2em] font-black hover:bg-white hover:text-black uppercase transition-all flex items-center justify-center group h-10 w-full md:w-auto"
                  >
                    Showreel & Specs
                  </button>

                  <button
                    onClick={() => {
                      const target = fullscreenLookbookItem.talent;
                      setFullscreenLookbookItem(null);
                      openHireModal(target);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-[#A855F7] to-[#8B5CF6] border border-[#d8b4fe] font-mono text-[9px] sm:text-xs tracking-[0.2em] font-black text-white hover:from-[#c084fc] hover:to-[#a855f7] hover:shadow-[0_0_15px_rgba(168,85,247,0.5)] transition-all flex items-center justify-center group h-10 w-full md:w-auto"
                  >
                    Hire Artist
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {/* HEADER BRAND BLOCK */}
        <div
          className="flex flex-col items-center justify-center border border-zinc-900 rounded-lg p-8 md:p-12 gap-3.5 relative text-center bg-cover bg-center overflow-hidden min-h-[200px]"
          style={{
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.8)), url('https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Gemini_Generated_Image_xow9drxow9drxow9.png')`,
          }}
        >
          {/* Subtle background overlay */}
          <div className="absolute inset-0 bg-violet-600/[0.03] pointer-events-none" />

          <div className="space-y-3 relative z-10 flex flex-col items-center justify-center max-w-3xl mx-auto w-full">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase text-white tracking-widest drop-shadow-[0_2px_12px_rgba(139,92,246,0.6)] text-center">
              CREATIVES HUB
            </h1>
            <p className="text-zinc-350 text-xs md:text-sm font-mono leading-relaxed text-center max-w-2xl font-bold">
              Search for and hire independent artists & designers,
              photographers, videographers, sound techs, session musicans, and
              more plus post an open job bulletin of what you need anytime.
            </p>
          </div>
        </div>

        {/* WORKSPACE TOGGLES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab2("discover")}
            className={`relative py-3 px-4 text-center border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group ${
              activeTab === "discover"
                ? "bg-zinc-900 border-violet-500 text-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.12)] ring-1 ring-violet-500/50"
                : "bg-black border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-350"
            }`}
          >
            <div
              className={`absolute inset-0 bg-violet-400/10 blur-xl transition-opacity duration-500 pointer-events-none ${activeTab === "discover" ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`}
            />
            <div className="relative z-10 flex flex-col items-center justify-center text-center">
              <div className="font-mono font-black uppercase tracking-wider text-[12px] sm:text-[13px] md:text-sm mb-1 text-center">
                [ DISCOVER TALENT ]
              </div>
              <div
                className={`text-[9.5px] sm:text-[10px] md:text-[11px] font-mono text-center ${activeTab === "discover" ? "text-violet-300" : "text-zinc-600 group-hover:text-zinc-400"}`}
              >
                Browse our network of top creators
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab2("rfp-bulletin")}
            className={`relative py-3 px-4 text-center border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group ${
              activeTab === "rfp-bulletin"
                ? "bg-zinc-900 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.12)] ring-1 ring-amber-500/50"
                : "bg-black border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-350"
            }`}
          >
            <div
              className={`absolute inset-0 bg-amber-400/5 blur-xl transition-opacity duration-500 pointer-events-none ${activeTab === "rfp-bulletin" ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`}
            />
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1">
              <div className="font-mono font-black uppercase tracking-wider text-[12px] sm:text-[13px] md:text-sm flex items-center justify-center gap-1.5 text-center">
                <span>[ GIG BULLETIN ]</span>
                {rfps.length > 0 && (
                  <span
                    className={`border text-[9px] font-black px-1.5 py-0.1 ${
                      activeTab === "rfp-bulletin"
                        ? "bg-amber-950 border-amber-500 text-amber-300"
                        : "bg-black border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {rfps.length}
                  </span>
                )}
              </div>
              <div
                className={`text-[9.5px] sm:text-[10px] md:text-[11px] font-mono text-center ${activeTab === "rfp-bulletin" ? "text-amber-300" : "text-zinc-600 group-hover:text-zinc-400"}`}
              >
                Post a specific job you want done
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab2("contracts")}
            className={`relative py-3 px-4 text-center border rounded-xl transition-all duration-300 cursor-pointer overflow-hidden group ${
              activeTab === "contracts"
                ? "bg-zinc-900 border-emerald-500 text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/50"
                : "bg-black border-zinc-900 text-zinc-500 hover:border-zinc-700 hover:text-zinc-355"
            }`}
          >
            <div
              className={`absolute inset-0 bg-emerald-400/10 blur-xl transition-opacity duration-500 pointer-events-none ${activeTab === "contracts" ? "opacity-100" : "opacity-0 group-hover:opacity-30"}`}
            />
            <div className="relative z-10 flex flex-col items-center justify-center text-center gap-1">
              <div className="font-mono font-black uppercase tracking-wider text-[12px] sm:text-[13px] md:text-sm flex items-center justify-center gap-1.5 text-center">
                <span>[ ACTIVE CONTRACTS ]</span>
                {contracts.length > 0 && (
                  <span
                    className={`border text-[9px] font-black px-1.5 py-0.1 ${
                      activeTab === "contracts"
                        ? "bg-emerald-950 border-emerald-500 text-emerald-300"
                        : "bg-black border-zinc-700 text-zinc-400"
                    }`}
                  >
                    {contracts.length}
                  </span>
                )}
              </div>
              <div
                className={`text-[9.5px] sm:text-[10px] md:text-[11px] font-mono text-center ${activeTab === "contracts" ? "text-emerald-300" : "text-zinc-600 group-hover:text-zinc-400"}`}
              >
                Manage your active projects and payments
              </div>
            </div>
          </button>
        </div>

        {/* LOADING INDICATORS */}
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
            <span className="text-[11px] text-zinc-500 uppercase tracking-widest animate-pulse">
              SYNCING CLIENT NETWORK NODE PIPELINES...
            </span>
          </div>
        ) : (
          <div>
            {/* VIEW 1: DISCOVER TALENT */}
            {activeTab === "discover" && (
              <div className="space-y-6">
                {/* HORIZONTAL FILTERS & SEARCH CLUSTER PANEL */}
                <div className="bg-[#000030] p-4 border border-zinc-900 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center select-none text-xs rounded-none">
                  {/* SEARCH FIELD */}
                  <div className="lg:col-span-4 flex flex-col sm:flex-row sm:items-center gap-3 w-full animate-fade-in">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest shrink-0 flex items-center gap-1.5 font-mono">
                      <Sparkles className="w-3.5 h-3.5 text-violet-400" />{" "}
                      SEARCH:
                    </span>
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="Type name, skills, bio keyphrase..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-black border border-zinc-800 text-white text-[11px] py-1 px-2.5 focus:outline-none focus:border-violet-500 font-mono text-left"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1.5 text-zinc-500 hover:text-white text-[9px] font-black uppercase font-mono"
                        >
                          [x] Clear
                        </button>
                      )}
                    </div>
                  </div>

                  {/* SPECIALTY FILTER */}
                  <div className="lg:col-span-4 flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest shrink-0 font-mono">
                      Specialty:
                    </span>
                    <div className="relative flex-grow">
                      <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value)}
                        className="w-full appearance-none bg-black border border-zinc-800 text-white text-[11px] py-1 pl-2.5 pr-8 focus:outline-none focus:border-violet-500 cursor-pointer uppercase font-mono tracking-wide"
                      >
                        <option value="all">-- All SPECIALISTS --</option>
                        <option value="logo art">Logo Art</option>
                        <option value="album artwork">Album Artwork</option>
                        <option value="layout">Layout Design</option>
                        <option value="graphic design">
                          Graphic Design (General/Social)
                        </option>
                        <option value="merch design">Merchandise Design</option>
                        <option value="typography / lettering">
                          Typography / Lettering
                        </option>
                        <option value="animation / motion graphics">
                          Animation / Motion Graphics
                        </option>
                        <option value="3d art & rendering">
                          3D Art & Rendering
                        </option>
                        <option value="mix and master">Mix and Master</option>
                        <option value="foh sound engineer">
                          FOH Sound Engineer
                        </option>
                        <option value="system tech / monitor engineer">
                          System Tech / Monitor Engineer
                        </option>
                        <option value="lighting director / ld">
                          Lighting Director / LD
                        </option>
                        <option value="tour management">Tour Management</option>
                        <option value="session musician">
                          Session Musician
                        </option>
                        <option value="photography">Photography</option>
                        <option value="video production">
                          Video Production
                        </option>
                        <option value="music video director">
                          Music Video Director
                        </option>
                        <option value="stage design">Stage Design</option>
                        <option value="booking agent">Booking Agent</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-500">
                        <svg
                          className="fill-current h-4 w-4"
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* REGION HUB FILTER */}
                  <div className="lg:col-span-4 flex flex-col sm:flex-row sm:items-center gap-3 w-full">
                    <span className="text-[10px] text-zinc-500 uppercase font-black tracking-widest shrink-0 font-mono">
                      Market:
                    </span>
                    <div className="relative flex-grow">
                      <input
                        type="text"
                        placeholder="All Markets (e.g. Detroit, Berlin)..."
                        value={selectedRegion}
                        onChange={(e) => setSelectedRegion(e.target.value)}
                        className="w-full bg-black border border-zinc-800 text-white text-[11px] py-1 px-2.5 focus:outline-none focus:border-violet-500 font-mono text-left"
                      />
                      {selectedRegion && (
                        <button
                          type="button"
                          onClick={() => setSelectedRegion("")}
                          className="absolute right-2 top-1.5 text-zinc-500 hover:text-white text-[9px] font-black uppercase font-mono"
                        >
                          [x] All
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* GLOBAL CONTROL DECK VIEW SWITCH */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 select-none mt-4 border-b border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setViewMode("lookbook")}
                    className={`p-4 border rounded-xl transition-all duration-300 text-left flex items-start gap-4 w-full cursor-pointer group h-full relative overflow-hidden ${
                      viewMode === "lookbook"
                        ? "bg-violet-950/15 border-violet-500 text-violet-300 shadow-[0_0_20px_rgba(139,92,246,0.12)] ring-1 ring-violet-500/30"
                        : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900/40"
                    }`}
                  >
                    {viewMode === "lookbook" && (
                      <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-violet-400/20 to-transparent pointer-events-none animate-horizontal-scan" />
                    )}
                    <style
                      dangerouslySetInnerHTML={{
                        __html: `
                        @keyframes horizontal-scan {
                          0% { transform: translateX(-150%); }
                          100% { transform: translateX(350%); }
                        }
                        .animate-horizontal-scan {
                          animation: horizontal-scan 3s cubic-bezier(0.25, 1, 0.5, 1) infinite;
                        }
                      `,
                      }}
                    />
                    <Layers
                      className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${viewMode === "lookbook" ? "text-violet-400 font-bold" : "text-zinc-650 group-hover:text-zinc-500"}`}
                    />
                    <div className="space-y-1 mt-[-2px]">
                      <div
                        className={`text-xs font-mono font-black uppercase tracking-wider transition-colors ${viewMode === "lookbook" ? "text-white" : "text-zinc-400 group-hover:text-zinc-350"}`}
                      >
                        {viewMode === "lookbook"
                          ? "[● LOOKBOOK GRID]"
                          : "[○ LOOKBOOK GRID]"}
                      </div>
                      <div className="text-[10px] sm:text-[10.5px] text-zinc-500 font-sans leading-relaxed">
                        Browse through our premium showcase of creators from all
                        over the world and hire them instantly by clicking on
                        their tile.
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("roster")}
                    className={`p-4 border rounded-xl transition-all duration-300 text-left flex items-start gap-4 w-full cursor-pointer group h-full relative overflow-hidden ${
                      viewMode === "roster"
                        ? "bg-emerald-950/15 border-emerald-500 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.12)] ring-1 ring-emerald-500/30"
                        : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:bg-zinc-900/40"
                    }`}
                  >
                    {viewMode === "roster" && (
                      <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent pointer-events-none animate-horizontal-scan" />
                    )}
                    <Briefcase
                      className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${viewMode === "roster" ? "text-emerald-400 font-bold" : "text-zinc-650 group-hover:text-zinc-500"}`}
                    />
                    <div className="space-y-1 mt-[-2px] relative z-10">
                      <div
                        className={`text-xs font-mono font-black uppercase tracking-wider transition-colors ${viewMode === "roster" ? "text-white" : "text-zinc-400 group-hover:text-zinc-350"}`}
                      >
                        {viewMode === "roster"
                          ? "[● STRUCTURAL ROSTER]"
                          : "[○ STRUCTURAL ROSTER]"}
                      </div>
                      <div className="text-[10px] sm:text-[10.5px] text-zinc-500 font-sans leading-relaxed">
                        Do you prefer to view a highly detailed list of
                        available creators and their specialties instead?
                      </div>
                    </div>
                  </button>
                </div>

                {/* THE DUAL ENGINE RENDER */}
                {processedTalents.length === 0 ? (
                  <div className="py-20 border border-dashed border-[#262626] text-center bg-black space-y-3">
                    <span className="text-zinc-650 text-xs font-black block tracking-widest uppercase">
                      [ NO ACTIVE SPECS MATCHED IN NETWORK ]
                    </span>
                    <p className="text-[10.5px] text-zinc-500 font-sans max-w-md mx-auto">
                      Adjust your custom text filter queries or choose another
                      specialty directory filter to track available candidates.
                    </p>
                  </div>
                ) : (
                  <div className="mt-4">
                    {viewMode === "lookbook" && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-r from-zinc-950/80 to-black border border-[#262626] p-4 rounded-xl flex items-start gap-3">
                          <Layers className="w-5 h-5 text-violet-500 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-mono font-black text-white uppercase tracking-widest font-bold">
                                Showcase Feed
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setShowcaseDescCollapsed(
                                    !showcaseDescCollapsed,
                                  )
                                }
                                className="text-[9px] font-mono text-zinc-400 hover:text-white font-bold"
                              >
                                {showcaseDescCollapsed
                                  ? "[ DETAIL EXPAND + ]"
                                  : "[ DETAIL COLLAPSE - ]"}
                              </button>
                            </div>
                            {!showcaseDescCollapsed && (
                              <div className="text-[10px] font-mono text-zinc-500 leading-relaxed max-w-2xl mt-1">
                                Discover explicitly published portfolio
                                highlights from the network. When artists
                                publish selected works to their showcase, they
                                appear here in the live lookbook feed.
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                          {allLookbookItems
                            .slice((lookbookPage - 1) * 8, lookbookPage * 8)
                            .map((item, idx) => (
                              <div
                                key={`lookbook-item-${item.id}-${idx}`}
                                onClick={() => {
                                  setFullscreenLookbookItem({
                                    id: item.id,
                                    imageUrl: item.imageUrl,
                                    talent: item.talent,
                                    mediaType: (item as any).mediaType,
                                    externalUrl: (item as any).externalUrl,
                                  });
                                }}
                                className="relative aspect-square bg-black border border-[#262626] font-mono hover:border-[#A855F7] hover:shadow-[0_0_15px_rgba(168,85,247,0.2)] transition-all cursor-pointer group overflow-hidden"
                              >
                                {/* Artwork Image */}
                                {(() => {
                                  if ((item as any).mediaType === "video") {
                                    return (
                                      <video
                                        src={item.imageUrl}
                                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 pointer-events-none"
                                        autoPlay
                                        muted
                                        loop
                                        playsInline
                                      />
                                    );
                                  }
                                  if ((item as any).mediaType === "audio") {
                                    return (
                                      <div className="w-full h-full bg-zinc-900 flex items-center justify-center opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105 pointer-events-none">
                                        <div className="absolute inset-x-0 w-full h-full bg-violet-500/10 pulse animate-pulse" />
                                        <div className="text-violet-500 font-bold uppercase tracking-widest text-[10px] z-10 flex flex-col items-center gap-2">
                                          <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="24"
                                            height="24"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="lucide lucide-music"
                                          >
                                            <path d="M9 18V5l12-2v13" />
                                            <circle cx="6" cy="18" r="3" />
                                            <circle cx="18" cy="16" r="3" />
                                          </svg>
                                          Audio Track
                                        </div>
                                      </div>
                                    );
                                  }
                                  return (
                                    <img
                                      src={item.imageUrl}
                                      alt={`Artwork by ${item?.talent?.name || 'Creative Artist'}`}
                                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                                    />
                                  );
                                })()}

                                {/* Artist Overlay info (shows on hover) */}
                                <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black via-black/80 to-transparent translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                  <h4 className="text-white text-[11px] font-black uppercase truncate text-[#A855F7] drop-shadow-md">
                                    {item?.talent?.name || 'Creative Artist'}
                                  </h4>
                                  <p
                                    className="text-[10px] text-zinc-300 truncate mt-0.5"
                                    dangerouslySetInnerHTML={{
                                      __html: item?.talent?.skills || [][0],
                                    }}
                                  />
                                  {((item as any).genre ||
                                    (item as any).microGenre) && (
                                    <div className="flex flex-wrap gap-1 mt-1 pl-0.5">
                                      {(item as any).genre && (
                                        <span className="text-[7.5px] uppercase tracking-wider font-extrabold font-mono bg-violet-950/80 border border-violet-800 text-violet-300 px-1.5 py-0.2 rounded-md leading-none">
                                          {(item as any).genre}
                                        </span>
                                      )}
                                      {(item as any).microGenre && (
                                        <span className="text-[7.5px] uppercase tracking-wider font-extrabold font-mono bg-emerald-950/80 border border-emerald-800 text-emerald-300 px-1.5 py-0.2 rounded-md leading-none">
                                          {(item as any).microGenre}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Showcase Indicator top right */}
                                <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-sm border border-zinc-800 text-zinc-400 text-[8px] px-1.5 py-0.5 tracking-widest font-black uppercase shadow-sm">
                                  SHOWCASE
                                </div>
                              </div>
                            ))}
                        </div>

                        {allLookbookItems.length > 8 && (
                          <div className="flex items-center justify-between pt-6 mt-2 border-t border-[#1e1e1e] text-[10px] sm:text-xs font-mono select-none">
                            <button
                              type="button"
                              disabled={lookbookPage === 1}
                              onClick={() => setLookbookPage((prev) => Math.max(1, prev - 1))}
                              className={`px-4 py-2 border rounded-md transition-all font-black uppercase tracking-wider cursor-pointer ${
                                lookbookPage === 1
                                  ? "border-zinc-900 text-zinc-700 cursor-not-allowed"
                                  : "border-zinc-800 text-zinc-400 hover:border-violet-500 hover:text-white hover:bg-violet-950/20"
                              }`}
                            >
                              &lt;prev
                            </button>

                            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                              SET {lookbookPage} OF{" "}
                              {Math.max(
                                1,
                                Math.ceil(allLookbookItems.length / 8),
                              )}
                            </span>

                            <button
                              type="button"
                              disabled={
                                lookbookPage * 8 >= allLookbookItems.length
                              }
                              onClick={() => setLookbookPage((prev) => prev + 1)}
                              className={`px-4 py-2 border rounded-md transition-all font-black uppercase tracking-wider cursor-pointer ${
                                lookbookPage * 8 >= allLookbookItems.length
                                  ? "border-zinc-900 text-zinc-700 cursor-not-allowed"
                                  : "border-zinc-800 text-zinc-400 hover:border-violet-500 hover:text-white hover:bg-violet-950/20"
                              }`}
                            >
                              next&gt;
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {viewMode === "roster" && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                        {processedTalents.map((talent, idx) => {
                          const isExpanded = !!expandedCardIds[talent.id];

                          // Routing match check
                          const matchingBeacon = routingBeacons.find(
                            (beacon) => {
                              const targetCity = beacon.target_region
                                .split(",")[0]
                                .trim()
                                .toLowerCase();
                              return (
                                (talent.location
                                  .toLowerCase()
                                  .includes(targetCity) ||
                                  talent.quick_broadcast
                                    ?.toLowerCase()
                                    .includes(targetCity)) &&
                                talent.id !== "my-profile-talent"
                              );
                            },
                          );

                          return (
                            <div
                              key={`${talent.id}-${idx}`}
                              className={`relative bg-gradient-to-br from-zinc-950 to-black border-2 transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg group rounded-lg ${
                                favorites.includes(talent.id)
                                  ? "border-amber-500/80 shadow-[0_0_15px_rgba(244,180,26,0.15)]"
                                  : talent.category === "visual"
                                    ? "border-fuchsia-950/50 hover:border-fuchsia-400 hover:shadow-fuchsia-500/10"
                                    : talent.category === "audio"
                                      ? "border-emerald-950/50 hover:border-emerald-400 hover:shadow-emerald-500/10"
                                      : "border-cyan-950/50 hover:border-cyan-400 hover:shadow-cyan-500/10"
                              }`}
                            >
                              {/* TOUR INTERSECT STRIP */}
                              {matchingBeacon && (
                                <div className="bg-emerald-950/90 border-b border-emerald-500/30 px-3.5 py-2 flex items-center justify-between text-[8.5px] text-emerald-400 font-mono animate-fade-in relative z-10 select-none">
                                  <span className="flex items-center gap-1.5">
                                    <MapPin className="w-3 h-3 text-emerald-400" />
                                    <span>
                                      ROUTE INTERSECT:{" "}
                                      {matchingBeacon.target_region} (
                                      {matchingBeacon.start_date})
                                    </span>
                                  </span>
                                  <span className="font-extrabold uppercase bg-emerald-500 text-black px-1.5 py-0.2 rounded-[2px] leading-none text-[7.5px] scale-90 select-none">
                                    LOCAL INTERSECT
                                  </span>
                                </div>
                              )}

                              {/* QUICK SAVE STAR BUTTON */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleFavorite(talent.id, talent.name);
                                }}
                                className={`absolute z-20 w-8 h-8 rounded-full border flex items-center justify-center transition-all bg-black/80 hover:bg-zinc-900 cursor-pointer ${
                                  matchingBeacon ? "top-[50px]" : "top-3.5"
                                } right-3.5 ${
                                  favorites.includes(talent.id)
                                    ? "border-amber-400 text-amber-400 shadow-[0_0_8px_rgba(244,180,26,0.5)]"
                                    : "border-zinc-800 text-zinc-500 hover:text-amber-400 hover:border-amber-400/40"
                                }`}
                                title={
                                  favorites.includes(talent.id)
                                    ? "Remove from Favorites"
                                    : "Quick Save to Favorites"
                                }
                              >
                                <Star
                                  className={`w-4 h-4 transition-transform hover:scale-110 ${favorites.includes(talent.id) ? "fill-amber-400 text-amber-400" : "text-zinc-500"}`}
                                />
                              </button>

                              {/* TEXTURE OVERLAY */}
                              <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:8px_8px] mix-blend-overlay pointer-events-none" />

                              {/* GLOW SPLASH TOP RIGHT */}
                              <div
                                className={`absolute -top-16 -right-16 w-32 h-32 blur-[50px] pointer-events-none transition-opacity duration-300 opacity-20 group-hover:opacity-40 ${
                                  talent.category === "visual"
                                    ? "bg-fuchsia-500"
                                    : talent.category === "audio"
                                      ? "bg-emerald-500"
                                      : "bg-cyan-500"
                                }`}
                              />

                              {/* GLOW SPLASH BOTTOM LEFT */}
                              <div
                                className={`absolute -bottom-16 -left-16 w-32 h-32 blur-[60px] pointer-events-none transition-opacity duration-300 opacity-10 group-hover:opacity-30 ${
                                  talent.category === "visual"
                                    ? "bg-purple-600"
                                    : talent.category === "audio"
                                      ? "bg-teal-600"
                                      : "bg-blue-600"
                                }`}
                              />

                              {/* HEADLINER CLICKABLE BODY BLOCK */}
                              <div
                                onClick={() => toggleCardExpanded(talent.id)}
                                className="p-4.5 flex flex-col gap-3.5 cursor-pointer relative z-10 select-none hover:bg-zinc-900/35 transition-colors border-b border-transparent group-hover:border-zinc-900/40"
                              >
                                {/* TOP SPECIALTY & AVAILABILITY PILLS STRIP */}
                                <div className="flex items-center justify-between text-[9px] font-mono pr-8">
                                  <span
                                    className={`font-black px-2.5 py-0.5 border uppercase tracking-wider ${
                                      talent.category === "visual"
                                        ? "bg-fuchsia-950/40 border-fuchsia-800 text-fuchsia-400"
                                        : talent.category === "audio"
                                          ? "bg-emerald-950/40 border-emerald-800 text-emerald-400"
                                          : "bg-cyan-950/40 border-cyan-800 text-cyan-400"
                                    }`}
                                  >
                                    {talent.category === "visual"
                                      ? "Visual Specialist"
                                      : talent.category === "audio"
                                        ? "Acoustics & Audio Eng."
                                        : "Media & Recaps"}
                                  </span>

                                  <div className="flex items-center gap-1.5 bg-black/60 px-2 py-0.5 border border-zinc-900/80 rounded-full font-bold">
                                    <span className="relative flex h-1.5 w-1.5">
                                      <span
                                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                                          talent.availability_status ===
                                          "On Tour"
                                            ? "bg-purple-400"
                                            : talent.availability_status ===
                                                "Busy"
                                              ? "bg-amber-400"
                                              : "bg-emerald-400"
                                        }`}
                                      ></span>
                                      <span
                                        className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
                                          talent.availability_status ===
                                          "On Tour"
                                            ? "bg-purple-400"
                                            : talent.availability_status ===
                                                "Busy"
                                              ? "bg-amber-400"
                                              : "bg-emerald-400"
                                        }`}
                                      ></span>
                                    </span>
                                    <span
                                      className={`text-[7.5px] uppercase ${
                                        talent.availability_status === "On Tour"
                                          ? "text-purple-300"
                                          : talent.availability_status ===
                                              "Busy"
                                            ? "text-amber-400"
                                            : "text-emerald-400"
                                      }`}
                                    >
                                      {talent.availability_status ||
                                        "Available"}
                                    </span>
                                  </div>
                                </div>

                                {/* USER/CANDIDATE CARD SEGMENT */}
                                <div className="flex items-center gap-3">
                                  {talent.avatar_url ? (
                                    <img
                                      src={talent.avatar_url}
                                      alt={talent.name}
                                      className="w-11 h-11 rounded-full object-cover border border-zinc-800 shrink-0 shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div
                                      className={`w-11 h-11 rounded-full shrink-0 flex items-center justify-center border text-xs font-black shadow-[0_2px_8px_rgba(0,0,0,0.5)] ${
                                        talent.category === "visual"
                                          ? "bg-fuchsia-950/60 border-fuchsia-800 text-fuchsia-400"
                                          : talent.category === "audio"
                                            ? "bg-emerald-950/60 border-emerald-800 text-emerald-400"
                                            : "bg-cyan-950/60 border-cyan-800 text-cyan-400"
                                      }`}
                                    >
                                      {talent.name
                                        .substring(0, 2)
                                        .toUpperCase()}
                                    </div>
                                  )}

                                  <div className="space-y-0.5 text-left">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="text-[13px] font-black text-white group-hover:text-violet-350 transition-colors uppercase tracking-wide">
                                        {talent.name}
                                      </span>
                                      {talent.id === "my-profile-talent" && (
                                        <span className="text-[7.5px] uppercase bg-violet-950/60 border border-violet-850 text-violet-300 px-1.5 py-0.2 rounded leading-none font-bold">
                                          [ ME ]
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[9.5px] text-zinc-500 font-mono block leading-snug">
                                      {talent.title_block.split(" // ")[1] ||
                                        talent.title_block}
                                    </span>
                                  </div>
                                </div>

                                {/* BOTTOM TOGGLE & LOCATION BANNER */}
                                <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono mt-1 border-t border-zinc-900/60 pt-2.5">
                                  <span className="flex items-center gap-1 text-[9px] uppercase font-semibold text-zinc-400">
                                    <MapPin className="w-3.5 h-3.5 text-zinc-650" />
                                    {talent.location.split("Market")[0].trim()}
                                  </span>
                                  <span className="text-zinc-500 hover:text-white text-[9.5px] font-bold">
                                    {isExpanded
                                      ? "[ COLLAPSE ▴ ]"
                                      : "[ QUICK VIEW ▾ ]"}
                                  </span>
                                </div>
                              </div>

                              {/* EXPANDED SPECIFICATION BODY SECTION */}
                              {isExpanded ? (
                                <div className="px-4.5 pb-4.5 space-y-4 relative z-10 transition-all duration-150 border-t border-zinc-900/40 pt-3 text-left">
                                  {/* Dynamic Compatibility Layer */}
                                    {(() => {
                                      const userProfileStr =
                                        localStorage.getItem(
                                          "nexus_core_user_profile",
                                        );
                                      const userProfileObj = userProfileStr
                                        ? JSON.parse(userProfileStr)
                                        : null;
                                      const userTagsObj =
                                        userProfileObj?.genre_tags || [
                                          "brutal_death_metal",
                                          "slam",
                                        ];

                                      const talentTags =
                                        talent.genre_tags || [];
                                      if (talentTags.length === 0) return null;

                                      const overlap = talentTags.filter((t) =>
                                        userTagsObj.includes(t),
                                      );
                                      const percent = Math.round(
                                        (overlap.length / userTagsObj.length) *
                                          100,
                                      );

                                      const hasExtremeMetal = (talentTags || []).some(
                                        (t) =>
                                          [
                                            "brutal_death_metal",
                                            "grindcore",
                                            "slam",
                                            "deathcore",
                                            "black_metal",
                                          ].includes(t),
                                      );
                                      const hasElectronic = (talentTags || []).some(
                                        (t) =>
                                          [
                                            "synthwave",
                                            "phonk",
                                            "cyberpunk",
                                          ].includes(t),
                                      );
                                      const hasHipHop = (talentTags || []).some((t) =>
                                        [
                                          "underground_hip_hop",
                                          "trap",
                                          "boom_bap",
                                        ].includes(t),
                                      );
                                      const hasHardcore = (talentTags || []).some((t) =>
                                        ["hardcore", "grindcore"].includes(t),
                                      );

                                      const categories: string[] = [];
                                      if (hasExtremeMetal)
                                        categories.push(
                                          `EXTREME METAL (${percent || 50}%)`,
                                        );
                                      if (hasElectronic)
                                        categories.push(
                                          `ELECTRONIC (${percent ? Math.min(100, percent + 25) : 50}%)`,
                                        );
                                      if (hasHipHop)
                                        categories.push(
                                          `UNDERGROUND RAP (${percent ? Math.max(20, percent - 10) : 30}%)`,
                                        );
                                      if (hasHardcore)
                                        categories.push(
                                          `HARDCORE (${percent || 60}%)`,
                                        );

                                      if (categories.length === 0) return null;
                                      return (
                                        <div className="text-[8.5px] font-mono font-black text-emerald-400 bg-emerald-950/20 px-2 py-1 rounded border border-emerald-900/35 uppercase tracking-wide">
                                          [ COMPATIBLE MATCHES:{" "}
                                          {categories.join(" | ")} ]
                                        </div>
                                      );
                                    })()}

                                  {talent.quick_broadcast && (
                                    <div className="bg-zinc-950/95 border border-zinc-900 p-2.5 rounded-lg text-[9px] font-mono relative overflow-hidden">
                                      <div className="absolute inset-y-0 left-0 w-0.5 bg-violet-500" />
                                      <span className="text-[7.5px] uppercase tracking-wider text-violet-400 block font-bold">
                                        📢 Ticker Update:
                                      </span>
                                      <p className="text-[9.5px] italic text-zinc-400 leading-normal mt-0.5">
                                        "{talent.quick_broadcast}"
                                      </p>
                                    </div>
                                  )}

                                  <p className="text-[11.5px] text-zinc-400 leading-relaxed font-sans mt-1">
                                    {talent.bio}
                                  </p>

                                  {/* SKILLS ARRAY */}
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {talent.skills.map((skill, si) => (
                                      <span
                                        key={`creative-service-${talent.id || talent.name || 't'}-${si}`}
                                        className={`text-[9.5px] px-2.5 py-0.5 lowercase tracking-tight border backdrop-blur-sm ${
                                          talent.category === "visual"
                                            ? "bg-fuchsia-950/30 border-fuchsia-900/40 text-fuchsia-300"
                                            : talent.category === "audio"
                                              ? "bg-emerald-950/30 border-emerald-900/40 text-emerald-300"
                                              : "bg-cyan-950/30 border-cyan-900/40 text-cyan-300"
                                        }`}
                                      >
                                        #{skill.trim()}
                                      </span>
                                    ))}
                                  </div>

                                  {/* EXCLUSIVE PRICING SPECIFICATION */}
                                  <div className="pt-3 border-t border-zinc-900 flex justify-end items-center text-[10.5px] text-zinc-500 font-mono">
                                    <span className="text-[10px] font-black text-amber-400 bg-amber-950/10 px-2.5 py-1 border border-amber-950/50 rounded-md">
                                      Rate Range: {talent.rate_range}
                                    </span>
                                  </div>

                                   {/* ACTION BUTTON PANE */}
                                  <div className="grid grid-cols-2 sm:grid-cols-4 border-t border-zinc-900 divide-x divide-y sm:divide-y-0 divide-zinc-900 relative z-10 select-none bg-black">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFollowTalent(talent.id, talent.name);
                                      }}
                                      className={`p-2.5 font-mono font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer transition-all duration-150 flex items-center justify-center gap-1 ${
                                        followedTalents.includes(talent.id)
                                          ? "text-purple-400 bg-purple-950/20 hover:bg-purple-950/40"
                                          : "text-rose-400 hover:text-rose-300 hover:bg-rose-950/20"
                                      }`}
                                    >
                                      {followedTalents.includes(talent.id) ? (
                                        <>
                                          <UserCheck className="w-3 h-3" /> Following
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="w-3 h-3" /> Follow
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMessageCreative(talent);
                                      }}
                                      className="p-2.5 font-mono font-bold text-[9px] uppercase tracking-wider text-center cursor-pointer hover:bg-zinc-950/40 text-zinc-300 hover:text-white transition-all duration-150 flex items-center justify-center gap-1"
                                    >
                                      <MessageSquare className="w-3 h-3 text-violet-400" />
                                      Message
                                    </button>
                                    <button
                                      onClick={() => {
                                        setSelectedDrawerTab("specs");
                                        setSelectedDrawerTalent(talent);
                                        setIsPlayingAudio(false);
                                      }}
                                      className="p-2.5 font-mono font-black text-[9px] uppercase tracking-wider text-center cursor-pointer hover:bg-zinc-950/15 text-violet-400 hover:text-violet-350 transition-all duration-150 flex items-center justify-center gap-1"
                                    >
                                      👁️ Specs
                                    </button>
                                    <button
                                      onClick={() => openHireModal(talent)}
                                      className={`p-2.5 font-mono font-black text-[9px] uppercase tracking-wider text-center cursor-pointer transition-all duration-150 flex items-center justify-center gap-1 ${
                                        talent.category === "visual"
                                          ? "text-fuchsia-400 hover:bg-fuchsia-950/20 hover:text-fuchsia-200"
                                          : talent.category === "audio"
                                            ? "text-emerald-400 hover:bg-emerald-950/20 hover:text-emerald-200"
                                            : "text-cyan-400 hover:bg-cyan-950/20 hover:text-cyan-200"
                                      }`}
                                    >
                                      💼 Hire
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* COMPACT COLLAPSED FOOTER INFO BAR */
                                <div
                                  onClick={() => toggleCardExpanded(talent.id)}
                                  className="px-3.5 py-2.5 border-t border-zinc-900/40 bg-zinc-950/30 hover:bg-zinc-900/30 flex items-center justify-between text-[10px] text-zinc-500 font-mono relative z-10 cursor-pointer select-none gap-2 flex-wrap"
                                >
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="flex items-center gap-1 font-semibold text-[8.5px] text-zinc-400 uppercase">
                                      STATUS ACTIVE
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleFollowTalent(talent.id, talent.name);
                                      }}
                                      className={`p-1 px-2 rounded flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider transition-all duration-150 cursor-pointer border ${
                                        followedTalents.includes(talent.id)
                                          ? "bg-purple-950/40 border-purple-800 text-purple-300 hover:bg-purple-900/30"
                                          : "bg-rose-950/40 border-rose-800 text-rose-300 hover:bg-rose-900/30"
                                      }`}
                                      title={followedTalents.includes(talent.id) ? "Unfollow creative" : "Follow creative"}
                                    >
                                      {followedTalents.includes(talent.id) ? (
                                        <>
                                          <UserCheck className="w-2.5 h-2.5" />
                                          <span>FOLLOWING</span>
                                        </>
                                      ) : (
                                        <>
                                          <UserPlus className="w-2.5 h-2.5" />
                                          <span>FOLLOW</span>
                                        </>
                                      )}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMessageCreative(talent);
                                      }}
                                      className="p-1 px-1.5 opacity-90 hover:opacity-100 bg-violet-950/40 hover:bg-violet-900/20 border border-violet-850/60 text-violet-300 hover:text-white rounded flex items-center gap-1 font-mono text-[8px] font-bold tracking-wider transition-all duration-150 cursor-pointer"
                                      title="Open Secure Coordinator Messenger"
                                    >
                                      <Mail className="w-2.5 h-2.5 text-violet-400 animate-pulse" />
                                      <span>MESSAGE</span>
                                      <span className="bg-violet-700 text-white min-w-[12px] h-3 px-1 rounded flex items-center justify-center text-[7.5px] leading-none font-bold">
                                        {(chatMessages[talent.id] || []).filter(
                                          (m) => m.id !== "init-sys",
                                        ).length || 2}
                                      </span>
                                    </button>
                                  </div>

                                  <span className="text-[8.5px] font-black tracking-tight text-amber-400 border border-amber-950 px-2 py-0.5 bg-black ml-auto">
                                    {talent.rate_range}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* TOUR ROUTING INGRESS INTERSECT (LOCATION PROXIMITY) */}
                {routingBeacons && routingBeacons.length > 0 && (
                  <div className="bg-[#05070a] border border-zinc-900 font-mono rounded-xl overflow-hidden mt-6">
                    {/* Collapsible Header */}
                    <div
                      onClick={() => setIsRoutingCollapsed(!isRoutingCollapsed)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer hover:bg-zinc-950/60 transition-colors select-none"
                    >
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Activity className="w-4 h-4 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-wider text-white">
                          [ TOUR ROUTING INTERSECT ]
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[8.5px] bg-emerald-950 text-emerald-400 border border-emerald-900/60 px-2.5 py-0.5 rounded leading-none font-bold uppercase select-none">
                          ⚙️ {routingBeacons.length} TOUR SCHEDULE Stop MATCHES
                        </span>
                        <span className="text-zinc-400 text-[9px] font-bold">
                          {isRoutingCollapsed
                            ? "[ VIEW DETAILS ▾ ]"
                            : "[ HIDE DETAILS ▴ ]"}
                        </span>
                      </div>
                    </div>

                    {!isRoutingCollapsed && (
                      <div className="p-4 space-y-3 border-t border-zinc-900/40 animate-fade-in text-left">
                        <p className="text-[10px] text-zinc-400 leading-normal font-sans">
                          Cross-referencing active schedule signals and calendar
                          dates with local independent specialists available on
                          your virtual route stops:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5">
                          {routingBeacons.map((beacon, bIdx) => {
                            // Scan talents for matching city
                            const matchingCity = beacon.target_region
                              .split(",")[0]
                              .trim()
                              .toLowerCase();
                            const matchingTalents = talents.filter(
                              (t) =>
                                (t.location
                                  .toLowerCase()
                                  .includes(matchingCity) ||
                                  t.quick_broadcast
                                    ?.toLowerCase()
                                    .includes(matchingCity)) &&
                                t.id !== "my-profile-talent",
                            );

                            return (
                              <div
                                key={`creative-badge-${bIdx}`}
                                className="bg-black border border-zinc-900 p-3 space-y-2.5 flex flex-col justify-between hover:border-emerald-500/30 transition-all select-none relative overflow-hidden rounded-xl"
                              >
                                <div className="absolute top-0 right-0 w-8 h-8 bg-emerald-500/[0.02] rounded-full blur-md pointer-events-none" />
                                <div className="space-y-1">
                                  <div className="flex justify-between items-center text-[10px] gap-1">
                                    <span className="text-white font-black uppercase tracking-wider truncate">
                                      {beacon.target_region}
                                    </span>
                                    <span className="text-emerald-400 text-[8px] font-bold shrink-0">
                                      {beacon.start_date}
                                    </span>
                                  </div>
                                  <span className="text-[8.5px] uppercase text-zinc-555 block leading-none">
                                    GIG SCHEDULE TARGET REGION
                                  </span>
                                </div>

                                <div className="space-y-1.5 border-t border-zinc-900/60 pt-2">
                                  {matchingTalents.length === 0 ? (
                                    <span className="text-[9px] text-zinc-650 block italic">
                                      -- No network support matches --
                                    </span>
                                  ) : (
                                    matchingTalents.map((match, idx) => (
                                      <div
                                        key={`${match.id}-${idx}`}
                                        className="flex items-center justify-between text-[10px] gap-1.5"
                                      >
                                        <span className="text-emerald-400/90 font-medium truncate max-w-[110px] uppercase">
                                          ● {match.name}
                                        </span>
                                        <div className="flex items-center gap-1.5 shrink-0 select-none">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedDrawerTab("specs");
                                              setSelectedDrawerTalent(match);
                                            }}
                                            className="text-[7.5px] bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 px-1.5 py-0.5 uppercase cursor-pointer rounded"
                                          >
                                            Specs
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => openHireModal(match)}
                                            className="text-[7.5px] bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-800 px-1.5 py-0.5 uppercase font-extrabold cursor-pointer rounded"
                                          >
                                            Book
                                          </button>
                                        </div>
                                      </div>
                                    ))
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 3: GIG RFP BULLETIN BOARD (REVERSE AUCTION) */}
            {activeTab === "rfp-bulletin" && (
              <div className="space-y-6 animate-fade-in font-mono text-left">
                {/* EXPLANATORY HEADER BANNER */}
                <div className="bg-[#05070a] border border-zinc-900 p-5 space-y-3 relative overflow-hidden flex flex-col items-center justify-center text-center">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/[0.02] rounded-full blur-2xl pointer-events-none" />
                  <div className="flex items-center gap-2 text-amber-400 justify-center">
                    <Layers className="w-5 h-5 animate-pulse" />
                    <h2
                      style={{ fontSize: "13px" }}
                      className="font-black uppercase tracking-widest text-white"
                    >
                      [ REVERSE AUCTION BULLETIN ]
                    </h2>
                  </div>
                  <p
                    style={{ textAlign: "center" }}
                    className="text-[11px] text-zinc-400 leading-relaxed font-sans max-w-2xl mx-auto text-center"
                  >
                    Skip the directory search. Post your project parameters
                    directly to the global network feed. Registered creators
                    can submit immediate layout sketches and pricing pitches for
                    your review.
                  </p>

                  <button
                    onClick={() => setShowRfpForm(!showRfpForm)}
                    className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs px-4 py-2.5 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_3px_10px_rgba(245,158,11,0.2)] border border-black"
                  >
                    {showRfpForm
                      ? "[ CLOSE SUBMISSION FORM ]"
                      : "[ + POST A JOB OPENING ]"}
                  </button>
                </div>

                {/* RFP CREATION FORM */}
                {showRfpForm && (
                  <form
                    onSubmit={handleCreateRfp}
                    className="bg-zinc-950 border border-zinc-900 p-5 space-y-4 text-xs animate-slide-up"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                      <span className="text-[10px] uppercase text-zinc-400 font-bold block">
                        🛠️ NEW CREATIVE DEMAND SPEC_CARD
                      </span>
                      <span className="text-[9px] text-[#00ffcc]">
                        AUTOMATED MATCHMAKING ENABLED
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 text-left">
                        <label className="text-[9px] uppercase tracking-wider text-zinc-550 block text-left font-bold">
                          RFP Project Title *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tape Cover Layout needed for demo release"
                          value={newRfpTitle}
                          onChange={(e) => setNewRfpTitle(e.target.value)}
                          className="w-full bg-black border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] uppercase tracking-wider text-zinc-550 block text-left font-bold">
                          Direct Specialized Specialty Category *
                        </label>
                        <select
                          value={newRfpCategory}
                          onChange={(e) =>
                             setNewRfpCategory(e.target.value as any)
                          }
                          className="w-full bg-black border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 focus:outline-none uppercase font-mono tracking-wide"
                        >
                          <option value="visual">
                            VISUAL ART & PRINT DESIGN
                          </option>
                          <option value="audio">
                            AUDIO STEMS / MIX & MASTERING
                          </option>
                          <option value="media">
                            MEDIA FILMING / MULTICAM RECAPS
                          </option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1 text-left">
                        <label className="text-[9px] uppercase tracking-wider text-zinc-550 block text-left font-bold">
                          Flat Fee Locked Payout ($ USD) *
                        </label>
                        <input
                          type="number"
                          required
                          min={50}
                          placeholder="250"
                          value={newRfpBudget}
                          onChange={(e) =>
                            setNewRfpBudget(Number(e.target.value))
                          }
                          className="w-full bg-black border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1 text-left">
                        <label className="text-[9px] uppercase tracking-wider text-zinc-550 block text-left font-bold">
                          Delivery Deadline *
                        </label>
                        <input
                          type="date"
                          required
                          value={newRfpDeliveryBy}
                          onChange={(e) => setNewRfpDeliveryBy(e.target.value)}
                          className="w-full bg-black border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1 text-left">
                      <label className="text-[9px] uppercase tracking-wider text-zinc-550 block text-left font-bold">
                        Technical Details description (Deliverables, size
                        specifications, stems length, reference links) *
                      </label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Detail exactly what file sizes, stem layers, cassette replication balancing or tape folds files you expect independent specialist to pitch against..."
                        value={newRfpDesc}
                        onChange={(e) => setNewRfpDesc(e.target.value)}
                        className="w-full bg-black border border-zinc-800 focus:border-amber-500 text-white text-xs p-2.5 focus:outline-none font-mono"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs py-3.5 transition-all text-center tracking-widest cursor-pointer shadow-lg active:scale-95 border border-black"
                    >
                      🚀 DEPLOY ACTIVE BULLETIN PAYOUT AUCTION
                    </button>
                  </form>
                )}

                {/* BULLETIN BOARD FEED */}
                {rfps.length === 0 ? (
                  <div className="py-20 border border-dashed border-zinc-900 text-center bg-zinc-950/45 space-y-2">
                    <span className="text-zinc-500 text-xs font-black block tracking-widest uppercase">
                      [ BULLETIN VACANT ]
                    </span>
                    <p className="text-[10.5px] text-zinc-650 font-sans max-w-md mx-auto text-center">
                      All demands have either been resolved or finalized. Launch
                      a new reverse auction creative need above to begin
                      matching.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {rfps.map((rfp, idx) => (
                      <div
                        key={`${rfp.id}-${idx}`}
                        className="bg-zinc-950 border border-zinc-900 p-6 md:p-8 space-y-6 relative overflow-hidden rounded-2xl text-center flex flex-col items-center justify-center animate-slide-up"
                      >
                        {/* Subtle top brand glow accent */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent blur-[1px]" />

                        {/* DYNAMIC CENTERED BADGES GROUP */}
                        <div className="flex flex-wrap items-center justify-center gap-2.5">
                          <span
                            className={`text-[9px] font-black tracking-wider px-3 py-1 border uppercase select-none rounded-full ${
                              rfp.category === "visual"
                                ? "bg-fuchsia-950/40 border-fuchsia-800/60 text-fuchsia-400"
                                : rfp.category === "audio"
                                  ? "bg-emerald-950/40 border-emerald-800/60 text-emerald-400"
                                  : "bg-cyan-950/40 border-cyan-800/60 text-cyan-400"
                            }`}
                          >
                            {rfp.category === "audio" ? "audio specialist" : `${rfp.category} specialist`}
                          </span>
                          <span className="bg-amber-950/30 border border-amber-600/40 text-amber-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                            ${rfp.budget} payout
                          </span>
                          <span className="bg-zinc-900 border border-zinc-800 text-zinc-400 text-[10px] font-mono font-bold px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1.5">
                            <Eye className="w-3.5 h-3.5 text-zinc-500" />
                            {rfp.views || 0} views
                          </span>
                        </div>

                        {/* PROJECT TITLE & META */}
                        <div className="space-y-2 max-w-2xl text-center">
                          <h3 className="text-sm md:text-base font-black text-white uppercase tracking-widest text-center">
                            {rfp.title}
                          </h3>
                          <div className="text-[10px] text-zinc-500 uppercase tracking-wider flex flex-wrap items-center justify-center gap-1.5 md:gap-2">
                            <span>Posted by:</span>
                            <span className="text-zinc-350 font-bold">
                              {rfp.band_name}
                            </span>
                            <span className="text-zinc-700 select-none">•</span>
                            <span>Required delivery:</span>
                            <span className="text-amber-500/90 font-bold">
                              {rfp.delivery_by}
                            </span>
                          </div>
                        </div>

                        <p className="text-xs text-zinc-300 font-sans leading-relaxed max-w-2xl text-center">
                          {rfp.description}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* VIEW 2: ACTIVE CONTRACTS & WORKSPACE TRACKING */}
            {activeTab === "contracts" && (
              <div className="w-full animate-fade-in">
                {contracts.length === 0 ? (
                  <div className="py-24 border-y border-dashed border-zinc-900 text-center bg-zinc-950/45 space-y-2 max-w-5xl mx-auto">
                    <span className="text-zinc-500 text-xs font-black block tracking-widest uppercase">
                      [ STATUS: NO LIVE FREELANCE PIPELINES RUNNING ]
                    </span>
                    <p className="text-[10.5px] text-zinc-650 font-sans max-w-md mx-auto">
                      Initiate direct contract agreements with graphic assets
                      designers, stem mastering, or videography specialists to
                      track real-time delivery verification.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-0 divide-y divide-zinc-900 w-full max-w-5xl mx-auto">
                    {contracts.map((contract, idx) => {
                      const allEnforcedTested = Object.keys(
                        contract.enforced_protocols || {},
                      ).filter(
                        (key) => contract.enforced_protocols[key] === true,
                      );
                      const missingPendingNum = allEnforcedTested.filter(
                        (k) => !contract.verified_protocols?.[k],
                      ).length;

                      const isRental = (contract as any).isRental;
                      const rentalDetails = (contract as any).rental_details;

                      if (isRental && rentalDetails) {
                        return (
                          <div
                            key={`rental-contract-${contract.id}-${idx}`}
                            className="bg-[#030406] py-10 px-5 w-full space-y-6 relative overflow-hidden flex flex-col items-center border-t-2 border-dashed border-[#39ff14]"
                          >
                            {/* Header */}
                            <div className="space-y-3 text-center w-full border-[1.4px] border-[#ffcc00] p-4 max-w-2xl mx-auto">
                              <h3 className="text-xl md:text-2xl font-black text-white hover:text-violet-300 transition-colors uppercase tracking-widest flex items-center justify-center flex-wrap gap-2">
                                <span>📦 {contract.project_title.replace(/^RFP:\s*/i, '').replace(/\s*\(Ref:.*?\)/i, '')}</span>
                              </h3>
                              <div className="text-sm text-zinc-400 uppercase font-mono space-y-1.5 flex flex-col items-center">
                                <div>
                                  <span>Owner/Creative: </span>
                                  <strong className="text-zinc-200">
                                    {contract.creative_name}
                                  </strong>
                                </div>
                                <div>
                                  <span>Timeline: </span>
                                  <strong className="text-violet-300 font-black">
                                    {rentalDetails.days} DAYS DRY-HIRE
                                  </strong>
                                </div>
                              </div>
                            </div>

                            {/* Active stats */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-black/40 border border-zinc-900 p-3 rounded-lg font-mono text-[9.5px]">
                              <div>
                                <span className="text-zinc-500 uppercase block mb-0.5">
                                  Daily Rate
                                </span>
                                <strong className="text-white font-extrabold">
                                  ${rentalDetails.daily_rate}/day
                                </strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase block mb-0.5">
                                  Duration
                                </span>
                                <strong className="text-white font-extrabold">
                                  {rentalDetails.days} Days
                                </strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase block mb-0.5">
                                  Security Deposit
                                </span>
                                <strong className="text-amber-400 font-extrabold">
                                  ${rentalDetails.security_deposit} (Refundable)
                                </strong>
                              </div>
                              <div>
                                <span className="text-zinc-500 uppercase block mb-0.5">
                                  Insurance Status
                                </span>
                                <strong
                                  className={`font-extrabold ${rentalDetails.insurance_active ? "text-emerald-400" : "text-zinc-500"}`}
                                >
                                  {rentalDetails.insurance_active
                                    ? "ACTIVE"
                                    : "NONE"}
                                </strong>
                              </div>
                            </div>

                            {/* Logistics & Security report */}
                            <div className="border border-zinc-900 bg-black/60 p-4 space-y-3 font-mono text-left">
                              <span className="text-[8.5px] font-black text-violet-400 uppercase tracking-widest block">
                                📋 LOGISTICS CONFIGURATIONS & INSPECTION CODES
                              </span>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-zinc-400">
                                <div className="space-y-1">
                                  <span className="text-zinc-650 font-bold block uppercase text-[8px]">
                                    Arranged Handover Protocol
                                  </span>
                                  <span className="text-zinc-300">
                                    {rentalDetails.logistics_type}
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <span className="text-zinc-650 font-bold block uppercase text-[8px]">
                                    Standard Equipment Protection
                                  </span>
                                  <span className="text-zinc-300">
                                    {rentalDetails.insurance_active
                                      ? "Nexus Secure Comprehensive Physical Damage Insurance ($15/day)"
                                      : "General Liability Waiver Contract (Non-insured active)"}
                                  </span>
                                </div>
                              </div>

                              <div className="border-t border-zinc-900 pt-3 space-y-2">
                                <span className="text-zinc-650 text-[8px] font-black uppercase tracking-wider block">
                                  Inspections & Clearance Checklist Template:
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[9px] uppercase font-bold text-zinc-400">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-400">✔</span>{" "}
                                    Casting / Frame check
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-400">✔</span>{" "}
                                    Optics & Signal clarity
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-emerald-400">✔</span>{" "}
                                    Power Cycles matched
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Actions / Release */}
                            {contract.status === "production" ? (
                              <div className="space-y-3 pt-2 text-left">
                                <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                                  Once the equipment is returned safely
                                  following use, authorize the return to
                                  disburse direct rental fees and automatically
                                  release the security hold back to your band
                                  balance:
                                </p>
                                <button
                                  onClick={() => {
                                    const updated = contracts.map((c) => {
                                      if (c.id === contract.id) {
                                        return {
                                          ...c,
                                          status: "released" as const,
                                        };
                                      }
                                      return c;
                                    });
                                    saveContracts(updated);
                                    if (triggerNotification) {
                                      triggerNotification(
                                        "📦 Return processed! Security deposit released successfully.",
                                      );
                                    }
                                    if (addLog) {
                                      addLog(
                                        `Authorized equipment return for "${rentalDetails.gear_item}". Released security hold of $${rentalDetails.security_deposit} back to coordinator.`,
                                      );
                                    }
                                  }}
                                  className="w-full bg-[#ffcc00] hover:bg-[#ffe055] text-black font-black uppercase text-[10px] tracking-widest py-3 px-4 transition-all flex items-center justify-center gap-2 border border-black shadow-[0_4px_12px_rgba(255,204,0,0.15)] cursor-pointer rounded"
                                >
                                  <span>
                                    ✓ RETURN GEAR & RELEASE SECURITY DEPOSIT
                                    HOLD (${rentalDetails.security_deposit})
                                  </span>
                                </button>
                              </div>
                            ) : (
                              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded text-emerald-400 text-[10.5px] leading-relaxed font-sans text-left">
                                <strong>✓ CLOSED TRANSACTION:</strong> Equipment
                                returned in full, verified with clearance
                                protocols, and security deposit of{" "}
                                <strong>
                                  ${rentalDetails.security_deposit}
                                </strong>{" "}
                                successfully returned to the band coordinator
                                balance.
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${contract.id}-${idx}`}
                          className="bg-[#030406] py-10 px-5 w-full space-y-6 relative overflow-hidden flex flex-col items-center border-t-2 border-dashed border-[#39ff14]"
                        >
                          {/* HEADER */}
                          <div className="space-y-3 text-center w-full border-[1.4px] border-[#ffcc00] p-4 max-w-2xl mx-auto">
                            <h3 className="text-xl md:text-2xl font-black text-white hover:text-violet-300 transition-colors uppercase tracking-widest flex items-center justify-center flex-wrap gap-2 text-center">
                              <span>{contract.project_title.replace(/^RFP:\s*/i, '').replace(/\s*\(Ref:.*?\)/i, '')}</span>
                              {(contract as any).service_tier && (
                                <span className="text-[10px] bg-violet-600/30 border border-violet-500/40 text-violet-300 px-2 py-1 rounded uppercase font-black font-mono tracking-widest shrink-0">
                                  {(contract as any).service_tier}
                                </span>
                              )}
                            </h3>
                            <div className="text-sm text-zinc-400 uppercase font-mono mt-2 space-y-1.5 flex flex-col items-center">
                              <div>
                                <span>Specialist: </span>
                                <strong className="text-zinc-200">
                                  {contract.creative_name}
                                </strong>
                              </div>
                              <div>
                                <span>Payout Value: </span>
                                <strong className="text-[#00ffcc] font-black tracking-widest text-lg">
                                  ${contract.fee.toFixed(2)}
                                </strong>
                              </div>
                            </div>
                          </div>

                          {/* PROGRESS LINE */}
                          <div className="bg-black/80 border border-zinc-900 p-3.5 flex flex-wrap items-center justify-center text-[10px] gap-3 font-mono">
                            <span
                              className={`flex items-center tracking-widest ${
                                contract.status !== "released"
                                  ? "text-zinc-300 font-black"
                                  : "text-zinc-650"
                              }`}
                            >
                              [ ✓ LOCKED ]
                            </span>

                            <span className="text-zinc-800">──►</span>

                            <span
                              className={`flex items-center tracking-widest ${
                                contract.status === "production"
                                  ? "text-violet-500 font-black animate-pulse"
                                  : contract.status !== "released"
                                    ? "text-zinc-650"
                                    : "text-zinc-650"
                              }`}
                            >
                              [ IN PRODUCTION ]
                            </span>

                            <span className="text-zinc-800">──►</span>

                            <span
                              className={`flex items-center tracking-widest ${
                                contract.status === "verified"
                                  ? "text-violet-500 font-black px-1"
                                  : "text-zinc-650"
                              }`}
                            >
                              [ VERIFIED ]
                            </span>

                            <span className="text-zinc-800">──►</span>

                            <span
                              className={`flex items-center tracking-widest ${
                                contract.status === "released"
                                  ? "text-violet-500 font-extrabold"
                                  : "text-zinc-650"
                              }`}
                            >
                              [ FINALIZED & PAID ]
                            </span>
                          </div>

                          {/* 3. MULTI-STAGE PAYOUT MILESTONES REVIEW ACCORDION */}
                          {contract.useMilestones && contract.milestones && (
                            <div className="w-full max-w-2xl mx-auto border border-zinc-900 bg-[#06080b] p-4 space-y-3 font-mono text-left">
                              <span className="text-[9px] uppercase text-amber-500 font-extrabold tracking-widest flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5 text-amber-400" />{" "}
                                PROGRESSIVE PAYOUT MILESTONES (3-PHASES)
                              </span>

                              <div className="space-y-2.5 pt-1">
                                {contract.milestones.map((milestone, mIdx) => {
                                  const isReleased =
                                    milestone.status === "released";

                                  // Can only release if prior milestones are released Sequential check
                                  const canRelease =
                                    !isReleased &&
                                    (mIdx === 0 ||
                                      contract.milestones![mIdx - 1].status ===
                                        "released") &&
                                    contract.status !== "released";

                                  return (
                                    <div
                                      key={`${milestone.id}-${mIdx}`}
                                      className="bg-black border border-zinc-900/60 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                                    >
                                      <div className="space-y-1 text-left">
                                        <div className="flex items-center gap-2 text-left">
                                          <span
                                            className={`w-2 h-2 rounded-full ${isReleased ? "bg-emerald-500" : "bg-amber-500 animate-pulse"}`}
                                          />
                                          <span
                                            className={`font-black uppercase text-left ${isReleased ? "line-through text-zinc-500" : "text-white"}`}
                                          >
                                            {milestone.title} (
                                            {milestone.percent}%)
                                          </span>
                                        </div>
                                        <p className="text-[9.5px] text-zinc-500 leading-none">
                                          Stage payment portion:{" "}
                                          <strong className="text-[#00ffcc] font-bold">
                                            ${milestone.amount.toFixed(2)}
                                          </strong>
                                        </p>
                                      </div>

                                      <div>
                                        {isReleased ? (
                                          <span className="text-[8.5px] bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 px-2.5 py-1 uppercase font-black tracking-wider select-none">
                                            ✓ DISBURSED OUT OF PAYOUT
                                          </span>
                                        ) : canRelease ? (
                                          <button
                                            onClick={() =>
                                              handleReleaseMilestone(
                                                contract.id,
                                                milestone.id,
                                              )
                                            }
                                            className="bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[8.5px] tracking-widest px-3 py-1.5 transition-all cursor-pointer border border-black shadow-[0_2px_5px_rgba(245,158,11,0.2)]"
                                          >
                                            [ DISBURSE $
                                            {milestone.amount.toFixed(2)}{" "}
                                            PORTION ]
                                          </button>
                                        ) : (
                                          <span className="text-[8.5px] text-zinc-605 uppercase font-black tracking-widest bg-zinc-950 border border-zinc-900/80 px-2.5 py-1">
                                            Locked sequential step
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* THE DYNAMIC PROTOCOL GATEWAY CONTAINER */}
                          <div className="space-y-3.5 pt-3.5 border-t border-zinc-900 w-full text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                              <span className="text-[10px] text-zinc-500 uppercase font-mono">
                                STATUS:{" "}
                                {missingPendingNum === 0
                                  ? "ALL CLEAR"
                                  : `${missingPendingNum} OUTSTANDING`}
                              </span>
                            </div>

                            {/* PROTOCOL CHECKLIST ITEMS SIMULATION PREVIEW (Toggling them triggers validation flow) */}
                            {contract.status === "released" ? (
                              <div className="p-3 bg-zinc-950 border border-emerald-950/50 text-emerald-400/90 text-[11px] leading-relaxed max-w-2xl mx-auto text-center">
                                [ AUTHORIZED RELEASE ] All strict merchant
                                parameters were successfully met. Payout fully
                                released to {contract.creative_name}&apos;s
                                directory wallet successfully via transaction
                                hash NC-{contract.id.toUpperCase()}.
                              </div>
                            ) : (
                              <div className="space-y-4 w-full">
                                <h4 className="text-[10px] text-zinc-500 font-black tracking-widest text-center uppercase">
                                  ── MANDATORY CHECKLIST VERIFICATION ──
                                </h4>

                                <CreativeWorkspaceProtocols
                                  workerCategory={contract.creative_category}
                                  activeProtocols={contract.enforced_protocols}
                                  isEditableByBand={false}
                                  onAllCompletedChange={(isCompleted) => {
                                    // Update state maps
                                    const nextVerified = {
                                      ...contract.verified_protocols,
                                    };
                                    // Make sure we update verified states for the enabled keys
                                    Object.keys(
                                      contract.enforced_protocols,
                                    ).forEach((key) => {
                                      if (
                                        contract.enforced_protocols[key] ===
                                        true
                                      ) {
                                        nextVerified[key] = isCompleted;
                                      }
                                    });
                                    handleUpdateVerifiedProtocols(
                                      contract.id,
                                      nextVerified,
                                    );
                                  }}
                                />

                                {/* THE FINAL HANDSHAKE TRIGGER ACTION BUTTON FOR THE BAND */}
                                {contract.status === "verified" && !contract.useMilestones &&
                                  (() => {
                                    const grossAmount = contract.fee;
                                    const platformFee = +(
                                      grossAmount * 0.0777
                                    ).toFixed(2);
                                    const netPayout = +(
                                      grossAmount - platformFee
                                    ).toFixed(2);

                                    return (
                                      <div className="pt-4 max-w-2xl mx-auto w-full">
                                        {/* DYNAMIC BILLING MATRIX */}
                                        <div className="bg-[#050608] border border-zinc-900 p-4 mb-4 space-y-3 mt-2 text-xs font-mono w-full">
                                          <div className="flex justify-between items-center text-zinc-400">
                                            <span>Gross Contract Total</span>
                                            <span>
                                              ${grossAmount.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-amber-500/80">
                                            <span>
                                              Secure Platform Fee (7.77%)
                                            </span>
                                            <span>
                                              -${platformFee.toFixed(2)}
                                            </span>
                                          </div>
                                          <div className="flex justify-between items-center text-zinc-300 font-bold border-t border-zinc-900/80 pt-3 mt-2">
                                            <span>Freelancer Net Payout</span>
                                            <span className="text-[#00ffcc]">
                                              ${netPayout.toFixed(2)}
                                            </span>
                                          </div>
                                        </div>

                                        <button
                                          onClick={() =>
                                            handleAuthorizeRelease(contract.id)
                                          }
                                          className="w-full bg-[#00ffcc] hover:bg-[#33ffdb] text-black font-black uppercase text-[12px] tracking-widest py-5 px-3 transition-all flex flex-col items-center justify-center gap-1 rounded-none border border-black cursor-pointer shadow-[0_0_15px_rgba(0,255,204,0.15)] active:scale-[0.98]"
                                        >
                                          <span>
                                            --&gt; [ VERIFY METRICS & RELEASE
                                            PAYOUT ]
                                          </span>
                                          <span className="opacity-75 tracking-normal text-[10px]">
                                            NET PAYOUT: ${netPayout.toFixed(2)}
                                          </span>
                                        </button>
                                      </div>
                                    );
                                  })()}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* HIRING CONTRACT CREATION MODAL */}
      {hiringCreative && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border-2 border-zinc-800 p-6 max-w-xl w-full space-y-5 font-mono overflow-y-auto max-h-[90vh]">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2 text-violet-400">
                <Briefcase className="w-5 h-5 animate-pulse" />
                <span className="text-sm font-black uppercase tracking-widest text-white">
                  [ CONFIGURE DIRECT HIRE CONTRACT ]
                </span>
              </div>
              <button
                onClick={() => setHiringCreative(null)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* CREATIVE PROFILE CARD INFO */}
            <div className="p-3.5 bg-zinc-950 border border-zinc-900 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-white font-black uppercase tracking-wide">
                  {hiringCreative.name}
                </span>
                <span className="text-zinc-500 uppercase text-[10px]">
                  {hiringCreative.categoryLabel}
                </span>
              </div>
              <p className="text-[10.5px] text-zinc-400 leading-normal font-sans">
                {hiringCreative.bio}
              </p>
              <div className="text-[9.5px] text-zinc-500 font-mono">
                BASE WORKREGION: {hiringCreative.location}
              </div>
            </div>

            {/* FORM INPUTS */}
            <div className="space-y-4 pt-1">
              {/* SERVICE TIERS CARD SELECTOR */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
                    Choose Pre-Packaged Service Tier Bounds
                  </label>
                  <span className="text-[8px] tracking-widest text-[#00ffcc] font-mono uppercase bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 font-bold">
                    PRESETS
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {getTalentServiceTiers(
                    hiringCreative.id,
                    hiringCreative.category,
                  ).map((tier: any, idx) => {
                    const isSelected = selectedTierIdInModal === tier.id;
                    return (
                      <div
                        key={`${tier.id}-${idx}`}
                        onClick={() => {
                          setSelectedTierIdInModal(tier.id);
                          const parsedPrice =
                            parseInt(tier.price.replace(/[^0-9]/g, ""), 10) ||
                            350;
                          setNewProjectTitle(
                            `${activeBandName} // ${tier.name.toUpperCase()}`,
                          );
                          setNewProjectFee(parsedPrice);
                          setNewProjectTimeline(
                            tier.id === "pro"
                              ? 30
                              : tier.id === "premium"
                                ? 5
                                : 10,
                          );
                          if (triggerNotification) {
                            triggerNotification(
                              `Preset adjusted: "${tier.name}" preloaded!`,
                            );
                          }
                        }}
                        className={`border p-3 rounded-xl flex flex-col justify-between transition-all cursor-pointer group select-none text-left ${
                          isSelected
                            ? "border-violet-500 bg-violet-950/20 hover:border-violet-500/70 shadow-[0_4px_15px_rgba(139,92,246,0.15)] relative overflow-hidden"
                            : "border-zinc-900 bg-zinc-950/90 hover:border-zinc-700"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute -top-6 -right-6 w-16 h-16 bg-violet-500/25 blur-xl rounded-full pointer-events-none" />
                        )}
                        <div className="relative z-10 w-full h-full flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start gap-1 pb-1">
                              <h4 className="text-[9.5px] font-black text-white uppercase group-hover:text-violet-300 transition-colors truncate">
                                {tier.name}
                              </h4>
                              {isSelected && (
                                <span className="text-[6.5px] bg-violet-600/30 border border-violet-500/40 text-violet-300 px-1 py-0.5 rounded uppercase font-black font-mono shrink-0">
                                  Selected
                                </span>
                              )}
                            </div>
                            <span className="text-sm font-bold text-[#00ffcc] block my-0.5">
                              {tier.price}
                            </span>
                            <p className="text-[8.5px] text-zinc-400 leading-normal line-clamp-3 font-sans pr-1">
                              {tier.desc}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Project Title */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
                  Project Deliverable Designation label *
                </label>
                <input
                  type="text"
                  value={newProjectTitle}
                  onChange={(e) => setNewProjectTitle(e.target.value)}
                  className="w-full bg-black border border-zinc-800 focus:border-violet-500 p-3 text-xs text-white uppercase font-mono focus:outline-none"
                  placeholder="e.g. VENOMOUS STENCIL MERCH DESIGN"
                />
              </div>

              {/* Fee & Timeline Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
                    Locked flat fee ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      value={newProjectFee}
                      onChange={(e) =>
                        setNewProjectFee(Math.max(1, Number(e.target.value)))
                      }
                      className="w-full bg-black border border-zinc-800 focus:border-violet-500 pl-8 pr-3 py-3 text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide block">
                    Contract Delivery Duration (Days)
                  </label>
                  <input
                    type="number"
                    value={newProjectTimeline}
                    onChange={(e) =>
                      setNewProjectTimeline(Math.max(1, Number(e.target.value)))
                    }
                    className="w-full bg-black border border-zinc-800 focus:border-violet-500 p-3 text-xs text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* USE MILESTONES PROGRESSIVE PROTOCOL PAYOUT TOGGLE */}
              <div className="bg-zinc-950 p-4 border border-zinc-900 rounded-none space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5 text-left">
                    <span className="text-[11px] font-black text-white uppercase tracking-wider block">
                      [ PROGRESSIVE PAYOUT MILESTONES ]
                    </span>
                    <span className="text-[9.5px] text-zinc-550 font-sans block max-w-sm">
                      Split the flat fee into 3 progressive payout phases (35% / 35% / 30%). If disabled, funds will be held in escrow until project completion for a single lump sum payout.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseMilestonePayout(!useMilestonePayout)}
                    className={`w-12 h-6 rounded-full transition-all duration-300 relative focus:outline-none cursor-pointer border ${
                      useMilestonePayout
                        ? "bg-violet-600 border-violet-500"
                        : "bg-black border-zinc-700"
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full transition-all duration-300 ${
                        useMilestonePayout ? "left-6.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                {useMilestonePayout && (
                  <div className="pt-2 border-t border-zinc-900/60 grid grid-cols-3 gap-2 text-[9.5px] font-mono text-zinc-400">
                    <div className="bg-black/60 p-2 border border-zinc-900">
                      <span className="text-violet-400 font-bold block">
                        1. KICKOFF (35%)
                      </span>
                      <span>${(newProjectFee * 0.35).toFixed(2)}</span>
                    </div>
                    <div className="bg-black/60 p-2 border border-zinc-900">
                      <span className="text-violet-400 font-bold block">
                        2. MIDWAY (35%)
                      </span>
                      <span>${(newProjectFee * 0.35).toFixed(2)}</span>
                    </div>
                    <div className="bg-black/60 p-2 border border-zinc-900">
                      <span className="text-violet-400 font-bold block">
                        3. DELIVERY (30%)
                      </span>
                      <span>${(newProjectFee * 0.3).toFixed(2)}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Protocol Setup Selector integration */}
              <div className="space-y-2.5 pt-2">
                <label className="text-[11px] font-black text-white uppercase tracking-wider block">
                  [ MANDATORY QUALITY ENFORCEMENT PROTOCOLS ]
                </label>
                <p className="text-[10px] text-zinc-500 leading-normal font-sans">
                  The specialist will be presented with these exact mechanical
                  verification boxes. Payout funds will remain locked until all
                  checked items pass system clearance:
                </p>

                <CreativeWorkspaceProtocols
                  workerCategory={hiringCreative.category}
                  activeProtocols={newProjectProtocols}
                  isEditableByBand={true}
                  onProtocolsChange={(nextProtocols) => {
                    setNewProjectProtocols(nextProtocols);
                  }}
                />
              </div>

              {/* BILLING MATRIX */}
              {(() => {
                const grossAmount = newProjectFee;
                const platformFee = +(grossAmount * 0.0475).toFixed(2);
                const netPayout = +(grossAmount - platformFee).toFixed(2);
                return (
                  <>
                    <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-3 mt-4">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-zinc-400 uppercase tracking-wide">
                          Gross Contract Total
                        </span>
                        <span className="text-white font-mono">
                          ${grossAmount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs text-amber-500/80">
                        <span className="uppercase tracking-wide">
                          Secure Platform Fee (4.75%)
                        </span>
                        <span className="font-mono">
                          -${platformFee.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-sm border-t border-zinc-800 pt-3">
                        <span className="text-zinc-300 font-bold uppercase tracking-wide">
                          Freelancer Net Payout
                        </span>
                        <span className="text-[#00ffcc] font-black font-mono">
                          ${netPayout.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="bg-black border border-dashed border-zinc-700 p-3 mt-2 text-center">
                      <span className="text-[9.5px] text-zinc-500 font-mono tracking-widest uppercase">
                        [ NEXUS CORE SECURE GATEWAY: A 4.75% TRANSACTION
                        INFRASTRUCTURE FEE IS APPLIED UPON SUCCESSFUL PAYOUT
                        RELEASE. ZERO UPFRONT CHARGES ENFORCED. ]
                      </span>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* ACTION DISPATCH BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pt-4 border-t border-zinc-902">
              <button
                onClick={() => setHiringCreative(null)}
                className="w-full py-3.5 px-4 text-xs font-bold transition-all border border-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider cursor-pointer text-center hover:bg-zinc-950"
              >
                [ ABORT CONTRACT ]
              </button>

              <button
                disabled={submitting}
                onClick={handleCreateContract}
                className="w-full py-3.5 px-4 text-xs font-black transition-all bg-gradient-to-r from-violet-900 to-violet-600 hover:from-violet-800 hover:to-violet-500 text-white border border-violet-500 uppercase tracking-wider cursor-pointer text-center select-none flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  "--> [ COSIGN & LOCK PAYOUT ]"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DRY-HIRE STANDALONE RENTAL MODAL */}
      {rentingCreative && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border-2 border-zinc-800 p-6 max-w-xl w-full space-y-5 font-mono overflow-y-auto max-h-[90vh] rounded-xl shadow-[0_0_50px_rgba(139,92,246,0.15)]">
            {/* MODAL HEADER */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
              <div className="flex items-center gap-2 text-violet-400">
                <Box className="w-5 h-5 animate-pulse text-violet-400" />
                <span className="text-sm font-black uppercase tracking-widest text-white">
                  [ CONFIGURE STANDALONE DRY-HIRE ]
                </span>
              </div>
              <button
                onClick={() => setRentingCreative(null)}
                className="text-zinc-500 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* GEAR DESCRIPTION */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#00ffcc] uppercase tracking-widest block">
                SELECTED HIGH-END SPECIFICATION:
              </span>
              <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 text-[8px] bg-violet-950 font-bold text-violet-300 uppercase">
                  Pro Class Rental
                </div>
                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center gap-1.5 text-left">
                  <span>🎥 {rentingGearItem}</span>
                </h4>
                <p className="text-[11px] text-zinc-500 leading-normal font-sans text-left">
                  Supplied directly by{" "}
                  <strong className="text-zinc-300">
                    {rentingCreative.name}
                  </strong>{" "}
                  out of{" "}
                  <span className="text-[#00ffcc]">
                    {rentingCreative.location}
                  </span>
                  . This equipment was cleared and calibrated by certified
                  specialist diagnostics prior to listing.
                </p>
              </div>
            </div>

            {/* RENTAL TIME DESIGN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-black text-zinc-400 mb-1.5 block text-left">
                  DRY-HIRE LEASE PERIOD
                </label>
                <div className="flex items-center justify-between bg-zinc-950 border border-zinc-900 p-2.5 rounded-xl">
                  <button
                    type="button"
                    onClick={() =>
                      setRentalDays((prev) => Math.max(1, prev - 1))
                    }
                    className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 rounded text-sm font-bold text-white transition cursor-pointer"
                  >
                    -
                  </button>
                  <span className="text-xs font-black text-white w-full text-center">
                    {rentalDays} Days
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setRentalDays((prev) => Math.min(30, prev + 1))
                    }
                    className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 rounded text-sm font-bold text-white transition cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-black text-zinc-400 mb-1.5 block text-left">
                  TIMELOCKED SECURITY DEPOSIT
                </label>
                <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-bold block text-left">
                    FULLY REFUNDABLE
                  </span>
                  <span className="text-xs font-black text-amber-500">
                    ${rentalDeposit}
                  </span>
                </div>
              </div>
            </div>

            {/* LOGISTICS CONFIGURATION */}
            <div className="space-y-2.5">
              <label className="text-[10px] uppercase font-black text-zinc-400 block tracking-wider text-left">
                CHOOSE COURIER OR HANDOVER LOGISTICS TEMPLATE
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRentalLogistics("handover")}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                    rentalLogistics === "handover"
                      ? "bg-violet-950/40 border-violet-500 text-white"
                      : "bg-zinc-950/60 border-zinc-900 text-zinc-400 hover-border-zinc-800"
                  }`}
                >
                  <span className="text-base">🤝</span>
                  <span className="text-[9px] uppercase font-bold tracking-tight">
                    Direct Handoff
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRentalLogistics("courier")}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                    rentalLogistics === "courier"
                      ? "bg-violet-950/40 border-violet-500 text-white"
                      : "bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800"
                  }`}
                >
                  <span className="text-base">📦</span>
                  <span className="text-[9px] uppercase font-bold tracking-tight">
                    Flightcase Express
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setRentalLogistics("locker")}
                  className={`border p-3 rounded-xl flex flex-col items-center justify-center text-center gap-1.5 transition-all cursor-pointer ${
                    rentalLogistics === "locker"
                      ? "bg-violet-950/40 border-violet-500 text-white"
                      : "bg-zinc-950/60 border-zinc-900 text-zinc-400 hover:border-zinc-800"
                  }`}
                >
                  <span className="text-base">🔐</span>
                  <span className="text-[9px] uppercase font-bold tracking-tight">
                    Studio Locker
                  </span>
                </button>
              </div>

              {/* DYNAMIC LOGISTICS DETAIL TEXT */}
              <p className="text-[9.5px] text-zinc-400 bg-[#06080b] p-2.5 border border-dashed border-zinc-800 leading-relaxed font-sans text-center rounded">
                {rentalLogistics === "courier"
                  ? "Insured Flightcase Courier shipping includes professional bubble wrapping, tracked signature confirmation, & a prepaid Return Waybill insert."
                  : rentalLogistics === "locker"
                    ? "Safe, climate-controlled locker self service pick-up/dropoff. Digital PIN codes are generated and sent immediately upon payment checkout."
                    : "Direct regional coordinate options. Perfect for handover direct on-site, pre-production soundchecks, or venue hospitality match-up."}
              </p>
            </div>

            {/* STANDALONE PLATFORM EQUIPMENT INSURANCE */}
            <div className="bg-zinc-950 border border-zinc-900 p-4 rounded-xl flex items-start gap-3">
              <input
                type="checkbox"
                id="rental-insurance-chk"
                checked={rentalInsurance}
                onChange={(e) => setRentalInsurance(e.target.checked)}
                className="w-4 h-4 rounded bg-black border-zinc-850 text-violet-600 focus:ring-0 self-center cursor-pointer"
              />
              <div className="space-y-0.5 text-left">
                <label
                  htmlFor="rental-insurance-chk"
                  className="text-[10px] font-black text-white uppercase tracking-wider block cursor-pointer select-none"
                >
                  Add Comprehensive Equipment Insurance (+ $15/day)
                </label>
                <p className="text-[9.5px] text-zinc-500 leading-normal font-sans">
                  Covers full certified damage, repair, scratch restoration, and
                  accidental drops with zero deductible. Highly recommended for
                  rugged outdoor live concert recordings.
                </p>
              </div>
            </div>

            {/* DYNAMIC BILLING MATRIX */}
            {(() => {
              const rentalSubtotal = rentalDailyRate * rentalDays;
              const insuranceCost = rentalInsurance ? 15 * rentalDays : 0;
              const platformFee = rentalSubtotal * 0.0475;
              const totalDueNow =
                rentalSubtotal + insuranceCost + rentalDeposit + platformFee;

              return (
                <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-2 rounded-xl text-xs text-left">
                  <div className="flex justify-between items-center text-zinc-450">
                    <span>
                      Standalone Dry-Hire Fee ({rentalDays} Days @ $
                      {rentalDailyRate}/day)
                    </span>
                    <span className="text-white font-mono font-bold">
                      ${rentalSubtotal.toFixed(2)}
                    </span>
                  </div>
                  {rentalInsurance && (
                    <div className="flex justify-between items-center text-zinc-450">
                      <span>Pro Equipment Insurance ($15/day)</span>
                      <span className="text-white font-mono font-bold">
                        ${insuranceCost.toFixed(2)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-zinc-450">
                    <span>Fully Refundable Security Deposit hold</span>
                    <span className="text-amber-500 font-mono font-bold">
                      ${rentalDeposit.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-zinc-500">
                    <span>Secure Platform Processing Fee (4.75%)</span>
                    <span className="font-mono font-bold">
                      ${platformFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-t border-zinc-850 pt-2 text-zinc-350 font-extrabold mt-1">
                    <span>
                      Total Payout Lock Amount (Including fully refunded
                      deposit)
                    </span>
                    <span className="text-[#00ffcc] font-black font-mono">
                      ${totalDueNow.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* SUBMIT OR CANCEL BUTTONS */}
            <div className="grid grid-cols-2 gap-3 pt-3">
              <button
                type="button"
                onClick={() => setRentingCreative(null)}
                className="w-full py-3 px-4 text-xs font-bold transition-all border border-zinc-800 text-zinc-400 hover:text-white uppercase tracking-wider cursor-pointer text-center hover:bg-zinc-950 rounded-xl"
              >
                [ ABORT LEASE ]
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleCreateRental}
                className="w-full py-3 px-4 text-xs font-black transition-all bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-550 hover:to-indigo-500 text-white border border-violet-500 uppercase tracking-widest cursor-pointer text-center select-none flex items-center justify-center gap-1.5 disabled:opacity-50 rounded-xl shadow-[0_0_15px_rgba(139,92,246,0.3)]"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  "CONFIRM LEASE"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAILED CREATIVE PROFILE SHOWCASE DRAWER */}
      {selectedDrawerTalent && (
        <div className="fixed inset-y-0 right-0 w-full sm:max-w-xl bg-[#090b0e] border-l-2 border-zinc-800 shadow-2xl z-50 flex flex-col justify-between font-mono animate-fade-in overflow-hidden">
          <div className="absolute top-0 left-0 w-48 h-48 bg-violet-600/[0.03] rounded-full blur-3xl pointer-events-none" />

          {/* DRAWER HEADER */}
          <div className="p-4 sm:p-5 border-b border-zinc-900 bg-[#06080a] flex items-center justify-between relative z-10 gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-3 min-w-0">
              {selectedDrawerTalent.avatar_url ? (
                <img
                  src={selectedDrawerTalent.avatar_url}
                  alt={selectedDrawerTalent.name}
                  className="w-10 h-10 rounded-full object-cover border border-zinc-800 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-950 flex items-center justify-center border border-violet-800 shrink-0">
                  <span className="text-sm font-bold text-violet-350">
                    {(selectedDrawerTalent.name || "C").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                  {selectedDrawerTalent.name}
                </h2>
                <span className="text-[9px] uppercase text-violet-400 font-extrabold tracking-widest block truncate">
                  {selectedDrawerTalent.categoryLabel} // digital showreel
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => toggleFollowTalent(selectedDrawerTalent.id, selectedDrawerTalent.name)}
                className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  followedTalents.includes(selectedDrawerTalent.id)
                    ? "bg-purple-950/60 border-purple-500/40 text-purple-300 hover:bg-purple-900/40"
                    : "bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-sm"
                }`}
              >
                {followedTalents.includes(selectedDrawerTalent.id) ? (
                  <>
                    <UserCheck className="w-3 h-3" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" /> Follow
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setSelectedDrawerTab("coordination")}
                className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-white transition-all cursor-pointer"
                title="Send Message"
              >
                <MessageSquare className="w-3 h-3 text-violet-400" /> Message
              </button>
              <button
                onClick={() => {
                  setSelectedDrawerTalent(null);
                  setIsPlayingAudio(false);
                }}
                className="text-zinc-500 hover:text-white transition-all bg-black border border-zinc-900 hover:border-zinc-700 p-2 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* SECURE DRAWER TABS BAR */}
          <div className="flex bg-[#06080a] border-b border-zinc-900 select-none text-[10px] relative z-10 font-mono">
            <button
              type="button"
              onClick={() => setSelectedDrawerTab("specs")}
              className={`flex-1 text-center py-3.5 font-black tracking-widest uppercase transition-all duration-200 border-b-2 cursor-pointer ${
                selectedDrawerTab === "specs"
                  ? "border-violet-500 text-white bg-zinc-950/60"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              [ ⚙️ SPECS & PORTFOLIO ]
            </button>
            <button
              type="button"
              onClick={() => setSelectedDrawerTab("coordination")}
              className={`flex-1 text-center py-3.5 font-black tracking-widest uppercase transition-all duration-200 border-b-2 cursor-pointer relative ${
                selectedDrawerTab === "coordination"
                  ? "border-violet-500 text-white bg-zinc-950/60"
                  : "border-transparent text-zinc-500 hover:text-zinc-300"
              }`}
            >
              [ 💬 SECURE MESSENGER ]
              {Object.keys(chatMessages[selectedDrawerTalent.id] || {}).length >
                2 &&
                selectedDrawerTab !== "coordination" && (
                  <span className="absolute top-2.5 right-6 w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
                )}
            </button>
          </div>

          {/* DRAWER BODY */}
          <div className="flex-1 p-5 overflow-y-auto space-y-6 relative z-10">
            {selectedDrawerTab === "specs" ? (
              <div className="space-y-6 animate-fade-in">
                {/* 1. CREATIVE PROFILE SUMMARY */}
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 mt-1">
                      <h3 className="text-xl font-black uppercase tracking-tight text-white leading-none">
                        {selectedDrawerTalent.name}
                      </h3>
                      <div className="text-[10px] text-[#00ffcc] font-mono tracking-widest uppercase">
                        {selectedDrawerTalent.categoryLabel}
                      </div>
                    </div>
                    <div className="bg-zinc-950 border border-zinc-900 px-3 py-2 text-right rounded">
                      <div className="text-[7.5px] uppercase tracking-widest text-zinc-500 mb-0.5 font-black">
                        EST. BASE RATE
                      </div>
                      <div className="text-sm font-mono font-bold text-emerald-400 tracking-tight">
                        {selectedDrawerTalent.rate_range}
                      </div>
                    </div>
                  </div>

                  <div className="text-[10.5px] font-sans text-zinc-400 leading-relaxed bg-black border border-zinc-900/80 p-3.5 rounded-lg shadow-inner">
                    <span className="text-zinc-300 font-bold mr-1.5 uppercase tracking-wide text-[10px]">
                      Bio //
                    </span>
                    {selectedDrawerTalent.bio}
                  </div>

                  <div className="space-y-2">
                    <div className="text-[8.5px] uppercase tracking-widest text-zinc-500 font-black">
                      TAGS & QUALIFICATIONS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {(selectedDrawerTalent.skills || []).map(
                        (skill: string, index: number) => (
                          <span
                            key={`creative-index-${index}`}
                            className="text-[9px] font-mono font-bold text-zinc-300 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded-[4px] uppercase tracking-wide shadow-sm"
                          >
                            {skill}
                          </span>
                        ),
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. PORTFOLIO ASSETS */}
                <div className="space-y-4 pt-5 border-t border-zinc-900">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-zinc-300 tracking-widest font-extrabold flex items-center gap-2">
                      <FolderOpen className="w-3.5 h-3.5 text-zinc-500" />
                      Portfolio Highlights
                    </span>
                    <span className="text-[7.5px] bg-violet-900/20 text-violet-400 border border-violet-900/50 px-1.5 py-0.5 uppercase tracking-widest font-black rounded shadow-[0_0_8px_rgba(168,85,247,0.15)]">
                      VERIFIED PUSH
                    </span>
                  </div>

                  {selectedDrawerTalent.category === "audio" ? (
                    <div className="space-y-2">
                      <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg flex items-center gap-3 group">
                        <button
                          onClick={() => setIsPlayingAudio(!isPlayingAudio)}
                          className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black flex items-center justify-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.25)] shrink-0 group-hover:scale-105 active:scale-95 cursor-pointer"
                        >
                          {isPlayingAudio ? (
                            <Pause className="w-5 h-5 fill-black" />
                          ) : (
                            <Play className="w-5 h-5 fill-black ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1.5">
                            <span className="text-[10.5px] text-white font-bold uppercase leading-none truncate">
                              Front of House - Live Mix Demo
                            </span>
                            <span className="text-[8px] text-zinc-500 font-mono tracking-widest">
                              WAV / 2:34
                            </span>
                          </div>
                          {/* Waveform Mock */}
                          <div className="w-full flex items-end gap-[1.5px] h-5 cursor-pointer relative overflow-hidden">
                            <div className="absolute inset-0 z-10 hover:bg-white/5 transition-colors rounded" />
                            {[...Array(45)].map((_, i) => (
                              <div
                                key={`creative-item-${i}`}
                                className={`flex-1 rounded-t transition-all duration-300 ${isPlayingAudio ? "bg-emerald-400" : "bg-zinc-700"}`}
                                style={{ height: `${Math.random() * 100}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-lg flex items-center gap-3 hover:border-zinc-800 transition-colors cursor-pointer group">
                        <button className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 group-hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer">
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] text-zinc-400 group-hover:text-white font-bold uppercase leading-none truncate transition-colors">
                              Studio Master - Stems Breakdown
                            </span>
                            <span className="text-[8px] text-zinc-600 font-mono tracking-widest">
                              WAV / 1:15
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    (() => {
                      let localGallery: any[] = [];
                      try {
                        const saved = localStorage.getItem(
                          `nexus_core_creative_gallery_${selectedDrawerTalent.id}`,
                        );
                        if (saved) {
                          const parsed = JSON.parse(saved);
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            localGallery = parsed;
                          }
                        }
                      } catch (_) {}

                      if (localGallery.length > 0) {
                        return (
                          <div className="grid grid-cols-2 gap-3 animate-fade-in">
                            {localGallery.map((item: any, idx: number) => (
                              <div
                                key={item.id ? `gal-${item.id}-${idx}` : `gal-${idx}`}
                                onClick={() =>
                                  setFullscreenLookbookItem({
                                    id: item.id || `gal-${idx}`,
                                    talent: selectedDrawerTalent,
                                    imageUrl: item.imageUrl,
                                    mediaType: item.mediaType || "image",
                                  })
                                }
                                className="aspect-square bg-zinc-950 border border-zinc-800/80 hover:border-violet-500/60 rounded-lg overflow-hidden relative group cursor-pointer shadow-lg transition-all"
                              >
                                {item.mediaType === "video" ? (
                                  <div className="w-full h-full relative">
                                    <video
                                      src={item.imageUrl}
                                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all pointer-events-none"
                                      muted
                                      playsInline
                                    />
                                    <div className="absolute top-2 left-2 bg-black/75 text-[7px] text-violet-300 px-1.5 py-0.5 rounded uppercase font-black tracking-widest font-mono">
                                      Video
                                    </div>
                                  </div>
                                ) : item.mediaType === "audio" ? (
                                  <div className="w-full h-full bg-zinc-900/40 flex items-center justify-center opacity-80 group-hover:opacity-100 transition-all">
                                    <Music className="w-7 h-7 text-violet-500/40 group-hover:scale-110 transition-transform" />
                                    <div className="absolute top-2 left-2 bg-black/75 text-[7px] text-violet-300 px-1.5 py-0.5 rounded uppercase font-black tracking-widest font-mono">
                                      Audio
                                    </div>
                                  </div>
                                ) : (
                                  <img
                                    src={item.imageUrl}
                                    alt={item.title || "Showcase Asset"}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                                  />
                                )}
                                <div className="absolute inset-x-0 bottom-0 p-2 text-left bg-gradient-to-t from-black via-black/85 to-transparent flex flex-col justify-end">
                                  <span className="text-[8.5px] text-white font-black uppercase tracking-widest truncate drop-shadow-md">
                                    {item.title || "Showcase Asset"}
                                  </span>
                                  {item.subtitle && (
                                    <span className="text-[7.5px] text-zinc-450 truncate mt-0.5">
                                      {item.subtitle}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // Default Unsplash fallbacks if they haven't uploaded images yet
                      return (
                        <div className="grid grid-cols-2 gap-3">
                          <div
                            onClick={() =>
                              setFullscreenLookbookItem({
                                id: "demo1",
                                talent: selectedDrawerTalent,
                                imageUrl:
                                  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=600",
                              })
                            }
                            className="aspect-square bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden relative group cursor-pointer shadow-lg"
                          >
                            <img
                              src="https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=300"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              <span className="text-[8.5px] text-white font-black uppercase tracking-widest truncate drop-shadow-md">
                                Live Action Capture
                              </span>
                            </div>
                          </div>
                          <div
                            onClick={() =>
                              setFullscreenLookbookItem({
                                id: "demo2",
                                talent: selectedDrawerTalent,
                                imageUrl:
                                  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=600",
                              })
                            }
                            className="aspect-square bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden relative group cursor-pointer shadow-lg"
                          >
                            <img
                              src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=300"
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col justify-end translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                              <span className="text-[8.5px] text-white font-black uppercase tracking-widest truncate drop-shadow-md">
                                Stage Atmosphere Profile
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  )}
                </div>

                {/* 2.5 PRE-PACKAGED SERVICE TIERS */}
                <div className="space-y-4 pt-5 border-t border-zinc-900">
                  <div className="flex justify-between items-center">
                    <span className="text-[9.5px] uppercase text-zinc-300 tracking-widest font-extrabold flex items-center gap-2">
                      <span className="text-violet-500">⚡</span>
                      Pre-Packaged Service Tiers
                    </span>
                    <span className="text-[8px] tracking-widest text-[#00ffcc] font-mono uppercase">
                      CLICK TO SELECT Presets
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {getTalentServiceTiers(
                      selectedDrawerTalent.id,
                      selectedDrawerTalent.category,
                    ).map((tier: any, idx) => {
                      return (
                        <div
                          key={`${tier.id}-${idx}`}
                          onClick={() => {
                            setSelectedDrawerTalent(null);
                            setIsPlayingAudio(false);
                            openHireModal(selectedDrawerTalent, tier.id);
                            if (triggerNotification) {
                              triggerNotification(
                                `Preset selected: "${tier.name}" bounds preloaded!`,
                              );
                            }
                          }}
                          className="border border-zinc-900 bg-zinc-950/60 hover:border-violet-500/50 p-3 rounded-xl flex flex-col justify-between transition-all cursor-pointer group hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden"
                        >
                          <div className="absolute -top-6 -right-6 w-12 h-12 bg-violet-600/5 group-hover:bg-violet-600/10 blur-xl rounded-full pointer-events-none" />
                          <div>
                            <h4 className="text-[9.5px] font-black text-white uppercase group-hover:text-violet-300 transition-colors">
                              {tier.name}
                            </h4>
                            <span className="text-xs font-black text-[#00ffcc] block my-1">
                              {tier.price}
                            </span>
                            <p className="text-[8.5px] text-zinc-400 leading-normal mb-3 font-sans line-clamp-3">
                              {tier.desc}
                            </p>
                          </div>
                          <div className="text-[7.5px] font-bold text-violet-400 group-hover:text-violet-300 transition-colors flex items-center gap-1 mt-1 font-mono uppercase tracking-widest">
                            Configure Tier ➜
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 3. TOUR HISTORY & BACKGROUND */}
                <div className="space-y-4 pt-5 border-t border-zinc-900">
                  <span className="text-[9.5px] uppercase text-zinc-300 tracking-widest font-extrabold flex items-center gap-2">
                    <Map className="w-3.5 h-3.5 text-zinc-500" />
                    Tour History & Background
                  </span>

                  <div className="bg-zinc-950/50 border border-zinc-900 rounded-xl p-4 space-y-5">
                    <div className="relative pl-5 w-full">
                      <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-[#00ffcc] shadow-[0_0_8px_rgba(0,255,204,0.4)]" />
                      <div className="text-[11.5px] font-black text-white uppercase tracking-tight leading-none mb-1">
                        Euro Summer Festival Circuit '25
                      </div>
                      <div className="text-[8.5px] text-[#00ffcc] font-mono tracking-widest uppercase mb-1.5">
                        Lead {selectedDrawerTalent.categoryLabel}
                      </div>
                      <div className="text-[10px] font-sans text-zinc-400 leading-relaxed">
                        Managed full stage production across 14 dates.
                        Coordinated local backline and ensured seamless
                        transitions between international fly dates.
                      </div>
                    </div>

                    <div className="relative pl-5 w-full opacity-70 hover:opacity-100 transition-opacity">
                      <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-zinc-600" />
                      <div className="text-[11px] font-bold text-zinc-200 uppercase tracking-tight leading-none mb-1">
                        North American Fall Run '23
                      </div>
                      <div className="text-[8.5px] text-zinc-400 font-mono tracking-widest uppercase mb-1.5">
                        Support Tech / Swing
                      </div>
                      <div className="text-[10px] font-sans text-zinc-500 leading-relaxed">
                        Handled local routing ops and assisted main stage crew
                        for a 30+ date cross-country tour string.
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. GEAR INVENTORY & BACKLINE RENTALS */}
                <div className="space-y-3 pt-5 border-t border-zinc-900 pb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9.5px] uppercase text-zinc-300 tracking-widest font-extrabold flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-zinc-500" />
                      Gear Inventory & Kits
                    </span>
                    <span className="text-[8px] tracking-widest text-zinc-600 font-mono uppercase">
                      DRY-HIRE AVALIABLE
                    </span>
                  </div>

                  <div className="space-y-2">
                    {selectedDrawerTalent.gear &&
                    selectedDrawerTalent.gear.length > 0 ? (
                      selectedDrawerTalent.gear.map((gearItem, gidx) => (
                        <div
                          key={`creative-gallery-${gidx}`}
                          className="border border-zinc-850 bg-zinc-950/60 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group hover:border-zinc-800 transition-colors"
                        >
                          <div className="text-[10.5px] font-bold uppercase text-zinc-300 tracking-tight flex items-center gap-1.5">
                            <span className="text-[#00ffcc]">🔧</span>{" "}
                            {gearItem}
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[8px] bg-zinc-90 w-full sm:w-auto text-center border border-zinc-800 text-zinc-400 px-2 py-1 rounded font-mono uppercase tracking-widest shrink-0 shadow-sm">
                              Included
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerTalent(null);
                                openRentalModal(selectedDrawerTalent, gearItem);
                              }}
                              className="text-[8px] bg-violet-950/50 border border-violet-500/40 text-violet-350 hover:bg-violet-600 hover:text-white px-2 py-1 rounded font-mono font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                            >
                              Rent Standalone ➜
                            </button>
                          </div>
                        </div>
                      ))
                    ) : selectedDrawerTalent.category === "audio" ? (
                      <>
                        <div className="border border-zinc-800 bg-zinc-950 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="text-[10.5px] font-bold uppercase text-zinc-300 tracking-tight font-mono">
                            Analog Mix Console Rack (Travel)
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded font-mono uppercase tracking-widest shrink-0 shadow-sm">
                              Included
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerTalent(null);
                                openRentalModal(
                                  selectedDrawerTalent,
                                  "Analog Mix Console Rack (Travel)",
                                );
                              }}
                              className="text-[8px] bg-violet-950/50 border border-violet-500/40 text-violet-350 hover:bg-violet-600 hover:text-white px-2 py-1 rounded font-mono font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                            >
                              Rent Standalone ➜
                            </button>
                          </div>
                        </div>
                        <div className="border border-[#00ffcc]/30 bg-[#00ffcc]/5 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group hover:bg-[#00ffcc]/10 transition-colors">
                          <div className="text-[10.5px] font-bold uppercase text-[#00ffcc] tracking-tight">
                            Sub-harmonic Synths Room Rig
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[8px] bg-[#00ffcc]/20 border border-[#00ffcc]/30 text-[#00ffcc] px-2 py-1 rounded font-mono font-black uppercase tracking-widest shrink-0">
                              + $25/Day
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerTalent(null);
                                openRentalModal(
                                  selectedDrawerTalent,
                                  "Sub-harmonic Synths Room Rig",
                                );
                              }}
                              className="text-[8px] bg-violet-950/50 border border-violet-500/40 text-violet-350 hover:bg-violet-600 hover:text-white px-2 py-1 rounded font-mono font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                            >
                              Rent Standalone ➜
                            </button>
                          </div>
                        </div>
                      </>
                    ) : selectedDrawerTalent.category === "visual" ? (
                      <>
                        <div className="border border-zinc-800 bg-zinc-950 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="text-[10.5px] font-bold uppercase text-zinc-300 tracking-tight font-mono">
                            Wacom Intuos Pro Stylus Setup (Mobile)
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded font-mono uppercase tracking-widest shrink-0 shadow-sm">
                              Included
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerTalent(null);
                                openRentalModal(
                                  selectedDrawerTalent,
                                  "Wacom Intuos Pro Stylus Setup (Mobile)",
                                );
                              }}
                              className="text-[8px] bg-violet-950/50 border border-violet-500/40 text-violet-350 hover:bg-violet-600 hover:text-white px-2 py-1 rounded font-mono font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                            >
                              Rent Standalone ➜
                            </button>
                          </div>
                        </div>
                        <div className="border border-violet-500/30 bg-violet-500/5 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group hover:bg-violet-500/10 transition-colors">
                          <div className="text-[10.5px] font-bold uppercase text-violet-300 tracking-tight">
                            Silkscreen Platen Press (Tour Ready)
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[8px] bg-violet-500/20 border border-violet-500/30 text-violet-300 px-2 py-1 rounded font-mono font-black uppercase tracking-widest shrink-0">
                              + $75/Day
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerTalent(null);
                                openRentalModal(
                                  selectedDrawerTalent,
                                  "Silkscreen Platen Press (Tour Ready)",
                                );
                              }}
                              className="text-[8px] bg-violet-950/50 border border-violet-500/40 text-violet-350 hover:bg-violet-600 hover:text-white px-2 py-1 rounded font-mono font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                            >
                              Rent Standalone ➜
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="border border-zinc-800 bg-zinc-950 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                          <div className="text-[10.5px] font-bold uppercase text-zinc-300 tracking-tight font-mono">
                            A7S III Photo / Hybrid Capture Kit
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[8px] bg-zinc-900 border border-zinc-800 text-zinc-400 px-2 py-1 rounded font-mono uppercase tracking-widest shrink-0 shadow-sm">
                              Included
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerTalent(null);
                                openRentalModal(
                                  selectedDrawerTalent,
                                  "A7S III Photo / Hybrid Capture Kit",
                                );
                              }}
                              className="text-[8px] bg-violet-950/50 border border-violet-500/40 text-violet-350 hover:bg-violet-600 hover:text-white px-2 py-1 rounded font-mono font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                            >
                              Rent Standalone ➜
                            </button>
                          </div>
                        </div>
                        <div className="border border-[#ff5500]/30 bg-[#ff5500]/5 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 group hover:bg-[#ff5500]/10 transition-colors">
                          <div className="text-[10.5px] font-bold uppercase text-[#ff5500] tracking-tight">
                            RED Komodo 6K Cinema Active Pro (Kit)
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <span className="text-[8px] bg-[#ff5500]/20 border border-[#ff5500]/30 text-[#ff5500] px-2 py-1 rounded font-mono font-black uppercase tracking-widest shrink-0">
                              + $150/Day
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDrawerTalent(null);
                                openRentalModal(
                                  selectedDrawerTalent,
                                  "RED Komodo 6K Cinema Active Pro (Kit)",
                                );
                              }}
                              className="text-[8px] bg-violet-950/50 border border-violet-500/40 text-violet-350 hover:bg-violet-600 hover:text-white px-2 py-1 rounded font-mono font-black uppercase tracking-widest transition-all cursor-pointer shrink-0"
                            >
                              Rent Standalone ➜
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* SECURE COORDINATOR CHATROOM SIMULATOR */
              <div className="flex flex-col h-full space-y-4 animate-fade-in py-1">
                <div className="bg-black/80 border border-zinc-900 text-zinc-300 text-[10px] p-3.5 font-mono rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span>
                      Secure Connection Status:{" "}
                      <span className="text-emerald-400 font-bold uppercase">
                        Active
                      </span>
                    </span>
                  </div>
                </div>

                {/* MESSAGE HISTORY */}
                <div className="flex-grow space-y-3 p-3 bg-black/60 border border-zinc-900 min-h-[380px] max-h-[500px] overflow-y-auto font-mono scrollbar-none rounded-2xl">
                  {(chatMessages[selectedDrawerTalent.id] || [])
                    .filter((msg) => msg.id !== "init-sys")
                    .map((msg, idx) => {
                      const isMe = msg.sender === "me";
                      return (
                        <div
                          key={`${msg.id}-${idx}`}
                          className={`flex flex-col max-w-[85%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                        >
                          <div
                            className={`text-[7.5px] text-zinc-550 mb-0.5 uppercase flex items-center gap-1`}
                          >
                            <span>
                              {isMe
                                ? "Artist"
                                : selectedDrawerTalent.name}
                            </span>
                            <span>•</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <div
                            className={`p-3 text-xs leading-relaxed ${
                              isMe
                                ? "bg-violet-950 text-violet-200 border border-violet-850 rounded-2xl rounded-tr-none text-right"
                                : "bg-zinc-900/80 text-zinc-200 border border-zinc-800 rounded-2xl rounded-tl-none text-left"
                            }`}
                          >
                            {msg.text}
                          </div>
                        </div>
                      );
                    })}

                  {drawerIsTyping && (
                    <div className="flex items-center gap-2 text-[10px] text-violet-400 font-black tracking-widest uppercase animate-pulse pt-2 pl-1">
                      <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" />
                      COORDINATOR BROADCASTING TRANSMISSION DATA...
                    </div>
                  )}
                </div>

                {/* TEXT INPUT DISPATCH CHATTER */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendDrawerMessage();
                  }}
                  className="flex gap-2.5 pt-2 border-t border-zinc-900 items-center justify-between"
                >
                  <input
                    type="text"
                    disabled={drawerIsTyping}
                    value={drawerChatDraft}
                    onChange={(e) => setDrawerChatDraft(e.target.value)}
                    placeholder={
                      drawerIsTyping ? "Sending..." : "Send Direct Message"
                    }
                    className="flex-grow bg-black border border-zinc-850 px-3.5 py-2 text-xs focus:outline-none focus:border-violet-605 font-mono disabled:opacity-40 text-left text-zinc-100"
                  />
                  <button
                    type="submit"
                    disabled={drawerIsTyping || !drawerChatDraft.trim()}
                    className="px-4 py-2.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-white transition-opacity disabled:opacity-30 cursor-pointer text-center select-none flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* DRAWER FOOTER SUBMIT */}
          {selectedDrawerTab === "specs" && (
            <div className="p-5 border-t border-zinc-900 bg-[#06080a] relative z-10">
              <button
                onClick={() => {
                  const target = selectedDrawerTalent;
                  setSelectedDrawerTalent(null);
                  setIsPlayingAudio(false);
                  openHireModal(target);
                }}
                className="w-full py-4 bg-[#A855F7]/10 border border-[#A855F7] text-[#A855F7] hover:bg-[#A855F7] hover:text-black font-black uppercase text-xs tracking-widest flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95 transition-all"
              >
                <Briefcase className="w-4 h-4" />[ INITIATE MERCH PROPOSAL ]
              </button>
            </div>
          )}
        </div>
      )}

      {/* FULLSCREEN LOOKBOOK SHOWCASE MODAL */}
      {fullscreenLookbookItem && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in font-mono">
          <div className="bg-[#0c0d12] border-2 border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {/* MODAL HEADER */}
            <div className="p-4 bg-[#08090d] border-b border-zinc-850 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3 min-w-0">
                {fullscreenLookbookItem?.talent?.avatar_url ? (
                  <img
                    src={fullscreenLookbookItem.talent.avatar_url}
                    alt={fullscreenLookbookItem?.talent?.name || "Artist"}
                    className="w-9 h-9 rounded-full object-cover border border-zinc-700 shrink-0"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-violet-950 flex items-center justify-center border border-violet-800 shrink-0">
                    <span className="text-xs font-black text-violet-300">
                      {(fullscreenLookbookItem?.talent?.name || "C").charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white uppercase tracking-wider truncate">
                    {fullscreenLookbookItem?.talent?.name || "Featured Specialist"}
                  </h3>
                  <span className="text-[9px] text-purple-400 font-bold uppercase tracking-widest block truncate">
                    {fullscreenLookbookItem?.talent?.categoryLabel || "Creative Showpiece"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {fullscreenLookbookItem?.talent && (
                  <>
                    <button
                      type="button"
                      onClick={() => toggleFollowTalent(fullscreenLookbookItem.talent.id, fullscreenLookbookItem.talent.name)}
                      className={`px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${
                        followedTalents.includes(fullscreenLookbookItem.talent.id)
                          ? "bg-purple-950/60 border-purple-500/40 text-purple-300 hover:bg-purple-900/40"
                          : "bg-rose-600 hover:bg-rose-500 border-rose-500 text-white shadow-sm"
                      }`}
                    >
                      {followedTalents.includes(fullscreenLookbookItem.talent.id) ? (
                        <>
                          <UserCheck className="w-3 h-3" /> Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" /> Follow
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const t = fullscreenLookbookItem.talent;
                        setFullscreenLookbookItem(null);
                        handleMessageCreative(t);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-750 text-white transition-all cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-violet-400" /> Message
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const t = fullscreenLookbookItem.talent;
                        setFullscreenLookbookItem(null);
                        openHireModal(t);
                      }}
                      className="px-3 py-1.5 rounded-lg text-[9px] font-mono font-bold flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border border-violet-500 transition-all cursor-pointer"
                    >
                      <Briefcase className="w-3 h-3" /> Hire
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setFullscreenLookbookItem(null)}
                  className="p-1.5 rounded-lg bg-black border border-zinc-800 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="flex-1 bg-black overflow-hidden flex items-center justify-center p-4 min-h-[320px] max-h-[60vh]">
              {fullscreenLookbookItem?.imageUrl?.endsWith('.mp4') || (fullscreenLookbookItem as any)?.videoUrl ? (
                <video
                  src={(fullscreenLookbookItem as any)?.videoUrl || fullscreenLookbookItem.imageUrl}
                  controls
                  autoPlay
                  className="max-h-full max-w-full rounded-lg object-contain"
                />
              ) : (
                <img
                  src={fullscreenLookbookItem?.imageUrl}
                  alt={fullscreenLookbookItem?.talent?.name || "Portfolio showcase"}
                  className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
                />
              )}
            </div>

            {/* MODAL FOOTER INFO */}
            <div className="p-4 bg-[#08090d] border-t border-zinc-850 flex items-center justify-between text-xs text-zinc-400 font-mono">
              <span className="truncate">
                {fullscreenLookbookItem?.talent?.bio || "Verified production showreel portfolio item"}
              </span>
              <span className="text-[10px] text-zinc-500 uppercase shrink-0 font-bold ml-2">
                HIGH RESOLUTION MASTER
              </span>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <div className="border-t border-zinc-900 pt-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-zinc-500 gap-2 mt-12 font-mono">
        <span>© NEXUS CORE CLIENT CREATIVE ADAPTER MODULE</span>
        <span className="text-zinc-650 tracking-wider">
          SECURED VIA INDUSTRIAL SMART PAYPAL ARCHITECTURES
        </span>
      </div>
    </div>
  );
}
