import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import QRCode from 'react-qr-code';
import { 
  ArrowLeft, ChevronLeft, Share2, Download, Image as ImageIcon, Sparkles, 
  Trash2, RotateCw, Type, Palette, Star, Smartphone, HelpCircle, 
  AlertTriangle, Flame, ShieldAlert, Award, Hash, Check,
  QrCode, UserPlus, Users, CheckCircle2, Ticket, FileText, Copy, Plus, Search,
  ChevronDown, ChevronUp, ShoppingBag, Globe
} from 'lucide-react';
import { InventoryItem, LoyaltyMember, StagedDistroItem } from '../../../types';
import { getSupabase } from '../../../supabase';
import DevBandDistroDeck from './DevBandDistroDeck';

interface PromoHubViewProps {
  inventory: InventoryItem[];
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  activeBandName: string;
  loyaltyMembers?: LoyaltyMember[];
  setLoyaltyMembers?: React.Dispatch<React.SetStateAction<LoyaltyMember[]>>;
  initialSubTab?: 'distro' | 'stories' | 'loyalty';
  shows?: any[];
  initialSelectedItemId?: string;
  onNavigateToTab?: (tab: string) => void;
  stagedDistroItems: StagedDistroItem[];
  setStagedDistroItems: React.Dispatch<React.SetStateAction<StagedDistroItem[]>>;
  subTabMode?: 'stories_only' | 'loyalty_only' | 'all';
  onCollapse?: () => void;
}

