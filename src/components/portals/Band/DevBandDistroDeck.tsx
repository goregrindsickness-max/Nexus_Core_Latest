import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Heart,
  ShoppingBag,
  Palette,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronLeft,
  Sparkles,
  Users,
  Grid,
  Check,
  Smartphone,
  Image as ImageIcon,
  Share2,
  Send,
  MessageSquare,
  ThumbsUp,
  X,
  Upload,
  Globe,
  Bell,
  Camera,
  Calendar,
  Music,
  SkipBack,
  SkipForward,
  Pause,
  Play,
  Volume2
} from 'lucide-react';
import { InventoryItem, StagedDistroItem } from '../../../types';

const BANNER_PRESETS = [
  { name: 'Slayer Crimson Gradient', url: 'linear-gradient(135deg, #7a0010 0%, #140003 100%)' },
  { name: 'Chamber Tomb Dust Noir', url: 'linear-gradient(135deg, #1d1e22 0%, #0b0c10 100%)' },
  { name: 'Laser Radioactive Cyan', url: 'linear-gradient(135deg, #001f3f 0%, #0074d9 50%, #00f0ff 100%)' },
  { name: 'Vapor Wave Dusk Purple', url: 'linear-gradient(135deg, #2d0047 0%, #530066 60%, #ff007f 100%)' },
];

const COLOR_PRESETS = [
  { name: 'Neon Acid Green', value: '#39ff14' },
  { name: 'Hot Laser Pink', value: '#ff007f' },
  { name: 'Cyan Reactor Blue', value: '#00f0ff' },
  { name: 'Hazard Glow Yellow', value: '#ffea00' },
  { name: 'Deep Cosmic Violet', value: '#ad00ff' }
];

