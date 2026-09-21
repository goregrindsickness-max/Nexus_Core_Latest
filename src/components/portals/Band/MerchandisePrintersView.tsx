import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronLeft, 
  Search, 
  Plus, 
  Trash2, 
  Star, 
  Mail, 
  Phone, 
  MapPin, 
  ThumbsUp, 
  Heart, 
  MessageSquare, 
  Ban, 
  AlertTriangle, 
  AlertCircle, 
  Printer,
  ChevronRight,
  TrendingUp,
  X,
  Camera,
  Image as ImageIcon,
  Eye
} from 'lucide-react';
import { InventoryItem, Sale } from '../../../types';
import { getSupabase, executeWithSchemaResilience } from '../../../supabase';
import { motion, AnimatePresence } from 'motion/react';
import { ReceiptByteBuilder, serializeSaleToReceiptBytes } from '../../../ReceiptByteBuilder';

interface MerchandisePrintersViewProps {
  onBack: () => void;
  triggerNotification: (msg: string) => void;
  addLog: (msg: string) => void;
  inventory: InventoryItem[];
}

export default function MerchandisePrintersView({ 
  onBack, 
  triggerNotification, 
  addLog, 
  inventory = [] 
}: MerchandisePrintersViewProps) {
  // Printer contacts & Reordering setup
  const [printers, setPrinters] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_printers');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'p1',
        name: 'Apex Screenprinting & Stitch',
        company_name: 'Apex Merch Co.',
        email: 'orders@apexprints.com',
        phone: '+1-800-555-0199',
        notes: 'Premium heavy tees, tour apparel, custom embroidery, and fast turnaround hoodies.',
        rating: 4.9,
        price_range: 'moderate',
        region: 'Austin, TX',
        specialties: ['T-Shirts, Hoodies, Shorts (Screen-print)', 'T-Shirts, Hoodies, Shorts (DTF/DTG)'],
        likes: 89,
        liked_by_user: false,
        offers_dtg: true,
        offers_dtf: true,
        max_screen_colors: 8,
        reviews: [
          { name: 'Dave G. (Bassist)', rating: 5, text: 'The best screenprinting for our US tour. Extremely fast turnaround.', date: '2026-05-15' },
          { name: 'Sarah L. (Tour Mgr)', rating: 4.8, text: 'Custom embroidery looks pristine, t-shirts are heavy-weight and durable.', date: '2026-04-20' }
        ],
        finished_works: [
          {
            id: 'fw_p1_1',
            url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=500&auto=format&fit=crop&q=60',
            description: 'Double-sided vintage heavyweight tee with 6-color screen print. High resolution distress effect.',
            submittedBy: 'Apex Merch Co.',
            date: '2026-05-15',
            likes: 18
          },
          {
            id: 'fw_p1_2',
            url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60',
            description: 'Premium heavyweight pull-over hoodie with custom gold-thread sleeve embroidery detail.',
            submittedBy: 'Sarah L. (Tour Mgr)',
            date: '2026-04-20',
            likes: 24
          }
        ]
      },
      {
        id: 'p2',
        name: 'Classic Merch Press Ltd.',
        company_name: 'Classic Merch Ltd.',
        email: 'sales@classicmerchpress.co.uk',
        phone: '+44-20-7946-0192',
        notes: 'Europe & UK tours support. CD duplication, vinyl pressings, caps, sew-on patches, and stickers.',
        rating: 4.7,
        price_range: 'premium',
        region: 'London, UK',
        specialties: ['Stickers (Standard/ Holographic)', 'Vinyl Logo Stickers'],
        likes: 54,
        liked_by_user: false,
        offers_dtg: false,
        offers_dtf: false,
        max_screen_colors: 6,
        reviews: [
          { name: 'Marcus K. (Guitar)', rating: 5, text: 'Vinyl pressing arrived right in time for the London headliner show. Exceptional! Def recommended.', date: '2026-05-10' }
        ],
        finished_works: [
          {
            id: 'fw_p2_1',
            url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=60',
            description: 'Split-color custom vinyl pressings. High gloss custom gatefold packaging printed perfectly.',
            submittedBy: 'Marcus K. (Guitar)',
            date: '2026-05-10',
            likes: 31
          },
          {
            id: 'fw_p2_2',
            url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60',
            description: 'Structured custom snapback caps with 3D embroidery and custom inner tape printing.',
            submittedBy: 'Grave Digger (Tour Lead)',
            date: '2026-05-01',
            likes: 14
          }
        ]
      },
      {
        id: 'p3',
        name: 'Black Harbor Print Co.',
        company_name: 'Black Harbor Printing',
        email: 'sales@blackharborprint.com',
        phone: '+1-216-555-0144',
        notes: 'Excellent wholesale budgets, amazing tour packages, screen printing, and custom canvas tour flags.',
        rating: 4.8,
        price_range: 'budget',
        region: 'Cleveland, OH',
        specialties: ['T-Shirts, Hoodies, Shorts (Screen-print)', 'Sublimation (Wall Flags/ Accessories)'],
        likes: 67,
        liked_by_user: false,
        offers_dtg: false,
        offers_dtf: false,
        max_screen_colors: 4,
        reviews: [
          { name: 'Jimmy T.', rating: 5, text: 'Best budget bundles for screenprints. Very easy to work with!', date: '2026-03-12' }
        ],
        finished_works: [
          {
            id: 'fw_p3_1',
            url: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&auto=format&fit=crop&q=60',
            description: 'Standard budget bundle tees. Screen printed front-print, extremely soft discharge ink.',
            submittedBy: 'Jimmy T.',
            date: '2026-03-12',
            likes: 9
          }
        ]
      },
      {
        id: 'p4',
        name: 'Sticker Ninja',
        company_name: 'Sticker Ninja Corp',
        email: 'support@stickerninja.com',
        phone: '+1-503-555-0182',
        notes: 'Specialists in high quality die-cut tour stickers, high-gloss holographic stickers, and patches.',
        rating: 4.9,
        price_range: 'budget',
        region: 'Portland, OR',
        specialties: ['Stickers (Standard/ Holographic)', 'Vinyl Logo Stickers'],
        likes: 104,
        liked_by_user: false,
        offers_dtg: false,
        offers_dtf: true,
        max_screen_colors: 0,
        reviews: [
          { name: 'Renee S.', rating: 5, text: 'Holographic stickers sold out in two nights! Top quality material.', date: '2026-05-02' }
        ],
        finished_works: [
          {
            id: 'fw_p4_1',
            url: 'https://images.unsplash.com/photo-1572375995301-3b188a101c40?w=500&auto=format&fit=crop&q=60',
            description: 'Premium laptop die-cut stickers. 100% waterproof high-gloss vinyl material.',
            submittedBy: 'Renee S.',
            date: '2026-05-02',
            likes: 42
          }
        ]
      }
    ];
  });

  // Database alignment
  const [printersSyncStatus, setPrintersSyncStatus] = useState<'connecting' | 'connected' | 'local_resilience'>('connecting');

  // New Printer form states
  const [showAddPrinterForm, setShowAddPrinterForm] = useState(false);
  const [newPrinter, setNewPrinter] = useState({
    name: '',
    company_name: '',
    email: '',
    phone: '',
    notes: '',
    price_range: 'moderate',
    rating: '5.0',
    region: '',
    specialties: ''
  });

  // Filter and view state variables
  const [printerSearchQuery, setPrinterSearchQuery] = useState('');
  const [printerSpecialtyFilter, setPrinterSpecialtyFilter] = useState('All');
  const [printerPriceFilter, setPrinterPriceFilter] = useState('All');
  const [printerTechFilter, setPrinterTechFilter] = useState<'All' | 'screen' | 'digital'>('All');
  const [printerSortBy, setPrinterSortBy] = useState('rating');
  const [printerViewMode, setPrinterViewMode] = useState<'active' | 'blacklisted' | 'all'>('active');

  // Expanded views
  const [expandedPrinterId, setExpandedPrinterId] = useState<string | null>(null);
  const [blacklistingId, setBlacklistingId] = useState<string | null>(null);
  const [blacklistNotes, setBlacklistNotes] = useState('');
  const [newReviewForm, setNewReviewForm] = useState({ name: '', text: '', rating: 5 });

  // Crowd-sourced photo gallery states
  const [printerActiveTabs, setPrinterActiveTabs] = useState<Record<string, 'reviews' | 'gallery'>>({});
  const [activeLightboxPhoto, setActiveLightboxPhoto] = useState<{ printerId: string; photo: any } | null>(null);
  const [showAddWorkFormId, setShowAddWorkFormId] = useState<string | null>(null);
  const [newWorkForm, setNewWorkForm] = useState({
    submittedBy: '',
    description: '',
    urlType: 'preset' as 'preset' | 'custom',
    presetIdx: 0,
    customUrl: ''
  });

  const presetWorkPhotos = [
    {
      name: 'Heavy Vintage Tee',
      url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500&auto=format&fit=crop&q=60'
    },
    {
      name: 'Logo Pull-over Hoodie',
      url: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=500&auto=format&fit=crop&q=60'
    },
    {
      name: 'Custom Colored Vinyl Record',
      url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?w=500&auto=format&fit=crop&q=60'
    },
    {
      name: 'Die-cut Holographic Stickers',
      url: 'https://images.unsplash.com/photo-1572375995301-3b188a101c40?w=500&auto=format&fit=crop&q=60'
    },
    {
      name: 'Embroidered Dad Hat / Cap',
      url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=500&auto=format&fit=crop&q=60'
    }
  ];

  // Reorder process wizard state
  const [reorderItem, setReorderItem] = useState<any>(null);
  const [reorderQuantity, setReorderQuantity] = useState<number>(100);
  const [reorderDraftNotes, setReorderDraftNotes] = useState<string>('');
  const [selectedPrinterForReorder, setSelectedPrinterForReorder] = useState<any>(null);

  // Alliance routing state
  const [stagingAlliancePrinterId, setStagingAlliancePrinterId] = useState<string | null>(null);
  const [selectedAllianceId, setSelectedAllianceId] = useState<string>('');
  const [alliances, setAlliances] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('nexus_core_creative_alliances');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [];
  });

  const ACTIVE_TOUR_ROUTE = ['Austin, TX', 'Dallas, TX', 'Houston, TX', 'Los Angeles, CA', 'London, UK'];

  const handleStageAlliance = (printer: any) => {
    triggerNotification(`FINALIZED // CREW PROJECT ROUTED TO ${printer.company_name.toUpperCase()}`);
    addLog(`Staged layout assets & separation specs to ${printer.company_name}`);
    setStagingAlliancePrinterId(null);
    setSelectedAllianceId('');
  };

  const isLow10Percent = (item: InventoryItem) => {
    const total = item.table_stock + item.van_stock;
    const limit = Math.ceil(0.1 * (item.initial_batch_size || 100));
    return total <= limit;
  };

  // Hybrid Cloud Synchronizer upload
  const uploadPrinterToCloud = async (p: any) => {
    const supabase = getSupabase();
    if (!supabase) return;

    const dbPayload = {
      id: p.id,
      name: p.name,
      company_name: p.company_name || null,
      email: p.email,
      phone: p.phone || null,
      notes: p.notes || null,
      rating: p.rating || 5.0,
      price_range: p.price_range || 'moderate',
      region: p.region || null,
      specialties: p.specialties || [],
      offers_dtg: !!p.offers_dtg,
      offers_dtf: !!p.offers_dtf,
      max_screen_colors: p.max_screen_colors || 6,
      likes: p.likes || 0,
      reviews: p.reviews || [],
      finished_works: p.finished_works || [],
      blacklisted: !!p.blacklisted,
      blacklist_reason: p.blacklist_reason || null
    };

    try {
      await executeWithSchemaResilience(async (payload) => {
        return await supabase.from('community_printers_v1').upsert([payload]);
      }, dbPayload);
    } catch (err) {
      console.info('[Community Database] Failed to write printer to cloud. Network fallback active.', err);
    }
  };

  // Synchronize on load
  useEffect(() => {
    let active = true;
    const fetchCloudPrinters = async () => {
      const supabase = getSupabase();
      if (!supabase) {
        setPrintersSyncStatus('local_resilience');
        return;
      }

      setPrintersSyncStatus('connecting');
      try {
        const { data, error } = await supabase.from('community_printers_v1').select('*');
        if (error) {
          if (error.code === 'PGRST116' || error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            if (active) setPrintersSyncStatus('local_resilience');
          } else {
            console.info('[Community Database] Sync load error:', error);
            if (active) setPrintersSyncStatus('local_resilience');
          }
          return;
        }

        if (data && data.length > 0 && active) {
          setPrinters(prev => {
            const merged = [...prev];
            data.forEach((cloudItem: any) => {
              const idx = merged.findIndex(p => p.id === cloudItem.id);
              if (idx > -1) {
                merged[idx] = {
                  ...merged[idx],
                  ...cloudItem,
                  liked_by_user: merged[idx].liked_by_user ?? cloudItem.liked_by_user ?? false
                };
              } else {
                merged.push({
                  ...cloudItem,
                  liked_by_user: false
                });
              }
            });
            return merged;
          });
          setPrintersSyncStatus('connected');
          addLog('[CLOUD SUCCESS] Loaded live community-driven production printer database.');
        } else if (active) {
          setPrintersSyncStatus('connected');
        }
      } catch (err) {
        console.warn('Exception during fetching community printers:', err);
        if (active) setPrintersSyncStatus('local_resilience');
      }
    };

    fetchCloudPrinters();
    return () => { active = false; };
  }, []);

  // Save changes locally
  useEffect(() => {
    try {
      localStorage.setItem('nexus_core_printers', JSON.stringify(printers));
    } catch (_) {}
  }, [printers]);

  // Handle re-ordering config triggers
  const handleTriggerReorder = (item: InventoryItem) => {
    setReorderItem(item);
    setReorderQuantity(item.initial_batch_size || 100);
    setReorderDraftNotes(`Hi! We are running low on the "${item?.name}" standard apparel item. We currently only have ${item.table_stock + item.van_stock} units left. We want to place an urgent order of ${item.initial_batch_size || 100} units. Let us know the estimate. Cheers!`);
    const activePool = printers.filter(p => !p.blacklisted);
    if (activePool.length > 0) {
      setSelectedPrinterForReorder(activePool[0]);
    } else {
      setSelectedPrinterForReorder(null);
    }
  };

  const handleAddPrinter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPrinter.name || !newPrinter.company_name) {
      triggerNotification('Please enter both Point of Contact Name and Company Name.');
      return;
    }
    const createdPrinter = {
      id: 'printer_' + Date.now(),
      name: newPrinter.name,
      company_name: newPrinter.company_name,
      email: newPrinter.email || 'orders@example.com',
      phone: newPrinter.phone || '',
      notes: newPrinter.notes || '',
      rating: parseFloat(newPrinter.rating) || 5.0,
      price_range: newPrinter.price_range,
      region: newPrinter.region || 'Unknown Location',
      specialties: newPrinter.specialties ? newPrinter.specialties.split(',').map(s => s.trim()).filter(Boolean) : ['Screenprint'],
      likes: 1,
      liked_by_user: false,
      offers_dtg: false,
      offers_dtf: false,
      max_screen_colors: 6,
      reviews: [],
      finished_works: []
    };
    setPrinters(prev => [...prev, createdPrinter]);
    uploadPrinterToCloud(createdPrinter);
    setNewPrinter({ 
      name: '', 
      company_name: '', 
      email: '', 
      phone: '', 
      notes: '', 
      price_range: 'moderate', 
      rating: '5.0', 
      region: '', 
      specialties: '' 
    });
    setShowAddPrinterForm(false);
    triggerNotification('New community production printer registered successfully!');
    addLog(`Registered custom production printer: "${createdPrinter.company_name}" (${createdPrinter.name})`);
  };

  const handleDeletePrinter = async (printerId: string) => {
    setPrinters(prev => prev.filter(p => p.id !== printerId));
    try {
      const supabase = getSupabase();
      if (supabase) {
        await supabase.from('community_printers_v1').delete().eq('id', printerId);
      }
    } catch (_) {}
    triggerNotification('Custom printer removed from local profile.');
  };

  const handleToggleLikePrinter = (printerId: string) => {
    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const isUpvoted = !p.liked_by_user;
        const updated = {
          ...p,
          liked_by_user: isUpvoted,
          likes: isUpvoted ? (p.likes || 0) + 1 : Math.max(0, (p.likes || 0) - 1)
        };
        uploadPrinterToCloud(updated);
        triggerNotification(isUpvoted ? 'Upvoted shop recommendation recommendation!' : 'Removed shop upvote.');
        return updated;
      }
      return p;
    }));
  };

  const handleAddReview = (e: React.FormEvent, printerId: string) => {
    e.preventDefault();
    if (!newReviewForm.name || !newReviewForm.text) return;

    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const currentReviews = p.reviews || [];
        const newReviewObj = {
          name: newReviewForm.name,
          rating: newReviewForm.rating,
          text: newReviewForm.text,
          date: new Date().toISOString().split('T')[0]
        };
        const updatedReviews = [newReviewObj, ...currentReviews];
        
        // Recalculate average rating
        const sum = updatedReviews.reduce((acc, r) => acc + r.rating, 0);
        const avg = Math.round((sum / updatedReviews.length) * 10) / 10;

        const updated = {
          ...p,
          rating: avg,
          reviews: updatedReviews
        };
        
        uploadPrinterToCloud(updated);
        triggerNotification('Thank you! Added new verification feedback.');
        return updated;
      }
      return p;
    }));

    setNewReviewForm({ name: '', text: '', rating: 5 });
  };

  const handleLikeFinishedWork = (printerId: string, workId: string) => {
    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const finished_works = p.finished_works || [];
        const updated_works = finished_works.map((work: any) => {
          if (work.id === workId) {
            return { ...work, likes: (work.likes || 0) + 1 };
          }
          return work;
        });
        const updated = {
          ...p,
          finished_works: updated_works
        };
        uploadPrinterToCloud(updated);
        triggerNotification('Crowd-sourced finished work photo liked! ❤️');
        return updated;
      }
      return p;
    }));
  };

  const handleAddFinishedWork = (e: React.FormEvent, printerId: string) => {
    e.preventDefault();
    if (!newWorkForm.submittedBy || !newWorkForm.description) {
      triggerNotification('Please specify both Submitter/Band and Work Description.');
      return;
    }

    const imgUrl = newWorkForm.urlType === 'preset'
      ? presetWorkPhotos[newWorkForm.presetIdx]?.url
      : newWorkForm.customUrl;

    if (!imgUrl) {
      triggerNotification('Please enter a custom photo web URL or choose a preset.');
      return;
    }

    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const currentWorks = p.finished_works || [];
        const newWorkObj = {
          id: 'fw_' + Date.now(),
          url: imgUrl,
          description: newWorkForm.description,
          submittedBy: newWorkForm.submittedBy,
          date: new Date().toISOString().split('T')[0],
          likes: 1
        };
        const updatedWorks = [newWorkObj, ...currentWorks];
        const updated = {
          ...p,
          finished_works: updatedWorks
        };
        uploadPrinterToCloud(updated);
        triggerNotification('Crowd-sourced finished production work logged and synced!');
        addLog(`[GALLERY] Logged new finished merch photo by "${newWorkForm.submittedBy}" to printer "${p.company_name}"`);
        return updated;
      }
      return p;
    }));

    // Reset Form
    setNewWorkForm({
      submittedBy: '',
      description: '',
      urlType: 'preset',
      presetIdx: 0,
      customUrl: ''
    });
    setShowAddWorkFormId(null);
  };

  const handleBlacklistPrinter = (printerId: string, reason: string) => {
    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const updated = {
          ...p,
          blacklisted: true,
          blacklist_reason: reason || 'Flagged for dispatch or communication failures.'
        };
        uploadPrinterToCloud(updated);
        triggerNotification('Supplier blacklisted. Communication locks activated.');
        addLog(`[BLACKLIST ACTIVE] Marked "${p.company_name}" as unsafe. Reason: ${reason}`);
        return updated;
      }
      return p;
    }));

    setBlacklistingId(null);
    setBlacklistNotes('');
  };

  const handleUnblacklistPrinter = (printerId: string) => {
    setPrinters(prevPrinters => prevPrinters.map(p => {
      if (p.id === printerId) {
        const updated = {
          ...p,
          blacklisted: false,
          blacklist_reason: null
        };
        uploadPrinterToCloud(updated);
        triggerNotification('Supplier restored to healthy active pool.');
        addLog(`[BLACKLIST REMOVED] Cleared active blocks for "${p.company_name}"`);
        return updated;
      }
      return p;
    }));
  };

  const filteredPrinters = useMemo(() => {
    let result = [...printers];

    if (printerViewMode === 'active') {
      result = result.filter(p => !p.blacklisted);
    } else if (printerViewMode === 'blacklisted') {
      result = result.filter(p => !!p.blacklisted);
    }

    if (printerSearchQuery.trim()) {
      const q = printerSearchQuery.toLowerCase();
      result = result.filter(p => 
        (p.company_name || '').toLowerCase().includes(q) ||
        (p.name || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q) ||
        (p.region || '').toLowerCase().includes(q) ||
        p.specialties?.some((s: string) => s.toLowerCase().includes(q))
      );
    }

    if (printerSpecialtyFilter !== 'All') {
      const spec = printerSpecialtyFilter.toLowerCase();
      result = result.filter(p => {
        return p.specialties?.some((s: string) => {
          const lowerS = s.toLowerCase();
          return lowerS.includes(spec) || spec.includes(lowerS);
        });
      });
    }

    if (printerPriceFilter !== 'All') {
      result = result.filter(p => p.price_range === printerPriceFilter);
    }

    if (printerTechFilter !== 'All') {
      if (printerTechFilter === 'digital') {
        result = result.filter(p => p.offers_dtg || p.offers_dtf);
      } else if (printerTechFilter === 'screen') {
        result = result.filter(p => !p.offers_dtg && !p.offers_dtf);
      }
    }

    result.sort((a, b) => {
      if (printerSortBy === 'proximity') {
        const aLoc = a.region || '';
        const bLoc = b.region || '';
        const isAOnRoute = (ACTIVE_TOUR_ROUTE || []).some(loc => aLoc.includes(loc) || loc.includes(aLoc));
        const isBOnRoute = (ACTIVE_TOUR_ROUTE || []).some(loc => bLoc.includes(loc) || loc.includes(bLoc));
        if (isAOnRoute && !isBOnRoute) return -1;
        if (!isAOnRoute && isBOnRoute) return 1;
        return (b.rating || 0) - (a.rating || 0); // fallback
      } else if (printerSortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (printerSortBy === 'likes') {
        return (b.likes || 0) - (a.likes || 0);
      } else {
        return (a.company_name || '').localeCompare(b.company_name || '');
      }
    });

    return result;
  }, [printers, printerSearchQuery, printerSpecialtyFilter, printerPriceFilter, printerTechFilter, printerSortBy, printerViewMode]);

  const lowStockItems = inventory.filter(isLow10Percent);

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] text-white relative">
      {/* PAGE HEADER */}
      <div className="relative border-b border-zinc-800 pb-3 pt-3 md:pt-14 md:pb-12 flex flex-col items-center justify-center text-center bg-[#0a0a0c]/95 backdrop-blur sticky top-0 z-40 gap-2">
        {/* Centered Title Lockup */}
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto gap-2">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <h1 
              style={{ fontSize: '26px', lineHeight: '1.2' }}
              className="font-display font-extrabold text-white tracking-tight uppercase text-center"
            >
              <span className="text-[#df55ff]">Merchandise</span> Printers Database
            </h1>
          </motion.div>
          <p 
            className="text-zinc-400 font-mono tracking-wide leading-relaxed text-center"
            style={{ marginTop: '-4px', fontSize: '10px', width: '315px' }}
          >
            A battle-tested network of vetted merchandise suppliers globally. Cross-reference crowd-verified quality ratings and bypass agency gatekeepers with direct contact channels embedded into every card
          </p>
        </div>

        {/* Sync Status on the right */}
        <div className="md:absolute md:right-6 md:top-6 pr-5 md:pr-0 z-20">
          <div className="flex items-center gap-2">
            {printersSyncStatus === 'connecting' && (
              <span className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Syncing
              </span>
            )}
            {printersSyncStatus === 'connected' && (
              <span className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Live Cloud Pool
              </span>
            )}
            {printersSyncStatus === 'local_resilience' && (
              <span className="flex items-center gap-1.5 text-[9px] font-mono px-2.5 py-1 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700 font-bold uppercase">
                Offline Resilient
              </span>
            )}
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-5 pb-16 space-y-5 scrollbar-thin">

        {/* Low stock alerts panel */}
        {lowStockItems.length > 0 && (
          <div className="bg-gradient-to-r from-red-950/40 to-[#12141c] border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.1)] rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5 text-red-500 animate-pulse drop-shadow-md" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Low Inventory Warnings ({lowStockItems.length} styles require printing)</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed text-left">The following styles are functioning at 10% or below initial batch allocation. Re-trigger a bulk run batch instantly via any active production suppliers:</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 max-h-40 overflow-y-auto pr-1">
              {lowStockItems.map((item, idx) => {
                const totalSec = item.table_stock + item.van_stock;
                return (
                  <div key={`${item.id}-${idx}`} className="flex items-center justify-between bg-black/40 p-3 rounded-lg border border-zinc-800 hover:border-red-500/50 transition-colors">
                    <div className="text-left">
                      <span className="text-xs text-white truncate block max-w-[200px] font-semibold">{item?.name}</span>
                      <span className="text-[10px] font-mono text-zinc-500 block">Remaining: {totalSec} / {item.initial_batch_size || 100} ({Math.round(totalSec / (item.initial_batch_size || 100) * 100)}%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleTriggerReorder(item)}
                      className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white font-mono font-bold text-[10px] px-3 py-1.5 rounded uppercase transition-colors cursor-pointer"
                    >
                      Draft Order →
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters and searching controls bar */}
        <div className="bg-[#12141c] border border-zinc-800 rounded-xl p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
            <span className="text-xs font-mono uppercase tracking-widest text-[#00ffcc] font-bold text-left">Search & Filter Controls</span>
            <button
              type="button"
              onClick={() => setShowAddPrinterForm(!showAddPrinterForm)}
              className="w-full sm:w-auto justify-center bg-[#00ffcc] text-black font-mono font-bold text-[10px] px-3.5 py-1.5 rounded uppercase hover:bg-[#00ffcc]/80 transition-all cursor-pointer flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,204,0.1)] whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddPrinterForm ? 'Close Recommender' : 'Recommend a Workshop'}
            </button>
          </div>

          <div className="flex flex-wrap gap-4 sm:gap-6 items-center">
            <label className="flex items-center gap-2 cursor-pointer font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 hover:text-white transition-colors select-none">
              <input
                type="checkbox"
                checked={printerTechFilter === 'screen'}
                onChange={() => setPrinterTechFilter(prev => prev === 'screen' ? 'All' : 'screen')}
                className="sr-only"
              />
              <span className={printerTechFilter === 'screen' ? 'text-[#00ffcc]' : 'text-zinc-600'}>
                {printerTechFilter === 'screen' ? '☑' : '☐'}
              </span> 
              <span>TRADITIONAL SCREEN</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer font-mono text-[10.5px] uppercase tracking-wider text-zinc-400 hover:text-white transition-colors select-none">
              <input
                type="checkbox"
                checked={printerTechFilter === 'digital'}
                onChange={() => setPrinterTechFilter(prev => prev === 'digital' ? 'All' : 'digital')}
                className="sr-only"
              />
              <span className={printerTechFilter === 'digital' ? 'text-[#00ffcc]' : 'text-zinc-600'}>
                {printerTechFilter === 'digital' ? '☑' : '☐'}
              </span> 
              <span>DIGITAL PRODUCTION (DTG / DTF)</span>
            </label>
            
            <div className="w-[1px] h-4 bg-zinc-800 mx-2 hidden sm:block"></div>
            
            <button
              onClick={() => setPrinterSortBy(prev => prev === 'proximity' ? 'rating' : 'proximity')}
              className={`font-mono text-[10.5px] uppercase tracking-wider font-bold transition-colors select-none flex items-center gap-1.5 cursor-pointer ${printerSortBy === 'proximity' ? 'text-[#A855F7]' : 'text-zinc-500 hover:text-white'}`}
            >
               [ SORT BY: TOUR ROUTE PROXIMITY 📡 ]
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Search name, region, notes..."
                value={printerSearchQuery}
                onChange={(e) => setPrinterSearchQuery(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 rounded-lg py-2 pl-9 pr-3 text-xs text-white placeholder-zinc-500 font-mono focus:outline-none focus:border-[#00ffcc] transition-all"
              />
            </div>

            <div>
              <select
                value={printerSpecialtyFilter}
                onChange={(e) => setPrinterSpecialtyFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded-lg p-2 focus:outline-none cursor-pointer h-9.5"
              >
                <option value="All">All Specialties</option>
                <option value="T-Shirts, Hoodies, Shorts (Screen-print)">T-Shirts, Hoodies, Shorts (Screen-print)</option>
                <option value="T-Shirts, Hoodies, Shorts (DTF/DTG)">T-Shirts, Hoodies, Shorts (DTF/DTG)</option>
                <option value="Stickers (Standard/ Holographic)">Stickers (Standard/ Holographic)</option>
                <option value="Vinyl Logo Stickers">Vinyl Logo Stickers</option>
                <option value="Sublimation (Wall Flags/ Accessories)">Sublimation (Wall Flags/ Accessories)</option>
                <option value="Embroidery (Hats/ Patches)">Embroidery (Hats/ Patches)</option>
              </select>
            </div>

            <div>
              <select
                value={printerPriceFilter}
                onChange={(e) => setPrinterPriceFilter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300 rounded-lg p-2 focus:outline-none cursor-pointer h-9.5"
              >
                <option value="All">All Pricing Bands</option>
                <option value="budget">$ Budget Supplier</option>
                <option value="moderate">$$ Moderate Rates</option>
                <option value="premium">$$$ Premium boutique</option>
              </select>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={printerSortBy}
                onChange={(e) => setPrinterSortBy(e.target.value)}
                className="w-full sm:flex-1 bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-[#00ffcc] rounded-lg p-2 focus:outline-none cursor-pointer h-9.5"
              >
                <option value="rating">Sort: High Rating ★</option>
                <option value="likes">Sort: Upvote Count</option>
                <option value="name">Sort: Shop A-Z</option>
              </select>

              <div className="flex bg-zinc-950 p-1 rounded-lg border border-zinc-800 h-9.5 items-center justify-around sm:justify-start">
                {['active', 'blacklisted', 'all'].map((mode, idx) => (
                  <button
                    key={`${mode}-${idx}`}
                    type="button"
                    onClick={() => setPrinterViewMode(mode as any)}
                    className={`px-2.5 py-1 text-[9px] font-mono uppercase font-bold rounded transition-all h-full flex items-center ${
                      printerViewMode === mode 
                        ? mode === 'blacklisted' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30 shadow-md'
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {mode === 'all' ? 'All' : mode === 'blacklisted' ? 'Blocks' : 'Active'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Inline recommender form */}
        <AnimatePresence>
          {showAddPrinterForm && (
            <motion.form 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={handleAddPrinter} 
              className="bg-zinc-950/60 border border-zinc-800 rounded-xl p-5 space-y-4 text-left overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2">
                <h4 className="text-xs font-mono font-bold text-[#00ffcc] uppercase tracking-wider">Introduce Verified Production Supplier</h4>
                <button
                  type="button"
                  onClick={() => setShowAddPrinterForm(false)}
                  className="text-zinc-500 hover:text-white transition-colors cursor-pointer p-0.5"
                  title="Close Form"
                  aria-label="Close Form"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Representative Name *</label>
                  <input
                    type="text"
                    required
                    value={newPrinter.name}
                    onChange={(e) => setNewPrinter(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. Liam Cross"
                    className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Company / Shop Name *</label>
                  <input
                    type="text"
                    required
                    value={newPrinter.company_name}
                    onChange={(e) => setNewPrinter(prev => ({ ...prev, company_name: e.target.value }))}
                    placeholder="e.g. Silver Screen Press"
                    className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Email Dispatcher *</label>
                  <input
                    type="email"
                    required
                    value={newPrinter.email}
                    onChange={(e) => setNewPrinter(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="sales@silverscreen.com"
                    className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase">Phone Line</label>
                  <input
                    type="text"
                    value={newPrinter.phone}
                    onChange={(e) => setNewPrinter(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. +1-512-555-0322"
                    className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block">Pricing Range</label>
                  <select
                    value={newPrinter.price_range}
                    onChange={(e) => setNewPrinter(prev => ({ ...prev, price_range: e.target.value }))}
                    className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-[11px] font-mono text-zinc-300 focus:outline-none"
                  >
                    <option value="budget">$ Budget Rates</option>
                    <option value="moderate">$$ Moderate Rates</option>
                    <option value="premium">$$$$ Boutique Premium</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block">Initial Rating</label>
                  <select
                    value={newPrinter.rating}
                    onChange={(e) => setNewPrinter(prev => ({ ...prev, rating: e.target.value }))}
                    className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-[11px] font-mono text-zinc-300 focus:outline-none"
                  >
                    <option value="5.0">5.0 ★ Excellent</option>
                    <option value="4.5">4.5 ★ Great choice</option>
                    <option value="4.0">4.0 ★ Trustworthy</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase block">Region / City</label>
                  <input
                    type="text"
                    value={newPrinter.region}
                    onChange={(e) => setNewPrinter(prev => ({ ...prev, region: e.target.value }))}
                    placeholder="e.g. Denver, CO"
                    className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-500 uppercase">Tags specialties (comma-separated list)</label>
                <input
                  type="text"
                  value={newPrinter.specialties}
                  onChange={(e) => setNewPrinter(prev => ({ ...prev, specialties: e.target.value }))}
                  placeholder="e.g. Apparel: T-Shirts, Hoodies, Shorts (Screen-print), Stickers (Standard/ Holographic)"
                  className="w-full bg-[#12141c] border border-zinc-800 rounded p-2 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-mono text-zinc-400 uppercase font-semibold">Community commentary why you recommend</label>
                <textarea
                  value={newPrinter.notes}
                  onChange={(e) => setNewPrinter(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                  placeholder="Heavy cotton stock weight options, 7-day tour emergency turnaround support, precise neon colors..."
                  className="w-full bg-[#12141c] border border-zinc-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-[#00ffcc] text-black font-mono font-black text-xs py-3 rounded-lg uppercase hover:bg-[#57ffd9] transition-colors"
              >
                Register Supplier into shared pool ✓
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Database List segment */}
        <div className="space-y-4">
          <div className="text-left border-b border-zinc-900 pb-2 flex justify-between items-center">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-bold">Registers ({filteredPrinters.length} supplier nodes)</span>
            <span className="text-[10px] font-mono text-zinc-600">Sync is persistent</span>
          </div>

          {filteredPrinters.length === 0 ? (
            <div className="text-center py-12 bg-[#12141c]/30 rounded-xl border border-dashed border-zinc-805">
              <Printer className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
              <p className="text-xs text-zinc-500 font-mono">No matching suppliers registered. Refine searching guidelines.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPrinters.map((printer, idx) => {
                const isExpanded = expandedPrinterId === printer.id;
                return (
                  <div 
                    key={`${printer.id}-${idx}`}
                    className={`relative p-5 text-left transition-all duration-300 rounded-none border flex flex-col justify-between gap-4 group ${
                      printer.blacklisted
                        ? 'bg-[#000000] border-red-900/35 shadow-[inset_0_0_15px_rgba(239,68,68,0.05)]'
                        : 'bg-[#000000] border-[#262626] hover:border-[#A855F7] hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] overflow-hidden'
                    }`}
                  >
                    {!printer.blacklisted && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-bl-full pointer-events-none group-hover:bg-[#A855F7]/10 transition-colors duration-500" />
                    )}
                    {/* Trash can for registered entries */}
                    {printer.id.startsWith('printer_') && (
                      <button
                        type="button"
                        onClick={() => handleDeletePrinter(printer.id)}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-red-400 cursor-pointer transition-colors"
                        title="Remove custom recommendation"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <div className="space-y-2">
                      <div className="flex justify-between items-start pr-5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className={`text-sm font-bold font-sans ${printer.blacklisted ? 'text-red-400/80 line-through' : 'text-white'}`}>
                              {printer.company_name}
                            </h4>
                            <span className={`text-[8.5px] font-mono px-1 py-0.2 rounded font-bold uppercase tracking-wider ${
                              printer.blacklisted 
                                ? 'bg-red-950 text-red-400' 
                                : 'bg-[#00ffcc]/10 text-[#00ffcc]'
                            }`}>
                              {printer.price_range === 'budget' ? '$ Budget' : printer.price_range === 'premium' ? '$$$ Premium' : '$$ Mid'}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-zinc-400 font-mono mt-0.5">
                            Rep: {printer.name}
                          </p>
                        </div>

                        {/* Star Rating & upvotes badges */}
                        <div className="flex flex-col items-end shrink-0 gap-1 select-none">
                          <div className="flex items-center gap-1 bg-[#0c0617] px-2 py-0.5 rounded border border-purple-950/70 text-[10.5px] font-mono text-yellow-400">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                            <span>{printer.rating ? printer.rating.toFixed(1) : '5.0'}</span>
                          </div>
                          {!printer.blacklisted && (
                            <button
                              type="button"
                              onClick={() => handleToggleLikePrinter(printer.id)}
                              className={`flex items-center gap-1.5 text-[9px] font-mono px-1.5 py-0.5 rounded border transition-colors ${
                                printer.liked_by_user
                                  ? 'bg-[#00ffcc]/15 border-[#00ffcc] text-[#00ffcc]'
                                  : 'bg-[#0c0617] border-purple-950/70 text-zinc-400 hover:text-white'
                              }`}
                            >
                              {printer.liked_by_user ? <Heart className="w-2.5 h-2.5 fill-[#00ffcc] text-[#00ffcc]" /> : <ThumbsUp className="w-2.5 h-2.5" />}
                              <span>{printer.likes || 0}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Region indicator */}
                        <div className="text-[10.5px] text-purple-300 font-mono flex items-center gap-1 bg-[#0c0617]/50 px-2 py-1 rounded border border-purple-950/60 w-fit">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" />
                          <span>{printer.region || 'Austin, TX'}</span>
                        </div>

                        {/* Technology Cap Badge */}
                        <div className={`text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1.5 rounded border ${
                          printer.offers_dtg || printer.offers_dtf
                            ? 'text-cyan-400 bg-cyan-950/30 border-cyan-500/30'
                            : 'text-amber-400 bg-amber-950/30 border-amber-500/30'
                        }`}>
                          {(printer.offers_dtg || printer.offers_dtf) 
                            ? '[ PRINT METHOD // DIGITAL: DTG/DTF ]' 
                            : `[ PRINT METHOD // SCREEN: MAX ${printer.max_screen_colors || 6} COLORS ]`}
                        </div>

                        {/* Route Proximity Badge */}
                        {printerSortBy === 'proximity' && (ACTIVE_TOUR_ROUTE || []).some(loc => (printer.region || '').includes(loc) || loc.includes(printer.region || '')) && (
                          <div className="text-[9px] font-mono font-bold uppercase tracking-widest px-2 py-1.5 rounded border text-[#A855F7] bg-[#A855F7]/10 border-[#A855F7]/40 shadow-[0_0_8px_rgba(168,85,247,0.3)]">
                            [ LOGISTICS // PROXIMITY: ON-ROUTE ]
                          </div>
                        )}
                      </div>

                      {/* Specialties tags list */}
                      {printer.specialties && printer.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1 pt-1">
                          {printer.specialties.map((spec: string, idx) => (
                            <span 
                              key={`${spec}-${idx}`}
                              className={`text-[8.5px] font-mono font-bold uppercase rounded px-1.5 py-0.5 border ${
                                printer.blacklisted
                                  ? 'bg-zinc-900/50 border-zinc-950 text-zinc-650'
                                  : 'bg-[#0c0617]/80 border border-purple-950/60 text-purple-300'
                              }`}
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Supplier notes remarks */}
                      {printer.notes && (
                        <p className="text-[11px] font-mono text-purple-200 italic bg-[#0c0617]/40 p-2.5 rounded border border-purple-950/30 leading-relaxed">
                          "{printer.notes}"
                        </p>
                      )}

                      {/* Blacklist banner alert */}
                      {printer.blacklisted && (
                        <div className="bg-red-500/10 border border-red-500/25 rounded-lg p-3 space-y-1 mt-2">
                          <span className="text-[9px] font-mono uppercase tracking-widest text-red-500 font-bold block flex items-center gap-1">
                            <Ban className="w-3.5 h-3.5" /> Block Active
                          </span>
                          <p className="text-[10.5px] font-mono text-red-300 leading-relaxed italic pl-4">
                            "{printer.blacklist_reason || 'Missed routing delivery specifications.'}"
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="pt-2 border-t border-purple-950/50 flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex flex-wrap gap-1">
                        {!printer.blacklisted ? (
                          <>
                            <a
                              href={`mailto:${printer.email}`}
                              className="bg-[#0c0617] hover:bg-purple-950 border border-purple-950/60 py-1 px-2.5 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all text-left text-zinc-300 hover:text-white"
                            >
                              <Mail className="w-3 h-3 text-[#00ffcc]" />
                              <span>{printer.email}</span>
                            </a>
                            {printer.phone && (
                              <a
                                href={`tel:${printer.phone}`}
                                className="bg-[#0c0617] hover:bg-purple-950 border border-purple-950/60 py-1 px-2.5 rounded text-[10px] font-mono flex items-center gap-1.5 transition-all text-left text-zinc-300 hover:text-white"
                              >
                                <Phone className="w-3 h-3 text-amber-500" />
                                <span>{printer.phone}</span>
                              </a>
                            )}
                          </>
                        ) : (
                          <span className="text-[10px] font-mono text-red-500 uppercase font-black flex items-center gap-1">
                            🚫 comms locked
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!printer.blacklisted ? (
                          <>
                            {/* Blacklist triggers */}
                            <button
                              type="button"
                              onClick={() => {
                                setBlacklistingId(blacklistingId === printer.id ? null : printer.id);
                                setBlacklistNotes('');
                              }}
                              className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded cursor-pointer border ${
                                blacklistingId === printer.id
                                  ? 'bg-red-500 text-white border-red-500'
                                  : 'bg-[#0c0617] border-purple-950/70 text-zinc-500 hover:text-red-400 hover:border-red-900/60'
                              }`}
                            >
                              Block
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedPrinterId(expandedPrinterId === printer.id && (printerActiveTabs[printer.id] || 'reviews') === 'reviews' ? null : printer.id);
                                setPrinterActiveTabs(prev => ({ ...prev, [printer.id]: 'reviews' }));
                              }}
                              className={`text-[10px] font-mono font-bold flex items-center gap-1.5 py-1 px-2.5 rounded border transition-all cursor-pointer ${
                                isExpanded && (printerActiveTabs[printer.id] || 'reviews') === 'reviews'
                                  ? 'bg-[#00ffcc]/10 border-[#00ffcc] text-[#00ffcc]'
                                  : 'bg-[#0c0617] border-purple-950/40 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-[#00ffcc]" />
                              <span>Reviews ({printer.reviews?.length || 0})</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setExpandedPrinterId(expandedPrinterId === printer.id && (printerActiveTabs[printer.id] || 'reviews') === 'gallery' ? null : printer.id);
                                setPrinterActiveTabs(prev => ({ ...prev, [printer.id]: 'gallery' }));
                              }}
                              className={`text-[10px] font-mono font-bold flex items-center gap-1.5 py-1 px-2.5 rounded border transition-all cursor-pointer ${
                                isExpanded && (printerActiveTabs[printer.id] || 'reviews') === 'gallery'
                                  ? 'bg-purple-500/10 border-[#A855F7] text-purple-300'
                                  : 'bg-[#0c0617] border-purple-950/40 text-zinc-400 hover:text-white'
                              }`}
                            >
                              <Camera className="w-3.5 h-3.5 text-[#A855F7]" />
                              <span>Gallery ({printer.finished_works?.length || 0})</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleUnblacklistPrinter(printer.id)}
                            className="bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white px-2.5 py-1 text-[10px] font-mono font-bold rounded cursor-pointer text-red-400"
                          >
                            Restore Shop
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline blacklisting description form */}
                    {blacklistingId === printer.id && (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleBlacklistPrinter(printer.id, blacklistNotes);
                        }}
                        className="bg-red-950/20 p-3.5 border border-red-900/30 rounded-lg space-y-2 mt-2 w-full animate-slide-down"
                      >
                        <span className="text-[9px] font-mono uppercase tracking-widest text-red-400 block font-bold text-left">
                          Reason for blacklisting:
                        </span>
                        <textarea 
                          required
                          rows={2}
                          value={blacklistNotes}
                          onChange={(e) => setBlacklistNotes(e.target.value)}
                          placeholder="Why is this supplier blacklisted? Missed routing schedule or poor garments?"
                          className="w-full bg-black/50 border border-red-900/30 rounded p-2 text-xs text-zinc-300 font-mono resize-none focus:outline-none"
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            type="button"
                            onClick={() => setBlacklistingId(null)}
                            className="bg-zinc-900 text-zinc-400 px-2 py-1 rounded"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            className="bg-red-600 hover:bg-red-500 text-white font-mono px-3 py-1 rounded uppercase font-bold"
                          >
                            Blacklist 🚫
                          </button>
                        </div>
                      </form>
                    )}

                    {/* Feedback / Gallery Drawer Container */}
                    {isExpanded && (
                      <div className="bg-zinc-950/60 p-4 rounded-lg border border-zinc-900 space-y-4 mt-2 w-full text-left">
                        {/* Tab Headers switcher inside expanding drawer */}
                        <div className="flex border-b border-zinc-900 pb-2 items-center justify-between">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setPrinterActiveTabs(prev => ({ ...prev, [printer.id]: 'reviews' }))}
                              className={`text-[10px] font-mono uppercase tracking-wider font-bold py-1 px-3.5 rounded border transition-all cursor-pointer ${
                                (printerActiveTabs[printer.id] || 'reviews') === 'reviews'
                                  ? 'bg-[#00ffcc] text-black border-[#00ffcc]'
                                  : 'bg-[#0c0617] text-zinc-400 border-zinc-900 hover:text-white'
                              }`}
                            >
                              📋 Verification Logs ({printer.reviews?.length || 0})
                            </button>
                            <button
                              type="button"
                              onClick={() => setPrinterActiveTabs(prev => ({ ...prev, [printer.id]: 'gallery' }))}
                              className={`text-[10px] font-mono uppercase tracking-wider font-bold py-1 px-3.5 rounded border transition-all cursor-pointer ${
                                (printerActiveTabs[printer.id] || 'reviews') === 'gallery'
                                  ? 'bg-[#A855F7] text-black border-[#A855F7]'
                                  : 'bg-[#0c0617] text-zinc-400 border-zinc-900 hover:text-white'
                              }`}
                            >
                              🖼️ Finished Work Gallery ({printer.finished_works?.length || 0})
                            </button>
                          </div>
                          
                          {/* Indicator */}
                          <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest hidden sm:inline">
                            {(printerActiveTabs[printer.id] || 'reviews') === 'reviews' ? 'Supplier Audits' : 'CROWD-SOURCED PROOF'}
                          </span>
                        </div>

                        {/* REVIEWS TAB */}
                        {(printerActiveTabs[printer.id] || 'reviews') === 'reviews' && (
                          <div className="space-y-3">
                            {(!printer.reviews || printer.reviews.length === 0) ? (
                              <p className="text-[10.51px] font-mono text-zinc-550 italic text-center py-2 font-light">No comments found. Be the first tour manager to verify!</p>
                            ) : (
                              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                {printer.reviews.map((rev: any, rIdx: number) => (
                                  <div key={`printer-rev-${rIdx}`} className="bg-black/30 border border-zinc-900 p-2.5 rounded-lg text-left text-xs">
                                    <div className="flex justify-between items-center text-[9px] font-mono text-zinc-500">
                                      <span className="text-white font-bold">{rev.name}</span>
                                      <span>{rev.date}</span>
                                    </div>
                                    <div className="flex items-center gap-0.5 py-0.5 select-none">
                                      {Array.from({ length: 5 }).map((_, st) => (
                                        <Star key={`rev-star-${printer.id}-${rIdx}-${st}`} className={`w-2.5 h-2.5 ${st < rev.rating ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-700'}`} />
                                      ))}
                                    </div>
                                    <p className="text-[10.5px] italic font-mono text-zinc-300">"{rev.text}"</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Add Review input block */}
                            <form onSubmit={(e) => handleAddReview(e, printer.id)} className="space-y-2 pt-3 border-t border-zinc-900">
                              <span className="text-[9.51px] font-mono uppercase tracking-wider text-[#00ffcc] block font-bold">Write Verification Log</span>
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="text"
                                  required
                                  placeholder="Owner / Tour Lead"
                                  value={newReviewForm.name}
                                  onChange={(e) => setNewReviewForm(prev => ({ ...prev, name: e.target.value }))}
                                  className="bg-black/50 border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#00ffcc]"
                                />
                                <select
                                  value={newReviewForm.rating}
                                  onChange={(e) => setNewReviewForm(prev => ({ ...prev, rating: parseInt(e.target.value, 10) }))}
                                  className="bg-zinc-900 border border-zinc-800 p-1.5 rounded text-[11px] font-mono text-[#00ffcc] cursor-pointer"
                                >
                                  <option value="5">★★★★★ 5/5 Stars</option>
                                  <option value="4">★★★★☆ 4/5 Stars</option>
                                  <option value="3">★★★☆☆ 3/5 Stars</option>
                                </select>
                              </div>
                              <textarea
                                required
                                rows={2}
                                placeholder=" garment weight, screen print resolution comments..."
                                value={newReviewForm.text}
                                onChange={(e) => setNewReviewForm(prev => ({ ...prev, text: e.target.value }))}
                                className="w-full bg-black/50 border border-zinc-805 rounded p-2 text-xs text-zinc-300 font-mono resize-none focus:outline-none focus:border-[#00ffcc]"
                              />
                              <button
                                type="submit"
                                className="w-full bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] hover:bg-[#00ffcc] hover:text-black py-1.5 text-[9.5px] font-mono font-bold rounded uppercase tracking-wider transition-all cursor-pointer"
                              >
                                Submit Verification
                              </button>
                            </form>
                          </div>
                        )}

                        {/* GALLERY TAB */}
                        {(printerActiveTabs[printer.id] || 'reviews') === 'gallery' && (
                          <div className="space-y-4">
                            {/* Gallery Header Row */}
                            <div className="flex items-center justify-between">
                              <span className="text-[9.5px] font-mono text-zinc-400 uppercase tracking-widest text-left">
                                Showing {printer.finished_works?.length || 0} production proofs
                              </span>
                              
                              <button
                                type="button"
                                onClick={() => setShowAddWorkFormId(showAddWorkFormId === printer.id ? null : printer.id)}
                                className="text-[9.5px] font-mono font-bold bg-[#A855F7]/10 border border-[#A855F7]/30 text-[#A855F7] px-2.5 py-1 rounded hover:bg-[#A855F7] hover:text-black transition-all cursor-pointer flex items-center gap-1.5"
                              >
                                <Camera className="w-3 h-3" />
                                <span>{showAddWorkFormId === printer.id ? 'Hide Upload Form' : 'Share Finished Work'}</span>
                              </button>
                            </div>

                            {/* Log Finished Work Form Section */}
                            {showAddWorkFormId === printer.id && (
                              <form 
                                onSubmit={(e) => handleAddFinishedWork(e, printer.id)}
                                className="border border-[#A855F7]/20 bg-[#000000]/45 p-3 rounded-lg space-y-3.5 text-left animate-slide-down"
                              >
                                <span className="text-[10px] font-mono font-bold text-[#A855F7] uppercase tracking-wider block border-b border-zinc-900 pb-1">
                                  Submit Real Merch Proof Photo (Crowd Sourced)
                                </span>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  <div>
                                    <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                                      Band or Tour Name *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="e.g. Iron Sentinel Tour"
                                      value={newWorkForm.submittedBy}
                                      onChange={(e) => setNewWorkForm(prev => ({ ...prev, submittedBy: e.target.value }))}
                                      className="w-full bg-black/50 border border-zinc-800 rounded p-1.5 text-xs text-white focus:outline-none focus:border-[#A855F7]"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                                      Photo Source Type
                                    </label>
                                    <div className="flex gap-2 text-xs font-mono font-light mr-1">
                                      <button
                                        type="button"
                                        onClick={() => setNewWorkForm(prev => ({ ...prev, urlType: 'preset' }))}
                                        className={`flex-1 py-1 rounded border text-[10px] cursor-pointer uppercase font-bold ${
                                          newWorkForm.urlType === 'preset'
                                            ? 'bg-[#A855F7] text-black border-[#A855F7]'
                                            : 'bg-[#0c0617] text-zinc-400 border-zinc-900 hover:text-white'
                                        }`}
                                      >
                                        Template Mockup
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setNewWorkForm(prev => ({ ...prev, urlType: 'custom' }))}
                                        className={`flex-1 py-1 rounded border text-[10px] cursor-pointer uppercase font-bold ${
                                          newWorkForm.urlType === 'custom'
                                            ? 'bg-[#A855F7] text-black border-[#A855F7]'
                                            : 'bg-[#0c0617] text-zinc-400 border-zinc-900 hover:text-white'
                                        }`}
                                      >
                                        Custom Web URL
                                      </button>
                                    </div>
                                  </div>
                                </div>

                                {/* Preset Selector */}
                                {newWorkForm.urlType === 'preset' && (
                                  <div className="space-y-1.5">
                                    <label className="text-[9px] font-mono uppercase text-zinc-400 block">
                                      Select Mockup Template:
                                    </label>
                                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                                      {presetWorkPhotos.map((preset, idx) => (
                                        <button
                                          key={`printer-item-${idx}`}
                                          type="button"
                                          onClick={() => setNewWorkForm(prev => ({ ...prev, presetIdx: idx }))}
                                          className={`relative p-1 rounded border text-left flex flex-col items-center justify-between text-center overflow-hidden h-20 group transition-all cursor-pointer ${
                                            newWorkForm.presetIdx === idx
                                              ? 'border-[#A855F7] bg-[#A855F7]/10'
                                              : 'border-zinc-850 bg-black/30 hover:border-zinc-700'
                                          }`}
                                        >
                                          <img 
                                            src={preset.url} 
                                            alt={preset.name}
                                            referrerPolicy="no-referrer"
                                            className="w-full h-11 object-cover rounded opacity-75 group-hover:opacity-100 transition-opacity" 
                                          />
                                          <span className="text-[7.5px] font-mono leading-none tracking-tight block truncate w-full mt-1">
                                            {preset.name}
                                          </span>
                                          {newWorkForm.presetIdx === idx && (
                                            <div className="absolute top-0 right-0 bg-[#A855F7] text-black text-[6px] px-1 rounded-bl font-black">
                                              ✓
                                            </div>
                                          )}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* Custom URL Field */}
                                {newWorkForm.urlType === 'custom' && (
                                  <div>
                                    <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                                      Custom Photo Web URL *
                                    </label>
                                    <input
                                      type="url"
                                      required
                                      placeholder="https://images.unsplash.com/... or search engine image URL"
                                      value={newWorkForm.customUrl}
                                      onChange={(e) => setNewWorkForm(prev => ({ ...prev, customUrl: e.target.value }))}
                                      className="w-full bg-black/50 border border-zinc-800 rounded p-1.5 text-xs text-zinc-355 focus:outline-none focus:border-[#A855F7] font-mono"
                                    />
                                  </div>
                                )}

                                <div>
                                  <label className="text-[9px] font-mono uppercase text-zinc-400 block mb-1">
                                    Merch Proof Description * (Details of printing weight, alignment quality etc.)
                                  </label>
                                  <textarea
                                    required
                                    rows={2}
                                    placeholder="e.g. 100% thick heavy fabric. Screen print layout registration is beautifully aligned, no pixelation at all."
                                    value={newWorkForm.description}
                                    onChange={(e) => setNewWorkForm(prev => ({ ...prev, description: e.target.value }))}
                                    className="w-full bg-black/50 border border-zinc-800 rounded p-2 text-xs text-zinc-350 font-mono resize-none focus:outline-none focus:border-[#A855F7]"
                                  />
                                </div>

                                <div className="flex justify-end gap-2 text-xs">
                                  <button
                                    type="button"
                                    onClick={() => setShowAddWorkFormId(null)}
                                    className="px-3 py-1 bg-zinc-900 border border-zinc-850 text-zinc-400 hover:text-white rounded font-mono uppercase text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="submit"
                                    className="px-4 py-1 bg-[#A855F7] text-black hover:bg-[#b067fa] rounded font-mono uppercase text-[10px] font-bold"
                                  >
                                    Publish Finished Design
                                  </button>
                                </div>
                              </form>
                            )}

                            {/* Gallery List of Proofs */}
                            {(!printer.finished_works || printer.finished_works.length === 0) ? (
                              <div className="py-6 text-center bg-black/20 rounded-lg border border-zinc-900 border-dashed">
                                <ImageIcon className="w-6 h-6 text-zinc-800 mx-auto mb-2" />
                                <p className="text-[10.51px] font-mono text-zinc-550 italic">No proof photos shared yet. Submit yours above to help other tours!</p>
                              </div>
                            ) : (
                              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {printer.finished_works.map((work: any, idx) => (
                                  <div 
                                    key={`${work.id}-${idx}`}
                                    onClick={() => setActiveLightboxPhoto({ printerId: printer.id, photo: work })}
                                    className="group relative bg-[#0c0617]/50 border border-zinc-900 hover:border-[#A855F7]/30 rounded-lg overflow-hidden flex flex-col justify-between transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#A855F7]/10"
                                  >
                                    {/* Thumbnail Image display */}
                                    <div className="relative aspect-video overflow-hidden bg-black/40">
                                      <img 
                                        src={work.url} 
                                        alt={work.description}
                                        referrerPolicy="no-referrer"
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                      />
                                      {/* View/Eye Overlay */}
                                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <span className="bg-black/95 text-[8.5px] font-mono text-zinc-300 font-bold uppercase tracking-wider px-2 py-1 rounded border border-zinc-800 flex items-center gap-1">
                                          <Eye className="w-3 h-3 text-[#A855F7]" />
                                          <span>Inspect proof</span>
                                        </span>
                                      </div>
                                    </div>

                                    {/* Info Panel Summary */}
                                    <div className="p-2 space-y-1 bg-black/35 flex-grow flex flex-col justify-between">
                                      <p className="text-[10px] text-zinc-300 font-mono italic tracking-wide line-clamp-2 leading-relaxed text-left flex-grow">
                                        "{work.description}"
                                      </p>
                                      
                                      <div className="flex justify-between items-center pt-1 border-t border-zinc-900/60 text-[8.5px] font-mono text-zinc-500">
                                        <div className="flex items-center gap-1.5 truncate pr-2">
                                          <span className="w-1 h-1 rounded-full bg-[#A855F7]" />
                                          <span className="font-bold text-zinc-400 truncate">{work.submittedBy}</span>
                                        </div>
                                        {/* Direct Likes/Upvoting heart */}
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleLikeFinishedWork(printer.id, work.id);
                                          }}
                                          className="flex items-center gap-1 text-[#ef4444] hover:bg-[#ef4444]/15 hover:scale-105 transition-all text-[9.5px] px-1 py-0.5 rounded cursor-pointer shrink-0 border border-transparent hover:border-[#ef4444]/20"
                                        >
                                          <Heart className="w-2.5 h-2.5 fill-[#ef4444] text-[#ef4444]" />
                                          <span>{work.likes || 0}</span>
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ALLIANCE STAGING UI */}
                    {isExpanded && stagingAlliancePrinterId !== printer.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setStagingAlliancePrinterId(printer.id);
                        }}
                        className="w-full mt-2 font-mono text-[10px] font-bold uppercase tracking-widest bg-[#000000] text-[#A855F7] border border-[#262626] hover:border-[#A855F7] py-2 transition-colors cursor-pointer"
                      >
                        [ STAGE FOR ALLIANCE PRODUCTION ]
                      </button>
                    )}

                    {isExpanded && stagingAlliancePrinterId === printer.id && (
                      <div className="bg-[#000000] p-3 border border-[#A855F7]/40 space-y-3 mt-2">
                        <span className="text-[10px] font-mono text-[#A855F7] font-bold uppercase tracking-widest block border-b border-[#262626] pb-1">
                          Select Project Ledger
                        </span>
                        <select
                          className="w-full bg-[#000000] border border-[#262626] font-mono text-[10px] text-white p-2 outline-none focus:border-[#A855F7] cursor-pointer"
                          value={selectedAllianceId}
                          onChange={(e) => setSelectedAllianceId(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="">[ SELECT ALLIANCE PROJECT ]</option>
                          {alliances.map((a, aIdx) => (
                            <option key={`alliance-${printer.id}-${a.id}-${aIdx}`} value={a.id}>{a.project_name || a.id}</option>
                          ))}
                          {alliances.length === 0 && <option value="mock" disabled>No active alliances found locally</option>}
                        </select>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); setStagingAlliancePrinterId(null); }}
                            className="flex-1 bg-[#000000] text-zinc-500 border border-[#262626] font-mono text-[10px] uppercase font-bold py-2 cursor-pointer hover:text-white transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStageAlliance(printer);
                            }}
                            disabled={!selectedAllianceId && alliances.length > 0}
                            className={`flex-1 font-mono text-[10px] uppercase font-bold py-2 transition-colors cursor-pointer border ${selectedAllianceId || alliances.length === 0 ? 'bg-[#A855F7] text-black border-[#A855F7] hover:bg-[#b97bf8]' : 'bg-[#000000] border-[#262626] text-zinc-500'}`}
                          >
                            EXECUTE ROUTING
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Urgent reorder config and dispatch email modal popover overlay */}
      <AnimatePresence>
        {reorderItem && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setReorderItem(null);
                setSelectedPrinterForReorder(null);
              }}
              className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 animate-fade-in"
            />
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-[#0e1017] border-2 border-[#00ffcc]/60 w-full max-w-lg rounded-2xl overflow-hidden z-50 flex flex-col shadow-2xl mx-auto"
            >
              {/* Header */}
              <div className="bg-[#12141d] border-b border-zinc-800 px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-left">
                  <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                  <div>
                    <h3 className="text-sm font-black text-white font-mono uppercase tracking-wider">Configure Batch Re-Order Run</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">Formulate requisition package for: {reorderItem.name}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setReorderItem(null);
                    setSelectedPrinterForReorder(null);
                  }}
                  className="text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-lg p-1.5 transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4 text-left">
                {/* Visual statistics */}
                <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-3.5 rounded-xl border border-zinc-900 text-left">
                  <div className="space-y-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Current stock count</span>
                    <span className="text-sm font-bold text-red-400 font-mono">{reorderItem.table_stock + reorderItem.van_stock} pcs left</span>
                  </div>
                  <div className="space-y-1 border-l border-zinc-900 pl-3">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">Capacity Limit</span>
                    <span className="text-sm font-semibold text-zinc-400 font-mono">10% of {reorderItem.initial_batch_size || 100} run</span>
                  </div>
                </div>

                {/* Printer selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-left block">Select Merchandise Printer Supplier</label>
                  {printers.filter(p => !p.blacklisted).length === 0 ? (
                    <div className="bg-zinc-900/50 p-3 rounded-lg border border-zinc-800 text-center space-y-2">
                      <p className="text-[10px] font-mono text-zinc-500">No active printers configured. Register your first supplier contact.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setReorderItem(null);
                          setShowAddPrinterForm(true);
                        }}
                        className="bg-[#00ffcc]/15 text-[#00ffcc] border border-[#00ffcc]/30 py-1 px-3 rounded text-[9.5px] font-mono uppercase font-black hover:bg-[#00ffcc]/30 cursor-pointer"
                      >
                        Register Workshop Now
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedPrinterForReorder ? selectedPrinterForReorder.id : ''}
                      onChange={(e) => {
                        const ptr = printers.find(p => p.id === e.target.value);
                        setSelectedPrinterForReorder(ptr || null);
                      }}
                      className="w-full bg-[#12141d] border border-zinc-800 rounded p-2 text-sm text-zinc-200 font-mono focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc]"
                    >
                      {printers.filter(p => !p.blacklisted).map((p, pIdx) => (
                        <option key={`${p.id}-${pIdx}`} value={p.id} className="font-mono">
                          {p.company_name} ({p.name}) - {p.region}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Reorder volume */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-left block">Batch Volume (Pcs)</label>
                  <input
                    type="number"
                    min="5"
                    step="5"
                    value={reorderQuantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setReorderQuantity(val);
                      setReorderDraftNotes(`Hi! We are running low on the "${reorderItem.name}" standard apparel item. We currently only have ${reorderItem.table_stock + reorderItem.van_stock} units left. We want to place an urgent order of ${val} units. Let us know the estimate. Cheers!`);
                    }}
                    className="w-full bg-zinc-950 border border border-zinc-800 rounded p-2 text-sm text-white font-mono focus:border-[#00ffcc]"
                  />
                </div>

                {/* Auto Draft text box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-zinc-400 uppercase font-bold text-left block">Auto Drafted Email Body</label>
                  <textarea
                    rows={4}
                    value={reorderDraftNotes}
                    onChange={(e) => setReorderDraftNotes(e.target.value)}
                    className="w-full bg-zinc-950 border border border-zinc-800 rounded p-2.5 text-xs text-zinc-300 font-mono resize-y"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="bg-[#12141d] border-t border-zinc-800 px-5 py-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setReorderItem(null);
                    setSelectedPrinterForReorder(null);
                  }}
                  className="bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 text-zinc-400 font-mono text-[10px] uppercase font-bold px-4 py-2.5 rounded-lg cursor-pointer"
                >
                  Cancel Re-order
                </button>
                {selectedPrinterForReorder && (
                  <a
                    href={`mailto:${selectedPrinterForReorder.email}?subject=${encodeURIComponent(`Urgent Re-order Request: ${reorderItem.name}`)}&body=${encodeURIComponent(reorderDraftNotes)}`}
                    onClick={() => {
                      addLog(`Launched email dispatcher to reorder ${reorderQuantity}x "${reorderItem.name}" from ${selectedPrinterForReorder.company_name}.`);
                      triggerNotification(`Reorder email drafted to send to ${selectedPrinterForReorder.company_name}!`);
                      setReorderItem(null);
                      setSelectedPrinterForReorder(null);
                    }}
                    className="bg-[#00ffcc] text-black font-mono font-black text-[10px] uppercase tracking-wider px-5 py-2.5 rounded-lg text-center hover:bg-[#57ffd9] transition-colors cursor-pointer"
                  >
                    Open Mail App ✉
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Lightbox Modal for viewing crowd-sourced photos in detailed scale */}
      <AnimatePresence>
        {activeLightboxPhoto && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveLightboxPhoto(null)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 cursor-zoom-out"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              className="fixed inset-4 sm:inset-x-auto sm:inset-y-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 w-full max-w-4xl max-h-[90vh] bg-zinc-950 border border-zinc-850 rounded-2xl overflow-hidden z-50 flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header bar of lightbox */}
              <div className="bg-black/80 px-4 py-3 flex items-center justify-between border-b border-zinc-900 shrink-0">
                <div className="flex items-center gap-2 text-left">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#A855F7] animate-ping" />
                  <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                    Production Proof Verification Card
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveLightboxPhoto(null)}
                  className="text-zinc-500 hover:text-white hover:bg-zinc-900 border border-transparent hover:border-zinc-800 rounded-lg p-1.5 transition-all cursor-pointer text-xs font-mono font-bold"
                >
                  Close [ESC]
                </button>
              </div>

              {/* Heavy media container content */}
              <div className="flex-grow overflow-y-auto bg-black flex flex-col md:flex-row items-stretch select-none md:max-h-[60vh]">
                {/* Visual Showcase Side */}
                <div className="flex-grow bg-black/50 relative flex items-center justify-center min-h-[250px] md:min-h-[400px]">
                  <img 
                    src={activeLightboxPhoto.photo.url} 
                    alt={activeLightboxPhoto.photo.description}
                    referrerPolicy="no-referrer"
                    className="max-w-full max-h-[50vh] md:max-h-[58vh] object-contain" 
                  />
                </div>

                {/* Info and interaction panel side */}
                <div className="w-full md:w-80 bg-zinc-950 p-5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-zinc-900 text-left">
                  <div className="space-y-4">
                    {/* Contributor badge */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-zinc-500 block">Verified Provider</span>
                      <p className="text-sm font-bold text-white font-mono flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded bg-purple-500 shrink-0" />
                        {activeLightboxPhoto.photo.submittedBy}
                      </p>
                    </div>

                    {/* Timestamp log */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-[#A855F7] block">Proof Log Date</span>
                      <p className="text-[11px] text-zinc-300 font-mono">
                        {activeLightboxPhoto.photo.date || 'Live Session Proof'}
                      </p>
                    </div>

                    {/* Description memo */}
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono uppercase text-zinc-550 block">Auditor Specifications</span>
                      <p className="text-[11.5px] italic text-zinc-300 font-mono leading-relaxed bg-black/40 p-3 rounded border border-zinc-900">
                        "{activeLightboxPhoto.photo.description}"
                      </p>
                    </div>
                  </div>

                  {/* High Quality verification count + direct upvoting block */}
                  <div className="pt-4 border-t border-zinc-900 mt-4 md:mt-0 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-mono uppercase text-zinc-650 block">Legitimacy approvals</span>
                      <span className="text-xs font-mono font-bold text-zinc-400">
                        {activeLightboxPhoto.photo.likes || 0} tour managers vouched
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        handleLikeFinishedWork(activeLightboxPhoto.printerId, activeLightboxPhoto.photo.id);
                        // update locally displayed statistics
                        setActiveLightboxPhoto(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            photo: {
                              ...prev.photo,
                              likes: (prev.photo.likes || 0) + 1
                            }
                          };
                        });
                      }}
                      className="bg-red-500 hover:bg-red-600 active:scale-95 text-white font-mono font-black text-[9.5px] uppercase tracking-wider py-2 px-3.5 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white text-white" />
                      <span>Approve Proof</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
