import MerchandisePrintersView from '../Band/MerchandisePrintersView';
import TeamBillingTab from './TeamBillingTab';
import AddItemView from '../Band/AddItemView';
import React, { useState, useEffect } from 'react';
import { UserProfile, hasRegisteredWorkspace } from '../../../types';
import { Power, Globe, Users, User, DollarSign, Database, Activity, RefreshCw, Settings, X, Home, Lock, Sparkles, Layers, LogOut, Bell, Building, MapPin, MessageSquare, ArrowLeft, Send, CheckSquare, Check, Plus, AlertTriangle, TrendingUp, Shield, BarChart3, Radio, Heart, MessageCircle, Play, Pause, Square, SkipBack, SkipForward, Disc, Volume2, Truck, Tag, Edit, Trash2, Upload, ShoppingBag, ShoppingCart, CreditCard, Calendar, ArrowRightLeft, Package, Box, Banknote, ChevronDown, Calculator, Palette, Info, Search, Pin, Flame, Rocket, ThumbsUp, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ErrorBoundary } from '../../ErrorBoundary';
import ReleasesCatalogTab from './ReleasesCatalogTab';
import MarqueeText from '../../MarqueeText';
import CashDrawerView from '../Band/CashDrawerView';
import PublicStorefrontView from '../../sales/PublicStorefrontView';
import {
  LabelSettingsDrawer,
  LabelInboxDrawer,
  LabelBundleModal,
  LabelOnboardBandModal,
  LabelPingBandModal,
  LabelShipRoadStockModal,
  LabelReAuditSplitModal,
  LabelWarehouseRestockModal,
  LabelMerchIntakeModal,
  LabelOAuthModal
} from './modals';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { labelCatalogStore, profileStore } from "../../../utils/indexedDB";
import { getSupabase, uploadBase64ToStorage } from '../../../supabase';

// Helper to compress uploaded images to avoid LocalStorage quota overflow
function compressImage(base64Str: string, maxWidth = 1920, maxHeight = 1080, quality = 0.9): Promise<string> {
  return new Promise((resolve) => {
    const img = window.Image ? new window.Image() : null;
    if (!img) {
      resolve(base64Str);
      return;
    }
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        if (width > height) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        } else {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/webp', quality));
      } else {
        resolve(base64Str);
      }
    };
    img.onerror = () => {
      resolve(base64Str);
    };
  });
}

interface LabelDashboardViewV2Props {
  userProfile: UserProfile;
  setUserProfile: (profile: UserProfile) => void;
  onLogout: () => void;
  notifications?: any[];
  onOpenNotifications?: () => void;
  triggerNotification?: (message: string) => void;
  setActiveTab?: (tab: string) => void;
}

const telemetryTrendData: Record<string, { hour: string; streams: number; index: number }[]> = {
  "AUSION-TX-01": [
    { hour: "00:00", streams: 12000, index: 65 },
    { hour: "02:00", streams: 14000, index: 70 },
    { hour: "04:00", streams: 15500, index: 72 },
    { hour: "06:00", streams: 18000, index: 78 },
    { hour: "08:00", streams: 22000, index: 82 },
    { hour: "10:00", streams: 28000, index: 88 },
  ],
  "WASHIP-SE-05": [
    { hour: "00:00", streams: 15000, index: 80 },
    { hour: "02:00", streams: 17000, index: 82 },
    { hour: "04:00", streams: 19500, index: 85 },
    { hour: "06:00", streams: 21000, index: 89 },
    { hour: "08:00", streams: 25000, index: 92 },
    { hour: "10:00", streams: 30600, index: 95 },
  ],
  "DENVER-CO-03": [
    { hour: "00:00", streams: 8000, index: 60 },
    { hour: "02:00", streams: 9500, index: 63 },
    { hour: "04:00", streams: 11000, index: 67 },
    { hour: "06:00", streams: 13000, index: 71 },
    { hour: "08:00", streams: 14500, index: 74 },
    { hour: "10:00", streams: 17200, index: 76 },
  ],
  "LONDON-UK-02": [
    { hour: "00:00", streams: 25000, index: 55 },
    { hour: "02:00", streams: 27000, index: 57 },
    { hour: "04:00", streams: 28500, index: 60 },
    { hour: "06:00", streams: 31000, index: 62 },
    { hour: "08:00", streams: 34000, index: 63 },
    { hour: "10:00", streams: 38300, index: 64 },
  ],
  "BERLIN-DE-09": [
    { hour: "00:00", streams: 14000, index: 50 },
    { hour: "02:00", streams: 15500, index: 52 },
    { hour: "04:00", streams: 17000, index: 54 },
    { hour: "06:00", streams: 18500, index: 56 },
    { hour: "08:00", streams: 20000, index: 57 },
    { hour: "10:00", streams: 22100, index: 59 },
  ]
};