export default function PromoHubView({
  inventory,
  onBack,
  triggerNotification,
  addLog,
  activeBandName,
  loyaltyMembers: propLoyaltyMembers,
  setLoyaltyMembers: propSetLoyaltyMembers,
  initialSubTab,
  shows = [],
  initialSelectedItemId,
  onNavigateToTab,
  stagedDistroItems,
  setStagedDistroItems,
  subTabMode = 'all',
  onCollapse
}: PromoHubViewProps) {
  // Setup loyalty backups if undefined
  const [internalLoyaltyMembers, setInternalLoyaltyMembers] = useState<LoyaltyMember[]>([]);
  const loyaltyMembers = propLoyaltyMembers || internalLoyaltyMembers;
  const setLoyaltyMembers = propSetLoyaltyMembers || setInternalLoyaltyMembers;

  const [activeSubTab, setActiveSubTab] = useState<'distro' | 'stories' | 'loyalty'>(() => {
    if (subTabMode === 'stories_only') return 'stories';
    if (subTabMode === 'loyalty_only') return 'loyalty';
    return initialSubTab || 'distro';
  });

  useEffect(() => {
    if (subTabMode === 'stories_only') {
      setActiveSubTab('stories');
    } else if (subTabMode === 'loyalty_only') {
      setActiveSubTab('loyalty');
    } else if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, subTabMode]);

  // Reset scroll on inner elements of sub-tab change within PromoHubView (without scrolling the main window)
  useEffect(() => {
    const scrollableDivs = document.querySelectorAll('.promo-hub-scrollable');
    scrollableDivs.forEach(div => {
      div.scrollTop = 0;
    });
  }, [activeSubTab]);

  // Find urgent alert-worthy items
  const urgentItems = inventory.filter(item => item.van_stock < 10 || item.is_exclusive);

  // Selected item to promote
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(() => {
    if (initialSelectedItemId) {
      const found = inventory.find(i => i.id === initialSelectedItemId);
      if (found) return found;
    }
    return urgentItems.length > 0 ? urgentItems[0] : (inventory.length > 0 ? inventory[0] : null);
  });

  useEffect(() => {
    if (initialSelectedItemId) {
      const found = inventory.find(i => i.id === initialSelectedItemId);
      if (found) {
        setSelectedItem(found);
      }
    }
  }, [initialSelectedItemId, inventory]);

  // Story state controls
  const [headline, setHeadline] = useState('LIMITED RUN EXCLUSIVE');
  const [customPrice, setCustomPrice] = useState(selectedItem ? `$${selectedItem.price}` : '$25.00');
  const [bottomCallToAction, setBottomCallToAction] = useState('TAP CARD / ASK AT BOX OFFICE');
  const [stickerType, setStickerType] = useState<'LOW_STOCK' | 'TOUR_ONLY' | 'LAST_CHANCE' | 'NONE'>('LOW_STOCK');
  const [linkSticker, setLinkSticker] = useState(true);
  
  // Custom image background upload
  const [bgImage, setBgImage] = useState<string | null>(null);
  const [bgType, setBgType] = useState<'gradient' | 'image'>('gradient');
  const [activeGradient, setActiveGradient] = useState<number>(0);

  // Captions AI-simulate generator
  const [captionVibe, setCaptionVibe] = useState<'hype' | 'heavy-metal' | 'minimal' | 'cryptic'>('hype');
  const [generatedCaption, setGeneratedCaption] = useState('');

  // --- COMPLETE SOCIAL PROMO UPGRADES ---
  const [promoType, setPromoType] = useState<'merch' | 'shows' | 'custom'>('merch');
  
  // Format preset ratios
  const [storyFormat, setStoryFormat] = useState<'story' | 'feed' | 'landscape'>('story');

  // Interactive Theme Overlay Color Filters
  const [colorFilter, setColorFilter] = useState<'none' | 'toxic-acid' | 'crimson' | 'cyberpunk' | 'monochrome' | 'sepia'>('none');

  // Text adjustments:
  const [fontTheme, setFontTheme] = useState<'sans' | 'mono' | 'serif' | 'display' | 'heavy'>('mono');
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [textColor, setTextColor] = useState<'white' | 'teal' | 'red' | 'purple' | 'yellow' | 'green'>('white');
  const [textPosition, setTextPosition] = useState<'top' | 'middle' | 'bottom' | 'split'>('split');
  const [fontScale, setFontScale] = useState<number>(14); // in px
  const [textShadowStyle, setTextShadowStyle] = useState<'none' | 'black-glow' | 'block-shadow' | 'stencil'>('black-glow');

  // Custom multi-line text boxes
  const [line1CustomText, setLine1CustomText] = useState('TOUR FLYER DROP');
  const [line2CustomText, setLine2CustomText] = useState('ALONG WITH SUPPORT BANDS');
  const [line3CustomText, setLine3CustomText] = useState('TICKETS ON LEASH NOW');

  // QR Code Overlay
  const [showQrOverlay, setShowQrOverlay] = useState(false);
  const [qrOverlayPosition, setQrOverlayPosition] = useState<'bottom-right' | 'bottom-left' | 'center-bottom'>('bottom-right');
  const [qrOverlayScale, setQrOverlayScale] = useState<number>(45); // width in pixels
  const [qrOverlayUrl, setQrOverlayUrl] = useState('');

  // Sourced Shows lists (with simulated fallback if empty)
  const defaultSimulatedShows = [
    { id: 'sim-1', date: '2026-06-12', venue_name: 'The Skull Casket', city: 'Cudahy', state_province: 'WI', capacity: 350, support_artists: 'Internal Bleeding' },
    { id: 'sim-2', date: '2026-06-15', venue_name: 'Sub-Zero Terminal', city: 'Detroit', state_province: 'MI', capacity: 700, support_artists: 'Cryptopsy' },
    { id: 'sim-3', date: '2026-06-19', venue_name: 'Saint Vitus Bar', city: 'Brooklyn', state_province: 'NY', capacity: 250, support_artists: 'Skinless' },
  ];
  
  const activeShowsList = (shows && shows.length > 0) ? shows : defaultSimulatedShows;
  const [selectedShow, setSelectedShow] = useState<any>(activeShowsList[0] || null);
  const [showBadge, setShowBadge] = useState<'NONE' | 'SELLING_FAST' | 'LOW_TICKETS' | 'TONIGHT' | 'SOLD_OUT'>('SELLING_FAST');
  const [showTicketPrice, setShowTicketPrice] = useState('$15 ADV / $20 DOS');
  const [isCopywriterOpen, setIsCopywriterOpen] = useState(false);

  // Text formatting dynamic classes and inline styles helper
  const getCustomLineClass = () => {
    let fontClass = 'font-mono font-bold';
    if (fontTheme === 'sans') fontClass = 'font-sans font-bold';
    if (fontTheme === 'serif') fontClass = 'font-serif italic font-bold';
    if (fontTheme === 'display') fontClass = 'font-display font-black tracking-tight uppercase';
    if (fontTheme === 'heavy') fontClass = 'font-sans font-extrabold tracking-tighter uppercase leading-none';

    let colorClass = 'text-white';
    if (textColor === 'teal') colorClass = 'text-teal-400';
    if (textColor === 'red') colorClass = 'text-red-500';
    if (textColor === 'purple') colorClass = 'text-purple-400';
    if (textColor === 'yellow') colorClass = 'text-yellow-400';
    if (textColor === 'green') colorClass = 'text-emerald-400';

    let alignClass = 'text-center';
    if (textAlignment === 'left') alignClass = 'text-left';
    if (textAlignment === 'right') alignClass = 'text-right';

    return `${fontClass} ${colorClass} ${alignClass} block break-words w-full`;
  };

  const getCustomLineStyle = () => {
    const style: React.CSSProperties = {
      fontSize: `${fontScale}px`,
    };

    if (textShadowStyle === 'black-glow') {
      style.textShadow = '0 2px 8px rgba(0,0,0,0.95), 0 0 4px rgba(0,0,0,0.85)';
    } else if (textShadowStyle === 'block-shadow') {
      style.textShadow = '3px 3px 0px rgba(0,0,0,1)';
    } else if (textShadowStyle === 'stencil') {
      style.textShadow = '-1.5px -1.5px 0 #000, 1.5px -1.5px 0 #000, -1.5px 1.5px 0 #000, 1.5px 1.5px 0 #000';
    }

    return style;
  };

  const renderCustomTextLines = () => {
    return (
      <div className="space-y-2 px-2">
        {line1CustomText && (
          <span style={getCustomLineStyle()} className={getCustomLineClass()}>
            {line1CustomText}
          </span>
        )}
        {line2CustomText && (
          <span style={getCustomLineStyle()} className={getCustomLineClass()}>
            {line2CustomText}
          </span>
        )}
        {line3CustomText && (
          <span style={getCustomLineStyle()} className={getCustomLineClass()}>
            {line3CustomText}
          </span>
        )}
      </div>
    );
  };

  // Loyalty states
  const [loyaltySearch, setLoyaltySearch] = useState('');
  const [showSignupKiosk, setShowSignupKiosk] = useState(false);
  const [submittedFanCard, setSubmittedFanCard] = useState<LoyaltyMember | null>(null);
  const [selectedScannerMemberId, setSelectedScannerMemberId] = useState('');
  const [scannedSuccessOverlay, setScannedSuccessOverlay] = useState<LoyaltyMember | null>(null);
  const [manualTicketIdInput, setManualTicketIdInput] = useState('');

  // Form states for signup
  const [fanName, setFanName] = useState('');
  const [fanEmail, setFanEmail] = useState('');
  const [fanPhone, setFanPhone] = useState('');
  const [fanCity, setFanCity] = useState('');
  const [fanState, setFanState] = useState('');
  const [fanCountry, setFanCountry] = useState('United States');
  const [fanPin, setFanPin] = useState('');
  const [fanOptIn, setFanOptIn] = useState(true);

  // Caption Generator library
  const generateCaption = () => {
    if (promoType === 'merch') {
      const itemName = selectedItem ? selectedItem.name : "Exclusive Band Merch";
      const itemStock = selectedItem ? selectedItem.van_stock : 5;
      
      const hypeCaptions = [
        `🔥 URGENT ALERT: The official ${itemName} has hit critical low stock on the current tour! Grab yours at the merch corner before we run dry tonight. Price: ${customPrice}! 🚀`,
        `📦 RESTOCK COUNTDOWN: Limited units left of the ${itemName}! Do not wait, once these go they are gone forever. See you under the stage lights! ⚡`,
        `🏆 SECURE THE DRIP: ${activeBandName} tour exclusive edition ${itemName} is moving fast. Meet us at the booth post-set to grab one. ${customPrice} flat.`
      ];

      const metalCaptions = [
        `🤘 THE RITUAL REMAINS UNCOMPLETED WITHOUT THE SEAR. The exclusive "${itemName}" is summoning you tonight. Under ${itemStock} units remain in our heavy casket! 💀💀`,
        `😈 BLOOD, SWEAT, AND EXCLUSIVE DRIP. The ${itemName} is running critically low. First come, first ravaged. Grab yours at tonight's ritual. Price: ${customPrice}. 🔥`,
        `☠️ DECREPIT STOCK ALERT! Our official ${itemName} is down to single digits. Lay waste to your bank account and secure yours before tomorrow's fallout.`
      ];

      const minimalCaptions = [
        `${activeBandName} — ${itemName}. ${customPrice}.\nAvailable tonight at the venue table. Minimal stock remains.`,
        `${itemName} • Only a few remain.\nGrab yours at the merch desk tonight.`,
        `Tour exclusive ${itemName}. ${customPrice}.\nEnd of run stock levels current.`
      ];

      const crypticCaptions = [
        `👁️ The prophecy foretold only a few would wear the ${itemName}. Only ${itemStock} items remain in this dimension. ${customPrice}.`,
        `⏳ TIME IS RUNNING THIN. The physical embodiment of ${itemName} is decaying. Secure the rare relic tonight under the shadows...`,
        `🔮 Some items are worth the devotion. The tour-exclusive ${itemName} is waiting.`
      ];

      let pool = hypeCaptions;
      if (captionVibe === 'heavy-metal') pool = metalCaptions;
      if (captionVibe === 'minimal') pool = minimalCaptions;
      if (captionVibe === 'cryptic') pool = crypticCaptions;

      const randomChoice = pool[Math.floor(Math.random() * pool.length)];
      setGeneratedCaption(randomChoice);
    } else if (promoType === 'shows') {
      const venue = selectedShow ? selectedShow.venue_name : "Local Tomb";
      const city = selectedShow ? selectedShow.city : "TBA";
      const date = selectedShow ? selectedShow.date : "Sometime soon";
      const support = selectedShow?.support_artists ? ` w/ support from ${selectedShow.support_artists}` : "";

      const hypeCaptions = [
        `📢 PIT INBOUND: ${activeBandName} is invading ${venue} in ${city} on ${date}!${support}. Ticket rates: ${showTicketPrice}. Snag yours now! 🚀`,
        `🚨 LOW TICKETS: Resident audio hazard ${activeBandName} locks down ${city} on ${date} at ${venue}. Grab tickets now before they completely clear out!`,
        `🎟️ READY THE DECIBELS! ${activeBandName} makes waves at ${venue} (${city}) this coming ${date}. Don't sleep on tickets, they are flying!`
      ];

      const metalCaptions = [
        `💀 CAVALRY OF DESTRUCTION COMING TO ${city.toUpperCase()}! ${activeBandName} will desecrate ${venue} on ${date}${support}. Lay witness to the absolute fallout. 🤘🔥`,
        `🔥 CRUELEST DESOLATION: Join the wreckage in ${city} at ${venue} on ${date}. Support is heavy and the pit is mandatory. Cost: ${showTicketPrice}.`,
        `☠️ SACRAMENTAL BLOODSHED! ${activeBandName} brings unrelenting chaos to ${venue} on ${date}. Cleanse your ears with premium high-intensity noise.`
      ];

      const minimalCaptions = [
        `${activeBandName} live in ${city} at ${venue}.\nDate: ${date}.\nPrice: ${showTicketPrice}.\nLink in bio.`,
        `Show Announcement: ${city} • ${date} at ${venue}.\nTickets available now.`,
        `${activeBandName} tour stops: ${city} • ${venue} • ${date}.`
      ];

      const crypticCaptions = [
        `👁️ The next gathering of the acoustic cult is set for ${date} in ${city}. Meet us at ${venue}. Do not be late.`,
        `🌌 Cosmic alignment approaching: ${activeBandName} descends upon ${venue} (${city}) on the date of ${date}. Open your senses.`,
        `🎭 A rare ritual of sound. ${activeBandName} at ${venue}, ${city}. ${date}. Price of entry: ${showTicketPrice}.`
      ];

      let pool = hypeCaptions;
      if (captionVibe === 'heavy-metal') pool = metalCaptions;
      if (captionVibe === 'minimal') pool = minimalCaptions;
      if (captionVibe === 'cryptic') pool = crypticCaptions;

      const randomChoice = pool[Math.floor(Math.random() * pool.length)];
      setGeneratedCaption(randomChoice);
    } else {
      const textSample = `${line1CustomText} • ${line2CustomText} • ${line3CustomText}`;
      const hypeCaptions = [
        `📢 NEW UPDATE from ${activeBandName}: "${textSample}". Check out our custom flyers and don't miss a beat! 🚀`,
        `🔊 SPREAD THE GOSPEL: Custom announcement inside! Swipe, like, share, and stay loaded for the current tour season!`,
        `💎 SPECIAL DESIGNS: Check tonight's look. Tap on the flyer sticker to see the full announcement.`
      ];

      const metalCaptions = [
        `💀 WRITTEN IN ASHES: ${line1CustomText.toUpperCase()} // ${line2CustomText.toUpperCase()}. The heavy ritual continues. 🤘💀`,
        `🔥 DARK MATTER FORCE: Let the world burn. Custom updates released from the core terminal: ${textSample}.`,
        `☠️ DEVOID OF HOPE: Join the absolute wreckage. View tonight's poster art and align your consciousness.`
      ];

      const minimalCaptions = [
        `${activeBandName}:\n${line1CustomText}\n${line2CustomText}\n${line3CustomText}`,
        `Broadcast announcement • ${activeBandName}.\nCheck details on custom flyer layout.`,
        `Custom band release. Available now.`
      ];

      const crypticCaptions = [
        `👁️ The truth is inscribed: ${line1CustomText}. Do you hear the summons?`,
        `🔮 Deciphering the symbols... "${textSample}". The ancient runes align in tonight's poster.`,
        `⏳ The hour is near. Read the custom inscription and remember the date.`
      ];

      let pool = hypeCaptions;
      if (captionVibe === 'heavy-metal') pool = metalCaptions;
      if (captionVibe === 'minimal') pool = minimalCaptions;
      if (captionVibe === 'cryptic') pool = crypticCaptions;

      const randomChoice = pool[Math.floor(Math.random() * pool.length)];
      setGeneratedCaption(randomChoice);
    }
    triggerNotification('Generated fresh promo copy!');
  };

  // Run initial caption populate
  useEffect(() => {
    generateCaption();
  }, [selectedItem, captionVibe, promoType, selectedShow, showTicketPrice, line1CustomText, line2CustomText, line3CustomText]);

  // Update item price when product selection changes
  useEffect(() => {
    if (selectedItem) {
      setCustomPrice(`$${selectedItem.price}`);
    }
  }, [selectedItem]);

  // Background presets
  const gradients = [
    'from-neutral-950 via-zinc-900 to-neutral-900', // Classic Heavy Charcoal
    'from-[#0c0e12] via-[#102421] to-[#070b10]', // Cyber Emerald
    'from-[#0d0a0b] via-[#351010] to-[#0d0a0b]', // Hellish Crimson
    'from-[#05060f] via-[#21023a] to-[#04050a]', // Galactic Amethyst
    'from-[#130702] via-[#481f08] to-[#120601]', // Amber Smolder
  ];

  const presetTexts = [
    'LOW STOCK - BUY NOW',
    'TOUR LIMITED EDITION',
    'LAST CHANCE TO BUY',
    'LIMITED EDITION',
  ];

  // Handles local custom image background upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setBgImage(uploadEvent.target.result as string);
          setBgType('image');
          triggerNotification('Custom story background loaded successfully!');
          addLog(`Uploaded custom social story background image (${file.name})`);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Quick export function as dummy/mock file or compiled image trigger
  const handleExport = () => {
    if (!selectedItem) return;
    addLog(`[STORY_EXPORTER] Exported 1080x1920 Instagram Story JPG for ${selectedItem.name}`);
    triggerNotification('📲 Compiled & saved Instagram Story to device gallery!');
  };

  const copyCaptionToClipboard = () => {
    navigator.clipboard.writeText(generatedCaption);
    triggerNotification('Caption copied to clipboard!');
  };

  // Loyalty handler functions
  const handleRegisterFan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fanName.trim() || !fanEmail.trim() || !fanPhone.trim() || !fanCity.trim() || !fanState.trim() || !fanPin.trim()) {
      triggerNotification('Please fill in all requested contact fields!');
      return;
    }
    const cleanPhone = fanPhone.replace(/\D/g, '');
    if (cleanPhone.length < 9) {
      triggerNotification('Please enter a valid telephone number!');
      return;
    }
    if (fanPin.length !== 4 || isNaN(Number(fanPin))) {
      triggerNotification('Choose an easy-to-remember 4-digit PIN!');
      return;
    }

    const uniqueCodeSuffix = Math.floor(Math.random() * 9000 + 1000);
    const firstName = fanName.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase();
    const immediateCode = `VIP20-${firstName || 'MEMBER'}`;

    const newMember: LoyaltyMember = {
      id: `loyalty_${Date.now()}`,
      created_at: new Date().toISOString(),
      name: fanName,
      city: fanCity,
      state: fanState,
      country: fanCountry,
      email: fanEmail,
      phone: cleanPhone,
      pin: fanPin,
      opt_in_promotions: fanOptIn,
      lifetime_discount_uses: 0
    };

    try {
      const response = await fetch('/api/emails/vip-loyalty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: fanEmail,
          fanName: fanName,
          bandName: activeBandName,
          discountCode: immediateCode
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error("Failed to send VIP welcome email:", result.error);
        triggerNotification(`Email warning: ${result.error?.message || result.error || 'Failed to send welcome email'}`);
      } else {
        if (result.simulated) {
          console.log("VIP Email simulated locally.");
        } else {
          triggerNotification(`Sent welcome email to ${fanEmail}!`);
        }
      }
    } catch (e) {
      console.error("Error calling VIP email API:", e);
      // We still proceed to register the fan locally
    }

    setLoyaltyMembers(prev => [newMember, ...prev]);
    addLog(`Loyalty signup: ${fanName} joined the club! Received discount code ${immediateCode}`);
    triggerNotification(`⭐ VIP Card Registered for ${fanName}!`);
    setSubmittedFanCard(newMember);

    // Clear main inputs except location for layout ease
    setFanName('');
    setFanEmail('');
    setFanPhone('');
    setFanPin('');
  };

  const handleDeleteLoyaltyMember = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove ${name} from the loyalty register?`)) {
      setLoyaltyMembers(prev => prev.filter(m => m.id !== id));
      const supabase = getSupabase();
      if (supabase && navigator.onLine) {
        try {
          await supabase.from('loyalty_members').delete().eq('id', id);
        } catch (e) {
          console.error('Failed to remote remove loyalty member:', e);
        }
      }
      addLog(`Removed loyalty VIP register for ${name}`);
      triggerNotification('Loyalty membership deleted');
    }
  };

  const handleExportEmails = () => {
    const optInList = loyaltyMembers.filter(m => m.opt_in_promotions);
    if (optInList.length === 0) {
      triggerNotification('No opt-in customers found!');
      return;
    }
    const emailStr = optInList.map(m => `"${m.name}" <${m.email}>`).join(', ');
    navigator.clipboard.writeText(emailStr);
    triggerNotification(`📋 Copied ${optInList.length} opted-in emails to Clipboard!`);
    addLog(`Copied ${optInList.length} promotional club emails for newsletter broadcast.`);
  };

  const handleSimulateTicketScan = async (memberIdOrCode: string) => {
    if (!memberIdOrCode) {
      triggerNotification('Please select a loyalty member or enter coupon code.');
      return;
    }
    
    // Check if it's a code, phone, or id
    let matched = loyaltyMembers.find(m => m.id === memberIdOrCode || m.phone === memberIdOrCode);
    if (!matched && memberIdOrCode.toUpperCase().startsWith('VIP20-')) {
      // Decode code pattern VIP20-FIRSTNAME-PIN
      const parts = memberIdOrCode.split('-');
      if (parts.length >= 3) {
        const checkPin = parts[2];
        matched = loyaltyMembers.find(m => m.pin === checkPin);
      }
    }

    if (!matched) {
      triggerNotification('❌ TICKET SCAN ERROR: Profile lookup mismatch.');
      return;
    }

    // Success check-in! Let's update scans count & points
    const nextScans = (matched.scans_count || 1) + 1;
    const nextPoints = (matched.points || 150) + 100; // scan bonus is +100 points!

    const updated: LoyaltyMember = {
      ...matched,
      scans_count: nextScans,
      points: nextPoints
    };

    setLoyaltyMembers(prev => prev.map(m => m.id === matched.id ? updated : m));
    setScannedSuccessOverlay(updated);
    triggerNotification(`🎫 FOH Scanner validated ticket for ${matched.name}!`);
    addLog(`FOH Ticket validated for ${matched.name}. XP: ${nextPoints}, Gigs: ${nextScans}`);

    // Update database
    const supabase = getSupabase();
    if (supabase) {
      try {
        await supabase.from('loyalty_members').update({
          scans_count: nextScans,
          points: nextPoints
        }).eq('id', matched.id);
      } catch (e) {
        console.error('Failed to sync ticket validation checkpoint:', e);
      }
    }
  };

  // Filter list
  const filteredMembers = loyaltyMembers.filter(m => {
    const query = loyaltySearch.toLowerCase();
    return (
      m.name.toLowerCase().includes(query) ||
      m.phone.includes(query) ||
      m.email.toLowerCase().includes(query) ||
      m.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6 text-left">
      
      {/* HUB HEADER */}
      {subTabMode === 'all' ? (
        <div className="relative border-b border-zinc-900 pb-3 pt-4 md:pt-12 md:pb-10 flex flex-col items-center justify-center text-center sticky top-0 z-40 gap-2 bg-[#0c0e12]/95 backdrop-blur-md">
          {/* Centered Title Lockup */}
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center"
            >
              <motion.h1 
                animate={{ 
                  textShadow: [
                    '0 0 12px rgba(0, 255, 204, 0.4), 0 0 25px rgba(0, 255, 204, 0.2), 0 0 50px rgba(0, 255, 204, 0.1)',
                    '0 0 24px rgba(0, 255, 204, 0.9), 0 0 45px rgba(0, 255, 204, 0.6), 0 0 80px rgba(0, 255, 204, 0.35)',
                    '0 0 12px rgba(0, 255, 204, 0.4), 0 0 25px rgba(0, 255, 204, 0.2), 0 0 50px rgba(0, 255, 204, 0.1)'
                  ] 
                }}
                transition={{
                  duration: 2.2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="text-3xl md:text-5xl font-display font-medium tracking-tight text-white uppercase text-center select-text leading-none"
                style={{
                  letterSpacing: '0.1em',
                  fontWeight: 950,
                  fontSize: '26px',
                  marginLeft: '0px',
                  marginTop: '0px'
                }}
              >
                Fan Alliance & Distro Hub
              </motion.h1>
            </motion.div>
            <p 
              className="text-xs md:text-sm text-zinc-400 font-mono tracking-wide max-w-xl leading-relaxed text-center"
              style={{ marginTop: '-4px', fontSize: '11px' }}
            >
              {activeSubTab === 'distro' 
                ? 'Establish direct fan merchandise pipelines and secure follow networks. Post band updates, customize storefront layouts, manage staged items, and connect with your local follower base.' 
                : activeSubTab === 'loyalty' 
                  ? 'A centralized fan rewards console. Track repeat attendee history, distribute exclusive merch discount codes, manage fan-tier list profiles, and issue early ticket presale access links.' 
                  : 'Generate customized promotional flyers, custom art with customizable text positions, choose upcoming gig alert schedules, overlay theme-vibe filter masks, generate live companion QR scan widgets, and launch outreach campaigns.'
              }
            </p>
          </div>

          {/* Action Button positioned under the header text, centered */}
          {activeSubTab === 'loyalty' && (
            <div className="flex justify-center z-20 mt-2">
              <button
                onClick={handleExportEmails}
                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-mono font-bold py-2 px-4 rounded-xl transition duration-150 uppercase tracking-wider flex items-center gap-2 cursor-pointer h-9 shadow-[0_0_20px_rgba(147,51,234,0.15)] active:scale-95"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy Promo Mailing List
              </button>
            </div>
          )}
        </div>
      ) : activeSubTab === 'loyalty' ? (
        <div className="flex justify-end z-20 mb-4 bg-zinc-950/40 p-3 rounded-xl border border-zinc-900 items-center justify-between">
          <span className="text-[11px] font-mono text-zinc-400">
            ✉️ MAILING LIST ACTIONS:
          </span>
          <button
            onClick={handleExportEmails}
            className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-mono font-bold py-1.5 px-3 rounded-lg transition duration-150 uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
          >
            <Copy className="w-3 h-3" />
            Copy Promo Emails
          </button>
        </div>
      ) : null}

      {/* SUB-TABS INTERACTION SELECTOR */}
      {subTabMode === 'all' && (
        <div className="flex border border-zinc-850 p-1 bg-zinc-950/80 rounded-2xl gap-1 flex-wrap md:flex-nowrap">
          <button
            onClick={() => setActiveSubTab('distro')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'distro' 
                ? 'bg-[#102421] text-[#39ff14] border border-[#39ff14]/30 font-black shadow-[0_0_15px_rgba(57,255,20,0.1)]' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
            }`}
          >
            <ShoppingBag className="w-4 h-4 text-[#39ff14]" />
            Band Distro & Follow Network
          </button>
          <button
            onClick={() => setActiveSubTab('stories')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'stories' 
                ? 'bg-[#161a24] text-[#00ffcc] border border-[#00ffcc]/30' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Social Story Creator
          </button>
          <button
            onClick={() => setActiveSubTab('loyalty')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-mono font-bold uppercase transition-all cursor-pointer ${
              activeSubTab === 'loyalty' 
                ? 'bg-[#1c122e] text-purple-300 border border-purple-900/50' 
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
            }`}
          >
            <QrCode className="w-4 h-4 text-purple-400" />
            VIP Loyalty Club & Kiosk
          </button>
        </div>
      )}

      {/* TAB RENDERING BRANCH */}
      {activeSubTab === 'distro' ? (
        <div className="space-y-4 animate-fadeIn" id="distro-subtab-container">
          <DevBandDistroDeck 
            inventory={inventory}
            triggerNotification={triggerNotification}
            onNavigateToTab={onNavigateToTab}
            stagedDistroItems={stagedDistroItems}
            setStagedDistroItems={setStagedDistroItems}
          />
        </div>
      ) : activeSubTab === 'stories' ? (
        <div className="space-y-8" id="stories-subtab-container">
          
          {/* SECTION 1: HERO SMARTPHONE STORY PREVIEW (CENTERED HERO STAGE) */}
          <div className="bg-[#12141c]/30 border border-zinc-850 rounded-[28px] p-6 lg:p-8 flex flex-col items-center justify-center relative overflow-hidden" id="story-hero-stage">
            {/* Subtle decorative background laser/glow line */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[2px] bg-gradient-to-r from-transparent via-[#00ffcc]/30 to-transparent" />
            
            <div className="flex items-center gap-1.5 mb-2 select-none">
              <Smartphone className="w-4 h-4 text-teal-400" />
              <span className="text-[10px] uppercase text-[#00ffcc] font-mono tracking-widest font-black">
                LIVE DIGITAL PREVIEW PROMO STAGE
              </span>
            </div>

            {/* QUICK CAMPAIGN & FORMAT SELECTOR TABS ALIGNED TO HERO ZONE */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6 z-10 w-full max-w-2xl items-center justify-center" id="quick-promo-bar">
              {/* Campaign Type Selectors */}
              <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-850 w-full sm:w-auto gap-0.5">
                {[
                  { id: 'merch', label: '👕 Merch' },
                  { id: 'shows', label: '🎟️ Gig Alert' },
                  { id: 'custom', label: '🎨 Custom Flyer' }
                ].map((mode, idx) => (
                  <button
                    key={`${mode.id}-${idx}`}
                    type="button"
                    onClick={() => {
                      setPromoType(mode.id as any);
                      triggerNotification(`Switched story mode to ${mode.label}!`);
                    }}
                    className={`flex-1 sm:flex-initial text-[10px] font-mono uppercase px-3.5 py-1.5 rounded-lg transition-all font-black cursor-pointer ${
                      promoType === mode.id ? 'bg-[#00ffcc] text-black shadow-[0_0_15px_rgba(0,255,204,0.3)]' : 'text-zinc-400 hover:text-white hover:bg-zinc-900/30'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>

              {/* Aspect Ratio Format Selectors */}
              <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-850 w-full sm:w-auto gap-0.5">
                {[
                  { id: 'story', label: '📱 Story (9:16)' },
                  { id: 'feed', label: '🔳 Post (1:1)' },
                  { id: 'landscape', label: '🗺️ Wide (16:9)' }
                ].map((format, idx) => (
                  <button
                    key={`${format.id}-${idx}`}
                    type="button"
                    onClick={() => setStoryFormat(format.id as any)}
                    className={`flex-1 sm:flex-initial text-[10px] font-mono uppercase px-3 py-1.5 rounded-lg transition-all font-black cursor-pointer ${
                      storyFormat === format.id ? 'bg-purple-600 text-white shadow-md' : 'text-zinc-500 hover:text-white hover:bg-zinc-900/30'
                    }`}
                  >
                    {format.label}
                  </button>
                ))}
              </div>
            </div>

            {/* DYNAMIC CARD HOLDER FRAME */}
            <div className="relative p-1 rounded-[42px] bg-gradient-to-b from-zinc-800 via-zinc-900 to-black shadow-2xl transition-all duration-300">
              <div 
                id="instagram-story-canvas"
                className="relative overflow-hidden flex flex-col justify-between p-6 select-none transition-all duration-300"
                style={{
                  backgroundImage: bgType === 'image' && bgImage ? `url(${bgImage})` : 'none',
                  backgroundPosition: 'center',
                  backgroundSize: 'cover',
                  width: storyFormat === 'story' ? '280px' : storyFormat === 'feed' ? '290px' : '350px',
                  height: storyFormat === 'story' ? '498px' : storyFormat === 'feed' ? '290px' : '197px',
                  borderRadius: storyFormat === 'story' ? '38px' : storyFormat === 'feed' ? '24px' : '16px',
                }}
              >
                {/* Grid or custom gradient treatment */}
                {bgType === 'gradient' && (
                  <div className={`absolute inset-0 bg-gradient-to-b ${gradients[activeGradient]} z-0`} />
                )}

                {/* Color Overlay Filter Mask Layers */}
                {colorFilter !== 'none' && (
                  <div 
                    className={`absolute inset-0 z-5 pointer-events-none ${
                      colorFilter === 'toxic-acid' ? 'bg-yellow-400/30 mix-blend-color-burn' :
                      colorFilter === 'crimson' ? 'bg-red-700/40 mix-blend-multiply' :
                      colorFilter === 'cyberpunk' ? 'bg-gradient-to-tr from-cyan-400/30 via-purple-500/20 to-pink-500/35 mix-blend-color-dodge' :
                      colorFilter === 'monochrome' ? 'bg-white/10 backdrop-grayscale backdrop-contrast-125' :
                      colorFilter === 'sepia' ? 'bg-[#704214]/20 backdrop-sepia backdrop-brightness-95 backdrop-saturate-125' :
                      ''
                    }`} 
                  />
                )}

                {/* Ambient vignette background shadow overlay */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/85 z-4" />

                {/* Content Layer (z-10) */}
                <div className={`relative z-10 flex flex-col justify-between h-full text-center ${
                  storyFormat === 'landscape' ? 'py-1.5 px-1' : 'py-3 px-2'
                }`}>
                  
                  {/* Top Headline Banner (Compressed on short layouts) */}
                  <div className={`bg-black/60 border border-white/10 rounded-2xl backdrop-blur-md ${
                    storyFormat === 'landscape' ? 'p-1.5' : 'p-2.5'
                  }`}>
                    <span className={`font-mono uppercase tracking-widest text-[#00ffcc] font-bold block ${
                      storyFormat === 'landscape' ? 'text-[8.5px]' : 'text-[10px]'
                    }`}>
                      {headline}
                    </span>
                  </div>

                  {/* PROMO TYPE: MERCHANDISE */}
                  {promoType === 'merch' && (
                    selectedItem ? (
                      <div className={`space-y-3 ${storyFormat === 'landscape' ? 'flex items-center gap-4 text-left my-auto' : ''}`}>
                        <div className={`relative mx-auto rounded-[24px] overflow-hidden border-[3px] border-white/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-black flex items-center justify-center shrink-0 ${
                          storyFormat === 'landscape' ? 'w-20 h-20 rounded-xl border-2' : storyFormat === 'feed' ? 'w-24 h-24' : 'w-42 h-42'
                        }`}>
                          <img 
                            src={selectedItem.image_url} 
                            className="w-full h-full object-cover scale-105" 
                            alt={selectedItem.name} 
                            referrerPolicy="no-referrer"
                          />
                          
                          {stickerType !== 'NONE' && (
                            <div className={`absolute top-1.5 right-1.5 px-2 py-0.5 text-[8px] font-mono font-black uppercase rounded shadow-lg backdrop-blur-sm ${
                              stickerType === 'LOW_STOCK' ? 'bg-red-500/90 text-white' : 
                              stickerType === 'TOUR_ONLY' ? 'bg-yellow-500/90 text-black' : 
                              'bg-[#00ffcc]/90 text-black'
                            }`}>
                              {stickerType === 'LOW_STOCK' ? 'LOW' : stickerType === 'TOUR_ONLY' ? 'TOUR' : 'LAST'}
                            </div>
                          )}
                        </div>

                        <div className="space-y-1.5 flex-1">
                          <h2 className={`font-display font-black text-white uppercase tracking-tight leading-none mix-blend-overlay text-shadow-sm line-clamp-2 ${
                            storyFormat === 'landscape' ? 'text-xs text-left' : storyFormat === 'feed' ? 'text-sm' : 'text-xl'
                          }`}>
                            {selectedItem.name}
                          </h2>
                          
                          <div className={`flex items-center gap-2 ${storyFormat === 'landscape' ? 'justify-start' : 'justify-center flex-wrap'}`}>
                             <span className="inline-block bg-white text-black font-mono font-black text-[10px] sm:text-xs px-2.5 py-1 rounded-full shadow-lg">
                               {customPrice}
                             </span>
                             {linkSticker && (
                               <div className="bg-zinc-100/95 text-blue-600 font-sans font-bold text-[8px] px-2 py-0.5 rounded-full flex items-center gap-0.5 shadow-xl uppercase">
                                 🔗 tap shop
                               </div>
                             )}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-500 font-mono text-xs my-auto">No items in stock. Add items to inventory.</div>
                    )
                  )}

                  {/* PROMO TYPE: SHOW / TOUR DATES */}
                  {promoType === 'shows' && (
                    selectedShow ? (
                      <div className={`my-auto space-y-2.5 ${storyFormat === 'landscape' ? 'grid grid-cols-2 gap-4 text-left items-center' : ''}`}>
                        <div className="space-y-1.5">
                          {showBadge !== 'NONE' && (
                            <span className={`inline-block text-[8px] font-mono font-black tracking-wider px-2 py-0.5 rounded-md ${
                              showBadge === 'SOLD_OUT' ? 'bg-red-500 text-white' :
                              showBadge === 'TONIGHT' ? 'bg-green-500 text-black' :
                              showBadge === 'LOW_TICKETS' ? 'bg-orange-500 text-white' :
                              'bg-yellow-400 text-black'
                            }`}>
                              {showBadge === 'SELLING_FAST' ? '🔥 SELLING FAST' :
                               showBadge === 'LOW_TICKETS' ? '🚨 LOW TICKETS' :
                               showBadge === 'TONIGHT' ? '⚡ TONIGHT' :
                               showBadge === 'SOLD_OUT' ? '❌ SOLD OUT' : ''}
                            </span>
                          )}
                          
                          <div className="text-zinc-400 font-mono text-[9px] uppercase tracking-wider block">{selectedShow.date}</div>
                          
                          <h2 className={`font-display font-black text-white uppercase tracking-tight leading-none ${
                            storyFormat === 'landscape' ? 'text-sm' : storyFormat === 'feed' ? 'text-base' : 'text-xl'
                          }`}>
                            {selectedShow.city ? selectedShow.city.toUpperCase() : 'TBA'}
                          </h2>
                          
                          <p className="text-[10px] font-mono text-teal-400 font-bold uppercase truncate">{selectedShow.venue_name}</p>
                          {selectedShow.support_artists && storyFormat !== 'landscape' && (
                            <p className="text-[8.5px] text-zinc-500 font-sans truncate">w/ {selectedShow.support_artists}</p>
                          )}
                        </div>

                        <div className="space-y-2 text-center flex flex-col items-center">
                          <div className="bg-black/40 border border-white/5 py-1 px-3 rounded-lg max-w-[150px] mx-auto backdrop-blur-sm">
                            <span className="text-[7.5px] text-zinc-500 font-mono block uppercase">ENTRY TICKET</span>
                            <span className="text-xs font-mono font-black text-white block">{showTicketPrice}</span>
                          </div>

                          {linkSticker && (
                            <div className="bg-yellow-400 text-black font-sans font-extrabold text-[8px] px-3 py-1 rounded-full flex items-center justify-center gap-0.5 shadow-lg uppercase tracking-wider w-max">
                              🎟️ GET TICKETS
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-zinc-500 font-mono text-xs my-auto">No shows listed in active tour roster.</div>
                    )
                  )}

                  {/* PROMO TYPE: CUSTOM ART / BAND PHOTOS */}
                  {promoType === 'custom' && (
                    <div className="flex-1 flex flex-col justify-between py-4" id="custom-photo-text-container">
                      {textPosition === 'top' && (
                        <div className="space-y-1.5 mt-2">
                          {renderCustomTextLines()}
                        </div>
                      )}

                      {textPosition === 'middle' && (
                        <div className="space-y-1.5 my-auto">
                          {renderCustomTextLines()}
                        </div>
                      )}

                      {textPosition === 'bottom' && (
                        <div className="space-y-1.5 mb-2">
                          {renderCustomTextLines()}
                        </div>
                      )}

                      {textPosition === 'split' && (
                        <div className="flex-1 flex flex-col justify-between py-2">
                          <div style={getCustomLineStyle()} className={getCustomLineClass()}>
                            {line1CustomText}
                          </div>
                          <div style={getCustomLineStyle()} className={`${getCustomLineClass()} px-1`}>
                            {line2CustomText}
                          </div>
                          <div style={getCustomLineStyle()} className={getCustomLineClass()}>
                            {line3CustomText}
                          </div>
                        </div>
                      )}

                      {textPosition !== 'split' && <div />}
                    </div>
                  )}

                  {/* QR Code Graphic element overlayed */}
                  {showQrOverlay && (
                    <div className={`absolute ${
                      qrOverlayPosition === 'bottom-right' ? 'bottom-2 right-2' :
                      qrOverlayPosition === 'bottom-left' ? 'bottom-2 left-2' :
                      'bottom-4 left-1/2 -translate-x-1/2'
                    } z-20 bg-white p-1 rounded-lg border border-black/20 shadow-md`}>
                      <QRCode 
                        value={qrOverlayUrl || `${window.location.origin}?signup=vip`} 
                        size={storyFormat === 'landscape' ? Math.min(30, qrOverlayScale) : qrOverlayScale} 
                        bgColor="#ffffff" 
                        fgColor="#000000" 
                      />
                    </div>
                  )}

                  {/* Footer call to action */}
                  <div className="space-y-1">
                    <div className="w-10 h-0.5 bg-teal-400 mx-auto" />
                    <p className={`font-mono uppercase tracking-widest text-white/90 font-black ${
                      storyFormat === 'landscape' ? 'text-[7.5px]' : 'text-[9px]'
                    }`}>
                      {bottomCallToAction}
                    </p>
                  </div>

                </div>
              </div>
            </div>

            {/* Bottom Panel Export button action trigger */}
            <div className="mt-6 flex justify-center z-10 w-full">
              <button
                type="button"
                onClick={handleExport}
                className="bg-[#00ffcc] hover:bg-teal-400 text-black text-xs font-mono font-bold py-2.5 px-6 rounded-full transition duration-150 uppercase tracking-widest flex items-center gap-2 cursor-pointer h-10 shadow-[0_0_20px_rgba(0,255,204,0.3)] hover:shadow-[0_0_25px_rgba(0,255,204,0.55)] active:scale-[0.98] outline-none"
              >
                <Download className="w-4 h-4 stroke-[2.5]" />
                Export Story to device
              </button>
            </div>

          </div>

          {/* SECTION 2: GRAPHICAL EDIT CONTROLS */}
          <div className="bg-[#12141c]/50 border border-[#00ffcc]/35 shadow-[0_0_15px_rgba(0,255,204,0.05)] rounded-[24px] p-4 md:p-5 space-y-4" id="story-creative-controls-card">
            <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-2.5 border-b border-zinc-900">
              <Palette className="w-4 h-4 text-[#00ffcc]" /> 1. Social Creative Panel
            </h3>

            {/* SEGMENTED FORM FIELDS DEPENDING ON PROMO TYPE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* 1.1 MERCHANDISE ACTIVE FORM */}
              {promoType === 'merch' && (
                <>
                  {/* Product selector dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🎯 Merch Relic to Highlight</label>
                    <select
                      value={selectedItem ? selectedItem.id : ''}
                      onChange={(e) => {
                        const item = inventory.find(i => i.id === e.target.value);
                        if (item) setSelectedItem(item);
                      }}
                      className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                    >
                      {inventory.map((item, idx) => (
                        <option key={`${item.id}-${idx}`} value={item.id}>
                          {item?.name} (${item.price} ea) • Stock: {item.van_stock}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price control */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">💰 Promotional Tagged Price</label>
                    <input 
                      type="text"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      placeholder="e.g. $25.00"
                      className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                    />
                  </div>

                  {/* Badges / Sticker Overlay styles */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🏷️ Dynamic Visual Badging Overlay</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'LOW_STOCK', label: 'CRITICAL' },
                        { id: 'TOUR_ONLY', label: 'TOUR-ONLY' },
                        { id: 'LAST_CHANCE', label: 'CLOSING' },
                        { id: 'NONE', label: 'BLANK' }
                      ].map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => setStickerType(item.id as any)}
                          className={`py-1.5 text-[9px] font-mono rounded-lg border text-center transition-all cursor-pointer ${
                            stickerType === item.id 
                              ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]' 
                              : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 1.2 TOUR DATE ALERT ACTIVE FORM */}
              {promoType === 'shows' && (
                <>
                  {/* Show dropdown selector */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🗺️ Select Show from Schedule</label>
                    <select
                      value={selectedShow ? selectedShow.id : ''}
                      onChange={(e) => {
                        const showInst = activeShowsList.find(s => s.id === e.target.value);
                        if (showInst) setSelectedShow(showInst);
                      }}
                      className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                    >
                      {activeShowsList.map((s, sIdx) => (
                        <option key={`${s.id}-${sIdx}`} value={s.id}>
                          {s.city}, {s.state_province} • {s.venue_name} ({s.date})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Show entrance ticket rates edit box */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🎫 Door / Online Ticket Price</label>
                    <input 
                      type="text"
                      value={showTicketPrice}
                      onChange={(e) => setShowTicketPrice(e.target.value)}
                      placeholder="e.g. $15 ADV / $20 DOS"
                      className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                    />
                  </div>

                  {/* Show badge alert tag */}
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🚨 Promotional Status Badge</label>
                    <div className="grid grid-cols-5 gap-2">
                      {[
                        { id: 'SELLING_FAST', label: 'SELLING FAST' },
                        { id: 'LOW_TICKETS', label: 'LOW TIX' },
                        { id: 'TONIGHT', label: 'TONIGHT' },
                        { id: 'SOLD_OUT', label: 'SOLD OUT' },
                        { id: 'NONE', label: 'BLANK' }
                      ].map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => {
                            setShowBadge(item.id as any);
                          }}
                          className={`py-1.5 text-[9px] font-mono rounded-lg border text-center transition-all cursor-pointer ${
                            showBadge === item.id 
                              ? 'bg-purple-950/40 border-purple-500 text-purple-300' 
                              : 'bg-zinc-950/60 border-zinc-850 text-zinc-400 hover:border-zinc-800'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 1.3 CUSTOM BAND ART / PHOTO CREATIVE FORM WITH CUSTOM PLACEMENTS */}
              {promoType === 'custom' && (
                <>
                  {/* Custom Row 1 Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">✏️ Headline Line 1</label>
                    <input 
                      type="text"
                      value={line1CustomText}
                      onChange={(e) => setLine1CustomText(e.target.value)}
                      placeholder="Headline or primary note"
                      className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                    />
                  </div>

                  {/* Custom Row 2 Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">✏️ Supporting Line 2</label>
                    <input 
                      type="text"
                      value={line2CustomText}
                      onChange={(e) => setLine2CustomText(e.target.value)}
                      placeholder="Additional details..."
                      className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                    />
                  </div>

                  {/* Custom Row 3 Input */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">✏️ Details / Footer Line 3</label>
                    <input 
                      type="text"
                      value={line3CustomText}
                      onChange={(e) => setLine3CustomText(e.target.value)}
                      placeholder="Dates, links, door instructions"
                      className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                    />
                  </div>

                  {/* Font Scale & Anchor Alignment */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">📏 Text Font Size ({fontScale}px)</label>
                    <input 
                      type="range"
                      min="10"
                      max="32"
                      value={fontScale}
                      onChange={(e) => setFontScale(Number(e.target.value))}
                      className="w-full accent-[#00ffcc] py-1.5 cursor-pointer bg-transparent"
                    />
                  </div>

                  {/* Font Theme */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🔠 Typography Family Style</label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { id: 'sans', label: 'SANS' },
                        { id: 'mono', label: 'MONO' },
                        { id: 'serif', label: 'SERIF' },
                        { id: 'display', label: 'DISP' },
                        { id: 'heavy', label: 'HEAVY' }
                      ].map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => setFontTheme(item.id as any)}
                          className={`py-1 text-[8px] font-mono rounded border text-center transition-all cursor-pointer ${
                            fontTheme === item.id 
                              ? 'bg-purple-950/40 border-purple-500 text-purple-300' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Horizontal Alignment */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">↔️ Line Alignment</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {[
                        { id: 'left', label: 'LEFT' },
                        { id: 'center', label: 'CENTER' },
                        { id: 'right', label: 'RIGHT' }
                      ].map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => setTextAlignment(item.id as any)}
                          className={`py-1.5 text-[8.5px] font-mono rounded border text-center transition-all cursor-pointer ${
                            textAlignment === item.id 
                              ? 'bg-emerald-950/30 border-emerald-500 text-emerald-400' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Text Placement Layout Row */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">↕️ Text Placement Position</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'top', label: 'TOP' },
                        { id: 'middle', label: 'MID' },
                        { id: 'bottom', label: 'BOT' },
                        { id: 'split', label: 'SPLIT' }
                      ].map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => setTextPosition(item.id as any)}
                          className={`py-1 text-[8.5px] font-mono rounded border text-center transition-all cursor-pointer ${
                            textPosition === item.id 
                              ? 'bg-teal-950/30 border-teal-500 text-teal-400' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Inline Color Preset Options */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🎨 Color Theme Preset</label>
                    <div className="grid grid-cols-6 gap-1">
                      {[
                        { id: 'white', label: 'WHITE', bg: 'bg-white' },
                        { id: 'teal', label: 'TEAL', bg: 'bg-teal-400' },
                        { id: 'red', label: 'RED', bg: 'bg-red-550' },
                        { id: 'purple', label: 'PURPLE', bg: 'bg-purple-400' },
                        { id: 'yellow', label: 'YELLOW', bg: 'bg-yellow-400' },
                        { id: 'green', label: 'GREEN', bg: 'bg-emerald-400' }
                      ].map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => setTextColor(item.id as any)}
                          className={`p-1 border rounded transition-all cursor-pointer flex flex-col items-center gap-1 ${
                            textColor === item.id ? 'border-[#00ffcc] bg-zinc-900/60' : 'border-zinc-850 hover:border-zinc-800'
                          }`}
                        >
                          <div className={`w-3.5 h-3.5 rounded-full ${item.bg}`} />
                          <span className="text-[7.5px] font-mono scale-90">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Backdrop Shadow Styles */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🕶️ Text Outline & Shadow Effects</label>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[
                        { id: 'none', label: 'PLAIN' },
                        { id: 'black-glow', label: 'GLOW' },
                        { id: 'block-shadow', label: 'BLOCK' },
                        { id: 'stencil', label: 'STROKE' }
                      ].map((item, idx) => (
                        <button
                          key={`${item.id}-${idx}`}
                          type="button"
                          onClick={() => setTextShadowStyle(item.id as any)}
                          className={`py-1 text-[8.5px] font-mono rounded border text-center transition-all cursor-pointer ${
                            textShadowStyle === item.id 
                              ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]' 
                              : 'bg-zinc-950 border-zinc-850 text-zinc-500 hover:border-zinc-800'
                          }`}
                        >
                          <span>{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Headline (Common to all modes) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">⚡ Catchy Top Banner Headline</label>
                <input 
                  type="text"
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="e.g. TOUR EXCLUSIVE / LIMITED DROP"
                  className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                />
              </div>

              {/* Footer CTA (Common to all modes) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">📢 Bottom Call To Action Footer</label>
                <input 
                  type="text"
                  value={bottomCallToAction}
                  onChange={(e) => setBottomCallToAction(e.target.value)}
                  placeholder="e.g. GET IT AT THE BOOTH / CASH OR CARD"
                  className="w-full bg-zinc-950 p-2.5 border border-[#00ffcc]/35 hover:border-[#00ffcc]/60 focus:border-[#00ffcc] rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-[#00ffcc]/25 font-mono transition-all"
                />
              </div>

              {/* STATIC/LIVE THEME DECORATIVE OVERLAY FILTERS */}
              <div className="space-y-1 md:col-span-2 pt-3 border-t border-zinc-850/80">
                <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold mb-2">🎭 Theme-Vibe Overlay Filters (Aesthetic Masks)</label>
                <div className="grid grid-cols-6 gap-2">
                  {[
                    { id: 'none', label: 'PLAIN', color: 'bg-zinc-900 border-zinc-700' },
                    { id: 'toxic-acid', label: 'ACID', color: 'bg-gradient-to-tr from-yellow-500 to-green-500' },
                    { id: 'crimson', label: 'BLOOD', color: 'bg-gradient-to-b from-red-950 to-red-800' },
                    { id: 'cyberpunk', label: 'NEON', color: 'bg-gradient-to-tr from-cyan-400/60 via-purple-500 to-pink-500' },
                    { id: 'monochrome', label: 'MONO', color: 'bg-white opacity-40' },
                    { id: 'sepia', label: 'SEPIA', color: 'bg-[#704214] opacity-50' }
                  ].map((item, idx) => (
                    <button
                      key={`${item.id}-${idx}`}
                      type="button"
                      onClick={() => {
                        setColorFilter(item.id as any);
                        triggerNotification(`Applied ${item.label} vibe mask!`);
                      }}
                      className={`p-2 border rounded-xl flex flex-col items-center gap-1.5 transition cursor-pointer select-none ${
                        colorFilter === item.id ? 'border-[#00ffcc] bg-[#1a2130]' : 'border-zinc-850 bg-zinc-950/60'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg border border-black/30 shadow-inner ${item.color}`} />
                      <span className="text-[8px] font-mono tracking-tighter block">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Background controls */}
              <div className="space-y-3 md:col-span-2 pt-4 border-t border-zinc-850/80">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <label className="text-[10px] uppercase text-zinc-400 font-mono tracking-wider block font-bold">🎨 Background Theme Context</label>
                  
                  <div className="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-850">
                    <button 
                      type="button"
                      onClick={() => setBgType('gradient')}
                      className={`text-[9px] font-mono uppercase px-3 py-1 rounded-md transition cursor-pointer ${bgType === 'gradient' ? 'bg-teal-400 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Gradients
                    </button>
                    <button 
                      type="button"
                      onClick={() => {
                        if (bgImage) {
                          setBgType('image');
                        } else {
                          fileInputRef.current?.click();
                        }
                      }}
                      className={`text-[9px] font-mono uppercase px-3 py-1 rounded-md transition cursor-pointer ${bgType === 'image' ? 'bg-teal-400 text-black font-bold' : 'text-zinc-400 hover:text-white'}`}
                    >
                      Custom Photo
                    </button>
                  </div>
                </div>

                {/* Always mount the file input, just keep it hidden so ref works when gradient is active */}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />

                {bgType === 'gradient' ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {gradients.map((grad, i) => (
                      <button
                        key={`promo-asset-${i}`}
                        type="button"
                        onClick={() => setActiveGradient(i)}
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} border-2 transition-transform duration-150 cursor-pointer ${
                          activeGradient === i ? 'ring-2 ring-teal-400 border-teal-400 scale-105' : 'border-zinc-800 opacity-80 hover:scale-105'
                        }`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 bg-zinc-950/80 hover:bg-zinc-900 focus:ring-1 focus:ring-[#00ffcc] p-3 rounded-xl border border-zinc-800 text-xs text-zinc-300 font-mono flex items-center justify-center gap-2 cursor-pointer transition active:scale-[0.99] shadow-inner"
                    >
                      <ImageIcon className="w-5 h-5 text-teal-400" />
                      {bgImage ? 'Swap Cover Photo...' : 'Device Gallery: Select Cover Photo / Flyer Poster...'}
                    </button>
                    {bgImage && (
                      <button
                        type="button"
                        onClick={() => { setBgImage(null); setBgType('gradient'); }}
                        title="Remove Photo"
                        className="p-3.5 rounded-xl bg-red-950/30 hover:bg-red-900/50 border border-red-900/40 text-red-400 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                
                {/* Additional Optional Toggles */}
                <div className="flex flex-wrap gap-3 pt-3 border-t border-zinc-900 justify-between items-center bg-black/20 p-3 rounded-xl" id="extra-features-promo">
                  <div className="flex flex-wrap gap-3">
                     <button
                       onClick={() => setLinkSticker(!linkSticker)}
                       type="button"
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] uppercase font-mono font-bold transition-colors cursor-pointer ${linkSticker ? 'bg-blue-500/20 text-blue-400 border-blue-500/40' : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}
                     >
                       <div className={`w-1.5 h-1.5 rounded-full ${linkSticker ? 'bg-blue-400 animate-pulse' : 'bg-zinc-700'}`} />
                       TAP STICKER
                     </button>

                     <button
                       onClick={() => {
                         setShowQrOverlay(!showQrOverlay);
                         if (!showQrOverlay && !qrOverlayUrl) {
                           setQrOverlayUrl(`${window.location.origin}`);
                         }
                       }}
                       type="button"
                       className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[9px] uppercase font-mono font-bold transition-colors cursor-pointer ${showQrOverlay ? 'bg-[#00ffcc]/20 text-[#00ffcc] border-[#00ffcc]/40' : 'bg-zinc-900/50 text-zinc-500 border-zinc-800 hover:text-zinc-300'}`}
                     >
                       <div className={`w-1.5 h-1.5 rounded-full ${showQrOverlay ? 'bg-[#00ffcc] animate-pulse' : 'bg-zinc-700'}`} />
                       EMBED SCAN QR CODE
                     </button>
                  </div>

                  {showQrOverlay && (
                    <div className="flex gap-2 items-center bg-[#0d1017] p-2 rounded-lg border border-zinc-850 w-full sm:w-auto mt-2 sm:mt-0">
                      <span className="text-[8px] uppercase font-mono text-zinc-500 block shrink-0">QR TARGET</span>
                      <select
                        value={qrOverlayUrl.includes('signup') ? 'vip' : 'site'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'vip') {
                            setQrOverlayUrl(`${window.location.origin}?signup=vip`);
                          } else {
                            setQrOverlayUrl(`${window.location.origin}`);
                          }
                          triggerNotification(`Set QR code link destination!`);
                        }}
                        className="bg-zinc-950 p-1 border border-zinc-850 rounded text-[9px] text-white focus:outline-none focus:border-teal-400 font-mono w-full"
                      >
                        <option value="vip">VIP KIOSK SIGNUP</option>
                        <option value="site">MAIN BAND COGNISANCE</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* SECTION 3: SOCIAL CAPTIONS REGENERATOR */}
          <div className="bg-[#12141c]/50 border border-zinc-850 rounded-[24px] p-5 md:p-6 space-y-4">
            <div className="flex flex-wrap justify-between items-center gap-3 pb-1">
              <button
                type="button"
                onClick={() => setIsCopywriterOpen(!isCopywriterOpen)}
                className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center gap-2 cursor-pointer group hover:text-[#00ffcc] transition-colors"
              >
                <Sparkles className="w-4 h-4 text-[#00ffcc]" /> 
                <span>2. Smart Social Media Copywriter</span>
                {isCopywriterOpen ? <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-[#00ffcc] transition-transform" /> : <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-[#00ffcc] transition-transform" />}
              </button>
              
              {isCopywriterOpen && (
                <div className="flex bg-zinc-950 rounded-lg p-0.5 border border-zinc-850">
                  {[
                    { id: 'hype', label: '📣 HYPE' },
                    { id: 'heavy-metal', label: '💀 METAL' },
                    { id: 'minimal', label: '🔮 MINIMAL' }
                  ].map((v, vIdx) => (
                    <button
                      key={`${v.id}-${vIdx}`}
                      type="button"
                      onClick={() => setCaptionVibe(v.id as any)}
                      className={`px-2.5 py-1 rounded text-[8.5px] font-mono uppercase tracking-wider transition ${
                        captionVibe === v.id ? 'bg-zinc-800 font-bold text-[#00ffcc]' : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      {v.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isCopywriterOpen && (
              <div className="bg-black/40 border border-zinc-900 rounded-2xl p-4 md:p-5 space-y-4 relative text-left">
                <p className="text-xs md:text-sm text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap select-all bg-black/30 p-3 rounded-lg border border-zinc-900">
                  {generatedCaption}
                </p>
                
                <div className="flex flex-wrap gap-2.5 items-center justify-between border-t border-zinc-900 pt-3">
                  <span className="text-[9px] font-mono text-zinc-500 block">
                    🚀 TAILORED FOR RAPID INSTAGRAM/TWITTER DRIP ADVERTISING
                  </span>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={generateCaption}
                      className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer"
                    >
                      Regenerate
                    </button>
                    <button
                      type="button"
                      onClick={copyCaptionToClipboard}
                      className="bg-indigo-600 hover:bg-indigo-505 text-white transition px-3 py-1.5 rounded-lg text-[10px] uppercase font-mono tracking-wider font-bold cursor-pointer hover:shadow-[0_0_15px_rgba(79,70,229,0.3)]"
                    >
                      Copy Captions
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {subTabMode === 'stories_only' && onCollapse && (
            <div className="flex justify-center pt-2 pb-6">
              <button
                type="button"
                onClick={onCollapse}
                className="bg-[#39ff14]/10 hover:bg-[#39ff14]/20 border border-[#39ff14]/30 text-[#39ff14] text-[10px] font-mono font-bold uppercase tracking-widest px-4 py-2 rounded-full transition-colors flex items-center gap-2 cursor-pointer"
              >
                Close Story Creator <ChevronUp className="w-3 h-3" />
              </button>
            </div>
          )}

        </div>
      ) : (
        <div className="space-y-6">
          
          {/* LOYALTY METRICS AND PROMO STAND SIGN */}
          <div className="flex flex-col gap-6">
            
            {/* Table QR sign preview (card on the table concept) */}
            <div className="bg-[#1a122e]/40 border-2 border-purple-900/50 rounded-[28px] p-6 text-center flex flex-col justify-between items-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl" />
              
              <div className="space-y-2 mt-2 w-full text-center">
                <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-400/10 border border-purple-400/20 px-2 py-1 rounded-full uppercase tracking-widest inline-block">
                  TABLE MARKETING STAND BANNER
                </span>
                <h2 className="text-xl font-display font-black text-white tracking-tight uppercase">
                  JOIN the {activeBandName} VIP Merch Club!
                </h2>
                <p className="text-xs text-purple-200/70 font-sans max-w-md mx-auto">
                  Scan this table’s QR code to enter your info. Instantly unlock a 20% off merch code for tonight and get a lifetime 10% off VIP checkout pass!
                </p>
              </div>

              {/* Large Code Graphic Card Mock */}
              <div className="bg-zinc-950/80 border border-purple-900/50 p-5 rounded-2xl w-48 h-48 my-6 flex flex-col items-center justify-center space-y-3 shadow-inner relative">
                {/* Working QR block layout */}
                <div className="bg-white p-2 rounded-xl relative cursor-pointer" onClick={() => { setSubmittedFanCard(null); setShowSignupKiosk(true); }}>
                  <QRCode value={window.location.origin + "?signup=vip"} size={135} bgColor="#ffffff" fgColor="#000000" />
                </div>
                
                <span className="text-[9px] font-mono text-purple-300 font-bold tracking-widest uppercase">
                  SCAN FOR VIP VOUCHERS
                </span>
              </div>

              {/* Action Button: scanner mockup */}
              <button
                onClick={() => {
                  setSubmittedFanCard(null);
                  setShowSignupKiosk(true);
                }}
                className="w-full max-w-sm bg-purple-600 hover:bg-purple-500 text-white py-3 px-4 rounded-xl text-[11px] uppercase font-mono font-black tracking-wider flex items-center justify-center gap-2 cursor-pointer transition shadow-[0_4px_15px_rgba(147,51,234,0.3)] hover:scale-[1.02]"
              >
                <Smartphone className="w-4 h-4" />
                📲 Simulate Table QR Scan (Open Sign-Up)
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="space-y-4">
              
              {/* SIDE BY SIDE METRICS */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-black">AUDIENCE</span>
                    <Users className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-mono font-black text-white">{loyaltyMembers.length}</span>
                    <span className="block text-[8px] text-zinc-500 font-mono uppercase mt-0.5" style={{ lineHeight: '10px' }}>Lifetime Members</span>
                  </div>
                </div>

                <div className="bg-zinc-950/80 border border-zinc-850 p-4 rounded-2xl flex flex-col justify-between">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-black">OPT-IN</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div>
                    <span className="text-2xl font-mono font-black text-white">
                      {Math.round((loyaltyMembers.filter(m => m.opt_in_promotions).length / Math.max(1, loyaltyMembers.length)) * 100)}%
                    </span>
                    <span className="block text-[8px] text-zinc-500 font-mono uppercase mt-0.5" style={{ lineHeight: '10px' }}>
                      Subscribed
                    </span>
                  </div>
                </div>
              </div>

              {/* LOYALTY FANS DIRECTORY TABLE (Moved up into the column) */}
              <div className="bg-[#111319]/80 border border-purple-900/40 rounded-2xl p-4 flex flex-col h-[300px] overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-purple-900/30 pb-3 mb-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-purple-400" />
                    <h3 className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
                      Fan Roster
                    </h3>
                  </div>
                  
                  {/* Dynamic search input */}
                  <div className="relative bg-zinc-950 rounded-xl px-3 py-1.5 border border-purple-900/30 flex items-center gap-2 w-full max-w-[200px]">
                    <Search className="w-3 h-3 text-purple-400/50" />
                    <input
                      type="text"
                      placeholder="Filter roster..."
                      value={loyaltySearch}
                      onChange={(e) => setLoyaltySearch(e.target.value)}
                      className="bg-transparent border-none text-[10px] font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-purple-900/50">
                  <table className="w-full text-left text-[10px] font-mono whitespace-nowrap">
                    <thead className="sticky top-0 bg-[#0c0e12] z-10 text-[9px] uppercase tracking-wider text-purple-400 font-bold border-b border-purple-900/50">
                      <tr>
                        <th className="py-2.5 px-3">Member Name</th>
                        <th className="py-2.5 px-3">Contact Info</th>
                        <th className="py-2.5 px-2 text-center">Status</th>
                        <th className="py-2.5 px-2 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-purple-900/20">
                      {filteredMembers.length > 0 ? (
                        filteredMembers.map((member, idx) => (
                          <tr key={`${member.id}-${idx}`} className="hover:bg-purple-900/10 transition-colors">
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-white block">{member?.name}</span>
                              <span className="text-[9px] text-purple-300">Joined: {new Date(member.created_at).toLocaleDateString()}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="block text-zinc-300">{member.email}</span>
                              <span className="text-[9px] text-zinc-500">
                                {member.phone.substring(0, 3)}-{member.phone.substring(3, 6)}-{member.phone.substring(6)}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              {member.opt_in_promotions ? (
                                <span className="inline-block bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8.5px] px-1.5 py-0.5 rounded-md uppercase font-bold shadow-[0_0_8px_rgba(16,185,129,0.15)]">
                                  Opt-In
                                </span>
                              ) : (
                                <span className="inline-block bg-zinc-900 border border-zinc-800 text-zinc-500 text-[8.5px] px-1.5 py-0.5 rounded-md uppercase">
                                  Declined
                                </span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-right">
                              <button
                                onClick={() => handleDeleteLoyaltyMember(member.id, member?.name)}
                                className="p-1 hover:bg-red-500/20 border border-transparent hover:border-red-900/60 text-zinc-500 hover:text-red-400 rounded transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-purple-400/50 italic text-[10px]">
                            No loyalty program club members found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* LIFETIME PERKS (Moved to bottom) */}
          <div className="bg-[#1c122e]/40 border border-purple-900/40 p-6 rounded-[24px] text-left space-y-4">
            <h4 className="text-[11px] font-mono font-black text-purple-300 uppercase tracking-widest flex items-center gap-1.5 border-b border-purple-900/30 pb-3">
              <Award className="w-4 h-4 text-purple-400" /> Lifetime VIP perks
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-purple-900/20">
                <span className="text-2xl mb-2 block">🎟️</span>
                <span className="text-[10px] uppercase font-mono font-bold text-white block mb-1">Signup Voucher</span>
                <span className="text-[10px] text-zinc-400 font-sans leading-relaxed">20% direct checkout deduction via initial signup voucher code.</span>
              </div>
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-purple-900/20">
                <span className="text-2xl mb-2 block">✨</span>
                <span className="text-[10px] uppercase font-mono font-bold text-white block mb-1">Permanent Promo</span>
                <span className="text-[10px] text-zinc-400 font-sans leading-relaxed">10% permanent lifetime coupon on next tour merch stops.</span>
              </div>
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-purple-900/20">
                <span className="text-2xl mb-2 block">🔐</span>
                <span className="text-[10px] uppercase font-mono font-bold text-white block mb-1">PIN Security</span>
                <span className="text-[10px] text-zinc-400 font-sans leading-relaxed">Lookup via Telephone Number with encrypted PIN security.</span>
              </div>
              <div className="bg-zinc-950/60 p-4 rounded-xl border border-purple-900/20">
                <span className="text-2xl mb-2 block">📡</span>
                <span className="text-[10px] uppercase font-mono font-bold text-white block mb-1">Resilience</span>
                <span className="text-[10px] text-zinc-400 font-sans leading-relaxed">Provides offline client database backup resilience during drops.</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* REACTIONAL SIMULATED SIGNUP KIOSK CONTAINER MODAL */}
      <AnimatePresence>
        {showSignupKiosk && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-950 border-2 border-purple-900/80 rounded-[40px] w-full max-w-sm overflow-hidden shadow-[2xl] flex flex-col relative"
            >
              
              {/* Phone Status bar mock */}
              <div className="bg-black/90 px-6 py-2 flex justify-between items-center border-b border-purple-950 font-mono text-[9px] text-zinc-500">
                <span>VIP_KIOSK_MODE</span>
                <span className="w-16 h-3.5 bg-zinc-900 rounded-full border border-zinc-800" />
                <span>100% 🔋</span>
              </div>

              {/* Header inside phone mockup */}
              <div className="px-5 py-4 border-b border-purple-950/60 bg-gradient-to-r from-purple-950/20 to-[#120a1c] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-purple-600/15 p-1.5 rounded-lg text-purple-400">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-mono font-black text-white uppercase tracking-tight">VIP Club Sign-up</h3>
                    <span className="text-[8.5px] font-mono text-purple-300 uppercase leading-none">{activeBandName}</span>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setShowSignupKiosk(false);
                    setSubmittedFanCard(null);
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-2.5 py-1 text-[9px] font-mono uppercase tracking-wider rounded border border-zinc-800"
                >
                  Exit
                </button>
              </div>

              {/* Scrollable phone viewport screen body */}
              <div className="p-5 flex-grow overflow-y-auto max-h-[70vh] scrollbar-thin space-y-4">
                
                {!submittedFanCard ? (
                  <form onSubmit={handleRegisterFan} className="space-y-4">
                    
                    <div className="text-center space-y-1.5 pb-2 border-b border-zinc-900">
                      <span className="text-[10px] font-mono text-purple-400 block font-bold uppercase tracking-widest select-none">🚨 30-Second Rapid Setup</span>
                      <h4 className="text-sm font-black text-white uppercase font-display leading-tight">Unlock Your Merch Savings</h4>
                      <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
                        Enter details to earn **20% off merch** tonight, plus **10% lifetime off** on future concert dates!
                      </p>
                    </div>

                    <div className="space-y-3 font-mono">
                      
                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-wide block">Contact Full Name</label>
                        <input
                          type="text"
                          required
                          value={fanName}
                          onChange={(e) => setFanName(e.target.value)}
                          placeholder="Elizabeth Bathory"
                          className="w-full bg-black/50 border border-purple-950/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-wide block">Email Address</label>
                        <input
                          type="email"
                          required
                          value={fanEmail}
                          onChange={(e) => setFanEmail(e.target.value)}
                          placeholder="elizabeth@screams.com"
                          className="w-full bg-black/50 border border-purple-950/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[9px] text-zinc-500 uppercase tracking-wide block">Telephone Number</label>
                        <input
                          type="tel"
                          required
                          value={fanPhone}
                          onChange={(e) => setFanPhone(e.target.value)}
                          placeholder="2135552026"
                          className="w-full bg-black/50 border border-purple-950/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase tracking-wide block">City</label>
                          <input
                            type="text"
                            required
                            value={fanCity}
                            onChange={(e) => setFanCity(e.target.value)}
                            placeholder="Budapest"
                            className="w-full bg-black/50 border border-purple-950/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase tracking-wide block">State/Province</label>
                          <input
                            type="text"
                            required
                            value={fanState}
                            onChange={(e) => setFanState(e.target.value)}
                            placeholder="Pest"
                            className="w-full bg-black/50 border border-purple-950/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[9px] text-zinc-500 uppercase tracking-wide block">Country</label>
                          <input
                            type="text"
                            required
                            value={fanCountry}
                            onChange={(e) => setFanCountry(e.target.value)}
                            placeholder="Hungary"
                            className="w-full bg-black/50 border border-purple-950/50 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-purple-400 uppercase tracking-wide font-bold block">4-Digit Verification PIN</label>
                          <input
                            type="text"
                            required
                            maxLength={4}
                            value={fanPin}
                            onChange={(e) => setFanPin(e.target.value.replace(/\D/g, ''))}
                            placeholder="0000"
                            className="w-full bg-black/80 border-2 border-purple-900 rounded-xl p-2.5 text-xs text-center text-[#00ffcc] font-mono tracking-widest font-black focus:outline-none focus:border-teal-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-start gap-2 pt-2 select-none">
                        <input
                          type="checkbox"
                          id="optin-promo-chk"
                          checked={fanOptIn}
                          onChange={(e) => setFanOptIn(e.target.checked)}
                          className="mt-0.5 rounded border-purple-950 bg-black text-purple-600 focus:ring-purple-500 cursor-pointer text-xs"
                        />
                        <label htmlFor="optin-promo-chk" className="text-[8.5px] text-zinc-500 hover:text-zinc-300 leading-tight cursor-pointer font-sans">
                          Yes! I explicitly agree to earn discounts in trade for subscribing to {activeBandName} newsletter emails, exclusive touring dates updates, limit merch release alerts!
                        </label>
                      </div>

                    </div>

                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono text-xs uppercase font-bold py-3 rounded-xl tracking-wider cursor-pointer shadow-lg hover:shadow-purple-500/20 border border-purple-500/40"
                    >
                      Complete Sign-up & Claim Code 🚀
                    </button>

                  </form>
                ) : (
                  <div className="text-center space-y-4">
                    
                    <div className="flex flex-col items-center gap-1.5 py-2">
                      <div className="bg-purple-900/40 text-purple-300 border border-purple-800 p-2.5 rounded-full inline-block">
                        <CheckCircle2 className="w-7 h-7 text-[#00ffcc]" />
                      </div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">WELCOME TO THE INNER CIRCLE</h4>
                      <span className="text-[9px] font-mono text-[#00ffcc] uppercase leading-none">VIP LOYALTY CARD REGISTERED!</span>
                    </div>

                    {/* Highly aesthetic Member pass card */}
                    <div className="bg-gradient-to-b from-purple-950/60 to-zinc-950 p-5 rounded-2xl border border-purple-800 text-center space-y-4 relative overflow-hidden shadow-2xl">
                      {/* Grid background mask decorator */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0)_95%,#000_100%)] pointer-events-none" />
                      
                      <div className="flex justify-between items-center border-b border-purple-900/60 pb-2">
                        <span className="text-[9px] font-mono text-zinc-500 uppercase">OFFICIAL VIP DRIP PASS</span>
                        <span className="text-[10px] font-mono font-black text-purple-400">#NC-{Math.floor(Math.random() * 900 + 100)}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[8px] font-mono text-zinc-400 uppercase tracking-widest block font-bold">MEMBER</span>
                        <div className="text-base font-display font-black text-white uppercase">{submittedFanCard.name}</div>
                        <span className="text-[9px] font-mono text-purple-300 font-medium">Origin: {submittedFanCard.city}, {submittedFanCard.state}</span>
                      </div>

                      {/* 20% Off coupon code block */}
                      <div className="bg-black/80 border border-[#00ffcc]/30 p-3 rounded-xl space-y-1 relative">
                        <span className="text-[9px] font-mono text-[#00ffcc] font-black uppercase tracking-widest block">🎟️ TONIGHT'S 20% COUPON</span>
                        <div className="text-lg font-mono font-black text-white tracking-wider select-all">
                          VIP20-{submittedFanCard.name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase() || 'MEMBER'}-{submittedFanCard.pin}
                        </div>
                        <span className="text-[8px] font-mono text-zinc-500 block leading-none">TAP CODE TO HIGHLIGHT / REVEAL DISCOUNTS</span>
                      </div>

                      <div className="space-y-2 border-t border-purple-900/40 pt-4 text-left">
                        <div className="flex gap-2 items-center text-[10px] text-zinc-300 font-sans leading-relaxed">
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full shrink-0 animate-ping" />
                          <span>Show this badge mockup or supply your Telephone Number + PIN code at checked registers to apply <strong>10% Lifetime Off</strong> future merch table checkouts!</span>
                        </div>
                      </div>

                      <div className="text-[8px] font-mono text-zinc-600 text-center pt-2">
                        {submittedFanCard.email} opt-in consent recorded.
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setSubmittedFanCard(null);
                      }}
                      className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs uppercase py-2.5 rounded-xl border border-zinc-800 transition cursor-pointer"
                    >
                      Sign-Up Next Fan on Kiosk
                    </button>

                  </div>
                )}

              </div>

              {/* Pad block mock bottom */}
              <div className="bg-zinc-950 p-4 border-t border-purple-950/40 text-center">
                <span className="text-[8px] font-mono text-zinc-600 block uppercase font-bold">🎯 Nexus Core Loyalty Kiosk Station</span>
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