const formatTrackTime = (seconds: number) => {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

interface DevBandDistroDeckProps {
  inventory?: InventoryItem[];
  triggerNotification?: (msg: string) => void;
  onBack?: () => void;
  onNavigateToTab?: (tab: string) => void;
  stagedDistroItems: StagedDistroItem[];
  setStagedDistroItems: React.Dispatch<React.SetStateAction<StagedDistroItem[]>>;
  initialSubTab?: 'feed' | 'merch' | 'fans' | 'customizer' | 'alliances' | 'music';
  subTabMode?: 'all' | 'decoupled_merch';
}

interface SimulatedFollow {
  id: string;
  username: string;
  location: string;
  followedAt: string;
}

export default function DevBandDistroDeck({
  inventory = [],
  triggerNotification,
  onBack,
  onNavigateToTab,
  stagedDistroItems,
  setStagedDistroItems,
  initialSubTab,
  subTabMode = 'all'
}: DevBandDistroDeckProps) {
  // --- Persistent & Customize Settings ---
  const [bandName, setBandName] = useState<string>(() => {
    return localStorage.getItem('distro_db_band_name') || 'Virulent Excision';
  });

  const [profileAccentColor, setProfileAccentColor] = useState<string>(() => {
    return localStorage.getItem('distro_db_accent_color') || '#39ff14';
  });

  const [profileBannerMode, setProfileBannerMode] = useState<string>(() => {
    return localStorage.getItem('distro_db_banner_url') || 'linear-gradient(135deg, #1d1e22 0%, #0b0c10 100%)';
  });

  const [bandLogoUrl, setBandLogoUrl] = useState<string>(() => {
    return localStorage.getItem('distro_db_band_logo') || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150&auto=format&fit=crop';
  });

  const [bandBio, setBandBio] = useState<string>(() => {
    return localStorage.getItem('distro_db_band_bio') || 'Heavy DIY death metal sound systems & intense underground physical distribution networks.';
  });

  const [featuredDistroItemId, setFeaturedDistroItemId] = useState<string>(() => {
    return localStorage.getItem('distro_db_featured_id') || '';
  });

  // --- Automated Audio Pipeline Optimization States ---
  const [audioPipelineLog, setAudioPipelineLog] = useState<string[]>([]);
  const [isProcessingAudio, setIsProcessingAudio] = useState<boolean>(false);
  const [audioPipelineProgress, setAudioPipelineProgress] = useState<number>(0);
  const [processedTrackName, setProcessedTrackName] = useState<string>('');

  const handleAudioPipelineUpload = (file: File) => {
    setIsProcessingAudio(true);
    setAudioPipelineProgress(0);
    setProcessedTrackName(file.name);
    setAudioPipelineLog([]);

    const ext = file.name.split('.').pop() || 'mp3';
    const logs: string[] = [
      `[HANDSHAKE] Connected to Sovereign Audio Normalization Engine v3.8`,
      `[ANALYZING] File: "${file.name}" | Size: ${(file.size / (1024 * 1024)).toFixed(2)} MB`,
      `[CODEC PARSING] Parsing audio structure and headers...`,
      ext.toLowerCase() === 'wav' 
        ? `[PCM DETECTED] Source bit-depth: 24-bit Lossless Studio PCM master discovered.`
        : `[MPEG DETECTED] Source codec: standard compressed MP3 container discovered.`,
      `[NORMALIZING] Recalibrating amplitude gain strictly to -14.0 LUFS target standard.`,
      ext.toLowerCase() === 'wav'
        ? `[ARCHIVING] Compressing & moving original 24-bit WAV master to isolated cloud archive.`
        : `[ARCHIVING] Original audio stream backup securely isolated in cloud vault.`,
      `[TRANSCODING] Automatically compiling 320kbps MP3 streaming variant for user stream deck...`,
      `[SUCCESS] Compilation complete. Mirrored stream finalized.`
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        setAudioPipelineLog(prev => [...prev, logs[currentLogIndex]]);
        setAudioPipelineProgress(Math.round(((currentLogIndex + 1) / logs.length) * 100));
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessingAudio(false);
          const createdUrl = URL.createObjectURL(file);
          const isWav = file.name.toLowerCase().endsWith('.wav');
          
          const newTrackObj = {
            id: 'local_track_' + Date.now(),
            title: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
            duration: isWav ? '4:12' : '3:45', 
            url: createdUrl,
            fileType: isWav ? 'mp3 (320kbps Stream)' : 'mp3 (Streaming Opt)',
            track_preview_mode: '30_SEC_CLIP',
            track_price: 1.00,
            track_visibility: true,
            isOptimized: true
          };

          setUploadedTracks(prev => [...prev, newTrackObj]);
          if (triggerNotification) {
            triggerNotification(`Audio optimized and compiled successfully! 📻`);
          }
        }, 500);
      }
    }, 400);
  };

  // --- Crop Modal & Editor States ---
  const [cropModalData, setCropModalData] = useState<{
    isOpen: boolean;
    imageType: 'logo' | 'banner' | 'item';
    originalSrc: string;
    fileName: string;
    itemId?: string;
  } | null>(null);

  const [cropZoom, setCropZoom] = useState<number>(1.0);
  const [cropRotate, setCropRotate] = useState<number>(0);
  const [cropFilter, setCropFilter] = useState<string>('none');
  const [cropX, setCropX] = useState<number>(0);
  const [cropY, setCropY] = useState<number>(0);

  const [editingItemImgId, setEditingItemImgId] = useState<string | null>(null);
  const itemImgInputRef = useRef<HTMLInputElement>(null);

  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // --- Sub tabs for client navigation ---
  const [activeSubTab, setActiveSubTab] = useState<'feed' | 'merch' | 'fans' | 'customizer' | 'alliances' | 'music'>(() => {
    if (subTabMode === 'decoupled_merch') return initialSubTab === 'music' ? 'music' : 'merch';
    return (initialSubTab && initialSubTab !== 'feed') ? initialSubTab : 'music';
  });

  useEffect(() => {
    if (subTabMode === 'decoupled_merch') {
      setActiveSubTab(initialSubTab === 'music' ? 'music' : 'merch');
    } else if (initialSubTab && initialSubTab !== 'feed') {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab, subTabMode]);

  // --- Label Interaction States ---
  const [allianceMode, setAllianceMode] = useState<'bands' | 'labels'>('bands');
  const [labelSearchText, setLabelSearchText] = useState('');
  
  // Selected label profile object retrieved live from localStorage
  const [syncedLabelProfile, setSyncedLabelProfile] = useState(() => {
    const cached = localStorage.getItem('label_public_profile');
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (err) {}
    }
    return {
      name: "NEXUS CORE RECORDS",
      handle: "nexus_core_records",
      bio: "Pioneering the next wave of underground sound. Specializing in grindcore, doom, and industrial electronic fusion. Staging boundary-pushing artists since 2026.",
      location: "CHICAGO, IL",
      founded: "2026",
      website: "https://nexus-core.io",
      contact: "signings@nexus-core.io",
      acceptsInquiries: true
    };
  });

  const [showDmComposer, setShowDmComposer] = useState(false);
  const [dmText, setDmText] = useState('');
  
  const [showEpkComposer, setShowEpkComposer] = useState(false);
  const [epkGenre, setEpkGenre] = useState('');
  const [epkDemoLink, setEpkDemoLink] = useState('https://demos.soundstream.com/virulent-excision');
  const [epkPitch, setEpkPitch] = useState('');
  const [epkMessage, setEpkMessage] = useState('');

  // Follow states for labels
  const [isLabelFollowed, setIsLabelFollowed] = useState(() => {
    return localStorage.getItem('is_label_followed_by_band') === 'true';
  });

  React.useEffect(() => {
    localStorage.setItem('is_label_followed_by_band', isLabelFollowed ? 'true' : 'false');
  }, [isLabelFollowed]);

  // Sync state from storage if it updates in another view
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'label_public_profile' && e.newValue) {
        try {
          setSyncedLabelProfile(JSON.parse(e.newValue));
        } catch (err) {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSendLabelDm = () => {
    if (!dmText.trim()) return;
    const currentInbox = JSON.parse(localStorage.getItem('label_inbound_inbox') || '[]');
    const newDm = {
      id: 'inq_' + Date.now(),
      type: 'dm',
      senderName: bandName.toUpperCase(),
      senderRole: 'band',
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      message: dmText.trim(),
      status: 'unread',
      replies: []
    };
    const updated = [newDm, ...currentInbox];
    localStorage.setItem('label_inbound_inbox', JSON.stringify(updated));
    
    // Dispatch storage event to live-update other instances
    window.dispatchEvent(new Event('storage'));
    
    setDmText('');
    setShowDmComposer(false);
    triggerNotification?.("Direct Message successfully transmitted to Label HQ inbox! 📡");
  };

  const handleSendLabelEpk = () => {
    if (!epkMessage.trim()) return;
    const currentInbox = JSON.parse(localStorage.getItem('label_inbound_inbox') || '[]');
    const newEpk = {
      id: 'inq_' + Date.now(),
      type: 'epk',
      senderName: bandName.toUpperCase(),
      senderRole: 'band',
      timestamp: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }),
      message: epkMessage.trim(),
      genre: epkGenre || 'Death Metal / Industrial',
      epkLink: epkDemoLink,
      pitch: epkPitch || bandBio,
      status: 'unread',
      replies: []
    };
    const updated = [newEpk, ...currentInbox];
    localStorage.setItem('label_inbound_inbox', JSON.stringify(updated));
    
    // Dispatch storage event
    window.dispatchEvent(new Event('storage'));
    
    setEpkMessage('');
    setEpkGenre('');
    setEpkPitch('');
    setShowEpkComposer(false);
    triggerNotification?.("EPK demo dossier compiled and transmitted to Label HQ! 💿");
  };

  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  // Input file triggers
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // --- Mock Databases in Local Storage State ---
  const [otherBands, setOtherBands] = useState<any[]>(() => {
    const cached = localStorage.getItem('distro_db_allied_bands');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [
      {
        id: 'ob_1',
        name: 'Goregrind Overlords',
        genre: 'Death Metal / Grindcore',
        bio: 'Securing raw high-gain filth since 2018. FFO: Mortician, Carcass.',
        followerCount: 14290,
        followedByUs: true,
        logo: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=150&auto=format&fit=crop',
        merch: [
          { id: 'obm_1', name: 'GORE OVERLORD LONG SLEEVE', price: 35.00, image: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?q=80&w=200&auto=format&fit=crop' },
          { id: 'obm_2', name: 'SLATTED CRYPT FEST DETROIT ENTRY TICKET', price: 25.00, image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200&auto=format&fit=crop' }
        ],
        posts: [
          {
            id: 'obp_1',
            timestamp: '5 hours ago',
            message: '💀 ALLIANCE TOUR NEWS: Detroit Crypt Basement tour dates finalized with our brothers! Staged security codes are now valid for checkout. Buy tickets below directly from this feed!',
            likes: 104,
            userLiked: false,
            comments: [
              { id: 'obc_1', username: 'grindcore_mom', text: 'Detroit basement show is gonna be insane!', time: '4 hours ago' }
            ]
          }
        ]
      },
      {
        id: 'ob_2',
        name: 'Necrosynth Cult',
        genre: 'Darkwave / Cyberpunk Synth',
        bio: 'Aesthetic neon decay, darkwave arpeggiator triggers, and heavy machine drums.',
        followerCount: 8400,
        followedByUs: true,
        logo: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=150&auto=format&fit=crop',
        merch: [
          { id: 'obm_3', name: 'ANALOG DECAY CASSETTE (PURPLE SHELL)', price: 12.00, image: 'https://images.unsplash.com/photo-1614149162883-504ce4d13909?q=80&w=200&auto=format&fit=crop' },
          { id: 'obm_4', name: 'CYBER ENAMEL LOGO PIN', price: 8.05, image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?q=80&w=200&auto=format&fit=crop' }
        ],
        posts: [
          {
            id: 'obp_2',
            timestamp: '1 day ago',
            message: '🔮 NEW MUSIC RELEASE: The heavy darkwave synthetic ritual track is streaming on the band alliance node. Reworked analog filters allow severe resonance sweeps.',
            likes: 72,
            userLiked: false,
            comments: []
          }
        ]
      },
      {
        id: 'ob_3',
        name: 'Rust Iron Void',
        genre: 'Industrial Noise / Power Electronics',
        bio: 'Harsh static frequencies, iron plate reverberation, and modular synthesizer loop structures.',
        followerCount: 3110,
        followedByUs: false,
        logo: 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?q=80&w=150&auto=format&fit=crop',
        merch: [
          { id: 'obm_5', name: 'ROTOR BLADES TRANSPARENT VINYL', price: 30.00, image: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=200&auto=format&fit=crop' },
          { id: 'obm_6', name: 'ABANDONED WEAKNESS OVERSIZED PARKA', price: 55.00, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=200&auto=format&fit=crop' }
        ],
        posts: [
          {
            id: 'obp_3',
            timestamp: '3 days ago',
            message: '⚙️ DESTRUCTION DRILL: Recorded live in Chicago inside an abandoned high-voltage generator station. Raw distortion only. Play at maximum gain.',
            likes: 41,
            userLiked: false,
            comments: []
          }
        ]
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('distro_db_allied_bands', JSON.stringify(otherBands));
  }, [otherBands]);

  const [activeBandCommentInput, setActiveBandCommentInput] = useState<{[key: string]: string}>({});

  const [simFollows, setSimFollows] = useState<SimulatedFollow[]>(() => {
    const cached = localStorage.getItem('distro_db_follows');
    if (cached) {
      try { return JSON.parse(cached); } catch (e) {}
    }
    return [];
  });

  // --- Our Music & YouTube Video States ---
  const [uploadedTracks, setUploadedTracks] = useState<any[]>(() => {
    const cached = localStorage.getItem('distro_db_music_tracks');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('distro_db_music_tracks', JSON.stringify(uploadedTracks));
  }, [uploadedTracks]);

  const [youtubeVideos, setYoutubeVideos] = useState<any[]>(() => {
    const cached = localStorage.getItem('distro_db_music_yt');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('distro_db_music_yt', JSON.stringify(youtubeVideos));
  }, [youtubeVideos]);

  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const [musicIsPlaying, setMusicIsPlaying] = useState<boolean>(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [musicProgress, setMusicProgress] = useState<number>(0);
  const [musicDuration, setMusicDuration] = useState<number>(0);
  const [musicVolume, setMusicVolume] = useState<number>(0.8);

  const [isAlbumPurchased, setIsAlbumPurchased] = useState<boolean>(() => {
    return localStorage.getItem('distro_db_album_purchased') === 'true';
  });
  const [isDigitalDownloading, setIsDigitalDownloading] = useState<boolean>(false);
  const [digitalDownloadProgress, setDigitalDownloadProgress] = useState<number>(0);

  // Audio players event updates
  const handleAudioTimeUpdate = () => {
    if (audioPlayerRef.current) {
      setMusicProgress(audioPlayerRef.current.currentTime);
    }
  };

  const handleAudioLoadedMetadata = () => {
    if (audioPlayerRef.current) {
      setMusicDuration(audioPlayerRef.current.duration);
    }
  };

  const handleAudioEnded = () => {
    // Autoplay next track
    if (uploadedTracks.length > 1) {
      const nextIndex = (currentTrackIndex + 1) % uploadedTracks.length;
      setCurrentTrackIndex(nextIndex);
      setMusicProgress(0);
      if (audioPlayerRef.current) {
        audioPlayerRef.current.src = uploadedTracks[nextIndex].url;
        audioPlayerRef.current.play().then(() => {
          setMusicIsPlaying(true);
        }).catch(() => {});
      }
    } else {
      setMusicIsPlaying(false);
      setMusicProgress(0);
    }
  };

  const toggleMusicPlay = () => {
    if (!audioPlayerRef.current || uploadedTracks.length === 0) return;
    
    // Lazy-bind source if first run
    if (!audioPlayerRef.current.src) {
      audioPlayerRef.current.src = uploadedTracks[currentTrackIndex].url;
    }

    if (musicIsPlaying) {
      audioPlayerRef.current.pause();
      setMusicIsPlaying(false);
    } else {
      audioPlayerRef.current.play().then(() => {
        setMusicIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };

  const selectTrackToPlay = (index: number) => {
    if (!audioPlayerRef.current) return;
    setCurrentTrackIndex(index);
    setMusicProgress(0);
    audioPlayerRef.current.src = uploadedTracks[index].url;
    audioPlayerRef.current.load();
    audioPlayerRef.current.play().then(() => {
      setMusicIsPlaying(true);
    }).catch(() => {});
  };

  const PRESET_LOGO_IMAGES = [
    { name: 'Crimson Skull Motif', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=150&auto=format&fit=crop' },
    { name: 'Void Black Wave', url: 'https://images.unsplash.com/photo-1605721911519-3dfeb3be25e7?q=80&w=150&auto=format&fit=crop' },
    { name: 'Green Bio Reactor', url: 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=150&auto=format&fit=crop' }
  ];

  // --- Submitting states & Warehouse selection ---
  const PRESET_PHYS_INVENTORY: InventoryItem[] = [
    {
      id: 'mock_inv_001',
      name: 'GRAVE REAPER SLOW-DEATH SIGNATURE TEE',
      table_stock: 45,
      van_stock: 80,
      status: 'Healthy',
      item_type: 'One Size',
      price: 35.00,
      image_url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'mock_inv_002',
      name: 'SPLATTERED EMBROIDERY HEAVY FLEECE ZIP-HOODIE',
      table_stock: 12,
      van_stock: 35,
      status: 'Warning',
      item_type: 'Multiple',
      price: 65.00,
      image_url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=300&auto=format&fit=crop'
    },
    {
      id: 'mock_inv_003',
      name: 'RITUAL SEWER GATES DOUBLE VINYL (SPLATTER EDITION)',
      table_stock: 5,
      van_stock: 12,
      status: 'Critical',
      item_type: 'CD',
      price: 40.00,
      image_url: 'https://images.unsplash.com/photo-1539628390156-b84a0a2ba7e3?q=80&w=300&auto=format&fit=crop'
    }
  ];

  const physicalItems = useMemo(() => {
    const combined = [...inventory];
    if (combined.length < 3) {
      PRESET_PHYS_INVENTORY.forEach(p => {
        if (!(combined || []).some(c => c.name === p.name)) {
          combined.push(p);
        }
      });
    }
    return combined;
  }, [inventory]);

  const [selectedPhysicalId, setSelectedPhysicalId] = useState<string>(physicalItems[0]?.id || '');
  const [newStorePrice, setNewStorePrice] = useState<string>('39.99');
  const [newStoreDesc, setNewStoreDesc] = useState<string>('');

  // Save changes to localStorage on states write

  useEffect(() => {
    localStorage.setItem('distro_db_follows', JSON.stringify(simFollows));
  }, [simFollows]);

  const logUpdate = (msg: string) => {
    console.log('[DISTRO_PROD_UPGRADE_ACT]', msg);
  };

  // --- Action Methods ---
  const handleUpdateAccentColor = (color: string) => {
    setProfileAccentColor(color);
    localStorage.setItem('distro_db_accent_color', color);
    logUpdate(`Accent color shifted: ${color}`);
    if (triggerNotification) triggerNotification(`Accent shifted to ${color}`);
  };

  const handleUpdateBannerPreset = (bannerUrl: string) => {
    setProfileBannerMode(bannerUrl);
    localStorage.setItem('distro_db_banner_url', bannerUrl);
    logUpdate(`Banner layout preset selection updated.`);
    if (triggerNotification) triggerNotification('Hero profile banner updated!');
  };

  const cropAndApplyFilters = (
    imageSrc: string,
    zoom: number,
    rotate: number,
    filter: string,
    type: 'logo' | 'banner' | 'item',
    offsetX: number,
    offsetY: number,
    callback: (dataUrl: string) => void
  ) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(imageSrc);
        return;
      }

      // Define target dimensions
      const width = type === 'logo' ? 400 : (type === 'item' ? 600 : 1200);
      const height = type === 'logo' ? 400 : (type === 'item' ? 450 : 450);
      canvas.width = width;
      canvas.height = height;

      // Fill rich pitch black backdrop
      ctx.fillStyle = '#0a0a0c';
      ctx.fillRect(0, 0, width, height);

      // Save translation context, apply centering, rotation, scaling and translation offsets
      ctx.save();
      // Multiply user's pixel shift based on the container dimension ratios
      const canvasOffsetX = offsetX * (type === 'logo' ? (400 / 200) : (type === 'item' ? (600 / 400) : (1200 / 400)));
      const canvasOffsetY = offsetY * (type === 'logo' ? (400 / 200) : (type === 'item' ? (450 / 150) : (450 / 150)));
      ctx.translate(width / 2 + canvasOffsetX, height / 2 + canvasOffsetY);
      ctx.rotate((rotate * Math.PI) / 180);
      ctx.scale(zoom, zoom);

      const imgRatio = img.width / img.height;
      const canvasRatio = width / height;
      let drawWidth = img.width;
      let drawHeight = img.height;

      if (imgRatio > canvasRatio) {
        drawHeight = height;
        drawWidth = height * imgRatio;
      } else {
        drawWidth = width;
        drawHeight = width / imgRatio;
      }

      ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      ctx.restore();

      // Apply extreme-metal custom filter palettes
      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      if (filter === 'grayscale') {
        for (let i = 0; i < data.length; i += 4) {
          const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = grey;
          data[i + 1] = grey;
          data[i + 2] = grey;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filter === 'contrast') {
        const factor = (259 * (180 + 255)) / (255 * (259 - 180));
        for (let i = 0; i < data.length; i += 4) {
          data[i] = factor * (data[i] - 128) + 128;
          data[i + 1] = factor * (data[i + 1] - 128) + 128;
          data[i + 2] = factor * (data[i + 2] - 128) + 128;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filter === 'acid') {
        for (let i = 0; i < data.length; i += 4) {
          const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = grey * 0.12; 
          data[i + 1] = grey * 1.55; 
          data[i + 2] = grey * 0.15;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filter === 'crimson') {
        for (let i = 0; i < data.length; i += 4) {
          const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = grey * 1.6;
          data[i + 1] = grey * 0.08;
          data[i + 2] = grey * 0.12;
        }
        ctx.putImageData(imgData, 0, 0);
      } else if (filter === 'cyan') {
        for (let i = 0; i < data.length; i += 4) {
          const grey = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
          data[i] = grey * 0.05;
          data[i + 1] = grey * 1.05;
          data[i + 2] = grey * 1.45;
        }
        ctx.putImageData(imgData, 0, 0);
      }

      try {
        const dataUrl = canvas.toDataURL('image/webp', 0.7);
        callback(dataUrl);
      } catch (e) {
        console.warn('Canvas processing toDataURL failed as a fallback:', e);
        callback(imageSrc);
      }
    };
    img.onerror = () => {
      callback(imageSrc);
    };
    img.src = imageSrc;
  };

  const handleLogoUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCropModalData({
        isOpen: true,
        imageType: 'logo',
        originalSrc: url,
        fileName: file.name
      });
      setCropZoom(1.0);
      setCropRotate(0);
      setCropFilter('none');
      setCropX(0);
      setCropY(0);
      e.target.value = '';
    }
  };

  const handleBannerUploadSim = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setCropModalData({
        isOpen: true,
        imageType: 'banner',
        originalSrc: url,
        fileName: file.name
      });
      setCropZoom(1.0);
      setCropRotate(0);
      setCropFilter('none');
      setCropX(0);
      setCropY(0);
      e.target.value = '';
    }
  };
  
  const handleSaveCroppedImage = () => {
    if (!cropModalData) return;
    const { imageType, originalSrc, itemId } = cropModalData;

    cropAndApplyFilters(originalSrc, cropZoom, cropRotate, cropFilter, imageType, cropX, cropY, (resultDataUrl) => {
      if (imageType === 'logo') {
        setBandLogoUrl(resultDataUrl);
        localStorage.setItem('distro_db_band_logo', resultDataUrl);
        if (triggerNotification) triggerNotification('Custom cropped Band logo successfully deployed!');
      } else if (imageType === 'banner') {
        const bannerStyle = `url(${resultDataUrl})`;
        setProfileBannerMode(bannerStyle);
        localStorage.setItem('distro_db_banner_url', bannerStyle);
        if (triggerNotification) triggerNotification('Custom cropped Hero banner successfully deployed!');
      } else if (imageType === 'item' && itemId) {
        setStagedDistroItems(prev => prev.map(item => {
          if (item.id === itemId) {
            return { ...item, product_image_url: resultDataUrl };
          }
          return item;
        }));
        if (triggerNotification) triggerNotification('Custom cropped Product image successfully deployed!');
      }
      setCropModalData(null);
    });
  };

  const handleItemImgFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropModalData({
          isOpen: true,
          imageType: 'item',
          originalSrc: reader.result,
          fileName: file.name,
          itemId: editingItemImgId || undefined
        });
        setCropZoom(1.0);
        setCropRotate(0);
        setCropFilter('none');
        setCropX(0);
        setCropY(0);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSaveBio = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBandBio(e.target.value);
    localStorage.setItem('distro_db_band_bio', e.target.value);
  };

  const handleToggleFeaturedPin = (id: string) => {
    const nextFeatured = featuredDistroItemId === id ? '' : id;
    setFeaturedDistroItemId(nextFeatured);
    localStorage.setItem('distro_db_featured_id', nextFeatured);
    logUpdate(nextFeatured ? `Featured store pinned ID ${nextFeatured}` : 'Featured pin unpinned');
    if (triggerNotification) triggerNotification(nextFeatured ? '📌 Spotlight pinned to banner!' : '📌 Pinned showcase cleared');
  };

  const handleAddNewFollower = () => {
    const usernames = ['analog_cult', 'grave_synthesizer', 'metal_rebel_99', 'industrial_shaman', 'dusk_listener_X', 'raw_sound_junkie'];
    const locations = ['Paris, FR', 'Los Angeles, CA', 'Gothenburg, SE', 'Chicago, IL', 'Austin, TX', 'Brooklyn, NY'];
    const randomUser = usernames[Math.floor(Math.random() * usernames.length)] + '_' + Math.floor(Math.random() * 99);
    const randomLoc = locations[Math.floor(Math.random() * locations.length)];

    const newFollower: SimulatedFollow = {
      id: `f_${Date.now()}`,
      username: randomUser,
      location: randomLoc,
      followedAt: 'Just now'
    };

    setSimFollows(prev => [newFollower, ...prev]);
    logUpdate(`Simulated follow trigger completed securely.`);
    if (triggerNotification) triggerNotification(`❤️ @${randomUser} followed your band channel!`);
  };

  const handleStageMerch = (e: React.FormEvent) => {
    e.preventDefault();
    const source = physicalItems.find(i => i.id === selectedPhysicalId);
    if (!source) return;

    const price = parseFloat(newStorePrice) || source.price || 29.99;
    const newItem: StagedDistroItem = {
      id: `distro_${Date.now()}`,
      inventory_id: source.id,
      name: source.name,
      original_item_type: source.item_type || 'Merch',
      storefront_price: price,
      public_description: newStoreDesc.trim() || `Official tour merchandise item: ${source.name}. Heavy cotton tailoring.`,
      product_image_url: source.image_url || 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?q=80&w=300&auto=format&fit=crop',
      visibility_status: true
    };

    setStagedDistroItems(prev => [newItem, ...prev]);
    setNewStoreDesc('');
    logUpdate(`Staged physical product in bandshop.`);
    if (triggerNotification) triggerNotification('📦 Item added to your retail catalog!');
  };

  const handleToggleStoreVisibility = (id: string) => {
    setStagedDistroItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, visibility_status: !item.visibility_status };
      }
      return item;
    }));
  };

  const handleDeleteStoreItem = (id: string) => {
    setStagedDistroItems(prev => prev.filter(item => item.id !== id));
    if (featuredDistroItemId === id) {
      setFeaturedDistroItemId('');
      localStorage.setItem('distro_db_featured_id', '');
    }
    if (triggerNotification) triggerNotification('🗑️ Removed shop item catalog entry');
  };

  const handleSimCartAdd = (item: StagedDistroItem) => {
    if (triggerNotification) {
      triggerNotification(`🛒 Mock Checkout Success: Secured ${item?.name} for $${item.storefront_price.toFixed(2)}`);
    }
  };

  const featuredItem = useMemo(() => {
    return stagedDistroItems.find(i => i.id === featuredDistroItemId);
  }, [stagedDistroItems, featuredDistroItemId]);

  return (
    <div id="band-public-profile-manager" className="space-y-6 text-left pb-16">
      
      {/* 1. COMPONENT TITLE NAVIGATION BREADCRUMB */}
      <div className="w-full flex flex-col items-center justify-center text-center gap-4 border-b border-zinc-900 pb-6">
        <div className="flex flex-col items-center justify-center space-y-2">
          <div className="flex items-center justify-center gap-2.5">
            {/* Back button removed */}
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-mono font-black uppercase tracking-widest flex items-center gap-1">
              <Globe className="w-3 h-3" /> PUBLIC BRAND HUB
            </span>
          </div>
          
          <h1 
            className="text-[38px] leading-[1.08] font-black text-white tracking-widest font-sans uppercase text-center green-neon-text-pulsing select-none pt-2"
          >
            Band Channel &<br />Social Feeds
          </h1>
          
          <p className="text-xs font-mono text-zinc-450 max-w-xl text-center leading-relaxed">
            Publish interactive updates, update public artwork profile systems, and sync tour stock with web storefronts.
          </p>
        </div>
      </div>

      {/* 2. REAL-TIME INTERACTIVE PORTAL BANNER */}
      <div className="space-y-4">
        
        {/* GLOBAL HERO STAGE DISPLAY */}
        <div
          className="w-full rounded-2xl border p-6 sm:p-8 relative overflow-hidden transition-all flex flex-col justify-between min-h-[280px] shadow-2xl"
          style={{
            background: profileBannerMode,
            backgroundImage: profileBannerMode.startsWith('url') ? profileBannerMode : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderColor: profileAccentColor,
            boxShadow: `0 10px 30px ${profileAccentColor}0d`
          }}
        >
          {/* Ambient Glass filter Overlay */}
          <div className="absolute inset-0 bg-black/65 backdrop-blur-[0.5px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center justify-center text-center gap-5 w-full my-auto">
            
            {/* BRAND LOGO MODULE - Centered & Significantly Bigger */}
            <div 
              className="w-28 h-28 sm:w-36 sm:h-36 rounded-full border-4 bg-black/90 shrink-0 overflow-hidden relative group shadow-2xl flex items-center justify-center cursor-pointer transition-transform duration-300 hover:scale-105"
              style={{ borderColor: profileAccentColor }}
              onClick={() => logoInputRef.current?.click()}
              title="Change Band Logo Symbol"
            >
              {bandLogoUrl ? (
                <img src={bandLogoUrl} className="w-full h-full object-cover" alt="Band Logo" referrerPolicy="no-referrer" />
              ) : (
                <ImageIcon className="w-8 h-8 text-zinc-650" />
              )}
              <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-[9px] font-mono text-white transition-opacity font-bold">
                <Upload className="w-4 h-4 mb-1 text-[#39ff14]" />
                <span>CHOOSE LOGO</span>
              </div>
            </div>

            {/* BRAND TITLE & DESCRIPTION LOGIC - Centered and fully editable */}
            <div className="space-y-2.5 text-center max-w-2xl w-full flex flex-col items-center">
              <span className="text-[8.5px] font-mono font-black text-black bg-[#39ff14]/90 px-3 py-1 rounded-full uppercase tracking-wider shadow">
                ★ Verified Artist Space ★
              </span>
              
              <textarea
                value={bandName}
                onChange={(e) => {
                  const val = e.target.value;
                  setBandName(val);
                  localStorage.setItem('distro_db_band_name', val);
                }}
                rows={2}
                className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-white font-sans text-2xl sm:text-4xl font-black text-white tracking-wider outline-none p-1 w-full text-center uppercase cursor-text resize-none overflow-hidden leading-tight max-h-[100px]"
                placeholder="ENTER BAND NAME"
                title="Click to edit band name display (splits to multiple lines if too long)"
              />
              
              <textarea
                value={bandBio}
                onChange={(e) => {
                  const val = e.target.value;
                  setBandBio(val);
                  localStorage.setItem('distro_db_band_bio', val);
                }}
                rows={4}
                className="w-full bg-transparent border border-transparent hover:border-white/10 hover:bg-black/20 focus:border-white/20 focus:bg-[#07080b]/50 text-xs sm:text-sm font-mono text-zinc-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)] leading-relaxed outline-none resize-none cursor-text p-3 rounded-xl text-center min-h-[96px]"
                placeholder="Click to type customizable band description..."
                title="Click to edit public artist description"
              />
            </div>

            {/* Glowing follower counter & Follow Simulator - Centered styling */}
            <div className="flex flex-col items-center gap-3 mt-1 relative z-10">
              <div
                className="px-5 py-2 rounded-full bg-black/85 border text-center shadow-3xl flex items-center justify-center gap-2.5"
                style={{ borderColor: `${profileAccentColor}45` }}
              >
                <span className="text-[8px] font-mono text-zinc-450 uppercase tracking-widest font-black leading-none">
                  PUBLIC FOLLOWERS
                </span>
                <div className="w-[1px] h-3.5 bg-zinc-800" />
                <span className="text-xs sm:text-sm font-mono font-black text-white flex items-center gap-1.5 leading-none">
                  <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" />
                  {simFollows.length}
                </span>
              </div>

              {/* Follower simulator trigger button moved inside card */}
              <button
                type="button"
                onClick={handleAddNewFollower}
                className="px-4 py-2 bg-black/80 hover:bg-[#39ff14]/10 hover:text-[#39ff14] border border-zinc-800 hover:border-[#39ff14]/40 text-zinc-350 rounded-xl font-mono text-[9px] font-black uppercase flex items-center gap-1.5 cursor-pointer transition duration-150 select-none shadow-md hover:shadow-[0_0_15px_rgba(57,255,20,0.15)] active:scale-[0.98]"
                title="Trigger simulated follow event inside the network"
              >
                <Users className="w-3.5 h-3.5 text-indigo-400" /> [ TRIGGER NEW FOLLOWER ]
              </button>
            </div>
            
          </div>

          {/* SPOTLIGHT PINNED COMPONENT FRAME */}
          <div className="relative z-10 mt-6 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
              <span className="text-[9px] font-mono uppercase tracking-wider text-white font-black">
                Featured Product Spotlight:
              </span>
              <span
                className="text-[10px] font-mono font-black tracking-wide"
                style={{ color: profileAccentColor }}
              >
                {featuredItem ? featuredItem.name : '[ No shop release pinned to banner spotlight ]'}
              </span>
            </div>

            {featuredItem && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-zinc-100 font-bold">
                  ${featuredItem.storefront_price.toFixed(2)}
                </span>
                <button
                  type="button"
                  onClick={() => handleSimCartAdd(featuredItem)}
                  className="px-3.5 py-1.5 bg-white text-black hover:bg-zinc-200 rounded-lg font-mono text-[8.5px] font-black uppercase transition cursor-pointer flex items-center gap-1 hover:scale-105"
                >
                  <ShoppingBag className="w-3 h-3 text-black" /> [ Secure Order ]
                </button>
              </div>
            )}
          </div>

          {/* Hidden HTML input triggers for custom updates */}
          <input type="file" accept="image/*" ref={logoInputRef} className="hidden" onChange={handleLogoUploadSim} />
          <input type="file" accept="image/*" ref={bannerInputRef} className="hidden" onChange={handleBannerUploadSim} />

        </div>

      </div>

      {/* 3. CENTRAL PANEL NAVIGATION NAVIGATION TABS */}
      <div className="grid grid-cols-2 sm:flex sm:flex-row sm:flex-wrap gap-2 border-b border-zinc-900 pb-3 w-full">
        
        {subTabMode === 'all' && (
          <button
            type="button"
            onClick={() => {
              if (onNavigateToTab) {
                onNavigateToTab('social');
              } else {
                try {
                  window.dispatchEvent(new CustomEvent('nexus:navigate-tab', { detail: 'social' }));
                } catch (e) {}
              }
            }}
            className="py-3 px-3.5 font-mono text-[10.5px] uppercase font-black tracking-wider border-2 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 text-zinc-450 border-transparent bg-transparent hover:text-white hover:bg-zinc-900/10"
          >
            <span>📰</span> Global Feed
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSubTab('music')}
          className={`py-3 px-3.5 font-mono text-[10.5px] uppercase font-black tracking-wider border-2 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeSubTab === 'music'
              ? 'text-white bg-zinc-900/40'
              : 'text-zinc-450 border-transparent bg-transparent hover:text-white hover:bg-zinc-900/10'
          }`}
          style={{ borderColor: activeSubTab === 'music' ? profileAccentColor : 'transparent' }}
        >
          <span>🎵</span> Our Music
        </button>

        {subTabMode === 'all' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('alliances')}
            className={`py-3 px-3.5 font-mono text-[10.5px] uppercase font-black tracking-wider border-2 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
              activeSubTab === 'alliances'
                ? 'text-white bg-zinc-900/40'
                : 'text-zinc-450 border-transparent bg-transparent hover:text-white hover:bg-zinc-900/10'
            }`}
            style={{ borderColor: activeSubTab === 'alliances' ? profileAccentColor : 'transparent' }}
          >
            <span>🤝</span> Band Alliances ({otherBands.filter(b=>b.followedByUs).length})
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveSubTab('merch')}
          className={`py-3 px-3.5 font-mono text-[10.5px] uppercase font-black tracking-wider border-2 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeSubTab === 'merch'
              ? 'text-white bg-zinc-900/40'
              : 'text-[#39ff14]/80 border-transparent bg-transparent hover:text-white hover:bg-zinc-900/10'
          }`}
          style={{ borderColor: activeSubTab === 'merch' ? profileAccentColor : 'transparent' }}
        >
          <span>🛍️</span> Our Merch Shop
        </button>

        {subTabMode === 'all' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('fans')}
            className={`py-3 px-3.5 font-mono text-[10.5px] uppercase font-black tracking-wider border-2 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
              activeSubTab === 'fans'
                ? 'text-white bg-zinc-900/40'
                : 'text-zinc-450 border-transparent bg-transparent hover:text-white hover:bg-zinc-900/10'
            }`}
            style={{ borderColor: activeSubTab === 'fans' ? profileAccentColor : 'transparent' }}
          >
            <span>❤️</span> Followers Roster ({simFollows.length})
          </button>
        )}

        {subTabMode === 'all' && (
          <button
            type="button"
            onClick={() => setActiveSubTab('customizer')}
            className={`py-3 px-3.5 font-mono text-[10.5px] uppercase font-black tracking-wider border-2 rounded-xl transition-all duration-200 cursor-pointer text-center flex items-center justify-center gap-2 ${
              activeSubTab === 'customizer'
                ? 'text-white bg-zinc-900/40'
                : 'text-zinc-450 border-transparent bg-transparent hover:text-white hover:bg-zinc-900/10'
            }`}
            style={{ borderColor: activeSubTab === 'customizer' ? profileAccentColor : 'transparent' }}
          >
            <span>🎨</span> Style Designer
          </button>
        )}

      </div>

      {/* 4. TAB CONTENTS LOGIC */}
      <div className="w-full max-w-5xl mx-auto gap-6 items-start">
        
        {/* TAB CONTENTS PANELS CONTAINER */}
        <div className="w-full space-y-6">

          {/* BAND TO BAND ALLIANCES & MUSIC NETWORK */}
          {activeSubTab === 'alliances' && (
            <div className="space-y-6 animate-fadeIn pb-12">
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl text-left space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                  <span className="text-xl">🤝</span>
                  <div>
                    <h3 className="text-white font-sans font-black text-sm uppercase tracking-wider">
                      Global Alliance & Social Feed
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      ESTABLISH CONNECTIONS WITH CO-ARTISTS AND RECORD LABELS IN THE NETWORK
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                  Connect with peer artists or pitch directly to verified record labels. This section bridges social feeds, group profiles, and inbound signing opportunities.
                </p>
              </div>

              {/* Alliance Type Selector */}
              <div className="flex border-b border-zinc-900 justify-center gap-1 font-mono text-xs pb-1">
                <button
                  type="button"
                  onClick={() => setAllianceMode('bands')}
                  className={`px-5 py-2.5 border-b-2 font-black uppercase tracking-wider transition-all cursor-pointer ${
                    allianceMode === 'bands'
                      ? 'border-[#39ff14] text-[#39ff14]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                  style={{ borderBottomColor: allianceMode === 'bands' ? profileAccentColor : 'transparent', color: allianceMode === 'bands' ? profileAccentColor : '' }}
                >
                  🤝 Allied Bands ({otherBands.length})
                </button>
                <button
                  type="button"
                  onClick={() => setAllianceMode('labels')}
                  className={`px-5 py-2.5 border-b-2 font-black uppercase tracking-wider transition-all cursor-pointer ${
                    allianceMode === 'labels'
                      ? 'border-[#39ff14] text-[#39ff14]'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                  style={{ borderBottomColor: allianceMode === 'labels' ? profileAccentColor : 'transparent', color: allianceMode === 'labels' ? profileAccentColor : '' }}
                >
                  🏢 Record Labels
                </button>
              </div>

              {allianceMode === 'bands' && (
                <div className="space-y-6 text-left">
                  {otherBands.map((band, idx) => (
                  <div key={`${band.id}-${idx}`} className="bg-zinc-950/90 border border-zinc-900 rounded-3.5xl p-6 shadow-2xl relative overflow-hidden transition duration-300 hover:border-zinc-805 text-left space-y-5">
                    
                    {/* Top Header Card */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/50 pb-4">
                      <div className="flex items-center gap-4">
                        <img 
                          src={band.logo} 
                          alt={band.name} 
                          className="w-12 h-12 rounded-2xl object-cover border border-zinc-800 shrink-0" 
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-sm font-sans font-black text-white">{band.name}</h4>
                          <span className="inline-block mt-0.5 px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px] uppercase tracking-wider rounded font-medium">
                            {band.genre}
                          </span>
                        </div>
                      </div>

                      {/* Follow Toggle Button */}
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = otherBands.map(b => {
                              if (b.id === band.id) {
                                const nextFollow = !b.followedByUs;
                                return {
                                  ...b,
                                  followedByUs: nextFollow,
                                  followerCount: nextFollow ? b.followerCount + 1 : b.followerCount - 1
                                };
                              }
                              return b;
                            });
                            setOtherBands(updated);
                            triggerNotification?.(band.followedByUs ? `Unfollowed "${band.name}"` : `Successfully established alliance with "${band.name}"! 🛡️`);
                          }}
                          className={`w-full sm:w-auto px-4 py-2 font-mono text-[10px] font-black uppercase rounded-xl transition duration-150 cursor-pointer text-center ${
                            band.followedByUs 
                              ? 'bg-[#39ff14]/10 border border-[#39ff14]/40 text-[#39ff14] hover:bg-[#39ff14]/20'
                              : 'bg-zinc-900 border border-zinc-800 text-zinc-350 hover:bg-zinc-800 hover:text-white'
                          }`}
                        >
                          {band.followedByUs ? '✓ ALLIED CONTEXT' : '🤝 INITIATE ALLIANCE'}
                        </button>
                      </div>
                    </div>

                    {/* Band Details Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans leading-relaxed text-zinc-400">
                      <div>
                        <span className="block text-[8.5px] font-mono text-zinc-650 uppercase font-black tracking-widest mb-1">ARTIST BIOGRAPHY</span>
                        <p className="text-[10.5px] text-zinc-300">{band.bio}</p>
                      </div>
                      <div className="flex md:justify-end gap-6 text-left">
                        <div>
                          <span className="block text-[8.5px] font-mono text-zinc-650 uppercase font-black tracking-widest mb-1">TOTAL FOLLOWERS</span>
                          <span className="font-mono text-base font-bold text-white">{band.followerCount.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="block text-[8.5px] font-mono text-zinc-650 uppercase font-black tracking-widest mb-1">NETWORK STATUS</span>
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-black text-[#39ff14] mt-1.5 animate-pulse">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#39ff14]" />
                            SYNC ACTIVE
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Band Feed Posts Block */}
                    <div className="space-y-3 bg-black/45 p-4 rounded-2.5xl border border-zinc-900">
                      <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                        <span className="text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-black">LATEST BULLETIN FROM THEIR STREAM</span>
                        <span className="text-[8.5px] font-mono text-zinc-600 font-bold">{band.posts[0]?.timestamp}</span>
                      </div>

                      {band.posts.map((post: any, idx) => (
                        <div key={`${post.id}-${idx}`} className="space-y-3">
                          <p className="text-[11px] text-zinc-250 leading-relaxed font-sans select-text">
                            {post.message}
                          </p>

                          {/* Like row */}
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                const updated = otherBands.map(b => {
                                  if (b.id === band.id) {
                                    return {
                                      ...b,
                                      posts: b.posts.map((p: any) => {
                                        if (p.id === post.id) {
                                          const liked = !p.userLiked;
                                          return { ...p, userLiked: liked, likes: liked ? p.likes + 1 : p.likes - 1 };
                                        }
                                        return p;
                                      })
                                    };
                                  }
                                  return b;
                                });
                                setOtherBands(updated);
                                triggerNotification?.(post.userLiked ? 'Removed like' : 'Liked alliance partner bulletin! ❤️');
                              }}
                              className={`flex items-center gap-1.5 text-[9px] font-mono font-bold py-1 px-2.5 rounded-lg border transition ${
                                post.userLiked 
                                  ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                                  : 'bg-zinc-900/80 border-transparent text-zinc-500 hover:text-zinc-350'
                              }`}
                            >
                              <span>{post.userLiked ? '❤️' : '🤍'}</span>
                              <span>{post.likes} LIKES</span>
                            </button>
                          </div>

                          {/* Comment Sub-section */}
                          <div className="space-y-2 border-t border-zinc-900/60 pt-3">
                            <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest font-bold">Comments Stream</span>
                            
                            {post.comments && post.comments.length > 0 && (
                              <div className="space-y-1.5 select-text">
                                {post.comments.map((c: any, cIdx) => (
                                  <div key={`${c.id}-${cIdx}`} className="text-[9px] bg-black/20 p-2 rounded-lg leading-normal">
                                    <span className="font-mono text-zinc-450 font-black">@{c.username}</span>:{' '}
                                    <span className="text-zinc-300 font-sans">{c.text}</span>
                                    <span className="text-[7.5px] text-zinc-650 font-mono block mt-0.5">{c.time}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Comment input form */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder={`Write a reply to @${band.name}...`}
                                value={activeBandCommentInput[band.id] || ''}
                                onChange={(e) => setActiveBandCommentInput(prev => ({ ...prev, [band.id]: e.target.value }))}
                                className="bg-zinc-950 border border-zinc-900 px-3 py-1 text-[9.5px] font-sans text-white rounded-lg focus:outline-none focus:border-[#39ff14] flex-grow font-mono"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    const text = activeBandCommentInput[band.id]?.trim();
                                    if (!text) return;
                                    const updated = otherBands.map(b => {
                                      if (b.id === band.id) {
                                        return {
                                          ...b,
                                          posts: b.posts.map((p: any) => {
                                            if (p.id === post.id) {
                                              return {
                                                ...p,
                                                comments: [
                                                  ...(p.comments || []),
                                                  { id: 'obc_' + Date.now(), username: 'managed_artist_sim', text, time: 'Just now' }
                                                ]
                                              };
                                            }
                                            return p;
                                          })
                                        };
                                      }
                                      return b;
                                    });
                                    setOtherBands(updated);
                                    setActiveBandCommentInput(prev => ({ ...prev, [band.id]: '' }));
                                    triggerNotification?.("Reply compiled and published to alliance timeline! 📡");
                                  }
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const text = activeBandCommentInput[band.id]?.trim();
                                  if (!text) return;
                                  const updated = otherBands.map(b => {
                                    if (b.id === band.id) {
                                      return {
                                        ...b,
                                        posts: b.posts.map((p: any) => {
                                          if (p.id === post.id) {
                                            return {
                                              ...p,
                                              comments: [
                                                ...(p.comments || []),
                                                { id: 'obc_' + Date.now(), username: 'managed_artist_sim', text, time: 'Just now' }
                                              ]
                                            };
                                          }
                                          return p;
                                        })
                                      };
                                    }
                                    return b;
                                  });
                                  setOtherBands(updated);
                                  setActiveBandCommentInput(prev => ({ ...prev, [band.id]: '' }));
                                  triggerNotification?.("Reply compiled and published to alliance timeline! 📡");
                                }}
                                className="px-3 bg-zinc-900 hover:bg-[#39ff14] hover:text-black hover:border-transparent border border-zinc-800 text-[9px] font-mono font-black uppercase rounded-lg text-zinc-350 transition-all cursor-pointer"
                              >
                                SEND
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Merch and Ticket Store Catalog for Allied Band */}
                    <div className="space-y-3">
                      <span className="block text-[8.5px] font-mono text-zinc-500 uppercase tracking-widest font-black text-left">
                        AVAILABLE PEER MERCHANDISE & TICKET CODES
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {band.merch.map((item: any, idx) => (
                          <div key={`${item.id}-${idx}`} className="bg-zinc-950 border border-zinc-900 rounded-2.5xl p-3 flex items-center justify-between gap-3 text-left">
                            <div className="flex items-center gap-3 min-w-0">
                              <img 
                                src={item.image} 
                                alt={item?.name} 
                                className="w-10 h-10 object-cover rounded-lg border border-zinc-900 shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div className="min-w-0">
                                <span className="block text-[10px] font-sans font-bold text-zinc-200 truncate pr-2">
                                  {item?.name}
                                </span>
                                <span className="block text-[9px] font-mono text-zinc-550 mt-0.5">
                                  {item?.name.includes('TICKET') ? '🎫 ENTRY TICKET' : '👕 PIECE'}
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                handleSimCartAdd({
                                  id: item.id,
                                  name: `${band.name.toUpperCase()} - ${item?.name}`,
                                  storefront_price: item.price,
                                  public_description: `Simulated checkout support node for companion group "${band.name}".`,
                                  visibility_status: true
                                } as any);
                                triggerNotification?.(`Staged peer item "${item?.name}" directly in local sales queue! 💸`);
                              }}
                              className="px-2.5 py-1.5 bg-zinc-905 hover:bg-[#39ff14]/20 text-zinc-300 hover:text-[#39ff14] border border-zinc-850 hover:border-[#39ff14]/30 transition duration-150 font-mono text-[9px] font-bold uppercase rounded-lg shrink-0 cursor-pointer flex items-center gap-1"
                            >
                              <span>${item.price.toFixed(2)}</span>
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>
                ))}
              </div>
              )}

              {/* RECORD LABELS INTERACTION VIEW */}
              {allianceMode === 'labels' && (
                <div className="space-y-6 text-left font-mono">
                  {/* Search and Filters */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="relative w-full md:max-w-md">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">🔍</span>
                      <input
                        type="text"
                        placeholder="SEARCH VERIFIED RECORD LABELS..."
                        value={labelSearchText}
                        onChange={(e) => setLabelSearchText(e.target.value)}
                        className="w-full bg-black border border-zinc-900 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-655 focus:outline-none focus:border-[#39ff14] transition"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                      [ STAGE CHANNEL SYNC ON DEMAND ]
                    </span>
                  </div>

                  {/* Filter Labels Stream */}
                  {(() => {
                    const matchesSearch = 
                      syncedLabelProfile.name.toLowerCase().includes(labelSearchText.toLowerCase()) ||
                      syncedLabelProfile.handle.toLowerCase().includes(labelSearchText.toLowerCase());

                    if (!matchesSearch) {
                      return (
                        <div className="p-16 text-center border border-zinc-900 bg-zinc-950/40 rounded-3xl text-zinc-500 text-xs">
                          NO SIGNALS MATCHED SEARCH PARAMETERS.
                        </div>
                      );
                    }

                    return (
                      <div className="bg-zinc-950 border border-zinc-900 rounded-3.5xl p-6 shadow-2xl relative overflow-hidden space-y-5">
                        {/* Custom decorative header background */}
                        <div className="h-1 bg-gradient-to-r from-cyan-500 via-[#39ff14] to-purple-600 absolute top-0 left-0 right-0" />

                        {/* Profile Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900/50 pb-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-black border rounded-2xl flex items-center justify-center font-black text-lg shadow-lg" style={{ borderColor: profileAccentColor, color: profileAccentColor }}>
                              {syncedLabelProfile.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-sm font-sans font-black text-white">{syncedLabelProfile.name}</h4>
                                <span className="px-1.5 py-0.5 bg-cyan-950/40 border border-cyan-800 text-[7px] font-black uppercase text-cyan-400 rounded">
                                  VERIFIED LABEL HQ
                                </span>
                              </div>
                              <span className="text-[10px] text-zinc-500 block mt-0.5">
                                @{syncedLabelProfile.handle}
                              </span>
                            </div>
                          </div>

                          {/* Follow Button */}
                          <button
                            type="button"
                            onClick={() => {
                              setIsLabelFollowed(!isLabelFollowed);
                              triggerNotification?.(isLabelFollowed ? "Unfollowed label stream." : "Established direct social feed sync with Record Label HQ! 📡");
                            }}
                            className="px-4 py-2 font-mono text-[10px] font-black uppercase rounded-xl transition duration-150 cursor-pointer text-center"
                            style={{
                              backgroundColor: isLabelFollowed ? `${profileAccentColor}15` : 'rgba(24, 24, 27, 0.9)',
                              border: `1px solid ${isLabelFollowed ? profileAccentColor : '#27272a'}`,
                              color: isLabelFollowed ? profileAccentColor : '#d4d4d8'
                            }}
                          >
                            {isLabelFollowed ? '✓ SYNCED FEED' : '⚡ SYNC SOCIAL FEED'}
                          </button>
                        </div>

                        {/* Bio / Manifesto */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs font-sans leading-relaxed text-zinc-400">
                          <div>
                            <span className="block text-[8.5px] font-mono text-zinc-650 uppercase font-black tracking-widest mb-1">MISSION & PROFILES</span>
                            <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">{syncedLabelProfile.bio}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-left font-mono">
                            <div>
                              <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-wider mb-0.5">LOCATION</span>
                              <span className="text-white text-xs block font-bold">{syncedLabelProfile.location || 'CHICAGO, IL'}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-wider mb-0.5">ESTABLISHED</span>
                              <span className="text-white text-xs block font-bold">{syncedLabelProfile.founded || '2026'}</span>
                            </div>
                            <div>
                              <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-wider mb-0.5">WEBSITE</span>
                              <a href={syncedLabelProfile.website} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline text-[10.5px] block truncate font-bold">{syncedLabelProfile.website}</a>
                            </div>
                            <div>
                              <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-wider mb-0.5">A&R CONTACT</span>
                              <span className="text-zinc-400 text-[10px] block truncate">{syncedLabelProfile.contact}</span>
                            </div>
                          </div>
                        </div>

                        {/* Inquiries / EPK pitch status */}
                        <div className="p-4 bg-black/45 border border-zinc-900 rounded-2.5xl flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div>
                            <span className="text-white font-bold block uppercase text-[11px]">Inbound Submissions Portal</span>
                            <span className="text-[9px] text-zinc-550 block mt-0.5 font-mono uppercase">
                              {syncedLabelProfile.acceptsInquiries 
                                ? '🟢 ACCEPTING EPK DOSSIERS & DIRECT DEMO PITCHES' 
                                : '🔴 INBOUND ROSTER INTAKE IS CLOSED CURRENTLY'}
                            </span>
                          </div>
                          
                          <div className="flex gap-2.5">
                            <button
                              type="button"
                              onClick={() => {
                                setShowDmComposer(!showDmComposer);
                                setShowEpkComposer(false);
                              }}
                              className="px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-bold text-[10px] uppercase rounded-lg border border-zinc-800 transition active:scale-95 cursor-pointer"
                            >
                              💬 DIRECT MESSAGE
                            </button>
                            {syncedLabelProfile.acceptsInquiries && (
                              <button
                                type="button"
                                onClick={() => {
                                  setShowEpkComposer(!showEpkComposer);
                                  setShowDmComposer(false);
                                }}
                                className="px-3.5 py-1.5 text-black font-black text-[10px] uppercase rounded-lg transition active:scale-95 cursor-pointer border-none"
                                style={{ backgroundColor: profileAccentColor }}
                              >
                                💿 SUBMIT EPK
                              </button>
                            )}
                          </div>
                        </div>

                        {/* DM Composer Form Section */}
                        {showDmComposer && (
                          <div className="p-5 bg-zinc-950/60 border border-zinc-900 rounded-2.5xl space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-zinc-900/60 pb-2">
                              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">[ DM TRANSMISSION COMPOSER ]</span>
                              <button type="button" onClick={() => setShowDmComposer(false)} className="text-[9px] text-zinc-500 hover:text-white uppercase font-bold">CANCEL</button>
                            </div>
                            <textarea
                              rows={3}
                              placeholder="Type private direct message to Record Label HQ..."
                              value={dmText}
                              onChange={(e) => setDmText(e.target.value)}
                              className="w-full bg-black border border-zinc-900 focus:border-[#39ff14] rounded-xl p-3 text-xs text-white focus:outline-none leading-relaxed resize-none font-sans"
                            />
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="text-zinc-500 font-mono">SENDER IDENTIFIER: {bandName.toUpperCase()}</span>
                              <button
                                type="button"
                                onClick={handleSendLabelDm}
                                disabled={!dmText.trim()}
                                className={`px-4 py-2 font-mono text-[9px] font-black uppercase rounded-lg transition active:scale-95 ${
                                  dmText.trim() 
                                    ? 'text-black cursor-pointer border-none' 
                                    : 'bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed'
                                }`}
                                style={{ backgroundColor: dmText.trim() ? profileAccentColor : '' }}
                              >
                                [ SEND SIGNAL ]
                              </button>
                            </div>
                          </div>
                        )}

                        {/* EPK Submission Composer Section */}
                        {showEpkComposer && (
                          <div className="p-5 bg-zinc-950/60 border border-zinc-900 rounded-2.5xl space-y-4 animate-fadeIn">
                            <div className="flex justify-between items-center border-b border-zinc-900/60 pb-2">
                              <span className="text-[9px] text-zinc-500 font-black uppercase tracking-wider">[ DIGITAL EPK SIGNING DOSSIER ]</span>
                              <button type="button" onClick={() => setShowEpkComposer(false)} className="text-[9px] text-zinc-500 hover:text-white uppercase font-bold">CANCEL</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div className="space-y-1">
                                <label className="text-zinc-500 font-bold block text-[9px] uppercase">EPK Genre Tags:</label>
                                <input
                                  type="text"
                                  value={epkGenre}
                                  onChange={(e) => setEpkGenre(e.target.value)}
                                  placeholder="e.g. SLUDGE DOOM / DISSONANT DEATH"
                                  className="w-full bg-black border border-zinc-900 focus:border-[#39ff14] rounded px-3 py-1.5 text-white text-[11px] focus:outline-none"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-zinc-500 font-bold block text-[9px] uppercase">Audio / EPK Demo Link:</label>
                                <input
                                  type="text"
                                  value={epkDemoLink}
                                  onChange={(e) => setEpkDemoLink(e.target.value)}
                                  placeholder="URL link to streaming tracks"
                                  className="w-full bg-black border border-zinc-900 focus:border-[#39ff14] rounded px-3 py-1.5 text-white text-[11px] focus:outline-none"
                                />
                              </div>
                            </div>

                            <div className="space-y-1 text-xs">
                              <label className="text-zinc-500 font-bold block text-[9px] uppercase">Band Core Pitch & Bio Preview:</label>
                              <textarea
                                rows={2}
                                value={epkPitch}
                                onChange={(e) => setEpkPitch(e.target.value)}
                                placeholder="Core short pitch outlining group's releases history..."
                                className="w-full bg-black border border-zinc-900 focus:border-[#39ff14] rounded p-3 text-white text-[11px] focus:outline-none leading-relaxed resize-none font-sans"
                              />
                            </div>

                            <div className="space-y-1 text-xs">
                              <label className="text-zinc-500 font-bold block text-[9px] uppercase">Inbound Accompanying Message:</label>
                              <textarea
                                rows={3}
                                value={epkMessage}
                                onChange={(e) => setEpkMessage(e.target.value)}
                                placeholder="Type custom proposal text to the A&R scouts..."
                                className="w-full bg-black border border-zinc-900 focus:border-[#39ff14] rounded p-3 text-white text-[11px] focus:outline-none leading-relaxed resize-none font-sans"
                              />
                            </div>

                            <div className="flex justify-end text-[10px]">
                              <button
                                type="button"
                                onClick={handleSendLabelEpk}
                                disabled={!epkMessage.trim()}
                                className={`px-5 py-2.5 font-mono text-[9px] font-black uppercase rounded-lg transition active:scale-95 ${
                                  epkMessage.trim() 
                                    ? 'text-black cursor-pointer border-none font-black shadow-lg shadow-black/40' 
                                    : 'bg-zinc-900 text-zinc-600 border border-zinc-850 cursor-not-allowed'
                                }`}
                                style={{ backgroundColor: epkMessage.trim() ? profileAccentColor : '' }}
                              >
                                [ TRANSMIT FULL EPK DOSSIER ]
                              </button>
                            </div>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </div>
              )}

            </div>
          )}

          {/* OUR MUSIC MEDIA HUB TAB */}
          {activeSubTab === 'music' && (
            <div className="space-y-6 animate-fadeIn pb-12 text-left">
              
              {/* INTRO HERO GRID */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                  <span className="text-xl">🎵</span>
                  <div>
                    <h3 className="text-white font-sans font-black text-sm uppercase tracking-wider">
                      Band Audio Station & Video Catalog
                    </h3>
                    <p className="text-[10px] text-zinc-500 font-mono mt-0.5">
                      REAL-TIME DECENTRALIZED STREAMING MATRIX & INTEGRATED MEDIA PLAYERS
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-zinc-300 font-sans leading-relaxed">
                  Welcome to our sovereign media stream. Stream our core discography of direct uploaded lossless tapes or play our linked visual broadcasts directly inside this community console. Use the interactive loaders below to inject custom audio stems or catalog files.
                </p>
              </div>

              {/* BANDCAMP-STYLE SOVEREIGN DIGITAL RELEASE CARD */}
              <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left space-y-4">
                {/* Visual accent background overlay */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#39ff14]/5 rounded-full blur-3xl pointer-events-none" />
                
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Left: Album cover with sticker style */}
                  <div className="w-full sm:w-44 h-44 bg-cover bg-center rounded-2xl border border-zinc-800 shrink-0 shadow-2xl relative overflow-hidden group flex items-end"
                       style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=250&auto=format&fit=crop')` }}>
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    
                    {/* Retro Band sticker style */}
                    <div className="absolute top-3 left-3 bg-[#39ff14] text-black font-mono font-black text-[8px] px-1.5 py-0.5 uppercase tracking-widest rounded shadow-md transform -rotate-6">
                      SOVEREIGN
                    </div>

                    <div className="p-3 relative z-10 w-full">
                      <span className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">LP ALBUM FORMAT</span>
                      <span className="text-[11px] font-mono font-black text-white uppercase tracking-wider block mt-0.5 truncate">
                        VOLUME 1 ARCHIVES
                      </span>
                    </div>
                  </div>

                  {/* Right: Album Release info and interactive checkout Node */}
                  <div className="flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[8px] font-mono font-black tracking-widest text-[#39ff14] bg-[#39ff14]/10 border border-[#39ff14]/20 px-2 py-0.5 rounded uppercase">
                          HIGH-FIDELITY DIGITAL RELEASE
                        </span>
                        <span className="text-[9px] font-mono text-zinc-550">
                          Released June 2026
                        </span>
                      </div>
                      
                      <h3 className="text-white font-sans font-black text-lg uppercase tracking-wide">
                        {bandName}: Decay Matrix & Residual Noise Stem Archives
                      </h3>
                      
                      <p className="text-[11px] font-sans text-zinc-400 leading-relaxed mt-1.5 max-w-xl">
                        Gain entry to the absolute, uncompromised lossless sound system. This premium digital download includes state of the art soundboards, master files, and metadata templates. Every copy supports our sovereign live operations directly.
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 pt-3 border-t border-zinc-900">
                        <div className="font-mono">
                          <span className="text-[8px] text-zinc-650 uppercase block font-black">Digital Price</span>
                          <span className="text-white text-base font-black tracking-wider">$9.99 USD</span>
                        </div>
                        <div className="font-mono text-left">
                          <span className="text-[8px] text-zinc-650 uppercase block font-black">Release Quality</span>
                          <span className="text-zinc-400 text-xs font-bold block uppercase mt-0.5">Lossless WAV / FLAC + MP3 Bundle</span>
                        </div>
                      </div>
                    </div>

                    {/* Bandcamp-Style interactive pricing button */}
                    <div className="pt-1">
                      {!isAlbumPurchased ? (
                        <div className="space-y-2">
                          <button
                            type="button"
                            onClick={() => {
                              // Simulate checkout & purchase
                              handleSimCartAdd({
                                id: 'digital_album_release',
                                name: `${bandName} - Decay Matrix digital album download`,
                                storefront_price: 9.99,
                                public_description: 'Lossless stems and high-fidelity tracks packaging license',
                                visibility_status: true
                              } as any);
                              
                              setIsAlbumPurchased(true);
                              localStorage.setItem('distro_db_album_purchased', 'true');
                            }}
                            className="w-full sm:w-auto px-6 py-3 bg-[#39ff14] hover:bg-[#32dd10] text-black font-mono text-xs font-black uppercase rounded-2xl transition-all shadow-[0_0_20px_rgba(57,255,20,0.25)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                          >
                            <span>🛒 BUY DIGITAL ALBUM ($9.99 USD)</span>
                          </button>
                          <p className="text-[9px] font-mono text-zinc-500">
                            * Preview tracks for free in the music client. Buy the full album to unlock physical high definition stem downloads and printable liner assets!
                          </p>
                        </div>
                      ) : (
                        <div className="border border-[#39ff14]/30 bg-[#39ff14]/5 rounded-2xl p-4 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-900/60 pb-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[#39ff14] font-black">✓</span>
                              <span className="text-xs font-mono font-black text-white uppercase tracking-wider">
                                YOU OWN THIS SOVEREIGN RELEASE!
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAlbumPurchased(false);
                                localStorage.removeItem('distro_db_album_purchased');
                                triggerNotification?.("Demo Node reset: Digital Album lock engaged.");
                              }}
                              className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 hover:border-red-500/40 hover:text-red-500 rounded text-[8px] font-mono text-zinc-500 uppercase font-black transition cursor-pointer"
                              title="Reset state to buy again"
                            >
                              Reset Purchase State (Demo Selection)
                            </button>
                          </div>

                          <div className="space-y-3">
                            <span className="block text-[9px] font-mono text-zinc-400 uppercase tracking-tight">
                              Choose High-Quality format packages for immediate virtual delivery:
                            </span>

                            <div className="flex flex-wrap items-center gap-2">
                              {['FLAC lossless', 'WAV direct', 'MP3 extreme (320k)'].map((fmt, idx) => (
                                <button
                                  key={`${fmt}-${idx}`}
                                  type="button"
                                  disabled={isDigitalDownloading}
                                  onClick={() => {
                                    if (isDigitalDownloading) return;
                                    setIsDigitalDownloading(true);
                                    setDigitalDownloadProgress(10);
                                    
                                    // Trigger progress steps
                                    let progress = 10;
                                    const interval = setInterval(() => {
                                      progress += 25;
                                      if (progress >= 100) {
                                        setDigitalDownloadProgress(100);
                                        clearInterval(interval);
                                        setTimeout(() => {
                                          setIsDigitalDownloading(false);
                                          setDigitalDownloadProgress(0);
                                          triggerNotification?.(`High-Resolution ${fmt.toUpperCase()} package deployed to system! 💾`);
                                          
                                          // Generate actual TXT file download
                                          const textContent = `
========================================
${bandName.toUpperCase()} - Decay Matrix Sovereign Music Package
========================================
Format: ${fmt.toUpperCase()} Lossless Audio Archive
Security License Token: DECAY-${Math.random().toString(36).substring(2, 10).toUpperCase()}

Thank you for your Direct-to-Artist purchase support! 
This virtual download represents the full digital album release package.

Track listing packaged:
${uploadedTracks.map((t, i) => `${i + 1}. ${t.title} (${t.duration})`).join('\n')}

Distributed via independent local sound networks and decentralized community terminals.
Keep it heavy, keep it loud!
========================================
`;
                                          const blob = new Blob([textContent], { type: 'text/plain' });
                                          const url = URL.createObjectURL(blob);
                                          const link = document.createElement('a');
                                          link.href = url;
                                          link.download = `${bandName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_lossless_release.txt`;
                                          document.body.appendChild(link);
                                          link.click();
                                          document.body.removeChild(link);
                                        }, 400);
                                      } else {
                                        setDigitalDownloadProgress(progress);
                                      }
                                    }, 400);
                                  }}
                                  className="px-3 py-1.5 bg-zinc-900 hover:bg-[#39ff14]/15 border border-zinc-800 hover:border-[#39ff14]/40 text-white hover:text-[#39ff14] text-[10px] font-mono font-bold uppercase rounded-xl transition cursor-pointer disabled:opacity-50"
                                >
                                  📥 DOWNLOAD {fmt.toUpperCase()}
                                </button>
                              ))}
                            </div>

                            {/* Download feedback progress bar */}
                            {isDigitalDownloading && (
                              <div className="space-y-1.5 animate-fadeIn">
                                <div className="flex items-center justify-between text-[8px] font-mono">
                                  <span className="text-[#39ff14] font-black animate-pulse uppercase tracking-wider">
                                    ⚙️ ASSEMBLING LOSSLESS DIGITAL PACKAGE...
                                  </span>
                                  <span className="text-[#39ff14]">{digitalDownloadProgress}%</span>
                                </div>
                                <div className="w-full h-1 bg-zinc-900 rounded-lg overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-emerald-500 to-[#39ff14] transition-all duration-300"
                                    style={{ width: `${digitalDownloadProgress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* TWO COLUMN GRID: LEFT: MEDIA PLAYER & AUDIO TRACKS, RIGHT: LINKED BROADCASTS (YOUTUBE) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                
                {/* COLUMN 1: LOSSLESS AUDIO CONTROLLER - span 7 */}
                <div className="md:col-span-7 space-y-6">
                  
                  {/* MASTER PLAYER INTERACTIVE SHELL */}
                  <div className="bg-black/80 border-2 rounded-3xl p-6 relative overflow-hidden shadow-2xl flex flex-col justify-between"
                       style={{ borderColor: profileAccentColor }}>
                    
                    {/* Background Subtle Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-950/20 via-zinc-950/40 to-black pointer-events-none" />
                    
                    {/* Track info core */}
                    <div className="relative z-10 flex gap-4 items-center mb-6">
                      {/* Album Art Artificer */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-cover bg-center rounded-xl border border-zinc-850 shrink-0 shadow-lg flex items-center justify-center relative group"
                           style={{ backgroundImage: `url('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=250&auto=format&fit=crop')` }}>
                        <div className="absolute inset-0 bg-black/40 rounded-xl" />
                        <Music className={`w-6 h-6 text-white relative z-10 ${musicIsPlaying ? 'animate-bounce' : 'opacity-80'}`} />
                      </div>

                      {/* Title details */}
                      <div className="min-w-0 flex-grow">
                        <span className="px-2 py-0.5 rounded bg-[#39ff14]/10 border border-[#39ff14]/30 text-[#39ff14] text-[8px] font-mono font-black uppercase tracking-widest block w-fit mb-1.5">
                          NOW PLAYING LIVE
                        </span>
                        <h4 className="text-white text-sm sm:text-base font-sans font-black tracking-wide truncate">
                          {uploadedTracks[currentTrackIndex]?.title || '[ No track selected ]'}
                        </h4>
                        <span className="text-[10px] font-mono text-zinc-450 uppercase block mt-1">
                          Managed sovereignty release // {uploadedTracks[currentTrackIndex]?.fileType?.toUpperCase() || 'Lossless'} Stream
                        </span>
                      </div>
                    </div>

                    {/* Progress Slider seekbar */}
                    <div className="relative z-10 space-y-2 mb-4">
                      <div className="flex items-center justify-between text-[9px] font-mono text-zinc-500">
                        <span>{formatTrackTime(musicProgress)}</span>
                        <span>{formatTrackTime(musicDuration || 270)}</span>
                      </div>
                      
                      <input 
                        type="range"
                        min={0}
                        max={musicDuration || 100}
                        value={musicProgress}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setMusicProgress(val);
                          if (audioPlayerRef.current) {
                            audioPlayerRef.current.currentTime = val;
                          }
                        }}
                        className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
                      />
                    </div>

                    {/* Controls Row */}
                    <div className="relative z-10 flex items-center justify-between gap-4 border-t border-zinc-900/60 pt-4">
                      
                      {/* Prev block */}
                      <button
                        type="button"
                        onClick={() => {
                          if (uploadedTracks.length === 0) return;
                          const nextIdx = (currentTrackIndex - 1 + uploadedTracks.length) % uploadedTracks.length;
                          selectTrackToPlay(nextIdx);
                        }}
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-855 hover:border-zinc-800 text-zinc-350 hover:text-white transition cursor-pointer"
                        title="Previous Tape Track"
                      >
                        <SkipBack className="w-4 h-4" />
                      </button>

                      {/* Main Play Toggle Button */}
                      <button
                        type="button"
                        onClick={toggleMusicPlay}
                        className="p-4 rounded-full bg-[#39ff14] hover:bg-[#32dd10] text-black transition transform active:scale-95 cursor-pointer shadow-lg flex items-center justify-center shrink-0"
                        title={musicIsPlaying ? 'Mute/Pause Broadcast' : 'Deploy Audio Stream'}
                      >
                        {musicIsPlaying ? (
                          <Pause className="w-5 h-5 fill-black text-black" />
                        ) : (
                          <Play className="w-5 h-5 fill-black text-black ml-0.5" />
                        )}
                      </button>

                      {/* Next block */}
                      <button
                        type="button"
                        onClick={() => {
                          if (uploadedTracks.length === 0) return;
                          const nextIdx = (currentTrackIndex + 1) % uploadedTracks.length;
                          selectTrackToPlay(nextIdx);
                        }}
                        className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-855 hover:border-zinc-800 text-zinc-350 hover:text-white transition cursor-pointer"
                        title="Skip to Next Track"
                      >
                        <SkipForward className="w-4 h-4" />
                      </button>

                      <div className="w-[1px] h-6 bg-zinc-805" />

                      {/* Volume Adjuster */}
                      <div className="flex items-center gap-2 group">
                        <Volume2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-[#39ff14]" />
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={musicVolume}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setMusicVolume(val);
                            if (audioPlayerRef.current) {
                              audioPlayerRef.current.volume = val;
                            }
                          }}
                          className="w-16 sm:w-20 h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
                          title="Volume Fader"
                        />
                      </div>

                    </div>

                    {/* Local Audio HTML Core (Synchronized visually) */}
                    <audio 
                      ref={audioPlayerRef} 
                      onTimeUpdate={handleAudioTimeUpdate}
                      onLoadedMetadata={handleAudioLoadedMetadata}
                      onEnded={handleAudioEnded}
                      className="hidden"
                    />

                  </div>

                  {/* TRACK DISCOGRAPHY LIST */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl text-left space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-900/60 pb-3">
                      <span className="text-xs font-mono font-black text-white uppercase tracking-wider">
                        Lossless Track Catalog ({uploadedTracks.length})
                      </span>

                      {/* Hidden File Upload input for Mp3/Wav */}
                      <div>
                        <input 
                          type="file" 
                          id="local-music-uploader" 
                          accept=".mp3,.wav" 
                          className="hidden" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            handleAudioPipelineUpload(file);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => document.getElementById('local-music-uploader')?.click()}
                          className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:border-[#39ff14]/30 hover:bg-[#39ff14]/5 text-zinc-450 hover:text-[#39ff14] text-[9px] font-mono font-black uppercase rounded transition cursor-pointer select-none flex items-center gap-1.5"
                        >
                          <Upload className="w-3.5 h-3.5 text-[#39ff14]" /> UPLOAD MP3/WAV
                        </button>
                      </div>
                    </div>

                    {isProcessingAudio && (
                      <div className="bg-[#000000] border border-[#1A1A1A] rounded-xl p-5 space-y-4 animate-fadeIn my-2 font-mono">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-zinc-400 font-bold tracking-widest uppercase animate-pulse">
                            [ AUDIO PIPELINE ACTIVE ]
                          </span>
                          <span className="text-[11px] text-[#39ff14] font-black">{audioPipelineProgress}%</span>
                        </div>
                        
                        <div className="space-y-1 max-h-[140px] overflow-y-auto bg-black border border-zinc-900 rounded p-3 text-[9px] leading-relaxed scrollbar-barely-visible">
                          {audioPipelineLog.map((log, index) => (
                            <div key={`distro-deck-log-${index}`} className={`font-mono ${log.includes('[SUCCESS]') ? 'text-[#39ff14] font-bold' : log.includes('[ERROR]') ? 'text-red-500 font-bold' : 'text-zinc-300'}`}>
                              {log}
                            </div>
                          ))}
                          <div className="animate-pulse text-[#39ff14]">_</div>
                        </div>

                        {/* Progress Bar with 12px rounded-xl */}
                        <div className="w-full h-1.5 bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800">
                          <div 
                            className="h-full bg-gradient-to-r from-[#39ff14] to-cyan-400 transition-all duration-300 rounded-xl"
                            style={{ width: `${audioPipelineProgress}%` }}
                          />
                        </div>
                        
                        <div className="flex justify-between items-center text-[8px] text-zinc-500">
                          <span>SOURCE: {processedTrackName}</span>
                          <span>NORMALIZATION TARGET: -14.0 LUFS</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-barely-visible">
                      {uploadedTracks.map((track, idx) => (
                        <div key={`${track.id}-${idx}`} className="flex flex-col gap-2 p-3 rounded-2xl border transition duration-150 bg-[#0a0c10] border-zinc-900 group">
                          <div
                            onClick={() => selectTrackToPlay(idx)}
                            className={`cursor-pointer flex items-center justify-between gap-3 text-left`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="font-mono text-[10px] text-zinc-650 shrink-0 w-4">
                                {currentTrackIndex === idx && musicIsPlaying ? (
                                  <span className="text-[#39ff14] font-black animate-pulse">▶</span>
                                ) : (
                                  String(idx + 1).padStart(2, '0')
                                )}
                              </span>
                              
                              <div className="min-w-0">
                                <span className="block text-[11px] font-bold font-mono tracking-wide truncate text-zinc-300 group-hover:text-white transition-colors">
                                  {track.title}
                                </span>
                                <span className="text-[8px] font-mono text-zinc-600 block mt-0.5">
                                  STEM SYSTEM: SOURCE FILE ({track.fileType?.toUpperCase()})
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-550 shrink-0">
                              <span>{track.duration}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const filtered = uploadedTracks.filter(t => t.id !== track.id);
                                  setUploadedTracks(filtered);
                                  if (currentTrackIndex >= filtered.length) {
                                    setCurrentTrackIndex(0);
                                  }
                                  triggerNotification?.("Removed track from current playback node!");
                                }}
                                className="p-1 hover:text-red-500 text-zinc-700 transition"
                                title="Delete from local play stack"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Track-level Monetization and Schema Toggles */}
                          <div className="mt-1 pt-2 border-t border-zinc-900/50 flex flex-wrap items-center gap-3">
                            {/* Preview Mode */}
                            <div className="flex items-center gap-1.5 bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-900">
                              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">Preview:</span>
                              <select 
                                value={track.track_preview_mode || '30_SEC_CLIP'}
                                onChange={(e) => {
                                  setUploadedTracks(prev => prev.map(t => t.id === track.id ? { ...t, track_preview_mode: e.target.value } : t));
                                }}
                                className="bg-transparent text-[9px] font-mono font-bold text-zinc-300 focus:outline-none cursor-pointer p-0 border-none appearance-none hover:text-white"
                              >
                                <option value="30_SEC_CLIP" className="bg-zinc-900 text-zinc-300">30_SEC_CLIP</option>
                                <option value="FULL_STREAM" className="bg-zinc-900 text-zinc-300">FULL_STREAM</option>
                                <option value="LOCKED" className="bg-zinc-900 text-zinc-300">LOCKED</option>
                              </select>
                            </div>

                            {/* Price */}
                            <div className="flex items-center gap-1.5 bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-900">
                              <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-500">Price:</span>
                              <div className="flex items-center">
                                <span className="text-[9px] font-mono text-zinc-500">$</span>
                                <input 
                                  type="number"
                                  min="0"
                                  step="0.10"
                                  value={track.track_price ?? 1.00}
                                  onChange={(e) => {
                                    setUploadedTracks(prev => prev.map(t => t.id === track.id ? { ...t, track_price: parseFloat(e.target.value) || 0 } : t));
                                  }}
                                  className="w-12 bg-transparent text-[9px] font-mono font-bold text-[#00ffcc] focus:outline-none p-0 border-none text-right placeholder-zinc-700"
                                  placeholder="1.00"
                                />
                              </div>
                            </div>

                            {/* Visibility Toggle */}
                            <div className="flex items-center gap-1.5 bg-zinc-950/50 px-2 py-1 rounded-md border border-zinc-900">
                               <label className="flex items-center gap-1.5 cursor-pointer">
                                 <input
                                   type="checkbox"
                                   checked={track.track_visibility ?? true}
                                   onChange={(e) => {
                                      setUploadedTracks(prev => prev.map(t => t.id === track.id ? { ...t, track_visibility: e.target.checked } : t));
                                   }}
                                   className="w-2.5 h-2.5 accent-[#39ff14] bg-zinc-900 rounded-sm cursor-pointer"
                                 />
                                 <span className={`text-[8px] font-mono uppercase tracking-widest ${track.track_visibility !== false ? 'text-[#39ff14]' : 'text-zinc-500'}`}>Visibile</span>
                               </label>
                            </div>

                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                   {/* LINK BROADCAST ADDER SECTION */}
                  <div className="bg-zinc-950 border border-zinc-900 rounded-3xl p-5 shadow-2xl text-left space-y-4">
                    <div className="border-b border-zinc-900 pb-2 flex items-center justify-between">
                      <span className="text-xs font-mono font-black text-white uppercase tracking-wider block">
                        Link Youtube Broadcast
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[8px] font-mono font-black">
                        SANDBOX COMPATIBLE
                      </span>
                    </div>

                    {/* Error 153 Advisory notice box */}
                    <div className="p-3 bg-amber-950/10 border border-amber-950/30 rounded-xl space-y-1 font-mono text-[9px] text-amber-300 leading-relaxed">
                      <p className="font-bold text-amber-400">⚠️ ADVISORY: EMBED PLAYBACK RESTRICTIONS (ERROR 153/150)</p>
                      <p>
                        YouTube restricts major-label records (and Rick Astley embeds) from playing inside virtual developer preview iframes. 
                        <strong> If you receive a playability configuration error</strong>, use custom open-licensed tracks, or tap our verified preset channels below!
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-[8px] font-mono text-zinc-650 uppercase font-black tracking-wider mb-1.5">
                          Visual Announcement Title
                        </label>
                        <input 
                          type="text" 
                          id="yt-video-title"
                          placeholder="e.g. Ritual Sewer Gates (Live in Detroit 2026)"
                          className="w-full bg-black/50 border border-zinc-800 px-3 py-2 text-xs font-mono text-white rounded-lg focus:outline-none focus:border-[#39ff14]"
                        />
                      </div>

                      <div>
                        <label className="block text-[8px] font-mono text-zinc-650 uppercase font-black tracking-wider mb-1.55">
                          YouTube URL or 11-char Video ID
                        </label>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            id="yt-video-url"
                            placeholder="https://www.youtube.com/watch?v=f02mOEt11g4"
                            className="bg-black/50 border border-zinc-800 px-3 py-2 text-xs font-mono text-white rounded-lg focus:outline-none focus:border-[#39ff14] flex-grow"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const tEl = document.getElementById('yt-video-title') as HTMLInputElement;
                              const uEl = document.getElementById('yt-video-url') as HTMLInputElement;
                              const titleVal = tEl?.value.trim();
                              const urlVal = uEl?.value.trim();
                              if (!titleVal || !urlVal) {
                                triggerNotification?.("Please specify both Title and YouTube key / link!");
                                return;
                              }

                              // Helper parser for youtube ID
                              let computedYtId = urlVal;
                              if (urlVal.includes('youtube.com') || urlVal.includes('youtu.be')) {
                                try {
                                  const urlObj = new URL(urlVal);
                                  if (urlVal.includes('youtu.be')) {
                                    computedYtId = urlObj.pathname.substring(1);
                                  } else {
                                    computedYtId = urlObj.searchParams.get('v') || '';
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                              }

                              if (!computedYtId || computedYtId.length < 5) {
                                triggerNotification?.("Could not parse valid YouTube Key ID!");
                                return;
                              }

                              const newYt = {
                                id: 'yt_vid_' + Date.now(),
                                title: titleVal,
                                youtubeId: computedYtId
                              };

                              setYoutubeVideos(prev => [newYt, ...prev]);
                              tEl.value = '';
                              uEl.value = '';
                              triggerNotification?.("Successfully mounted YouTube broadcast! 📺");
                            }}
                            className="px-3 bg-zinc-905 hover:bg-[#39ff14]/10 hover:text-[#39ff14] border border-zinc-800 text-[10px] font-mono font-black uppercase rounded-lg transition-all cursor-pointer"
                          >
                            LINK
                          </button>
                        </div>
                      </div>

                      {/* Presets loader */}
                      <div className="space-y-1.5 pt-1">
                        <span className="block text-[8px] font-mono text-zinc-650 uppercase font-black tracking-wider">
                          OR LOAD VERIFIED EMBEDDABLE PRESETS:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { name: "⚡ INDUSTRIAL SLATE", code: "f02mOEt11g4", title: "Industrial Noise & Decay Loop" },
                            { name: "📻 LOFI CODES", code: "jfKfPfyJRdk", title: "Atmospheric Lofi Ambient Jam" },
                            { name: "⚙️ TECHNO BEATS", code: "3h8kFSTg4w0", title: "Sovereign Modular Feedback Session" }
                          ].map((preset, idx) => (
                            <button
                              key={`${preset.code}-${idx}`}
                              type="button"
                              onClick={() => {
                                const tEl = document.getElementById('yt-video-title') as HTMLInputElement;
                                const uEl = document.getElementById('yt-video-url') as HTMLInputElement;
                                if (tEl) tEl.value = preset.title;
                                if (uEl) uEl.value = preset.code;
                                triggerNotification?.(`Loaded verified template "${preset.name}"! Click LINK to assign.`);
                              }}
                              className="px-2 py-1 bg-zinc-900 hover:bg-[#39ff14]/10 border border-zinc-800 text-[8px] font-mono text-zinc-400 hover:text-[#39ff14] rounded transition cursor-pointer font-bold"
                            >
                              + {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* ACTIVE BROADCAST LIST */}
                  <div className="space-y-4">
                    <span className="block text-[8px] font-mono text-zinc-650 uppercase tracking-widest font-black">
                      IN-APP BROADCAST FEEDS
                    </span>

                    {youtubeVideos.map((video, idx) => (
                      <div key={`${video.id}-${idx}`} className="bg-zinc-950/80 border border-zinc-900 rounded-3xl p-4 shadow-xl text-left space-y-3 relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-zinc-900/60 pb-2">
                          <span className="text-[10px] font-mono font-bold text-white pr-6 truncate">
                            📺 {video.title}
                          </span>
                          
                          <button
                            type="button"
                            onClick={() => {
                              setYoutubeVideos(prev => prev.filter(v => v.id !== video.id));
                              triggerNotification?.("Removed linked YouTube broadcast!");
                            }}
                            className="absolute top-3.5 right-3.5 text-zinc-750 hover:text-red-500 transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Inline YouTube Player Frame with fallback external links */}
                        <div className="w-full aspect-video rounded-xl overflow-hidden border border-zinc-900 bg-black relative group animate-fadeIn">
                          <iframe
                            className="w-full h-full"
                            src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=0&mute=0`}
                            title={video.title}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        </div>

                        {/* Interactive external link helper */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1 border-t border-zinc-900/60 font-mono text-[8px]">
                          <span className="text-zinc-550 uppercase tracking-tight">
                            DECODED BROADCAST CODE: {video.youtubeId}
                          </span>
                          <a
                            href={`https://www.youtube.com/watch?v=${video.youtubeId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-red-650/10 hover:bg-red-650/20 border border-red-950 hover:border-transparent text-red-500 hover:text-white rounded-lg font-mono text-[9px] uppercase font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer w-fit"
                          >
                            <span>LAUNCH EXTERNALLY ↗</span>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

              </div>

            </div>
          )}

          {/* PAGE DISTRO CATOLOG DIRECTORY MANAGER */}
          {activeSubTab === 'merch' && (
            <div className="space-y-6">
              
              {/* ADD NEW ITEM BUTTON GATEWAY (GLOWING) */}
              <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-4 shadow-2xl text-center">
                <button
                  type="button"
                  onClick={() => onNavigateToTab?.('inventory')}
                  className="w-full py-4 bg-[#39ff14] hover:bg-[#32dd10] text-black font-mono text-xs font-black uppercase rounded-2xl transition-all duration-300 flex items-center gap-2 justify-center cursor-pointer shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] select-none animate-pulse"
                >
                  <Plus className="w-4 h-4" /> + Add New Item to Storefront Inventory
                </button>
                <p className="text-[9.5px] font-mono text-zinc-500 tracking-wide uppercase leading-relaxed">
                  Click the <span className="text-[#39ff14] font-bold">"Copy to Merch Shop"</span> button in the main Warehouse Inventory table once your item is created to publish it directly into this storefront catalogue.
                </p>
              </div>

              {/* RETAIL PRODUCTS DIRECTORY LAYOUT GRID */}
              <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-5 shadow-2xl text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-900 pb-3">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono text-[#39ff14] uppercase block font-black tracking-widest pl-0.5">
                      PUBLIC DIGITAL STOREFRONT CATALOGUE
                    </span>
                    <p className="text-[9.5px] font-mono text-zinc-400">
                      Edit names, prices, custom artwork exposures, descriptions, and publish instantly.
                    </p>
                  </div>
                  <div className="text-[9px] font-mono text-zinc-500 bg-zinc-900/60 border border-zinc-850 px-2 py-0.5 rounded-lg select-none shrink-0 w-fit">
                    {stagedDistroItems.length} Products listed
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {stagedDistroItems.map((item, idx) => {
                    const isPinned = featuredDistroItemId === item.id;
                    const isExpanded = expandedItems[item.id] || false;
                    return (
                      <div
                        key={`${item.id}-${idx}`}
                        className={`bg-[#0b0c0f] rounded-2xl relative overflow-hidden transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl flex flex-col justify-between ${
                          isPinned ? 'ring-2 ring-offset-2 ring-offset-black' : ''
                        } ${!item.visibility_status ? 'opacity-70 border-[#1a1b20]' : ''}`}
                        style={{
                          border: isPinned
                            ? `2px solid ${profileAccentColor}`
                            : `1.5px solid #2d3139`,
                          boxShadow: isPinned
                            ? `0 0 25px ${profileAccentColor}22`
                            : `0 4px 20px -5px rgba(0,0,0,0.4)`
                        }}
                      >
                        {/* Subtle neon drop line */}
                        <div 
                          className="absolute top-0 inset-x-0 h-1 pointer-events-none" 
                          style={{ backgroundColor: isPinned ? profileAccentColor : '#2d3139' }}
                        />

                        {/* Artwork Frame Thumbnail */}
                        <div className="w-full h-36 relative bg-zinc-900 overflow-hidden select-none group">
                          {item.product_image_url ? (
                            <img
                              src={item.product_image_url}
                              alt={item?.name}
                              className="w-full h-full object-cover transition-transform duration-700"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-950">
                              <ShoppingBag className="w-8 h-8 text-zinc-800" />
                            </div>
                          )}
                          
                          {/* Image Gradient shading */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/10 to-transparent" />

                          {/* Visibility badge */}
                          {!item.visibility_status && (
                            <div className="absolute top-2 left-2 bg-red-950/80 border border-red-900 text-red-500 font-mono text-[8.5px] font-black uppercase px-2 py-0.5 rounded-lg tracking-wider">
                              Hidden Draft
                            </div>
                          )}

                          {/* Change Image Button Overlay */}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItemImgId(item.id);
                                itemImgInputRef.current?.click();
                              }}
                              className="py-1.5 px-3 bg-[#39ff14]/90 hover:bg-[#39ff14] text-black rounded-xl text-[9px] font-mono font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition shadow"
                            >
                              <Camera className="w-3.5 h-3.5" /> [ Change Artwork ]
                            </button>
                          </div>

                          {/* Floating Type Category */}
                          <div className="absolute top-2 right-2 bg-black/75 px-2 py-0.5 border border-zinc-850 rounded text-[8.5px] font-mono text-zinc-450 capitalize">
                            Category: {item.original_item_type || 'Merch'}
                          </div>
                        </div>

                        {/* Product Detail Body */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3 bg-[#0a0c10]/40">
                          
                          {/* Item Header & Expand Toggle */}
                          <div className="flex items-center justify-between">
                            <div className="font-sans font-bold text-white text-sm truncate">{item?.name}</div>
                            <button
                              type="button"
                              onClick={() => setExpandedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                              className="text-[9px] font-mono uppercase text-zinc-400 hover:text-[#00ffcc] cursor-pointer"
                            >
                              {isExpanded ? 'Collapse ▲' : 'Edit ▼'}
                            </button>
                          </div>

                          {/* Collapsible Edit Container */}
                          {isExpanded && (
                            <>
                              {/* Editable Listing Name */}
                              <div className="space-y-1 text-left">
                                <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">Listing Display Name:</span>
                                <input
                                  type="text"
                                  value={item?.name}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStagedDistroItems(prev => prev.map(p => p.id === item.id ? { ...p, name: val } : p));
                                  }}
                                  className="w-full bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 focus:border-[#39ff14] px-2 py-1 text-[10.5px] font-mono font-bold text-white uppercase rounded focus:outline-none"
                                  placeholder="Storefront Product Name"
                                  title="Edit item name for storefront"
                                />
                              </div>

                              {/* Editable Price Block */}
                              <div className="space-y-1 text-left">
                                <div className="flex justify-between items-center text-[8px] font-mono text-zinc-550 uppercase tracking-widest">
                                  <span>Storefront Listing Price</span>
                                  <span className="text-[#00ffcc] font-black">${item.storefront_price.toFixed(2)}</span>
                                </div>
                                <div className="relative">
                                  <span className="absolute left-2.5 top-1.5 text-[10px] font-mono text-zinc-500">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    value={item.storefront_price}
                                    onChange={(e) => {
                                      const val = parseFloat(e.target.value) || 0;
                                      setStagedDistroItems(prev => prev.map(p => p.id === item.id ? { ...p, storefront_price: val } : p));
                                    }}
                                    className="w-full bg-zinc-900/40 border border-zinc-850 hover:border-zinc-800 focus:border-[#39ff14] pl-5 pr-2 py-1 text-[10px] font-mono text-white rounded focus:outline-none text-left"
                                    placeholder="0.00"
                                  />
                                </div>
                              </div>

                              {/* Editable Description Block */}
                              <div className="space-y-1 text-left">
                                <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest block">Public Promo Description / Specs:</span>
                                <textarea
                                  rows={3}
                                  value={item.public_description}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setStagedDistroItems(prev => prev.map(p => p.id === item.id ? { ...p, public_description: val } : p));
                                  }}
                                  className="w-full bg-zinc-900/45 border border-zinc-850 hover:border-zinc-800 focus:border-[#39ff14] p-2 text-[9.5px] font-mono text-zinc-300 rounded leading-relaxed resize-none focus:outline-none"
                                  placeholder="Type specs, variant descriptions..."
                                />
                              </div>
                            </>
                          )}

                          {/* Horizontal Divider */}
                          <div className={`border-t border-zinc-900 ${isExpanded ? 'my-1 pt-2.5' : 'pt-2'} flex items-center gap-1.5 flex-wrap`}>
                            {/* Pin to Hero */}
                            <button
                              type="button"
                              onClick={() => handleToggleFeaturedPin(item.id)}
                              className={`py-1 px-2 border rounded-md font-mono text-[8px] font-black uppercase transition-all cursor-pointer ${
                                isPinned
                                  ? 'bg-zinc-100 border-zinc-100 text-black font-black'
                                  : 'bg-zinc-950 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-750'
                              }`}
                              style={{
                                backgroundColor: isPinned ? profileAccentColor : undefined,
                                borderColor: isPinned ? profileAccentColor : undefined,
                                color: isPinned ? '#252830' : undefined
                              }}
                            >
                              {isPinned ? '[ UNPIN HERO ]' : '[ PIN TO HERO ]'}
                            </button>

                            {/* Visibility Toggle */}
                            <button
                              type="button"
                              onClick={() => handleToggleStoreVisibility(item.id)}
                              className="py-1 px-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-[8.5px] font-mono text-zinc-455 hover:text-white rounded-md transition cursor-pointer flex items-center gap-1"
                            >
                              {item.visibility_status ? (
                                <>
                                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>Public</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="w-3.5 h-3.5 text-zinc-600" />
                                  <span>Draft</span>
                                </>
                              )}
                            </button>

                            {/* Buy Simulator Option */}
                            {item.visibility_status && (
                              <button
                                type="button"
                                onClick={() => handleSimCartAdd(item)}
                                className="py-1 px-2 bg-zinc-950 hover:bg-zinc-900 border border-zinc-900 hover:border-zinc-800 text-[#00ffcc] rounded-md font-mono text-[8px] font-black uppercase transition-all cursor-pointer"
                              >
                                [ BUY ]
                              </button>
                            )}

                            {/* Delete Option */}
                            <button
                              type="button"
                              onClick={() => handleDeleteStoreItem(item.id)}
                              className="p-1 rounded-md bg-zinc-950/20 hover:bg-red-950/20 border border-transparent hover:border-red-900/30 text-zinc-550 hover:text-red-400 transition cursor-pointer ml-auto"
                              title="Delete from storefront"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* ACTIVE FAN RELATIONSHIP ROSTER FEED */}
          {activeSubTab === 'fans' && (
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-4 shadow-2xl text-left">
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#39ff14]" />
                  <span className="text-xs font-mono font-black text-zinc-300 tracking-wider uppercase">
                    Artist Fan base client Network
                  </span>
                </div>
                <div className="text-[9px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 border border-zinc-800">
                  {simFollows.length} total channels follows
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {simFollows.map((follower, idx) => (
                  <div
                    key={`${follower.id}-${idx}`}
                    className="p-4 bg-zinc-900/40 border border-zinc-900 rounded-2xl flex items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <span className="text-xs font-mono font-bold text-zinc-200 block uppercase">
                        @{follower.username}
                      </span>
                      <p className="text-[9px] font-mono text-zinc-550 block mt-1">
                        📍 {follower.location} • Followed {follower.followedAt}
                      </p>
                    </div>

                    <span className="px-2.5 py-0.5 border text-[7.5px] font-mono font-black border-[#39ff14]/30 text-[#39ff14] bg-[#39ff14]/5 rounded-full uppercase shrink-0">
                      Active Listener
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STYLE DESIGNS CUSTOMIZER AND DETAILS SETTINGS */}
          {activeSubTab === 'customizer' && (
            <div className="bg-zinc-950 border border-zinc-900 p-6 rounded-3xl space-y-5 shadow-2xl text-left">
              
              <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                <Palette className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-black text-zinc-305 uppercase">
                  Adjust Visual Channel Configurations
                </span>
              </div>

              {/* BIO INPUT TEXTAREA */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-zinc-450 uppercase font-black tracking-widest block">
                  1. Edit Public Brand Biography:
                </span>
                <textarea
                  rows={2}
                  value={bandBio}
                  onChange={handleSaveBio}
                  className="w-full bg-zinc-900/50 border border-zinc-850 hover:border-zinc-800 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-indigo-550 leading-relaxed text-left"
                  placeholder="Describe your band's style or publish live updates..."
                />
              </div>

              {/* BRAND COLOR PRESET PICKERS */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-zinc-450 uppercase font-black tracking-widest block">
                  2. Select Glow Accent Preset Code:
                </span>
                <div className="flex gap-2.5 flex-wrap">
                  {COLOR_PRESETS.map((col, idx) => (
                    <button
                      key={`${col.value}-${idx}`}
                      type="button"
                      onClick={() => handleUpdateAccentColor(col.value)}
                      className="w-8 h-8 rounded-lg border-2 transition-all hover:scale-110 cursor-pointer flex items-center justify-center relative shadow-lg"
                      style={{
                        backgroundColor: col.value,
                        borderColor: profileAccentColor === col.value ? '#ffffff' : 'transparent',
                        boxShadow: profileAccentColor === col.value ? `0 0 10px ${col.value}` : 'none'
                      }}
                      title={col.name}
                    >
                      {profileAccentColor === col.value && (
                        <Check className="w-4 h-4 text-black" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* HERO BANNER ASSORTMENT PANELS */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono text-zinc-450 uppercase font-black tracking-widest block">
                  3. Select Visual Backdrop Mood Banner:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  {BANNER_PRESETS.map((ban, idx) => (
                    <button
                      key={`${ban.name}-${idx}`}
                      type="button"
                      onClick={() => handleUpdateBannerPreset(ban.url)}
                      className={`p-3 text-[10px] font-mono rounded-xl border text-left truncate transition-colors cursor-pointer block ${
                        profileBannerMode === ban.url
                          ? 'bg-white/10 border-white text-white font-black hover:bg-white/15'
                          : 'bg-zinc-900 border-zinc-900 text-zinc-400 hover:border-zinc-850 hover:text-zinc-200'
                      }`}
                    >
                      {ban.name}
                    </button>
                  ))}
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="py-1 px-3 bg-zinc-900 border border-zinc-850 text-zinc-450 text-[9px] font-mono rounded-xl hover:text-white"
                  >
                    Upload logo image
                  </button>
                  <button
                    type="button"
                    onClick={() => bannerInputRef.current?.click()}
                    className="py-1 px-3 bg-zinc-900 border border-zinc-850 text-zinc-450 text-[9px] font-mono rounded-xl hover:text-white"
                  >
                    Upload banner Image
                  </button>
                  <span className="text-[8px] font-mono text-zinc-650">
                    *supports .jpg, .png rendering instantly
                  </span>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* 5. CROP & QUICK EDIT TOOL PORTAL MODAL */}
      {cropModalData && cropModalData.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fadeIn overflow-y-auto">
          <div className="bg-[#0b0c10] border border-zinc-800 rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl text-left my-auto">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              <div className="space-y-1">
                <span className="px-2 py-0.5 rounded bg-[#39ff14]/10 border border-[#39ff14]/20 text-[#39ff14] text-[9px] font-mono font-black uppercase tracking-widest block w-fit">
                  ⚔️ Image Cropping Node ⚔️
                </span>
                <h3 className="text-base font-black text-white uppercase tracking-wider font-sans">
                  Quick Crop & Filter: {cropModalData.imageType === 'logo' ? 'Band Logo Symbol' : (cropModalData.imageType === 'item' ? 'Product Listing Merchandise' : 'Artistic Backdrop Banner')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCropModalData(null)}
                className="p-1.5 rounded-lg hover:bg-zinc-900 text-zinc-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Warning */}
            <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-900">
              <p className="text-[9.5px] font-mono text-zinc-400 leading-normal">
                Drag the sliders to zoom/rotate and tap custom filters below. The bounding box shows the exact portion visible to your followers.
              </p>
            </div>

            {/* Simulated Live Preview */}
            <div className="space-y-2">
              <span className="text-[9.5px] font-mono text-zinc-500 uppercase font-bold tracking-wider block">
                Viewport Preview Boundary (Exactly what will fit):
              </span>
              <div className="p-2 bg-zinc-950/90 rounded-2xl border border-zinc-900 flex justify-center items-center">
                <div className={`relative overflow-hidden flex items-center justify-center bg-black border-2 p-0 ${
                  cropModalData.imageType === 'logo' ? 'w-[200px] h-[200px] rounded-full' : 'w-[400px] h-[150px] rounded-2xl'
                }`}
                style={{ borderColor: profileAccentColor }}
                >
                  <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                    <img
                      src={cropModalData.originalSrc}
                      alt="Original Upload Source"
                      className="max-w-none transition-all duration-75 select-none origin-center"
                      style={{
                        width: cropModalData.imageType === 'logo' ? '200px' : '400px',
                        transform: `translate(${cropX}px, ${cropY}px) scale(${cropZoom}) rotate(${cropRotate}deg)`,
                        filter: cropFilter === 'grayscale' ? 'grayscale(100%)' 
                              : cropFilter === 'contrast' ? 'contrast(220%)' 
                              : cropFilter === 'acid' ? 'hue-rotate(85deg) saturate(3.5) contrast(1.4)' 
                              : cropFilter === 'crimson' ? 'sepia(90%) saturate(6) hue-rotate(-55deg) contrast(1.8)'
                              : cropFilter === 'cyan' ? 'sepia(80%) saturate(4.5) hue-rotate(130deg) contrast(1.3)'
                              : 'none'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sliders Control Panel */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase">
                  <span>Zoom Level</span>
                  <span className="text-[#39ff14] font-black">{(cropZoom * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.25"
                  max="4.00"
                  step="0.05"
                  value={cropZoom}
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase">
                  <span>360° Rotation Angle</span>
                  <span className="text-[#39ff14] font-black">{cropRotate}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={cropRotate}
                  onChange={(e) => setCropRotate(parseInt(e.target.value))}
                  className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase">
                    <span>X Axis Shift</span>
                    <span className="text-[#39ff14] font-black">{cropX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={cropX}
                    onChange={(e) => setCropX(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 uppercase">
                    <span>Y Axis Shift</span>
                    <span className="text-[#39ff14] font-black">{cropY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    step="1"
                    value={cropY}
                    onChange={(e) => setCropY(parseInt(e.target.value))}
                    className="w-full h-1 bg-zinc-900 rounded-lg appearance-none cursor-pointer accent-[#39ff14]"
                  />
                </div>
              </div>
            </div>

            {/* Creative Filters */}
            <div className="space-y-2">
              <span className="text-[9.5px] font-mono text-zinc-500 uppercase font-bold tracking-wider block">
                Vibe Filter Presets:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'none', label: '⚔️ Original' },
                  { id: 'grayscale', label: '🪦 Monochromic' },
                  { id: 'contrast', label: '💀 High Gore' },
                  { id: 'acid', label: '🧪 Acid Toxic' },
                  { id: 'crimson', label: '🩸 Crimson Gut' },
                  { id: 'cyan', label: '❄️ Frozen Cyber' }
                ].map((f, fIdx) => (
                  <button
                    key={`${f.id}-${fIdx}`}
                    type="button"
                    onClick={() => setCropFilter(f.id)}
                    className={`py-1.5 px-2 rounded-xl text-[9px] font-mono uppercase text-center transition cursor-pointer border ${
                      cropFilter === f.id
                        ? 'bg-[#39ff14]/15 text-[#39ff14] border-[#39ff14]/40 font-bold'
                        : 'bg-zinc-900/40 text-zinc-400 border-zinc-900 hover:text-white hover:border-zinc-800'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => setCropModalData(null)}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl font-mono text-[10px] uppercase font-bold transition cursor-pointer"
              >
                [ Cancel ]
              </button>
              
              <button
                type="button"
                onClick={handleSaveCroppedImage}
                className="px-5 py-2 bg-[#39ff14] hover:bg-[#2cee0d] text-black rounded-xl font-mono text-[10px] uppercase font-black tracking-wide transition cursor-pointer shadow-[0_0_15px_rgba(57,255,20,0.2)] flex items-center gap-1.5"
              >
                <Check className="w-4 h-4 text-black" /> Deploy Edited Image
              </button>
            </div>

          </div>
        </div>
      )}

      <input
        type="file"
        ref={itemImgInputRef}
        onChange={handleItemImgFileChange}
        className="hidden"
        accept="image/*"
      />

    </div>
  );
}