export default function LabelDashboardViewV2({ 
  userProfile, 
  setUserProfile, 
  onLogout,
  notifications,
  onOpenNotifications,
  triggerNotification,
  setActiveTab: setPortalActiveTab
}: LabelDashboardViewV2Props) {
  const [activeClearanceLevel, setActiveClearanceLevel] = useState<number>(() => {
    const saved = localStorage.getItem('activeClearanceLevel');
    return saved ? parseInt(saved, 10) : 5;
  });

  const [activeTab, setActiveTab] = useState<'ROSTER'|'CATALOG'|'SALES'|'FINANCE'|'SOCIAL'|'SETTINGS'>('ROSTER');
  const [subTab, setSubTab] = useState<string>('');
  const [isSpecsDrawerOpen, setIsSpecsDrawerOpen] = useState(false);
  const [v2RoleMenuOpen, setV2RoleMenuOpen] = useState(false);

  // Local text states for settings inputs to prevent character lockout during typing
  const [bandRosterInput, setBandRosterInput] = useState(() => Array.isArray(userProfile.label_band_roster) ? userProfile.label_band_roster.join(', ') : '');
  const [subLabelsInput, setSubLabelsInput] = useState(() => Array.isArray(userProfile.label_sub_labels) ? userProfile.label_sub_labels.join(', ') : '');
  const [expandedClusters, setExpandedClusters] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const joined = Array.isArray(userProfile.label_band_roster) ? userProfile.label_band_roster.join(', ') : '';
    const cleanedJoined = bandRosterInput.split(',').map(x => x.trim()).filter(Boolean).join(', ');
    const profileJoined = Array.isArray(userProfile.label_band_roster) ? userProfile.label_band_roster.map(x => x.trim()).filter(Boolean).join(', ') : '';
    if (cleanedJoined !== profileJoined) {
      setBandRosterInput(joined);
    }
  }, [userProfile.label_band_roster]);

  useEffect(() => {
    const joined = Array.isArray(userProfile.label_sub_labels) ? userProfile.label_sub_labels.join(', ') : '';
    const cleanedJoined = subLabelsInput.split(',').map(x => x.trim()).filter(Boolean).join(', ');
    const profileJoined = Array.isArray(userProfile.label_sub_labels) ? userProfile.label_sub_labels.map(x => x.trim()).filter(Boolean).join(', ') : '';
    if (cleanedJoined !== profileJoined) {
      setSubLabelsInput(joined);
    }
  }, [userProfile.label_sub_labels]);

  useEffect(() => {
    if (userProfile && Array.isArray(userProfile.label_band_roster)) {
      const names = userProfile.label_band_roster.map((n: string) => n.trim()).filter(Boolean);
      if (names.length > 0) {
        setLabelRosterData(prev => {
          const updated = names.map((name, index) => {
            const existing = prev.find(b => b.name.toUpperCase() === name.toUpperCase());
            if (existing) {
              return existing;
            }
            const handle = name.toLowerCase().replace(/[^a-z0-9]/g, '');
            return {
              id: `b_${handle || index}`,
              name: name.toUpperCase(),
              handle: handle,
              status: "OFF-CYCLE",
              inventory_level: Math.floor(Math.random() * 40) + 10,
              revenue_split: 50,
              digital_split: 70,
              pending_ledger: 0.00,
              active_lp: `NX-${String(index + 1).padStart(3, '0')}`
            };
          });
          
          const prevNamesJoined = prev.map(b => b.name.toUpperCase()).join(',');
          const updatedNamesJoined = updated.map(b => b.name.toUpperCase()).join(',');
          if (prevNamesJoined !== updatedNamesJoined) {
            return updated;
          }
          return prev;
        });
      }
    }
  }, [userProfile?.label_band_roster]);

  // Synchronize active tab authorization and isPosMode for Level 1 Temp Assistant
  useEffect(() => {
    const tabAccessLevels: Record<string, number> = {
      ROSTER: 2,
      CATALOG: 3,
      SALES: 1,
      FINANCE: 4,
      SOCIAL: 3,
      SETTINGS: 1
    };
    const subTabAccessLevels: Record<string, number> = {
      roster: 2,
      calendar: 2,
      storefront: 1,
      warehouse: 4,
      'merchandise-printers': 3,
      royalties: 4,
      analytics: 3
    };

    const requiredLevel = subTabAccessLevels[subTab] || tabAccessLevels[activeTab];
    if (requiredLevel && activeClearanceLevel < requiredLevel) {
      if (activeClearanceLevel === 1) {
        setActiveTab('SALES');
        setSubTab('storefront');
      } else {
        setActiveTab('ROSTER');
        setSubTab('roster');
      }
    }

    if (activeClearanceLevel === 1) {
      setIsPosMode(true);
    }
  }, [activeClearanceLevel, activeTab, subTab]);
  const [labelOAuthProcessor, setLabelOAuthProcessor] = useState<{ id: 'stripe' | 'paypal'; name: string } | null>(null);
  const [labelOAuthStep, setLabelOAuthStep] = useState(0);

  useEffect(() => {
    const handleOAuthMessage = (event: MessageEvent) => {
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        return;
      }
      
      if (event.data?.type === 'STRIPE_AUTH_SUCCESS') {
        const stripeId = event.data.stripeUserId;
        setUserProfile({
          ...userProfile,
          stripe_customer_id: stripeId,
          label_stripe_connected: true
        });
        setLabelOAuthStep(2);
        showLocalToast("Stripe Connect account successfully linked!");
      }
      
      if (event.data?.type === 'PAYPAL_AUTH_SUCCESS') {
        const email = event.data.email;
        setUserProfile({
          ...userProfile,
          paypal_email: email,
          label_paypal_connected: true
        });
        setLabelOAuthStep(2);
        showLocalToast("PayPal Account successfully linked!");
      }
    };
    
    window.addEventListener('message', handleOAuthMessage);
    return () => window.removeEventListener('message', handleOAuthMessage);
  }, [userProfile, setUserProfile]);
  const isBandAllowed = hasRegisteredWorkspace(userProfile, 'band');
  const isCreativeAllowed = hasRegisteredWorkspace(userProfile, 'creative');
  const isPromoterAllowed = hasRegisteredWorkspace(userProfile, 'promoter');
  const isLabelAllowed = hasRegisteredWorkspace(userProfile, 'label');
  const [currentMonth, setCurrentMonth] = useState(9); // 9 for October (0-indexed)
  const [currentYear, setCurrentYear] = useState(2026);

  // --- TELEMETRY ENHANCEMENT STATES ---
  const [selectedTelemetrySector, setSelectedTelemetrySector] = useState<string>("WASHIP-SE-05");
  const [telemetryFrequency, setTelemetryFrequency] = useState<string>("Ku-Band (14.2 GHz)");
  const [isTelemetryPinging, setIsTelemetryPinging] = useState<boolean>(false);
  const [telemetrySignalGain, setTelemetrySignalGain] = useState<number>(45); // dB
  const [noiseCancellationPercent, setNoiseCancellationPercent] = useState<number>(85);
  const [satelliteLogs, setSatelliteLogs] = useState<string[]>([
    "[SYSTEM] Satellite orbital clusters online. Waiting for handshake ping...",
    "[STATUS] GPS Carrier locks established with 12 active transponders.",
    "[INFO] Direct stream listener data pipelines synchronized successfully."
  ]);

  const handleTriggerSatellitePing = () => {
    if (isTelemetryPinging) return;
    setIsTelemetryPinging(true);
    setTelemetrySignalGain(Math.floor(Math.random() * 30) + 35);
    
    setSatelliteLogs(prev => [
      `[PING] Handshake requested: Sector ${selectedTelemetrySector} via ${telemetryFrequency} (Local Node: AIS-EDGE-3000)`,
      ...prev
    ]);

    setTimeout(() => {
      setSatelliteLogs(prev => [
        `[SYNC] Carrier locked on target listening clusters. Resolving decibel refraction...`,
        ...prev
      ]);
    }, 700);

    setTimeout(() => {
      setSatelliteLogs(prev => [
        `[DECRYPT] Handshake completed successfully! Verified active stream clusters with high gain. Connection telemetry cached.`,
        ...prev
      ]);
      setIsTelemetryPinging(false);
    }, 1500);
  };

  const [productionEvents, setProductionEvents] = useState<{id: string; title: string; bandId: string; bandName: string; date: string; type: string; color: string; textColor: string; borderColor: string; bgColor: string; details: string; immediateAction?: boolean; itemIdToHighlight?: string}[]>([
    {
      id: "e1",
      title: "Euro Tour: Lisbon, Portugal",
      bandId: "b1",
      bandName: "TOMB MOLD",
      date: "2026-10-12",
      type: "LIVE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      details: "High-density live performance routing through Lisbon, Portugal at Decoder Underground. Expected capacity: 850 tickets sold out."
    },
    {
      id: "e2",
      title: "Euro Tour: Madrid, Spain",
      bandId: "b1",
      bandName: "TOMB MOLD",
      date: "2026-10-13",
      type: "LIVE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      details: "Travel/Transit logistics milestone checkpoint. Moving towards Madrid venue."
    },
    {
      id: "e3",
      title: "Euro Tour: Transit Day",
      bandId: "b1",
      bandName: "TOMB MOLD",
      date: "2026-10-14",
      type: "LIVE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      details: "Transit day checkpoint. Technical vehicle inspection in Spain."
    },
    {
      id: "e4",
      title: "Euro Tour: Barcelona, Spain",
      bandId: "b1",
      bandName: "TOMB MOLD",
      date: "2026-10-15",
      type: "LIVE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      details: "Live show in Barcelona. Decibel limits checked and approved."
    },
    {
      id: "e5",
      title: "VOIDWALKER - LP STREET DATE",
      bandId: "b2",
      bandName: "BLOOD INCANTATION",
      date: "2026-10-18",
      type: "STREET_DATE",
      color: "bg-[#FF9900]",
      textColor: "text-[#FF9900]",
      borderColor: "border-[#FF9900]/30",
      bgColor: "bg-[#FF9900]/10",
      details: "Major physical and digital global release date for Voidwalker LP. Distributed exclusively via Nexus Command nodes."
    },
    {
      id: "e6",
      title: '"Cerebral" - Studio Tracking',
      bandId: "b3",
      bandName: "UNDEATH",
      date: "2026-10-20",
      type: "STUDIO",
      color: "bg-purple-500",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      details: "Day 1 of drum and rhythm section tracking at Black Metal Laboratories, Austin TX."
    },
    {
      id: "e7",
      title: '"Cerebral" - Mixing',
      bandId: "b3",
      bandName: "UNDEATH",
      date: "2026-10-21",
      type: "STUDIO",
      color: "bg-purple-500",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      details: "Drum tracking refinement and guitar scratch layout loops."
    },
    {
      id: "e8",
      title: '"Cerebral" - Mastering',
      bandId: "b3",
      bandName: "UNDEATH",
      date: "2026-10-22",
      type: "STUDIO",
      color: "bg-purple-500",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      details: "Vocal pre-production tracking and tempo synchronization checks."
    },
    {
      id: "e10",
      title: '"Voidwalker" Vinyl Re-stock',
      bandId: "b2",
      bandName: "BLOOD INCANTATION",
      date: "2026-10-24",
      type: "PRODUCTION",
      color: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/10",
      details: "Primary drum tracking mix backup transferred to distributed cold storage.",
      immediateAction: true,
      itemIdToHighlight: "693ba67b-1a6c-486a-bc6d-47bf1b2c4e09"
    },
    {
      id: "e11",
      title: '"Decoder" - Vinyl Re-stock',
      bandId: "b1",
      bandName: "TOMB MOLD",
      date: "2026-10-28",
      type: "PRODUCTION",
      color: "bg-blue-500",
      textColor: "text-blue-400",
      borderColor: "border-blue-500/30",
      bgColor: "bg-blue-500/10",
      details: "Emergency physical inventory restock shipping wave. Over 1,000 units dispatched to regional distro hubs.",
      immediateAction: true,
      itemIdToHighlight: "850e0d02-86ee-433b-85a2-09419cf71991"
    },
    {
      id: "e12",
      title: '"Vox Recordings" - Studio Tracking',
      bandId: "b1",
      bandName: "TOMB MOLD",
      date: "2026-11-04",
      type: "STUDIO",
      color: "bg-purple-500",
      textColor: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-500/10",
      details: "Pre-recording tuning setup and microphone placements for upcoming EP tracking."
    },
    {
      id: "e13",
      title: "REMASTER STREET RELEASE",
      bandId: "b3",
      bandName: "UNDEATH",
      date: "2026-11-12",
      type: "STREET_DATE",
      color: "bg-[#FF9900]",
      textColor: "text-[#FF9900]",
      borderColor: "border-[#FF9900]/30",
      bgColor: "bg-[#FF9900]/10",
      details: "Classic demo tracks remaster release. Available in heavyweight gatefold wax."
    }
  ]);

  const [openEventId, setOpenEventId] = useState<string | null>(null);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);
  const [calendarFilter, setCalendarFilter] = useState('ALL');

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDate, setFormDate] = useState('2026-10-15');
  const [formBandId, setFormBandId] = useState('general');
  const [formType, setFormType] = useState('LIVE');
  const [formDetails, setFormDetails] = useState('');

  const [formImmediateAction, setFormImmediateAction] = useState(false);

  const [labelRosterData, setLabelRosterData] = useState([
    {
      id: "b1",
      name: "TOMB MOLD",
      handle: "tombmold",
      status: "TOURING",
      inventory_level: 84,
      revenue_split: 50,
      digital_split: 70,
      pending_ledger: 10420.50,
      active_lp: "NX-001"
    },
    {
      id: "b2",
      name: "BLOOD INCANTATION",
      handle: "bloodincantation",
      status: "STUDIO",
      inventory_level: 42,
      revenue_split: 70,
      digital_split: 70,
      pending_ledger: 3450.00,
      active_lp: "NX-002"
    },
    {
      id: "b3",
      name: "UNDEATH",
      handle: "undeath",
      status: "OFF-CYCLE",
      inventory_level: 15,
      revenue_split: 50,
      digital_split: 70,
      pending_ledger: 850.25,
      active_lp: "NX-003"
    }
  ]);
  
  // ==========================================
  // CUSTOM HOOKS & STATE FOR OPERATIONAL PANELS
  // ==========================================
  const [selectedCatalogBandId, setSelectedCatalogBandId] = useState<string | null>(null);
  const [localToast, setLocalToast] = useState<string | null>(null);

  // ONBOARD NEW BAND AND OPERATIONAL DIRECTIVE STATE
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [newBandName, setNewBandName] = useState('');
  const [newBandHandle, setNewBandHandle] = useState('');
  const [newBandStatus, setNewBandStatus] = useState<'SHOW' | 'TOURING' | 'STUDIO' | 'OFF-CYCLE'>('OFF-CYCLE');
  const [newBandInventory, setNewBandInventory] = useState(50);
  const [newBandSplit, setNewBandSplit] = useState(50);
  const [newBandPendingLedger, setNewBandPendingLedger] = useState(0);
  const [newBandActiveLp, setNewBandActiveLp] = useState('');

  // Operational states
  const [activePingBand, setActivePingBand] = useState<any | null>(null);
  const [pingMessage, setPingMessage] = useState('');

  const [activeShipRoadStockBand, setActiveShipRoadStockBand] = useState<any | null>(null);
  const [shipRoadStockQty, setShipRoadStockQty] = useState(50);
  const [shipRoadStockType, setShipRoadStockType] = useState('vinyl'); // vinyl, cd, cassette

  const [activeReAuditBand, setActiveReAuditBand] = useState<any | null>(null);
  const [newPhysicalSplit, setNewPhysicalSplit] = useState(50);
  const [newDigitalSplit, setNewDigitalSplit] = useState(70);

  const [activeRestockBand, setActiveRestockBand] = useState<any | null>(null);
  const [selectedRestockItemId, setSelectedRestockItemId] = useState('');
  const [selectedRestockFormat, setSelectedRestockFormat] = useState('vinyl'); // vinyl, cd, cassette, apparel
  const [restockQty, setRestockQty] = useState(25);

  const showLocalToast = (msg: string) => {
    setLocalToast(msg);
    setTimeout(() => {
      setLocalToast(null);
    }, 4500);
  };

  // State: Warehouse & Release catalog tracking
  const [catalogReleases, setCatalogReleases] = useState<Record<string, {
    id: string;
    catalogId: string;
    title: string;
    coverColor: string;
    type?: 'Album' | 'EP' | 'Demo' | 'Split' | 'Single';
    price?: number;
    band_id?: string;
    image_url?: string;
    formats: {
      vinyl: { warehouse_qty: number; shelf_id?: string; variants?: { id: string; name: string; qty: number }[] };
      cd: { warehouse_qty: number; shelf_id?: string; variants?: { id: string; name: string; qty: number }[] };
      cassette: { warehouse_qty: number; shelf_id?: string; variants?: { id: string; name: string; qty: number }[] };
    };
    digital: {
      id: string;
      title: string;
      isrc: string;
      createdAt: string;
      platforms: { spotify: boolean; apple: boolean; bandcamp: boolean };
    }[];
  }[]>>({});

  // State: Warehouse apparel catalog tracking
  const [catalogApparel, setCatalogApparel] = useState<Record<string, {
    id: string;
    title: string;
    type: 'T-Shirt' | 'Hoodie' | 'Cap' | 'Sticker' | 'Accessory' | 'Media';
    warehouse_qty: number;
    shelf_id?: string;
    band_id?: string;
    wholesale_cost?: number;
    image_url?: string;
    sizes: { S: number; M: number; L: number; XL: number; '2XL': number };
    price: number;
  }[]>>({});

  // Asynchronous Loading from IndexedDB (fixes local storage quota exceeded for images)
  useEffect(() => {
    labelCatalogStore.getItem('label_catalog_releases').then((cachedReleases) => {
      if (cachedReleases) {
        try {
          setCatalogReleases(JSON.parse(cachedReleases as string));
        } catch(e) {}
      } else {
        // Fallback to local storage (migration from old version)
        const oldCached = localStorage.getItem('label_catalog_releases');
        if (oldCached) {
          try {
            const parsed = JSON.parse(oldCached);
            setCatalogReleases(parsed);
            labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(parsed));
            return;
          } catch(e) {}
        }
        // Default seed data
        const defaultReleases: Record<string, any[]> = {};
        setCatalogReleases(defaultReleases);
        labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(defaultReleases));
      }
    });

    const MOCK_MERCH_IDS = new Set([
      "dfd0c9f8-b3d1-4aee-b248-26cf03e87870",
      "a40237bb-539c-4ea6-81d3-34e8979148d1",
      "f2f993f4-18ea-4672-91d1-6fc72e9fc988",
      "9a5ef28d-195c-443b-8fe9-a5c9b7482565",
      "c6e75924-be8c-4a1e-8e41-e94f8306df9a",
      "ecf0f2cf-bf0b-4df2-b5e0-b6f759e5bc53",
      "039e1ff1-460d-4581-9bfe-852438cb20d4"
    ]);

    const sanitizeApparel = (raw: Record<string, any[]>) => {
      const cleaned: Record<string, any[]> = {};
      for (const key in raw) {
        cleaned[key] = (raw[key] || []).filter(item => !MOCK_MERCH_IDS.has(item.id));
      }
      return cleaned;
    };

    labelCatalogStore.getItem('label_catalog_apparel').then((cachedApparel) => {
      if (cachedApparel) {
        try {
          const parsed = JSON.parse(cachedApparel as string);
          setCatalogApparel(sanitizeApparel(parsed));
        } catch(e) {}
      } else {
        const oldCached = localStorage.getItem('label_catalog_apparel');
        if (oldCached) {
          try {
            const parsed = JSON.parse(oldCached);
            setCatalogApparel(sanitizeApparel(parsed));
            labelCatalogStore.setItem('label_catalog_apparel', JSON.stringify(sanitizeApparel(parsed)));
            return;
          } catch(e) {}
        }
        const defaultApparel: Record<string, any[]> = {};
        setCatalogApparel(defaultApparel);
        labelCatalogStore.setItem('label_catalog_apparel', JSON.stringify(defaultApparel));
      }
    });
  }, []);

  const [storefrontSyncRecord, setStorefrontSyncRecord] = useState<Record<string, boolean>>(() => {
    const cached = localStorage.getItem('label_storefront_sync_record');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const cleaned: Record<string, boolean> = {};
        for (const k in parsed) {
          if (![
            "dfd0c9f8-b3d1-4aee-b248-26cf03e87870",
            "a40237bb-539c-4ea6-81d3-34e8979148d1",
            "f2f993f4-18ea-4672-91d1-6fc72e9fc988",
            "9a5ef28d-195c-443b-8fe9-a5c9b7482565",
            "c6e75924-be8c-4a1e-8e41-e94f8306df9a",
            "ecf0f2cf-bf0b-4df2-b5e0-b6f759e5bc53",
            "039e1ff1-460d-4581-9bfe-852438cb20d4"
          ].includes(k)) {
            cleaned[k] = parsed[k];
          }
        }
        return cleaned;
      } catch(e) {}
    }
    return {};
  });

  useEffect(() => {
    // Only save if it's not the initial empty state to avoid overwriting with empties
    if (Object.keys(catalogReleases).length > 0) {
      labelCatalogStore.setItem('label_catalog_releases', JSON.stringify(catalogReleases))
        .catch(e => console.warn('Storage quota exceeded for releases, stripping images...', e));
    }
  }, [catalogReleases]);

  useEffect(() => {
    if (Object.keys(catalogApparel).length > 0) {
      labelCatalogStore.setItem('label_catalog_apparel', JSON.stringify(catalogApparel))
        .catch(e => console.warn('Storage quota exceeded for apparel, stripping images...', e));
    }
  }, [catalogApparel]);

  useEffect(() => {
    try {
      localStorage.setItem('label_storefront_sync_record', JSON.stringify(storefrontSyncRecord));
      labelCatalogStore.setItem('label_storefront_sync_record', storefrontSyncRecord).catch((e) => console.error(e));
    } catch (e) {
      console.error(e);
    }
  }, [storefrontSyncRecord]);
  
  const [storefrontHeroBanner, setStorefrontHeroBanner] = useState<string | null>(null);
  const [storefrontMarquee, setStorefrontMarquee] = useState<string>('FREE WORLDWIDE SHIPPING ON ALL ORDERS OVER $100 USD.');
  const [storefrontConfig, setStorefrontConfig] = useState({
    artistDiscSubpages: true,
    segregateMediaTypes: true,
    segregateApparelEnums: false,
    requireZipcode: false,
    autoSyncInventory: false
  });
  
  const [storefrontOrders, setStorefrontOrders] = useState([
    { id: 'ORD-9021', date: '2026-06-23 14:30', items: 'TOMB MOLD - NX-084 (Vinyl - Standard Black)', buyer: 'Ian MacKaye, 1373 F St NE, Washington DC', status: 'UNFULFILLED' },
    { id: 'ORD-9018', date: '2026-06-16 09:15', items: 'UNDEATH - Logo Enamel Pin Set, TOMB MOLD - NX-084 (Vinyl - Standard Black) [Qty: 2], SPECTRAL VOICE - Eroded Corridors of Unbeing LP', buyer: 'Chuck Schuldiner, 1984 Symbolic Ln, Altamonte Springs FL', status: 'UNFULFILLED' },
    { id: 'ORD-9015', date: '2026-06-05 11:22', items: 'BLOOD INCANTATION - NX-058 (CD), TOMB MOLD - Aperture of Mind Longsleeve [S]', buyer: 'Trey Azagthoth, 800 Nocturnus Ave, Tampa FL', status: 'UNFULFILLED' },
    { id: 'ORD-9012', date: '2026-06-22 10:10', items: 'TOMB MOLD - NX-084 (CD - Standard Edition)', buyer: 'Fenriz Gylve, 666 Darkthrone Rd, Oslo Norway', status: 'SHIPPED / TRACKING LOGGED' }
  ]);

  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [isCatalogSyncExpanded, setIsCatalogSyncExpanded] = useState(false);
  const [orderTracking, setOrderTracking] = useState<Record<string, string>>({
    'ORD-9012': 'USPS-NX-940011234567890123'
  });

  const getOrderAgeInfo = (dateStr: string) => {
    const reference = new Date('2026-06-24T06:54:00');
    const orderDate = new Date(dateStr.replace(' ', 'T'));
    const diffTime = reference.getTime() - orderDate.getTime();
    const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));
    
    if (diffDays <= 5) {
      return {
        days: diffDays,
        bgClass: 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-500/60',
        textClass: 'text-emerald-400',
        label: `${diffDays}d old [RECENT]`,
        statusColor: '#10b981'
      };
    } else if (diffDays <= 14) {
      return {
        days: diffDays,
        bgClass: 'bg-amber-950/20 border-amber-800/40 hover:border-amber-500/60',
        textClass: 'text-amber-400',
        label: `${diffDays}d old [EXPEDITED]`,
        statusColor: '#f59e0b'
      };
    } else {
      return {
        days: diffDays,
        bgClass: 'bg-rose-950/20 border-rose-800/40 hover:border-rose-500/60',
        textClass: 'text-rose-400',
        label: `${diffDays}d old [OVERDUE / PRIORITY]`,
        statusColor: '#f43f5e'
      };
    }
  };

  const pendingOrders = storefrontOrders.filter(o => o.status === 'UNFULFILLED');
  const selectedPendingCount = pendingOrders.filter(o => selectedOrderIds.includes(o.id)).length;
  const isAllPendingSelected = pendingOrders.length > 0 && selectedPendingCount === pendingOrders.length;

  const toggleSelectAllPending = () => {
    if (isAllPendingSelected) {
      setSelectedOrderIds(prev => prev.filter(id => !(pendingOrders || []).some(po => po.id === id)));
    } else {
      const pendingIds = pendingOrders.map(o => o.id);
      setSelectedOrderIds(prev => {
        const otherIds = prev.filter(id => !pendingIds.includes(id));
        return [...otherIds, ...pendingIds];
      });
    }
  };

  const toggleSelectOrder = (id: string) => {
    setSelectedOrderIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBatchFulfill = () => {
    if (selectedOrderIds.length === 0) {
      showLocalToast("NO ORDERS SELECTED FOR BATCH FULFILLMENT.");
      return;
    }
    showLocalToast(`BATCH GENERATED LABELS FOR ${selectedOrderIds.length} ORDERS.`);
    setStorefrontOrders(prev => prev.map(o => {
      if (selectedOrderIds.includes(o.id)) {
        return { ...o, status: 'SHIPPED / TRACKING LOGGED' };
      }
      return o;
    }));
    setOrderTracking(prev => {
      const updated = { ...prev };
      selectedOrderIds.forEach(id => {
        if (!updated[id]) {
          updated[id] = `USPS-NX-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
        }
      });
      return updated;
    });
    setSelectedOrderIds([]);
  };

  // Enhanced Storefront Controls States
  const [promoCodes, setPromoCodes] = useState([
    { code: 'HEAVYWAX', discountType: 'percentage', value: 15, active: true },
    { code: 'METALSHIP', discountType: 'free_shipping', value: 0, active: true },
    { code: 'FIRSTORDER', discountType: 'flat', value: 10, active: false }
  ]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoType, setNewPromoType] = useState('percentage');
  const [newPromoValue, setNewPromoValue] = useState('10');

  const [taxRate, setTaxRate] = useState(8.5);
  const [isTaxInclusive, setIsTaxInclusive] = useState(false);

  const [flatShippingRate, setFlatShippingRate] = useState(5.99);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(75);
  const [shippingMethods, setShippingMethods] = useState({
    mediaMail: true,
    groundAdvantage: true,
    dhlExpress: false
  });

  const [promoCollapsed, setPromoCollapsed] = useState(true);
  const [taxCollapsed, setTaxCollapsed] = useState(true);
  const [shippingCollapsed, setShippingCollapsed] = useState(true);

  const [storefrontAccentColor, setStorefrontAccentColor] = useState('#00ffcc');
  const [storefrontFontPreset, setStorefrontFontPreset] = useState('Space Grotesk');
  const [storefrontThemePreset, setStorefrontThemePreset] = useState('Cyberpunk Slate');

  const [warehouseAuditLogs, setWarehouseAuditLogs] = useState<{
    id: string;
    timestamp: string;
    operator: string;
    type: 'INTAKE' | 'DISPATCH' | 'STOREFRONT_SYNC' | 'RECONCILE' | 'BIN_MOVE';
    message: string;
  }[]>([
    { id: '1', timestamp: '2026-06-22 14:32', operator: 'G. Sickness', type: 'INTAKE', message: 'Received 300x "The Enduring Spirit" vinyl from pressing plant' },
    { id: '2', timestamp: '2026-06-23 08:15', operator: 'HQ Automated', type: 'STOREFRONT_SYNC', message: 'Linked "Planetary Clairvoyance" LP directly to digital storefront' }
  ]);

  const [warehouseBinLocations, setWarehouseBinLocations] = useState<Record<string, string>>({
    '850e0d02-86ee-433b-85a2-09419cf71991': 'BIN-A12',
    'b299e52c-e092-4fdf-9730-a92442cf28be': 'BIN-B03',
    '693ba67b-1a6c-486a-bc6d-47bf1b2c4e09': 'BIN-A15',
    'f3e1a82b-658b-4c5b-9d41-eeec83cb6021': 'BIN-C22',
    '08229df5-cd73-4ea9-b006-2580fb925bb1': 'BIN-B09',
    'd589d9fe-3da5-4bc6-a947-f58c4fef94de': 'BIN-D11',
    'dfd0c9f8-b3d1-4aee-b248-26cf03e87870': 'BIN-M01',
    '9a5ef28d-195c-443b-8fe9-a5c9b7482001': 'BIN-M02',
    '039e1ff1-460d-4581-9bfe-852438cb20d4': 'BIN-M05'
  });

  // Warehouse UI states
  const [warehouseSearchQuery, setWarehouseSearchQuery] = useState('');
  const [warehouseBandFilter, setWarehouseBandFilter] = useState('ALL_ROSTER');
  const [editingWarehouseItem, setEditingWarehouseItem] = useState<any>(null);
  const [isMerchIntakeOpen, setIsMerchIntakeOpen] = useState(false);
  const [podItems, setPodItems] = useState<Record<string, boolean>>({});
  const [merchIntakeForm, setMerchIntakeForm] = useState({ title: '', qty: 0, cost: 0 });
  const [warehouseTypeFilter, setWarehouseTypeFilter] = useState<'all' | 'media' | 'apparel'>('all');
  const [intakeBandId, setIntakeBandId] = useState('');
  const [intakeItemId, setIntakeItemId] = useState('');
  const [intakeVariant, setIntakeVariant] = useState('');
  const [intakeQuantity, setIntakeQuantity] = useState(100);
  const [intakeSupplier, setIntakeSupplier] = useState('Central Pressing Corp');
  const [reconcileItemId, setReconcileItemId] = useState<string | null>(null);
  const [reconcileVariant, setReconcileVariant] = useState('');
  const [reconcileQty, setReconcileQty] = useState(0);
  const [editingBinItemId, setEditingBinItemId] = useState<string | null>(null);
  const [editingBinValue, setEditingBinValue] = useState('');

  // Mobile POS State
  const [isPosMode, setIsPosMode] = useState(false);
  const [posCategory, setPosCategory] = useState('ALL ITEMS');
  const [posBandFilter, setPosBandFilter] = useState('ALL ROSTER');
  const [isPosCheckoutOpen, setIsPosCheckoutOpen] = useState(false);
  const [activeSizeSelector, setActiveSizeSelector] = useState<string | null>(null);
  const [posCart, setPosCart] = useState<Array<{ id: string; title: string; variant: string; price: number; type: string; qty: number; bandId?: string }>>([]);
  const [posTaxRate, setPosTaxRate] = useState<number>(0);
  
  const [isCashDrawerOpen, setIsCashDrawerOpen] = useState(false);
  const [cashTransactions, setCashTransactions] = useState<any[]>([]);

  const [isBundleModalOpen, setIsBundleModalOpen] = useState(false);
  const [bundleItems, setBundleItems] = useState<Array<{ id: string; title: string; variantName: string; quantity: number, type: string, price?: number }>>([]);
  const [bundlePrice, setBundlePrice] = useState<string>('');

  const [isPublicStorefrontOpen, setIsPublicStorefrontOpen] = useState(false);



  // Digital Cassette / Audio Deck Simulation State
  const [activePlaybackTrackId, setActivePlaybackTrackId] = useState<string | null>("d1");
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackProgress, setPlaybackProgress] = useState<number>(14);
  const [audioVolume, setAudioVolume] = useState<number>(0.75);

  // Simulation timer for playback progress
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Form states for ADD / EDIT actions inside Catalog
  const [isAddingRelease, setIsAddingRelease] = useState(false);
  const [newReleaseTitle, setNewReleaseTitle] = useState('');
  const [newReleaseCatalogId, setNewReleaseCatalogId] = useState('');
  const [newReleaseVinylQty, setNewReleaseVinylQty] = useState(100);
  const [newReleaseCdQty, setNewReleaseCdQty] = useState(200);
  const [newReleaseCassetteQty, setNewReleaseCassetteQty] = useState(150);
  const [newReleaseFormatType, setNewReleaseFormatType] = useState<'Album' | 'EP' | 'Demo' | 'Split' | 'Single'>('Album');
  const [newReleaseColor, setNewReleaseColor] = useState('from-zinc-900 to-zinc-950 border-zinc-800');

  const [editingReleaseId, setEditingReleaseId] = useState<string | null>(null);
  const [highlightItemId, setHighlightItemId] = useState<string | null>(null);
  
  useEffect(() => {
    if (activeTab === 'SALES' && subTab === 'warehouse' && highlightItemId) {
      setTimeout(() => {
        const element = document.getElementById(`warehouse`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 150);
    }
  }, [activeTab, highlightItemId]);

  const [editReleaseTitle, setEditReleaseTitle] = useState('');
  const [editReleaseCatalogId, setEditReleaseCatalogId] = useState('');
  const [editReleaseFormatType, setEditReleaseFormatType] = useState<'Album' | 'EP' | 'Demo' | 'Split' | 'Single'>('Album');
  const [editReleaseVinylQty, setEditReleaseVinylQty] = useState(0);
  const [editReleaseCdQty, setEditReleaseCdQty] = useState(0);
  const [editReleaseCassetteQty, setEditReleaseCassetteQty] = useState(0);

  const [isAddingApparel, setIsAddingApparel] = useState(false);
  const [newApparelTitle, setNewApparelTitle] = useState('');
  const [newApparelType, setNewApparelType] = useState<'T-Shirt' | 'Hoodie' | 'Cap' | 'Sticker' | 'Accessory'>('T-Shirt');
  const [newApparelPrice, setNewApparelPrice] = useState(30);
  const [newApparelS, setNewApparelS] = useState(50);
  const [newApparelM, setNewApparelM] = useState(50);
  const [newApparelL, setNewApparelL] = useState(50);
  const [newApparelXl, setNewApparelXl] = useState(50);
  const [newApparel2Xl, setNewApparel2Xl] = useState(25);

  const [editingApparelId, setEditingApparelId] = useState<string | null>(null);
  const [editApparelTitle, setEditApparelTitle] = useState('');
  const [editApparelType, setEditApparelType] = useState<'T-Shirt' | 'Hoodie' | 'Cap' | 'Sticker' | 'Accessory'>('T-Shirt');
  const [editApparelPrice, setEditApparelPrice] = useState(30);
  const [editApparelS, setEditApparelS] = useState(0);
  const [editApparelM, setEditApparelM] = useState(0);
  const [editApparelL, setEditApparelL] = useState(0);
  const [editApparelXl, setEditApparelXl] = useState(0);
  const [editApparel2Xl, setEditApparel2Xl] = useState(0);

  const [newTrackTitle, setNewTrackTitle] = useState('');
  const [newTrackIsrc, setNewTrackIsrc] = useState('');

  // State: Financial variables
  const [vaultBalance, setVaultBalance] = useState<number>(24590.00);
  const [newTxnGross, setNewTxnGross] = useState('');
  const [newTxnSource, setNewTxnSource] = useState('Storefront Web');
  const [newTxnBandId, setNewTxnBandId] = useState('b1');
  const [transactions, setTransactions] = useState([
    { id: "TXN-90811", bandId: "b1", bandName: "TOMB MOLD", source: "Storefront Web (Vinyl)", gross: 1250.00, timestamp: "2026-06-22 11:21", splitPct: 50 },
    { id: "TXN-90812", bandId: "b2", bandName: "BLOOD INCANTATION", source: "Streaming Platform Proxy", gross: 3500.00, timestamp: "2026-06-22 09:15", splitPct: 70 },
    { id: "TXN-90813", bandId: "b1", bandName: "TOMB MOLD", source: "Merch Table POS", gross: 850.00, timestamp: "2026-06-21 21:40", splitPct: 50 },
    { id: "TXN-90814", bandId: "b3", bandName: "UNDEATH", source: "Storefront Web (CD)", gross: 450.00, timestamp: "2026-06-20 15:30", splitPct: 50 },
    { id: "TXN-90815", bandId: "b2", bandName: "BLOOD INCANTATION", source: "Bandcamp Digital EP", gross: 600.00, timestamp: "2026-06-19 12:45", splitPct: 70 },
  ]);

  // Tax ID Capture status (EIN status matching boolean check)
  const bandTaxProfiles: Record<string, { company_ein: string; taxIdCaptured: boolean }> = {
    b1: { company_ein: "XX-XXX4152", taxIdCaptured: true },
    b2: { company_ein: "", taxIdCaptured: false },
    b3: { company_ein: "XX-XXX9282", taxIdCaptured: true }
  };

  // State: Collapsed status of band cards
  const [expandedBands, setExpandedBands] = useState<Record<string, boolean>>({});

  // State: Tour vehicle apparel sizing arrays for Predictive calculations
  const [vanApparelStocks, setVanApparelStocks] = useState<Record<string, {
    bandName: string;
    route: string;
    sizes: { S: number; M: number; L: number; XL: number; '2XL': number };
    burnRatePerStop: number;
    nextStopInDays: number;
    targetRouteSector: string;
  }>>({
    b1: {
      bandName: "TOMB MOLD",
      route: "Vancouver -> Seattle -> Portland",
      sizes: { S: 1, M: 8, L: 2, XL: 12, '2XL': 1 },
      burnRatePerStop: 4,
      nextStopInDays: 2,
      targetRouteSector: "SEATTLE COORDINATES"
    },
    b2: {
      bandName: "BLOOD INCANTATION",
      route: "Denver -> Salt Lake City -> Chicago",
      sizes: { S: 5, M: 14, L: 8, XL: 2, '2XL': 9 },
      burnRatePerStop: 3,
      nextStopInDays: 3,
      targetRouteSector: "DENVER SECTOR"
    },
    b3: {
      bandName: "UNDEATH",
      route: "Off-cycle / Studio Hibernation",
      sizes: { S: 25, M: 30, L: 35, XL: 28, '2XL': 20 },
      burnRatePerStop: 0,
      nextStopInDays: 0,
      targetRouteSector: "ROCHESTER SECTOR"
    }
  });

  const [pendingSyncEvents, setPendingSyncEvents] = useState([
    {
      id: "ps1",
      title: "NORTH AMERICAN DEVASTATION TOUR - TORONTO HEADLINER",
      bandId: "b1",
      bandName: "TOMB MOLD",
      date: "2026-10-25",
      type: "LIVE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      details: "Confirmed stadium headlining tour kickoff at Danforth Music Hall, Toronto. Expected 1,200 capacity. Highly critical for apparel supply allocation."
    },
    {
      id: "ps2",
      title: "COSMIC CONVERGENCE - DENVER OUTDOOR HEADLINE FEST",
      bandId: "b2",
      bandName: "BLOOD INCANTATION",
      date: "2026-10-31",
      type: "LIVE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      details: "Halloween special performance confirmed at Red Rocks Amphitheatre, CO. Massive street-date vinyl tie-in marketing opportunity."
    },
    {
      id: "ps3",
      title: "DARK DECREE FESTIVAL - TOKYO METAL GATEWAY",
      bandId: "b3",
      bandName: "UNDEATH",
      date: "2026-11-04",
      type: "LIVE",
      color: "bg-emerald-500",
      textColor: "text-emerald-400",
      borderColor: "border-emerald-500/30",
      bgColor: "bg-emerald-500/10",
      details: "Confirmed Japanese promotional market showcase at Club Quattro, Shibuya. Merch pipeline logistics under review."
    }
  ]);

  const handleUpdateVanStockSize = (bandId: string, size: 'S'|'M'|'L'|'XL'|'2XL', count: number) => {
    setVanApparelStocks(prev => {
      const data = prev[bandId];
      if (!data) return prev;
      return {
        ...prev,
        [bandId]: {
          ...data,
          sizes: {
            ...data.sizes,
            [size]: count
          }
        }
      };
    });
    showLocalToast(`UPDATED ${prev => prev[bandId]?.bandName} VAN CLOTHING SIZE [${size}] stock to ${count}`);
  };

  // Handlers for Physical Dispatch to Van via IndexedDB
  const handleDispatchToVanIndexedDB = (bandId: string, title: string, format: 'vinyl' | 'cd' | 'cassette', qty: number) => {
    if (qty < 1) return;
    
    // Check if we have enough stock
    const releases = catalogReleases[bandId] || [];
    const target = releases.find(r => r.title === title);
    if (!target) return;
    const safeFormats = target.formats || { vinyl: { warehouse_qty: 0 }, cd: { warehouse_qty: 0 }, cassette: { warehouse_qty: 0 } };
    const currentQty = safeFormats[format]?.warehouse_qty || 0;
    if (currentQty < qty) {
      showLocalToast(`CRITICAL: INSUFFICIENT MASTER WAREHOUSE INVENTORY OF ${format.toUpperCase()}`);
      return;
    }

    // 1. Decrement master catalog warehouse quantity
    setCatalogReleases(prev => {
      const bList = prev[bandId] || [];
      const updatedList = bList.map(r => {
        if (r.title === title) {
          const sFormats = r.formats || { vinyl: { warehouse_qty: 0 }, cd: { warehouse_qty: 0 }, cassette: { warehouse_qty: 0 } };
          return {
            ...r,
            formats: {
              ...sFormats,
              [format]: { warehouse_qty: Math.max(0, currentQty - qty) }
            }
          };
        }
        return r;
      });
      return { ...prev, [bandId]: updatedList };
    });

    // 2. Initialize and write directly to client-side IndexedDB stock schema tracking table
    try {
      const openRequest = indexedDB.open('nexus_van_stock_db', 1);
      openRequest.onupgradeneeded = (e: any) => {
        const db = e.target?.result;
        if (!db.objectStoreNames.contains('van_stock')) {
          db.createObjectStore('van_stock', { keyPath: 'id' });
        }
      };
      
      openRequest.onsuccess = (e: any) => {
        const db = e.target?.result;
        const transaction = db.transaction('van_stock', 'readwrite');
        const store = transaction.objectStore('van_stock');
        
        const txnRecordId = `dispatch_${bandId}_${Date.now()}`;
        store.put({
          id: txnRecordId,
          bandId,
          releaseTitle: title,
          format,
          quantity: qty,
          dispatchedAt: new Date().toISOString()
        });
        console.log(`[IndexedDB Write Sync] Pushed designated item allocation: ${txnRecordId} into tour vehicle database`);
      };
    } catch (dbErr) {
      console.warn("IndexedDB execution restricted, writing to offline buffer:", dbErr);
    }

    // 3. Increment the band's general van inventory representation slightly as well for real-time tracking
    setLabelRosterData(prev => {
      return prev.map(member => {
        if (member.id === bandId) {
          const addedPerc = Math.min(100, member.inventory_level + Math.floor(qty / 2));
          return { ...member, inventory_level: addedPerc };
        }
        return member;
      });
    });

    showLocalToast(`SUCCESS: ${qty} ${format.toUpperCase()} SAVED TO TOURING VEHICLE INDEXEDDB STOCK`);
  };

  // Handler for inserting client-side mock transactions
  const handleAddTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const grossVal = parseFloat(newTxnGross);
    if (isNaN(grossVal) || grossVal <= 0) {
      showLocalToast("INVALID TRANSACTION VALUE");
      return;
    }

    const bandId = newTxnBandId;
    const bandObj = labelRosterData.find(b => b.id === bandId);
    if (!bandObj) return;

    const newId = `TXN-${Math.floor(10000 + Math.random() * 90000)}`;
    const newRecord = {
      id: newId,
      bandId,
      bandName: bandObj.name,
      source: newTxnSource,
      gross: grossVal,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
      splitPct: bandObj.revenue_split || 55
    };

    setTransactions([newRecord, ...transactions]);
    
    // Net profit (excluding 0% fee) contributes to Master Vault
    setVaultBalance(prev => prev + grossVal);
    
    // Increment the band pending payment ledger directly!
    setLabelRosterData(prev => {
      return prev.map(member => {
        if (member.id === bandId) {
          const artistCut = grossVal * (member.revenue_split / 100);
          return {
            ...member,
            pending_ledger: member.pending_ledger + artistCut
          };
        }
        return member;
      });
    });

    setNewTxnGross('');
    showLocalToast(`PROCESSED ${newId} AND DEPOSITED $${grossVal.toFixed(2)} USD TO MASTER VAULT`);
  };

  // ONBOARD NEW BAND
  const handleOnboardBand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBandName.trim()) {
      showLocalToast("Please enter a valid band name");
      return;
    }
    const handle = newBandHandle.trim() || newBandName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const newBand = {
      id: `b${Date.now()}`,
      name: newBandName.trim().toUpperCase(),
      handle: handle,
      status: newBandStatus,
      inventory_level: Number(newBandInventory) || 0,
      revenue_split: Number(newBandSplit) || 50,
      digital_split: 70,
      pending_ledger: Number(newBandPendingLedger) || 0,
      active_lp: newBandActiveLp.trim().toUpperCase() || `NX-${String(labelRosterData.length + 1).padStart(3, '0')}`
    };
    setLabelRosterData(prev => [...prev, newBand]);
    showLocalToast(`SUCCESSFULLY ONBOARDED BAND: ${newBand.name}`);
    setIsOnboardModalOpen(false);
    // Reset
    setNewBandName('');
    setNewBandHandle('');
    setNewBandStatus('OFF-CYCLE');
    setNewBandInventory(50);
    setNewBandSplit(50);
    setNewBandPendingLedger(0);
    setNewBandActiveLp('');
  };

  // PING BAND
  const handlePingBandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePingBand) return;
    showLocalToast(`ENCRYPTED TELEMETRY SENT TO ${activePingBand.name}: "${pingMessage || 'SYSTEM HEARTBEAT'}"`);
    setActivePingBand(null);
    setPingMessage('');
  };

  // SHIP ROAD STOCK
  const handleShipRoadStockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShipRoadStockBand) return;
    const qty = Number(shipRoadStockQty) || 50;
    
    // Deduct warehouse stock of the first catalog item for this band if found
    const bandId = activeShipRoadStockBand.id;
    const releases = catalogReleases[bandId] || [];
    if (releases.length > 0) {
      const releaseToDeduct = releases[0];
      setCatalogReleases(prev => {
        const bandReleases = prev[bandId] || [];
        return {
          ...prev,
          [bandId]: bandReleases.map(r => {
            if (r.id === releaseToDeduct.id) {
              const format = shipRoadStockType as 'vinyl' | 'cd' | 'cassette';
              const safeFormats = r.formats || { vinyl: { warehouse_qty: 0 }, cd: { warehouse_qty: 0 }, cassette: { warehouse_qty: 0 } };
              const currentQty = safeFormats[format]?.warehouse_qty || 0;
              const nextQty = Math.max(0, currentQty - qty);
              return {
                ...r,
                formats: {
                  ...safeFormats,
                  [format]: {
                    ...safeFormats[format],
                    warehouse_qty: nextQty
                  }
                }
              };
            }
            return r;
          })
        };
      });
    }

    // Update band inventory level slightly
    setLabelRosterData(prev => prev.map(b => {
      if (b.id === bandId) {
        const nextInv = Math.min(100, b.inventory_level + Math.ceil(qty / 3));
        return { ...b, inventory_level: nextInv };
      }
      return b;
    }));

    showLocalToast(`SHIPPED ${qty} UNITS OF ${shipRoadStockType.toUpperCase()} TO ${activeShipRoadStockBand.name} ROAD VEHICLE. ROAD STOCK SYNCHRONIZED.`);
    setActiveShipRoadStockBand(null);
  };

  // RE-AUDIT SPLIT PERCENT
  const handleReAuditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeReAuditBand) return;
    setLabelRosterData(prev => prev.map(b => {
      if (b.id === activeReAuditBand.id) {
        return {
          ...b,
          revenue_split: Number(newPhysicalSplit) || 50,
          digital_split: Number(newDigitalSplit) || 70
        };
      }
      return b;
    }));
    showLocalToast(`RE-AUDITED CONTRACT SPLITS FOR ${activeReAuditBand.name}. PHYSICAL: ${newPhysicalSplit}%, DIGITAL: ${newDigitalSplit}%.`);
    setActiveReAuditBand(null);
  };

  // WAREHOUSE TO BAND RESTOCK
  const handleWarehouseRestockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRestockBand) return;
    const qty = Number(restockQty) || 25;
    const itemId = selectedRestockItemId;
    const format = selectedRestockFormat;

    if (format === 'apparel') {
      // Deduct from apparel
      setCatalogApparel(prev => {
        const bandApparel = prev[activeRestockBand.id] || [];
        return {
          ...prev,
          [activeRestockBand.id]: bandApparel.map(a => {
            if (a.id === itemId) {
              return { ...a, warehouse_qty: Math.max(0, (a.warehouse_qty || 0) - qty) };
            }
            return a;
          })
        };
      });
    } else {
      // Deduct from releases format
      setCatalogReleases(prev => {
        const bandReleases = prev[activeRestockBand.id] || [];
        return {
          ...prev,
          [activeRestockBand.id]: bandReleases.map(r => {
            if (r.id === itemId) {
              const f = format as 'vinyl' | 'cd' | 'cassette';
              const safeFormats = r.formats || { vinyl: { warehouse_qty: 0 }, cd: { warehouse_qty: 0 }, cassette: { warehouse_qty: 0 } };
              const currentQty = safeFormats[f]?.warehouse_qty || 0;
              return {
                ...r,
                formats: {
                  ...safeFormats,
                  [f]: {
                    ...safeFormats[f],
                    warehouse_qty: Math.max(0, currentQty - qty)
                  }
                }
              };
            }
            return r;
          })
        };
      });
    }

    // Update band inventory level
    setLabelRosterData(prev => prev.map(b => {
      if (b.id === activeRestockBand.id) {
        const nextInv = Math.min(100, b.inventory_level + Math.ceil(qty / 2));
        return { ...b, inventory_level: nextInv };
      }
      return b;
    }));

    showLocalToast(`WAREHOUSE RESTOCK COMPLETE: ${qty} units of stock transferred to ${activeRestockBand.name}.`);
    setActiveRestockBand(null);
  };

  // Open Add Event modal with default dates & fields cleared
  const handleOpenAddEventModal = () => {
    setEditingEvent(null);
    setFormTitle('');
    setFormDate(`${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-15`);
    setFormBandId('general');
    setFormType('LIVE');
    setFormDetails('');
    setFormImmediateAction(false);
    setIsAddEventModalOpen(true);
  };

  // Populate form with existing event values for editing
  const handleStartEditEvent = (event: any) => {
    setEditingEvent(event);
    setFormTitle(event.title);
    setFormDate(event.date);
    setFormBandId(event.bandId || 'general');
    setFormType(event.type);
    setFormDetails(event.details || '');
    setFormImmediateAction(event.immediateAction || false);
    setIsAddEventModalOpen(true);
  };

  // Commit dynamic additions or alterations to the events log
  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    let bName = 'GENERAL LABEL TASK';
    if (formBandId !== 'general') {
      const matchBand = labelRosterData.find(b => b.id === formBandId);
      if (matchBand) {
        bName = matchBand.name;
      }
    }

    let eColor = 'bg-[#0ea5e9]';
    let eTextColor = 'text-sky-400';
    let eBorderColor = 'border-sky-500/30';
    let eBgColor = 'bg-sky-500/10';

    if (formType === 'LIVE') {
      eColor = 'bg-emerald-500';
      eTextColor = 'text-emerald-400';
      eBorderColor = 'border-emerald-500/30';
      eBgColor = 'bg-emerald-500/10';
    } else if (formType === 'STUDIO') {
      eColor = 'bg-purple-500';
      eTextColor = 'text-purple-400';
      eBorderColor = 'border-purple-500/30';
      eBgColor = 'bg-purple-500/10';
    } else if (formType === 'STREET_DATE') {
      eColor = 'bg-[#FF9900]';
      eTextColor = 'text-[#FF9900]';
      eBorderColor = 'border-[#FF9900]/30';
      eBgColor = 'bg-[#FF9900]/10';
    } else if (formType === 'PRODUCTION') {
      eColor = 'bg-blue-500';
      eTextColor = 'text-blue-400';
      eBorderColor = 'border-blue-500/30';
      eBgColor = 'bg-blue-500/10';
    }

    if (editingEvent) {
      setProductionEvents(prev => prev.map(evt => {
        if (evt.id === editingEvent.id) {
          return {
            ...evt,
            title: formTitle.toUpperCase(),
            date: formDate,
            bandId: formBandId,
            bandName: bName,
            type: formType,
            color: eColor,
            textColor: eTextColor,
            borderColor: eBorderColor,
            bgColor: eBgColor,
            details: formDetails,
            immediateAction: formImmediateAction
          };
        }
        return evt;
      }));
      showLocalToast(`SUCCESS: UPDATED EVENT "${formTitle.toUpperCase()}"`);
    } else {
      const newId = `e-${Date.now()}`;
      const newEvt = {
        id: newId,
        title: formTitle.toUpperCase(),
        date: formDate,
        bandId: formBandId,
        bandName: bName,
        type: formType,
        color: eColor,
        textColor: eTextColor,
        borderColor: eBorderColor,
        bgColor: eBgColor,
        details: formDetails,
        immediateAction: formImmediateAction
      };
      setProductionEvents(prev => [...prev, newEvt]);
      showLocalToast(`SUCCESS: REGISTERED EVENT "${formTitle.toUpperCase()}"`);
    }

    setIsAddEventModalOpen(false);
    setEditingEvent(null);
    setFormTitle('');
    setFormDetails('');
    setFormImmediateAction(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          try {
            const compressed = await compressImage(event.target.result, 800, 800, 0.92);
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'label-avatar');
            setUserProfile({...userProfile, label_avatar: publicUrl});
          } catch (err) {
            console.error("Avatar upload failed:", err);
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleCoverImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        if (event.target?.result && typeof event.target.result === 'string') {
          try {
            const compressed = await compressImage(event.target.result, 1920, 1080, 0.92);
            const publicUrl = await uploadBase64ToStorage(compressed, 'community-bands', userProfile.id, 'label-banner');
            setUserProfile({...userProfile, label_banner: publicUrl});
          } catch (err) {
            console.error("Banner upload failed:", err);
          }
        }
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  // Message Center / Inbox states for Record Label
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxSubTab, setInboxSubTab] = useState<'conversations' | 'chat'>('conversations');
  const [inboxMessages, setInboxMessages] = useState<Record<string, { id: string; sender: 'me' | 'label' | 'band' | 'sender'; text: string; timestamp: string }[]>>({});
  const [activeInboxChatId, setActiveInboxChatId] = useState<string>('tomb-mold-rep');
  const [inboxReplyDraft, setInboxReplyDraft] = useState('');

  // Global Social Feed & Alliance Following states
  const ALL_BANDS = [
    { id: 'b1', name: 'TOMB MOLD', handle: 'tombmold', isRoster: true, avatarText: 'TM', color: 'text-orange-400 bg-orange-950/20 border-orange-500/30' },
    { id: 'b2', name: 'BLOOD INCANTATION', handle: 'bloodincantation', isRoster: true, avatarText: 'BI', color: 'text-pink-400 bg-pink-950/20 border-pink-500/30' },
    { id: 'b3', name: 'UNDEATH', handle: 'undeath', isRoster: true, avatarText: 'UD', color: 'text-rose-400 bg-rose-950/20 border-rose-500/30' },
    { id: 'b4', name: 'GOREGRIND OVERLORDS', handle: 'goregrind', isRoster: false, avatarText: 'GO', color: 'text-[#39ff14] bg-emerald-950/20 border-emerald-500/30' },
    { id: 'b5', name: 'NECROSYNTH CULT', handle: 'necrosynth', isRoster: false, avatarText: 'NC', color: 'text-[#eab308] bg-yellow-950/20 border-yellow-500/30' },
    { id: 'b6', name: 'CREEPING DEATH', handle: 'creepingdeath', isRoster: false, avatarText: 'CD', color: 'text-[#00ffcc] bg-cyan-950/20 border-cyan-500/30' },
  ];

  const [followedBandIds, setFollowedBandIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('label_followed_bands');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return Array.from(new Set([...parsed]));
        }
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('label_followed_bands', JSON.stringify(followedBandIds));
    profileStore.setItem('label_followed_bands', followedBandIds).catch((e) => console.error(e));
  }, [followedBandIds]);

  // Label Public Profile Info State
  const [labelPublicProfile, setLabelPublicProfile] = useState(() => {
    const cached = localStorage.getItem('label_public_profile');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (e) {}
    }
    return {
      name: ((userProfile as any).label_company_name || "NEXUS CORE RECORDS").toUpperCase(),
      handle: "nexus_core_records",
      bio: "Pioneering the next wave of underground sound. Specializing in grindcore, doom, and industrial electronic fusion. Staging boundary-pushing artists since 2026.",
      location: ((userProfile as any).city_location || "Chicago, IL").toUpperCase(),
      founded: "2026",
      website: "https://nexus-core.io",
      contact: "signings@nexus-core.io",
      acceptsInquiries: true
    };
  });

  // Label Inbound Inbox State (Inquiries and Direct Messages)
  const [inboundInquiries, setInboundInquiries] = useState<any[]>(() => {
    const cached = localStorage.getItem('label_inbound_inbox');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [
      {
        id: 'inq_1',
        type: 'dm',
        senderName: 'grindcore_warrior',
        senderRole: 'fan',
        timestamp: 'June 24, 2026 at 10:15 AM',
        message: 'Yo! I love the latest vinyl releases you guys did. Will there be a restock for the Chicago show or is that stock completely depleted from the warehouse?',
        status: 'unread',
        replies: []
      },
      {
        id: 'inq_2',
        type: 'epk',
        senderName: 'SEWER GASKET',
        senderRole: 'band',
        timestamp: 'June 23, 2026 at 2:40 PM',
        message: 'Hey Nexus Core! We just compiled our new EPK. Our latest demo tracks are raw sludgy grind. We\'d love to join the roster! Pitch: Heavy, feedback-drenched speed slop.',
        epkLink: 'https://epk.sewergasket.band/demo-2026',
        genre: 'Sludge / Grindcore',
        pitch: 'We are a 4-piece from Detroit blending slow doom sludge with fast blast beats. We carry our own gear and tour independently.',
        status: 'unread',
        replies: []
      }
    ];
  });

  // Active social subtab: 'timeline' | 'inbox' | 'edit_profile'
  const [socialSubTab, setSocialSubTab] = useState<'timeline' | 'inbox' | 'edit_profile'>('timeline');

  // Selected inquiry for viewing / replying
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null);
  const [inboxReplyText, setInboxReplyText] = useState('');

  useEffect(() => {
    localStorage.setItem('label_public_profile', JSON.stringify(labelPublicProfile));
    profileStore.setItem('label_public_profile', labelPublicProfile).catch((e) => console.error(e));
  }, [labelPublicProfile]);

  useEffect(() => {
    localStorage.setItem('label_inbound_inbox', JSON.stringify(inboundInquiries));
    profileStore.setItem('label_inbound_inbox', inboundInquiries).catch((e) => console.error(e));
  }, [inboundInquiries]);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'label_inbound_inbox' && e.newValue) {
        try {
          setInboundInquiries(JSON.parse(e.newValue));
        } catch (err) {}
      }
      if (e.key === 'label_public_profile' && e.newValue) {
        try {
          setLabelPublicProfile(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSendInquiryInboxReply = (inquiryId: string) => {
    if (!inboxReplyText.trim()) return;
    const updated = inboundInquiries.map(inq => {
      if (inq.id === inquiryId) {
        const replies = inq.replies || [];
        return {
          ...inq,
          status: 'replied' as const,
          replies: [
            ...replies,
            {
              id: 'rep_' + Date.now(),
              sender: 'label' as const,
              message: inboxReplyText.trim(),
              timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
            }
          ]
        };
      }
      return inq;
    });
    setInboundInquiries(updated);
    setInboxReplyText('');
    showLocalToast("REPLY TRANSMITTED TO CENTRAL RECIPIENT NODE! 🛰️");
  };

  const handleUpdateInquiryStatus = (inquiryId: string, newStatus: string) => {
    const updated = inboundInquiries.map(inq => {
      if (inq.id === inquiryId) {
        return { ...inq, status: newStatus };
      }
      return inq;
    });
    setInboundInquiries(updated);
    if (newStatus === 'signed') {
      showLocalToast("ROSTER EXPANSION SIGNAL TRANSMITTED! ✍️ STATUS: SIGNED");
    } else {
      showLocalToast(`INQUIRY DISPOSITION UPDATED: ${newStatus.toUpperCase()}`);
    }
  };

  const handleSaveLabelProfile = (updatedProfile: any) => {
    setLabelPublicProfile(updatedProfile);
    showLocalToast("LABEL PUBLIC PROFILE CACHE FLUSHED SUCCESSFULLY! 🌐");
  };

  const [INBOX_CHANNELS, setInboxChannels] = useState([
    {
      id: 'tomb-mold-rep',
      name: 'Tomb Mold Representative (Max)',
      category: 'Tour Logistics / Distro Inquiry',
      avatarText: 'TM',
      badgeColor: 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
    },
    {
      id: 'blood-incantation-manager',
      name: 'Blood Incantation Manager (Paul)',
      category: 'Album Campaign Planning',
      avatarText: 'BI',
      badgeColor: 'border-rose-500 text-rose-400 bg-rose-950/20'
    },
    {
      id: 'nexus-pr-coordinator',
      name: 'Nexus PR Agency (Sarah)',
      category: 'Global Press & Reviews Coordination',
      avatarText: 'PR',
      badgeColor: 'border-amber-500 text-amber-400 bg-amber-950/20'
    }
  ]);

  // Get active thread messages including initial prompts if empty
  const getThreadMessages = () => {
    const msgs = inboxMessages[activeInboxChatId] || [];
    if (msgs.length === 0) {
      if (activeInboxChatId === 'tomb-mold-rep') {
        return [
          {
            id: 'tm-init-1',
            sender: 'sender',
            text: "Hey! We are starting our continental tour in three weeks. We've got fans asking if the new LP pressings will arrive at the venues in time, or if we will have to run empty tables. Can you double check with the plant?",
            timestamp: 'Yesterday, 3:45 PM'
          }
        ];
      }
      if (activeInboxChatId === 'blood-incantation-manager') {
        return [
          {
            id: 'bi-init-1',
            sender: 'sender',
            text: "Hi Paul here. We finalized the track sequence and space ambient synth layers. Our PR contact wanted to know the absolute cutoff for Decibel Magazine's print lead time so we can secure the cover feature. Let's arrange a call.",
            timestamp: 'Yesterday, 1:12 PM'
          }
        ];
      }
      if (activeInboxChatId === 'nexus-pr-coordinator') {
        return [
          {
            id: 'pr-init-1',
            sender: 'sender',
            text: "Hello team. Decibel and Metal Injection are fully onboard for exclusive premiere streams. We need the final mastered audio files and the print-ready sleeve artwork uploaded by Friday to stay on track. Let me know once they're inside the core vault.",
            timestamp: '2 days ago'
          }
        ];
      }
    }
    return msgs;
  };

  // Synchronize inbox messages with localStorage
  useEffect(() => {
    const loadInboxMessages = () => {
      try {
        const saved = localStorage.getItem('nexus_label_chat_messages');
        const parsed = saved ? JSON.parse(saved) : {};
        
        // Populate initial chats if empty
        const defaultChannels = ['tomb-mold-rep', 'blood-incantation-manager', 'nexus-pr-coordinator'];
        let changed = false;
        defaultChannels.forEach(chanId => {
          if (!parsed[chanId]) {
            if (chanId === 'tomb-mold-rep') {
              parsed[chanId] = [
                {
                  id: 'tm-init-1',
                  sender: 'sender',
                  text: "Hey! We are starting our continental tour in three weeks. We've got fans asking if the new LP pressings will arrive at the venues in time, or if we will have to run empty tables. Can you double check with the plant?",
                  timestamp: 'Yesterday, 3:45 PM'
                }
              ];
            } else if (chanId === 'blood-incantation-manager') {
              parsed[chanId] = [
                {
                  id: 'bi-init-1',
                  sender: 'sender',
                  text: "Hi Paul here. We finalized the track sequence and space ambient synth layers. Our PR contact wanted to know the absolute cutoff for Decibel Magazine's print lead time so we can secure the cover feature. Let's arrange a call.",
                  timestamp: 'Yesterday, 1:12 PM'
                }
              ];
            } else if (chanId === 'nexus-pr-coordinator') {
              parsed[chanId] = [
                {
                  id: 'pr-init-1',
                  sender: 'sender',
                  text: "Hello team. Decibel and Metal Injection are fully onboard for exclusive premiere streams. We need the final mastered audio files and the print-ready sleeve artwork uploaded by Friday to stay on track. Let me know once they're inside the core vault.",
                  timestamp: '2 days ago'
                }
              ];
            }
            changed = true;
          }
        });
        
        if (changed) {
          localStorage.setItem('nexus_label_chat_messages', JSON.stringify(parsed));
        profileStore.setItem('nexus_label_chat_messages', parsed).catch((e) => console.error(e));
        }
        
        setInboxMessages(parsed);
      } catch (e) {
        console.warn('Failed to load label inbox messages:', e);
      }
    };

    loadInboxMessages();

    let interval: any;
    if (isInboxOpen) {
      interval = setInterval(loadInboxMessages, 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isInboxOpen]);

  const handleSendInboxReply = (textToSubmit?: string) => {
    const rawTxt = textToSubmit || inboxReplyDraft;
    if (!rawTxt.trim()) return;

    const myId = activeInboxChatId;
    const currentList = inboxMessages[myId] || [];
    const finalCurrentList = currentList.length === 0 ? getThreadMessages() : currentList;

    const newMsg = {
      id: `label-${Date.now()}`,
      sender: 'label' as const,
      text: rawTxt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedList = [...finalCurrentList, newMsg];
    const updatedMessages = {
      ...inboxMessages,
      [myId]: updatedList
    };

    setInboxMessages(updatedMessages as any);
    localStorage.setItem('nexus_label_chat_messages', JSON.stringify(updatedMessages));
        profileStore.setItem('nexus_label_chat_messages', updatedMessages).catch((e) => console.error(e));
    setInboxReplyDraft('');

    // Simulate response with automatic replies after 2 seconds
    setTimeout(() => {
      let simulatedResponse = "Received and acknowledged. Let me double check with our core administration and keep you synchronized.";
      
      if (myId === 'tomb-mold-rep') {
        const responses = [
          "Awesome! That's exactly what we wanted to hear. Running empty merch tables is a nightmare. Thanks for getting that scheduled!",
          "Perfect, the venue list is updated. We'll cross-reference with cargo tonight.",
          "Brilliant! Appreciate the fast feedback. We're finalizing our setlists tonight.",
          "Outstanding support as always. We'll confirm receipt as soon as the first shipment touches ground."
        ];
        simulatedResponse = responses[Math.floor(Math.random() * responses.length)];
      } else if (myId === 'blood-incantation-manager') {
        const responses = [
          "Sounds like a plan! Let me run that schedule by Paul. We'll synchronize tomorrow morning.",
          "Excellent, the exclusive preview draft is ready. I'll forward the private streaming link now.",
          "That lead time is tight but fully doable. Press release coordinates have been finalized.",
          "Excellent! Let's lock in those media interviews."
        ];
        simulatedResponse = responses[Math.floor(Math.random() * responses.length)];
      } else if (myId === 'nexus-pr-coordinator') {
        const responses = [
          "Perfect! I received the high-res link. Sent everything straight to the reviews editor.",
          "Perfect! Decibel loves the cover design. We're finalizing the page layout draft.",
          "This looks excellent. Confirming stems are locked. I'll set up the exclusive page tomorrow."
        ];
        simulatedResponse = responses[Math.floor(Math.random() * responses.length)];
      }

      const replyMsg = {
        id: `auto-reply-${Date.now()}`,
        sender: 'sender' as const,
        text: simulatedResponse,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      try {
        const latestSaved = localStorage.getItem('nexus_label_chat_messages');
        const latestParsed = latestSaved ? JSON.parse(latestSaved) : {};
        const freshList = latestParsed[myId] || updatedList;
        const finalUpdatedList = [...freshList, replyMsg];
        const finalParsed = {
          ...latestParsed,
          [myId]: finalUpdatedList
        };
        localStorage.setItem('nexus_label_chat_messages', JSON.stringify(finalParsed));
        profileStore.setItem('nexus_label_chat_messages', finalParsed).catch((e) => console.error(e));
        setInboxMessages(finalParsed);
      } catch (e) {
        console.warn('Failed to save automatic reply:', e);
      }
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#050505] font-sans text-zinc-100 flex flex-col items-center selection:bg-orange-500/30 selection:text-orange-400">
      {/* STICKY TOP HEADER ROW */}
      <div className="sticky top-0 z-20 bg-[#0c0e12]/95 backdrop-blur-md border-b border-zinc-900 w-full shadow-[0_10px_30px_rgba(0,0,0,0.9)] flex flex-col">
        {/* Row 1: BRAND NAVIGATION HEADER */}
        <div className="px-5 py-3 flex items-center justify-between border-b border-[#1b1e25] bg-black">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('ROSTER');
                setSubTab('');
              }}
              className="flex items-center select-none shrink-0 cursor-pointer hover:opacity-85 active:scale-98 transition-all focus:outline-none"
              title="Return to Home Dashboard"
            >
              <img 
                src="https://cyjnpuneruonskfzpmqo.supabase.co/storage/v1/object/public/public-assets/Nexus%20Core%20Long%20Logo%20copy.png" 
                alt="Nexus Core" 
                className="object-contain"
                style={{ width: '154.791px', height: '57.9957px' }}
                referrerPolicy="no-referrer"
              />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('SETTINGS');
                setSubTab('team_subscription');
              }}
              className="rounded-full px-2 py-0.5 flex items-center gap-1.5 transition text-[7.5px] sm:text-[8px] font-mono font-bold uppercase tracking-wider cursor-pointer shadow-sm active:scale-95 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 shadow-orange-500/5 shadow-[0_0_6px_rgba(249,115,22,0.1)]"
            >
              <span className="w-1 h-1 rounded-full animate-pulse bg-orange-500 shadow-[0_0_4px_rgba(249,115,22,0.8)] shrink-0" />
              <span className="hidden sm:inline">Owner</span>
              <span className="sm:hidden font-mono">OWNER</span>
              <span className="text-orange-500/40 text-[7.5px]">•</span>
              <span className="text-orange-400">LEVEL 5 CLEARANCE</span>
            </button>
          </div>
        </div>

        {/* Row 2: V2 Header Row */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-900/60">
          {/* Active stats pill */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 text-[8.5px] font-bold uppercase tracking-wider font-mono shrink-0 transition-all cursor-pointer bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-300 shadow-md"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse shadow-[0_0_8px_#f97316]" />
            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest leading-none mr-0.5">LABELS HQ:</span>
            <span className="truncate max-w-[150px] text-orange-400 font-black uppercase">
              {userProfile.label_roster_count || labelRosterData.length} BANDS
            </span>
          </button>
          
          <div className="flex items-center gap-3">
            {/* Notifications Button */}
            {onOpenNotifications && (
              <button
                type="button"
                onClick={onOpenNotifications}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all text-[8.5px] font-mono font-bold uppercase tracking-wider cursor-pointer"
              >
                <div className="relative">
                  <Bell className="w-3.5 h-3.5" />
                  {notifications && (notifications || []).some(n => !n.is_read) && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_8px_#f97316]" />
                  )}
                </div>
                <span>NOTICES</span>
              </button>
            )}
            
            {/* Interactive Profile Avatar Button */}
            <div className="relative">
              <button 
                type="button"
                onClick={() => setV2RoleMenuOpen(!v2RoleMenuOpen)}
                className="w-8 h-8 rounded-full bg-orange-950/40 border border-orange-500/50 flex items-center justify-center font-black text-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all active:scale-95 overflow-hidden shadow-md cursor-pointer hover:border-orange-400"
              >
                {userProfile.label_avatar ? (
                  <img src={userProfile.label_avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                ) : (
                  <Globe className="w-4 h-4 text-orange-500" />
                )}
              </button>

              <AnimatePresence>
                {v2RoleMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-[99990] bg-black/60 backdrop-blur-[2px]" onClick={() => setV2RoleMenuOpen(false)} />
                    <div className="fixed top-[92px] right-4 sm:right-6 w-80 bg-[#09090b] border border-zinc-800 rounded-2xl p-4 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.95)] z-[99999] text-left animate-in fade-in slide-in-from-top-3 duration-200">
                      <button onClick={() => setV2RoleMenuOpen(false)} className="absolute top-4 right-4 w-6 h-6 flex items-center justify-center bg-black/40 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 text-zinc-500 hover:text-zinc-300 rounded-full transition-all cursor-pointer z-10"><X className="w-3.5 h-3.5" /></button>
                      
                      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
                        <label className="relative shrink-0 cursor-pointer group">
                          <div className="w-10 h-10 rounded-full border border-zinc-800 bg-zinc-900/90 overflow-hidden flex items-center justify-center font-bold text-orange-500 text-sm font-mono uppercase relative">
                            {userProfile.label_avatar ? (
                              <img src={userProfile.label_avatar} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                            ) : (
                              <Globe className="w-4 h-4 text-orange-500" />
                            )}
                            <input type="file" accept="image/*" className="hidden" onChange={(e) => { handleImageUpload(e); setV2RoleMenuOpen(false); }} />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[7px] uppercase font-bold text-orange-400">
                              Edit
                            </div>
                          </div>
                        </label>
                        <div className="flex-grow min-w-0">
                          <p className="text-xs font-black text-zinc-100 truncate uppercase tracking-tight">
                            {userProfile.label_company_name || 'NEXUS LABEL HQ'}
                          </p>
                          <p className="text-[8.5px] text-zinc-500 font-mono truncate">
                            slug: {userProfile.label_url_slug || 'hq'}
                          </p>
                        </div>
                        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[8px] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider shrink-0">
                          SECURE NODE
                        </span>
                      </div>

                      <div className="pt-3 pb-3 border-b border-zinc-800/80">
                        <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase mb-1.5">CONSOLE ARCHITECTURE</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            disabled
                            className="flex items-center justify-center py-2 rounded-xl bg-orange-950/20 border border-orange-500/50 text-orange-400 font-black font-mono tracking-wider text-[9px]"
                          >
                            ⚙️ V2 CONSOLE
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (setPortalActiveTab) {
                                setPortalActiveTab('social');
                              } else {
                                setActiveTab('SOCIAL');
                              }
                              if (typeof setSubTab === 'function') {
                                setSubTab('social');
                              }
                              setV2RoleMenuOpen(false);
                              
                              const profilePayload = {
                                id: userProfile?.id,
                                name: userProfile.label_company_name || userProfile.name || 'NEXUS CORE RECORDS',
                                avatar: userProfile.label_avatar || userProfile.avatar_url || '',
                                role: 'label',
                                isYou: true
                              };

                              // Dispatch immediately
                              window.dispatchEvent(new CustomEvent('openPublicProfile', { detail: profilePayload }));
                              
                              // Also dispatch with a short timeout to handle lazy rendering of the social feed component
                              setTimeout(() => {
                                window.dispatchEvent(new CustomEvent('openPublicProfile', { detail: profilePayload }));
                              }, 200);
                            }}
                            className="flex items-center justify-center py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 font-black font-mono tracking-wider text-[9px] cursor-pointer shadow-[0_0_8px_rgba(249,115,22,0.3)] transition-all"
                          >
                            🌐 VIEW PROFILE
                          </button>
                        </div>
                      </div>

                      <div className="pt-3 pb-3 border-b border-zinc-800/80 space-y-2">
                        <span className="block text-[8px] font-mono font-black text-zinc-500 tracking-wider uppercase">SWITCH ACTIVE PORTAL</span>
                        <div className="grid grid-cols-1 gap-1">
                          {[
                            { key: 'industry_pro', icon: '🎟️', name: 'Industry Pro', desc: 'Active social environment', bgClass: 'bg-rose-950/40 text-rose-400 border-rose-500/30', hoverBorderClass: 'hover:border-rose-500/50', textClass: 'text-rose-400', activeIndicator: 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' },
                            { key: 'fan_only', icon: '💙', name: 'Fan-Only Profile', desc: 'Royal Blue fan community', bgClass: 'bg-blue-950/40 text-blue-400 border-blue-500/30', hoverBorderClass: 'hover:border-blue-500/50', textClass: 'text-blue-400', activeIndicator: 'bg-cyan-500 shadow-[0_0_8px_#06b6d4]' },
                            { key: 'band', icon: '🎸', name: 'Band / Artist Workspace', desc: 'Lineup, repertoire & presets', bgClass: 'bg-[#39ff14]/10 text-[#39ff14] border-[#39ff14]/30', hoverBorderClass: 'hover:border-[#39ff14]/50', textClass: 'text-[#39ff14]', activeIndicator: 'bg-[#39ff14] shadow-[0_0_8px_#39ff14]' },
                            { key: 'promoter', icon: '🏟️', name: 'Venue Promoter Gateway', desc: 'Calendars, lineups & finance', bgClass: 'bg-yellow-950/40 text-yellow-400 border-yellow-500/30', hoverBorderClass: 'hover:border-yellow-500/50', textClass: 'text-yellow-400', activeIndicator: 'bg-yellow-500 shadow-[0_0_8px_#eab308]' },
                            { key: 'creative', icon: '🛠️', name: 'Creative Hub & Crew', desc: 'Contracts, portfolio & sound crew', bgClass: 'bg-fuchsia-950/40 text-fuchsia-400 border-fuchsia-500/30', hoverBorderClass: 'hover:border-fuchsia-500/50', textClass: 'text-fuchsia-400', activeIndicator: 'bg-fuchsia-500 shadow-[0_0_8px_#d946ef]' },
                            { key: 'label', icon: '💿', name: 'Record Label Console', desc: 'Oversee rosters & releases', bgClass: 'bg-orange-950/40 text-orange-400 border-orange-500/30', hoverBorderClass: 'hover:border-orange-500/50', textClass: 'text-orange-400', activeIndicator: 'bg-orange-500 shadow-[0_0_8px_#f97316]' }
                          ].map((portal, idx) => {
                            const registeredWorkspaces = userProfile?.registered_workspaces || [];
                            const allowedWorkspaces = userProfile?.allowed_workspaces || [];
                            const currentRole = userProfile?.active_workspace || userProfile?.account_type;
                            const isActive = currentRole === portal.key || (portal.key === 'fan_only' && (currentRole === 'fan' || currentRole === 'fan_only')) || (portal.key === 'industry_pro' && (currentRole === 'industry_pro' || currentRole === 'industry pro'));
                            const isIndustryPro = userProfile?.account_type === 'industry_pro' ||
                              ['band', 'promoter', 'creative', 'label'].includes(userProfile?.account_type) ||
                              ['band', 'promoter', 'creative', 'label'].some(w => hasRegisteredWorkspace(userProfile, w));

                            if (portal.key === 'fan_only' && isIndustryPro) {
                              return (
                                <div key={`portal-locked-${portal.key}-${idx}`} className="w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950/20 border border-zinc-900/30 text-zinc-650 opacity-40 select-none cursor-not-allowed">
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
                            const isAllowed = (portal.key === 'industry_pro' || portal.key === 'fan' || portal.key === 'fan_only') || (
                              hasRegisteredWorkspace(userProfile, portal.key) || 
                              (userProfile?.email === 'admin@nexus.com' || userProfile?.account_type === 'admin')
                            );

                            if (isActive) {
                              return (
                                <div key={`portal-active-${portal.key}-${idx}`} className={`w-full flex items-center justify-between p-2 rounded-xl ${portal.bgClass} border ${portal.hoverBorderClass.replace('hover:', '')} ${portal.textClass}`}>
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs">{portal.icon}</span>
                                    <div className="text-left">
                                      <p className="text-[10px] font-black uppercase tracking-wider">{portal.name}</p>
                                      <p className="text-[8px] opacity-80 font-mono leading-none">Active Environment</p>
                                    </div>
                                  </div>
                                  <span className={`w-1.5 h-1.5 rounded-full ${portal.activeIndicator} animate-pulse`} />
                                </div>
                              );
                            }

                            if (isAllowed) {
                              return (
                                <button
                                  key={`portal-btn-${portal.key}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setV2RoleMenuOpen(false);
                                    const targetAcc = (portal.key === 'fan' || portal.key === 'fan_only') ? 'fan_only' : (portal.key === 'industry_pro') ? 'industry_pro' : portal.key;
                                    const updated = { ...userProfile, account_type: targetAcc as any, active_workspace: portal.key as any };
                                    setUserProfile(updated);
                                    try { localStorage.setItem('nexus_core_user_profile', JSON.stringify(updated)); } catch (_) {}
                                    window.dispatchEvent(new CustomEvent('nexus_core_user_profile_updated', { detail: updated }));
                                    triggerNotification?.(`⚡ Switched to ${portal.name}.`);
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 ${portal.hoverBorderClass} text-zinc-400 hover:text-white transition-all cursor-pointer group`}
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

                            // Not allowed/locked
                            return (
                              <button
                                key={`${portal.key}-${idx}`}
                                type="button"
                                onClick={() => {
                                  setV2RoleMenuOpen(false);
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

                      <div className="pt-3">
                        <button
                          onClick={onLogout}
                          className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-950/10 hover:bg-rose-950/20 text-rose-400 font-bold hover:text-white text-center transition-all cursor-pointer active:scale-98"
                        >
                          LOGOUT CORE SESSION
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Glowing Icon Navigation Bar */}
        <div className="flex items-center justify-around px-2 py-1 relative w-full bg-[#0c0e12]">
          {[
            { id: 'ROSTER', label: 'Roster', icon: Users },
            { id: 'CATALOG', label: 'Catalog', icon: Database },
            { id: 'SALES', label: 'Sales', icon: ShoppingCart },
            { id: 'FINANCE', label: 'Finance', icon: TrendingUp },
            { id: 'SOCIAL', label: 'Social', icon: Globe },
            { id: 'SETTINGS', label: 'Settings', icon: Settings },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={`${item.id}-${idx}`}
                type="button"
                onClick={() => {
                  if (item.id === 'SOCIAL') {
                    if (setPortalActiveTab) {
                      setPortalActiveTab('social');
                      return;
                    }
                  }
                  setActiveTab(item.id as any);
                  setSubTab('');
                }}
                className="flex flex-col items-center justify-center w-full py-2 group relative transition-colors cursor-pointer"
              >
                {isActive && (
                  <div className="absolute inset-0 bg-orange-500/10 blur-xl rounded-full w-10 h-10 mx-auto -z-10 animate-pulse" />
                )}
                <IconComponent className={`w-5 h-5 mb-1 transition-all ${
                  isActive
                    ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)] scale-110'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                }`} />
                <span className={`text-[8.5px] font-bold tracking-wider uppercase transition-colors ${
                  isActive ? 'text-orange-500 font-black' : 'text-zinc-500 group-hover:text-zinc-300'
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-8 h-[3px] bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.8)] rounded-t-full absolute bottom-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 4: ACTIVE LABEL CONSOLE BLOCK */}
      <div 
        className="w-full max-w-[1480px] mx-auto px-4 sm:px-6 py-2"
      >
        <div className="flex items-center gap-3 w-full min-w-0 border-b border-zinc-900/60 pb-2">
          <div className="min-w-0 max-w-[calc(100%-140px)] flex-grow">
            <MarqueeText 
              text={userProfile.label_company_name || 'NEXUS LABEL HQ'}
              className="font-display font-black tracking-wider text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.65)] uppercase font-sans text-[18px]"
            />
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/20 bg-orange-950/15 text-orange-400 text-[8.5px] font-bold uppercase tracking-wider font-mono shadow-[0_0_12px_rgba(249,115,22,0.15)] select-none">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-orange-500 shadow-[0_0_8px_#f97316]" />
              <span>LIVE CLOUD SYNC</span>
            </div>
          </div>
        </div>
      </div>

      <main className={`w-full mx-auto flex-1 flex flex-col gap-6 ${
        activeTab === 'SETTINGS'
          ? 'max-w-full p-0 sm:p-0 pb-2'
          : (activeTab === 'SOCIAL') 
            ? 'max-w-full p-0 sm:p-0 pb-16' 
            : 'max-w-[1480px] p-4 sm:p-6 pb-16'
      }`}>
        {/* Content Viewport */}
        
      {/* Sub-Navigation for active primary tab */}
      {(activeTab === 'SALES' || activeTab === 'FINANCE') && (
        <div className="w-full flex justify-center mt-2 mb-4">
          <div className="bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/80 inline-flex items-center gap-1">
            {activeTab === 'SALES' && (
              <>
                <button
                  onClick={() => setSubTab('storefront')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${(!subTab || subTab === 'storefront') ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Storefront
                </button>
                <button
                  onClick={() => setSubTab('warehouse')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${subTab === 'warehouse' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Master Warehouse
                </button>
                <button
                  onClick={() => setSubTab('merchandise-printers')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${subTab === 'merchandise-printers' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Merch Printers
                </button>
              </>
            )}
            {activeTab === 'FINANCE' && (
              <>
                <button
                  onClick={() => setSubTab('royalties')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${(!subTab || subTab === 'royalties') ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Revenue Ledger
                </button>
                <button
                  onClick={() => setSubTab('analytics')}
                  className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${subTab === 'analytics' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  Global Telemetry
                </button>
              </>
            )}
          </div>
        </div>
      )}
      
      <section className="min-h-[500px] w-full">

          {activeTab === 'ROSTER' && (
            <div className="space-y-6">
              {/* MOBILE ONLY PROFILE HEADER */}
              <div className="block lg:hidden orange-chase-border-mobile pulse-glow-orange w-full shadow-2xl mb-6">
                <div className="backdrop-blur-md rounded-[calc(1rem-2px)] bg-[#090b0e]/95 flex flex-col items-center sm:items-stretch justify-between gap-5 relative overflow-hidden p-5 sm:p-6 w-full shadow-2xl border border-zinc-800/10" id="label-profile-card-mobile-v2">
                  {/* Optional Cover Image in Top Half with bottom fade-out */}
                  {userProfile.label_banner && (
                    <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none z-0">
                      <img 
                        src={userProfile.label_banner} 
                        alt="Label Banner" 
                        className="w-full h-full object-cover opacity-35" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/50 to-[#090b0e]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(#f9731607_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" id="label-tonal-mobile" />
                  <div className="absolute top-0 right-1/4 w-[200px] h-[200px] rounded-full bg-[#f97316]/5 blur-[70px] pointer-events-none" />

                  {/* Upper Action Buttons - Administration Tools */}
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 z-20">
                    <label className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#f97316] text-[#f97316]/90 hover:text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsSpecsDrawerOpen(!isSpecsDrawerOpen)}
                      className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#f97316] text-zinc-450 hover:text-white p-2 rounded-xl transition-all cursor-pointer flex items-center justify-center shadow-md shadow-black group"
                      title="REDEFINE LABEL SPECS"
                    >
                      <Settings className="w-4 h-4 text-zinc-400 group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                  </div>

                  {/* Profile Avatar & Primary Identification */}
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left relative z-10 w-full mb-1 mt-6">
                    {/* Profile Picture Upload Indicator */}
                    <label className="relative group shrink-0 cursor-pointer mx-auto sm:mx-0">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f97316] via-[#fdba74] to-[#ffedd5] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 orange-pulse-glow" />
                      <div className="relative w-32 h-32 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/80 flex items-center justify-center shadow-lg group-hover:border-[#f97316] transition-colors orange-pulse-glow">
                        {userProfile.label_avatar ? (
                          <img 
                            src={userProfile.label_avatar} 
                            alt="Logo" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Globe className="w-12 h-12 text-[#f97316] group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {/* Invisible file input */}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white uppercase bg-black/80 px-1 py-0.5 rounded border border-[#f97316]/30">Edit</span>
                        </div>
                      </div>
                    </label>

                    {/* Company Details Stack */}
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <h1 className="text-xl sm:text-2xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center sm:justify-start gap-2">
                        <span>{userProfile.label_company_name || 'NEXUS LABEL HQ'}</span>
                      </h1>
                      
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[10px] sm:text-xs text-zinc-450 font-mono leading-relaxed">
                        <span className="lowercase text-zinc-400 bg-zinc-950/60 px-2.5 py-1 rounded-xl border border-zinc-850 font-sans">
                          nexus-core.app/{userProfile.label_url_slug || 'hq'}
                        </span>
                        <span className="text-zinc-800">•</span>
                        <span className="text-[#f97316] uppercase tracking-wider font-extrabold flex items-center gap-1">
                          🛡️ LLC VERIFIED SECURE NODE
                        </span>
                        <span className="text-zinc-805">•</span>
                        <span className="text-[#00ffcc] font-black flex items-center gap-1 uppercase tracking-wide animate-pulse">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
                          </span>
                          ONLINE
                        </span>
                      </div>

                      {/* Active Operator info */}
                      <div className="pt-2 flex justify-center sm:justify-start">
                        <div className="inline-flex items-center gap-1.5 text-zinc-450 bg-black/40 border border-orange-500/20 px-2.5 py-1 rounded-lg font-mono text-[9px] uppercase tracking-wider">
                          <span className="text-zinc-555">Active Operator:</span>
                          <span className="text-white font-bold">({userProfile?.name || 'Guest'})</span>
                          <span className="text-[#f97316] font-bold">/ {userProfile?.role || 'Operator'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Centered Subscription/Roster details for mobile view */}
                  <div className="flex flex-wrap items-center justify-center gap-4 mt-2 w-full text-[10px] font-mono tracking-wider uppercase z-10">
                    <div className="flex flex-col items-center">
                      <span className="text-[#f97316] font-bold">{userProfile.label_plan_tier === 'APEX' ? 'APEX COMMAND' : userProfile.label_plan_tier === 'SYNDICATE' ? 'SYNDICATE FLEET' : 'DISTRO SEED'}</span>
                      <span className="text-zinc-500 text-[8px]">SUBSCRIPTION TIER</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">{labelRosterData.length} / {userProfile.label_plan_tier === 'APEX' ? 'UNLIMITED' : userProfile.label_plan_tier === 'SYNDICATE' ? '20' : '5'}</span>
                      <span className="text-zinc-500 text-[8px]">ROSTER CAP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">{userProfile.label_trial_period_days || 30} DAYS REMAINING</span>
                      <span className="text-zinc-500 text-[8px]">TRIAL PERIOD</span>
                    </div>
                  </div>

                  {/* Real-time Message Center Card (Mobile) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsInboxOpen(true);
                      setInboxSubTab('conversations');
                    }}
                    className="w-full mt-2 py-3 px-4 rounded-xl border border-orange-500/25 hover:border-orange-500/55 bg-orange-950/20 hover:bg-orange-950/40 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <MessageSquare className="w-4 h-4 text-[#f97316] group-hover:scale-110 group-hover:rotate-6 transition-transform duration-250 animate-pulse" />
                      <div>
                        <span className="block font-bold text-white text-[10px] tracking-wider uppercase">Label Message Center</span>
                        <span className="text-[8.5px] text-zinc-500 block uppercase font-bold mt-0.5">💬 View and reply to direct band discussions</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded text-[10px] uppercase font-black tracking-wider transition-all shadow-md bg-orange-950/80 text-orange-400 border border-orange-500/40 animate-pulse">
                      Active
                    </span>
                  </button>
                </div>
              </div>

              {/* DESKTOP ONLY PROFILE HEADER */}
              <div className="hidden lg:block orange-chase-border pulse-glow-orange w-full shadow-2xl relative mb-6">
                <div className="backdrop-blur-md rounded-[calc(1.5rem-2.2px)] bg-[#090b0e]/95 flex flex-col items-center justify-between gap-6 relative overflow-hidden p-8 w-full animate-fade-in" id="label-profile-card-desktop-v2">
                  {/* Optional Cover Image in Top Half with bottom fade-out */}
                  {userProfile.label_banner && (
                    <div className="absolute top-0 left-0 right-0 h-1/2 overflow-hidden pointer-events-none z-0">
                      <img 
                        src={userProfile.label_banner} 
                        alt="Label Banner" 
                        className="w-full h-full object-cover opacity-35" 
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#090b0e]/50 to-[#090b0e]" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-[radial-gradient(#f9731607_1.5px,transparent_1.5px)] [background-size:12px_12px] opacity-75 pointer-events-none" id="label-tonal-desktop" />
                  <div className="absolute top-0 right-1/4 w-[300px] h-[300px] rounded-full bg-[#f97316]/5 blur-[90px] pointer-events-none" />

                  {/* Action buttons - Administration Tools */}
                  <div className="absolute top-4 right-4 flex items-center gap-2.5 z-20">
                    <label className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#f97316] text-[#f97316]/90 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-black flex items-center gap-1.5 text-[10px] font-mono font-bold tracking-wider uppercase">
                      <Upload className="w-4 h-4" />
                      <span>CHANGE BANNER</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverImageUpload} />
                    </label>

                    <button 
                      type="button"
                      onClick={() => setIsSpecsDrawerOpen(!isSpecsDrawerOpen)}
                      className="bg-zinc-950/60 hover:bg-zinc-850 border border-zinc-800 hover:border-[#f97316] text-[#f97316]/90 hover:text-white p-2.5 rounded-xl transition-all cursor-pointer shadow-md shadow-black group"
                      title="REDEFINE LABEL SPECS"
                    >
                      <Settings className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
                    </button>
                  </div>

                  {/* Central Column Profile Avatar & Visual details */}
                  <div className="flex max-w-7xl flex-col items-center gap-5 text-center relative z-10 w-full animate-fade-in mt-2">
                    <label className="relative group shrink-0 cursor-pointer mx-auto" title="Click to upload/change corporate corporate avatar">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#f97316] via-[#fdba74] to-[#ffedd5] rounded-full blur opacity-65 group-hover:opacity-100 transition duration-300 orange-pulse-glow" />
                      <div className="relative w-48 h-48 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900/85 flex items-center justify-center shadow-lg group-hover:border-[#f97316] transition-colors orange-pulse-glow">
                        {userProfile.label_avatar ? (
                          <img 
                            src={userProfile.label_avatar} 
                            alt="Logo" 
                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <Globe className="w-16 h-16 text-[#f97316] group-hover:scale-110 transition-transform duration-300" />
                        )}
                        {/* Real file upload input triggers on label click */}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-[8px] font-mono font-bold text-white uppercase bg-black/80 px-1.5 py-1 rounded border border-[#f97316]/30">Upload</span>
                        </div>
                      </div>
                    </label>

                    {/* Label Specifications Stack */}
                    <div className="flex flex-col items-center text-center space-y-3 w-full">
                      <h1 className="text-2xl sm:text-3xl font-black font-mono uppercase tracking-tight text-white flex items-center justify-center gap-2">
                        <span>{userProfile.label_company_name || 'NEXUS LABEL HQ'}</span>
                      </h1>

                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-xs font-mono w-full">
                        <div className="lowercase bg-zinc-950/60 px-3.5 py-1.5 rounded-xl border border-zinc-900/50 font-bold text-zinc-400 font-sans">
                          nexus-core.app/{userProfile.label_url_slug || 'hq'}
                        </div>

                        <span className="hidden sm:inline text-zinc-800 font-black">•</span>

                        <div className="text-xs text-zinc-350 font-mono flex items-center justify-center gap-1.5 p-1.5 px-3 bg-[#101319]/80 border border-zinc-900/80 rounded-xl shrink-0">
                          <span className="text-[#f97316] uppercase tracking-wider font-extrabold flex items-center gap-1">
                            🛡️ LLC VERIFIED SECURE NODE
                          </span>
                        </div>

                        <span className="hidden sm:inline text-zinc-800 font-black">•</span>

                        <div className="flex items-center gap-1.5 text-zinc-450 bg-zinc-950/40 px-3 py-1.5 rounded-xl border border-zinc-900/50">
                          <span className="text-[#00ffcc] font-black flex items-center gap-1.5 uppercase tracking-wide animate-pulse">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ffcc]"></span>
                            </span>
                            ONLINE
                          </span>
                        </div>

                        <span className="hidden sm:inline text-zinc-800 font-black">•</span>

                        {/* Active Operator info */}
                        <div className="flex items-center gap-1.5 text-zinc-450 bg-black border border-orange-500/25 px-3 py-1.5 rounded-xl font-mono text-[10px] uppercase shadow-[0_2px_10px_rgba(249,115,22,0.1)]">
                          <span className="text-zinc-555">Active Operator:</span>
                          <span className="text-white font-black">({userProfile?.name || 'Guest'})</span>
                          <span className="text-[#f97316] font-bold">/ {userProfile?.role || 'Operator'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Custom Subscription caps & metadata */}
                  <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-[11px] font-mono tracking-widest uppercase z-10 w-full">
                    <div className="flex flex-col items-center">
                      <span className="text-[#f97316] font-extrabold">{userProfile.label_plan_tier === 'APEX' ? 'APEX COMMAND' : userProfile.label_plan_tier === 'SYNDICATE' ? 'SYNDICATE FLEET' : 'DISTRO SEED'}</span>
                      <span className="text-zinc-500 text-[9px] mt-0.5">SUBSCRIPTION TIER</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">{labelRosterData.length} / {userProfile.label_plan_tier === 'APEX' ? 'UNLIMITED' : userProfile.label_plan_tier === 'SYNDICATE' ? '20' : '5'}</span>
                      <span className="text-zinc-500 text-[9px] mt-0.5">ROSTER CAP</span>
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-zinc-300 font-bold">{userProfile.label_trial_period_days || 30} DAYS REMAINING</span>
                      <span className="text-zinc-500 text-[9px] mt-0.5">TRIAL PERIOD</span>
                    </div>
                  </div>

                  {/* Real-time Message Center Card (Desktop) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsInboxOpen(true);
                      setInboxSubTab('conversations');
                    }}
                    className="w-full max-w-2xl mx-auto mt-2 py-3.5 px-5 rounded-2xl border border-orange-500/20 hover:border-orange-500/55 bg-orange-950/20 hover:bg-orange-950/35 flex items-center justify-between text-left font-mono text-xs text-zinc-300 active:scale-98 transition-all relative z-10 select-none group cursor-pointer focus:outline-none"
                  >
                    <div className="flex items-center gap-3.5">
                      <MessageSquare className="w-5 h-5 text-orange-400 group-hover:scale-110 group-hover:rotate-6 transition-transform duration-250 animate-pulse" />
                      <div>
                        <span className="block font-bold text-white text-[11px] tracking-wider uppercase">Label Message Center</span>
                        <span className="text-[9px] text-[#f97316] block uppercase font-bold mt-0.5">💬 Access direct discussions and booking inquiries with signed bands</span>
                      </div>
                    </div>
                    <span className="px-3 py-1.5 rounded-lg text-[10px] uppercase font-black tracking-wider transition-all shadow-md bg-orange-950/80 text-orange-400 border border-orange-500/40 animate-pulse">
                      Active
                    </span>
                  </button>
                </div>
              </div>

              {/* Roster & Production Calendar Toggle under the Profile Card */}
              <div className="w-full flex justify-center my-4">
                <div className="bg-zinc-900/50 p-1 rounded-lg border border-zinc-800/80 inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSubTab('roster')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${(!subTab || subTab === 'roster') ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Artist Roster
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubTab('calendar')}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${subTab === 'calendar' ? 'bg-orange-500 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    Production Calendar
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ROSTER' && (!subTab || subTab === 'roster') && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-lg font-black tracking-widest text-[#FF9900] uppercase">Active Roster Matrix</h2>
                <button 
                  onClick={() => setIsOnboardModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/30 rounded-md text-[10px] font-mono hover:bg-[#FF9900]/20 transition-all font-bold tracking-wider"
                >
                  + ONBOARD NEW BAND
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {labelRosterData.length === 0 ? (
                  <div className="border border-zinc-800 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center bg-[#05080c] shadow-inner min-h-[200px]">
                    <Users className="w-8 h-8 text-zinc-700 mb-3" />
                    <p className="text-[11px] font-mono text-zinc-555 tracking-wide">NO ARTISTS ALLOCATED YET</p>
                    <p className="text-[9px] font-mono text-zinc-650 mt-2">Initialize a contract module to connect artist portals.</p>
                  </div>
                ) : (
                  [...labelRosterData]
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .map((band, index) => {
                    const isExpanded = !!expandedBands[band.id];
                    
                    const today = new Date().toISOString().split('T')[0];
                    const bandEvents = productionEvents.filter(e => e.bandId === band.id).sort((a, b) => a.date.localeCompare(b.date));
                    const todayEvent = bandEvents.find(e => e.date === today);
                    const nextMilestoneEvent = bandEvents.find(e => e.date >= today);
                    
                    const nextMilestoneString = nextMilestoneEvent
                      ? `${nextMilestoneEvent.type.replace('_', ' ')} - ${nextMilestoneEvent.title.toUpperCase()} (${nextMilestoneEvent.date})`
                      : 'NO UPCOMING MILESTONES REGISTERED';

                    // Automation for status:
                    // If label manually forces OFF-CYCLE or FREEZE, preserve it.
                    // Otherwise, auto-evaluate based on today's calendar event.
                    let effectiveStatus = band.status;
                    if (band.status !== 'OFF-CYCLE' && band.status !== 'FREEZE') {
                      if (todayEvent?.type === 'STUDIO') effectiveStatus = 'STUDIO';
                      else if (todayEvent?.type === 'LIVE' || todayEvent?.type === 'STREET_DATE') effectiveStatus = 'TOURING';
                    }

                    return (
                      <div key={`${band.id}-${index}`} className="relative bg-[#000000] border border-[#FF9900]/45 hover:border-[#FF9900] shadow-[0_0_10px_rgba(255,153,0,0.03)] transition-colors rounded-xl flex flex-col overflow-hidden">
                        <div className="px-4 py-2.5 pr-14 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 relative">
                          <button
                            onClick={() => setExpandedBands(prev => ({ ...prev, [band.id]: !prev[band.id] }))}
                            className="absolute top-1/2 -translate-y-1/2 right-3 p-1.5 rounded border border-zinc-800 hover:border-[#FF9900] text-zinc-400 hover:text-white transition-all bg-zinc-950 flex items-center justify-center cursor-pointer active:scale-95 z-10"
                            title={isExpanded ? "Collapse card details" : "Expand card details"}
                            style={{ marginTop: '-30px' }}
                          >
                            <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#FF9900]' : 'text-zinc-500'}`} />
                          </button>

                          <div 
                            className="min-w-0 flex-1 cursor-pointer select-none group"
                            onClick={() => setExpandedBands(prev => ({ ...prev, [band.id]: !prev[band.id] }))}
                          >
                            <h3 className="text-base sm:text-lg font-black uppercase tracking-widest text-[#FF9900] group-hover:text-white transition-colors break-words flex items-center gap-2">
                              <span style={{ fontSize: '17px' }}>{band.name}</span>
                            </h3>
                            <div className="text-[10px] font-mono text-zinc-550 group-hover:text-zinc-400 transition-colors tracking-widest mt-0.5 lowercase truncate">nexus-core.app/{band.handle}</div>
                          </div>
                          <div className="flex items-center w-full sm:w-auto justify-center sm:justify-end shrink-0">
                            <button
                              onClick={() => {
                                const states = ['SHOW', 'TOURING', 'STUDIO', 'OFF-CYCLE', 'FREEZE'];
                                setLabelRosterData(prev => prev.map(b => {
                                  if (b.id !== band.id) return b;
                                  const nextIndex = (states.indexOf(b.status || 'OFF-CYCLE') + 1) % states.length;
                                  return { ...b, status: states[nextIndex] as any };
                                }));
                              }}
                              className={`w-full sm:w-auto px-3 py-1.5 rounded cursor-pointer transition-all text-[9.5px] font-bold font-mono tracking-widest border shrink-0 text-center active:scale-95 ${effectiveStatus === 'SHOW' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900]/30 hover:bg-[#FF9900]/20' : effectiveStatus === 'TOURING' ? 'bg-[#00FF66]/10 text-[#00FF66] border-[#00FF66]/30 hover:bg-[#00FF66]/20' : effectiveStatus === 'STUDIO' ? 'bg-purple-500/10 text-purple-400 border-purple-500/30 hover:bg-purple-500/20' : effectiveStatus === 'FREEZE' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/20' : 'bg-zinc-800/30 text-zinc-400 border-zinc-700 hover:bg-zinc-800/50'}`}
                              style={{ marginLeft: '36px' }}
                            >
                              {effectiveStatus === 'SHOW' ? '▰ SHOW' : effectiveStatus === 'TOURING' ? '▰ TOURING' : effectiveStatus === 'STUDIO' ? '● STUDIO' : effectiveStatus === 'FREEZE' ? '■ FREEZE' : '▰ OFF-CYCLE'}
                            </button>
                          </div>
                        </div>
                        
                        <div className="w-full h-px bg-[#1A1A1A]" />
                        
                        {/* Always-visible metrics across all cards (collapsed or expanded) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-4 py-3 text-[10px] font-mono items-center">
                          <div>
                            <div className="text-zinc-650 uppercase tracking-widest text-[9px] font-bold" style={{ fontSize: '10px' }}>NEXT MILESTONE:</div>
                            <div className="text-zinc-200 font-bold tracking-wider leading-tight mt-0.5" style={{ fontSize: '11px', width: '256.017px' }}>{nextMilestoneString}</div>
                          </div>
                          <div>
                            <div className="text-zinc-650 uppercase tracking-widest text-[9px] font-bold flex items-center justify-between">
                              <span>VAN STOCK:</span>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveRestockBand(band);
                                  const releases = catalogReleases[band.id] || [];
                                  const apparel = catalogApparel[band.id] || [];
                                  if (releases.length > 0) {
                                    setSelectedRestockItemId(releases[0].id);
                                    setSelectedRestockFormat('vinyl');
                                  } else if (apparel.length > 0) {
                                    setSelectedRestockItemId(apparel[0].id);
                                    setSelectedRestockFormat('apparel');
                                  } else {
                                    setSelectedRestockItemId('');
                                    setSelectedRestockFormat('vinyl');
                                  }
                                  setRestockQty(25);
                                }}
                                className="flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-[#FF9900]/10 text-[#FF9900] hover:bg-[#FF9900]/25 hover:text-white transition-colors border border-[#FF9900]/30 text-[8.5px] active:scale-95 leading-none cursor-pointer font-bold font-mono uppercase"
                              >
                                 <Plus className="w-2.5 h-2.5 text-[#FF9900]" />
                                 RESTOCK
                              </button>
                            </div>
                            <div className="flex flex-col gap-1.5 mt-0.5">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-3 bg-zinc-900 rounded-sm overflow-hidden flex border border-zinc-800">
                                    {Array.from({length: 10}).map((_, i) => (
                                      <div key={`inv-bar-${band.id || band.name || "inv"}-${i}`} className={`flex-1 border-r border-[#000000] last:border-r-0 ${i < Math.round(band.inventory_level / 10) ? 'bg-[#FF9900]' : 'bg-transparent'}`} />
                                    ))}
                                </div>
                                <span className="text-zinc-400 font-bold whitespace-nowrap text-[9px]">{band.inventory_level}%</span>
                              </div>
                              <div className="text-[9px] text-[#00ffcc] font-mono tracking-widest uppercase bg-[#00ffcc]/10 border border-[#00ffcc]/20 px-2 py-1.5 rounded-sm w-full block text-left space-y-1">
                                <div>ACTIVE FLEET VEHICLE: VAN-{band.id.substring(1).padStart(2, '0')}</div>
                                <div>REAL-TIME LOCATION: {effectiveStatus === 'TOURING' ? 'IN_TRANSIT_TO_CHICAGO' : 'HQ_STORAGE_SECURE'}</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <>
                            <div className="w-full h-px bg-[#1A1A1A]" />
                            <div className="flex flex-col px-4 py-3 text-[10px] font-mono bg-zinc-950/20 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
                                <div>
                                  <div className="text-zinc-650 uppercase tracking-widest text-[9px] font-bold" style={{ fontSize: '10px', width: '269.017px' }}>UNSETTLED FUNDS OWED TO ARTIST (WAITING FOR PAYOUT DISBURSEMENT)</div>
                                  <div className="text-emerald-400 font-black tracking-wider mt-0.5" style={{ fontSize: '14px', width: '275.017px' }}>${band.pending_ledger.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                                </div>
                                <div>
                                  <div className="text-zinc-500 uppercase tracking-widest text-[9px] font-bold">CONTRACT MATRIX SPLITS:</div>
                                  <div className="text-zinc-200 font-bold tracking-wider mt-0.5 text-[9px] leading-tight flex flex-col gap-1">
                                    <span className="text-zinc-300" style={{ fontSize: '10px' }}>[{band.revenue_split}% PHYSICAL]</span>
                                    <span className="text-zinc-400" style={{ fontSize: '10px' }}>[{band.digital_split !== undefined ? band.digital_split : 70}% DIGITAL Direct-To-Fan]</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 gap-2 pt-2 border-t border-[#1A1A1A]">
                                <div className="text-[10px] text-zinc-300 font-mono tracking-widest uppercase bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl w-full flex items-center justify-between">
                                  <span className="text-zinc-500 font-bold">ROSTER SLOT UTILIZATION:</span>
                                  <span className="text-[#FF9900] font-black">ALBUM 2 OF 3 DELIVERED UNDER ACTIVE OPTION CONTRACT</span>
                                </div>
                                <div className="text-[10px] text-zinc-300 font-mono tracking-widest uppercase bg-zinc-900 border border-zinc-800 px-3 py-2 rounded-xl w-full flex items-center justify-between">
                                  <span className="text-zinc-500 font-bold">ACTIVE RETURN-ON-INVESTMENT THRESHOLD:</span>
                                  <span className="text-rose-400 font-black">$1,200.00 UNRECOUPED BALANCE PENDING OVERHEAD ACCOUNTING</span>
                                </div>
                              </div>
                            </div>

                             <div className="flex flex-col sm:flex-row border-t border-[#1A1A1A] bg-[#000000]">
                              <button 
                                onClick={() => {
                                  setActivePingBand(band);
                                  setPingMessage('');
                                }}
                                className="flex-1 px-3 py-3 text-[10px] font-mono font-black tracking-widest text-[#FF9900] hover:text-white hover:bg-zinc-900 transition-colors uppercase border-b sm:border-b-0 sm:border-r border-[#1A1A1A] cursor-pointer flex items-center justify-center text-center w-full"
                              >
                                PING BAND
                              </button>
                              <button 
                                onClick={() => {
                                  setActiveShipRoadStockBand(band);
                                  setShipRoadStockQty(50);
                                  setShipRoadStockType('vinyl');
                                }}
                                className="flex-1 px-3 py-3 text-[10px] font-mono font-black tracking-widest text-[#00ffcc] hover:text-white hover:bg-zinc-900 transition-colors uppercase border-b sm:border-b-0 sm:border-r border-[#1A1A1A] cursor-pointer flex items-center justify-center text-center w-full"
                              >
                                SHIP ROAD STOCK
                              </button>
                              <button 
                                onClick={() => {
                                  setActiveReAuditBand(band);
                                  setNewPhysicalSplit(band.revenue_split || 50);
                                  setNewDigitalSplit(band.digital_split !== undefined ? band.digital_split : 70);
                                }}
                                className="flex-1 px-3 py-3 text-[10px] font-mono font-black tracking-widest text-[#a855f7] hover:text-white hover:bg-zinc-900 transition-colors uppercase border-b sm:border-b-0 sm:border-r border-[#1A1A1A] cursor-pointer flex items-center justify-center text-center w-full"
                              >
                                RE-AUDIT SPLIT PERCENT
                              </button>
                              <button 
                                onClick={() => {
                                  if (setPortalActiveTab) {
                                    setPortalActiveTab('social');
                                  } else {
                                    setActiveTab('ROSTER');
                                  }
                                  try {
                                    localStorage.setItem('social_feed_search', band.name);
                                    window.dispatchEvent(new CustomEvent('nexus:navigate-social', { detail: { search: band.name } }));
                                  } catch (e) {}
                                }}
                                className="flex-1 px-3 py-3 text-[10px] font-mono font-black tracking-widest text-[#f472b6] hover:text-white hover:bg-zinc-900 transition-colors uppercase cursor-pointer flex items-center justify-center text-center w-full"
                              >
                                VISIT SOCIAL PROFILE
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
             {activeTab === 'CATALOG' && (!subTab || subTab === 'releases') && (
            <ReleasesCatalogTab
              labelRosterData={labelRosterData}
              setLabelRosterData={setLabelRosterData}
              catalogReleases={catalogReleases}
              setCatalogReleases={setCatalogReleases}
              catalogApparel={catalogApparel}
              setCatalogApparel={setCatalogApparel}
              vanApparelStocks={vanApparelStocks}
              setVanApparelStocks={setVanApparelStocks}
              handleDispatchToVanIndexedDB={handleDispatchToVanIndexedDB}
              showLocalToast={showLocalToast}
              editingReleaseId={editingReleaseId}
              setEditingReleaseId={setEditingReleaseId}
              editingApparelId={editingApparelId}
              setEditingApparelId={setEditingApparelId}
              highlightItemId={highlightItemId}
              setHighlightItemId={setHighlightItemId}
            />
          )}


          {activeTab === 'ROSTER' && subTab === 'calendar' && (
            <div className="space-y-6 w-full">
              {/* COMPRESSED INCOMING ALERT DRAWER ACTION PIPELINE */}
              <div className="relative z-20">
                <button 
                  onClick={() => setIsAlertDrawerOpen(!isAlertDrawerOpen)}
                  className="w-full bg-[#000000] border border-[#1A1A1A] rounded-xl p-3 flex items-center justify-between transition-all hover:border-[#FF9900]/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FF9900]/10 flex items-center justify-center border border-[#FF9900]/30">
                      <Bell className="w-4 h-4 text-[#FF9900]" />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[11px] font-mono font-black text-[#FF9900] uppercase tracking-widest">PENDING INCOMING ROSTER ALERTS</span>
                      <span className="text-[9px] font-mono text-zinc-500">{pendingSyncEvents.length} AWAITING ACTION</span>
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-zinc-500 transition-transform ${isAlertDrawerOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAlertDrawerOpen && (
                  <div className="absolute top-full left-0 w-full mt-2 bg-[#000000] border border-[#1A1A1A] rounded-xl shadow-2xl overflow-hidden z-30 flex flex-col">
                    <div className="p-3 border-b border-[#1A1A1A] flex justify-end">
                      <button
                        onClick={() => {
                          const templates = [
                            {
                              title: "FALL OBLITERATION TOUR - CHICAGO METRO",
                              bandName: "TOMB MOLD",
                              bandId: "b1",
                              date: "2026-10-28",
                              type: "LIVE",
                              details: "Midwest co-headline stop with full logistical support. Merch shipment scheduled."
                            },
                            {
                              title: "COSMIC HEAVENS RELEASE GIG - NEW YORK CITY",
                              bandName: "BLOOD INCANTATION",
                              bandId: "b2",
                              date: "2026-11-12",
                              type: "LIVE",
                              details: "Exclusive intimate album showcase. Venue: Saint Vitus, Brooklyn."
                            },
                            {
                              title: "DECIBEL MAGAZINE TOUR - PHILADELPHIA CO-HEADLINER",
                              bandName: "UNDEATH",
                              bandId: "b3",
                              date: "2026-11-20",
                              type: "LIVE",
                              details: "High priority media-partnered showcase. Standard contract splits apply."
                            }
                          ];

                          const randomTpl = templates[Math.floor(Math.random() * templates.length)];
                          const newId = `ps-sim-${Date.now()}`;
                          const newEvent = {
                            id: newId,
                            title: randomTpl.title,
                            bandId: randomTpl.bandId,
                            bandName: randomTpl.bandName,
                            date: randomTpl.date,
                            type: randomTpl.type,
                            color: "bg-emerald-500",
                            textColor: "text-emerald-400",
                            borderColor: "border-emerald-500/30",
                            bgColor: "bg-emerald-500/10",
                            details: randomTpl.details
                          };

                          setPendingSyncEvents(prev => [...prev, newEvent]);
                          showLocalToast(`SIMULATED: NEW INCOMING CONFIRMED TOUR DATE DETECTED FOR ${randomTpl.bandName}!`);
                        }}
                        className="text-[8.5px] font-mono text-[#00ffcc] hover:text-white uppercase tracking-widest bg-[#1A1A1A]/60 border border-[#1A1A1A] hover:border-[#00ffcc] px-2.5 py-1 rounded-lg transition-all active:scale-95 cursor-pointer"
                      >
                        ⚡ [ SIMULATE ALERT ]
                      </button>
                    </div>

                    {pendingSyncEvents.length === 0 ? (
                      <div className="p-6 text-center text-[10px] font-mono text-zinc-500 uppercase">
                        ZERO PENDING ALERTS DETECTED
                      </div>
                    ) : (
                      <div className="flex flex-col divide-y divide-[#1A1A1A] max-h-[300px] overflow-y-auto">
                        {pendingSyncEvents.map((event, idx) => (
                          <div key={`${event.id}-${idx}`} className="p-4 hover:bg-[#1A1A1A]/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex flex-col font-mono">
                              <div className="text-[11px] font-black text-white uppercase">{event.bandName} • {event.date} • {event.title}</div>
                              <div className="text-[9px] text-zinc-500 uppercase mt-1">"{event.details}"</div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  const newProdEvent = {
                                    id: `e-sync-${Date.now()}-${event.id}`,
                                    title: event.title,
                                    bandId: event.bandId,
                                    bandName: event.bandName,
                                    date: event.date,
                                    type: event.type,
                                    color: event.color,
                                    textColor: event.textColor,
                                    borderColor: event.borderColor,
                                    bgColor: event.bgColor,
                                    details: event.details
                                  };
                                  setProductionEvents(prev => [...prev, newProdEvent]);
                                  setPendingSyncEvents(prev => prev.filter(p => p.id !== event.id));
                                  showLocalToast(`SYNCHRONIZED "${event.title}"`);
                                }}
                                className="px-3 py-1.5 bg-[#000000] text-[#00ffcc] hover:bg-[#00ffcc]/10 border border-[#1A1A1A] hover:border-[#00ffcc]/50 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                              >
                                SYNC EVENT
                              </button>
                              <button
                                onClick={() => {
                                  setPendingSyncEvents(prev => prev.filter(p => p.id !== event.id));
                                  showLocalToast(`DISMISSED "${event.title}"`);
                                }}
                                className="px-3 py-1.5 bg-[#000000] text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 border border-[#1A1A1A] hover:border-rose-500/50 rounded-lg text-[9px] font-mono font-black uppercase tracking-wider transition-all cursor-pointer active:scale-95"
                              >
                                DISMISS
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ARTIST CALENDAR FILTER STRIP */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => setCalendarFilter('ALL')}
                  className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase whitespace-nowrap transition-all border ${calendarFilter === 'ALL' ? 'bg-[#FF9900] text-black border-[#FF9900]' : 'bg-[#000000] text-zinc-500 border-[#1A1A1A] hover:border-zinc-700'}`}
                >
                  SHOW ALL ROSTER
                </button>
                {labelRosterData.map((band, idx) => (
                  <button
                    key={`${band.id}-${idx}`}
                    onClick={() => setCalendarFilter(band.id)}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase whitespace-nowrap transition-all border ${calendarFilter === band.id ? 'bg-[#FF9900] text-black border-[#FF9900]' : 'bg-[#000000] text-zinc-500 border-[#1A1A1A] hover:border-zinc-700'}`}
                  >
                    {band.name}
                  </button>
                ))}
              </div>

              {/* Calendar Module Header with dynamic Month/Year switcher */}
              <div className="flex flex-col items-center justify-center pb-6 pt-4 gap-4">
                <h2 className="text-2xl sm:text-3xl font-black tracking-widest text-[#FF9900] uppercase font-mono text-center shadow-[#FF9900]/20 drop-shadow-md">PRODUCTION CALENDAR</h2>
                
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex items-center bg-[#000000] border border-[#1A1A1A] rounded-xl px-4 py-2 gap-6 shrink-0 shadow-lg">
                    <button
                      onClick={() => {
                        if (currentMonth === 0) {
                          setCurrentMonth(11);
                          setCurrentYear(prev => prev - 1);
                        } else {
                          setCurrentMonth(prev => prev - 1);
                        }
                      }}
                      className="text-zinc-500 hover:text-[#FF9900] font-bold font-mono transition-colors px-2 text-[14px] active:scale-90 cursor-pointer"
                      title="Previous Month"
                    >
                      ◀
                    </button>
                    <span className="text-[14px] font-mono font-black text-white uppercase tracking-widest min-w-[180px] text-center">
                      {['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'][currentMonth]} {currentYear}
                    </span>
                    <button
                      onClick={() => {
                        if (currentMonth === 11) {
                          setCurrentMonth(0);
                          setCurrentYear(prev => prev + 1);
                        } else {
                          setCurrentMonth(prev => prev + 1);
                        }
                      }}
                      className="text-zinc-500 hover:text-[#FF9900] font-bold font-mono transition-colors px-2 text-[14px] active:scale-90 cursor-pointer"
                      title="Next Month"
                    >
                      ▶
                    </button>
                  </div>
                  
                  {/* Visual Legend */}
                  <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-[10px] font-mono tracking-wider font-bold text-zinc-400">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-[#FF9900] rounded-sm shadow-[0_0_8px_rgba(255,153,0,0.5)]" /><span>STREET DATES</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-emerald-500 rounded-sm shadow-[0_0_8px_rgba(16,185,129,0.5)]" /><span>LIVE/TOURING</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-purple-500 rounded-sm shadow-[0_0_8px_rgba(168,85,247,0.5)]" /><span>STUDIO BLOCK</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-blue-500 rounded-sm shadow-[0_0_8px_rgba(59,130,246,0.5)]" /><span>PRODUCTION</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-sky-500 rounded-sm shadow-[0_0_8px_rgba(14,165,233,0.5)]" /><span>GENERAL LABEL</span></div>
                  </div>
                </div>
              </div>

              {/* Dynamic Grid Layout - Full Width Responsive Style with 2px Orange Border and Outer Ambient Glow */}
              <div className="bg-[#000000] border-2 border-[#FF9900] rounded-xl overflow-hidden flex flex-col w-full shadow-[0_0_25px_rgba(255,153,0,0.18)]">
                {/* Calendar Header */}
                <div className="grid grid-cols-7 border-b border-[#1A1A1A] bg-zinc-950">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day, idx) => (
                     <div key={`${day}-${idx}`} className="py-2 text-center text-[9px] sm:text-[10px] font-mono font-black text-zinc-500 tracking-widest border-r border-[#1A1A1A] last:border-0 uppercase">
                       {day}
                     </div>
                  ))}
                </div>
                
                {/* Dynamic Cell Generator */}
                <div className="grid grid-cols-7 auto-rows-[65px] sm:auto-rows-[90px] md:auto-rows-[110px] bg-zinc-900 gap-px border-b border-[#1A1A1A] last:border-0">
                  {(() => {
                    const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
                    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
                    const prevMonthTotalDays = new Date(currentYear, currentMonth, 0).getDate();

                    const cells: { day: number; dateStr: string; isCurrentMonth: boolean }[] = [];

                    // Previous month pad
                    for (let i = 0; i < firstDayIndex; i++) {
                      const dVal = prevMonthTotalDays - firstDayIndex + 1 + i;
                      const pm = currentMonth === 0 ? 11 : currentMonth - 1;
                      const py = currentMonth === 0 ? currentYear - 1 : currentYear;
                      cells.push({
                        day: dVal,
                        dateStr: `${py}-${String(pm + 1).padStart(2, '0')}-${String(dVal).padStart(2, '0')}`,
                        isCurrentMonth: false
                      });
                    }

                    // Current month days
                    for (let dVal = 1; dVal <= totalDays; dVal++) {
                      cells.push({
                        day: dVal,
                        dateStr: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(dVal).padStart(2, '0')}`,
                        isCurrentMonth: true
                      });
                    }

                    // Next month pad
                    const totalCells = cells.length;
                    const remainingCells = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
                    for (let i = 1; i <= remainingCells; i++) {
                      const nm = currentMonth === 11 ? 0 : currentMonth + 1;
                      const ny = currentMonth === 11 ? currentYear + 1 : currentYear;
                      cells.push({
                        day: i,
                        dateStr: `${ny}-${String(nm + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`,
                        isCurrentMonth: false
                      });
                    }

                    return cells.map((cell, idx) => {
                      // Filter match events for this day
                      const dayEvents = productionEvents.filter(e => e.date === cell.dateStr && (calendarFilter === 'ALL' || e.bandId === calendarFilter));

                      return (
                        <div key={`label-cal-cell-${idx}`} className={`bg-[#000000] p-1 sm:p-1.5 flex flex-col justify-between hover:bg-zinc-950/40 transition-colors ${cell.isCurrentMonth ? '' : 'opacity-25'}`}>
                          <div className="text-right text-[9px] sm:text-[10px] font-mono font-bold text-zinc-550 leading-none">{cell.day}</div>
                          
                          {/* Event Markers Container */}
                          <div className="flex flex-col gap-1 overflow-y-auto max-h-[46px] sm:max-h-[64px] md:max-h-[82px] hide-scrollbar select-none">
                            {dayEvents.map((event, idx) => (
                              <div key={`${event.id}-${idx}`} className="w-full">
                                {/* Desktop indicator: Text labels */}
                                <div 
                                  className={`hidden sm:block text-[7.5px] md:text-[8px] font-extrabold font-mono tracking-wider px-1.5 py-0.5 rounded truncate border leading-tight ${event.immediateAction ? 'animate-pulse border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : ''}`}
                                  style={{ 
                                    backgroundColor: event.bgColor, 
                                    color: event.immediateAction ? '#ef4444' : event.textColor, 
                                    borderColor: event.immediateAction ? undefined : event.borderColor 
                                  }}
                                  title={`${event.bandName}: ${event.title}`}
                                >
                                  {event.title}
                                </div>
                                {/* Mobile indicator: solid color thin dash to prevent vertical overflow */}
                                <div 
                                  className="block sm:hidden h-1 w-full rounded-sm"
                                  style={{ 
                                    backgroundColor: event.color === 'bg-[#FF9900]' ? '#FF9900' : event.color === 'bg-emerald-500' ? '#10b981' : event.color === 'bg-purple-500' ? '#a855f7' : event.color === 'bg-blue-500' ? '#3b82f6' : '#0ea5e9' 
                                  }}
                                  title={`${event.bandName}: ${event.title}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* FULL WIDTH GLOWING BUTTON: ADD NEW EVENT */}
              <button
                onClick={handleOpenAddEventModal}
                className="group relative w-full py-3.5 bg-gradient-to-r from-[#FF9900] via-amber-400 to-[#FF9900] hover:brightness-110 active:scale-[0.99] text-black font-mono font-black text-xs sm:text-sm tracking-widest rounded-xl transition-all duration-300 uppercase shadow-[0_4px_25px_rgba(255,153,0,0.35)] cursor-pointer flex items-center justify-center gap-2 select-none border border-amber-300/30 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-[200%] transition-transform duration-1000 ease-in-out" />
                <span className="relative z-10">⚡ ADD NEW EVENT TO CALENDAR</span>
              </button>

              {/* SECONDARY VIEW: ACCORDION CARD STYLE SYSTEM FOR COMPILING MASTER EVENTS DETAILS */}
              <div className="w-full space-y-4 pt-2">
                <div className="border-b border-[#1A1A1A] pb-2 flex items-center justify-between">
                  <h3 className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">
                    DETAILED OPERATIONS LOG • {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][currentMonth]} {currentYear}
                  </h3>
                  <span className="text-[8px] font-mono bg-[#000000] px-2 py-0.5 rounded border border-[#1A1A1A] text-zinc-550 uppercase">
                    Indexed: {productionEvents.filter(e => {
                      const p = e.date.split('-');
                      return parseInt(p[0]) === currentYear && parseInt(p[1]) - 1 === currentMonth && (calendarFilter === 'ALL' || e.bandId === calendarFilter);
                    }).length} Items
                  </span>
                </div>

                {(() => {
                  const filteredList = productionEvents.filter(e => {
                    const p = e.date.split('-');
                    return parseInt(p[0]) === currentYear && parseInt(p[1]) - 1 === currentMonth && (calendarFilter === 'ALL' || e.bandId === calendarFilter);
                  }).sort((a,b) => a.date.localeCompare(b.date));

                  if (filteredList.length === 0) {
                    return (
                      <div className="border border-zinc-900 border-dashed rounded-xl p-6 text-center bg-[#000000]/30">
                        <p className="text-[10px] font-mono text-zinc-650 tracking-wider uppercase">NO MILESTONES REGISTERED FOR THIS TIMATIONAL FRAME</p>
                        <p className="text-[8px] font-mono text-zinc-700 mt-1 uppercase">Switch months using the navigation controls above to review schedule parameters.</p>
                      </div>
                    );
                  }

                  // Determine active expanded ID (default to first/top card if none selected, or selected is not in filteredList)
                  const activeOpenId = openEventId !== null && (filteredList || []).some(e => e.id === openEventId)
                    ? openEventId
                    : (filteredList.length > 0 ? filteredList[0].id : null);

                  return (
                    <div className="flex flex-col gap-3">
                      {filteredList.map((event, idx) => {
                        const dayPart = parseInt(event.date.split('-')[2]);
                        const isBandActive = labelRosterData.find(b => b.id === event.bandId);
                        const isExpanded = activeOpenId === event.id;
                        
                        return (
                          <div 
                            key={`${event.id}-${idx}`}
                            onClick={() => {
                              setOpenEventId(event.id);
                            }}
                            className={`bg-[#000000]/90 border transition-all duration-300 rounded-xl p-4 flex gap-4 relative overflow-hidden group select-none cursor-pointer ${
                              isExpanded 
                                ? event.immediateAction 
                                  ? 'border-red-500 bg-red-950/20 shadow-[0_2px_15px_rgba(239,68,68,0.2)] scale-[1.005] animate-pulse'
                                  : 'border-[#FF9900]/80 bg-zinc-950/20 shadow-[0_2px_15px_rgba(255,153,0,0.06)] scale-[1.005]' 
                                : event.immediateAction
                                  ? 'border-red-600/60 hover:border-red-500 hover:bg-red-950/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                  : 'border-zinc-900 hover:border-zinc-800 hover:bg-zinc-950/40'
                            }`}
                          >
                            {/* Colorful Left Accent Side strip */}
                            <div 
                              className="absolute top-0 left-0 bottom-0 w-1 transition-all" 
                              style={{ 
                                backgroundColor: event.immediateAction ? '#ef4444' : event.color === 'bg-[#FF9900]' ? '#FF9900' : event.color === 'bg-emerald-500' ? '#10b981' : event.color === 'bg-purple-500' ? '#a855f7' : event.color === 'bg-blue-500' ? '#3b82f6' : '#0ea5e9'
                              }}
                            />

                            {/* Chrono Hub Unit Display */}
                            <div className="flex flex-col items-center justify-center bg-zinc-950 border border-zinc-900 rounded-xl w-14 h-14 shrink-0 text-center shadow-inner">
                              <span className="text-[8px] font-mono text-zinc-550 font-extrabold uppercase leading-none tracking-widest">
                                {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'][currentMonth]}
                              </span>
                              <span className="text-xl font-mono font-black text-zinc-100 leading-none mt-1.5">
                                {dayPart}
                              </span>
                            </div>

                            {/* Detailed Text Block layout */}
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-mono font-black uppercase text-[#FF9900] tracking-widest truncate">
                                    {event.bandName}
                                  </span>
                                  <span 
                                    className="text-[7px] font-mono font-black px-1.5 py-0.5 rounded tracking-widest uppercase leading-none border"
                                    style={{ 
                                      backgroundColor: event.bgColor, 
                                      color: event.textColor, 
                                      borderColor: event.borderColor 
                                    }}
                                  >
                                    {event.type}
                                  </span>
                                </div>

                                {/* EDIT PENCIL BUTTON */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleStartEditEvent(event);
                                  }}
                                  className="p-1 px-2.5 rounded bg-zinc-900 hover:bg-[#FF9900] hover:text-black text-zinc-400 text-[8px] font-mono font-black tracking-widest uppercase transition-all flex items-center gap-1 active:scale-95 cursor-pointer border border-zinc-850 hover:border-amber-400"
                                  title="Edit Event Parameters"
                                >
                                  <Edit className="w-2.5 h-2.5" />
                                  <span>EDIT</span>
                                </button>
                              </div>
                              
                              <h4 className={`text-xs font-black uppercase tracking-widest leading-tight transition-colors ${isExpanded ? 'text-[#FF9900]' : 'text-zinc-200 group-hover:text-amber-500'}`}>
                                {event.title}
                              </h4>
                              
                              {/* Expanded / Collapsed view transitions */}
                              {isExpanded ? (
                                <div className="space-y-2.5 pt-2 border-t border-zinc-900/60 mt-2">
                                  <p className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-wider leading-relaxed">
                                    {event.details || 'No detailed log parameters verified.'}
                                  </p>

                                  {event.immediateAction && (
                                    <div className="pt-1 pb-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const highlightId = event.itemIdToHighlight || event.id;
                                          if (event.title.includes('Apparel') || event.title.includes('Merch')) {
                                            setActiveTab('SALES');
                                            setSubTab('warehouse');
                                            setWarehouseBandFilter('ALL_ROSTER');
                                            setHighlightItemId(highlightId);
                                          } else {
                                            setActiveTab('CATALOG');
                                            setSubTab('releases');
                                            setHighlightItemId(highlightId);
                                          }
                                        }}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-mono font-black text-[9px] uppercase tracking-widest rounded transition-colors w-auto inline-flex items-center gap-2 shadow-[0_0_10px_rgba(239,68,68,0.4)]"
                                      >
                                        <Truck className="w-3 h-3" />
                                        RESOLVE DISPATCH ACTION
                                      </button>
                                    </div>
                                  )}

                                  <div className="flex flex-wrap items-center gap-4 text-[8px] font-mono tracking-widest text-zinc-600 font-bold uppercase">
                                    <div className="flex items-center gap-1">
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                      <span>REALTIME INDEXEDDB LIVE SYNC APPROVED</span>
                                    </div>
                                    <span>REF_ID: {event.id}</span>
                                    <span>TARGET TYPE: {event.type}</span>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest mt-1 group-hover:text-zinc-400 transition-all">
                                  + Tap element to inspect operational blueprints
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </div>

              {/* MODAL WINDOW: PORTABLE INLINE OVERLAY */}
              {isAddEventModalOpen && (
                <div 
                  className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                  onClick={() => {
                    setIsAddEventModalOpen(false);
                    setEditingEvent(null);
                  }}
                >
                  <div 
                    className="w-full max-w-lg bg-[#000000] border-2 border-[#FF9900] rounded-xl overflow-hidden shadow-[0_0_30px_rgba(255,153,0,0.3)] animate-in fade-in zoom-in-95 duration-200 relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="absolute inset-x-0 top-0 h-1 bg-[#FF9900]" />
                    
                    {/* Modal Header */}
                    <div className="flex items-center justify-between px-4 py-3.5 border-b border-zinc-900 bg-zinc-950/80">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#FF9900] animate-pulse" />
                        <h3 className="font-mono font-black text-xs tracking-widest uppercase text-white">
                          {editingEvent ? 'EDIT CALENDAR EVENT' : 'ADD NEW CALENDAR EVENT'}
                        </h3>
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          setIsAddEventModalOpen(false);
                          setEditingEvent(null);
                        }}
                        className="p-1 text-zinc-400 hover:text-[#FF9900] rounded hover:bg-zinc-900 transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Form Body */}
                    <form onSubmit={handleSaveEvent} className="p-5 space-y-4">
                      
                      {/* Title */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block font-bold">Event Title / Milestone Description</label>
                        <input
                          type="text"
                          className="w-full bg-[#0c0e12] border border-zinc-850 text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-[#FF9900] font-mono text-xs uppercase"
                          value={formTitle}
                          onChange={(e) => setFormTitle(e.target.value)}
                          placeholder="e.g. EU TOUR - HEAVYWEIGHT SHOWCASE"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Date */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block font-bold">Execution Date</label>
                          <input
                            type="date"
                            className="w-full bg-[#0c0e12] border border-zinc-850 text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-[#FF9900] font-mono text-xs text-white"
                            value={formDate}
                            onChange={(e) => setFormDate(e.target.value)}
                            required
                          />
                        </div>

                        {/* Band Picker or Label Task */}
                        <div className="space-y-1.5">
                          <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block font-bold">Band Scope Allocation</label>
                          <select
                            className="w-full bg-[#0c0e12] border border-zinc-850 text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-[#FF9900] font-mono text-xs uppercase"
                            value={formBandId}
                            onChange={(e) => setFormBandId(e.target.value)}
                          >
                            <option value="general">GENERAL LABEL TASK</option>
                            {labelRosterData.map((band, idx) => (
                              <option key={`${band.id}-${idx}`} value={band.id}>{band.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Category select with visual representation / descriptions */}
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-[#FF9900] block font-black">Entry Category Tagging</label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                          {[
                            { type: 'LIVE', label: 'LIVE SHOW', border: 'border-emerald-500/25 text-emerald-400 bg-emerald-500/5', activeBorder: 'border-emerald-500 text-emerald-400 bg-emerald-500/10' },
                            { type: 'STREET_DATE', label: 'STREET DATE', border: 'border-amber-500/25 text-amber-400 bg-[#FF9900]/5', activeBorder: 'border-[#FF9900] text-[#FF9900] bg-[#FF9900]/10' },
                            { type: 'STUDIO', label: 'STUDIO BLOCK', border: 'border-purple-500/25 text-purple-400 bg-purple-500/5', activeBorder: 'border-purple-500 text-purple-400 bg-purple-500/10' },
                            { type: 'PRODUCTION', label: 'PRODUCTION', border: 'border-blue-500/25 text-blue-400 bg-blue-500/5', activeBorder: 'border-blue-500 text-blue-400 bg-blue-500/10' },
                            { type: 'GENERAL', label: 'GENERAL LP', border: 'border-sky-500/25 text-sky-400 bg-sky-500/5', activeBorder: 'border-sky-500 text-sky-400 bg-sky-500/10' }
                          ].map((cat, idx) => (
                            <button
                              key={`${cat.type}-${idx}`}
                              type="button"
                              onClick={() => setFormType(cat.type)}
                              className={`p-2 rounded-lg border text-center font-mono text-[9px] font-black uppercase transition-all flex items-center justify-center cursor-pointer select-none ${
                                formType === cat.type ? cat.activeBorder : cat.border
                              }`}
                            >
                              {cat.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Immediate Action Flag */}
                      <div className="flex items-center gap-3 mt-4">
                        <input
                          type="checkbox"
                          id="immediateActionFlag"
                          checked={formImmediateAction}
                          onChange={(e) => setFormImmediateAction(e.target.checked)}
                          className="w-4 h-4 bg-[#0c0e12] border-zinc-850 rounded text-[#FF9900] focus:ring-[#FF9900]"
                        />
                        <label htmlFor="immediateActionFlag" className="text-[10px] uppercase font-mono tracking-widest text-red-500 block font-black">
                          FLAG FOR IMMEDIATE LOGISTICS ACTION (RED FLASHING ALERT)
                        </label>
                      </div>

                      {/* Details */}
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-mono tracking-widest text-zinc-400 block font-bold">Operational Logistics / Details</label>
                        <textarea
                          rows={3}
                          className="w-full bg-[#0c0e12] border border-zinc-850 text-zinc-200 px-3 py-2 rounded-lg focus:outline-none focus:border-[#FF9900] font-mono text-xs uppercase"
                          value={formDetails}
                          onChange={(e) => setFormDetails(e.target.value)}
                          placeholder="e.g. logistics details, flight schedules, security protocols"
                        />
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-900">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddEventModalOpen(false);
                            setEditingEvent(null);
                          }}
                          className="px-4 py-2 bg-zinc-950 border border-zinc-850 text-zinc-400 hover:text-white rounded-lg transition-all text-xs font-mono font-bold uppercase select-none cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-5 py-2 bg-[#FF9900] text-black hover:bg-amber-400 hover:shadow-[0_0_12px_rgba(255,153,0,0.5)] rounded-lg transition-all text-xs font-mono font-black uppercase select-none cursor-pointer"
                        >
                          {editingEvent ? 'SAVE CHANGES' : 'COMMIT EVENT'}
                        </button>
                      </div>

                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeTab === 'FINANCE' && (!subTab || subTab === 'royalties') && (
             <div className="space-y-6">
              {/* Toast banner inside viewport context */}
              {localToast && (
                <div className="bg-[#FF9900]/10 border border-[#FF9900]/40 text-[#FF9900] font-mono p-3 rounded-lg text-[10px] tracking-wider uppercase flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 animate-spin" />
                    <span>LEDGER NOTIFY: {localToast}</span>
                  </div>
                  <button onClick={() => setLocalToast(null)} className="text-[#FF9900] hover:text-white text-xs font-bold font-mono">⨉</button>
                </div>
              )}

              {/* SYMMETRICAL METRIC SNAPSHOT STRIP */}
              <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
                <div 
                  className="bg-[#000000] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg"
                  style={{ borderWidth: '1.3px', borderColor: '#ff8900', borderStyle: 'solid' }}
                >
                   <div className="text-[12px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                     0 ACTIVE DISTRO
                   </div>
                   <div className="text-[9px] font-mono text-zinc-600 tracking-wider mt-1.5">REAL-TIME SHIPPING LOGISTICS</div>
                </div>
                <div 
                  className="bg-[#000000] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg"
                  style={{ borderWidth: '1.3px', borderColor: '#ff8900', borderStyle: 'solid' }}
                >
                   <div className="text-[12px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                     $0.00 USD NET
                   </div>
                   <div className="text-[9px] font-mono text-zinc-600 tracking-wider mt-1.5">GLOBAL SYSTEM GROSS LEDGER</div>
                </div>
                <div 
                  className="bg-[#000000] rounded-xl p-4 flex flex-col items-center justify-center text-center shadow-lg"
                  style={{ borderWidth: '1.3px', borderColor: '#ff8900', borderStyle: 'solid' }}
                >
                   <div className="text-[12px] font-mono font-bold tracking-widest text-zinc-300 uppercase">
                     0 PENDING CLAIMS
                   </div>
                   <div className="text-[9px] font-mono text-zinc-600 tracking-wider mt-1.5">UNRESOLVED RELATIONAL REQUESTS</div>
                </div>
              </div>

              {/* MODULE 2: REVENUE LEDGER & COMPLIANCE SPLIT MATRIX */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1A1A1A] pb-4 gap-4">
                <div>
                  <h2 className="text-sm font-black tracking-widest text-[#FF9900] uppercase font-mono">Financial Ledger & Split Settlements</h2>
                  <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase mt-1">Split calculations • Realtime Payout Audits • 1099 Tax Indicators</p>
                </div>
                <button
                  onClick={() => {
                    setVaultBalance(24590.00);
                    showLocalToast("VAULT ARREST AND LEDGER CALIBRATION RESET INITIATED");
                  }}
                  className="p-2 border border-zinc-800 rounded bg-[#0c0e12] hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all text-xs font-mono"
                  title="Recalibrate accounting metrics"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* MASTER VAULT BALANCE & TRANSACTION ENTRY INTRA-GRID */}
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_450px] gap-6 items-stretch">
                {/* SATELLITE MAIN VAULT BALANCE FRAMEWORK */}
                <div className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-center gap-4">
                  <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full filter blur-2xl pointer-events-none animate-pulse" />
                  <div className="space-y-2 z-10">
                    <div className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest font-black flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>MASTER VAULT BALANCE (NET SECURED COFFERS)</span>
                    </div>
                    {/* Glowing neon green font color accent */}
                    <div className="text-4xl sm:text-5xl font-black text-emerald-400 font-sans tracking-tight drop-shadow-[0_0_15px_rgba(52,211,153,0.3)] select-all mb-4">
                      ${vaultBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-xs text-emerald-600 font-mono tracking-widest font-black inline-block ml-1">USD</span>
                    </div>
                    <button
                      onClick={() => {
                        setLabelRosterData(prev => prev.map(band => ({
                          ...band,
                          pending_ledger: 0
                        })));
                        showLocalToast("ALL PENDING ROSTER PAYOUTS DISBURSED VIA STRIPE CONNECT");
                      }}
                      className="w-full mt-4 py-2.5 bg-zinc-900 text-emerald-400 border border-emerald-500/30 font-black text-[10px] font-mono rounded hover:bg-emerald-500/10 transition-colors uppercase active:scale-98 cursor-pointer tracking-widest shadow-[0_0_10px_rgba(52,211,153,0.1)]"
                    >
                      [ DISBURSE ALL PENDING ROSTER PAYOUTS VIA STRIPE CONNECT ]
                    </button>
                  </div>
                </div>

                {/* Live transaction recording form to ensure interactive data updating */}
                <form onSubmit={handleAddTransaction} className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6 space-y-4 shadow-xl flex flex-col justify-between">
                  <div className="text-[10px] font-mono font-black uppercase text-[#FF9900] tracking-widest border-b border-zinc-900 pb-2 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF9900] animate-pulse" />
                    <span>LOG OFFLINE CASH TRANSACTION</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase font-bold font-mono tracking-wider block">Gross Income ($)</label>
                      <input 
                        type="text"
                        placeholder="e.g. 500.00"
                        value={newTxnGross}
                        onChange={(e) => setNewTxnGross(e.target.value)}
                        className="bg-black border border-zinc-800 focus:border-[#FF9900] text-zinc-200 rounded-md py-1.5 px-2.5 text-[10px] font-mono w-full focus:outline-none focus:ring-1 focus:ring-[#FF9900]/20"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase font-bold font-mono tracking-wider block">Payment Source</label>
                      <select
                        value={newTxnSource}
                        onChange={(e) => setNewTxnSource(e.target.value)}
                        className="bg-black border border-zinc-800 text-zinc-400 rounded-md py-1.5 px-2 text-[10px] font-mono w-full focus:outline-none focus:text-white"
                      >
                        <option value="Storefront Web (LP)">Storefront Web (LP)</option>
                        <option value="Streaming Platform Link">Streaming Link</option>
                        <option value="Merch Table POS">Merch POS</option>
                        <option value="Bandcamp Web Portal">Bandcamp</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[8px] text-zinc-500 uppercase font-bold font-mono tracking-wider block">Artist Split Profile</label>
                      <select
                        value={newTxnBandId}
                        onChange={(e) => setNewTxnBandId(e.target.value)}
                        className="bg-black border border-zinc-800 text-zinc-400 rounded-md py-1.5 px-2 text-[10px] font-mono w-full focus:outline-none focus:text-white"
                      >
                        {labelRosterData.map((b, bIdx) => (
                          <option key={`${b.id}-${bIdx}`} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      className="w-full py-2 bg-[#FF9900] text-black font-black text-[10px] font-mono rounded-md hover:bg-white transition-colors uppercase active:scale-98 cursor-pointer text-center tracking-wider"
                    >
                      [ INGEST TRANSACTION ACTION ➜ ]
                    </button>
                  </div>
                </form>
              </div>

              {/* Split compliance check section (Module 2 part 2) */}
              <div className="space-y-6">
                
                {/* Real-time transaction history ledger table */}
                <div className="w-full bg-zinc-950/40 border border-zinc-850 rounded-2xl p-6 space-y-4 shadow-xl">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <span className="text-[10px] font-mono font-black text-zinc-400 uppercase tracking-widest">
                      LIVE PAYOUT STREAM
                    </span>
                    <span className="text-[8px] font-mono text-zinc-650 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded font-bold">
                      INGESTED: {transactions.length} ACTIONS
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-[10.5px] font-mono">
                      <thead>
                        <tr className="border-b border-zinc-900 text-zinc-500 uppercase text-[9px]">
                          <th className="py-3 font-bold tracking-wider">ID / SOURCE</th>
                          <th className="py-3 font-bold tracking-wider w-28">GROSS FUNDS</th>
                          <th className="py-3 font-bold tracking-wider text-right">ROUTED SPLIT STATS</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-900/60 text-zinc-300">
                        {transactions.map((txn, idx) => {
                          const gross = txn.gross ?? 0;
                          const netValue = gross;
                          
                          const artistPct = txn.splitPct ?? 0;
                          const labelPct = 100 - artistPct;
                          
                          const artistPayout = netValue * (artistPct / 100);
                          const labelPayout = netValue * (labelPct / 100);

                          return (
                            <tr key={`${txn.id}-${idx}`} className="hover:bg-zinc-900/10 transition-colors">
                              <td className="py-4">
                                <div className="text-[#FF9900] font-black">{txn.id}</div>
                                <div className="text-zinc-200 font-bold mt-1">{txn.source}</div>
                                <div className="text-[8px] text-zinc-500 uppercase font-normal mt-0.5">{txn.bandName} • {txn.timestamp}</div>
                              </td>
                              <td className="py-4 font-black text-zinc-150">${gross.toFixed(2)}</td>
                              <td className="py-4 text-right">
                                <div className="text-zinc-400 font-bold">
                                  ARTIST ({artistPct}%): <span className="text-emerald-400 font-black">${artistPayout.toFixed(2)}</span>
                                </div>
                                <div className="text-[8px] text-zinc-650 mt-0.5 mb-1.5 border-b border-zinc-900/50 pb-1.5 inline-block">
                                  LABEL ({labelPct}%): ${labelPayout.toFixed(2)}
                                </div>
                                <div className="mt-1">
                                  {txn.id.charCodeAt(txn.id.length - 1) % 2 === 0 ? (
                                    <span className="text-[8.5px] font-mono tracking-widest text-emerald-500 font-bold">● SETTLED</span>
                                  ) : (
                                    <span className="text-[8.5px] font-mono tracking-widest text-zinc-500 font-bold">○ PROCESSING</span>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 1099-NEC COMPLIANCE AUDIT MONITORING PANEL (UN-NESTED & FULL WIDTH) */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-1">
                    <div className="flex items-center gap-1.5 text-[#FF9900]">
                      <Shield className="w-3.5 h-3.5" />
                      <h3 className="text-xs font-black tracking-widest uppercase font-mono">1099-NEC Compliance Monitor</h3>
                    </div>
                    <span className="text-[8.5px] font-mono text-zinc-550 uppercase bg-zinc-900/40 border border-zinc-850 px-2 py-0.5 rounded font-bold">
                      Monitors artist payouts against calendar year limits.
                    </span>
                  </div>

                  <div className="space-y-4">
                    {labelRosterData.map((band, idx) => {
                      // Calculate cumulative payouts across the transaction register for this band id
                      const cumulativeArtistPayout = transactions
                        .filter(t => t.bandId === band.id)
                        .reduce((sum, t) => {
                          const net = (t.gross ?? 0) * (1 - 0.0777);
                          const artistCut = net * ((t.splitPct ?? 0) / 100);
                          return sum + artistCut;
                        }, 0);

                      const taxProfile = bandTaxProfiles[band.id] || { company_ein: "", taxIdCaptured: false };
                      const isOverExceedLimit = cumulativeArtistPayout > 600;

                      return (
                        <div key={`tax-mon-${band.id}-${idx}`} className="bg-zinc-950/40 border border-zinc-850 p-5 rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-zinc-750">
                          <div className="min-w-0">
                            <span className="text-zinc-200 font-bold block uppercase text-sm">{band.name}</span>
                            <div className="text-[8px] font-mono text-zinc-500 uppercase flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                              <span>EIN RECORD STATUS: <span className="font-bold text-zinc-350">{taxProfile.taxIdCaptured ? taxProfile.company_ein : "NONE INSTALLED"}</span></span>
                              <span className="hidden sm:inline text-zinc-700">•</span>
                              <span>ROSTER PATHWAY: <span className="font-bold text-zinc-350">nexus-core.app/{band.handle}</span></span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-xs font-mono">
                            <div className="text-right sm:text-left">
                              <div className="text-[8px] text-zinc-550 uppercase tracking-wider mb-0.5">YTD Cumulative Payout</div>
                              <div className="text-zinc-200 font-bold">${cumulativeArtistPayout.toFixed(2)} USD</div>
                            </div>

                            <div className="min-w-[180px]">
                              {/* Inline 1099-NEC compliance audit indicator string */}
                              {isOverExceedLimit ? (
                                taxProfile.taxIdCaptured ? (
                                  <span className="px-3 py-1.5 rounded-lg bg-emerald-950/30 text-emerald-400 border border-emerald-500/20 font-bold block text-center uppercase text-[9px] tracking-wider">
                                    ✓ [ 1099-NEC COMPLIANT ]
                                  </span>
                                ) : (
                                  <div className="space-y-2">
                                    <span className="px-3 py-1.5 rounded-lg bg-rose-950/30 text-rose-400 border border-rose-500/15 font-black block text-center uppercase animate-pulse text-[9px] tracking-wider">
                                      ⚠️ [ action required: missing ein ]
                                    </span>
                                    <button
                                      onClick={() => {
                                        // Toggle taxIdCaptured for this band
                                        bandTaxProfiles[band.id] = {
                                          company_ein: `XX-XXX${Math.floor(1000 + Math.random() * 9000)}`,
                                          taxIdCaptured: true
                                        };
                                        showLocalToast(`SUCCESSFULLY ACQUIRED AND ENCRYPTED 1099 TAX INGEST FOR ${band.name}`);
                                        setVaultBalance(prev => prev + 0.01); // force parent triggers
                                      }}
                                      className="w-full text-center py-1.5 bg-[#FF9900]/10 border border-[#FF9900]/35 hover:border-[#FF9900] text-[#FF9900] hover:bg-[#FF9900] hover:text-black rounded-lg text-[8.5px] font-bold block uppercase cursor-pointer active:scale-95 transition-all"
                                    >
                                      [ INTEGRATE TAX EIN ]
                                    </button>
                                  </div>
                                )
                              ) : (
                                <span className="px-3 py-1.5 rounded-lg bg-zinc-900/40 text-zinc-550 border border-zinc-950 font-medium block text-center uppercase text-[9px] tracking-wider">
                                  🔒 [ UNDER $600 THRESHOLD ]
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
             </div>
          )}

          {activeTab === 'FINANCE' && subTab === 'analytics' && (
            <div className="space-y-6">
              {/* Toast banner inside viewport context */}
              {localToast && (
                <div className="bg-[#FF9900]/10 border border-[#FF9900]/40 text-[#FF9900] font-mono p-3 rounded-lg text-[10px] tracking-wider uppercase flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 animate-spin" />
                    <span>TELEMETRIC FLITE: {localToast}</span>
                  </div>
                  <button onClick={() => setLocalToast(null)} className="text-[#FF9900] hover:text-white text-xs font-bold font-mono">⨉</button>
                </div>
              )}

              {/* MODULE 3: GLOBAL TELEMETRY & PREDICTIVE APPAREL RUNWAY */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-[#1A1A1A] pb-4 gap-4">
                <div>
                  <h2 className="text-sm font-black tracking-widest text-[#FF9900] uppercase font-mono">Global Telemetry Dashboard</h2>
                  <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase mt-1">Satellite Listening Clusters • Predictive Merch Depot Analysis</p>
                </div>
                <div className="px-3.5 py-1 rounded bg-[#000] border border-zinc-900 text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>SATELLITE SYNC: ACTIVE</span>
                </div>
              </div>

              {/* ALGORITHMIC STATUS ALERT LAYOUT ROW: PREDICTIVE APPAREL RUNWAY */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-1">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-[#FF9900]" />
                    <h3 className="text-xs font-black tracking-widest text-[#FF9900] uppercase font-mono">Predictive Apparel Runway Warnings</h3>
                  </div>
                  <span className="text-[8px] font-mono text-zinc-650 uppercase tracking-widest bg-zinc-900 px-2 py-0.5 rounded font-bold">
                    ALGORITHMIC REAL-TIME STOCK BURN DEPLETION PROJECTOR
                  </span>
                </div>

                {/* The predictive marquee row warnings container */}
                <div className="space-y-4">
                  {Object.entries(vanApparelStocks).map(([bandId, statsRaw], idx) => {
                    const stats = statsRaw as {
                      bandName: string;
                      route: string;
                      sizes: { S: number; M: number; L: number; XL: number; '2XL': number };
                      burnRatePerStop: number;
                      nextStopInDays: number;
                      targetRouteSector: string;
                      placeholder?: string;
                    };
                    const rosterObj = labelRosterData.find(b => b.id === bandId);
                    const isTouring = rosterObj?.status === 'TOURING';
                    
                    // Check if apparel size is critical (S, M, L, XL, 2XL) under threshold
                    const sizeCriticalArray: string[] = [];
                    Object.entries(stats.sizes).forEach(([size, qty]) => {
                      if (qty <= 3) {
                        sizeCriticalArray.push(size);
                      }
                    });

                    const burnProjectAlert = sizeCriticalArray.length > 0 && isTouring;
                    const extremelyCriticalAlert = (sizeCriticalArray || []).some(s => stats.sizes[s as keyof typeof stats.sizes] <= 1);

                    return (
                      <div key={`runway-row-${idx}`} className={`p-6 rounded-2xl border text-[10px] font-mono relative overflow-hidden transition-all hover:border-zinc-700/50 shadow-xl ${
                        !isTouring 
                          ? 'bg-zinc-950/20 text-zinc-550 border-zinc-900/60' 
                          : burnProjectAlert 
                            ? extremelyCriticalAlert 
                              ? 'bg-rose-950/30 text-rose-400 border-rose-500/25 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                              : 'bg-amber-950/25 text-amber-500 border-amber-500/20'
                            : 'bg-emerald-950/10 text-emerald-400 border-emerald-500/15'
                      }`}>
                        
                        <div className="flex flex-wrap items-center justify-between gap-2 z-10 relative pb-2 border-b border-zinc-900/40">
                          <div className="flex items-center gap-2.5 font-black text-sm">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              !isTouring ? 'bg-zinc-700' : burnProjectAlert ? extremelyCriticalAlert ? 'bg-rose-500 animate-pulse' : 'bg-amber-400' : 'bg-emerald-400'
                            }`} />
                            <span className="uppercase tracking-wider text-white">{stats.bandName}</span>
                            <span className="px-2 py-0.5 rounded bg-black/60 text-zinc-405 text-[8.5px] font-normal border border-zinc-900">
                              TRACK: {stats.route}
                            </span>
                          </div>

                          <div className="text-[8.5px] uppercase tracking-widest text-[#FF9900] font-bold bg-black px-2.5 py-1 rounded border border-zinc-850">
                            COORD SECTOR: {stats.targetRouteSector}
                          </div>
                        </div>

                        {/* Algorithmic alert marquee text */}
                        <div className="mt-4 font-bold tracking-wide italic leading-relaxed text-xs">
                          {!isTouring ? (
                            <span>SYSTEM SAFE: {stats.bandName} IS CURRENTLY OFF-CYCLE STATUS. INVENTORY PIPELINE DEACTIVATED.</span>
                          ) : burnProjectAlert ? (
                            extremelyCriticalAlert ? (
                              <span className="uppercase text-rose-400">
                                ⚠️ RUNWAY CRITICAL: {stats.bandName} — SIZE {sizeCriticalArray.map(s => `[${s}]`).join(' & ')} stock DEPLETED below burn safety. FORECAST QTY EXHAUSTED BEFORE VEHICLE ARRIVES AT {stats.targetRouteSector} (NEXT STOP IN {stats.nextStopInDays} DAYS). RESTOCK IMMEDIATELY!
                              </span>
                            ) : (
                              <span className="uppercase text-amber-400">
                                ⚠️ RUNWAY WARNING: {stats.bandName} — SIZES {sizeCriticalArray.map(s => `[${s}]`).join(', ')} INVENTORY BURN VELOCITY IS HIGH. EXPECTED EXHAUSTION NEAR {stats.targetRouteSector} IN {stats.nextStopInDays + 1} DAYS.
                              </span>
                            )
                          ) : (
                            <span className="uppercase text-emerald-400 font-normal">
                              ✓ RUNWAY OPTIMAL: {stats.bandName} CLOTHING LOGISTICS SECURE. CURRENT SIZES STOCKS SUFFICIENT TO CLEAR ALL TOUR COORDINATES.
                            </span>
                          )}
                        </div>

                        {/* Quick stock adjustment handles allowing instant demo of the warning alert marquees */}
                        <div className="mt-4 pt-3.5 w-full border-t border-zinc-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 bg-zinc-950/30 p-3 rounded-xl border border-zinc-900/40">
                          <span className="text-[8px] text-zinc-500 uppercase tracking-widest font-black">Adjust Size Stock Demo:</span>
                          <div className="flex flex-wrap gap-2">
                            {(['S','M','L','XL','2XL'] as const).map((sz, idx) => {
                              const currentVal = stats.sizes[sz];
                              return (
                                <div key={`${sz}-${idx}`} className="flex items-center gap-1.5 bg-black border border-zinc-800 rounded-lg p-1.5 px-2.5 text-[10.5px] font-bold">
                                  <span className="font-bold text-[#FF9900] text-[10px]">{sz}:</span>
                                  <button
                                    onClick={() => handleUpdateVanStockSize(bandId, sz, Math.max(0, currentVal - 1))}
                                    className="px-1 text-zinc-500 hover:text-white font-black cursor-pointer active:scale-90"
                                    title="Decrement size stock"
                                  >
                                    -
                                  </button>
                                  <span className="text-zinc-200 font-black px-1">{currentVal}</span>
                                  <button
                                    onClick={() => handleUpdateVanStockSize(bandId, sz, currentVal + 1)}
                                    className="px-1 text-zinc-500 hover:text-white font-black cursor-pointer active:scale-90"
                                    title="Increment size stock"
                                  >
                                    +
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>

              {/* INTERACTIVE SATELLITE RADAR & ACTIVE TELEMETRY MONITORING STATION */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 pt-2">
                
                {/* RADAR SWEEP & FREQUENCY CONTROLS */}
                <div className="xl:col-span-5 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3 mb-4">
                      <span className="text-[10px] font-mono text-[#FF9900] font-black tracking-widest uppercase flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-[#FF9900] animate-pulse" />
                        [ ORBITAL RADAR SWEEP ]
                      </span>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase">SYS_SCAN_v4.8</span>
                    </div>

                    {/* Radar Screen Container */}
                    <div className="relative w-full aspect-square max-w-[280px] mx-auto bg-black border-2 border-zinc-900 rounded-full overflow-hidden flex items-center justify-center group shadow-inner shadow-black">
                      {/* Radar sweep beam animation */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-[#FF9900]/0 via-[#FF9900]/0 to-[#FF9900]/10 rounded-full animate-spin pointer-events-none" style={{ animationDuration: '4s' }} />
                      
                      {/* Concentric grid circles */}
                      <div className="absolute w-[80%] h-[80%] border border-zinc-900/40 rounded-full pointer-events-none" />
                      <div className="absolute w-[60%] h-[60%] border border-zinc-900/40 rounded-full pointer-events-none" />
                      <div className="absolute w-[40%] h-[40%] border border-zinc-900/40 rounded-full pointer-events-none" />
                      <div className="absolute w-[20%] h-[20%] border border-zinc-900/40 rounded-full pointer-events-none" />
                      
                      {/* Crosshairs */}
                      <div className="absolute w-full h-[1px] bg-zinc-900/30 pointer-events-none" />
                      <div className="absolute h-full w-[1px] bg-zinc-900/30 pointer-events-none" />
                      
                      {/* Blips / Pings */}
                      {[
                        { sector: "AUSION-TX-01", label: "TX", x: '35%', y: '40%' },
                        { sector: "WASHIP-SE-05", label: "SE", x: '25%', y: '25%' },
                        { sector: "DENVER-CO-03", label: "CO", x: '45%', y: '50%' },
                        { sector: "LONDON-UK-02", label: "UK", x: '75%', y: '30%' },
                        { sector: "BERLIN-DE-09", label: "DE", x: '80%', y: '45%' },
                      ].map((p, pIdx) => {
                        const isSelected = selectedTelemetrySector === p.sector;
                        return (
                          <button
                            key={`${p.sector}-${pIdx}`}
                            type="button"
                            onClick={() => {
                              setSelectedTelemetrySector(p.sector);
                              setSatelliteLogs(prev => [
                                `[SECTOR] Locked listening cluster onto Sector ${p.sector}`,
                                ...prev
                              ]);
                            }}
                            className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group focus:outline-none transition active:scale-90"
                            style={{ left: p.x, top: p.y }}
                          >
                            <span className={`w-3 h-3 rounded-full flex items-center justify-center relative transition ${
                              isSelected ? 'bg-[#FF9900] scale-125' : 'bg-zinc-800 hover:bg-zinc-600'
                            }`}>
                              {/* Pulsing glow ring around blip */}
                              <span className={`absolute inset-0 rounded-full animate-ping ${
                                isSelected ? 'bg-amber-400' : 'bg-zinc-700/50'
                              }`} />
                            </span>
                            <span className="text-[8px] font-mono font-bold mt-1 text-zinc-400 group-hover:text-white uppercase tracking-tighter">
                              {p.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Satellite Frequency controls inside radar box */}
                  <div className="space-y-3 pt-3 border-t border-zinc-900">
                    <div className="grid grid-cols-2 gap-3.5">
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-mono block">Frequency Band</label>
                        <select
                          value={telemetryFrequency}
                          onChange={(e) => {
                            setTelemetryFrequency(e.target.value);
                            setSatelliteLogs(prev => [
                              `[BAND] Retuned carrier frequency filter to: ${e.target.value}`,
                              ...prev
                            ]);
                          }}
                          className="w-full bg-black border border-zinc-850 rounded-xl px-2.5 py-1.5 text-[10px] text-zinc-300 focus:outline-none focus:border-[#FF9900] font-mono"
                        >
                          <option value="Ku-Band (14.2 GHz)">Ku-Band (14.2 GHz)</option>
                          <option value="Ka-Band (30.1 GHz)">Ka-Band (30.1 GHz)</option>
                          <option value="X-Band (10.5 GHz)">X-Band (10.5 GHz)</option>
                          <option value="S-Band (Deep Space)">S-Band (Deep Space)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-550 uppercase tracking-wider font-mono block">Noise Filter</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="10"
                            max="99"
                            value={noiseCancellationPercent}
                            onChange={(e) => setNoiseCancellationPercent(Number(e.target.value))}
                            className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#FF9900]"
                          />
                          <span className="text-[9.5px] font-mono text-zinc-400 font-bold">{noiseCancellationPercent}%</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTriggerSatellitePing}
                      disabled={isTelemetryPinging}
                      className={`w-full py-2.5 rounded-xl font-mono text-[10px] font-black uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 border cursor-pointer ${
                        isTelemetryPinging
                          ? 'bg-zinc-900 border-zinc-850 text-zinc-650 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-600 to-[#FF9900] hover:from-[#FF9900] hover:to-amber-400 text-black border-transparent shadow-lg shadow-amber-950/20'
                      }`}
                    >
                      <Radio className={`w-3.5 h-3.5 ${isTelemetryPinging ? 'animate-spin' : 'animate-pulse'}`} />
                      {isTelemetryPinging ? 'PINGING STATION...' : '[ TRANSMIT HANDSHAKE PING ]'}
                    </button>
                  </div>
                </div>

                {/* GRAPHIC TREND ANALYSIS */}
                <div className="xl:col-span-7 bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl space-y-5 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                      <div>
                        <span className="text-[10px] font-mono text-[#FF9900] font-black tracking-widest uppercase block">
                          [ TELEMETRIC STREAM VELOCITY ]
                        </span>
                        <span className="text-[9px] font-mono text-zinc-500 block mt-0.5">
                          ACTIVE CLUSTER: {selectedTelemetrySector} ({
                            selectedTelemetrySector === "AUSION-TX-01" ? "Austin, TX" :
                            selectedTelemetrySector === "WASHIP-SE-05" ? "Seattle, WA" :
                            selectedTelemetrySector === "DENVER-CO-03" ? "Denver, CO" :
                            selectedTelemetrySector === "LONDON-UK-02" ? "London, UK" :
                            "Berlin, DE"
                          })
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[9.5px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#FF9900]" />
                          <span className="text-zinc-400">STREAMS (24H)</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-zinc-400">GAIN: {telemetrySignalGain} dB</span>
                        </div>
                      </div>
                    </div>

                    {/* Chart Frame */}
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                          data={
                            telemetryTrendData[selectedTelemetrySector] ||
                            telemetryTrendData["WASHIP-SE-05"]
                          }
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <defs>
                            <linearGradient id="colorStreams" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF9900" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="#FF9900" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                          <XAxis
                            dataKey="hour"
                            stroke="#52525b"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                          />
                          <YAxis
                            stroke="#52525b"
                            fontSize={9}
                            tickLine={false}
                            axisLine={false}
                          />
                          <RechartsTooltip
                            contentStyle={{
                              backgroundColor: '#09090b',
                              borderColor: '#27272a',
                              fontSize: 10,
                              fontFamily: 'monospace'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="streams"
                            stroke="#FF9900"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorStreams)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Terminal Log Console */}
                  <div className="space-y-2">
                    <span className="text-[9px] text-zinc-550 uppercase tracking-widest font-mono font-bold block">
                      DECRYPTED SIGNAL FEED CONSOLE
                    </span>
                    <div className="bg-black border border-zinc-900 rounded-xl p-3.5 font-mono text-[9px] text-zinc-450 h-20 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-zinc-800">
                      {satelliteLogs.map((log, lIdx) => (
                        <div key={`label-log-${lIdx}`} className="flex items-start gap-2">
                          <span className="text-[#FF9900]/80 select-none">&gt;&gt;</span>
                          <span className="leading-relaxed break-all text-zinc-300">{log}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* Render geographic data container monitoring tracking location clusters */}
              <div className="space-y-4">
                <div className="flex items-start sm:items-center justify-between pb-1 flex-col sm:flex-row gap-2">
                  <span className="text-xs font-mono font-black text-[#FF9900] tracking-widest uppercase">
                    GEOGRAPHIC LOCATION SATELLITE CLUSTERS
                  </span>
                  <span className="text-[8.5px] font-mono text-zinc-650 uppercase bg-zinc-900 px-2 py-0.5 rounded font-bold">
                    LISTENING SIGNALS FROM 5 REGION CODES
                  </span>
                </div>

                {[
                  { sector: "AUSION-TX-01", city: "Austin, Texas (SXSW Core)", streams: "142,450", sales: "$12,450.00", index: 88, status: "HIGH VELOCITY 📈" },
                  { sector: "WASHIP-SE-05", city: "Seattle, Washington", streams: "98,120", sales: "$8,580.00", index: 95, status: "EXTREME FIRE 🔥" },
                  { sector: "DENVER-CO-03", city: "Denver, Colorado", streams: "64,888", sales: "$6,120.00", index: 76, status: "RISING 📈" },
                  { sector: "LONDON-UK-02", city: "London, Great Britain", streams: "230,110", sales: "$4,250.00", index: 64, status: "STABLE 📊" },
                  { sector: "BERLIN-DE-09", city: "Berlin, European Sector", streams: "112,500", sales: "$3,800.00", index: 59, status: "STABLE 📊" }
                ].map((loc, idx) => (
                  <div key={`${loc.sector}-${idx}`} className="bg-zinc-950/40 border border-zinc-850 rounded-2xl p-5 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all hover:border-zinc-750">
                    <div className="min-w-0">
                      <span className="text-zinc-200 font-bold block uppercase text-sm">{loc.city}</span>
                      <span className="text-[8px] text-zinc-500 font-mono block uppercase tracking-widest mt-1">SECTOR_ID: {loc.sector}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-6 sm:gap-8 text-xs font-mono">
                      <div>
                        <div className="text-[8px] text-zinc-550 uppercase tracking-wider mb-0.5">Streams (24h)</div>
                        <div className="text-zinc-300 font-bold">{loc.streams} STREAMS</div>
                      </div>
                      <div>
                        <div className="text-[8px] text-zinc-550 uppercase tracking-wider mb-0.5">Merch POS</div>
                        <div className="text-emerald-400 font-bold">{loc.sales}</div>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <div>
                          <div className="text-[8px] text-zinc-550 uppercase tracking-wider mb-0.5">Velocity Index</div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-zinc-900 rounded-sm overflow-hidden border border-zinc-950">
                              <div className="h-full bg-gradient-to-r from-amber-600 to-amber-400" style={{ width: `${loc.index}%` }} />
                            </div>
                            <span className="text-[9px] font-bold text-zinc-450">{loc.index}%</span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold text-zinc-300 bg-zinc-900/60 border border-zinc-850 px-2.5 py-1 rounded-lg sm:ml-2">{loc.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'SALES' && (!subTab || subTab === 'storefront') && (
            <div className="space-y-6">
              <div className="flex flex-col border-b border-zinc-900 pb-6 gap-6 items-center text-center">
                <div>
                  <h2 className="font-black tracking-widest text-[#00ffcc] uppercase flex items-center justify-center gap-2" style={{ fontSize: '26px' }}>
                    <ShoppingBag className="w-6 h-6 text-[#00ffcc]" />
                    {isPosMode ? 'LABEL MACRO POS ENGINE' : 'LABEL STOREFRONT'}
                  </h2>
                  <p className="text-[10px] font-mono text-zinc-500 tracking-wider uppercase mt-1">
                    {isPosMode ? 'Mobile Festival POS Terminal' : 'Direct to Consumer Retail Command Center'}
                  </p>
                </div>
                <div className="flex flex-col w-full gap-3 items-center">
                  {activeClearanceLevel > 1 && (
                    <button
                      onClick={() => {
                          setIsPosMode(!isPosMode);
                          setPosCart([]);
                      }}
                      className="w-full bg-[#000000] hover:bg-[#1A1A1A] px-3 py-3 rounded-lg border border-[#FF9900]/30 hover:border-[#FF9900] text-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.15)] font-mono font-bold text-xs tracking-widest uppercase transition-colors"
                    >
                      {isPosMode ? 'RETURN TO STOREFRONT ADMIN' : 'ACCESS MOBILE FESTIVAL POS TERMINAL'}
                    </button>
                  )}
                  {!isPosMode && (
                    <button
                      onClick={() => setIsPublicStorefrontOpen(true)}
                      className="bg-[#00ffcc] hover:bg-[#00e6b8] text-black px-4 py-3 rounded-lg flex items-center justify-center gap-2.5 w-full max-w-sm transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(0,255,204,0.4)] hover:shadow-[0_0_35px_rgba(0,255,204,0.85)] hover:scale-[1.02] border-none font-black"
                    >
                      <Globe className="w-4 h-4 text-black animate-pulse" />
                      <span className="text-[11px] font-mono font-black tracking-widest uppercase block text-center leading-normal">
                        PUBLIC RETAIL PATH:
                        <br />
                        <span className="underline decoration-2 tracking-normal lowercase mt-1 block text-[11px]">
                          nexus-core.app/label/{userProfile.label_company_name ? userProfile.label_company_name.toLowerCase().replace(/[^a-z0-9]/g, '') : 'hq'}
                        </span>
                      </span>
                    </button>
                  )}
                </div>
              </div>

              {isPosMode ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* POS TOP OPTIONS AND WARNINGS */}
                  <div className="space-y-6 md:space-y-8 max-w-2xl">
                    {/* SETTLEMENT DEADLINE WARNING */}
                    <div className="bg-[#1A1A1A] border border-[#FF9900]/30 rounded-xl p-4 md:p-5">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-3 gap-3">
                        <div className="flex gap-2.5 text-[#FF9900] items-center sm:items-start">
                          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                          <span className="font-sans font-bold text-sm tracking-wide">SETTLEMENT DEADLINE WARNING</span>
                        </div>
                        <button className="self-start sm:self-auto bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/50 px-3 py-1.5 rounded text-[10px] font-black uppercase tracking-widest hover:bg-[#FF9900]/30 transition-colors flex items-center gap-1.5 h-7">
                          SETTLE NOW <Banknote className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="text-zinc-400 text-xs leading-relaxed sm:ml-7.5 font-sans">
                        It is past 4:00 AM local time on the morning after this show (2026-06-21). Please settle and close the cash drawer soon to finalize reports. Click here to go straight to Show Settlement of this stop.
                      </p>
                    </div>

                    {/* ACTIVE CAMPAIGN SHOW */}
                    <div>
                      <div className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-widest mb-2 px-1">ACTIVE CAMPAIGN SHOW<br/><span className="lowercase text-zinc-600 font-sans tracking-normal">Pick the show you are sellling at</span></div>
                      <button className="w-full bg-[#0D0D0D] border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 flex items-center justify-between transition-colors text-left group">
                        <div className="flex items-center gap-4">
                          <Calendar className="w-5 h-5 text-[#00ffcc]" />
                          <div>
                            <h3 className="font-sans font-black text-white text-sm tracking-wide">REGGIES MUSIC JOINT</h3>
                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest mt-0.5"><span className="text-zinc-400">Jun 20, 2026</span> • <MapPin className="w-2.5 h-2.5 inline text-red-500 -mt-0.5"/> Chicago</p>
                          </div>
                        </div>
                        <ChevronDown className="w-5 h-5 text-zinc-600 group-hover:text-zinc-400" />
                      </button>
                    </div>

                    {/* ACTION CARDS */}
                    <div className="flex flex-col gap-3">
                      {/* CASH DRAWER AUDIT */}
                      <button 
                        onClick={() => setIsCashDrawerOpen(true)}
                        className="w-full bg-[#00ffcc]/5 border border-[#00ffcc]/20 hover:border-[#00ffcc]/40 rounded-xl flex items-center gap-4 p-4 md:p-5 transition-all text-left group overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#00ffcc]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="bg-[#00ffcc]/10 p-3 rounded-lg flex-shrink-0 relative z-10">
                          <Banknote className="w-5 h-5 text-[#00ffcc]" />
                        </div>
                        <div className="flex-1 relative z-10 pr-2">
                          <div className="flex items-center justify-between">
                             <h3 className="font-mono font-black text-[11px] md:text-xs text-[#00ffcc] tracking-widest uppercase">ACCESS CASH DRAWER AUDIT SYSTEM</h3>
                             <span className="text-[9px] bg-[#00ffcc]/20 text-[#00ffcc] px-2 py-0.5 rounded font-black tracking-widest hidden sm:block">DRAWER</span>
                          </div>
                          <p className="text-zinc-400 text-[11px] md:text-xs font-sans mt-1">Easily audit cash on hand, quickly set starting bank, or record payouts and expenses</p>
                        </div>
                      </button>

                      {/* CREATE A BUNDLE */}
                      <button 
                        onClick={() => setIsBundleModalOpen(true)}
                        className="w-full bg-purple-500/5 border border-purple-500/20 hover:border-purple-500/40 rounded-xl flex items-center gap-4 p-4 md:p-5 transition-all text-left group overflow-hidden relative"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="bg-purple-500/10 p-3 rounded-lg flex-shrink-0 relative z-10">
                          <Package className="w-5 h-5 text-purple-500" />
                        </div>
                        <div className="flex-1 relative z-10">
                          <h3 className="font-mono font-black text-[11px] md:text-xs text-purple-400 tracking-widest uppercase">CREATE A BUNDLE</h3>
                          <p className="text-zinc-400 text-[11px] md:text-xs font-sans mt-1">Sell two or more items together for one price</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="w-full h-px bg-zinc-900 my-8"></div>

                  {/* MOBILE FESTIVAL POS TERMINAL INVENTORY MARQUEE (CATEGORY FILTER) */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                    <button 
                      onClick={() => setPosCategory('ALL ITEMS')}
                      className={`shrink-0 px-6 py-2 rounded-full border text-[10px] font-black font-mono tracking-widest uppercase transition-all ${posCategory === 'ALL ITEMS' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.4)]' : 'bg-[#000000] text-zinc-500 border-[#1A1A1A] hover:border-zinc-700'}`}
                    >
                      ALL ITEMS
                    </button>
                    <button 
                      onClick={() => setPosCategory('APPAREL')}
                      className={`shrink-0 px-6 py-2 rounded-full border text-[10px] font-black font-mono tracking-widest uppercase transition-all ${posCategory === 'APPAREL' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.4)]' : 'bg-[#000000] text-zinc-500 border-[#1A1A1A] hover:border-zinc-700'}`}
                    >
                      APPAREL
                    </button>
                    <button 
                      onClick={() => setPosCategory('VINYL / MEDIA')}
                      className={`shrink-0 px-6 py-2 rounded-full border text-[10px] font-black font-mono tracking-widest uppercase transition-all ${posCategory === 'VINYL / MEDIA' ? 'bg-[#FF9900]/10 text-[#FF9900] border-[#FF9900] shadow-[0_0_15px_rgba(255,153,0,0.4)]' : 'bg-[#000000] text-zinc-500 border-[#1A1A1A] hover:border-zinc-700'}`}
                    >
                      VINYL / MEDIA
                    </button>
                  </div>

                  {/* HORIZONTAL ROSTER BAND FILTER SLIDER */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-6 mb-2 border-b border-[#1A1A1A] scrollbar-hide">
                    <button
                      onClick={() => setPosBandFilter('ALL ROSTER')}
                      className={`shrink-0 px-5 py-1.5 rounded-full border text-[10px] font-black font-sans tracking-wide uppercase transition-all ${posBandFilter === 'ALL ROSTER' ? 'bg-[#1A1A1A] text-white border-zinc-600' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'}`}
                    >
                      ALL ROSTER
                    </button>
                    {labelRosterData.map((band, idx) => (
                      <button
                        key={`${band.id}-${idx}`}
                        onClick={() => setPosBandFilter(band.name)}
                        className={`shrink-0 px-5 py-1.5 rounded-full border text-[10px] font-black font-sans tracking-wide uppercase transition-all ${posBandFilter === band.name ? 'bg-[#1A1A1A] text-white border-zinc-600' : 'bg-transparent text-zinc-600 border-zinc-800 hover:border-zinc-700 hover:text-zinc-400'}`}
                      >
                        {band.name}
                      </button>
                    ))}
                  </div>

                  {/* ACTIVE GRID & CART CONTAINER */}
                  <div className="flex flex-col mb-32">
                    {/* INVENTORY GRID MATRIX */}
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-max">
                      {(posCategory === 'ALL ITEMS' || posCategory === 'VINYL / MEDIA') && (Object.values(catalogReleases).flat() as any[]).filter(r => posBandFilter === 'ALL ROSTER' || r.band_id === labelRosterData.find(b => b.name === posBandFilter)?.id).map((release, idx) => (
                        <ErrorBoundary key={`${release.id}-${idx}`}>
                          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl flex flex-col justify-between hover:border-zinc-800 transition-colors overflow-hidden h-full">
                            <div className="relative aspect-square bg-zinc-900 w-full flex items-center justify-center p-4">
                              <Disc className="w-16 h-16 text-zinc-800" />
                              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md rounded-lg px-2.5 py-1 z-10 border border-zinc-800/50">
                                <span className="text-[#00ffcc] font-black font-sans tracking-tight">${(release.price ?? 0).toFixed(0)}</span>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="text-xs font-black font-sans text-zinc-100 uppercase leading-tight line-clamp-2 mb-1">{release.title}</h4>
                              <span className="text-[9px] font-bold text-zinc-500 font-mono tracking-widest uppercase">{release.type}</span>
                            </div>
                            <div className="p-3 pt-0 mt-auto">
                              <button 
                                onClick={() => {
                                  if (navigator.vibrate) navigator.vibrate(50);
                                  showLocalToast(`ADDED [ ${release.title} ] TO CART`);
                                  setPosCart(prev => {
                                    const exists = prev.find(i => i.id === release.id && i.variant === 'Standard');
                                    if (exists) {
                                      return prev.map(i => i.id === release.id && i.variant === 'Standard' ? {...i, qty: i.qty + 1} : i);
                                    }
                                    return [...prev, { id: release.id, title: release.title, variant: 'Standard', price: release.price ?? 0, type: release.type, qty: 1, bandId: release.band_id }];
                                  });
                                }}
                                className="w-full bg-[#1A1A1A] hover:bg-[#FF9900] text-zinc-300 hover:text-white font-black tracking-widest uppercase font-sans text-[11px] py-3 rounded-lg transition-colors border border-transparent"
                              >
                                + ADD TO BASKET
                              </button>
                            </div>
                          </div>
                        </ErrorBoundary>
                      ))}

                      {(posCategory === 'ALL ITEMS' || posCategory === 'APPAREL') && (Object.values(catalogApparel).flat() as any[]).filter(a => posBandFilter === 'ALL ROSTER' || a.band_id === labelRosterData.find(b => b.name === posBandFilter)?.id).map((apparel, idx) => (
                        <ErrorBoundary key={`${apparel.id}-${idx}`}>
                          <div className="bg-[#0D0D0D] border border-[#1A1A1A] rounded-xl flex flex-col justify-between hover:border-zinc-800 transition-colors overflow-hidden h-full">
                            <div className="relative aspect-square bg-zinc-900 w-full flex items-center justify-center p-4">
                              <div className="absolute inset-0 flex items-center justify-center opacity-30">
                                {apparel.type === 'T-Shirt' ? <Layers size={48} /> : apparel.type === 'Hoodie' ? <Users size={48} /> : apparel.type === 'Cap' ? <Shield size={48} /> : <Tag size={48} />}
                              </div>
                              <div className="absolute top-2 right-2 bg-black/80 backdrop-blur-md rounded-lg px-2.5 py-1 z-10 border border-zinc-800/50">
                                <span className="text-[#00ffcc] font-black font-sans tracking-tight">${(apparel.price ?? 0).toFixed(0)}</span>
                              </div>
                            </div>
                            <div className="p-3">
                              <h4 className="text-xs font-black font-sans text-zinc-100 uppercase leading-tight line-clamp-2 mb-1">{apparel.title}</h4>
                              <span className="text-[9px] font-bold text-zinc-500 font-mono tracking-widest uppercase">{apparel.type}</span>
                            </div>
                            <div className="p-3 pt-0 mt-auto relative">
                              {activeSizeSelector === apparel.id ? (
                                <div className="grid grid-cols-5 gap-1.5 h-10">
                                  {['S', 'M', 'L', 'XL', '2XL'].map((size, idx) => (
                                    <button 
                                      key={`${size}-${idx}`}
                                      onClick={() => {
                                        if (navigator.vibrate) navigator.vibrate(50);
                                        showLocalToast(`ADDED [ ${apparel.title} - ${size} ] TO CART`);
                                        setPosCart(prev => {
                                          const exists = prev.find(i => i.id === apparel.id && i.variant === size);
                                          if (exists) {
                                            return prev.map(i => i.id === apparel.id && i.variant === size ? {...i, qty: i.qty + 1} : i);
                                          }
                                          return [...prev, { id: apparel.id, title: apparel.title, variant: size, price: apparel.price ?? 0, type: apparel.type, qty: 1, bandId: apparel.band_id }];
                                        });
                                        setActiveSizeSelector(null);
                                      }}
                                      className="w-full h-full flex items-center justify-center bg-[#1A1A1A] hover:bg-[#FF9900] hover:text-white text-zinc-400 font-black tracking-widest uppercase font-mono text-[9px] rounded transition-colors"
                                    >
                                      {size}
                                    </button>
                                  ))}
                                </div>
                              ) : (
                                <button 
                                  onClick={() => setActiveSizeSelector(apparel.id)}
                                  className="w-full bg-[#1A1A1A] hover:bg-zinc-800 text-zinc-300 font-black tracking-widest uppercase font-sans text-[10px] py-3 rounded-lg transition-colors border border-transparent"
                                >
                                  SELECT SIZE OPTIONS
                                </button>
                              )}
                            </div>
                          </div>
                        </ErrorBoundary>
                      ))}
                    </div>

                  {/* FLOATING FIXED BASKET BAR */}
                  <div className="fixed bottom-0 left-0 w-full bg-[#000000] border-t border-[#1A1A1A] z-50 p-4 md:px-8 flex items-center justify-between shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs font-sans text-zinc-400 font-bold uppercase tracking-widest">
                        TOTAL ITEMS: <span className="text-white">{posCart.reduce((sum, item) => sum + item.qty, 0)}</span>
                      </div>
                      <div className="text-lg font-black font-sans text-[#00ffcc] tracking-widest uppercase items-center flex gap-3 drop-shadow-[0_0_8px_rgba(0,255,204,0.3)]">
                        <span>NET TOTAL:</span>
                        <span>${(posCart.reduce((sum, item) => sum + ((item.price ?? 0) * item.qty), 0) * (1 + posTaxRate/100)).toFixed(2)}</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setIsPosCheckoutOpen(true)}
                      disabled={posCart.length === 0}
                      className="bg-[#FF9900] disabled:bg-zinc-800 disabled:text-zinc-600 hover:bg-[#ffaa22] text-black font-black uppercase text-sm tracking-wider font-sans px-10 py-4 rounded-xl transition-all shadow-[0_0_15px_rgba(255,153,0,0.2)] active:scale-95"
                    >
                      CHECKOUT &gt;
                    </button>
                  </div>

                  {/* CHECKOUT MODAL OVERLAY */}
                  {isPosCheckoutOpen && (
                    <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-end justify-center animate-in fade-in duration-200">
                      <div className="bg-[#000000] w-full max-w-2xl border-t border-x border-[#1A1A1A] rounded-t-3xl shadow-[0_-10px_50px_rgba(0,0,0,1)] flex flex-col h-[85vh] animate-in slide-in-from-bottom-full duration-300">
                        <div className="p-4 border-b border-[#1A1A1A] flex items-center justify-between sticky top-0 bg-[#000000] z-10 rounded-t-3xl">
                          <h3 className="text-sm font-black font-sans text-white tracking-widest uppercase flex items-center gap-2">
                            <ShoppingCart className="w-5 h-5 text-[#FF9900]" />
                            TRANSACTION SUMMARY
                          </h3>
                          <button onClick={() => setIsPosCheckoutOpen(false)} className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition-colors">
                            <X className="w-5 h-5 text-zinc-400" />
                          </button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                          <div className="space-y-4">
                            <h4 className="text-[10px] font-black font-sans text-zinc-500 uppercase tracking-widest border-b border-[#1A1A1A] pb-2">CART MANIFEST</h4>
                            {posCart.map((item, idx) => (
                              <div key={`${item.id}-${item.variant}-${idx}`} className="flex items-start justify-between gap-3 pb-3">
                                <div className="flex-1">
                                  <h5 className="text-sm font-black font-sans text-zinc-200 uppercase leading-tight line-clamp-2">{item.title}</h5>
                                  <div className="text-[10px] font-sans text-zinc-500 tracking-widest uppercase mt-1">VARIANT: {item.variant}</div>
                                </div>
                                <div className="shrink-0 text-right">
                                  <div className="text-base font-sans font-black text-[#FF9900]">${((item.price ?? 0) * item.qty).toFixed(2)}</div>
                                  <div className="text-[11px] font-sans font-bold text-zinc-500 uppercase mt-1 tracking-wider flex items-center justify-end gap-3">
                                    <button onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setPosCart(prev => prev.map(i => i.id === item.id && i.variant === item.variant ? {...i, qty: Math.max(1, i.qty - 1)} : i).filter(i => i.qty > 0)) }} className="hover:text-white w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-md hover:bg-zinc-800 text-sm">-</button>
                                    <span className="w-8 text-center">{item.qty} QTY</span>
                                    <button onClick={() => { if (navigator.vibrate) navigator.vibrate(50); setPosCart(prev => prev.map(i => i.id === item.id && i.variant === item.variant ? {...i, qty: i.qty + 1} : i)) }} className="hover:text-white w-6 h-6 flex items-center justify-center bg-zinc-900 rounded-md hover:bg-zinc-800 text-sm">+</button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-4">
                             <h4 className="text-[10px] font-black font-sans text-zinc-500 uppercase tracking-widest border-b border-[#1A1A1A] pb-2">CALCULATION</h4>
                            <div className="space-y-3 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
                              <div className="flex items-center justify-between text-sm font-sans text-zinc-400 font-bold tracking-widest uppercase">
                                <span>GROSS BASE:</span>
                                <span>${posCart.reduce((sum, item) => sum + ((item.price ?? 0) * item.qty), 0).toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <span className="text-sm font-sans text-zinc-400 font-bold tracking-widest uppercase shrink-0">TAX RATE:</span>
                                <select 
                                  value={posTaxRate}
                                  onChange={(e) => setPosTaxRate(Number(e.target.value))}
                                  className="bg-[#1A1A1A] border border-zinc-800 rounded px-2 py-1.5 text-xs font-sans font-bold tracking-wide uppercase text-zinc-300 focus:outline-none focus:border-[#FF9900]"
                                >
                                  <option value="0">0.00% (TAX EXEMPT)</option>
                                  <option value="6.5">6.50% (STATE SALES TAX)</option>
                                  <option value="8.25">8.25% (COUNTY SALES TAX)</option>
                                </select>
                              </div>
                              <div className="flex items-center justify-between pt-4 border-t border-[#1A1A1A] mt-4">
                                <span className="text-lg font-sans text-[#00ffcc] font-black tracking-widest uppercase">NET TOTAL:</span>
                                <span className="text-3xl font-sans text-[#00ffcc] font-black tracking-widest drop-shadow-[0_0_12px_rgba(0,255,204,0.3)]">
                                  ${(posCart.reduce((sum, item) => sum + ((item.price ?? 0) * item.qty), 0) * (1 + posTaxRate/100)).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="p-6 bg-[#0A0A0A] border-t border-[#1A1A1A] sticky bottom-0 z-10 grid grid-cols-2 gap-4">
                          <button 
                            disabled={posCart.length === 0}
                            onClick={() => {
                              showLocalToast("CASH SALE LOGGED. INVENTORY MATRIX DEDUCTED.");
                              setPosCart([]);
                              setIsPosCheckoutOpen(false);
                            }}
                            className="bg-[#1A1A1A] hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed border border-[#1A1A1A] text-zinc-300 font-black uppercase text-sm tracking-widest font-sans py-4 rounded-xl transition-colors active:scale-95"
                          >
                            LOG CASH SALE
                          </button>
                          <button 
                            disabled={posCart.length === 0}
                            onClick={() => {
                              showLocalToast("INITIALIZING STRIPE TERMINAL...");
                              setTimeout(() => {
                                showLocalToast("PAYMENT SUCCESS. INVENTORY DEDUCTED.");
                                setPosCart([]);
                                setIsPosCheckoutOpen(false);
                              }, 2000);
                            }}
                            className="bg-[#FF9900] hover:bg-[#ffaa22] disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase text-sm tracking-widest font-sans py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(255,153,0,0.2)] active:scale-95 flex items-center justify-center gap-2"
                          >
                            <CreditCard className="w-5 h-5 flex-shrink-0" />
                            SEND TO STRIPE
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                </div>
              ) : (
                <>


              {/* LAYER 01: DIRECT MAILORDER FULFILLMENT */}
              <div className="space-y-4">
                <div className="flex flex-col gap-3 border-b border-zinc-900 pb-4">
                  <div className="flex flex-col items-center justify-center text-center gap-3 border-b border-zinc-900 pb-5 pt-2">
                    <h3 className="font-black font-sans tracking-wider uppercase animate-pulse" style={{ fontSize: '28px', color: '#00aaff', textShadow: '0 0 15px rgba(0, 170, 255, 0.6), 0 0 30px rgba(0, 170, 255, 0.4)' }}>
                      DIRECT MAILORDER FULFILLMENT
                    </h3>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <span className="text-[10px] font-mono bg-zinc-950 text-zinc-400 px-3 py-1 rounded border border-zinc-850 uppercase font-bold tracking-widest">
                        [ {storefrontOrders.filter(o => o.status === 'UNFULFILLED').length} UNFULFILLED ]
                      </span>
                      <span className="text-[10px] font-mono bg-[#00ffcc]/10 text-[#00ffcc] border border-[#00ffcc]/20 px-3 py-1 rounded uppercase font-bold tracking-widest">
                        [ {storefrontOrders.filter(o => o.status !== 'UNFULFILLED').length} SHIPPED / TRACKING LOGGED ]
                      </span>
                    </div>
                  </div>
                  
                  {/* BATCH FULFILLMENT UTILITY BAR */}
                  <div className="bg-[#050505] border border-zinc-850 rounded-xl p-3 flex flex-col gap-3">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 w-full">
                      <button
                        type="button"
                        onClick={toggleSelectAllPending}
                        className="flex items-center gap-3 cursor-pointer group select-none bg-transparent border-none text-left focus:outline-none"
                      >
                        <div className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                          isAllPendingSelected 
                            ? 'bg-[#00ffcc] border-[#00ffcc] shadow-[0_0_8px_rgba(0,255,204,0.3)]' 
                            : 'border-zinc-750 bg-zinc-950 group-hover:border-[#00ffcc]'
                        }`}>
                          <Check className={`w-3 h-3 transition-colors ${isAllPendingSelected ? 'text-black font-black' : 'text-transparent'}`} />
                        </div>
                        <span className="text-[10px] font-mono font-black text-zinc-300 tracking-widest uppercase">
                          SELECT ALL PENDING ({pendingOrders.length})
                        </span>
                      </button>
                      
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <button 
                          onClick={handleBatchFulfill}
                          disabled={selectedOrderIds.length === 0}
                          className="flex-1 sm:flex-none bg-[#00ffcc]/10 hover:bg-[#00ffcc]/20 disabled:bg-zinc-950 disabled:text-zinc-600 disabled:border-zinc-900 disabled:shadow-none text-[#00ffcc] border border-[#00ffcc]/30 px-4 py-2 rounded text-[10px] font-mono font-black tracking-widest uppercase transition-all duration-300 shadow-[0_0_15px_rgba(0,255,204,0.1)] active:scale-95 cursor-pointer"
                        >
                          BATCH GENERATE LABELS & MARK AS SHIPPED ({selectedOrderIds.length})
                        </button>
                        <a 
                          href="https://www.pirateship.com" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex-1 sm:flex-none text-center bg-[#FF9900]/10 hover:bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/30 hover:border-[#FF9900]/60 px-4 py-2 rounded text-[10px] font-mono font-black tracking-widest uppercase transition-all duration-300 flex items-center justify-center gap-1.5 cursor-pointer"
                          title="Open Pirate Ship to import orders or purchase postage labels"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          PIRATE SHIP
                        </a>
                      </div>
                    </div>

                    <div className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider text-left border-t border-zinc-900/60 pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span>INFO: BATCH FULFILLMENT GENERATES PRINT-READY USPS POSTAGE LABELS + AUTO-PULLS TRACKING IDS TO BUYERS.</span>
                      {selectedOrderIds.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            showLocalToast("DOWNLOADING PRINTABLE BATCH POSTAGE LABELS (PDF)...");
                          }}
                          className="text-[9px] font-mono text-[#00ffcc] hover:underline uppercase bg-transparent border-none p-0 cursor-pointer font-bold flex items-center gap-1"
                        >
                          [ DOWNLOAD PRINT FILE ({selectedOrderIds.length}) ]
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  {storefrontOrders.map((order, index) => {
                    const isSelected = selectedOrderIds.includes(order.id);
                    const ageInfo = getOrderAgeInfo(order.date);
                    const isPending = order.status === 'UNFULFILLED';
                    const isExpanded = !!expandedOrders[order.id];
                    const itemsList = order.items.split(',').map((item) => item.trim());
                    
                    return (
                      <div 
                        key={`${order.id || ''}-${index}`} 
                        className={`border p-5 rounded-xl shadow-xl relative overflow-hidden transition-all duration-300 group ${
                          isSelected ? 'ring-2 ring-[#00ffcc]' : ''
                        } ${ageInfo.bgClass}`}
                      >
                        {/* Decorative Left status strip */}
                        <div 
                          className="absolute left-0 top-0 bottom-0 w-1.5 transition-all"
                          style={{ backgroundColor: ageInfo.statusColor }}
                        />
                        
                        <div className="flex flex-col gap-3.5">
                          {/* Top row with selection and ID */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {isPending && (
                                <button 
                                  type="button"
                                  onClick={() => toggleSelectOrder(order.id)}
                                  className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                                    isSelected 
                                      ? 'bg-[#00ffcc] border-[#00ffcc]' 
                                      : 'border-zinc-700 bg-zinc-950 hover:border-[#00ffcc]'
                                  }`}
                                >
                                  <Check className={`w-3 h-3 ${isSelected ? 'text-black font-black' : 'text-transparent'}`} />
                                </button>
                              )}
                              <span className="text-[11px] font-mono font-black tracking-widest text-[#00ffcc]">{order.id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-mono px-2 py-0.5 rounded font-black uppercase tracking-widest border border-current ${ageInfo.textClass}`}>
                                {ageInfo.label}
                              </span>
                              <span className="text-[9.5px] font-mono text-zinc-500 font-bold uppercase">{order.date}</span>
                              <button
                                type="button"
                                onClick={() => setExpandedOrders(prev => ({ ...prev, [order.id]: !prev[order.id] }))}
                                className="ml-1.5 px-2 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-[9px] font-mono text-zinc-400 hover:text-white border border-zinc-800 transition-colors uppercase font-bold flex items-center gap-1 cursor-pointer"
                              >
                                {isExpanded ? 'HIDE DETAILS ▲' : 'VIEW DETAILS ▼'}
                              </button>
                            </div>
                          </div>
                          
                          {/* Item line items and details */}
                          <div>
                            <div className="text-[12px] font-mono tracking-widest text-zinc-200 uppercase leading-relaxed font-black truncate max-w-full">
                              {order.items}
                            </div>
                            <div className="text-[10px] font-mono tracking-wide text-zinc-400 mt-1.5 bg-black/40 p-2.5 rounded border border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <span className="text-zinc-650 font-bold uppercase mr-1 text-[9px]">SHIP TO:</span> {order.buyer}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(order.buyer);
                                    showLocalToast("SHIPPING ADDRESS COPIED!");
                                  }}
                                  className="text-[9px] font-mono bg-zinc-950 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 px-2.5 py-1 rounded transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Copy buyer shipping address"
                                >
                                  COPY ADDRESS
                                </button>
                                <a
                                  href="https://www.pirateship.com"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] font-mono bg-zinc-950 text-[#00ffcc] hover:bg-zinc-900 border border-[#00ffcc]/30 hover:border-[#00ffcc]/60 px-2.5 py-1 rounded transition-all flex items-center gap-1 cursor-pointer font-black"
                                  title="Open Pirate Ship to buy postage"
                                >
                                  <Truck className="w-3 h-3 text-[#00ffcc]" /> SHIP
                                </a>
                              </div>
                            </div>
                          </div>
                          
                          {/* EVERYTHING BELOW ADDRESS IS HIDDEN INITIALLY (UNLESS EXPANDED) */}
                          {isExpanded && (
                            <>
                              {/* Expanded detailed multi-item list breakdown */}
                              <div className="bg-[#030508] border border-zinc-900 rounded-lg p-3 space-y-2">
                                <div className="text-[8.5px] font-mono uppercase text-zinc-500 font-black tracking-widest flex items-center gap-1.5">
                                  <Package className="w-3 h-3 text-[#00ffcc]" />
                                  ORDERED LINE ITEMS BREAKDOWN ({itemsList.length})
                                </div>
                                <div className="divide-y divide-zinc-900/40">
                                  {itemsList.map((item, idx) => (
                                    <div key={`label-feed-item-${idx}`} className="py-1.5 flex items-start gap-2.5 text-[11px] font-mono text-zinc-300 leading-normal">
                                      {item.toLowerCase().includes('lp') || item.toLowerCase().includes('vinyl') || item.toLowerCase().includes('cd') || item.toLowerCase().includes('cassette') ? (
                                        <Disc className="w-3.5 h-3.5 text-[#00ffcc] shrink-0 mt-0.5" />
                                      ) : (
                                        <Layers className="w-3.5 h-3.5 text-[#FF9900] shrink-0 mt-0.5" />
                                      )}
                                      <span className="flex-1 uppercase font-bold text-zinc-200">{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* TRACKING INPUT & ACTION BUTTON */}
                              <div className="pt-3.5 border-t border-zinc-900/60 flex flex-col sm:flex-row gap-4">
                                <div className="flex-1 flex flex-col justify-end">
                                  <label className="text-[8px] font-mono font-black uppercase text-zinc-500 block mb-1">TRACKING NUMBER ID: [ INPUT ]</label>
                                  <input 
                                    type="text"
                                    value={orderTracking[order.id] || ''}
                                    onChange={(e) => setOrderTracking(prev => ({ ...prev, [order.id]: e.target.value }))}
                                    placeholder="ENTER TRACKING ID OR GENERATE..."
                                    className="w-full bg-zinc-950 border border-zinc-850 rounded px-3 py-2 text-[10.5px] font-mono text-[#00ffcc] tracking-widest uppercase focus:outline-none focus:border-[#FF9900] focus:ring-1 focus:ring-[#FF9900]/20 transition-all"
                                  />
                                </div>
                                <div className="sm:w-1/3 flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      // Toggle status
                                      const wasUnfulfilled = order.status === 'UNFULFILLED';
                                      setStorefrontOrders(prev => prev.map((o, i) => i === index ? { ...o, status: o.status === 'UNFULFILLED' ? 'SHIPPED / TRACKING LOGGED' : 'UNFULFILLED' } : o));
                                      
                                      // If toggled to shipped and tracking is empty, generate one
                                      if (wasUnfulfilled) {
                                        if (!orderTracking[order.id]) {
                                          setOrderTracking(prev => ({
                                            ...prev,
                                            [order.id]: `USPS-NX-${Math.floor(1000000000 + Math.random() * 9000000000)}`
                                          }));
                                        }
                                        showLocalToast(`ORDER ${order.id} MARKED SHIPPED`);
                                      } else {
                                        showLocalToast(`ORDER ${order.id} MARKED UNFULFILLED`);
                                      }
                                    }}
                                    className={`w-full h-[36px] rounded text-[10px] font-mono font-black tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                                      order.status === 'UNFULFILLED' 
                                        ? 'bg-[#FF9900]/10 text-[#FF9900] border border-[#FF9900]/30 hover:bg-[#FF9900]/20 hover:border-[#FF9900]' 
                                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                                    }`}
                                  >
                                    {order.status === 'UNFULFILLED' ? 'UNFULFILLED' : 'SHIPPED / TRACKING'}
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* LAYER 02: PUBLIC STOREFRONT THEME & LAYOUT CONFIGURATOR */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-6 space-y-6 shadow-xl relative overflow-hidden group">
                  {/* PUBLIC STOREFRONT THEME & LAYOUT CONFIGURATOR HEADER */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <h3 className="text-xs font-black font-mono text-zinc-300 tracking-widest uppercase">PUBLIC STOREFRONT THEME & LAYOUT CONFIGURATOR</h3>
                    <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 px-2 py-0.5 rounded uppercase font-bold tracking-widest">Global Settings</span>
                  </div>
                  
                  {/* VISUAL ASSETS */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-1">Storefront Hero Banner (1920x600 recommended)</label>
                      <div className="border border-dashed border-zinc-800 bg-[#0A0A0C] hover:bg-[#111115] transition-colors rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer group/upload">
                        <Upload className="w-5 h-5 text-zinc-600 group-hover/upload:text-[#00ffcc] mb-2 transition-colors" />
                        <span className="text-[10px] font-mono text-zinc-400 font-bold tracking-widest">UPLOAD MASTER BANNER</span>
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-1">Global Scrolling Marquee String</label>
                      <input 
                        type="text"
                        value={storefrontMarquee}
                        onChange={(e) => setStorefrontMarquee(e.target.value)}
                        className="w-full bg-[#0D0D0D] border border-zinc-800 rounded px-3 py-2 text-[10px] font-mono text-[#00ffcc] tracking-widest uppercase focus:outline-none focus:border-[#FF9900] transition-colors"
                        placeholder="ENTER GLOBAL MARQUEE TEXT..."
                      />
                    </div>
                  </div>

                  {/* LAYOUT ENGINE */}
                  <div className="space-y-3 pt-4 border-t border-zinc-900">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase">ENABLE ARTIST DISCOGRAPHY SUB-PAGES</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={storefrontConfig.artistDiscSubpages} onChange={(e) => setStorefrontConfig(prev => ({ ...prev, artistDiscSubpages: e.target.checked }))} />
                        <div className="w-9 h-5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00ffcc]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase">REQUIRE ZIP CODE ON CHECKOUT START</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={storefrontConfig.requireZipcode} onChange={(e) => setStorefrontConfig(prev => ({ ...prev, requireZipcode: e.target.checked }))} />
                        <div className="w-9 h-5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF9900]"></div>
                      </label>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase">AUTO-SYNC INVENTORY TO PUBLIC</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={storefrontConfig.autoSyncInventory} onChange={(e) => setStorefrontConfig(prev => ({ ...prev, autoSyncInventory: e.target.checked }))} />
                        <div className="w-9 h-5 bg-zinc-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#FF0055]"></div>
                      </label>
                    </div>
                  </div>
                  
                  {/* GENERATE ACTION */}
                  <div className="pt-4 mt-2">
                    <button 
                      onClick={() => setIsPublicStorefrontOpen(true)}
                      className="w-full bg-[#00ffcc] hover:bg-[#00e6b8] text-black font-black font-mono tracking-widest text-[10px] py-3 rounded uppercase transition-colors"
                    >
                      [ DEPLOY & PREVIEW PUBLIC STOREFRONT ]
                    </button>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* STOREFRONT CONFIGURATION HEADER */}
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
                    <h3 className="text-xl font-black font-sans text-zinc-100 tracking-wider uppercase">Storefront Control Center</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {/* PROMOTIONS & DISCOUNTS */}
                    <div className="bg-[#050505] border border-[#00ffcc]/30 hover:border-[#00ffcc]/50 transition-all duration-300 p-4 rounded-xl shadow-[0_2px_8px_rgba(0,255,204,0.02)]">
                       <div 
                         className="flex items-center justify-between cursor-pointer select-none"
                         onClick={() => {
                           const wasCollapsed = promoCollapsed;
                           setPromoCollapsed(!wasCollapsed);
                           if (wasCollapsed) {
                             setTaxCollapsed(true);
                             setShippingCollapsed(true);
                           }
                         }}
                       >
                         <div className="flex items-center gap-2.5">
                           <Tag className="w-4 h-4 text-[#00ffcc]" />
                           <h4 className="text-[12px] font-mono font-bold tracking-widest uppercase text-[#00ffcc]">
                             1. PROMOTIONS & DISCOUNTS
                           </h4>
                         </div>
                         <div className="flex items-center gap-3">
                           {promoCollapsed ? (
                             <span className="text-[10px] font-mono text-[#00ffcc]/80 bg-[#00ffcc]/5 px-2 py-0.5 rounded border border-[#00ffcc]/15 max-w-[180px] truncate sm:max-w-none">
                               {promoCodes.filter(p => p.active).map(p => p.code).join(', ') || 'No Active Codes'}
                             </span>
                           ) : (
                             <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                               {promoCodes.length} CODES REGISTERED
                             </span>
                           )}
                           <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${!promoCollapsed ? 'rotate-180' : ''}`} />
                         </div>
                       </div>
                       
                       {!promoCollapsed && (
                         <div className="space-y-4 pt-4 border-t border-zinc-900/80 mt-3">
                           <div className="space-y-3">
                             {promoCodes.map((p, i) => (
                               <div key={`notif-item-${i}`} className="flex items-center justify-between bg-[#0a0a0c] border border-zinc-850 rounded-lg px-3.5 py-2.5">
                                 <span className="text-[11px] font-mono text-zinc-300 font-bold tracking-wide">
                                   {p.code} <span className="text-zinc-600 px-1">•</span> {p.value}% OFF
                                 </span>
                                 <div className="flex items-center gap-3">
                                   <span className="text-[9px] font-mono bg-[#00ffcc]/10 text-[#00ffcc] px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-[#00ffcc]/20">
                                     ACTIVE
                                   </span>
                                   <button 
                                     onClick={() => setPromoCodes(prev => prev.filter((_, idx) => idx !== i))}
                                     className="text-zinc-500 hover:text-white transition-colors"
                                   >
                                     <X className="w-3.5 h-3.5" />
                                   </button>
                                 </div>
                               </div>
                             ))}

                             {/* ADD NEW PROMO RULE */}
                             <div className="bg-[#0a0a0c] border border-zinc-850 rounded-lg p-3.5 mt-2">
                               <label className="text-[9.5px] uppercase font-mono tracking-widest text-zinc-500 block mb-2 font-bold">ADD NEW PROMO RULE</label>
                               <div className="flex gap-2.5 mb-3">
                                 <input 
                                   type="text" 
                                   value={newPromoCode}
                                   onChange={(e) => setNewPromoCode(e.target.value)}
                                   placeholder="CODE..." 
                                   className="flex-[2] bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-mono text-white uppercase focus:border-[#00ffcc] outline-none placeholder:text-zinc-700" 
                                 />
                                 <div className="flex-1 flex bg-black border border-zinc-800 rounded-lg overflow-hidden">
                                   <select className="bg-transparent text-zinc-400 text-[10px] font-mono px-1.5 py-2 outline-none border-r border-zinc-800 focus:border-[#00ffcc]">
                                     <option>% OFF</option>
                                     <option>$ OFF</option>
                                   </select>
                                   <input 
                                     type="number" 
                                     value={newPromoValue}
                                     onChange={(e) => setNewPromoValue(e.target.value)}
                                     className="w-full bg-transparent px-2.5 py-2 text-[11px] font-mono text-white outline-none" 
                                   />
                                 </div>
                               </div>
                               <button 
                                 onClick={() => {
                                   if (!newPromoCode.trim()) {
                                     showLocalToast("ENTER A VALID PROMO CODE NAME.");
                                     return;
                                   }
                                   const val = parseFloat(newPromoValue) || 10;
                                   setPromoCodes(prev => [
                                     ...prev,
                                     { code: newPromoCode.trim().toUpperCase(), discountType: 'percentage', value: val, active: true }
                                   ]);
                                   setNewPromoCode('');
                                   setNewPromoValue('10');
                                   showLocalToast("PROMO CODE SAVED TO STOREFRONT.");
                                 }}
                                 className="w-full bg-[#00ffcc] hover:bg-[#00ffcc]/80 text-black py-2 rounded-lg text-[10.5px] font-mono font-black tracking-widest cursor-pointer uppercase transition-colors"
                               >
                                 REGISTER PROMO RULE
                               </button>
                             </div>
                           </div>
                         </div>
                       )}
                    </div>

                    {/* TAX & REGULATION */}
                    <div className="bg-[#050505] border border-sky-500/30 hover:border-sky-500/50 transition-all duration-300 p-4 rounded-xl shadow-[0_2px_8px_rgba(56,189,248,0.02)]">
                       <div 
                         className="flex items-center justify-between cursor-pointer select-none"
                         onClick={() => {
                           const wasCollapsed = taxCollapsed;
                           setTaxCollapsed(!wasCollapsed);
                           if (wasCollapsed) {
                             setPromoCollapsed(true);
                             setShippingCollapsed(true);
                           }
                         }}
                       >
                         <div className="flex items-center gap-2.5">
                           <Calculator className="w-4 h-4 text-sky-400" />
                           <h4 className="text-[12px] font-mono font-bold tracking-widest uppercase text-sky-400">
                             2. TAX & REGULATION
                           </h4>
                         </div>
                         <div className="flex items-center gap-3">
                           {taxCollapsed ? (
                             <span className="text-[10px] font-mono text-sky-400/80 bg-sky-500/5 px-2 py-0.5 rounded border border-sky-500/15">
                               VAT: {taxRate}% • {isTaxInclusive ? 'Inclusive' : 'Exclusive'}
                             </span>
                           ) : (
                             <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                               GEO-ROUTING COMPLIANCE
                             </span>
                           )}
                           <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${!taxCollapsed ? 'rotate-180' : ''}`} />
                         </div>
                       </div>
                       
                       {!taxCollapsed && (
                         <div className="space-y-4 pt-4 border-t border-zinc-900/80 mt-3 animate-fadeIn">
                           <div className="space-y-4">
                             <div>
                               <label className="text-[9.5px] uppercase font-mono tracking-widest text-zinc-500 block mb-2 font-bold">DEFAULT SALES TAX / VAT RATE (%)</label>
                               <div className="flex items-center gap-4">
                                 <input 
                                   type="number" 
                                   value={taxRate}
                                   onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                                   className="w-24 bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-mono text-white focus:border-sky-500 outline-none" 
                                 />
                                 <span className="text-[10.5px] font-mono text-zinc-400 max-w-[200px] leading-relaxed">
                                   Percent Tax Rate Applied At Checkout
                                 </span>
                               </div>
                             </div>
                             
                             <div className="bg-[#0a0a0c] border border-zinc-850 rounded-lg p-3 flex items-center justify-between">
                                <div>
                                  <span className="text-[10.5px] font-mono text-white uppercase font-bold block mb-0.5">TAX INCLUSIVE PRICING</span>
                                  <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest">SHOW PRICES WITH TAX ALREADY INCLUDED</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                  <input type="checkbox" className="sr-only peer" checked={isTaxInclusive} onChange={(e) => setIsTaxInclusive(e.target.checked)} />
                                  <div className="w-9 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-white"></div>
                                </label>
                             </div>

                             <div className="bg-[#0a0a0c] border border-zinc-850 rounded-lg p-3 flex items-start gap-2.5">
                               <Info className="w-3.5 h-3.5 text-zinc-500 shrink-0 mt-0.5" />
                               <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest leading-relaxed">
                                 SALES TAX RULES WILL AUTOMATICALLY COMPUTE ACCORDING TO DESTINATION ZIP CODES AND STATE NEXUS BOUNDARIES.
                               </p>
                             </div>
                           </div>
                         </div>
                       )}
                    </div>

                    {/* SHIPPING OPTIONS */}
                    <div className="bg-[#050505] border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 p-4 rounded-xl shadow-[0_2px_8px_rgba(192,132,252,0.02)]">
                       <div 
                         className="flex items-center justify-between cursor-pointer select-none"
                         onClick={() => {
                           const wasCollapsed = shippingCollapsed;
                           setShippingCollapsed(!wasCollapsed);
                           if (wasCollapsed) {
                             setPromoCollapsed(true);
                             setTaxCollapsed(true);
                           }
                         }}
                       >
                         <div className="flex items-center gap-2.5">
                           <Truck className="w-4 h-4 text-purple-400" />
                           <h4 className="text-[12px] font-mono font-bold tracking-widest uppercase text-purple-400">
                             3. SHIPPING OPTIONS
                           </h4>
                         </div>
                         <div className="flex items-center gap-3">
                           {shippingCollapsed ? (
                             <span className="text-[10px] font-mono text-purple-400/80 bg-purple-500/5 px-2 py-0.5 rounded border border-purple-500/15">
                               Flat: ${flatShippingRate} • Free over ${freeShippingThreshold}
                             </span>
                           ) : (
                             <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                               GLOBAL RATE MATRIX
                             </span>
                           )}
                           <ChevronDown className={`w-4 h-4 text-zinc-400 transition-transform duration-300 ${!shippingCollapsed ? 'rotate-180' : ''}`} />
                         </div>
                       </div>
                       
                       {!shippingCollapsed && (
                         <div className="space-y-4 pt-4 border-t border-zinc-900/80 mt-3 animate-fadeIn">
                           <div className="space-y-4">
                             <div className="grid grid-cols-2 gap-3">
                               <div>
                                 <label className="text-[9.5px] uppercase font-mono tracking-widest text-zinc-500 block mb-2 font-bold">FLAT RATE SHIPPING ($)</label>
                                 <input 
                                   type="number" 
                                   value={flatShippingRate}
                                   onChange={(e) => setFlatShippingRate(parseFloat(e.target.value) || 0)}
                                   className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-mono text-white focus:border-purple-400 outline-none" 
                                 />
                               </div>
                               <div>
                                 <label className="text-[9.5px] uppercase font-mono tracking-widest text-zinc-500 block mb-2 font-bold">FREE SHIPPING MIN. ($)</label>
                                 <input 
                                   type="number" 
                                   value={freeShippingThreshold}
                                   onChange={(e) => setFreeShippingThreshold(parseFloat(e.target.value) || 0)}
                                   className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-[11px] font-mono text-white focus:border-purple-400 outline-none" 
                                 />
                               </div>
                             </div>
                             
                             <div>
                               <label className="text-[9.5px] uppercase font-mono tracking-widest text-zinc-500 block mb-2.5 font-bold">SUPPORTED CARRIERS</label>
                               <div className="space-y-2">
                                 <div className="bg-[#0a0a0c] border border-zinc-850 rounded-lg p-2.5 flex items-center justify-between">
                                    <span className="text-[10.5px] font-mono text-zinc-300 uppercase font-bold tracking-wide">USPS MEDIA MAIL (VINYL/CDS/TAPES)</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" defaultChecked />
                                      <div className="w-9 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#00ffcc]"></div>
                                    </label>
                                 </div>
                                 <div className="bg-[#0a0a0c] border border-zinc-850 rounded-lg p-2.5 flex items-center justify-between">
                                    <span className="text-[10.5px] font-mono text-zinc-300 uppercase font-bold tracking-wide">USPS GROUND ADVANTAGE</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" defaultChecked />
                                      <div className="w-9 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#00ffcc]"></div>
                                    </label>
                                 </div>
                                 <div className="bg-[#0a0a0c] border border-zinc-850 rounded-lg p-2.5 flex items-center justify-between">
                                    <span className="text-[10.5px] font-mono text-zinc-500 uppercase font-bold tracking-wide">DHL EXPRESS WORLDWIDE</span>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input type="checkbox" className="sr-only peer" />
                                      <div className="w-9 h-4.5 bg-zinc-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#00ffcc]"></div>
                                    </label>
                                 </div>
                               </div>
                             </div>
                           </div>
                         </div>
                       )}
                    </div>

                    {/* STOREFRONT THEME ENGINE */}
                    <div className="bg-[#050505] border border-zinc-850 p-4 rounded-lg">
                       <h4 className="text-[10px] font-mono font-bold text-zinc-400 tracking-widest uppercase mb-3 flex items-center gap-2">
                         <Palette className="w-3 h-3 text-[#FF0055]" />
                         STOREFRONT THEME ENGINE
                       </h4>
                       <div className="space-y-3">
                         <div>
                           <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-1">Accent Color</label>
                           <div className="flex gap-2">
                             {['#00ffcc', '#FF9900', '#FF0055', '#9933FF', '#FFFFFF'].map((color, idx) => (
                               <button
                                 key={`${color}-${idx}`}
                                 onClick={() => setStorefrontAccentColor(color)}
                                 className={`w-6 h-6 rounded-full border-2 ${storefrontAccentColor === color ? 'border-white scale-110 shadow-lg' : 'border-transparent'} transition-all`}
                                 style={{ backgroundColor: color }}
                               />
                             ))}
                             <input 
                               type="color" 
                               value={storefrontAccentColor}
                               onChange={(e) => setStorefrontAccentColor(e.target.value)}
                               className="w-6 h-6 rounded border-0 p-0 cursor-pointer"
                             />
                           </div>
                         </div>
                         <div className="grid grid-cols-2 gap-3 mt-3">
                           <div>
                             <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-1">Typography</label>
                             <select
                               value={storefrontFontPreset}
                               onChange={(e) => setStorefrontFontPreset(e.target.value)}
                               className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-300 focus:border-[#FF0055] outline-none"
                             >
                               <option value="mono">Brutalist (Mono)</option>
                               <option value="sans">Modern (Sans)</option>
                               <option value="serif">Editorial (Serif)</option>
                             </select>
                           </div>
                           <div>
                             <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-500 block mb-1">Theme Mode</label>
                             <select
                               value={storefrontThemePreset}
                               onChange={(e) => setStorefrontThemePreset(e.target.value)}
                               className="w-full bg-black border border-zinc-800 rounded px-2 py-1.5 text-[10px] font-mono text-zinc-300 focus:border-[#FF0055] outline-none"
                             >
                               <option value="dark">Dark Pitch</option>
                               <option value="light">High Contrast</option>
                               <option value="zinc">Slate Grey</option>
                             </select>
                           </div>
                         </div>
                       </div>
                    </div>

                  </div>
                </div>
              </div>

              {/* LAYER 03: CENTRAL CATALOG LIVE-SYNC */}
              <div className="space-y-4 mt-8 bg-[#000000] border border-[#1A1A1A] rounded-xl p-5">
                <div 
                  onClick={() => setIsCatalogSyncExpanded(!isCatalogSyncExpanded)}
                  className="flex items-center justify-between border-b border-zinc-900 pb-2 cursor-pointer select-none group"
                >
                  <h3 className="text-xs font-black font-mono text-[#FF9900] group-hover:text-[#ffb84d] transition-colors tracking-widest uppercase flex items-center gap-2">
                    <RefreshCw className={`w-4 h-4 text-[#FF9900] ${isCatalogSyncExpanded ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                    CENTRAL CATALOG LIVE-SYNC
                  </h3>
                  <div className="flex items-center gap-2.5">
                    <span className="text-[9px] font-mono bg-zinc-900 text-zinc-400 group-hover:text-[#00ffcc] px-2.5 py-1 rounded border border-zinc-800 uppercase font-bold tracking-widest transition-colors">
                      {isCatalogSyncExpanded ? 'COLLAPSE SWITCHBOARD ▲' : 'EXPAND SWITCHBOARD ▼'}
                    </span>
                  </div>
                </div>

                {isCatalogSyncExpanded ? (
                  <div className="space-y-2 mt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {([...(Object.values(catalogReleases).flat() as any[]), ...(Object.values(catalogApparel).flat() as any[])]).map((item, idx) => {
                      const isSynced = storefrontSyncRecord[item.id] || false;
                      const bandName = labelRosterData.find(b => b.id === item.band_id)?.name || 'UNKNOWN BAND';
                      return (
                        <div key={`${item.id}-${idx}`} className="bg-[#0A0A0C] border border-zinc-900 hover:border-zinc-850 px-3.5 py-1.5 rounded-lg flex items-center justify-between transition-colors w-full">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-6 h-6 rounded bg-black border border-zinc-900 flex items-center justify-center shrink-0">
                              {item.type === 'Apparel' || item.type === 'Hoodie' || item.type === 'T-Shirt' ? <Layers className="w-3.5 h-3.5 text-zinc-600" /> : <Disc className="w-3.5 h-3.5 text-zinc-600" />}
                            </div>
                            <div className="min-w-0">
                              <div className="text-[11px] font-sans font-bold text-white tracking-wide uppercase leading-tight truncate">{item.title}</div>
                              <div className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5 truncate">{bandName} • {item.type} • ${(item.price ?? 0).toFixed(2)}</div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[8px] font-mono uppercase font-bold ${isSynced ? 'text-[#00ffcc]' : 'text-zinc-650'}`}>
                              {isSynced ? 'LIVE' : 'HIDDEN'}
                            </span>
                            <label className="relative cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                className="sr-only" 
                                checked={isSynced}
                                onChange={(e) => setStorefrontSyncRecord(prev => ({ ...prev, [item.id]: e.target.checked }))}
                              />
                              <div className={`w-8 h-4.5 rounded-full transition-colors relative ${isSynced ? 'bg-[#FF9900]' : 'bg-[#1A1A1A] border border-zinc-800'}`}>
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${isSynced ? 'translate-x-4' : 'translate-x-0.5'}`} />
                              </div>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-2 bg-[#05080c]/50 rounded-lg border border-zinc-900 border-dashed">
                    <p className="text-[9px] font-mono text-zinc-550 tracking-wider">SWITCHBOARD COLLAPSED. CLICK TO MANAGE LIVE STOREFRONT INVENTORY.</p>
                  </div>
                )}
              </div>

              </>
              )}
            </div>
          )}


          {activeTab === 'SETTINGS' && (!subTab || subTab === 'team_subscription') && (
            <TeamBillingTab 
              userProfile={userProfile} 
              setUserProfile={setUserProfile}
              activeClearanceLevel={activeClearanceLevel}
              showLocalToast={showLocalToast}
              setLabelOAuthProcessor={setLabelOAuthProcessor}
              setLabelOAuthStep={setLabelOAuthStep}
            />
          )}

          {activeTab === 'SALES' && subTab === 'merchandise-printers' && (
             <div className="h-[calc(100vh-120px)] w-full overflow-hidden">
                <MerchandisePrintersView
                  onBack={() => {
                    setActiveTab('SALES');
                    setSubTab('warehouse');
                  }}
                  triggerNotification={showLocalToast}
                  addLog={(msg) => console.log('Printers Log:', msg)}
                  inventory={[]}
                />
             </div>
          )}

          {activeTab === 'SALES' && subTab === 'warehouse' && (
            <div className={`w-full animate-fade-in text-zinc-300 ${editingWarehouseItem ? 'flex flex-col md:flex-row h-[calc(100vh-120px)] overflow-hidden' : 'space-y-6 pb-20'}`}>
              <div className={`${editingWarehouseItem ? 'hidden md:block w-1/3 min-w-[320px] max-w-[400px] border-r border-zinc-800/80 bg-[#07080a] overflow-y-auto pr-3 pl-1 custom-scrollbar space-y-6' : 'w-full space-y-6'}`}>
              
              {/* TOP ACTION BUTTONS - LIKE INVENTORY PORTAL */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setEditingWarehouseItem({
                      id: '',
                      name: '',
                      price: 0,
                      category: 'apparel',
                      table_stock: 0,
                      van_stock: 0,
                      total_sales: 0,
                      image_url: ''
                    });
                  }}
                  className="col-span-2 relative overflow-hidden bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/50 text-[#00ffcc] py-4 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_15px_rgba(0,255,204,0.1)] flex flex-col items-center justify-center gap-2 group"
                >
                  <div className="absolute inset-0 w-full h-[2px] bg-emerald-400/50 blur-[2px] group-hover:animate-scan-horizontal opacity-0 group-hover:opacity-100 top-1/2 -translate-y-1/2"></div>
                  <Plus className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">ADD NEW ITEM</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                     setIsMerchIntakeOpen(true);
                  }}
                  className="bg-blue-950/40 hover:bg-blue-900/60 border border-blue-500/50 text-blue-400 py-4 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2"
                >
                  <Package className="w-5 h-5" />
                  MERCH PRODUCTION INTAKE
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('merchandise-printers' as any);
                  }}
                  className="bg-purple-950/40 hover:bg-purple-900/60 border border-purple-500/50 text-purple-400 py-4 rounded-xl font-mono text-[10px] font-black uppercase tracking-widest transition-all flex flex-col items-center justify-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  NEED TO RE-STOCK? CLICK HERE!
                </button>
              </div>

              

{/* DROPDOWN TO SELECT BAND / LABEL MERCHANDISE */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-zinc-950/60 p-4 border border-zinc-900 rounded-xl mt-6">
                <div className="flex items-center gap-2 text-[#FF9900]">
                  <Database className="w-4 h-4" />
                  <span className="font-mono text-xs font-black uppercase tracking-widest">Select Inventory View</span>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                   <select
                    value={warehouseBandFilter}
                    onChange={(e) => setWarehouseBandFilter(e.target.value)}
                    className="w-full sm:w-64 bg-black border border-zinc-800 text-[#00ffcc] font-mono text-xs rounded-lg p-2.5 focus:outline-none focus:border-[#00ffcc] uppercase font-bold"
                  >
                    <option value="ALL_ROSTER">ALL LABEL MERCHANDISE & ROSTER</option>
                    <option value="LABEL_ONLY">LABEL / NON-BAND MERCH</option>
                    {labelRosterData.map((b, bIdx) => (
                      <option key={`${b.id}-${bIdx}`} value={b.id}>{b.name.toUpperCase()} CATALOG</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* INVENTORY GRID */}
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 mt-6">
                {(() => {
                  const items = [];
                  Object.entries(catalogReleases).forEach(([bandId, releases]) => {
                    const band = labelRosterData.find(b => b.id === bandId) || { name: 'Unknown' };
                    releases.forEach(release => {
                      items.push({
                        id: release.id,
                        bandId,
                        bandName: band.name,
                        name: release.title,
                        image_url: release.image_url || 'https://images.unsplash.com/photo-1619983081563-430f63602796?auto=format&fit=crop&q=80&w=300',
                        item_type: 'MUSIC',
                        category: 'media',
                        status: 'Healthy',
                        price: release.price || 10.00,
                        table_stock: 0,
                        van_stock: (release.formats?.vinyl?.warehouse_qty ?? 0) + 
                                  (release.formats?.cd?.warehouse_qty ?? 0) + 
                                  (release.formats?.cassette?.warehouse_qty ?? 0)
                      });
                    });
                  });
                  Object.entries(catalogApparel).forEach(([bandId, apparelList]) => {
                    const band = labelRosterData.find(b => b.id === bandId) || { name: 'Unknown' };
                    apparelList.forEach(apparel => {
                      items.push({
                        id: apparel.id,
                        bandId,
                        bandName: band.name,
                        name: apparel.title,
                        image_url: apparel.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&q=80&w=300',
                        item_type: 'APPAREL',
                        category: 'apparel',
                        status: 'Healthy',
                        price: apparel.price || 25.00,
                        table_stock: 0,
                        van_stock: apparel.warehouse_qty
                      });
                    });
                  });

                  const filteredItems = items.filter(item => {
                    return warehouseBandFilter === 'ALL_ROSTER' || item.bandId === warehouseBandFilter || (warehouseBandFilter === 'LABEL_ONLY' && !item.bandId);
                  });

                  if (filteredItems.length === 0) {
                     return (
                       <div className="col-span-full py-12 text-center rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 flex flex-col items-center justify-center space-y-2">
                         <span className="text-2xl">📦</span>
                         <p className="text-zinc-500 font-mono text-xs">No merchandise matches your current view filters.</p>
                       </div>
                     );
                  }

                  return filteredItems.map((item, idx) => {
                    const isPod = podItems[item.id] || false;
                    const isSynced = storefrontSyncRecord[item.id] || false;
                    const isHighlighted = highlightItemId === item.id;
                    
                    return (
                      <div 
                        key={`${item.id}-${idx}`} 
                        id={`warehouse-${item.id}`}
                        onClick={() => setEditingWarehouseItem(item as any)}
                        className={`bg-[#0b0c0f] rounded-2xl relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between cursor-pointer border-[1.5px] border-zinc-800/80 hover:border-zinc-700 ${
                          isHighlighted ? 'border-amber-400 bg-amber-950/20 shadow-[0_0_25px_rgba(255,153,0,0.5)] border-2 animate-pulse scale-[1.01]' : ''
                        }`}
                        style={{ boxShadow: isHighlighted ? undefined : '0 4px 20px -5px rgba(0,255,204,0.05)' }}
                      >
                        {/* Subtle neon drop line */}
                        <div 
                          className={`absolute top-0 inset-x-0 h-1 pointer-events-none ${isHighlighted ? 'bg-amber-400' : 'bg-[#00ffcc]'}`} 
                        />

                        {/* Artwork / Image block */}
                        <div className="w-full h-32 relative bg-zinc-900 overflow-hidden select-none shrink-0">
                          <img 
                            src={item.image_url} 
                            alt={item?.name} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          
                          {/* Gradient shading */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                          {/* Active Health dot indicator upper right */}
                          <span className="absolute top-2 right-2 flex h-2.5 w-2.5 rounded-full ring-2 ring-black bg-[#00ffcc]" />

                          {/* Price tag in turquoise text layered in the grid */}
                          <span className="absolute bottom-2 left-2 text-md font-sans font-black text-[#00ffcc] tracking-tight bg-black/60 px-1.5 py-0.5 rounded backdrop-blur-xs">
                            ${(item.price || 0).toFixed(2)}
                          </span>
                        </div>

                        {/* Detail Body */}
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div>
                            <h4 className="text-xs font-semibold text-white leading-tight font-sans tracking-tight min-h-[32px] line-clamp-2">
                              {item?.name}
                              {item.status === 'staged' && (
                                <span className="ml-1.5 inline-block text-[8px] bg-amber-500 text-black px-1 py-0.5 rounded-sm uppercase font-mono tracking-widest font-black leading-none drop-shadow-md align-middle">[ ▰ OFFLINE CACHED ]</span>
                              )}
                            </h4>
                            <p className="text-[10px] font-mono text-zinc-500 mt-0.5 uppercase tracking-wider">{item.item_type}</p>
                          </div>

                          <div className="flex items-center justify-between mt-3 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900/60">
                            <span className="text-[10px] text-zinc-400 font-mono text-left block font-medium uppercase tracking-wider">
                              Stock: <span className={`font-black ${isPod ? 'text-purple-400 text-sm align-middle' : 'text-white text-[11px]'}`}>{isPod ? '∞' : (item.table_stock || 0) + (item.van_stock || 0)}</span>
                            </span>
                          </div>

                          <div className="space-y-1.5 mt-2.5">
                            {/* PRINT ON DEMAND TOGGLE SWITCH */}
                            <div 
                              onClick={(e) => {
                                e.stopPropagation();
                                setPodItems(prev => ({ ...prev, [item.id]: !prev[item.id] }));
                              }}
                              className="flex items-center justify-between bg-zinc-950/50 border border-zinc-900/80 p-2 rounded-lg cursor-pointer hover:border-zinc-800/80 transition-all select-none"
                            >
                              <span className="text-[9px] font-mono font-black text-zinc-400 uppercase tracking-wider">PRINT ON DEMAND</span>
                              <div className="relative">
                                <div className={`w-8 h-4 rounded-full transition-colors relative ${isPod ? 'bg-purple-500' : 'bg-black border border-zinc-800'}`}>
                                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${isPod ? 'translate-x-4' : 'translate-x-0.5'}`} />
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedRestockItemId(item.id);
                                const band = labelRosterData.find(b => b.id === item.bandId);
                                if (band) {
                                  setActiveRestockBand(band);
                                }
                              }}
                              className="w-full py-1.5 px-2 bg-orange-600 hover:bg-orange-500 text-white text-[9px] font-mono font-black uppercase rounded transition-all text-center block cursor-pointer select-none"
                            >
                              SEND STOCK TO BAND
                            </button>
                          </div>
                        </div>
                      </div>
                    );                  });
                })()}
              </div>
              </div>
              
              {/* Split Form View */}
              {editingWarehouseItem && (
                <div className="flex-1 overflow-y-auto bg-black relative flex flex-col">
                  <AddItemView 
                    initialItem={editingWarehouseItem.id ? {
                      ...editingWarehouseItem,
                      name: editingWarehouseItem.name || (editingWarehouseItem as any).title,
                      isStorefrontActive: storefrontSyncRecord[editingWarehouseItem.id] || false
                    } : undefined}
                    onBack={() => setEditingWarehouseItem(null)}
                    onSave={async (item) => {
                      const isApparel = ['T-Shirt', 'Longsleeve', 'Cap', 'Accessory', 'Zip Hoodie', 'Pullover', 'Apparel', 'APPAREL'].includes((item as any).type || item.item_type || '');
                      const activeBandId = activeRestockBand?.id || labelRosterData[0]?.id || 'b1';

                      const processedItem = {
                        ...item,
                        title: item?.name || (item as any).title,
                        name: item?.name || (item as any).title, // Keep both for rendering safety
                        type: isApparel ? 'Apparel' : ((item as any).type || item.item_type)
                      };

                      if (isApparel) {
                        setCatalogApparel(prev => {
                          const updated = { ...prev };
                          if (!updated[activeBandId]) updated[activeBandId] = [];
                          const index = updated[activeBandId].findIndex((i: any) => i.id === item.id);
                          if (index !== -1) {
                            updated[activeBandId][index] = processedItem as any;
                          } else {
                            updated[activeBandId] = [processedItem as any, ...updated[activeBandId]];
                          }
                          return updated;
                        });
                      } else {
                        // MUSIC ITEMS: ensure 'formats' is defined for warehouse tracking
                        const musicItem = {
                          ...processedItem,
                          formats: (item as any).formats || {
                            vinyl: { warehouse_qty: item.van_stock || 0 },
                            cd: { warehouse_qty: 0 },
                            cassette: { warehouse_qty: 0 }
                          }
                        } as any;
                        setCatalogReleases(prev => {
                          const updated = { ...prev };
                          if (!updated[activeBandId]) updated[activeBandId] = [];
                          const index = updated[activeBandId].findIndex((i: any) => i.id === musicItem.id);
                          if (index !== -1) {
                            updated[activeBandId][index] = musicItem;
                          } else {
                            updated[activeBandId] = [musicItem, ...updated[activeBandId]];
                          }
                          return updated;
                        });
                      }

                      if (item.id) {
                        setStorefrontSyncRecord(prev => ({
                          ...prev,
                          [item.id!]: !!(item as any).isStorefrontActive
                        }));
                      }
                      showLocalToast(editingWarehouseItem.id ? 'Item Updated' : 'Item Added');
                      setEditingWarehouseItem(null);
                      return true;
                    }}
                    onDelete={(id) => {
                      // Check which catalog the item is in and remove it
                      const isRelease = Object.values(catalogReleases).some(arr => (arr || []).some(r => r.id === id));
                      const isApparel = Object.values(catalogApparel).some(arr => (arr || []).some(a => a.id === id));
                      
                      if (isApparel) {
                        setCatalogApparel(prev => {
                          const updated = { ...prev };
                          Object.keys(updated).forEach(bandId => {
                            updated[bandId] = updated[bandId].filter(i => i.id !== id);
                          });
                          return updated;
                        });
                      } else if (isRelease) {
                        setCatalogReleases(prev => {
                          const updated = { ...prev };
                          Object.keys(updated).forEach(bandId => {
                            updated[bandId] = updated[bandId].filter(r => r.id !== id);
                          });
                          return updated;
                        });
                      }

                      showLocalToast('Item Deleted');
                      setEditingWarehouseItem(null);
                    }}
                    triggerNotification={showLocalToast}
                  />
                </div>
              )}
            </div>
          )}
        </section>

      </main>

      {isSpecsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col text-zinc-100 animate-in fade-in duration-200">
          <div className="w-full h-full flex flex-col relative">
            <div className="absolute inset-x-0 top-0 h-1 bg-[#f97316]" />
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A] bg-zinc-900/40">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#f97316] animate-spin" style={{ animationDuration: '6s' }} />
                <h3 className="font-mono font-bold text-xs tracking-widest uppercase text-white">
                  RECORD LABEL CONSOLE: REGISTRATION & MERCHANT SETTINGS
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setIsSpecsDrawerOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* SECTION A: MEDIA ASSETS */}
              <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-[#f97316] rounded-full animate-ping" />
                  [ Section A: Corporate Media Assets / Picture Uploaders ]
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Avatar / Logo */}
                  <div className="space-y-3 flex flex-col items-center justify-center p-4 bg-black border border-zinc-900 rounded-lg">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start">Corporate Emblem / Avatar Logo</span>
                    <div className="relative group w-24 h-24 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center shadow-md">
                      {userProfile.label_avatar ? (
                        <>
                          <img 
                            src={userProfile.label_avatar} 
                            alt="Av" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUserProfile({...userProfile, label_avatar: ''});
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove logo"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <Globe className="w-10 h-10 text-zinc-650" />
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('label-avatar-uploader') as HTMLInputElement;
                        input?.click();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 rounded text-[10px] font-mono text-[#f97316] uppercase hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Logo (PNG/JPG)
                    </button>
                    <input 
                      id="label-avatar-uploader"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleImageUpload} 
                    />
                  </div>

                  {/* Cover Picture / Banner */}
                  <div className="space-y-3 flex flex-col items-center justify-center p-4 bg-black border border-zinc-900 rounded-lg">
                    <span className="text-[9px] font-mono text-zinc-400 uppercase tracking-wider block self-start">Cover Banner / Billboard Artwork</span>
                    <div className="relative group w-full h-24 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex items-center justify-center shadow-md">
                      {userProfile.label_banner ? (
                        <>
                          <img 
                            src={userProfile.label_banner} 
                            alt="Cov" 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <button 
                            type="button" 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setUserProfile({...userProfile, label_banner: ''});
                            }}
                            className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-zinc-950 z-10 cursor-pointer"
                            title="Remove cover"
                          >
                            ×
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center text-zinc-600 gap-1">
                          <Disc className="w-8 h-8 opacity-40 animate-spin" style={{ animationDuration: '10s' }} />
                          <span className="text-[8px] font-mono">[ NO BANNER LOADED ]</span>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.getElementById('label-cover-uploader') as HTMLInputElement;
                        input?.click();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-zinc-850 border border-zinc-805 rounded text-[10px] font-mono text-[#f97316] uppercase hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Upload className="w-3 h-3" />
                      Upload Banner (Aspect 16:9)
                    </button>
                    <input 
                      id="label-cover-uploader"
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={handleCoverImageUpload} 
                    />
                  </div>
                </div>
              </div>

              {/* SECTION B: IDENTITY & ROSTER CONFIG */}
              <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
                  [ Section B: Corporate Profile & Artist Roster ]
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Corporate Entity Name</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs uppercase"
                      value={userProfile.label_company_name || ''}
                      onChange={(e) => setUserProfile({...userProfile, label_company_name: e.target.value.toUpperCase()})}
                      placeholder="e.g. SLAM CORP RECORDS"
                    />
                  </div>
                  
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">URL Namespace Slug</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs lowercase"
                      value={userProfile.label_url_slug || ''}
                      onChange={(e) => setUserProfile({...userProfile, label_url_slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})}
                      placeholder="e.g. slamcorp"
                    />
                  </div>
                  
                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Primary Contact Route (Email)</label>
                    <input
                      type="email"
                      className="w-full bg-[#0c0e12]/60 border border-zinc-900 text-zinc-500 px-3 py-2 rounded font-mono text-xs"
                      value={userProfile?.email}
                      disabled
                    />
                    <p className="text-[8px] font-mono text-zinc-500 mt-1">[!] Security credential locked dynamically.</p>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Distribution HQ</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                      value={userProfile.label_headquarters || ''}
                      onChange={(e) => setUserProfile({...userProfile, label_headquarters: e.target.value})}
                      placeholder="e.g. New York, NY"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Founded Year</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                      value={userProfile.label_founded_year || ''}
                      onChange={(e) => setUserProfile({...userProfile, label_founded_year: e.target.value})}
                      placeholder="e.g. 2018"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Roster Count</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                      value={userProfile.label_roster_count || ''}
                      onChange={(e) => setUserProfile({...userProfile, label_roster_count: e.target.value})}
                      placeholder="e.g. 14"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Security Pin</label>
                    <input
                      type="password"
                      maxLength={4}
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs tracking-widest"
                      value={userProfile.label_security_pin || ''}
                      onChange={(e) => setUserProfile({...userProfile, label_security_pin: e.target.value.replace(/\D/g, '')})}
                      placeholder="****"
                    />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Default Band Roster (Comma-Separated)</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                      value={bandRosterInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setBandRosterInput(val);
                        setUserProfile({
                          ...userProfile,
                          label_band_roster: val.split(',').map(x => x.trim()).filter(Boolean)
                        });
                      }}
                      placeholder="e.g. TOMB MOLD, SANGUISUGABOGG, GOREGRIND SICKNESS"
                    />
                    <p className="text-[8.5px] text-zinc-550 font-mono">Input active roster keys separated by commas for internal mapping.</p>
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Associated Imprints & Sub-Labels</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                      value={subLabelsInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSubLabelsInput(val);
                        setUserProfile({
                          ...userProfile,
                          label_sub_labels: val.split(',').map(x => x.trim()).filter(Boolean)
                        });
                      }}
                      placeholder="e.g. Gore Grind Imprints, Special Series"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION C: LOGISTICS & OPERATIONS */}
              <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
                  [ Section C: Merchant Logistics & Legal Registry ]
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Legal Entity Classification</label>
                    <select
                      value={userProfile.label_legal_entity_type || 'LLC'}
                      onChange={(e) => setUserProfile({ ...userProfile, label_legal_entity_type: e.target.value })}
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                    >
                      {['SOLE_PROPRIETORSHIP', 'LLC', 'C_CORP', 'S_CORP', 'PARTNERSHIP'].map((t, tIdx) => (
                        <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Tax Compliance ID / EIN</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                      value={userProfile.label_tax_registration_number || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, label_tax_registration_number: e.target.value })}
                      placeholder="e.g. 12-3456789"
                    />
                  </div>

                  <div className="space-y-1 text-left md:col-span-2">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Global Distro / Fulfillment Model</label>
                    <select
                      value={userProfile.label_master_distro_model || 'IN_HOUSE_FULFILLMENT'}
                      onChange={(e) => setUserProfile({ ...userProfile, label_master_distro_model: e.target.value })}
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs select-none"
                    >
                      {['IN_HOUSE_FULFILLMENT', 'THIRD_PARTY_DISTRIBUTION', 'PRINT_ON_DEMAND_DROP_SHIP'].map((t, tIdx) => (
                        <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Shipping Origin Zip / Postal Code</label>
                    <input
                      type="text"
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                      value={userProfile.label_shipping_postal_code || ''}
                      onChange={(e) => setUserProfile({ ...userProfile, label_shipping_postal_code: e.target.value })}
                      placeholder="e.g. 90210"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Fulfillment Shipping Region</label>
                    <select
                      value={userProfile.label_shipping_country || 'US'}
                      onChange={(e) => setUserProfile({ ...userProfile, label_shipping_country: e.target.value })}
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs"
                    >
                      <option value="US" className="bg-black">United States (US)</option>
                      <option value="UK" className="bg-black">United Kingdom (UK)</option>
                      <option value="EU" className="bg-black">European Union (EU)</option>
                      <option value="CA" className="bg-black">Canada (CA)</option>
                      <option value="AU" className="bg-black">Australia (AU)</option>
                      <option value="GLOBAL" className="bg-black">Global (GLOBAL)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION D: ACQUISITIONS & CONTRACTS */}
              <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
                  [ Section D: Acquisition Splitting Ledger ]
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#07090d] p-3 border border-zinc-900 rounded-lg">
                    <label className="text-[9.5px] uppercase font-mono tracking-widest text-[#f97316] font-bold">Default Contract Split Percentage</label>
                    <div className="text-xs font-mono font-black text-zinc-200 bg-zinc-900 px-2.5 py-1 rounded border border-zinc-800">
                      LABEL: <span className="text-[#f97316]">{userProfile.label_default_contract_split ?? 50}%</span> / ARTIST: <span className="text-[#00ffcc]">{100 - (userProfile.label_default_contract_split ?? 50)}%</span>
                    </div>
                  </div>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    className="w-full accent-[#f97316] cursor-pointer h-2 bg-zinc-900 rounded-lg appearance-none"
                    value={userProfile.label_default_contract_split ?? 50}
                    onChange={(e) => setUserProfile({ ...userProfile, label_default_contract_split: Number(e.target.value) })}
                  />
                  <p className="text-[8.5px] text-zinc-550 font-mono uppercase">[ DRAG TO EDIT DEFAULT SPLIT. ALL DIRECT STOREFRONT TRANSACTIONS AUTOMATICALLY ROUTED BASED ON THESE VALUES. ]</p>

                  <div className="space-y-1 text-left mt-3 pt-2">
                    <label className="text-[9px] uppercase font-mono tracking-widest text-zinc-400">Digital Accreditation Scheme</label>
                    <select
                      value={userProfile.label_digital_accreditation_scheme || 'LABEL_PROVIDES_INDEPENDENT_CODES'}
                      onChange={(e) => setUserProfile({ ...userProfile, label_digital_accreditation_scheme: e.target.value })}
                      className="w-full bg-[#0c0e12] border border-[#1A1A1A] text-zinc-200 px-3 py-2 rounded focus:outline-none focus:border-[#f97316] font-mono text-xs select-none"
                    >
                      {['LABEL_PROVIDES_INDEPENDENT_CODES', 'PLATFORM_GENERATES_AUTOMATICALLY'].map((t, tIdx) => (
                        <option key={`${t}-${tIdx}`} value={t} className="bg-black text-xs">{t.replace(/_/g, ' ')}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION E: TAXONOMY */}
              <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
                  [ Section E: Label's Genre Preferences ]
                </h4>
                
                <div className="space-y-4">
                  {[
                    {
                      name: 'CLUSTER 01: EXTREME METAL',
                      genres: ['DEATH METAL', 'SLAMMING BDM', 'BRUTAL DEATH METAL', 'BRUTAL DEATHCORE', 'TECHNICAL BDM', 'DEATH N\' ROLL', 'TECH DEATH', 'BLASTING BDM', 'GRINDCORE', 'DEATHGRIND', 'GOREGRIND/PORNOGRIND', 'THRASH METAL', 'DEATH THRASH', 'MELODIC DEATH', 'OSDM', 'DOOM', 'BLACK METAL', 'BLACKENED DEATH', 'SYMPHONIC BLACK', 'DEATHCORE', 'PROGRESSIVE DEATH']
                    },
                    {
                      name: 'CLUSTER 02: ROCK/HEAVY METAL',
                      genres: ['TRADITIONAL HEAVY METAL', 'DOOM METAL', 'STONER METAL', 'SLUDGE METAL', 'STONER ROCK', 'PROG METAL', 'POWER METAL', 'ALTERNATIVE ROCK', 'GOTHIC ROCK', 'HARD ROCK', 'NEW WAVE', 'FOLK METAL', 'AVANT-GARDE', 'DJENT', 'MATHCORE', 'MATH ROCK', 'SHOE GAZE', 'NOISE ROCK', 'INDIE ROCK', 'NU METAL']
                    },
                    {
                      name: 'CLUSTER 03: HARDCORE',
                      genres: ['TRADITIONAL HARDCORE', 'METALCORE', 'BEATDOWN', 'YOUTH CREW', 'FASTCORE', 'POST HARDCORE', 'MELODIC HARDCORE', 'SKRAMZ/SCREAMO', 'POWER VIOLENCE', 'MINCECORE']
                    },
                    {
                      name: 'CLUSTER 04: PUNK/ALTERNATIVE',
                      genres: ['PUNK ROCK', 'POP PUNK', 'MATH ROCK', 'MIDWEST EMO', 'SKATE PUNK', 'MELODIC PUNK', 'INDIE PUNK', 'POST PUNK', 'GRUNGE']
                    },
                    {
                      name: 'CLUSTER 05: INDUSTRIAL/EDM',
                      genres: ['EBM', 'SYNTHWAVE', 'DARKWAVE/COLD WAVE', 'AGGROTECH/TERROR EBM', 'TECHNO', 'INDUSTRIAL METAL', 'DUBSTEP', 'DRUM & BASS', 'GABBER/HARDSTYLE', 'BREAKCORE', 'HARSH NOISE WALL', 'WITCH HOUSE']
                    },
                    {
                      name: 'CLUSTER 06: HIP HOP/RAP',
                      genres: ['UNDERGROUND RAP', 'TRAP', 'BOOM BAP', 'PHONK', 'DRILL', 'CLOUD RAP', 'EXPERIMENTAL', 'GRIME']
                    }
                  ].map((cluster, idx) => {
                    const currentGenres = userProfile.label_genres || [];
                    const activeInCluster = cluster.genres.filter(genre => currentGenres.includes(genre));
                    const isExpanded = !!expandedClusters[cluster.name];
                    
                    return (
                      <div key={`${cluster.name}-${idx}`} className="p-3 bg-black border border-zinc-900 rounded-lg space-y-3">
                        <button
                          type="button"
                          onClick={() => setExpandedClusters(prev => {
                            const wasExpanded = !!prev[cluster.name];
                            return { [cluster.name]: !wasExpanded };
                          })}
                          className="w-full flex items-center justify-between text-left select-none group"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[8.5px] font-mono text-zinc-400 font-bold uppercase tracking-wider group-hover:text-[#f97316] transition-colors">
                              {cluster.name}
                            </span>
                            {activeInCluster.length > 0 && (
                              <span className="text-[8px] font-mono bg-[#f97316]/10 border border-[#f97316]/20 text-[#f97316] px-1.5 py-0.5 rounded-full leading-none">
                                {activeInCluster.length} ACTIVE
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 transition-colors">
                            {isExpanded ? '[ COLLAPSE ]' : '[ EXPAND ]'}
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="flex flex-wrap gap-1.5 pt-1 animate-fade-in">
                            {cluster.genres.map((genre, idx) => {
                              const isActive = currentGenres.includes(genre);
                              return (
                                <button
                                  key={`${genre}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    const updated = isActive 
                                      ? currentGenres.filter(x => x !== genre) 
                                      : [...currentGenres, genre];
                                    setUserProfile({ ...userProfile, label_genres: updated });
                                  }}
                                  className={`px-2 py-0.5 text-[8px] font-mono uppercase tracking-wider rounded border transition-all ${
                                    isActive 
                                      ? 'bg-[#f97316]/15 border-[#f97316] text-[#f97316] shadow-sm shadow-[#f97316]/10'
                                      : 'bg-[#0a0c10] border-zinc-900 text-zinc-550 hover:border-zinc-800 hover:text-zinc-400'
                                  }`}
                                >
                                  {genre}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION F: MERCHANT KEYS */}
              <div className="space-y-4 bg-zinc-950/40 p-4 rounded-xl border border-[#1A1A1A]">
                <h4 className="text-[10px] uppercase font-mono tracking-widest text-[#f97316] font-bold">
                  [ Section F: Merchant Payout Accounts & OAuth Connections ]
                </h4>
                
                {activeClearanceLevel < 5 && (
                  <div className="p-3 bg-red-950/15 border border-red-950/40 rounded-xl text-red-400 text-[10px] leading-relaxed font-sans text-left">
                    ⚠️ <strong>FINANCIAL ACCOUNT LOCKOUT:</strong> Level 5 Owner privilege is required to disconnect or update merchant payout routers. Level {activeClearanceLevel} has view-only telemetry rights over billing parameters.
                  </div>
                )}
                
                <div className="space-y-4">
                  {/* Stripe Area */}
                  <div className="p-4 bg-black border border-zinc-900 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-1.5">
                        <CreditCard className="w-4 h-4 text-[#00ffcc]" />
                        <span className="text-[10px] font-mono text-white font-bold uppercase">Stripe Processing Node</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono text-[8.5px] font-bold ${
                        userProfile.label_stripe_connected && userProfile.stripe_customer_id
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}>
                        {userProfile.label_stripe_connected && userProfile.stripe_customer_id ? '● LIVE SYNCED' : '○ DISCONNECTED'}
                      </span>
                    </div>

                    {userProfile.stripe_customer_id ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between bg-[#0c0e12] border border-zinc-900 p-3 rounded-lg text-left">
                          <div className="min-w-0">
                            <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Connected Merchant Account</span>
                            <span className="text-xs font-mono text-[#00ffcc] font-bold truncate block">{userProfile.stripe_customer_id}</span>
                          </div>
                          <button
                            type="button"
                            disabled={activeClearanceLevel < 5}
                            onClick={() => {
                              setUserProfile({
                                ...userProfile,
                                stripe_customer_id: '',
                                label_stripe_connected: false
                              });
                              showLocalToast("Stripe Connect account disconnected.");
                            }}
                            className="text-[9.5px] font-mono text-red-400 hover:text-red-300 font-bold px-2.5 py-1.5 bg-red-950/20 border border-red-950/40 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={activeClearanceLevel < 5}
                          onClick={() => {
                            setLabelOAuthProcessor({ id: 'stripe', name: 'Stripe Connect' });
                            setLabelOAuthStep(0);
                          }}
                          className="w-full py-2.5 bg-[#00ffcc] hover:bg-[#0fd9ae] text-black font-mono font-bold uppercase text-[9.5px] tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-md shadow-[#00ffcc]/10 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Connect Stripe via OAuth
                        </button>
                      </div>
                    )}
                  </div>

                  {/* PayPal Area */}
                  <div className="p-4 bg-black border border-zinc-900 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                      <div className="flex items-center gap-1.5">
                        <Banknote className="w-4 h-4 text-sky-400" />
                        <span className="text-[10px] font-mono text-white font-bold uppercase">PayPal Business Wallet</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded font-mono text-[8.5px] font-bold ${
                        userProfile.label_paypal_connected && userProfile.paypal_email
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}>
                        {userProfile.label_paypal_connected && userProfile.paypal_email ? '● LIVE SYNCED' : '○ DISCONNECTED'}
                      </span>
                    </div>

                    {userProfile.paypal_email ? (
                      <div className="space-y-2.5 pt-1">
                        <div className="flex items-center justify-between bg-[#0c0e12] border border-zinc-900 p-3 rounded-lg text-left">
                          <div className="min-w-0">
                            <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-wider block">Connected PayPal Account</span>
                            <span className="text-xs font-mono text-sky-400 font-bold truncate block">{userProfile.paypal_email}</span>
                          </div>
                          <button
                            type="button"
                            disabled={activeClearanceLevel < 5}
                            onClick={() => {
                              setUserProfile({
                                ...userProfile,
                                paypal_email: '',
                                label_paypal_connected: false
                              });
                              showLocalToast("PayPal Account disconnected.");
                            }}
                            className="text-[9.5px] font-mono text-red-400 hover:text-red-300 font-bold px-2.5 py-1.5 bg-red-950/20 border border-red-950/40 rounded transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            Disconnect
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2">
                        <button
                          type="button"
                          disabled={activeClearanceLevel < 5}
                          onClick={() => {
                            setLabelOAuthProcessor({ id: 'paypal', name: 'PayPal' });
                            setLabelOAuthStep(0);
                          }}
                          className="w-full py-2.5 bg-sky-500 hover:bg-sky-400 text-white font-mono font-bold uppercase text-[9.5px] tracking-widest rounded-lg flex items-center justify-center gap-1.5 transition duration-150 cursor-pointer shadow-md shadow-sky-500/10 disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                          Connect PayPal via OAuth
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Deferred Checkbox */}
                  <div className="flex items-center gap-2.5 p-1 text-left">
                    <input
                      id="payment-deferred-switch"
                      type="checkbox"
                      checked={!!userProfile.label_setup_payment_later}
                      onChange={(e) => setUserProfile({ ...userProfile, label_setup_payment_later: e.target.checked })}
                      className="w-4 h-4 rounded accent-[#f97316] bg-[#0c0e12] border-zinc-900 cursor-pointer"
                    />
                    <label htmlFor="payment-deferred-switch" className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider cursor-pointer">
                      Deferred: setup direct checking gateways at payout phase
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#1A1A1A] flex justify-end gap-3 bg-zinc-950/60">
              <button
                type="button"
                onClick={() => setIsSpecsDrawerOpen(false)}
                className="px-5 py-2.5 bg-zinc-900 text-zinc-400 font-mono text-xs rounded border border-zinc-850 hover:bg-zinc-800 hover:text-white font-bold transition-all"
              >
                DISCARD EDITS
              </button>
              <button
                type="button"
                onClick={() => setIsSpecsDrawerOpen(false)}
                className="px-6 py-2.5 bg-[#f97316] text-black font-black font-mono text-xs tracking-widest rounded hover:bg-orange-400 font-bold transition-all shadow-md shadow-[#f97316]/10"
              >
                COMMIT STATE
              </button>
            </div>
          </div>
        </div>
      )}

    {/* RECORD LABEL MESSAGES INBOX OVERLAY */}
    <AnimatePresence>
      {isInboxOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col pt-safe text-zinc-100"
        >
          {/* Header section with clean human-centric text */}
          <div className="border-b border-zinc-900 bg-[#07080a] p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-950/40 border border-[#f97316]/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-[#f97316]" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-mono text-white tracking-widest uppercase flex items-center gap-2">
                  Label Message Center
                </h2>
                <p className="text-[10px] text-zinc-500 uppercase mt-0.5 font-mono">
                  Direct discussions and booking inquiries with signed bands & coordinators
                </p>
              </div>
            </div>

            {/* Status metrics bar */}
            <div className="flex flex-wrap items-center gap-4 text-[9px] font-mono text-zinc-400 bg-zinc-950/60 px-4 py-2 border border-zinc-900 w-full sm:w-auto rounded-xl">
              <div>
                LOGGED IN AS: <span className="text-[#f97316] font-bold">{(userProfile.label_company_name || 'NEXUS LABEL HQ').toUpperCase()}</span>
              </div>
              <div className="hidden sm:block text-zinc-800">|</div>
              <div>
                SYSTEM INTEGRITY: <span className="text-emerald-400 font-bold">SECURE</span>
              </div>
              <div className="hidden sm:block text-zinc-800">|</div>
              <button
                type="button"
                onClick={() => setIsInboxOpen(false)}
                className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-350 font-bold px-3 py-1 rounded text-[10px] uppercase tracking-wider transition-all hover:bg-zinc-800 w-full sm:w-auto hover:text-white active:scale-95 cursor-pointer flex items-center gap-1.5 justify-center"
              >
                <X className="w-3.5 h-3.5 text-zinc-400" />
                <span>CLOSE INBOX</span>
              </button>
            </div>
          </div>

          {/* Sub-tab navigation bar */}
          <div className="border-b border-zinc-900 bg-[#07080a] flex items-center p-2.5 gap-2 select-none">
            <button
              type="button"
              onClick={() => setInboxSubTab('conversations')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all font-mono uppercase cursor-pointer ${
                inboxSubTab === 'conversations'
                  ? 'bg-orange-600/25 border border-[#f97316]/40 text-orange-300'
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
                  ? 'bg-orange-600/25 border border-[#f97316]/40 text-orange-300'
                  : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
              }`}
            >
              2. Active Chat Stream
            </button>
          </div>

          {/* Split Workspace Dynamic View */}
          <div className="flex-1 overflow-hidden w-full h-full bg-[#07080a] flex flex-col">
            
            {inboxSubTab === 'conversations' ? (
              /* Tab 1: List of Band Chats */
              <div className="flex-1 overflow-y-auto p-4 max-w-2xl mx-auto w-full space-y-4">
                <div className="pb-2 border-b border-zinc-900">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 font-mono">
                    Active Communication Channels
                  </span>
                  <p className="text-[11px] text-zinc-400 font-mono mt-1">
                    Choose any incoming thread or active band support line below to open live communications.
                  </p>
                </div>

                <div className="space-y-3 mt-4">
                  {INBOX_CHANNELS.map((channel, idx) => {
                    const isCurrentlyActive = activeInboxChatId === channel.id;
                    const threadMsgs = inboxMessages[channel.id] || [];
                    const lastMsg = threadMsgs.length > 0 ? threadMsgs[threadMsgs.length - 1] : null;
                    const snippet = lastMsg ? lastMsg.text : "Connecting to line...";
                    
                    return (
                      <div
                        key={`${channel.id}-${idx}`}
                        className={`w-full relative transition-all rounded-2xl border group ${
                          isCurrentlyActive 
                            ? 'bg-zinc-900/40 border-[#f97316]/40 text-white shadow-md shadow-orange-950/5' 
                            : 'bg-zinc-950/30 hover:bg-zinc-950 border-zinc-900 hover:border-zinc-800 text-zinc-300'
                        }`}
                      >
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setInboxChannels(prev => prev.filter(c => c.id !== channel.id));
                            if (activeInboxChatId === channel.id) setActiveInboxChatId(null);
                            showLocalToast('Conversation Deleted');
                          }}
                          className="absolute right-3 top-3 p-1.5 rounded-lg bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all z-10"
                          title="Delete Conversation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveInboxChatId(channel.id);
                            setInboxSubTab('chat');
                          }}
                          className="w-full p-4 text-left flex items-start gap-4"
                        >
                        <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-mono text-xs font-black shrink-0 ${channel.badgeColor}`}>
                          {channel.avatarText}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="font-mono text-xs font-black truncate block uppercase text-white">
                              {channel.name}
                            </span>
                          </div>
                          <span className="text-[8.5px] text-zinc-500 font-mono uppercase block mt-1">
                            {channel.category}
                          </span>
                          <p className="text-xs text-zinc-400 font-mono truncate block mt-2.5 leading-relaxed">
                            {lastMsg?.sender === 'label' ? 'You: ' : ''}{snippet}
                          </p>
                        </div>
                        
                        {isCurrentlyActive && (
                          <div className="absolute right-10 top-4.5 w-2 h-2 rounded-full bg-[#f97316] animate-pulse" />
                        )}
                      </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Tab 2: Message Stream Detail */
              <div className="flex-1 flex flex-col h-full bg-[#07080a] overflow-hidden relative">
                
                {/* Selected channel info bar */}
                {(() => {
                  const activeChanObj = INBOX_CHANNELS.find(c => c.id === activeInboxChatId);
                  if (!activeChanObj) {
                    return (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-black/30">
                        <MessageSquare className="w-12 h-12 text-zinc-800 mb-3" />
                        <span className="text-xs text-zinc-500 font-mono uppercase tracking-wider block">No channel selected</span>
                        <button
                          type="button"
                          onClick={() => setInboxSubTab('conversations')}
                          className="mt-4 bg-[#f97316] hover:bg-orange-500 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all cursor-pointer"
                        >
                          Browse Conversations
                        </button>
                      </div>
                    );
                  }
                  
                  const textStream = getThreadMessages();

                  return (
                    <>
                      <div className="p-4 bg-zinc-950/70 border-b border-zinc-900 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setInboxSubTab('conversations')}
                            className="mr-1 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 p-2 rounded-xl text-[10px] font-mono transition-all flex items-center gap-1 cursor-pointer uppercase font-black"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 text-[#f97316]" />
                            <span>Channel List</span>
                          </button>
                          <div>
                            <h4 className="text-xs font-black font-mono text-white uppercase tracking-wider">
                              {activeChanObj.name}
                            </h4>
                            <span className="text-[9px] text-zinc-400 font-mono uppercase block mt-0.5">
                              {activeChanObj.category}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 bg-emerald-950/20 border border-emerald-500/30 px-3 py-1 rounded-lg text-[9px] font-mono text-emerald-400 shrink-0 uppercase font-black">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          LINE OPEN
                        </div>
                      </div>

                      {/* Interactive quick reply proposals */}
                      <div className="px-4 py-2 bg-zinc-950 border-b border-zinc-900 flex flex-wrap gap-2 items-center select-none">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider mr-1">QUICK REPLIES:</span>
                        {activeInboxChatId === 'tomb-mold-rep' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("I checked with the printing plant! The vinyl shipments are finalized to hit your first three show venues by Friday morning.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ LP Delivery Confirmed ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Excellent. Staging files are approved. Let's arrange our freight carrier coordinates tonight.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Approve Stage Logistics ]
                            </button>
                          </>
                        )}
                        {activeInboxChatId === 'blood-incantation-manager' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Confirmed our cover feature schedule with Decibel! The official print cutoff is tomorrow at 5 PM. Sending final materials now.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Decibel Cutoff confirmed ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Our master audio stems are fully validated and packed into the secure core Vault. Let's schedule the Campaign call.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Schedule Campaign Call ]
                            </button>
                          </>
                        )}
                        {activeInboxChatId === 'nexus-pr-coordinator' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Sleeve graphics and full master audio loops have been uploaded and encrypted. Please check the press directory.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-zinc-300 rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Upload completed ]
                            </button>
                            <button
                              type="button"
                              onClick={() => handleSendInboxReply("Decibel print draft page is approved. Premier schedule is locked. Thanks for coordinating.")}
                              className="px-2.5 py-1 bg-zinc-900 hover:bg-zinc-855 border border-zinc-800 hover:border-[#f97316] hover:text-white text-[#fff] rounded text-[9.5px] font-mono transition-colors active:scale-98 cursor-pointer uppercase"
                            >
                              [ Approve print layouts ]
                            </button>
                          </>
                        )}
                      </div>

                      {/* Message stream */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col justify-end bg-black/40">
                        <div className="space-y-4 max-w-3xl mx-auto w-full">
                          {textStream.map((msg: any, idx) => {
                            const isMe = msg.sender === 'label';
                            return (
                              <div
                                key={`${msg.id}-${idx}`}
                                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-mono font-bold text-zinc-500 uppercase">
                                    {isMe ? 'LABEL MANAGER (YOU)' : activeChanObj.name}
                                  </span>
                                  <span className="text-[9px] font-mono text-zinc-600">•</span>
                                  <span className="text-[8.5px] font-mono text-zinc-500">{msg.timestamp}</span>
                                </div>
                                <div className={`p-4 rounded-2xl max-w-lg font-mono text-xs leading-relaxed border ${
                                  isMe 
                                    ? 'bg-orange-950/20 border-[#f97316]/30 text-zinc-150 rounded-tr-none' 
                                    : 'bg-zinc-950/80 border-zinc-900 text-zinc-300 rounded-tl-none'
                                }`}>
                                  {msg.text}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Message input controls */}
                      <div className="p-4 bg-zinc-950/80 border-t border-zinc-900">
                        <form
                          onSubmit={(e) => {
                            e.preventDefault();
                            handleSendInboxReply();
                          }}
                          className="max-w-3xl mx-auto flex items-center gap-3"
                        >
                          <input
                            type="text"
                            value={inboxReplyDraft}
                            onChange={(e) => setInboxReplyDraft(e.target.value)}
                            placeholder={`Type response to ${activeChanObj.name}...`}
                            className="flex-1 bg-[#090b0e] border border-zinc-800 hover:border-zinc-700/60 focus:border-[#f97316] rounded-xl px-4 py-3 text-xs font-mono text-zinc-100 placeholder-zinc-505 focus:outline-none transition-all"
                          />
                          <button
                            type="submit"
                            className="bg-[#f97316] hover:bg-orange-500 text-black font-black font-mono text-xs uppercase tracking-widest px-5 py-3 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
                          >
                            <Send className="w-3.5 h-3.5 text-black" />
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

    {/* CASH DRAWER MODAL */}
    <AnimatePresence>
      {isCashDrawerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <CashDrawerView 
              onClose={() => setIsCashDrawerOpen(false)}
              transactions={cashTransactions}
              setTransactions={setCashTransactions}
              triggerNotification={showLocalToast}
            />
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* BUNDLE CREATOR OVERLAY MODAL */}
    <LabelBundleModal
      isOpen={isBundleModalOpen}
      onClose={() => setIsBundleModalOpen(false)}
      catalogReleases={catalogReleases}
      catalogApparel={catalogApparel}
      bundleItems={bundleItems}
      setBundleItems={setBundleItems}
      bundlePrice={bundlePrice}
      setBundlePrice={setBundlePrice}
      setPosCart={setPosCart}
      showLocalToast={showLocalToast}
    />

    {/* PUBLIC STOREFRONT OVERLAY MODAL */}
    <AnimatePresence>
      {isPublicStorefrontOpen && (
        <PublicStorefrontView
          catalogReleases={catalogReleases}
          catalogApparel={catalogApparel}
          storefrontSyncRecord={storefrontSyncRecord}
          labelName={userProfile.label_company_name || 'UNDEFINED'}
          onClose={() => setIsPublicStorefrontOpen(false)}
          triggerNotification={showLocalToast}
        />
      )}
    </AnimatePresence>

    {/* ONBOARD NEW BAND MODAL */}
    <LabelOnboardBandModal
      isOpen={isOnboardModalOpen}
      onClose={() => setIsOnboardModalOpen(false)}
      onSubmit={handleOnboardBand}
      newBandName={newBandName}
      setNewBandName={setNewBandName}
      newBandHandle={newBandHandle}
      setNewBandHandle={setNewBandHandle}
      newBandStatus={newBandStatus}
      setNewBandStatus={setNewBandStatus}
      newBandSplit={newBandSplit}
      setNewBandSplit={setNewBandSplit}
      newBandInventory={newBandInventory}
      setNewBandInventory={setNewBandInventory}
      newBandActiveLp={newBandActiveLp}
      setNewBandActiveLp={setNewBandActiveLp}
    />

    {/* PING BAND MODAL */}
    <LabelPingBandModal
      activePingBand={activePingBand}
      onClose={() => setActivePingBand(null)}
      onSubmit={handlePingBandSubmit}
      pingMessage={pingMessage}
      setPingMessage={setPingMessage}
    />

    {/* SHIP ROAD STOCK MODAL */}
    <LabelShipRoadStockModal
      activeShipRoadStockBand={activeShipRoadStockBand}
      onClose={() => setActiveShipRoadStockBand(null)}
      onSubmit={handleShipRoadStockSubmit}
      shipRoadStockType={shipRoadStockType}
      setShipRoadStockType={setShipRoadStockType}
      shipRoadStockQty={shipRoadStockQty}
      setShipRoadStockQty={setShipRoadStockQty}
    />

    {/* RE-AUDIT SPLIT PERCENT MODAL */}
    <LabelReAuditSplitModal
      activeReAuditBand={activeReAuditBand}
      onClose={() => setActiveReAuditBand(null)}
      onSubmit={handleReAuditSubmit}
      newPhysicalSplit={newPhysicalSplit}
      setNewPhysicalSplit={setNewPhysicalSplit}
      newDigitalSplit={newDigitalSplit}
      setNewDigitalSplit={setNewDigitalSplit}
    />

    {/* MERCH PRODUCTION INTAKE MODAL */}
    <LabelMerchIntakeModal
      isOpen={isMerchIntakeOpen}
      onClose={() => setIsMerchIntakeOpen(false)}
      merchIntakeForm={merchIntakeForm}
      setMerchIntakeForm={setMerchIntakeForm}
      showLocalToast={showLocalToast}
    />

    {/* WAREHOUSE RESTOCK TO BAND MODAL */}
    <LabelWarehouseRestockModal
      activeRestockBand={activeRestockBand}
      onClose={() => setActiveRestockBand(null)}
      onSubmit={handleWarehouseRestockSubmit}
      selectedRestockItemId={selectedRestockItemId}
      setSelectedRestockItemId={setSelectedRestockItemId}
      selectedRestockFormat={selectedRestockFormat}
      setSelectedRestockFormat={setSelectedRestockFormat}
      restockQty={restockQty}
      setRestockQty={setRestockQty}
      catalogReleases={catalogReleases}
      catalogApparel={catalogApparel}
    />

    {/* LABEL MOCK OAUTH MODAL OVERLAY */}
    <LabelOAuthModal
      labelOAuthProcessor={labelOAuthProcessor}
      setLabelOAuthProcessor={setLabelOAuthProcessor}
      labelOAuthStep={labelOAuthStep}
      setLabelOAuthStep={setLabelOAuthStep}
      userProfile={userProfile}
      setUserProfile={setUserProfile}
      showLocalToast={showLocalToast}
    />

    </div>
  );
}
